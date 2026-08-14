# Project Structure — DSCA IT Ticketing System

## Repository Layout
Monorepo with two independent packages (`client/` and `server/`) plus documentation.

```
DSCA-Ticketing-System/
├── client/                        # React + Vite frontend
│   ├── public/                    # Static assets (favicon, icons, cloud-computing.png)
│   ├── src/
│   │   ├── api/                   # Axios call modules — one file per domain
│   │   │   ├── tickets.js         # Public ticket submit + track + laptops + desktops
│   │   │   ├── auth.js            # Login / logout / me calls
│   │   │   └── admin.js           # Admin + super admin API calls
│   │   ├── components/            # Reusable UI components
│   │   │   ├── PriorityBadge.jsx
│   │   │   ├── StatusBadge.jsx
│   │   │   ├── TicketPreviewRow.jsx
│   │   │   ├── Sidebar.jsx        # Collapsible icon-only sidebar (collapses to 52px)
│   │   │   └── ProtectedRoute.jsx # Role-based route guard
│   │   ├── context/
│   │   │   └── AuthContext.jsx    # JWT role + user state (React Context)
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   └── useTickets.js
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx    # Ticket form + Track My Ticket panel + How it works
│   │   │   ├── LoginPage.jsx      # Admin login with eye toggle + brute force warning
│   │   │   ├── TrackTicket.jsx
│   │   │   ├── admin/
│   │   │   │   ├── Dashboard.jsx  # Stat cards as filters, SLA inline, Gmail-style rows
│   │   │   │   ├── Inbox.jsx      # Filter dropdown, chips, bulk actions
│   │   │   │   ├── TicketDetail.jsx # Two-column layout, timeline, toggle status buttons
│   │   │   │   └── Settings.jsx   # Profile + performance stats + danger zone
│   │   │   └── superadmin/
│   │   │       ├── Analytics.jsx  # Date range + 4 stat cards + 4 charts + perf table
│   │   │       └── AdminManagement.jsx # Admin CRUD table + Add Admin modal
│   │   ├── utils/
│   │   │   └── formatters.jsx     # formatDate, formatDateTime, formatTimeAgo, formatStatus, formatPriority, isSLABreached
│   │   ├── App.jsx                # Router setup + route definitions
│   │   └── main.jsx               # React entry point
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── server/                        # Node.js + Express backend
│   ├── prisma/
│   │   ├── schema.prisma          # DB models: Ticket, User, Laptop, Desktop + enums
│   │   ├── seed.js                # Seeds super admin account
│   │   └── migrations/            # Prisma migration history
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── ticketController.js  # submitTicket, trackTicket, getTickets, getTicketById, updateTicket, assignTicket, getLaptops, getDesktops
│   │   │   ├── authController.js    # login, logout, me
│   │   │   └── adminController.js   # getAdminUsers, createAdminUser, updateAdminUser, getAnalytics
│   │   ├── middleware/
│   │   │   ├── isAuthenticated.js   # Verifies JWT from HttpOnly cookie → attaches req.user
│   │   │   ├── hasRole.js           # Checks role claim on JWT payload
│   │   │   ├── rateLimiter.js       # Per-route express-rate-limit configs
│   │   │   ├── uploadHandler.js     # multer + file-type MIME validation
│   │   │   └── honeypot.js          # Silently rejects filled _trap field (returns 200)
│   │   ├── routes/
│   │   │   ├── tickets.js
│   │   │   ├── auth.js
│   │   │   └── admin.js
│   │   ├── services/
│   │   │   ├── emailService.js      # Resend — sendConfirmationEmail + sendStatusUpdateEmail
│   │   │   ├── uploadService.js     # Cloudinary upload integration
│   │   │   └── ticketCodeService.js # TKT-XXXX generator with collision check loop
│   │   ├── utils/
│   │   │   ├── prismaClient.js      # Singleton Prisma client
│   │   │   ├── publicTicketShape.js # Strips admin-only fields for public /track response
│   │   │   └── validators.js        # validateEmail, validateLaptopNumber, validateTicketFields, validatePasswordStrength
│   │   └── app.js                   # Express app setup (helmet, cors, cookie-parser, routes)
│   └── server.js                    # Entry point — starts HTTP server
│
├── overview/                      # Project documentation (source of truth)
│   ├── IT_Ticketing_System_PRD.md   # v1.3 — finalized product requirements
│   ├── IT_Ticketing_System_SDD.md   # v1.1 — system design + full API contract
│   └── IT_Ticketing_System_ConversationLog.md
│
└── UI/                            # HTML wireframes (reference for layout/styling)
    ├── landing_page/
    │   └── landing_page.html        # Form + combobox + priority pills + side panel
    ├── admin_page/
    │   ├── admin_login_wireframe.html
    │   ├── admin_dashboard_wireframe.html
    │   ├── admin_inbox.html
    │   ├── ticket_detail_wireframe.html
    │   └── account_settings_wireframe.html
    └── super_admin_page/
        └── super_admin_wireframe.html  # Analytics + Admin management tabs
```

## Database Models
| Model | Key Fields | Purpose |
|---|---|---|
| `Ticket` | ticketCode, fullName, email, laptopNumber, siteName, issueType, customIssue, priority, attachment, status, remark, internalNote, assignedTo | Core ticket record |
| `User` | email, name, password (bcrypt), role, active | Admin/Super Admin accounts |
| `Laptop` | assetCode, assignedTo, active | Registered laptop assets — powers combobox |
| `Desktop` | assetCode, assignedTo, active | Registered desktop assets — powers combobox |

## Enums
| Enum | Values |
|---|---|
| `Status` | `PENDING`, `UNRESOLVED`, `RESOLVED` |
| `Priority` | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` |
| `Role` | `ADMIN`, `SUPER_ADMIN` |

## Frontend Route Map
| Path | Page | Auth | Role |
|---|---|---|---|
| `/` | Landing Page | ❌ | — |
| `/track` | Track My Ticket | ❌ | — |
| `/login` | Admin Login | ❌ | — |
| `/admin/dashboard` | Dashboard | ✅ | ADMIN, SUPER_ADMIN |
| `/admin/inbox` | Inbox | ✅ | ADMIN, SUPER_ADMIN |
| `/admin/tickets/:id` | Ticket Detail | ✅ | ADMIN, SUPER_ADMIN |
| `/admin/settings` | Account Settings | ✅ | ADMIN, SUPER_ADMIN |
| `/superadmin/analytics` | Analytics | ✅ | SUPER_ADMIN |
| `/superadmin/admins` | Admin Management | ✅ | SUPER_ADMIN |

## API Route Summary
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/login` | ❌ | Login — sets HttpOnly JWT cookie |
| POST | `/auth/logout` | ✅ | Logout — clears cookie |
| GET | `/auth/me` | ✅ | Current session user |
| POST | `/tickets` | ❌ | Submit ticket (multipart/form-data) |
| GET | `/tickets/track` | ❌ | Track ticket by email + code |
| GET | `/tickets/laptops` | ❌ | List active laptops for combobox |
| GET | `/tickets/desktops` | ❌ | List active desktops for combobox |
| GET | `/tickets` | ADMIN+ | Paginated ticket list |
| GET | `/tickets/:id` | ADMIN+ | Single ticket detail |
| PATCH | `/tickets/:id` | ADMIN+ | Update status/remark/internalNote |
| PATCH | `/tickets/:id/assign` | SUPER_ADMIN | Assign ticket to admin |
| GET | `/users/me` | ADMIN+ | Own profile |
| PATCH | `/users/me` | ADMIN+ | Update own profile/password |
| GET | `/admin/users` | SUPER_ADMIN | List all admin accounts |
| POST | `/admin/users` | SUPER_ADMIN | Create admin account |
| PATCH | `/admin/users/:id` | SUPER_ADMIN | Update admin (name/role/active) |
| GET | `/admin/analytics` | SUPER_ADMIN | Analytics data with date range |

## Middleware Flow

### Public Routes
```
Request → helmet() → cors() → rateLimiter → honeypot() [submit only] → Controller
```

### Protected Routes
```
Request → helmet() → cors() → isAuthenticated() [401 on fail] → hasRole() [403 on fail] → Controller
```

## Architectural Patterns
- **Controller → Service → Prisma** layering: routes call controllers, controllers call services for email/upload/code generation
- **Two-middleware auth chain**: `isAuthenticated` then `hasRole` on every protected route — backend is the enforcing layer
- **Explicit field whitelisting**: `req.body` never spread into Prisma; each endpoint lists permitted fields explicitly
- **Public shape utility**: `publicTicketShape.js` strips admin-only fields before any public `/track` response
- **API module pattern**: all axios calls isolated in `src/api/` — pages never call axios directly
- **AuthContext**: single source of truth for JWT role and user state across the app

## Live Schema Deviations from PRD/SDD
- `siteLocation` removed from `Ticket` model (migration `20260814141441_removed_site_location`) — replaced by free-text `siteName` field
- `Desktop` model added alongside `Laptop` — identical schema shape
- `GET /api/tickets/desktops` is public (no auth) — same pattern as laptops
- **Known bug**: `getDesktops` controller currently queries `prisma.laptop` instead of `prisma.desktop`
