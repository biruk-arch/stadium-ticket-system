# Stadium Ticket Reservation System

A full-stack implementation of the Dire Dawa Stadium Ticket Management System
described in the accompanying thesis: a React frontend, a Node.js/Express
REST API, and a MySQL database, covering the five actor roles and use cases
from the requirements/design chapters (Fan, Box Office Staff, Gate Scanner
Officer, Stadium Administrator, Sport Commission Officer).

This was built directly against the thesis's own data model (Chapter 4,
"Persistent Data Management") and use-case tables (Chapter 3), continuing
work already scaffolded in this repo (schema, seed data, and the auth/event/
seat controllers). Everything else — reservations, payments, ticket
generation & QR validation, attendance/gate logging, reports, and the entire
frontend — was completed to match those same conventions.

## What's implemented

| Actor | Capabilities |
|---|---|
| **Fan** | Register/login, browse scheduled matches, pick a seat on a live seat map, reserve it (10-minute hold), pay via Telebirr or CBE Birr, receive a QR e-ticket, view "My Tickets" |
| **Box Office Staff** | Walk-in sale flow: pick a match → hold a seat → take cash/Telebirr/CBE Birr payment → hand over the e-ticket |
| **Gate Scanner Officer** | Validate tickets by camera (QR scan) or manual code entry; duplicate/invalid tickets are instantly flagged and logged |
| **Stadium Administrator** | Dashboard (revenue, tickets issued, live entries), create/manage matches, configure seat sections & pricing, manage staff accounts, view reports |
| **Sport Commission Officer** | Read-only access to sales reports and the gate log |

### A few intentional additions beyond the thesis text
- **`cash`** was added as a third payment method (alongside the thesis's
  Telebirr/CBE Birr) so the Box Office Staff walk-in flow — explicitly named
  in the CRC card — actually has a way to record a cash sale.
- **Seat locking**: reserving a seat holds it for `SEAT_LOCK_MINUTES` (10 by
  default) so a fan can complete payment before someone else grabs it. It's
  released automatically if payment doesn't happen in time (checked lazily,
  no cron needed).
- Payment "verification" is **simulated**: the system doesn't call a live
  Telebirr/CBE Birr API (no sandbox this project has credentials for). It
  records the transaction reference the fan/staff member supplies, exactly as
  the thesis describes the flow. Swapping in a real gateway call is isolated
  to `backend/controllers/paymentController.js`.

## Tech stack
- **Backend**: Node.js, Express, MySQL (`mysql2`), JWT auth, `bcryptjs`, `qrcode`
- **Frontend**: React 18 (Vite), React Router, Tailwind CSS, `qrcode.react`, `html5-qrcode`
- **Database**: MySQL 8 / MariaDB 10.11+ (tested against MariaDB during development)

## Project structure
```
backend/
  config/db.js            MySQL connection pool
  database/schema.sql     Full DDL (run this first)
  database/seed.js        Seeds demo accounts + two sample matches
  controllers/            One file per resource (auth, event, seat, reservation, payment, ticket, attendance, report, user)
  routes/                 Express routers, mounted in server.js
  middleware/auth.js      JWT verification + role-based authorize()
  utils/qrcode.js         Ticket code + QR image generation
  server.js               App entry point

frontend/
  src/api/client.js       Axios instance (attaches JWT, handles 401s)
  src/context/AuthContext.jsx
  src/components/         NavBar, SeatMap, TicketStub (the e-ticket), StatCard, ProtectedRoute
  src/pages/              Login, Register, fan/, boxoffice/, gate/, admin/
```

## Setup

### 1. Database
```bash
mysql -u root -p < backend/database/schema.sql
```
This creates the `stadium_ticket_system` database and all tables (users,
events, seats, reservations, payments, tickets, attendance).

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env      # then fill in your DB credentials + a JWT secret
npm run seed               # creates 5 demo accounts + 2 sample matches with seats
npm run dev                 # starts the API on http://localhost:5000
```

Demo accounts created by the seed script (all use password `Password123!`):

| Role | Email |
|---|---|
| Fan | `fan@example.com` |
| Box Office Staff | `boxoffice@example.com` |
| Gate Scanner Officer | `gate@example.com` |
| Stadium Administrator | `admin@example.com` |
| Sport Commission Officer | `commission@example.com` |

### 3. Frontend
```bash
cd frontend
npm install
npm run dev                 # starts on http://localhost:5173, proxies /api to :5000
```

Open `http://localhost:5173`, log in with any demo account above, and you'll
land on the right dashboard for that role.

### Running end-to-end
1. Log in as `admin@example.com` → **Manage Events** → open one of the seeded
   matches → add a seat section if you want more inventory.
2. Log in as `fan@example.com` → **Matches** → pick a match → click a seat →
   **Reserve & Continue to Payment** → choose Telebirr/CBE Birr and enter any
   reference number → you'll get a QR e-ticket immediately.
3. Log in as `gate@example.com` → **Gate Scanner** → paste the ticket's QR
   code (or use "Start Camera" and point it at the QR on **My Tickets**) →
   entry is granted the first time, denied as a duplicate on a second scan.
4. Log in as `admin@example.com` again → **Reports** to see the sale and the
   gate entry reflected.

## Notes for deployment
- Set a strong, random `JWT_SECRET` in production — the `.env.example` value
  is a placeholder only.
- The frontend's `VITE_API_BASE_URL` only needs to be set in production,
  where the frontend and backend are served from different origins; in dev
  the Vite proxy handles it.
- `backend/database/schema.sql` is idempotent (`CREATE TABLE IF NOT EXISTS`)
  and safe to re-run.
