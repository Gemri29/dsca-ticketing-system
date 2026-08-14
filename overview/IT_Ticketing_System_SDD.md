# IT Ticketing System — System Design Document & API Contract

**Version:** 1.1  
**Date:** 2026-08-07  
**Status:** Finalized  
**Companion Doc:** IT_Ticketing_System_PRD.md v1.2  
**Changelog:** v1.1 — Resolved all open items (Section 11); updated env vars, regex, SLA, seed credentials, file storage

---

## 1. System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
│                                                                 │
│   ┌─────────────────┐          ┌──────────────────────────┐    │
│   │   Landing Page  │          │     Admin / Super Admin  │    │
│   │   (Public)      │          │     Portal (Protected)   │    │
│   │                 │          │                          │    │
│   │  Ticket Form    │          │  Dashboard / Inbox /     │    │
│   │  Track Ticket   │          │  Detail / Settings /     │    │
│   └────────┬────────┘          │  Analytics / Admin Mgmt  │    │
│            │                   └────────────┬─────────────┘    │
└────────────┼────────────────────────────────┼─────────────────-┘
             │  HTTPS REST                    │  HTTPS REST
             │  (JSON)                        │  (JSON + HttpOnly Cookie)
┌────────────▼────────────────────────────────▼──────────────────┐
│                        API LAYER (Express)                      │
│                                                                 │
│   Public Routes          │   Protected Routes                   │
│   POST /tickets          │   Middleware: isAuthenticated        │
│   GET  /tickets/track    │   Middleware: hasRole                │
│   POST /auth/login       │                                      │
│                          │   /tickets/** (admin CRUD)           │
│                          │   /admin/**   (super admin only)     │
│                          │   /auth/logout                       │
│                          │   /users/me                          │
└──────────┬───────────────┴──────────────────┬──────────────────┘
           │                                  │
     ┌─────▼──────┐                    ┌──────▼──────┐
     │   Resend   │                    │   Prisma    │
     │  (Email)   │                    │    ORM      │
     └────────────┘                    └──────┬──────┘
                                              │
                                       ┌──────▼──────┐
                                       │  PostgreSQL  │
                                       │   (Neon)    │
                                       └─────────────┘
           │
     ┌─────▼──────┐
     │ Cloudinary │
     │  (Files)   │
     └────────────┘
```

---

## 2. Folder Structure

```
/
├── client/                          # React + Vite frontend
│   ├── public/
│   ├── src/
│   │   ├── api/                     # All axios/fetch calls — one file per domain
│   │   │   ├── tickets.js
│   │   │   ├── auth.js
│   │   │   └── admin.js
│   │   ├── components/              # Reusable UI components
│   │   │   ├── TicketForm.jsx
│   │   │   ├── TicketPreviewRow.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── StatusBadge.jsx
│   │   │   ├── PriorityBadge.jsx
│   │   │   └── FileUpload.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx      # JWT role + user state
│   │   ├── hooks/
│   │   │   ├── useTickets.js
│   │   │   └── useAuth.js
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx
│   │   │   ├── TrackTicket.jsx
│   │   │   ├── admin/
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── Inbox.jsx
│   │   │   │   ├── TicketDetail.jsx
│   │   │   │   └── Settings.jsx
│   │   │   └── superadmin/
│   │   │       ├── Analytics.jsx
│   │   │       └── AdminManagement.jsx
│   │   ├── routes/
│   │   │   └── ProtectedRoute.jsx   # Role-based route guard
│   │   ├── utils/
│   │   │   ├── validators.js        # Shared form validation helpers
│   │   │   └── formatters.js        # Date, ticket code formatters
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env
│   └── vite.config.js
│
├── server/                          # Node.js + Express backend
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js                  # Seeds initial Super Admin account
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── ticketController.js
│   │   │   ├── authController.js
│   │   │   └── adminController.js
│   │   ├── middleware/
│   │   │   ├── isAuthenticated.js   # Verifies JWT from cookie
│   │   │   ├── hasRole.js           # Checks role claim
│   │   │   ├── rateLimiter.js       # Per-route rate limit configs
│   │   │   ├── uploadHandler.js     # multer + file-type validation
│   │   │   └── honeypot.js          # Rejects filled honeypot fields
│   │   ├── routes/
│   │   │   ├── tickets.js
│   │   │   ├── auth.js
│   │   │   └── admin.js
│   │   ├── services/
│   │   │   ├── emailService.js      # Resend integration
│   │   │   ├── uploadService.js     # Cloudinary integration
│   │   │   └── ticketCodeService.js # TKT-XXXX generator
│   │   ├── utils/
│   │   │   ├── validators.js        # Server-side validation helpers
│   │   │   └── publicTicketShape.js # Strips admin-only fields for public response
│   │   └── app.js                   # Express app setup
│   ├── server.js                    # Entry point
│   ├── .env
│   └── package.json
│
└── README.md
```

---

## 3. Environment Variables

### 3.1 Server (`server/.env`)

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@neon-host/dbname

# JWT
JWT_SECRET=your_jwt_secret_min_32_chars
JWT_EXPIRES_IN=8h

# Cookie
COOKIE_SECRET=your_cookie_secret

# CORS
FRONTEND_URL=http://localhost:5173

# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=it-support@company.com

# File Upload (Cloudinary)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Validation
ALLOWED_EMAIL_DOMAINS=dscacontacting.com
LAPTOP_NUMBER_REGEX=^DSCA-LAPTOP-[0-9]{3}$

# SLA
SLA_THRESHOLD_HOURS=48

# Rate Limiting
RATE_LIMIT_WINDOW_MS=3600000
RATE_LIMIT_SUBMIT_MAX=5
RATE_LIMIT_LOGIN_MAX=10
RATE_LIMIT_TRACK_MAX=20
```

### 3.2 Client (`client/.env`)

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

---

## 4. Database Schema (Prisma — Final)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Ticket {
  id           String   @id @default(cuid())
  ticketCode   String   @unique
  fullName     String
  email        String
  laptopNumber String
  siteLocation String
  issueType    String
  customIssue  String?
  priority     Priority @default(MEDIUM)
  attachment   String?
  status       Status   @default(PENDING)
  remark       String?
  internalNote String?
  assignedTo   String?
  assignedUser User?    @relation(fields: [assignedTo], references: [id])
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model User {
  id              String   @id @default(cuid())
  email           String   @unique
  name            String
  password        String
  role            Role     @default(ADMIN)
  active          Boolean  @default(true)
  assignedTickets Ticket[]
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

enum Role {
  SUPER_ADMIN
  ADMIN
}

enum Status {
  PENDING
  UNRESOLVED
  RESOLVED
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}
```

---

## 5. Middleware Flow

### 5.1 Public Route Flow
```
Request
  → helmet()
  → cors()
  → rateLimiter (route-specific)
  → honeypot() [ticket submit only]
  → Controller
  → Response
```

### 5.2 Protected Route Flow
```
Request
  → helmet()
  → cors()
  → isAuthenticated()    ← verifies JWT from HttpOnly cookie
       ↓ fail → 401 Unauthorized
  → hasRole([ADMIN])     ← checks role claim on JWT payload
       ↓ fail → 403 Forbidden
  → rateLimiter (if applicable)
  → Controller
  → Response
```

### 5.3 Super Admin Route Flow
```
Request
  → helmet()
  → cors()
  → isAuthenticated()
       ↓ fail → 401
  → hasRole([SUPER_ADMIN])
       ↓ fail → 403
  → Controller
  → Response
```

---

## 6. API Contract

**Base URL:** `/api`  
**Content-Type:** `application/json`  
**Auth:** HttpOnly cookie (`token`) — sent automatically by browser on all requests with `credentials: 'include'`

---

### 6.1 Auth Routes

#### `POST /auth/login`
Login as admin or super admin.

**Rate limit:** 10 requests / IP / 15 min

**Request body:**
```json
{
  "email": "admin@company.com",
  "password": "SecurePass1!"
}
```

**Response `200`:**
```json
{
  "success": true,
  "user": {
    "id": "clx...",
    "name": "John Doe",
    "email": "admin@company.com",
    "role": "ADMIN"
  }
}
```
> Sets `HttpOnly` cookie: `token=<jwt>`

**Response `401`:**
```json
{ "success": false, "message": "Invalid email or password." }
```

**Response `403`:**
```json
{ "success": false, "message": "Account is deactivated." }
```

---

#### `POST /auth/logout`
🔒 Protected (any authenticated user)

**Request:** No body required.

**Response `200`:**
```json
{ "success": true, "message": "Logged out." }
```
> Clears the `token` cookie.

---

#### `GET /auth/me`
🔒 Protected (any authenticated user)  
Returns current session user info.

**Response `200`:**
```json
{
  "id": "clx...",
  "name": "John Doe",
  "email": "admin@company.com",
  "role": "ADMIN"
}
```

---

### 6.2 Ticket Routes (Public)

#### `POST /tickets`
Submit a new ticket. No authentication required.

**Rate limit:** 5 requests / IP / hour  
**Honeypot:** Request rejected silently if `_trap` field is populated.

**Request body:** `multipart/form-data` (due to file upload)

| Field | Type | Required |
|---|---|---|
| `fullName` | string | ✅ |
| `email` | string (domain-validated) | ✅ |
| `laptopNumber` | string (regex-validated) | ✅ |
| `siteLocation` | string | ✅ |
| `issueType` | string | ✅ |
| `customIssue` | string | Only if `issueType === "Other"` |
| `priority` | `LOW \| MEDIUM \| HIGH \| CRITICAL` | ✅ |
| `attachment` | file (jpg/png/pdf, max 5MB) | ❌ |
| `_trap` | string | Honeypot — must be empty |

**Response `201`:**
```json
{
  "success": true,
  "message": "Ticket submitted successfully.",
  "ticketCode": "TKT-4821"
}
```

**Response `400` (validation failure):**
```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": {
    "email": "Email domain not allowed.",
    "laptopNumber": "Invalid format. Expected: LPT-XXXX."
  }
}
```

**Response `429`:**
```json
{ "success": false, "message": "Too many submissions. Please try again later." }
```

---

#### `GET /tickets/track`
Track a ticket by email + ticket code. No authentication required.

**Rate limit:** 20 requests / IP / hour

**Query params:**

| Param | Type | Required |
|---|---|---|
| `email` | string | ✅ |
| `ticketCode` | string | ✅ |

**Example:** `GET /api/tickets/track?email=user@company.com&ticketCode=TKT-4821`

**Response `200`:**
```json
{
  "success": true,
  "ticket": {
    "ticketCode": "TKT-4821",
    "status": "RESOLVED",
    "issueType": "Hardware",
    "customIssue": null,
    "priority": "HIGH",
    "createdAt": "2026-08-07T09:00:00.000Z",
    "updatedAt": "2026-08-07T14:00:00.000Z",
    "assignedAdminFirstName": "John",
    "remark": "Laptop keyboard replaced. Please collect from IT room 3."
  }
}
```
> `remark` is only included if `status === "RESOLVED"`.  
> `assignedAdminFirstName` is only the first name — no ID, email, or last name.

**Response `404`:**
```json
{ "success": false, "message": "No ticket found with those details." }
```

---

### 6.3 Ticket Routes (Admin — Protected)

#### `GET /tickets`
🔒 Protected: `ADMIN`, `SUPER_ADMIN`  
Get paginated list of tickets.

**Query params:**

| Param | Type | Default | Notes |
|---|---|---|---|
| `status` | `PENDING \| UNRESOLVED \| RESOLVED` | — | Filter by status |
| `priority` | `LOW \| MEDIUM \| HIGH \| CRITICAL` | — | Filter by priority |
| `siteLocation` | string | — | Filter by location |
| `issueType` | string | — | Filter by issue |
| `assignedTo` | string (user ID) | — | Filter by assigned admin |
| `sortBy` | `createdAt \| updatedAt \| priority` | `createdAt` | Sort field |
| `order` | `asc \| desc` | `desc` | Sort direction |
| `page` | number | `1` | Pagination |
| `limit` | number | `25` | Results per page |

> **Admin** sees only tickets assigned to them.  
> **Super Admin** sees all tickets.

**Response `200`:**
```json
{
  "success": true,
  "tickets": [
    {
      "id": "clx...",
      "ticketCode": "TKT-4821",
      "fullName": "Jane Smith",
      "laptopNumber": "LPT-0042",
      "issueType": "Hardware",
      "customIssue": null,
      "priority": "HIGH",
      "status": "PENDING",
      "siteLocation": "HQ - Floor 3",
      "createdAt": "2026-08-07T09:00:00.000Z",
      "assignedUser": {
        "id": "clx...",
        "name": "John Doe"
      }
    }
  ],
  "pagination": {
    "total": 87,
    "page": 1,
    "limit": 25,
    "totalPages": 4
  }
}
```

---

#### `GET /tickets/:id`
🔒 Protected: `ADMIN`, `SUPER_ADMIN`  
Get full detail of a single ticket.

> Admin can only fetch tickets assigned to them.  
> Super Admin can fetch any ticket.

**Response `200`:**
```json
{
  "success": true,
  "ticket": {
    "id": "clx...",
    "ticketCode": "TKT-4821",
    "fullName": "Jane Smith",
    "email": "jane@company.com",
    "laptopNumber": "LPT-0042",
    "siteLocation": "HQ - Floor 3",
    "issueType": "Hardware",
    "customIssue": null,
    "priority": "HIGH",
    "attachment": "https://res.cloudinary.com/...",
    "status": "PENDING",
    "remark": null,
    "internalNote": null,
    "createdAt": "2026-08-07T09:00:00.000Z",
    "updatedAt": "2026-08-07T09:00:00.000Z",
    "assignedUser": {
      "id": "clx...",
      "name": "John Doe",
      "email": "john@company.com"
    }
  }
}
```

**Response `403`:**
```json
{ "success": false, "message": "You are not assigned to this ticket." }
```

---

#### `PATCH /tickets/:id`
🔒 Protected: `ADMIN`, `SUPER_ADMIN`  
Update ticket status, remark, or internal note.

> Admin can only update tickets assigned to them.  
> Super Admin can update any ticket.  
> Changing status to `RESOLVED` triggers a status update email to the submitter.

**Request body (all fields optional — send only what's changing):**
```json
{
  "status": "RESOLVED",
  "remark": "Issue resolved. RAM upgraded to 16GB.",
  "internalNote": "Sourced from stock room shelf B2."
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Ticket updated.",
  "ticket": {
    "id": "clx...",
    "ticketCode": "TKT-4821",
    "status": "RESOLVED",
    "remark": "Issue resolved. RAM upgraded to 16GB.",
    "internalNote": "Sourced from stock room shelf B2.",
    "updatedAt": "2026-08-07T14:00:00.000Z"
  }
}
```

---

#### `PATCH /tickets/:id/assign`
🔒 Protected: `SUPER_ADMIN` only  
Assign or reassign a ticket to an admin.

**Request body:**
```json
{ "adminId": "clx..." }
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Ticket assigned.",
  "ticket": {
    "id": "clx...",
    "ticketCode": "TKT-4821",
    "assignedUser": {
      "id": "clx...",
      "name": "John Doe"
    }
  }
}
```

---

### 6.4 User (Self) Routes

#### `GET /users/me`
🔒 Protected: `ADMIN`, `SUPER_ADMIN`  
Get own profile.

**Response `200`:**
```json
{
  "id": "clx...",
  "name": "John Doe",
  "email": "john@company.com",
  "role": "ADMIN",
  "createdAt": "2026-01-01T00:00:00.000Z"
}
```

---

#### `PATCH /users/me`
🔒 Protected: `ADMIN`, `SUPER_ADMIN`  
Update own profile (name, email, password only — role is not editable by self).

**Request body (all optional):**
```json
{
  "name": "Johnathan Doe",
  "email": "jdoe@company.com",
  "currentPassword": "OldPass1!",
  "newPassword": "NewPass1!"
}
```
> `currentPassword` is required when `newPassword` is provided.

**Response `200`:**
```json
{
  "success": true,
  "message": "Profile updated.",
  "user": {
    "id": "clx...",
    "name": "Johnathan Doe",
    "email": "jdoe@company.com"
  }
}
```

**Response `400`:**
```json
{ "success": false, "message": "Current password is incorrect." }
```

---

### 6.5 Admin Management Routes (Super Admin Only)

#### `GET /admin/users`
🔒 Protected: `SUPER_ADMIN`  
Get all admin accounts.

**Query params:**

| Param | Type | Default |
|---|---|---|
| `active` | `true \| false` | — (all) |
| `role` | `ADMIN \| SUPER_ADMIN` | — (all) |

**Response `200`:**
```json
{
  "success": true,
  "users": [
    {
      "id": "clx...",
      "name": "John Doe",
      "email": "john@company.com",
      "role": "ADMIN",
      "active": true,
      "createdAt": "2026-01-01T00:00:00.000Z"
    }
  ]
}
```

---

#### `POST /admin/users`
🔒 Protected: `SUPER_ADMIN`  
Create a new admin account.

**Request body:**
```json
{
  "name": "Jane IT",
  "email": "jane@company.com",
  "password": "TempPass1!",
  "role": "ADMIN"
}
```

**Response `201`:**
```json
{
  "success": true,
  "message": "Admin account created.",
  "user": {
    "id": "clx...",
    "name": "Jane IT",
    "email": "jane@company.com",
    "role": "ADMIN",
    "active": true
  }
}
```

**Response `409`:**
```json
{ "success": false, "message": "An account with this email already exists." }
```

---

#### `PATCH /admin/users/:id`
🔒 Protected: `SUPER_ADMIN`  
Update an admin's name, role, or active status.  
> Cannot delete — only deactivate to preserve ticket history.

**Request body (all optional):**
```json
{
  "name": "Jane Smith",
  "role": "SUPER_ADMIN",
  "active": false
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Admin account updated.",
  "user": {
    "id": "clx...",
    "name": "Jane Smith",
    "role": "SUPER_ADMIN",
    "active": false
  }
}
```

---

### 6.6 Analytics Routes (Super Admin Only)

#### `GET /admin/analytics`
🔒 Protected: `SUPER_ADMIN`  
Get system-wide analytics data.

**Query params:**

| Param | Type | Default | Notes |
|---|---|---|---|
| `from` | ISO date string | 30 days ago | Date range start |
| `to` | ISO date string | now | Date range end |

**Response `200`:**
```json
{
  "success": true,
  "analytics": {
    "totalTickets": 312,
    "byStatus": {
      "PENDING": 45,
      "UNRESOLVED": 28,
      "RESOLVED": 239
    },
    "bySiteLocation": {
      "HQ - Floor 3": 120,
      "Branch A": 80,
      "Branch B": 112
    },
    "byIssueType": {
      "Hardware": 98,
      "Software": 134,
      "Network": 55,
      "Other": 25
    },
    "byPriority": {
      "LOW": 60,
      "MEDIUM": 150,
      "HIGH": 82,
      "CRITICAL": 20
    },
    "avgResolutionTimeHours": 4.7,
    "slaBreaches": 12,
    "adminPerformance": [
      {
        "adminId": "clx...",
        "adminName": "John Doe",
        "resolved": 89,
        "avgResolutionTimeHours": 3.2
      }
    ]
  }
}
```

---

## 7. Email Templates

Two transactional emails sent via **Resend**.

### 7.1 Ticket Confirmation Email
**Trigger:** On successful ticket submission  
**To:** Submitter's email  
**Subject:** `[TKT-XXXX] Your IT Support Ticket Has Been Received`

**Content:**
- Ticket Code (large, prominent)
- Submitted details summary (name, laptop number, issue, priority)
- Magic tracking link: `https://yourapp.com/track?email=...&code=TKT-XXXX`
- Manual lookup instructions

### 7.2 Status Update Email
**Trigger:** When admin changes ticket status  
**To:** Submitter's email  
**Subject:** `[TKT-XXXX] Your Ticket Status Has Been Updated`

**Content:**
- Ticket Code
- New status (Pending / Unresolved / Resolved)
- Admin remark (if status is Resolved and remark exists)
- Magic tracking link

---

## 8. Ticket Code Generation

Ticket codes follow the format `TKT-XXXX` where `XXXX` is a **zero-padded 4-digit number** derived from an auto-incrementing counter stored in the DB, or generated as a random 4-digit number with collision check.

**Generation logic (`ticketCodeService.js`):**
```js
async function generateTicketCode() {
  let code;
  let exists = true;

  while (exists) {
    const number = Math.floor(1000 + Math.random() * 9000); // 1000–9999
    code = `TKT-${number}`;
    const found = await prisma.ticket.findUnique({ where: { ticketCode: code } });
    exists = !!found;
  }

  return code;
}
```

> Once ticket volume exceeds ~6,500 (72% of 9,000 possible codes), collision probability increases. At that point, extend to 5 digits (`TKT-XXXXX`) via a DB migration.

---

## 9. Error Response Standard

All error responses follow this shape:

```json
{
  "success": false,
  "message": "Human-readable error message.",
  "errors": {}
}
```

> `errors` is optional — only included for validation failures with field-level detail.

### HTTP Status Code Reference

| Code | Meaning | When Used |
|---|---|---|
| `200` | OK | Successful GET / PATCH |
| `201` | Created | Successful POST (ticket, user) |
| `400` | Bad Request | Validation failure, wrong password |
| `401` | Unauthorized | No valid JWT / not logged in |
| `403` | Forbidden | Authenticated but wrong role / not assigned |
| `404` | Not Found | Ticket or user not found |
| `409` | Conflict | Duplicate email on account creation |
| `429` | Too Many Requests | Rate limit exceeded |
| `500` | Internal Server Error | Unhandled exception |

---

## 10. Frontend Route Map

| Path | Page | Auth Required | Role |
|---|---|---|---|
| `/` | Landing Page (Ticket Form) | ❌ | — |
| `/track` | Track My Ticket | ❌ | — |
| `/login` | Admin Login | ❌ | — |
| `/admin/dashboard` | Dashboard | ✅ | ADMIN, SUPER_ADMIN |
| `/admin/inbox` | Inbox | ✅ | ADMIN, SUPER_ADMIN |
| `/admin/tickets/:id` | Ticket Detail | ✅ | ADMIN, SUPER_ADMIN |
| `/admin/settings` | Account Settings | ✅ | ADMIN, SUPER_ADMIN |
| `/superadmin/analytics` | Analytics | ✅ | SUPER_ADMIN |
| `/superadmin/admins` | Admin Management | ✅ | SUPER_ADMIN |

---

## 11. Resolved Items — Ready for Phase 3 (Wireframes)

All items resolved. Values locked in below for implementation reference:

| # | Item | Value | Notes |
|---|---|---|---|
| 1 | Email domain whitelist | `dscacontacting.com` | Env: `ALLOWED_EMAIL_DOMAINS` |
| 2 | Site Locations | Moe, Dubai Mall, ADCB, JBR | Hardcoded dropdown options |
| 3 | Ticket Issue categories | Internet Issue, Account Issue, Hardware Issue, Software Issue, Other | "Other" reveals custom input field |
| 4 | Laptop Number format | `DSCA-LAPTOP-XXX` | Regex: `^DSCA-LAPTOP-[0-9]{3}$` |
| 5 | SLA threshold | **48 hours** | Env: `SLA_THRESHOLD_HOURS=48` |
| 6 | Initial Super Admin | Email: `super_admin` / Password: `heisenberg` | Seeded via `prisma/seed.js` — **change on first login** |
| 7 | File storage | **Cloudinary** | Free tier — 25GB storage, 25GB bandwidth/month |

---

*End of SDD v1.0*
