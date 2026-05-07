using Microsoft.EntityFrameworkCore;
using JobZone.ASP.NET.Entities;
using JobZone.ASP.NET.Services;

namespace JobZone.ASP.NET.Data
{
    /// <summary>
    /// AppDbContext - Central data access layer.
    /// Maps from: JpaRepository pattern in Spring Boot.
    /// Rules from agents.md:
    ///   - Use DbContext directly (Repository is optional)
    ///   - Soft Delete via Global Query Filter (is_deleted)
    ///   - Store enums as string in database
    ///   - Avoid lazy loading
    /// </summary>
    public class AppDbContext : DbContext
    {
        private readonly ICurrentUserService _currentUserService;

        public AppDbContext(DbContextOptions<AppDbContext> options, ICurrentUserService currentUserService)
            : base(options)
        {
            _currentUserService = currentUserService;
        }

        // DbSets
        public DbSet<User> Users => Set<User>();
        public DbSet<Company> Companies => Set<Company>();
        public DbSet<Job> Jobs => Set<Job>();
        public DbSet<Skill> Skills => Set<Skill>();
        public DbSet<Role> Roles => Set<Role>();
        public DbSet<Permission> Permissions => Set<Permission>();
        public DbSet<Resume> Resumes => Set<Resume>();
        public DbSet<Subscriber> Subscribers => Set<Subscriber>();
        public DbSet<Comment> Comments => Set<Comment>();
        public DbSet<OnlineResume> OnlineResumes => Set<OnlineResume>();
        public DbSet<WorkExperience> WorkExperiences => Set<WorkExperience>();
        public DbSet<UserSession> UserSessions => Set<UserSession>();
        public DbSet<PaymentHistory> PaymentHistories => Set<PaymentHistory>();
        public DbSet<Otp> Otps => Set<Otp>();
        public DbSet<ChatRoom> ChatRooms => Set<ChatRoom>();
        public DbSet<ChatMessage> ChatMessages => Set<ChatMessage>();
        public DbSet<UserSaveJob> UserSaveJobs => Set<UserSaveJob>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            
            // ========================
            // DATETIME UTC CONVERSION (Parity with Java Instant)
            // ========================
            var dateTimeConverter = new Microsoft.EntityFrameworkCore.Storage.ValueConversion.ValueConverter<DateTime, DateTime>(
                v => v.Kind == DateTimeKind.Utc ? v : v.ToUniversalTime(),
                v => DateTime.SpecifyKind(v, DateTimeKind.Utc));

            var nullableDateTimeConverter = new Microsoft.EntityFrameworkCore.Storage.ValueConversion.ValueConverter<DateTime?, DateTime?>(
                v => v.HasValue ? (v.Value.Kind == DateTimeKind.Utc ? v.Value : v.Value.ToUniversalTime()) : v,
                v => v.HasValue ? DateTime.SpecifyKind(v.Value, DateTimeKind.Utc) : v);

            foreach (var entityType in modelBuilder.Model.GetEntityTypes())
            {
                foreach (var property in entityType.GetProperties())
                {
                    if (property.ClrType == typeof(DateTime))
                    {
                        property.SetValueConverter(dateTimeConverter);
                    }
                    else if (property.ClrType == typeof(DateTime?))
                    {
                        property.SetValueConverter(nullableDateTimeConverter);
                    }
                }
            }

            // ========================
            // SOFT DELETE GLOBAL QUERY FILTER (agents.md rule 9)
            // ========================
            modelBuilder.Entity<Company>().HasQueryFilter(e => !e.IsDeleted);

            // ========================
            // ENUM AS STRING (agents.md rule 10)
            // ========================
            modelBuilder.Entity<User>()
                .Property(e => e.Gender)
                .HasConversion<string>();

            modelBuilder.Entity<User>()
                .Property(e => e.Status)
                .HasConversion<string>();

            modelBuilder.Entity<Job>()
                .Property(e => e.Level)
                .HasConversion<string>();

            modelBuilder.Entity<Resume>()
                .Property(e => e.Status)
                .HasConversion<string>();

            modelBuilder.Entity<PaymentHistory>()
                .Property(e => e.Status)
                .HasConversion<string>();

            // ========================
            // INDEXES (matching Spring Boot @Index annotations)
            // ========================
            modelBuilder.Entity<User>()
                .HasIndex(e => e.Email)
                .IsUnique()
                .HasDatabaseName("idx_user_email");

            modelBuilder.Entity<Job>()
                .HasIndex(e => e.CompanyId)
                .HasDatabaseName("idx_job_company");

            modelBuilder.Entity<Job>()
                .HasIndex(e => e.Active)
                .HasDatabaseName("idx_job_active");

            modelBuilder.Entity<Job>()
                .HasIndex(e => new { e.CompanyId, e.Active })
                .HasDatabaseName("idx_job_company_active");

            modelBuilder.Entity<Resume>()
                .HasIndex(e => new { e.UserId, e.JobId })
                .HasDatabaseName("idx_resume_user_job");

            modelBuilder.Entity<UserSession>()
                .HasIndex(e => e.RefreshTokenJti)
                .IsUnique();

            // ========================
            // MANY-TO-MANY RELATIONSHIPS (explicit join tables matching Spring Boot)
            // ========================

            // Role <-> Permission through permission_role
            modelBuilder.Entity<Role>()
                .HasMany(r => r.Permissions)
                .WithMany(p => p.Roles)
                .UsingEntity(j => j.ToTable("permission_role"));

            // Job <-> Skill through job_skill
            modelBuilder.Entity<Job>()
                .HasMany(j => j.Skills)
                .WithMany(s => s.Jobs)
                .UsingEntity(j => j.ToTable("job_skill"));

            // Subscriber <-> Skill through subscriber_skill
            modelBuilder.Entity<Subscriber>()
                .HasMany(s => s.Skills)
                .WithMany(sk => sk.Subscribers)
                .UsingEntity(j => j.ToTable("subscriber_skill"));

            // OnlineResume <-> Skill through online_resumes_skills
            modelBuilder.Entity<OnlineResume>()
                .HasMany(or => or.Skills)
                .WithMany()
                .UsingEntity(j => j.ToTable("online_resumes_skills"));

            // ========================
            // ONE-TO-MANY RELATIONSHIPS
            // ========================

            // Company -> Users
            modelBuilder.Entity<User>()
                .HasOne(u => u.Company)
                .WithMany(c => c.Users)
                .HasForeignKey(u => u.CompanyId)
                .OnDelete(DeleteBehavior.SetNull);

            // Role -> Users
            modelBuilder.Entity<User>()
                .HasOne(u => u.Role)
                .WithMany(r => r.Users)
                .HasForeignKey(u => u.RoleId)
                .OnDelete(DeleteBehavior.SetNull);

            // User -> Resumes
            modelBuilder.Entity<Resume>()
                .HasOne(r => r.User)
                .WithMany(u => u.Resumes)
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Job -> Resumes
            modelBuilder.Entity<Resume>()
                .HasOne(r => r.Job)
                .WithMany(j => j.Resumes)
                .HasForeignKey(r => r.JobId)
                .OnDelete(DeleteBehavior.Cascade);

            // Company -> Jobs
            modelBuilder.Entity<Job>()
                .HasOne(j => j.Company)
                .WithMany(c => c.Jobs)
                .HasForeignKey(j => j.CompanyId)
                .OnDelete(DeleteBehavior.SetNull);

            // User -> UserSession
            modelBuilder.Entity<UserSession>()
                .HasOne(s => s.User)
                .WithMany(u => u.Sessions)
                .HasForeignKey(s => s.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // User -> PaymentHistory
            modelBuilder.Entity<PaymentHistory>()
                .HasOne(p => p.User)
                .WithMany(u => u.PaymentHistories)
                .HasForeignKey(p => p.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // User -> WorkExperience
            modelBuilder.Entity<WorkExperience>()
                .HasOne(w => w.User)
                .WithMany(u => u.WorkExperiences)
                .HasForeignKey(w => w.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // ========================
            // ONE-TO-ONE: User <-> OnlineResume
            // ========================
            modelBuilder.Entity<User>()
                .HasOne(u => u.OnlineResume)
                .WithOne(or => or.User)
                .HasForeignKey<User>(u => u.OnlineResumeId)
                .OnDelete(DeleteBehavior.SetNull);

            // ========================
            // CHAT RELATIONSHIPS (Restrict delete to prevent cascade conflicts)
            // ========================
            modelBuilder.Entity<ChatRoom>()
                .HasOne(cr => cr.Sender)
                .WithMany()
                .HasForeignKey(cr => cr.SenderId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ChatRoom>()
                .HasOne(cr => cr.Receiver)
                .WithMany()
                .HasForeignKey(cr => cr.ReceiverId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ChatMessage>()
                .HasOne(cm => cm.Sender)
                .WithMany()
                .HasForeignKey(cm => cm.SenderId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ChatMessage>()
                .HasOne(cm => cm.Receiver)
                .WithMany()
                .HasForeignKey(cm => cm.ReceiverId)
                .OnDelete(DeleteBehavior.Restrict);

            // ========================
            // USER SAVE JOB RELATIONSHIPS
            // ========================
            modelBuilder.Entity<UserSaveJob>()
                .HasOne(usj => usj.User)
                .WithMany(u => u.SavedJobs)
                .HasForeignKey(usj => usj.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<UserSaveJob>()
                .HasOne(usj => usj.Job)
                .WithMany()
                .HasForeignKey(usj => usj.JobId)
                .OnDelete(DeleteBehavior.Cascade);
        }

        /// <summary>
        /// Override SaveChanges to auto-fill audit fields (CreatedAt, UpdatedAt, CreatedBy, UpdatedBy)
        /// This replaces Spring Boot's @PrePersist / @PreUpdate lifecycle hooks.
        /// All DateTime values use UTC (agents.md rule 10).
        /// </summary>
        public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            ApplyAuditInfo();
            return await base.SaveChangesAsync(cancellationToken);
        }

        public override int SaveChanges()
        {
            ApplyAuditInfo();
            return base.SaveChanges();
        }

        private void ApplyAuditInfo()
        {
            var currentUser = _currentUserService.GetCurrentUserEmail() ?? "";
            var utcNow = DateTime.UtcNow;

            foreach (var entry in ChangeTracker.Entries())
            {
                if (entry.State == EntityState.Added)
                {
                    SetPropertyIfExists(entry, "CreatedAt", utcNow);
                    SetPropertyIfExists(entry, "CreatedBy", currentUser);
                }

                if (entry.State == EntityState.Modified)
                {
                    SetPropertyIfExists(entry, "UpdatedAt", utcNow);
                    SetPropertyIfExists(entry, "UpdatedBy", currentUser);
                }
            }
        }

        private static void SetPropertyIfExists(Microsoft.EntityFrameworkCore.ChangeTracking.EntityEntry entry, string propertyName, object value)
        {
            var property = entry.Entity.GetType().GetProperty(propertyName);
            if (property != null && property.CanWrite)
            {
                property.SetValue(entry.Entity, value);
            }
        }
    }
}
