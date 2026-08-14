# IT Ticketing System — Project Conversation Log

**Date:** 2026-08-13  
**Status:** Active — Phase 4 next  
**Companion Docs:** PRD v1.3 · SDD v1.1

---

## Summary

This document is a compacted record of all decisions, clarifications, and outcomes from the project planning conversation. Use it as a quick reference instead of scrolling through the full chat.

---

## 1. Project Brief (Agreed)

An internal IT Ticketing System for DSCA Contacting. Employees submit tickets without an account. IT admins manage and resolve tickets via a protected portal. Super admin has full oversight.

**Core constraint:** 500+ users — no user accounts to avoid DB bloating. Solved via Ticket ID + Email lookup.

---

## 2. Tech Stack (Finalized)

| Layer | Choice | Reason |
|---|---|---|
| Frontend | React + Vite | Fast dev, industry standard |
| Styling | Tailwind CSS | Dashboard-friendly, rapid build |
| Backend | Node.js + Express | Lightweight, fits the scale |
| Database | PostgreSQL via **Neon** | Free, no pausing, no surprise billing |
| ORM | Prisma | Type-safe, great migrations |
| Auth | JWT in HttpOnly cookies | Secure session management |
| Email | Resend | Modern API, generous free tier |
| File storage | **Cloudinary** | Free 25GB, CDN delivery |
| Hosting FE | Vercel | Free tier, auto-deploy |
| Hosting BE | Railway | Free credit, Node-friendly |

**Why Neon over Supabase:** Supabase pauses free tier DBs after 1 week of inactivity. Neon doesn't. 1,000 ticket rows ≈ 2–5MB — well within free tier.

---

## 3. Resolved Configuration Values

| Item | Value |
|---|---|
| Email domain whitelist | `@dscacontacting.com` |
| Site locations | Moe, Dubai Mall, ADCB, JBR |
| Issue categories | Internet Issue, Account Issue, Hardware Issue, Software Issue, Other |
| Laptop number format | `DSCA-LAPTOP-XXX` (regex: `^DSCA-LAPTOP-[0-9]{3}$`) |
| SLA threshold | **48 hours** |
| Initial Super Admin | Email: `super_admin` / Password: `heisenberg` ⚠️ change on first login |
| File storage | Cloudinary (free tier) |

---

## 4. Security Decisions (Key Points)

- **SQL injection:** Prisma parameterized queries — safe by default. `$queryRaw` with string concat is explicitly banned.
- **JWT:** Stored in `HttpOnly + Secure + SameSite=Strict` cookie — not `localStorage`.
- **Mass assignment:** `req.body` never spread directly into Prisma. Explicit field whitelisting only.
- **File uploads:** MIME type validated server-side via `file-type` package. Max 5MB. Sent directly to Cloudinary — never touches server disk.
- **Rate limiting:** 5/hr submit, 10/15min login, 20/hr track — via `express-rate-limit`.
- **Honeypot:** Hidden `_trap` field on ticket form. Bots fill it, server silently rejects.
- **CORS:** Restricted to `FRONTEND_URL` env var only. `origin: "*"` is prohibited.
- **Helmet:** Applied globally for HTTP security headers.
- **Public ticket lookup:** Strips all admin-only fields (internalNote, email, full assignedTo). Only returns safe public shape.
- **Brute force:** 10 failed login attempts → 15 min lockout.
- Full checklist: PRD Section 5.5.14.

---

## 5. UI/UX Decisions (from Wireframes)

### Global
- White theme (`#fff` bg, `#f7f8fa` surfaces, `#2563eb` admin accent, `#7c3aed` super admin accent)
- All cards: white + `1px #e8e8e8` border + `border-radius: 12px`
- Sidebar: collapsible to icon-only on all portal pages

### Landing Page
- Form card: light gray `#f7f8fa` background (lifts off white page)
- Priority: pill badge buttons (not dropdown)
- Laptop number: **strict combobox** — type to filter from DB asset list, no free-form input
- "Other" issue: conditional textarea with amber warning banner
- Track My Ticket: lives on same page as form (no separate navigation)

### Admin Login
- Eye toggle on password
- Brute force warning shown upfront
- Security note at bottom

### Admin Dashboard
- Stat cards double as filter buttons
- SLA breach shown inline (red alarm icon)
- Unread: blue dot + bold name
- Default view: Pending

### Admin Inbox
- Single Filter button → dropdown with 3 collapsible sub-menus (Status / Priority / Site)
- **Auto-filter** on checkbox tick (no Apply button)
- Active filters shown as removable chips
- Bulk action bar on row selection

### Ticket Detail View
- Two-column layout (info + timeline left, action panel right)
- SLA alert banner at top when breached
- Status: three toggle buttons (not dropdown)
- Internal note: amber-tinted to distinguish from remark
- Activity timeline at bottom left

### Account Settings
- Role field disabled (Super Admin only can change)
- Personal performance stats shown in account info card
- Success toast on save (auto-dismiss 3s)

### Super Admin Portal
- Purple accent distinguishes from admin views
- Tab switcher: Analytics | Admin management
- Analytics: date range + 4 stat cards + 4 charts + admin performance table
- Admin mgmt: table with Edit / Deactivate / Reactivate; Add admin modal
- No hard delete — deactivation only (preserves ticket history)

---

## 6. New DB Table Added (from Wireframes)

The **strict combobox** for laptop number requires a registered asset list from the DB.

```prisma
model Laptop {
  id           String   @id @default(cuid())
  assetCode    String   @unique  // e.g. DSCA-LAPTOP-001
  assignedTo   String?
  siteLocation String?
  active       Boolean  @default(true)
  createdAt    DateTime @default(now())
}
```

This table is seeded with all registered laptop assets. The combobox on the ticket form fetches from `GET /api/laptops` (public, no auth required).

---

## 7. Phase Tracker

| Phase | Deliverable | Status |
|---|---|---|
| 1 | PRD | ✅ Done |
| 2 | System Design Doc + API Contract | ✅ Done |
| 3 | UI/UX Wireframes (7 screens) | ✅ Done |
| 4 | Dev Environment Setup | ⏳ Next |
| 5 | Backend — DB, API, auth, email | 🔲 |
| 6 | Frontend — Landing page + Track ticket | 🔲 |
| 7 | Frontend — Admin portal | 🔲 |
| 8 | Frontend — Super Admin portal | 🔲 |
| 9 | Testing | 🔲 |
| 10 | Deployment | 🔲 |

---

## 8. Wireframes Completed (Phase 3)

| # | Screen | Notes |
|---|---|---|
| 1 | Landing Page | Ticket form + Track My Ticket panel. White theme. Strict combobox for laptop. |
| 2 | Admin Login | Eye toggle, brute force warning, security note. |
| 3 | Admin Dashboard | Stat cards as filters, SLA inline, collapsible sidebar. |
| 4 | Admin Inbox | Compact filter button + nested sub-menus + auto-filter + chips. |
| 5 | Ticket Detail View | Two-column layout, activity timeline, toggle status buttons, remark + internal note. |
| 6 | Account Settings | Profile edit, password change, account info stats, danger zone. |
| 7 | Super Admin Portal | Analytics + Admin management tabs, purple accent, add admin modal. |

---

## 9. Open Items / Notes for Build

- Super admin seed credentials must be changed on first login — consider adding a `forcePasswordChange` boolean to the `User` model
- `Laptop` table needs to be seeded before the ticket form can be used
- `GET /api/laptops` needs to be added to the API contract in SDD
- Cloudinary account needs to be created and keys added to `.env` before Phase 5
- Resend account + domain verification needed before email flows can be tested

---

*End of Conversation Log*
