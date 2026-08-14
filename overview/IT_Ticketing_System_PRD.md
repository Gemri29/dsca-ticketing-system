# IT Ticketing System — Product Requirements Document (PRD)

**Version:** 1.3  
**Date:** 2026-08-13  
**Status:** Finalized  
**Changelog:**
- v1.1 — Added Section 5.5 Security Requirements (expanded)
- v1.2 — Resolved all Open Questions (Section 8); updated domain, locations, issues, laptop format, SLA, super admin seed, file storage
- v1.3 — Phase 3 complete; added Section 4.4 UI/UX Decisions from wireframes; added laptops table to schema; updated phase tracker (Section 8); updated domain, locations, issues, laptop format, SLA, super admin seed, file storage

---

## 1. Overview

### 1.1 Purpose
An internal IT Ticketing System that allows company employees to submit IT-related issues without requiring an account, while providing IT admins a structured dashboard to manage, track, and resolve those tickets.

### 1.2 Goals
- Remove friction for end-users — no sign-up, no login required to submit a ticket
- Give IT admins a clean, organized workspace to manage tickets efficiently
- Allow users to track ticket progress via Ticket ID + Email lookup
- Ensure super admins have full oversight, analytics, and admin management capabilities

### 1.3 Success Metrics
- Ticket submission takes under 2 minutes for a user
- Admins can view, assign, and update ticket status without leaving the dashboard
- Users can retrieve their ticket status at any time via Ticket ID + Email
- Zero surprise infrastructure costs at 1,000+ ticket volume

---

## 2. Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend | React + Vite | Faster dev experience |
| Styling | Tailwind CSS | Rapid UI, dashboard-friendly |
| Backend | Node.js + Express | Lightweight REST API |
| Database | PostgreSQL via Neon | Free tier, no pausing, no auto-billing |
| ORM | Prisma | Type-safe queries, clean migrations |
| Auth | JWT + bcrypt | For admin/super admin sessions |
| Email | Resend | Ticket confirmation + status update emails |
| Hosting (FE) | Vercel | Free tier, auto-deploy from Git |
| Hosting (BE) | Railway | Node backend hosting |

---

## 3. User Roles

| Role | Access |
|---|---|
| **Guest (Ticket Submitter)** | Landing page form only. No login. Can track ticket via email + ticket ID. |
| **Admin (IT Staff)** | Admin portal — view, manage, update, and resolve tickets assigned to them. |
| **Super Admin** | Full access — everything Admin has, plus admin account management and analytics. |

---

## 4. Functional Requirements

### 4.1 Landing Page

#### 4.1.1 Ticket Submission Form
All fields are required unless marked optional.

| Field | Type | Validation |
|---|---|---|
| Full Name | Text input | Required, min 2 chars |
| Email | Email input | Required, must match `@dscacontacting.com` domain |
| Laptop Number | Text input | Required, format: `DSCA-LAPTOP-XXX` (zero-padded 3-digit suffix) |
| Site Location | Dropdown | Required, predefined list of company site locations |
| Ticket Issue | Dropdown | Required, predefined issue categories |
| Custom Issue | Text input | Conditionally required — appears only when "Other" is selected in Ticket Issue |
| Priority Level | Dropdown | Required — Low / Medium / High / Critical |
| Attachment | File upload | Optional — image or screenshot (jpg, png, pdf) |
| Submit Button | Button | Triggers validation then submission |

**On Successful Submit:**
- Generate unique Ticket Code (format: `TKT-XXXX`, e.g. `TKT-4821`)
- Send confirmation email to user containing:
  - Ticket Code
  - Summary of submitted details
  - Magic link to track ticket status
  - Instructions for manual lookup (email + ticket ID)
- Display success screen with Ticket Code prominently shown

#### 4.1.2 Track My Ticket
- Accessible from the landing page (separate section or nav link)
- User enters: **Email** + **Ticket Code**
- On match: display ticket status, issue type, assigned admin (first name only), and any admin remark if resolved
- On no match: display friendly error message

---

### 4.2 Admin Portal

#### 4.2.1 Authentication
- Login page (email + password)
- JWT-based session management
- Role-based route protection (Admin vs Super Admin)
- Logout option in sidebar

#### 4.2.2 Layout
- **Collapsible sidebar** on the left
- Main content area on the right
- Sidebar items:
  - 📊 Dashboard
  - 📥 Inbox
  - ⚙️ Account Settings

#### 4.2.3 Dashboard
- Three filter buttons at the top: **Pending | Unresolved | Resolved**
- Clicking a button filters the ticket preview list below
- Default view on load: **Pending**
- Ticket previews displayed in **Gmail-style 3-column row format:**
  - Column 1: Submitter Full Name
  - Column 2: Laptop Number (subject)
  - Column 3: Ticket Issue (body preview, truncated)
- Clicking a preview row opens the **Ticket Detail View**

#### 4.2.4 Inbox
- Full-page list of all tickets regardless of status
- Same Gmail-style 3-column row format as Dashboard
- Sortable by: Date, Priority, Status, Site Location
- Filterable by: Status, Priority, Site Location, Issue Type

#### 4.2.5 Ticket Detail View
Opens in a new page when a ticket preview is clicked.

Displays:
- Ticket Code
- Submitter Full Name
- Email
- Laptop Number
- Site Location
- Issue Type (+ custom issue if applicable)
- Priority Level
- Attachment (if any, viewable/downloadable)
- Submission Date & Time
- Current Status badge
- Assigned Admin
- Internal Notes (admin-only, not visible to submitter)
- Remark (optional, shown to user on ticket lookup if status is Resolved)

Actions available:
- **Change Status** — Pending / Unresolved / Resolved
- **Add/Edit Remark** — optional text field, visible to the ticket submitter
- **Add Internal Note** — admin-only, never shown to submitter
- **Assign to Admin** — dropdown of active admins (Super Admin only or own tickets)
- Changing status to **Resolved** triggers an automated email to the submitter

#### 4.2.6 Account Settings
- View and edit own profile (name, email, password)
- Admin cannot change their own role

---

### 4.3 Super Admin Portal

Includes everything in Admin Portal, plus:

#### 4.3.1 Admin Management
- View all admin accounts (name, email, role, active status)
- Create new admin account (name, email, temp password, role)
- Deactivate / reactivate admin accounts
- Cannot delete accounts — only deactivate (preserves ticket history)

#### 4.3.2 Analytics Dashboard
Metrics displayed:
- Total tickets (all time and by date range)
- Tickets by status (Pending / Unresolved / Resolved)
- Tickets by site location
- Tickets by issue type
- Average resolution time
- SLA breach count (tickets Pending > **48 hours** without status change)
- Admin performance (tickets resolved per admin)

#### 4.3.3 Ticket Override
- Super Admin can reassign any ticket to any admin
- Super Admin can change status of any ticket
- Super Admin can view all internal notes

---

### 4.4 UI/UX Decisions (from Wireframes — Phase 3)

These decisions were finalized during wireframing and are binding for the frontend build.

#### 4.4.1 Global
- Theme: **white background** (`#fff`), light gray page surfaces (`#f7f8fa`), blue accent (`#2563eb`) for admin, purple accent (`#7c3aed`) for super admin
- All cards: white background with `1px solid #e8e8e8` border and `border-radius: 12px`
- Sidebar: collapsible to icon-only mode on all portal pages
- Consistent topbar across all portal pages (logo, admin name, avatar initials)

#### 4.4.2 Landing Page
- Ticket form sits on a **light gray card** (`#f7f8fa`) to lift it off the white page background
- **Priority selector** uses pill/badge buttons instead of a dropdown — more scannable and faster to tap
- **Laptop number** uses a **strict combobox** pattern — type-to-filter from registered asset list, no free-form entry; selecting snaps to a chip, X to clear
- "Other" issue type reveals a conditional custom description textarea with an amber warning banner
- **Track My Ticket** panel lives on the same page alongside the form (no separate page navigation needed)
- A "How it works" card is shown on the right column for first-time submitters

#### 4.4.3 Admin Login
- Eye toggle on password field
- Brute force warning shown upfront ("10 failed attempts = 15 min lockout")
- Security note at the bottom (JWT + HTTPS)

#### 4.4.4 Admin Dashboard
- Stat cards (Pending / Unresolved / Resolved) **double as filter buttons** — clicking a card filters the list below
- Filter tabs below the stat cards mirror the same filter for keyboard/accessibility users
- **SLA breach flag** shown inline in ticket rows (red alarm icon + "SLA" label)
- Unread tickets: blue dot + bold name
- Default view on load: **Pending**

#### 4.4.5 Admin Inbox
- Single **"Filter" button** opens a dropdown panel with three collapsible sub-menus: Status, Priority, Site
- Filters are **auto-applied** on checkbox tick — no "Apply" button needed
- Active filters shown as **removable chips** below the toolbar
- Filter button turns blue and shows a count badge when filters are active
- Bulk action bar appears at top when rows are checked (Mark resolved / Reassign / Cancel)
- Ticket rows show: Submitter name + ticket code, laptop number, issue (truncated), site, status pill, priority pill

#### 4.4.6 Ticket Detail View
- Two-column layout: left = ticket info + activity timeline, right = action panel
- SLA breach alert banner shown at the very top when threshold exceeded
- **Status** changed via three toggle buttons (Pending / Unresolved / Resolved) — not a dropdown
- **Internal note** field pre-shows saved note; new note textarea below it; Save note button
- **Remark** field uses amber-tinted background to visually distinguish it from internal notes
- Activity timeline at the bottom of the left column — logs all status changes, assignments, notes
- Attachment shown as a downloadable file card

#### 4.4.7 Account Settings
- Profile card spans full width with avatar initials, name, email, role badge
- Role field is **disabled** with a hint: "Role can only be changed by a Super Admin"
- Account info card shows personal performance stats (tickets assigned, resolved, avg resolution time)
- Danger zone card at the bottom for sign-out — deactivation requires Super Admin
- Success toast notification on save (auto-dismisses after 3s)

#### 4.4.8 Super Admin Portal
- Purple accent color distinguishes super admin views from regular admin views
- Tab switcher between **Analytics** and **Admin management** (no separate pages)
- Analytics: date range dropdown + 4 stat cards + 4 charts (bar + donut) + admin performance table
- Admin management: table with Edit / Deactivate / Reactivate actions per row
- **Add admin** opens a modal form (name, email, temp password, role)
- Deactivation is toggle-based — no hard delete

---

## 5. Non-Functional Requirements

### 5.1 Security

See **Section 5.5** for full expanded security requirements. Summary:
- All admin routes protected by JWT middleware (HttpOnly cookies)
- Role checks on every protected endpoint
- Email domain whitelist enforced server-side
- File uploads restricted by MIME type and size (max 5MB)
- Passwords hashed with bcrypt (min 12 rounds)

### 5.2 Email
- Confirmation email sent on ticket submission (via Resend)
- Status update email sent when ticket status changes (via Resend)
- Emails include Ticket Code and magic tracking link
- Emails are plain but branded (company name/logo in header)

### 5.3 Performance
- Ticket list pages paginated (25 tickets per page)
- Attachment uploads stored on **Cloudinary** (free tier — 25GB storage, 25GB bandwidth/month)
- API responses under 500ms for standard queries

### 5.4 Availability
- Frontend hosted on Vercel (99.9% uptime SLA)
- Backend hosted on Railway
- Database on Neon (free tier — no pausing)

### 5.5 Security Requirements

#### 5.5.1 SQL Injection
- All database queries use **Prisma ORM with parameterized queries** — user input is never interpolated into SQL strings
- `prisma.$queryRaw` is prohibited unless using the tagged template literal syntax (`prisma.$queryRaw\`...\``)
- Raw SQL escape hatches are avoided entirely in v1.0 — all operations use Prisma's standard query API

#### 5.5.2 Authentication & Session Management
- JWTs stored in **HttpOnly cookies** — never in `localStorage` or `sessionStorage` (prevents XSS token theft)
- Cookies set with `Secure`, `SameSite=Strict` flags
- JWT expiry set to **8 hours** (standard workday session)
- Logout invalidates the cookie client-side immediately
- Password minimum policy: 8+ characters, at least one number, one special character
- Passwords hashed with **bcrypt, minimum 12 salt rounds**

#### 5.5.3 Broken Access Control
- Every protected API route runs **two middleware checks in sequence:**
  1. `isAuthenticated` — validates JWT and attaches user to request
  2. `hasRole(ADMIN | SUPER_ADMIN)` — checks role before any logic executes
- Frontend route guards are supplementary only — backend is the enforcing layer
- Admins cannot access Super Admin endpoints even by direct URL/API call
- Super Admin sidebar items are rendered conditionally based on JWT role claim

#### 5.5.4 Mass Assignment
- `req.body` is **never spread directly** into Prisma `create` or `update` calls
- Every endpoint explicitly whitelists permitted fields:

```js
// ✅ Safe — explicit whitelist only
prisma.user.update({
  where: { id },
  data: {
    name: req.body.name,
    email: req.body.email,
  }
})
```

- `role` and `active` fields on User can only be modified by Super Admin endpoints

#### 5.5.5 File Upload Security
- Accepted MIME types validated **server-side**: `image/jpeg`, `image/png`, `application/pdf` only
- File extension alone is not trusted — MIME type from buffer is checked via `file-type` npm package
- Maximum file size: **5MB**, enforced by `multer` before file reaches application logic
- Uploaded files are sent directly to **Cloudinary** — never written to the server's filesystem
- Files are never executed or rendered server-side
- Cloudinary URLs are stored in DB; files are served by Cloudinary's CDN, not the Express server

#### 5.5.6 XSS (Cross-Site Scripting)
- React escapes all JSX output by default — user-submitted content is never injected as raw HTML
- `dangerouslySetInnerHTML` is **prohibited** throughout the codebase
- If rich text rendering is ever needed in future versions, `DOMPurify` must be used to sanitize first
- All user-submitted text fields (ticket issue, custom issue, remark, internal note) are stored and rendered as plain text

#### 5.5.7 Rate Limiting
- `/api/tickets` (POST — submit ticket): max **5 requests per IP per hour** via `express-rate-limit`
- `/api/auth/login`: max **10 attempts per IP per 15 minutes**, then temporary lockout
- `/api/tickets/track` (GET — ticket lookup): max **20 requests per IP per hour**
- Rate limit responses return HTTP `429 Too Many Requests` with a `Retry-After` header

#### 5.5.8 Spam / Bot Protection
- Ticket submission form includes a **honeypot field** — a hidden input invisible to humans
- If the honeypot field is populated on submission, the request is silently rejected (return 200 to not tip off bots)
- Rate limiting (see 5.5.7) provides a second layer of bot protection

#### 5.5.9 CORS
- Express CORS middleware configured to allow **only the frontend's domain**:
```js
cors({
  origin: process.env.FRONTEND_URL, // e.g. https://yourapp.vercel.app
  credentials: true                 // required for HttpOnly cookie auth
})
```
- `origin: "*"` is explicitly prohibited in all environments including development

#### 5.5.10 HTTP Security Headers
- `helmet` middleware applied globally on Express — sets the following headers automatically:
  - `Content-Security-Policy`
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Strict-Transport-Security`
  - `Referrer-Policy`
  - `X-XSS-Protection`

#### 5.5.11 Public Ticket Lookup — Data Exposure
- The `/api/tickets/track` endpoint returns a **restricted public shape** only:
```js
// ✅ Public response shape — safe
{
  ticketCode, status, issueType, priority,
  createdAt, updatedAt,
  assignedAdminFirstName, // first name only
  remark                  // only if status === "Resolved"
}

// ❌ Never exposed publicly
// email, fullName, laptopNumber, internalNote, assignedTo (full ID/email)
```

#### 5.5.12 Email Domain Validation
- Company email domain whitelist is enforced **server-side** on the ticket submission endpoint
- Frontend validation is UX-only — the backend rejects any submission with a non-whitelisted domain regardless of what the frontend sends
- Domain list stored in environment variable: `ALLOWED_EMAIL_DOMAINS=company.com,subsidiary.com`

#### 5.5.13 Dependency Security
- `npm audit` run as part of CI pipeline on every push
- GitHub Dependabot alerts enabled on the repository
- No packages with known **Critical** or **High** CVEs are permitted in production

#### 5.5.14 Security Checklist (Implementation Reference)

| # | Control | Layer | Priority |
|---|---|---|---|
| 1 | Prisma parameterized queries — no raw SQL | Backend | 🔴 High |
| 2 | JWT in HttpOnly + Secure + SameSite cookie | Backend | 🔴 High |
| 3 | Role middleware on every protected route | Backend | 🔴 High |
| 4 | Field whitelisting on all update operations | Backend | 🔴 High |
| 5 | File MIME type validation server-side | Backend | 🔴 High |
| 6 | Files uploaded to Cloudinary, not local disk | Backend | 🔴 High |
| 7 | Email domain check server-side | Backend | 🔴 High |
| 8 | Rate limiting on submit, login, track endpoints | Backend | 🔴 High |
| 9 | CORS restricted to frontend domain only | Backend | 🔴 High |
| 10 | Helmet middleware for HTTP security headers | Backend | 🟡 Medium |
| 11 | No `dangerouslySetInnerHTML` with user content | Frontend | 🟡 Medium |
| 12 | Honeypot field on ticket form | Frontend | 🟡 Medium |
| 13 | Public ticket lookup strips admin-only fields | Backend | 🟡 Medium |
| 14 | Brute force lockout on login | Backend | 🟡 Medium |
| 15 | Password complexity policy on account creation | Backend | 🟡 Medium |
| 16 | `npm audit` in CI pipeline | DevOps | 🟢 Low |
| 17 | Dependabot alerts on repository | DevOps | 🟢 Low |

---

## 6. Database Schema (Prisma)

```prisma
model Ticket {
  id           String   @id @default(cuid())
  ticketCode   String   @unique       // TKT-XXXX
  fullName     String
  email        String
  laptopNumber String                 // format: DSCA-LAPTOP-XXX
  siteLocation String
  issueType    String
  customIssue  String?
  priority     Priority @default(MEDIUM)
  attachment   String?                // Cloudinary URL
  status       Status   @default(PENDING)
  remark       String?                // optional, shown to submitter on resolve
  internalNote String?                // admin-only, never exposed publicly
  assignedTo   String?
  assignedUser User?    @relation(fields: [assignedTo], references: [id])
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model User {
  id              String   @id @default(cuid())
  email           String   @unique
  name            String
  password        String                   // bcrypt hash
  role            Role     @default(ADMIN)
  active          Boolean  @default(true)
  assignedTickets Ticket[]
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

// Registered laptop assets — powers the combobox on the ticket form
model Laptop {
  id           String   @id @default(cuid())
  assetCode    String   @unique  // e.g. DSCA-LAPTOP-001
  assignedTo   String?           // employee name or ID (optional reference)
  siteLocation String?
  active       Boolean  @default(true)
  createdAt    DateTime @default(now())
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

## 7. Out of Scope (v1.0)

These are explicitly excluded from the first version to keep scope manageable:

- Mobile app (web-responsive only)
- Submitter account creation or login
- Live chat or messaging between admin and submitter
- Email threading / reply-to-ticket via email
- Multi-language support
- Dark mode
- Webhook integrations (Slack, Teams notifications)
- SLA auto-escalation (tracked in analytics only, no auto-action)

> These can be revisited in v2.0.

---

## 8. Open Questions

| # | Question | Answer | Status |
|---|---|---|---|
| 1 | What is the exact company email domain to whitelist? | `@dscacontacting.com` | ✅ Resolved |
| 2 | What are the predefined Site Locations? | Moe, Dubai Mall, ADCB, JBR | ✅ Resolved |
| 3 | What are the predefined Ticket Issue categories? | Internet Issue, Account Issue, Hardware Issue, Software Issue, Other | ✅ Resolved |
| 4 | What is the exact Laptop Number format? | `DSCA-LAPTOP-001` (prefix fixed, suffix zero-padded 3-digit number) | ✅ Resolved |
| 5 | What is the SLA threshold in hours before a ticket is flagged? | **48 hours** | ✅ Resolved |
| 6 | Who is the initial Super Admin? | Username: `super_admin` / Password: `heisenberg` (change on first login) | ✅ Resolved |
| 7 | Where will file attachments be stored? | **Cloudinary** (free tier — 25GB storage / 25GB bandwidth) | ✅ Resolved |

---

## 9. Project Phases

| Phase | Deliverable |
|---|---|
| **Phase 1** | PRD ✅ |
| **Phase 2** | System Design Doc + API Contract ✅ |
| **Phase 3** | UI/UX Wireframes ✅ |
| **Phase 4** | Dev Environment Setup (repo, tooling, env vars) ✅ |
| **Phase 5** | Backend — DB schema, API routes, auth, email ✅ |
| **Phase 6** | Frontend — Landing page, ticket form, track ticket |
| **Phase 7** | Frontend — Admin portal (dashboard, inbox, detail view) |
| **Phase 8** | Frontend — Super Admin portal (analytics, admin mgmt) |
| **Phase 9** | Testing (unit, integration, UAT) |
| **Phase 10** | Deployment (Vercel + Railway + Neon) |

---

*End of PRD v1.3*
