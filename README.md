# Apparel ERP — Next.js

A modular, feature-sliced **Next.js (App Router) + TypeScript** ERP, converted
from the original `Apparel ERP` HTML prototype. Styled with the **Systems
Limited** design system (Nunito Sans, orange `#F36523` action color, navy
structural bands).

> **Note on data:** every screen is backed by an **in-memory mock store** (no
> backend required). TanStack Query treats it exactly like a real API —
> loading states, caching, refetch and optimistic create all work.

---

## Stack

| Concern | Library |
|---|---|
| Framework | Next.js 14 (App Router) + React 18 + TypeScript |
| Styling | Tailwind CSS + shadcn/ui primitives |
| Server state | **TanStack Query** (`@tanstack/react-query`) |
| Data grids | **TanStack Table** (`@tanstack/react-table`) — sort, filter, paginate |
| Forms & validation | **React Hook Form + Zod** (`@hookform/resolvers`) |
| Charts | **Recharts** (dashboard bars + donuts) |
| Icons | `lucide-react` |

## Getting started

```bash
npm install      # or pnpm install / yarn
npm run dev      # http://localhost:3000  → redirects to /dashboard/overview
npm run typecheck
npm run build
```

## Architecture

The app is organized **by feature module**, not by file type. Each ERP area
(catalog, inventory, sales, …) owns its data, API, hooks, schema, types and
table columns under `src/modules/<module>/`.

```
src/
├── app/
│   ├── layout.tsx                 # root layout, fonts, <Providers>
│   ├── providers.tsx              # TanStack QueryClientProvider
│   ├── page.tsx                   # → redirect to /dashboard/overview
│   ├── not-found.tsx
│   └── (erp)/
│       ├── layout.tsx             # app shell: sidebar rail + topbar
│       └── [module]/[tab]/page.tsx# ONE dynamic route serves every screen
│
├── components/
│   ├── ui/                        # shadcn/ui primitives (button, card, table…)
│   ├── shell/                     # sidebar-rail, topbar, page-header
│   ├── screens/                   # generic renderers (see below)
│   ├── icon.tsx                   # lucide name → component
│   └── tone-badge.tsx             # status pill
│
├── config/
│   └── navigation.ts              # MODULES: the rail + tab map (source of truth)
│
├── lib/
│   ├── screen-types.ts            # Cell / ListConfig / DashboardConfig / BoardConfig
│   ├── build-columns.tsx          # ListConfig columns → TanStack ColumnDef[]
│   ├── tone.ts                    # badge tones, avatar color/initials
│   ├── mock-fetch.ts              # Promise + latency wrapper for the mock store
│   ├── use-screen.ts              # generic screen query (via the registry)
│   └── utils.ts                   # cn()
│
└── modules/
    ├── registry.ts                # aggregates every module's public surface
    ├── catalog/
    │   ├── data.ts                # in-memory store (the ported mock data)
    │   ├── api.ts                 # fetchScreen(tab) / listTabs()
    │   ├── hooks.ts               # useCatalogScreen(tab) — TanStack Query
    │   ├── schema.ts              # Zod schemas + getSchema(tab)
    │   ├── types.ts               # z.infer types + shared row types
    │   ├── columns.ts             # getColumns(tab) — TanStack Table defs
    │   └── index.ts               # barrel
    ├── inventory/  …same shape
    ├── sales/      …
    └── … (12 modules total)
```

### How a screen renders

1. `app/(erp)/[module]/[tab]/page.tsx` resolves the module + tab from
   `config/navigation.ts` and renders `<PageHeader>` + `<ScreenRenderer>`.
2. `ScreenRenderer` calls `useScreen(module, tab)` → `registry.fetchScreen()` →
   the owning module's `api.fetchScreen()` → its in-memory `data.ts`.
3. Based on the screen `kind` it renders one of the generic views:
   - **`list`** → `DataTable` (TanStack Table) + a `Sheet` create form
     (`AutoForm`, driven by the module's Zod schema via React Hook Form).
   - **`dashboard`** → `DashboardView` (Recharts bars + donut, metric tiles,
     activity feed).
   - **`board`** → `BoardView` (kanban columns).
   - **`settings`** → `SettingsView` (toggle groups).

### Adding a module

1. Add it to `MODULES` in `config/navigation.ts`.
2. Create `src/modules/<module>/` following the file shape above (copy any
   existing module as a template).
3. Register it in `src/modules/registry.ts`.

### Wiring a real backend

Replace each module's `api.ts` `fetchScreen` (and add mutations) to call your
HTTP layer instead of `mockFetch(screens[tab])`. The hooks, tables, forms and
views don't change — they already speak TanStack Query.

## Modules included

Dashboards · Catalog · Inventory · Sales & Orders · Procurement · Finance ·
Production · Quality · Shipments · Channels · AI Insights · Admin.

## Interactions wired

- **Clickable rows → detail slide-over.** Products, Orders, Invoices,
  Customers, Suppliers, Vendor Scorecards, Goods Receipts, Journal Entries,
  Inspections, Shipments and AI Reports open a right-hand `RecordDetail` sheet
  (variant matrix, line items + totals, fulfillment/payment timelines, ledger,
  scorecards, AI report narrative…). Wiring lives in `config/detail-types.ts`;
  content in `modules/detail/detail-data.ts` + `components/screens/record-detail.tsx`.
- **Quick create (`+`)** opens a panel of shortcuts that route to the right
  module/tab (`config/topbar-data.ts → QUICK_CREATE`).
- **Notifications (bell)** opens a feed with unread states
  (`config/topbar-data.ts → NOTIFICATIONS`).
- **Create forms** — every list with a Zod schema opens a validated
  React-Hook-Form sheet from its "New …" button.

## Status & remaining work

**Done:** full module architecture, app shell (rail + tabs + topbar), all 12
modules' data/api/hooks/schema/types/columns, generic List/Dashboard/Board/
Settings renderers, TanStack Query + Table, Recharts dashboards, RHF+Zod create
forms, row→detail drill-downs, notifications & quick-create.

**To finish for production:**
1. **Real backend** — swap each `modules/*/api.ts` mock for HTTP calls; add
   `create/update/delete` mutations (the `ListScreen` create mutation is a stub
   that just invalidates the query).
2. **Detail depth** — Product/Order/Invoice/Journal/Receipt/Entity/Report
   panels are rich; Inspection & Shipment use a timeline-only generic view.
   Build out their full tabs (checklist/defects/photos, tracking/contents/docs).
3. **Working detail tabs** — the `tabs` array is rendered as stacked sections;
   wire them to switch content if you want true tabbed panels.
4. **Create-form schemas** for the action-only tabs (Vendor Scorecards, AR/AP
   Aging, Sync Logs, Anomalies, Audit) — currently show a "no schema" note.
5. **Filters** — the filter chips on each list are visual; wire them to
   TanStack Table column filters.
6. **Auth & RBAC** — the Admin → Roles/Users data exists; add real
   authentication, route guards and per-role nav.
7. **Search** — the global topbar search is a placeholder; add command-palette
   style cross-entity search.
8. **Charts** — Recharts dashboards use representative series; bind to live
   aggregates. Consider Tremor if you prefer prebuilt KPI blocks.
9. **Persistence/optimistic updates**, toasts, empty/error states polish,
   tests, and CI (`typecheck` + `build`).
