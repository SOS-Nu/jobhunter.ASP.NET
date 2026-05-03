using JobZone.ASP.NET.Entities;
using JobZone.ASP.NET.Enums;
using Microsoft.EntityFrameworkCore;
using BCryptNet = BCrypt.Net.BCrypt;

namespace JobZone.ASP.NET.Data
{
    public static class DataSeeder
    {
        public static async Task InitializeAsync(IServiceProvider serviceProvider)
        {
            using var scope = serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var logger = scope.ServiceProvider.GetRequiredService<ILogger<AppDbContext>>();

            try
            {
                // Auto migrate
                await context.Database.MigrateAsync();
                logger.LogInformation("Database migrated successfully.");

                long countPermissions = await context.Permissions.CountAsync();
                long countRoles = await context.Roles.CountAsync();
                long countUsers = await context.Users.CountAsync();

                if (countPermissions == 0)
                {
                    var arr = new List<Permission>
                    {
                        new Permission { Name = "Create a company", ApiPath = "/api/v1/companies", Method = "POST", Module = "COMPANIES" },
                        new Permission { Name = "Update a company", ApiPath = "/api/v1/companies", Method = "PUT", Module = "COMPANIES" },
                        new Permission { Name = "Delete a company", ApiPath = "/api/v1/companies/{id}", Method = "DELETE", Module = "COMPANIES" },
                        new Permission { Name = "Get a company by id", ApiPath = "/api/v1/companies/{id}", Method = "GET", Module = "COMPANIES" },
                        new Permission { Name = "Get companies with pagination", ApiPath = "/api/v1/companies", Method = "GET", Module = "COMPANIES" },
                        new Permission { Name = "Create company by user", ApiPath = "/api/v1/companies/by-user", Method = "POST", Module = "COMPANIES" },
                        
                        new Permission { Name = "Create a job", ApiPath = "/api/v1/jobs", Method = "POST", Module = "JOBS" },
                        new Permission { Name = "Create bulk jobs", ApiPath = "/api/v1/jobs/bulk-create", Method = "POST", Module = "JOBS" },
                        new Permission { Name = "Update a job", ApiPath = "/api/v1/jobs", Method = "PUT", Module = "JOBS" },
                        new Permission { Name = "Delete a job", ApiPath = "/api/v1/jobs/{id}", Method = "DELETE", Module = "JOBS" },
                        new Permission { Name = "Get a job by id", ApiPath = "/api/v1/jobs/{id}", Method = "GET", Module = "JOBS" },
                        new Permission { Name = "Get jobs with pagination", ApiPath = "/api/v1/jobs", Method = "GET", Module = "JOBS" },

                        new Permission { Name = "Create a permission", ApiPath = "/api/v1/permissions", Method = "POST", Module = "PERMISSIONS" },
                        new Permission { Name = "Update a permission", ApiPath = "/api/v1/permissions", Method = "PUT", Module = "PERMISSIONS" },
                        new Permission { Name = "Delete a permission", ApiPath = "/api/v1/permissions/{id}", Method = "DELETE", Module = "PERMISSIONS" },
                        new Permission { Name = "Get a permission by id", ApiPath = "/api/v1/permissions/{id}", Method = "GET", Module = "PERMISSIONS" },
                        new Permission { Name = "Get permissions with pagination", ApiPath = "/api/v1/permissions", Method = "GET", Module = "PERMISSIONS" },

                        new Permission { Name = "Create a resume", ApiPath = "/api/v1/resumes", Method = "POST", Module = "RESUMES" },
                        new Permission { Name = "Update a resume", ApiPath = "/api/v1/resumes", Method = "PUT", Module = "RESUMES" },
                        new Permission { Name = "Delete a resume", ApiPath = "/api/v1/resumes/{id}", Method = "DELETE", Module = "RESUMES" },
                        new Permission { Name = "Get a resume by id", ApiPath = "/api/v1/resumes/{id}", Method = "GET", Module = "RESUMES" },
                        new Permission { Name = "Get resumes with pagination", ApiPath = "/api/v1/resumes", Method = "GET", Module = "RESUMES" },

                        new Permission { Name = "Create a role", ApiPath = "/api/v1/roles", Method = "POST", Module = "ROLES" },
                        new Permission { Name = "Update a role", ApiPath = "/api/v1/roles", Method = "PUT", Module = "ROLES" },
                        new Permission { Name = "Delete a role", ApiPath = "/api/v1/roles/{id}", Method = "DELETE", Module = "ROLES" },
                        new Permission { Name = "Get a role by id", ApiPath = "/api/v1/roles/{id}", Method = "GET", Module = "ROLES" },
                        new Permission { Name = "Get roles with pagination", ApiPath = "/api/v1/roles", Method = "GET", Module = "ROLES" },

                        new Permission { Name = "Create a user", ApiPath = "/api/v1/users", Method = "POST", Module = "USERS" },
                        new Permission { Name = "Create bulk user", ApiPath = "/api/v1/users/bulk-create", Method = "POST", Module = "USERS" },
                        new Permission { Name = "Update a user", ApiPath = "/api/v1/users", Method = "PUT", Module = "USERS" },
                        new Permission { Name = "Delete a user", ApiPath = "/api/v1/users/{id}", Method = "DELETE", Module = "USERS" },
                        new Permission { Name = "Get a user by id", ApiPath = "/api/v1/users/{id}", Method = "GET", Module = "USERS" },
                        new Permission { Name = "Get users with pagination", ApiPath = "/api/v1/users", Method = "GET", Module = "USERS" },

                        new Permission { Name = "Create a subscriber", ApiPath = "/api/v1/subscribers", Method = "POST", Module = "SUBSCRIBERS" },
                        new Permission { Name = "Update a subscriber", ApiPath = "/api/v1/subscribers", Method = "PUT", Module = "SUBSCRIBERS" },
                        new Permission { Name = "Delete a subscriber", ApiPath = "/api/v1/subscribers/{id}", Method = "DELETE", Module = "SUBSCRIBERS" },
                        new Permission { Name = "Get a subscriber by id", ApiPath = "/api/v1/subscribers/{id}", Method = "GET", Module = "SUBSCRIBERS" },
                        new Permission { Name = "Get subscribers with pagination", ApiPath = "/api/v1/subscribers", Method = "GET", Module = "SUBSCRIBERS" },

                        new Permission { Name = "Update Success Payment", ApiPath = "/api/v1/payment/allhistory", Method = "PUT", Module = "PAYMENT" },
                        new Permission { Name = "Export excel Payment", ApiPath = "/api/v1/payment/export/excel", Method = "GET", Module = "PAYMENT" },
                        new Permission { Name = "export word month Payment", ApiPath = "/api/v1/payment/export/monthly-report", Method = "GET", Module = "PAYMENT" },
                        new Permission { Name = "export word year Payment", ApiPath = "/api/v1/payment/export/yearly-report", Method = "GET", Module = "PAYMENT" },
                        new Permission { Name = "Get payment by id", ApiPath = "/api/v1/payment/allhistory/{id}", Method = "GET", Module = "PAYMENT" },
                        new Permission { Name = "Get payment with pagination", ApiPath = "/api/v1/payment/allhistory", Method = "GET", Module = "PAYMENT" },

                        new Permission { Name = "Download a file", ApiPath = "/api/v1/files", Method = "POST", Module = "FILES" },
                        new Permission { Name = "Upload a file", ApiPath = "/api/v1/files", Method = "GET", Module = "FILES" },

                        new Permission { Name = "get candidate users for recruiter", ApiPath = "/api/v1/gemini/candidate", Method = "POST", Module = "SearchUsersAI" },
                        new Permission { Name = "mock interview by user", ApiPath = "/api/v1/gemini/mock-interview", Method = "POST", Module = "GeminiMockInterview" },
                        new Permission { Name = "evaluate-interview by user", ApiPath = "/api/v1/gemini/evaluate-interview", Method = "POST", Module = "GeminiMockInterview" },
                        new Permission { Name = "evaluate company by user", ApiPath = "/api/v1/gemini/evaluate-company/{id}", Method = "POST", Module = "GeminiEvaluateCompany" }
                    };

                    context.Permissions.AddRange(arr);
                    await context.SaveChangesAsync();
                    logger.LogInformation(">>> SEEDED PERMISSIONS SUCCESS!");
                }

                if (countRoles == 0)
                {
                    var allPermissions = await context.Permissions.ToListAsync();

                    var adminRole = new Role
                    {
                        Name = "SUPER_ADMIN",
                        Description = "Admin thì full permissions",
                        Active = true
                    };
                    foreach (var p in allPermissions) adminRole.Permissions.Add(p);
                    context.Roles.Add(adminRole);

                    var employerRole = new Role
                    {
                        Name = "EMPLOYER",
                        Description = "Nhà tuyển dụng quản lý công ty của mình",
                        Active = true
                    };
                    var employerPerms = allPermissions.Where(p => new[] {
                            "Create company by user", "Create a job", "Update a job", "Delete a job", "Get a job by id", "Get jobs with pagination"
                        }.Contains(p.Name)).ToList();
                    foreach (var p in employerPerms) employerRole.Permissions.Add(p);
                    context.Roles.Add(employerRole);

                    var userRole = new Role
                    {
                        Name = "USER",
                        Description = "user default",
                        Active = true
                    };
                    context.Roles.Add(userRole);

                    var userVipRole = new Role
                    {
                        Name = "USER_VIP",
                        Description = "user Vip",
                        Active = true
                    };
                    context.Roles.Add(userVipRole);

                    await context.SaveChangesAsync();
                    logger.LogInformation(">>> SEEDED ROLES SUCCESS!");
                }
                else 
                {
                    // Fix: If roles exist but permission_role is empty, populate it.
                    var adminRole = await context.Roles.Include(r => r.Permissions).FirstOrDefaultAsync(r => r.Name == "SUPER_ADMIN");
                    if (adminRole != null && !adminRole.Permissions.Any())
                    {
                        var allPermissions = await context.Permissions.ToListAsync();
                        foreach (var p in allPermissions) adminRole.Permissions.Add(p);
                        
                        var employerRole = await context.Roles.Include(r => r.Permissions).FirstOrDefaultAsync(r => r.Name == "EMPLOYER");
                        if (employerRole != null)
                        {
                            var employerPerms = allPermissions.Where(p => new[] {
                                "Create company by user", "Create a job", "Update a job", "Delete a job", "Get a job by id", "Get jobs with pagination"
                            }.Contains(p.Name)).ToList();
                            foreach (var p in employerPerms) employerRole.Permissions.Add(p);
                        }
                        
                        await context.SaveChangesAsync();
                        logger.LogInformation(">>> FIXED MISSING PERMISSION_ROLE LINKS SUCCESS!");
                    }
                }

                if (countUsers == 0)
                {
                    var adminRole = await context.Roles.FirstOrDefaultAsync(r => r.Name == "SUPER_ADMIN");
                    
                    var adminUser = new User
                    {
                        Name = "I'm super admin",
                        Email = "admin@gmail.com",
                        Password = BCryptNet.HashPassword("123456"),
                        Age = 25,
                        Gender = GenderEnum.MALE,
                        Address = "hn",
                        RoleId = adminRole?.Id,
                        Status = UserStatusEnum.OFFLINE,
                        CreatedAt = DateTime.UtcNow
                    };

                    context.Users.Add(adminUser);
                    await context.SaveChangesAsync();
                    logger.LogInformation(">>> SEEDED USERS SUCCESS!");
                }

                if (countPermissions > 0 && countRoles > 0 && countUsers > 0)
                {
                    logger.LogInformation(">>> SKIP INIT DATABASE ~ ALREADY HAVE DATA...");
                }
                else
                {
                    logger.LogInformation(">>> END INIT DATABASE");
                }
            }
            catch (Exception ex)
            {
                logger.LogError(ex, ">>> FAILED TO INIT DATABASE");
            }
        }
    }
}
