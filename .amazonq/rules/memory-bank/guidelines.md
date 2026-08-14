# Development Guidelines — DSCA IT Ticketing System

## Code Style & Formatting

### General
- ES module syntax (`import`/`export`) everywhere — no `require()` in either client or server
- Arrow functions for all components, controllers, middleware, and utilities
- `const` by default; `let` only when reassignment is needed
- Single quotes for strings in JS/JSX; template literals for interpolation
- Semicolons omitted in JSX/React files; present in server files — match the file's existing style
- Trailing commas in multi-line objects and arrays

### Naming Conventions
- React components: PascalCase (`LandingPage`, `TicketPreviewRow`)
- Functions, variables, hooks: camelCase (`handleSubmit`, `useTickets`, `filteredLaptops`)
- Constants/enums: SCREAMING_SNAKE_CASE (`ISSUE_TYPES`, `PRIORITIES`, `PENDING`)
- Files: camelCase for utilities/services/controllers (`ticketController.js`, `emailService.js`); PascalCase for React components (`LandingPage.jsx`)
- Prisma model fields: camelCase matching the schema exactly

### Comments
- Section dividers in controllers use `// ─────────────────────────────────────────────` followed by `// ROLE — METHOD /route`
- Inline comments used sparingly — only for non-obvious logic (e.g. `// Don't fail the request if email fails`)
- JSX sections use `{/* Section name */}` block comments

---

## Backend Patterns

### Controller Structure
Every controller function follows this exact pattern:
```js
export const functionName = async (req, res) => {
  // 1. Extract and validate inputs (early returns for missing/invalid fields)
  // 2. Authorization check (role/ownership)
  // 3. Business logic / DB queries
  // 4. Return structured response
  // Wrap all DB work in try/catch → 500 on unhandled error
}
```

### Response Shape
All responses use a consistent envelope:
```js
// Success
res.status(200).json({ success: true, data: ... })
res.status(201).json({ success: true, message: '...', resource: ... })

// Error
res.status(4xx).json({ success: false, message: 'Human-readable message.' })
res.status(400).json({ success: false, message: 'Validation failed.', errors: { field: 'msg' } })
res.status(500).json({ success: false, message: 'Internal server error.' })
```

### HTTP Status Code Reference
| Code | When Used |
|---|---|
| `200` | Successful GET / PATCH |
| `201` | Successful POST (ticket, user created) |
| `400` | Validation failure, wrong password |
| `401` | No valid JWT / not logged in |
| `403` | Authenticated but wrong role / not assigned to ticket |
| `404` | Ticket or user not found |
| `409` | Duplicate email on account creation |
| `429` | Rate limit exceeded |
| `500` | Unhandled exception |

### Field Whitelisting (Mass Assignment Prevention)
Never spread `req.body` into Prisma. Always destructure and whitelist:
```js
// ✅ Correct
const { status, remark, internalNote } = req.body
const updateData = {}
if (status) updateData.status = status.toUpperCase()
if (remark !== undefined) updateData.remark = remark
if (internalNote !== undefined) updateData.internalNote = internalNote

await prisma.ticket.update({ where: { id }, data: updateData })

// ❌ Never do this
await prisma.ticket.update({ where: { id }, data: req.body })
```

### Prisma Select — Minimal Field Exposure
Use `select` to return only needed fields, especially on User queries:
```js
prisma.user.findMany({
  select: { id: true, name: true, email: true, role: true, active: true, createdAt: true }
})
```
Never return the `password` field in any response.

### Role-Based Access Pattern
Admins are scoped to their own tickets; super admins see all:
```js
if (req.user.role === 'ADMIN') {
  where.assignedTo = req.user.id
}
// Super admin: no additional where clause needed
```

### Email Error Isolation
Email sending is always wrapped in its own try/catch — email failure must never fail the main request:
```js
try {
  await sendConfirmationEmail({ ... })
} catch (emailErr) {
  console.error('Confirmation email failed:', emailErr)
  // Don't fail the request if email fails — log and continue
}
```

### Input Normalization
- Strings trimmed: `name.trim()`, `email.trim().toLowerCase()`
- Enum values uppercased: `status.toUpperCase()`, `role.toUpperCase()`
- Optional fields: `customIssue?.trim() || null`

### Validation Pattern
Validators return `null` on success, an error string or errors object on failure:
```js
// Single field validator
export const validateEmail = (email) => {
  if (!email) return 'Email is required.'
  const domain = email.split('@')[1]
  if (!domain || !ALLOWED_DOMAINS.includes(domain)) return `Email must be from: ${ALLOWED_DOMAINS.join(', ')}`
  return null  // ← null = valid
}

// Multi-field validator
export const validateTicketFields = (body) => {
  const errors = {}
  if (!body.fullName?.trim()) errors.fullName = 'Full name is required.'
  const emailError = validateEmail(body.email)
  if (emailError) errors.email = emailError
  return Object.keys(errors).length > 0 ? errors : null
}
```

### Pagination Pattern
```js
const pageNum = Math.max(1, parseInt(page))
const limitNum = Math.min(100, Math.max(1, parseInt(limit)))
const skip = (pageNum - 1) * limitNum

const [items, total] = await Promise.all([
  prisma.model.findMany({ where, skip, take: limitNum, orderBy: { [sortField]: sortOrder } }),
  prisma.model.count({ where })
])

return res.status(200).json({
  success: true,
  items,
  pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) }
})
```

### Analytics — Parallel Queries
Use `Promise.all` for independent analytics queries to avoid sequential waterfall:
```js
const [totalTickets, byStatus, byIssueType, byPriority] = await Promise.all([
  prisma.ticket.count({ where }),
  prisma.ticket.groupBy({ by: ['status'], where, _count: { status: true } }),
  prisma.ticket.groupBy({ by: ['issueType'], where, _count: { issueType: true } }),
  prisma.ticket.groupBy({ by: ['priority'], where, _count: { priority: true } }),
])
```

### groupBy Result Formatting
```js
const formatGroup = (arr, key) =>
  arr.reduce((acc, item) => {
    acc[item[key]] = item._count[key]
    return acc
  }, {})
```

### Honeypot Middleware
Honeypot field `_trap` is silently rejected — return `200` (not `400`) to avoid tipping off bots:
```js
if (req.body._trap) return res.status(200).json({ success: true })
```

### Password Policy
- Minimum 8 characters, at least one number, at least one special character
- Hashed with bcrypt at minimum 12 salt rounds

---

## Frontend Patterns

### API Module Pattern
All HTTP calls live in `src/api/` — pages never call axios/fetch directly:
```js
const API = axios.create({ baseURL: '/api', withCredentials: true })

export const submitTicket = async (formData) => {
  const res = await API.post('/tickets', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return res.data  // ← always return res.data, not res
}
```

### Form State Pattern
Single `form` state object with a generic `handleChange`:
```js
const [form, setForm] = useState({ field1: '', field2: '', ... })

const handleChange = (e) => {
  const { name, value, files } = e.target
  if (name === 'attachment') {
    setForm(prev => ({ ...prev, attachment: files[0] }))
  } else {
    setForm(prev => ({ ...prev, [name]: value }))
  }
}
```

### Async Submit Pattern
```js
const handleSubmit = async (e) => {
  e.preventDefault()
  // client-side guard checks first (toast.error + return)
  setSubmitting(true)
  try {
    const res = await apiCall(data)
    // handle success
  } catch (err) {
    const errors = err.response?.data?.errors
    if (errors) {
      Object.values(errors).forEach(msg => toast.error(msg))
    } else {
      toast.error(err.response?.data?.message || 'Something went wrong.')
    }
  } finally {
    setSubmitting(false)
  }
}
```

### Combobox Pattern (Laptop/Desktop Asset Selector)
- Separate state: `query`, `dropdownOpen`, `selected` (null or string)
- `onBlur` uses `setTimeout(..., 150)` to allow `onMouseDown` to fire before blur closes the dropdown
- Selected state renders a chip (`bg-blue-50 border-blue-200 text-blue-700`) with ✕ clear button
- Unselected state renders the search input with dropdown list below
- Items sorted numerically by parsing the suffix: `parseInt(code.split('-').pop(), 10)`
- Dropdown list: `absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-auto`
- Empty state: centered gray text "No matching laptop found"
```js
const filteredLaptops = laptops
  .filter(l => l.assetCode.toLowerCase().includes(laptopQuery.toLowerCase()))
  .sort((a, b) => parseInt(a.assetCode.split('-').pop(), 10) - parseInt(b.assetCode.split('-').pop(), 10))
```

### Conditional Rendering
- Use early return for full-page alternate states (success screen, loading, error)
- Use inline conditional `{condition && <Component />}` for section-level toggles
- "Other" issue textarea: `{form.issueType === 'Other' && (...)}`

### Priority Pill Buttons
Priority uses pill buttons, not a dropdown. Active state drives color:
```jsx
className={`flex-1 py-1.5 rounded-full text-xs font-medium border transition-all ${
  form.priority === p
    ? p === 'LOW' ? 'bg-gray-100 text-gray-600 border-gray-300'
      : p === 'MEDIUM' ? 'bg-yellow-50 text-yellow-600 border-yellow-300'
      : p === 'HIGH' ? 'bg-orange-50 text-orange-600 border-orange-300'
      : 'bg-red-50 text-red-500 border-red-300'
    : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
}`}
```

### Toast Notifications
Use `react-hot-toast` for all user feedback:
- `toast.error(msg)` for validation and API errors
- `toast.success(msg)` for successful actions (auto-dismiss after ~3s)
- Never use `alert()` or `console.log` for user-facing messages

### Formatters (src/utils/formatters.jsx)
```js
formatDate(dateStr)          // "7 Aug 2026"
formatDateTime(dateStr)      // "7 Aug 2026, 09:00"
formatTimeAgo(dateStr)       // "5m ago", "2h ago", "Yesterday", "3d ago"
formatStatus(status)         // "PENDING" → "Pending"
formatPriority(priority)     // "HIGH" → "High"
isSLABreached(createdAt, status, thresholdHours = 48)  // returns boolean
```

---

## Tailwind CSS Conventions

### Design Tokens (use these, don't invent new ones)
| Token | Value | Usage |
|---|---|---|
| Page background | `bg-white` | All pages |
| Surface/card background | `bg-gray-50` / `#f7f8fa` | Form cards, panels |
| Card border | `border border-gray-200 rounded-xl` | All cards |
| Admin accent | `blue-600` / `#2563eb` | Buttons, focus rings, links, sidebar active |
| Super admin accent | `purple-600` / `#7c3aed` | Super admin portal — logo, sidebar active, buttons |
| Warning/amber | `bg-amber-50 border-amber-200 text-amber-700` | Internal notes, "Other" issue banner, remark field |
| Success | `bg-green-50 border-green-200 text-green-700` | Success states, resolved status |
| Error/SLA | `bg-red-50 border-red-200 text-red-500` | SLA breach, errors, unresolved status |
| Pending/orange | `bg-orange-50 border-orange-200 text-orange-600` | Pending status |
| Selected chip | `bg-blue-50 border-blue-200 text-blue-700` | Combobox selected state |
| Internal note saved | `bg-gray-50 border-l-3 border-gray-300` | Saved note display block |

### Standard Class Strings
```
# Input field
w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:border-blue-500

# Label
block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1

# Primary button (admin blue)
px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all

# Primary button (super admin purple)
px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all

# Secondary/ghost button
px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50

# Full-width submit button
w-full py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all

# Save note button (slate)
w-full py-2 rounded-lg bg-slate-600 text-white text-sm font-medium hover:bg-slate-700
```

### Sidebar Specs (from wireframe)
- Expanded width: `220px` / Collapsed width: `52px` — transition on width
- Active item (admin): `bg-blue-50 text-blue-600 border-l-[3px] border-blue-600`
- Active item (super admin): `bg-purple-50 text-purple-600 border-l-[3px] border-purple-600`
- Sidebar label text: `text-[10px] font-medium text-gray-300 uppercase tracking-[0.06em]`
- Collapsed: labels opacity-0, item text opacity-0 width-0, sub-menus hidden

### Status Pill Colors
```
PENDING    → bg-orange-50 text-orange-600 border border-orange-200
UNRESOLVED → bg-red-50 text-red-500 border border-red-200
RESOLVED   → bg-green-50 text-green-600 border border-green-200
```

### Priority Pill Colors
```
CRITICAL → bg-red-50 text-red-500 border border-red-200
HIGH     → bg-orange-50 text-orange-600 border border-orange-200
MEDIUM   → bg-yellow-50 text-yellow-600 border border-yellow-200
LOW      → bg-gray-50 text-gray-500 border border-gray-200
```

### Ticket Detail Layout (from wireframe)
- Two-column grid: `grid-template-columns: 1fr 340px`
- Left column: submitter info card, issue details card, attachment card, activity timeline card
- Right column: ticket actions card (status toggle buttons, assign select, internal note, remark, resolve button)
- SLA alert banner: full-width above the two-column grid, `bg-red-50 border border-red-200 text-red-600`
- Status toggle buttons: 3-column grid, active state changes border+bg+text color per status
- Internal note save button: slate/dark (`bg-slate-600`) to distinguish from primary resolve button
- Resolve button: `bg-green-600 hover:bg-green-700` full width at bottom of action card

### Account Settings Layout (from wireframe)
- 2-column grid, max-width 860px
- Profile card: full-width (`grid-column: 1 / -1`), avatar initials circle, name/email/role badge
- Role field: always `disabled` with hint "Role can only be changed by a Super Admin"
- Danger zone card: full-width, `border-red-200`, sign out button only (no delete)
- Success toast: `bg-green-50 border-green-200 text-green-700`, auto-dismiss after 3s

### Super Admin Analytics (from wireframe)
- 4 stat cards in a row: Total tickets, Resolved, Avg. resolution time, SLA breaches
- Charts grid: 2×2, each chart in a white card with `border border-gray-200 rounded-xl`
- Bar chart rows: label (right-aligned, 80px wide) + track + value
- Donut chart: SVG with legend to the right
- Admin performance table: name with avatar initials, assigned, resolved, avg time, resolution rate with mini progress bar
- Mini progress bar fill color: purple (`#7c3aed`) for super admin context

---

## Security Rules (Non-Negotiable)

1. `req.body` is never spread into Prisma — explicit field whitelisting only
2. `prisma.$queryRaw` with string concatenation is banned — use parameterized tagged template literals only
3. JWT stored in HttpOnly cookie only — never `localStorage` or `sessionStorage`
4. Cookies set with `Secure`, `SameSite=Strict` flags
5. `dangerouslySetInnerHTML` is prohibited — React's default escaping is relied upon
6. File uploads go directly to Cloudinary — never written to server disk
7. CORS `origin: "*"` is prohibited — always use `process.env.FRONTEND_URL`
8. Email domain validated server-side regardless of frontend validation
9. `password` field never included in any Prisma `select` response shape
10. Public ticket lookup always goes through `publicTicketShape()` — never returns raw ticket
11. Honeypot rejection returns `200` (not `400`) to avoid tipping off bots
12. File MIME type validated from buffer via `file-type` — not from file extension

### Public Ticket Shape (what /track returns)
```js
// ✅ Safe — publicTicketShape() output
{ ticketCode, status, issueType, customIssue, priority, createdAt, updatedAt,
  assignedAdminFirstName,  // first name only
  remark                   // only if status === 'RESOLVED'
}

// ❌ Never exposed publicly
// email, fullName, laptopNumber, internalNote, assignedTo (full ID)
```

---

## Schema Notes (Live Deviations from PRD/SDD)

- `siteLocation` was removed from `Ticket` model (migration `20260814141441_removed_site_location`) — replaced by free-text `siteName` field in the form
- `Desktop` model added alongside `Laptop` — identical schema shape (`id`, `assetCode`, `assignedTo`, `active`, `createdAt`)
- `GET /api/tickets/desktops` is a public endpoint (no auth) — same pattern as `/api/tickets/laptops`
- **Known bug**: `getDesktops` controller currently queries `prisma.laptop` (not `prisma.desktop`) — needs to be fixed
- PRD/SDD schema shows `siteLocation` on `Laptop` model — live schema does not have this field
