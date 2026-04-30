# AGENTS.md

## 1. Project Overview

This project is a migration from a Spring Boot application to a .NET 8 Web API.

The goal is to:

* Preserve business logic and data flow
* Maintain consistent API response structure
* Replicate security and permission behavior from Spring

### Tech Stack

* Runtime: .NET 8
* Framework: ASP.NET Core Web API
* ORM: Entity Framework Core (EF Core)
* Database: MySQL
* Authentication: JWT Bearer
* Authorization: Policy-based + Custom Permission Handler
* Validation: FluentValidation
* Object Mapping: Mapster
* Logging: Serilog
* AI Integration: Google Gemini API (via HTTP)

---

## 2. Standard API Response (CRITICAL)

All API responses MUST follow this structure:

```json
{
  "statusCode": 200,
  "error": null,
  "message": "Success message",
  "data": { }
}
```

### Rules

* Use a **global ResultFilter** to wrap all responses into `RestResponse<T>`
* Do NOT wrap:

  * File responses
  * Streaming responses
* Pagination format:

```json
{
  "meta": {
    "page": 1,
    "pageSize": 10,
    "pages": 5,
    "total": 50
  },
  "result": [ ]
}
```

---

## 3. Architecture & Layering

Follow Clean Architecture principles:

* Controllers: handle HTTP only (no business logic)
* Services: business logic
* DbContext: data access (Repository pattern is optional)
* Entities: database models
* DTOs: request/response models

### Mapping from Spring

| Spring Boot     | .NET 8                |
| --------------- | --------------------- |
| @RestController | ControllerBase        |
| @Service        | Service class         |
| JpaRepository   | DbContext + LINQ      |
| @Entity         | EF Core Entity        |
| DTO             | C# DTO (record/class) |
| Filter          | Middleware            |
| Interceptor     | ActionFilter          |

---

## 4. Security & Authorization

### Authentication

* Use JWT Bearer authentication

### Authorization

* Use policy-based authorization with custom `PermissionHandler`

### Permission Model

* Permissions follow format: `METHOD:/api/path`

  * Example: `GET:/api/v1/users`

### IMPORTANT

* Normalize routes before checking permissions:

  * `/api/v1/users/123` → `/api/v1/users/*`

### Current User Access

* Use a scoped service: `ICurrentUserService`
* DO NOT use static classes

---

## 5. Coding Rules

### Naming

* PascalCase: classes, methods
* camelCase: variables, parameters
* snake_case: database columns

### Async

* All I/O operations MUST use async/await
* NEVER use `.Result` or `.Wait()`

### Dependency Injection

* Services: Scoped
* AI Client: Singleton

---

## 6. Validation

* Use FluentValidation
* Do NOT validate inside controllers

---

## 7. Object Mapping

* Use Mapster
* Map between Entity ↔ DTO
* Avoid manual mapping unless necessary

---

## 8. Global Error Handling

* Use a global Exception Middleware

### Rules

* Return proper HTTP status codes
* Response MUST match `RestResponse` format:

```json
{
  "statusCode": 500,
  "error": "ExceptionName",
  "message": "Detailed message",
  "data": null
}
```

---

## 9. Database & EF Core Rules

### General

* Use DbContext directly (Repository is optional)
* Always use async queries

### Soft Delete

* Implement using Global Query Filter (`is_deleted`)

### Relationships

* Always use explicit `Include()`
* Avoid lazy loading

### Performance

* Avoid N+1 queries
* Use projection (`Select`) when possible

### Pagination

* Always apply `Skip()` and `Take()` at database level

### Transactions

* Use explicit transactions when needed:

  * `DbContext.Database.BeginTransactionAsync()`

---

## 10. DateTime & Enum Rules

* All DateTime values MUST use UTC
* Store enums as string in database

---

## 11. Filtering & Querying

* Use LINQ for filtering
* Optional: implement Specification Pattern (e.g., Ardalis.Specification)
* Keep queries readable and optimized

---

## 12. Gemini AI Integration

* Use HTTP client to call Gemini API
* Keep service stateless (no session/Redis state)
* Reuse system prompts from the original Java project

---

## 13. Background Jobs

* Replace `@Scheduled` with:

  * BackgroundService OR
  * Hangfire (preferred for production)

---

## 14. File Upload

* Replace `MultipartFile` with `IFormFile`

---

## 15. Example Pattern (IMPORTANT)

### Controller

* Calls service only
* Returns IActionResult

### Service

* Contains business logic
* Calls DbContext

### DbContext

* Handles database operations

---

## 16. AI Code Generation Rules

When generating code, AI MUST:

1. Follow all rules in this document
2. Use Mapster for mapping
3. Keep controllers thin
4. Implement logic in service layer
5. Use async/await everywhere
6. Wrap responses using `RestResponse<T>`
7. Apply validation using FluentValidation
8. Follow clean architecture structure

---

## 17. Output Requirements

Generated code MUST be:

* Production-ready
* Clean and readable
* Consistent with all conventions above
* Fully aligned with original Spring Boot logic
