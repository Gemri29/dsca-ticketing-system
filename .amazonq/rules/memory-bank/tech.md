# Tech Stack — DSCA IT Ticketing System

## Stack Summary
| Layer | Technology | Version |
|---|---|---|
| Frontend framework | React | ^19.2.8 |
| Frontend build | Vite | ^8.2.0 |
| Styling | Tailwind CSS | ^3.4.19 |
| Routing | React Router DOM | ^7.18.2 |
| HTTP client | Axios | ^1.19.0 |
| Toast notifications | react-hot-toast | ^2.6.0 |
| Backend runtime | Node.js (ESM) | — |
| Backend framework | Express | ^5.2.1 |
| ORM | Prisma | ^7.9.1 |
| Prisma adapter | @prisma/adapter-pg | ^7.9.1 |
| Database driver | pg | ^8.23.0 |
| Database | PostgreSQL via Neon | — |
| Auth — tokens | jsonwebtoken | ^9.0.3 |
| Auth — hashing | bcrypt | ^6.0.0 |
| Email | Resend | ^6.19.0 |
| File storage | Cloudinary | ^2.10.0 |
| File upload | multer | ^2.2.0 |
| MIME validation | file-type | ^22.0.1 |
| Rate limiting | express-rate-limit | ^8.6.2 |
| Security headers | helmet | ^8.3.0 |
| CORS | cors | ^2.8.6 |
| Cookie parsing | cookie-parser | ^1.4.7 |
| Env vars | dotenv | ^17.4.2 |
| Dev server | nodemon | ^3.1.14 |
| Frontend hosting | Vercel | — |
| Backend hosting | Railway | — |

## Module System
Both `client/` and `server/` use `"type": "module"` — ES module syntax (`import`/`export`) throughout. No CommonJS `require()`.

## Development Commands

### Client (`cd client`)
```bash
npm run dev        # Vite dev server on http://localhost:5173
npm run build      # Production build to dist/
npm run preview    # Preview production build
npm run lint       # ESLint check
```

### Server (`cd server`)
```bash
npm run dev        # nodemon server.js (auto-restart on change)
npm run start      # node server.js (production)
npm run seed       # node prisma/seed.js (seeds super admin)
```

### Prisma
```bash
npx prisma migrate dev     # Create and apply new migration
npx prisma migrate deploy  # Apply migrations in production
npx prisma studio          # GUI DB browser
npx prisma generate        # Regenerate Prisma client after schema change
```

## Environment Variables

### Server (`server/.env`)
```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://user:password@neon-host/dbname
JWT_SECRET=your_jwt_secret_min_32_chars
JWT_EXPIRES_IN=8h
COOKIE_SECRET=your_cookie_secret
FRONTEND_URL=http://localhost:5173
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=it-support@dscacontacting.com
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
ALLOWED_EMAIL_DOMAINS=dscacontacting.com
LAPTOP_NUMBER_REGEX=^DSCA-LAPTOP-[0-9]{3}$
SLA_THRESHOLD_HOURS=48
RATE_LIMIT_WINDOW_MS=3600000
RATE_LIMIT_SUBMIT_MAX=5
RATE_LIMIT_LOGIN_MAX=10
RATE_LIMIT_TRACK_MAX=20
```

### Client (`client/src/.env`)
```env
VITE_API_BASE_URL=http://localhost:3000/api
```

## Security Dependencies
| Package | Purpose |
|---|---|
| `helmet` | HTTP security headers — CSP, HSTS, X-Frame-Options: DENY, X-Content-Type-Options, Referrer-Policy |
| `express-rate-limit` | Per-route rate limiting: submit 5/hr, login 10/15min, track 20/hr |
| `file-type` | Server-side MIME type validation from buffer — not from file extension |
| `bcrypt` | Password hashing — minimum 12 salt rounds |
| `jsonwebtoken` | JWT generation and verification |
| `cookie-parser` | Parses HttpOnly cookies on incoming requests |

## Rate Limits (from PRD §5.5.7)
| Endpoint | Limit | Window |
|---|---|---|
| `POST /tickets` | 5 requests / IP | 1 hour |
| `POST /auth/login` | 10 requests / IP | 15 minutes |
| `GET /tickets/track` | 20 requests / IP | 1 hour |

## Key Config Files
| File | Purpose |
|---|---|
| `client/tailwind.config.js` | Tailwind content paths |
| `client/vite.config.js` | Vite + React plugin config |
| `client/postcss.config.js` | PostCSS for Tailwind |
| `server/prisma/schema.prisma` | DB schema — source of truth for models and enums |
| `server/prisma/seed.js` | Seeds initial super admin account |
| `server/src/app.js` | Express app setup — helmet, cors, routes mounted here |
| `server/server.js` | Entry point — starts HTTP server |
| `server/prisma.config.ts` | Prisma config |

## Infrastructure (All Free Tier)
| Service | Provider | Notes |
|---|---|---|
| Database | Neon (PostgreSQL) | No pausing, no auto-billing |
| File storage | Cloudinary | 25GB storage, 25GB bandwidth/month |
| Frontend hosting | Vercel | 99.9% uptime SLA, auto-deploy from Git |
| Backend hosting | Railway | Node backend hosting |
| Email | Resend | Transactional email |

## UI Wireframe Reference
The `UI/` folder contains HTML wireframes that define the exact layout, spacing, color values, and component behavior. Always consult these before building any page:
| File | Page |
|---|---|
| `UI/landing_page/landing_page.html` | Ticket form, combobox, priority pills, side panel |
| `UI/admin_page/admin_login_wireframe.html` | Login card, eye toggle, brute force warning |
| `UI/admin_page/admin_dashboard_wireframe.html` | Stat cards, sidebar, ticket rows, SLA flag |
| `UI/admin_page/admin_inbox.html` | Filter dropdown, chips, bulk bar, pagination |
| `UI/admin_page/ticket_detail_wireframe.html` | Two-column layout, timeline, action panel |
| `UI/admin_page/account_settings_wireframe.html` | Profile card, password card, account info, danger zone |
| `UI/super_admin_page/super_admin_wireframe.html` | Analytics tabs, charts, admin management table, modal |
