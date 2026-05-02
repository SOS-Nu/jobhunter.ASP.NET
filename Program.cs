using Microsoft.EntityFrameworkCore;
using jobhunter.ASP.NET.Configuration;
using jobhunter.ASP.NET.Data;
using jobhunter.ASP.NET.Filters;
using jobhunter.ASP.NET.Middleware;
using jobhunter.ASP.NET.Services;
using FluentValidation;
using FluentValidation.AspNetCore;
using Serilog;
using System.Text.Json.Serialization;
using AutoMapper;
using Microsoft.Extensions.FileProviders;

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
        // agents.md rule 2: Global ResultFilter to wrap all responses into RestResponse<T>
        options.Filters.Add<FormatRestResponseFilter>();
    })
    .AddJsonOptions(options =>
    {
        // camelCase for JSON output (matching Spring Boot Jackson default)
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        // Store enums as string (agents.md rule 10)
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        //options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
        // Prevent circular reference exceptions (safety net)
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });

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
    builder.Services.AddScoped<ISubscriberService, SubscriberService>();
    builder.Services.AddScoped<IOnlineResumeService, OnlineResumeService>();
    builder.Services.AddScoped<IPermissionService, PermissionService>();
    builder.Services.AddScoped<IRoleService, RoleService>();

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
        RequestPath = "/storage"
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
        await jobhunter.ASP.NET.Data.DataSeeder.InitializeAsync(services);
    }

    Log.Information("Starting jobhunter.ASP.NET application...");
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
