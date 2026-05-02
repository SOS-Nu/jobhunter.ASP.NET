# JobHunter Migration Hand-off: Java Spring Boot to .NET 8

This document summarizes the current state of the migration, the patterns established, and the logic implemented to ensure **Absolute Functional Parity** between the original Java backend and the new .NET 8 Web API.

---

## 1. Project Architecture & Standards

### Core Mapping (Rosetta Stone)
| Java Spring Boot | .NET 8 Web API | Implementation Note |
| :--- | :--- | :--- |
| `@RestController` | `[ApiController]` | Controllers are kept thin; logic is in Services. |
| `JpaRepository` | `AppDbContext` | We use DbContext directly with LINQ. |
| `@Service` | `I{Name}Service` / `{Name}Service` | Registered as **Scoped** in `Program.cs`. |
| `@Entity` | EF Core Classes | Snake_case mapping in `AppDbContext.OnModelCreating`. |
| `MapStruct` | `AutoMapper` | Handled via `MappingProfile.cs`. |
| `@RestControllerAdvice` | `GlobalExceptionMiddleware` | Maps exceptions to unified `RestResponse` format. |
| `@Valid` | `FluentValidation` | Validators located in `/Validators` folder. |

### API Response Wrapper (RestResponse<T>)
Every response (Success or Error) is wrapped in a consistent JSON structure via `FormatRestResponseFilter`:
```json
{
  "statusCode": 200,
  "error": null,
  "message": "Success",
  "data": { ... }
}
```

---

## 2. Module Status (Java → .NET Parity)

### ✅ Fully Migrated Modules
| Module | Controller | Service | DTOs | Validators |
| :--- | :--- | :--- | :--- | :--- |
| Auth | ✅ `AuthController` | ✅ `AuthService` | ✅ | ✅ |
| User | ✅ `UserController` | ✅ `UserService` | ✅ | ✅ |
| Company | ✅ `CompanyController` | ✅ `CompanyService` | ✅ | ✅ |
| Job | ✅ `JobController` | ✅ `JobService` | ✅ | ✅ |
| Resume | ✅ `ResumeController` | ✅ `ResumeService` | ✅ | ✅ |
| Permission | ✅ `PermissionController` | ✅ `PermissionService` | ✅ | ✅ |
| Role | ✅ `RoleController` | ✅ `RoleService` | ✅ | ✅ |
| Subscriber | ✅ `SubscriberController` | ✅ `SubscriberService` | ✅ | - |
| File | ✅ `FileController` | ✅ `FileService` | ✅ | - |
| Email | ✅ `EmailController` | ✅ `EmailService` | ✅ | ✅ |
| Chat | ✅ `ChatController` | ✅ `ChatService` | ✅ | - |
| Comment | ✅ `CommentController` | ✅ `CommentService` | ✅ | ✅ |
| OnlineResume | ✅ `OnlineResumeController` | ✅ `OnlineResumeService` | ✅ | - |
| WorkExperience | ✅ `WorkExperienceController` | ✅ `WorkExperienceService` | ✅ | ✅ |
| Skill | ✅ `SkillController` | ✅ `SkillService` | ✅ | ✅ |
| Dashboard | ✅ `DashboardController` | ✅ `DashboardService` | ✅ | - |
| Payment (VNPay) | ✅ `PaymentController` | ✅ `PaymentService` | ✅ | ✅ |

---

## 3. Key Business Logic Migrated (Functional Parity)

### 👤 User & Session Management
- **BCrypt Hashing:** Sync'd with Java logic for login/register.
- **Session Pruning:** Implemented `EnforceSessionLimitAndKickOldestAsync` (Max 50 sessions). It deletes the oldest session if the limit is reached instead of rejecting login.
- **Security Timestamp:** `LastSecurityUpdateAt` is updated on password/role change to invalidate all current JWTs.

### 🏢 Company & Job Module
- **VIP Only Creation:** Only users with `IsVip = true` and a valid `VipExpiryDate` can create a company.
- **Applied Status:** `JobService` includes `IsApplied` flag in listings by checking the `Resumes` table for the current user.
- **Admin Visibility:** `SUPER_ADMIN` can see inactive jobs; normal users only see `Active = true`.

### 📄 Resume & CV Limits
- **Submission Quota:** Normal users = 10 CVs/month, VIP users = 20 CVs/month. Logic implemented in `ResumeService`.
- **File Sanitization:** `FileService` removes Vietnamese diacritics and replaces special characters with `-` to match Java's file naming convention.
- **Static Assets:** Mapped `/storage/**` to the physical `uploads/` folder to maintain frontend link compatibility.

### 🛡️ Permission System
- **Pattern:** `METHOD:/api/v1/path` (e.g., `GET:/api/v1/users`).
- **Authorization:** Custom `PermissionActionFilter` intercepts requests and checks the user's role permissions against the current route.

### 💼 WorkExperience Module (NEW)
- **CRUD:** Create, Update, Delete, GetMyExperiences — full parity with Java.
- **Ownership Verification:** Update/Delete check that the current user owns the work experience entry.
- **User Binding:** Automatically assigns the current logged-in user on create.

### 🔧 Skill Module (NEW)
- **CRUD + Bulk Create:** Create, BulkCreate, Update, Delete, GetAll with pagination.
- **Duplicate Detection:** Name uniqueness check on create/update.
- **Cascade Removal:** Delete properly removes skill from `job_skill` and `subscriber_skill` join tables.
- **Skill Names Cache:** `GetAllSkillNamesAsStringAsync()` for Gemini AI prompt building.

### 📊 Dashboard Module (NEW)
- **Stats Endpoint:** Returns totalUsers, totalCompanies, totalJobs, totalResumesApproved.
- **Matching Java:** Uses LINQ count queries equivalent to the Java native SQL query.

### 💳 Payment Module (VNPay) (NEW)
- **VNPay Integration:** Full HMAC-SHA512 hashing, payment URL creation with SortedDictionary (TreeMap equivalent).
- **Callback/IPN:** Verifies secure hash, saves PaymentHistory, activates VIP on success.
- **History CRUD:** GetByUser, GetAll (paginated), GetById, UpdateStatus.
- **Excel Export:** CSV-based export matching Java PaymentExportService.
- **VIP Activation:** Sets `IsVip=true`, `VipExpiryDate`, resets `CvSubmissionCount`.

### 💬 Comment Module (UPDATED)
- **Full Parity:** Create, Update, GetByCompany with pagination.
- **Ownership Check:** Only the comment author can edit.
- **Duplicate Prevention:** Users can only leave one review per company.

### 📋 OnlineResume Module (UPDATED)
- **DTO Pattern Enforced:** Controller now uses `ReqCreateOnlineResumeDTO` / `ReqUpdateOnlineResumeDTO` instead of raw entities.
- **Full Parity:** Create (one per user), Update (with skill sync), Delete (unlinks from user), GetMyResume.

---

## 4. Tech Stack & Dependencies
- **ORM:** Entity Framework Core (SQL Server).
- **Mapping:** AutoMapper (using `.ProjectTo<T>()` to avoid N+1 queries).
- **Validation:** FluentValidation.AspNetCore.
- **Logging:** Serilog.
- **AI:** Gemini API (currently a placeholder in `ResumeService`, needs real scoring logic).

---

## 5. Pending / Next Steps
1. **Gemini AI Implementation:** Complete the actual prompt engineering and API call in `ResumeService.CreateAsync` to score CVs based on Job Description.
2. **Background Jobs:** Move `BackgroundWorkerService` logic to **Hangfire** if complex scheduling (cron) is required for monthly CV reset.
3. **Real-time Chat (SignalR):** Implement SignalR Hub to replace Java WebSocket/STOMP for real-time chat and notifications.
4. **Word Report Export:** Add Apache POI equivalent (DocumentFormat.OpenXml or NPOI) for monthly/yearly Word report generation.
5. **Unit Testing:** Implement XUnit tests for the `ResumeService` quota logic as it is critical for monetization.

---

## 6. Coding Principles to Maintain
- **Zero N+1 Queries:** Always use `Include()` or AutoMapper projections. Never let EF Core run a query inside a loop.
- **DTO Only:** Never return Entities. Use Response DTOs.
- **Functional Parity:** If the Java code has a weird validation, keep it. Don't simplify the business requirements.
