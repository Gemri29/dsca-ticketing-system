# Product Overview — DSCA IT Ticketing System

## Purpose
Internal IT support ticketing system for DSCA Contacting. Employees submit IT-related issues without an account; IT admins manage and resolve them via a protected portal. Super admins have full oversight, analytics, and admin management.

## Core Value Proposition
- Zero friction for employees — no sign-up or login required to submit a ticket
- Structured admin workspace with inbox, filters, SLA tracking, and activity timeline
- Ticket lookup via Ticket Code + Email (no account needed)
- No surprise infrastructure costs — all free-tier services (Neon, Cloudinary, Vercel, Railway)
- Ticket submission target: under 2 minutes for any user

## Key Features

### Public (No Auth)
- Ticket submission form with honeypot spam protection and rate limiting (5/hr per IP)
- Strict combobox for laptop/desktop asset selection — fetched from DB, no free-form input; selecting snaps to a chip with ✕ clear
- Priority selection via pill/badge buttons (Low / Medium / High / Critical) — not a dropdown
- Conditional "Other" issue textarea with amber warning banner (`bg-amber-50 border-amber-200`)
- File attachment upload (jpg/png/pdf, max 5MB) via Cloudinary — drag/click upload box with cloud icon
- Ticket tracking via Ticket Code + Email — returns safe public shape only
- Confirmation email on submit; status update email on status change (via Resend)
- "How it works" card shown on the right column alongside the form (numbered steps 1–4)
- Track My Ticket panel lives on the same page as the form — no separate page navigation needed

### Admin Portal
- JWT-authenticated dashboard with collapsible icon-only sidebar (collapses to 52px wide)
- Topbar: logo left, avatar initials + admin name + notification bell right
- Sidebar sections: Main (Dashboard + sub-counts, Inbox) and Account (Settings, Sign out)
- Stat cards (Pending / Unresolved / Resolved) double as filter buttons — clicking a card filters the list below
- Filter tabs below stat cards mirror the same filter for keyboard/accessibility users
- Inbox: single "Filter" button → dropdown panel with collapsible sub-menus (Status, Priority, Site); filters auto-apply on checkbox tick; active filters shown as removable chips; filter button turns blue with count badge when active
- Bulk action bar appears at top when rows are checked (Mark resolved / Reassign / Cancel)
- Ticket rows: submitter name + ticket code, laptop number, issue (truncated), site, status pill, priority pill
- Ticket detail: two-column layout — left (submitter info, issue details, attachment, activity timeline), right (action panel)
- SLA breach alert banner at the very top of ticket detail when threshold exceeded
- Status changed via three toggle buttons (Pending / Unresolved / Resolved) — not a dropdown
- Internal note field shows saved note; new note textarea below; Save note button (slate/dark button)
- Remark field uses amber-tinted background (`bg-amber-50 border-amber-200`) to distinguish from internal notes
- Activity timeline at bottom of left column — logs ticket submitted, assigned, note added, SLA breach
- Account settings: profile card (avatar initials, name, email, role badge), change password card, account info card (performance stats), danger zone card

### Super Admin Portal
- Purple accent (`#7c3aed`) distinguishes super admin views from regular admin views
- Logo icon and sidebar active states use purple instead of blue
- Tab switcher between Analytics and Admin Management (no separate pages, no route change)
- Analytics: date range dropdown + 4 stat cards + 4 charts (bar + donut) + admin performance table
  - Stat cards: Total tickets, Resolved, Avg. resolution time, SLA breaches
  - Charts: Tickets by site (bar), Tickets by issue type (donut), Tickets by status (bar), Tickets by priority (bar)
  - Admin performance table: name, assigned, resolved, avg time, resolution rate with mini progress bar
- Admin management: table with Edit / Deactivate / Reactivate per row; Add Admin opens a modal
  - Modal fields: Full name, Email, Temporary password, Role (dropdown)
  - Deactivation is toggle-based — no hard delete; inactive rows show "Reactivate" button

## Target Users
| Role | Description |
|---|---|
| Guest (Employee) | Submits tickets and tracks status — no account required |
| Admin (IT Staff) | Manages and resolves tickets assigned to them |
| Super Admin | Full system access — analytics, admin management, ticket override |

## Business Rules
- Email domain whitelist: `@dscacontacting.com` (enforced server-side via `ALLOWED_EMAIL_DOMAINS` env var)
- Laptop format: `DSCA-LAPTOP-XXX` (regex: `^DSCA-LAPTOP-[0-9]{3}$`)
- Desktop format: `DSCA-DESKTOP-XXX`
- Site locations: Moe, Dubai Mall, ADCB, JBR
- Issue categories: Internet Issue, Account Issue, Hardware Issue, Software Issue, Other
- SLA threshold: 48 hours — tickets not resolved beyond this are flagged (env: `SLA_THRESHOLD_HOURS`)
- Ticket codes: `TKT-XXXX` (4-digit random 1000–9999 with collision check loop)
- No hard deletes on admin accounts — deactivation only (preserves ticket history)
- Initial super admin: email `super_admin` / password `heisenberg` — seeded via `prisma/seed.js`, must change on first login
- Ticket list paginated at 25 per page; max 100 per request
- Login brute force: 10 failed attempts = 15 min lockout (shown as warning on login page)

## Success Metrics
- Ticket submission under 2 minutes
- Admins can view, assign, and update status without leaving the dashboard
- Users can retrieve ticket status at any time via Ticket Code + Email
- Zero surprise infrastructure costs at 1,000+ ticket volume

## Out of Scope (v1.0)
Mobile app, submitter accounts, live chat, email threading, dark mode, Slack/Teams webhooks, SLA auto-escalation, multi-language support.
