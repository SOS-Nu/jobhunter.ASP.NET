using Microsoft.EntityFrameworkCore;
using JobZone.ASP.NET.Configuration;
using JobZone.ASP.NET.Data;
using JobZone.ASP.NET.Filters;
using JobZone.ASP.NET.Middleware;
using JobZone.ASP.NET.Services;
using FluentValidation;
using FluentValidation.AspNetCore;
using Serilog;
using System.Text.Json.Serialization;
using System.Text.Json;
using AutoMapper;
using Microsoft.Extensions.FileProviders;
using Sieve.Services;

// ========================
// SERILOG BOOTSTRAP (agents.md: Logging: Serilog)
// ========================
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);

    // ========================
    // SERILOG
    // ========================
    builder.Host.UseSerilog((context, services, configuration) => configuration
        .ReadFrom.Configuration(context.Configuration)
        .WriteTo.Console());

    // ========================
    // CONTROLLERS + JSON OPTIONS
    // ========================
    builder.Services.AddControllers(options =>
    {
        // Custom validation filter (replaces suppressed Data Annotations validation)
        options.Filters.Add<ValidateModelFilter>();
        // agents.md rule 2: Global ResultFilter to wrap all responses into RestResponse<T>
        options.Filters.Add<FormatRestResponseFilter>();
    })
    .AddJsonOptions(options =>
    {
        // camelCase for JSON output (matching Spring Boot Jackson default)
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping;
        // Store enums as string (agents.md rule 10)
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        //options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
        // Prevent circular reference exceptions (safety net)
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        // Accept number strings for ID fields (frontend sends "1" for company.id)
        options.JsonSerializerOptions.NumberHandling = System.Text.Json.Serialization.JsonNumberHandling.AllowReadingFromString;
        // Force ISO 8601 UTC format for DateTime (matching Spring Boot JacksonConfig)
        options.JsonSerializerOptions.Converters.Add(new UtcDateTimeConverter());
        options.JsonSerializerOptions.Converters.Add(new UtcNullableDateTimeConverter());
    });



    // CRITICAL: Suppress Data Annotations auto-validation on model binding.
    // In Java Spring Boot, @NotBlank/@NotNull on entities only fires when @Valid is 
    // explicitly placed on the controller parameter. ASP.NET Core fires [Required]
    // attributes automatically for ALL model-bound types including nested navigation 
    // properties (e.g., Job.Skills[0].Name triggers Skill's [Required] Name).
    // This caused false validation errors breaking frontend compatibility.
    // FluentValidation handles all explicit DTO validation instead.
    builder.Services.Configure<Microsoft.AspNetCore.Mvc.ApiBehaviorOptions>(options =>
    {
        options.SuppressModelStateInvalidFilter = true;
    });

    builder.Services.AddSignalR();
    builder.Services.AddSingleton<Microsoft.AspNetCore.SignalR.IUserIdProvider, JobZone.ASP.NET.Hubs.EmailUserIdProvider>();

    // ========================
    // SWAGGER / OPENAPI
    // ========================
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen();

    // ========================
    // DATABASE - EF Core + MySQL (agents.md rule 9)
    // ========================
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseSqlServer(connectionString));

    // ========================
    // AUTHENTICATION - JWT Bearer (agents.md rule 4)
    // ========================
    builder.Services.AddJwtAuthentication(builder.Configuration);

    // ========================
    // AUTHORIZATION
    // ========================
    builder.Services.AddAuthorization();

    // ========================
    // CORS (matching Spring Boot CorsConfig)
    // ========================
    builder.Services.AddCorsConfiguration(builder.Configuration);

    // ========================
    // DEPENDENCY INJECTION (agents.md rule 5)
    // ========================
    builder.Services.AddHttpContextAccessor();

    // Services: Scoped (agents.md rule 5)
    builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
    builder.Services.AddScoped<IAuthService, AuthService>();
    builder.Services.AddScoped<IUserService, UserService>();
    builder.Services.AddScoped<ICompanyService, CompanyService>();
    builder.Services.AddScoped<IJobService, JobService>();
    builder.Services.AddScoped<IResumeService, ResumeService>();
    builder.Services.AddScoped<ICommentService, CommentService>();
    builder.Services.AddScoped<IChatService, ChatService>();
    builder.Services.AddScoped<IFileService, FileService>();
    builder.Services.AddScoped<IEmailService, EmailService>();
    builder.Services.AddScoped<IOtpService, OtpService>();
    builder.Services.AddScoped<ISubscriberService, SubscriberService>();
    builder.Services.AddScoped<IOnlineResumeService, OnlineResumeService>();
    builder.Services.AddScoped<IPermissionService, PermissionService>();
    builder.Services.AddScoped<IRoleService, RoleService>();
    builder.Services.AddScoped<IWorkExperienceService, WorkExperienceService>();
    builder.Services.AddScoped<ISkillService, SkillService>();
    builder.Services.AddScoped<IDashboardService, DashboardService>();
    builder.Services.AddScoped<IPaymentService, PaymentService>();
    builder.Services.AddScoped<IUserSaveJobService, UserSaveJobService>();
    builder.Services.AddScoped<IGeminiService, GeminiService>();
    builder.Services.AddHttpClient();
    builder.Services.Configure<Sieve.Models.SieveOptions>(options =>
    {
        options.DefaultPageSize = 10;
        options.MaxPageSize = 100;
        options.ThrowExceptions = false; // silently ignore unmapped properties
    });
    builder.Services.AddScoped<ISieveProcessor, ApplicationSieveProcessor>();

    builder.Services.AddHostedService<BackgroundWorkerService>();

    // ========================
    // FLUENT VALIDATION (agents.md rule 6)
    // ========================
    builder.Services.AddFluentValidationAutoValidation();
    builder.Services.AddValidatorsFromAssemblyContaining<Program>();

    // ========================
    // AUTOMAPPER (replaces Mapster - registered from assembly profiles)
    // ========================
    builder.Services.AddAutoMapper(typeof(Program));

    var app = builder.Build();

    // ========================
    // MIDDLEWARE PIPELINE
    // ========================

    // Global Exception Middleware (agents.md rule 8) - MUST be first
    app.UseMiddleware<GlobalExceptionMiddleware>();

    // Swagger
    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI();
    }

    // Static Files (Parity with Java: StaticResourcesWebConfiguration)
    // Maps /storage/** to the physical upload directory
    var uploadPath = builder.Configuration["FileUpload:BaseUri"] ?? "uploads/";
    if (!Path.IsPathRooted(uploadPath))
    {
        uploadPath = Path.Combine(builder.Environment.ContentRootPath, uploadPath);
    }
    
    if (!Directory.Exists(uploadPath))
    {
        Directory.CreateDirectory(uploadPath);
    }

    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = new PhysicalFileProvider(uploadPath),
        RequestPath = "/storage",
        OnPrepareResponse = ctx =>
        {
            ctx.Context.Response.Headers.Append("Access-Control-Allow-Origin", "*");
            ctx.Context.Response.Headers.Append("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        }
    });

    // CORS
    app.UseCors(CorsConfiguration.PolicyName);

    // Authentication & Authorization
    app.UseAuthentication();
    app.UseAuthorization();

    // Serilog request logging
    app.UseSerilogRequestLogging();

    // Map controllers
    app.MapControllers();

    // Tự động tạo bảng và insert dữ liệu (Tương đương ddl-auto=update)
    using (var scope = app.Services.CreateScope())
    {
        var services = scope.ServiceProvider;
        await JobZone.ASP.NET.Data.DataSeeder.InitializeAsync(services);
    }

    Log.Information("Starting JobZone.ASP.NET application...");
    app.MapHub<JobZone.ASP.NET.Hubs.ChatHub>("/ws");

app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}

// ========================
// JSON CONVERTERS (Matching Spring Boot JacksonConfig)
// ========================
public class UtcDateTimeConverter : JsonConverter<DateTime>
{
    private const string Format = "yyyy-MM-ddTHH:mm:ss.fffZ";

    public override DateTime Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var date = reader.GetDateTime();
        return date.Kind == DateTimeKind.Unspecified ? DateTime.SpecifyKind(date, DateTimeKind.Utc) : date.ToUniversalTime();
    }

    public override void Write(Utf8JsonWriter writer, DateTime value, JsonSerializerOptions options)
    {
        writer.WriteStringValue(value.ToUniversalTime().ToString(Format));
    }
}

public class UtcNullableDateTimeConverter : JsonConverter<DateTime?>
{
    private const string Format = "yyyy-MM-ddTHH:mm:ss.fffZ";

    public override DateTime? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Null) return null;
        var date = reader.GetDateTime();
        return date.Kind == DateTimeKind.Unspecified ? DateTime.SpecifyKind(date, DateTimeKind.Utc) : date.ToUniversalTime();
    }

    public override void Write(Utf8JsonWriter writer, DateTime? value, JsonSerializerOptions options)
    {
        if (value.HasValue)
            writer.WriteStringValue(value.Value.ToUniversalTime().ToString(Format));
        else
            writer.WriteNullValue();
    }
}
