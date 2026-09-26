# CaneMatrix — Sugar Factory ERP (Frontend)

A React frontend for the **CaneMatrix** Spring Boot backend — a sugar-factory / cooperative
management system covering farmer registration, sugarcane supply intake, share allocation,
share sugar & tonnes sugar entitlements, share transfers, festival sugar rules, factory rates
and Excel reporting.

Built for an MCA final-year project submission: React 19 + Vite + Tailwind CSS v4, React Router,
Axios, Recharts, and a custom design system (no generic admin-template look).

---

## 1. Prerequisites

- Node.js 18+ and npm
- The **CaneMatrix** Spring Boot backend running locally (default: `http://localhost:8080`)

## 2. Setup

```bash
cd canematrix-frontend
npm install
cp .env.example .env      # edit VITE_API_BASE_URL if your backend runs elsewhere
npm run dev                # starts on http://localhost:5173
```

Build for production:

```bash
npm run build      # outputs to dist/
npm run preview    # preview the production build locally
```

## 3. Backend configuration

The app expects the backend REST API at `VITE_API_BASE_URL` (default
`http://localhost:8080/api`), secured with JWT bearer tokens issued from
`POST /auth/login` (staff) and `POST /auth/farmer-login` (farmer self-service).

Make sure the backend's CORS configuration allows requests from
`http://localhost:5173` (the Vite dev server origin).

**Default admin login (as seeded by `AdminBootstrapConfig`):**
- Username: `admin`
- Password: `admin123`

## 4. Project structure

```
src/
  components/
    Layout.jsx          Sidebar + topbar app shell
    ui/index.jsx         Shared UI kit (Table, Modal, Button, Field, Badge, StatCard, ...)
  context/
    AuthContext.jsx       Login state, JWT storage, role helpers
  routes/
    ProtectedRoute.jsx    Auth + role-gated routing
  lib/
    api.js                Axios instance, interceptors, file-download helper
    services.js            One API-call module per backend controller
  pages/
    Login.jsx
    Dashboard.jsx
    farmers/               Farmer registry (CRUD + bank/nominee/farm plots)
    supply/                 Sugarcane supply intake, filters, summaries, receipts
    shareAllocation/        Share allocation CRUD
    shareSugar/              Share sugar allocation, lifting, history, receipts
    tonnesSugar/              Tonnes-based sugar allocation, history, receipts
    shareTransfer/             Share transfer requests & admin approval
    factoryRate/                 Factory rate publishing (admin) & history
    festivalSugar/                 Festival sugar rule master
    reports/                        Filtered Excel report downloads
```

## 5. Roles

| Role   | Access                                                              |
|--------|----------------------------------------------------------------------|
| ADMIN  | Full access, including publishing factory rates and approving/rejecting share transfers |
| CLERK  | All day-to-day data entry (farmers, supply, shares, transfers, reports) |
| FARMER | Self-service login (`farmer-login`) — read-only views scoped to their own records |

## 6. Role-based experience

- **Admin** — full operational console: Farmers, Supply, Share Allocation, Share Sugar,
  Tonnes Sugar, Share Transfer (create + approve/reject), Festival Sugar (manage),
  Factory Rates (publish), Reports.
- **Clerk** — same console minus publishing factory rates and reports remain admin/clerk
  only (matches the backend's `@PreAuthorize` rules); can still create share transfer requests.
- **Farmer** — a separate, scoped self-service portal (different sidebar entirely):
  My Dashboard, My Profile, My Cane Supply, My Shares & Sugar (view allocations, lift
  sugar, download receipts), Share Transfer Status (view only — the backend only allows
  clerk/admin to *create* a transfer request), plus read-only Festival Sugar and Factory
  Rate information. A farmer can never reach the admin/clerk pages (or vice versa) even
  by typing the URL directly — both route trees redirect back to `/`.

## 7. Important: apply the backend CORS fix

Six backend controllers were missing `@CrossOrigin`, which meant the **browser** silently
blocked those calls when the frontend runs on a different origin/port than the backend
(e.g. Vite on `:5173` calling Spring Boot on `:8080`) — even though Postman/curl worked
fine, since CORS is a browser-enforced restriction, not a server-side one.

**Affected (fixed) controllers:** `FarmerController`, `ShareAllocationController`,
`ShareSugarAllocationController`, `TonnesSugarAllocationController`,
`FestivalSugarMasterController`, `ReportController` — each now carries
`@CrossOrigin(origins = "*")`, matching the pattern already used on
`AuthController`, `SugarcaneSupplyController`, `ShareTransferController` and
`SugarFactoryRateController`.

Make sure you're running the **updated backend** (`CaneMatrix-Backend-CORSFIX.zip`) —
this is why "only Sugarcane Supply" appeared to work for Admin before: it was the
only module (besides Auth/Transfer/Rate) whose controller already had CORS enabled.

## 8. Notes for evaluators

- All list/detail screens call the live backend — no mock data.
- PDF receipts (supply receipt, sugar-lift receipt, transfer certificate) and Excel
  reports are streamed from the backend and downloaded via `Authorization: Bearer <token>`
  headers (see `downloadFile()` in `src/lib/api.js`).
- Tailwind v4 is configured via `@tailwindcss/vite` (CSS-first `@theme` tokens in
  `src/index.css`) — no `tailwind.config.js` needed.
