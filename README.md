# Minis POS

A mobile-friendly point-of-sale and inventory management system for small food businesses, built with Next.js 14 and Supabase.

## Features

- **POS** — tap products to build an order, adjust quantities with +/− buttons, place orders
- **Queue** — live order queue with Supabase Realtime; complete or cancel orders (cancelled orders restore stock)
- **Inventory** — view ingredient stock levels, adjust quantities, low-stock alerts
- **Batch Prep** — log batch production runs that deduct ingredient stock
- **Reports** — daily, weekly, and monthly revenue/cost/profit summaries

## Tech Stack

- [Next.js 14](https://nextjs.org/) (App Router, Server Actions)
- [Supabase](https://supabase.com/) (Postgres, Auth, Realtime)
- [Zustand](https://zustand-demo.pmnd.rs/) — lightweight client-side state (POS cart & order queue)
- [Tailwind CSS](https://tailwindcss.com/)
- TypeScript
- [SpecKit](https://github.com/speckit-dev/speckit) — spec-first development workflow

## Development Workflow

This project was built using [SpecKit](https://github.com/speckit-dev/speckit), a spec-first development workflow tool. The full specification lives in `specs/001-pos-inventory-mvp/`.

### SpecKit Commands

| Command             | Description                                    |
| ------------------- | ---------------------------------------------- |
| `speckit.specify`   | Define or refine the feature spec              |
| `speckit.plan`      | Generate a technical plan from the spec        |
| `speckit.tasks`     | Break the plan into actionable tasks           |
| `speckit.implement` | Implement tasks one by one                     |
| `speckit.checklist` | Verify requirements against the implementation |

### Spec Documents

| File                      | Description                                       |
| ------------------------- | ------------------------------------------------- |
| `specs/.../spec.md`       | Feature requirements and user stories             |
| `specs/.../plan.md`       | Technical architecture and approach               |
| `specs/.../tasks.md`      | Granular task list with completion status         |
| `specs/.../data-model.md` | Database schema design                            |
| `specs/.../contracts/`    | API contracts (server actions, realtime channels) |
| `specs/.../checklists/`   | Requirements verification checklists              |

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project

### Setup

1. **Clone the repo and install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment variables**

   Create a `.env.local` file in the project root:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Run database migrations**

   Apply the SQL files in `supabase/migrations/` to your Supabase project in order (001 → 018) via the Supabase SQL editor or CLI.

4. **Start the development server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
app/
  (auth)/         # Login, register, set-password pages
  (dashboard)/    # Protected pages: POS, Inventory, Batch, Queue, Reports
  auth/callback/  # Supabase auth callback route
components/
  pos/            # ProductGrid, CartSummary, PlaceOrderButton
  queue/          # QueueList, OrderCard, EditOrderModal
  inventory/      # IngredientRow, StockAdjustForm
  batch/          # BatchPrepForm
  reports/        # ProfitSummary
  ui/             # Badge, Button, Toast
lib/
  actions/        # Server Actions: auth, orders, inventory, batch, reports
  store/          # Zustand stores + React providers
  supabase/       # Supabase client helpers (browser + server)
scripts/          # Dev/debug utility scripts
specs/            # SpecKit spec documents
supabase/
  migrations/     # SQL migration files (001–018)
  functions/      # Supabase Edge Functions
```

## State Management

Client-side state is managed with [Zustand](https://zustand-demo.pmnd.rs/) using a vanilla store + React context provider pattern:

| File                             | Purpose                                                               |
| -------------------------------- | --------------------------------------------------------------------- |
| `lib/store/pos.ts`               | Vanilla Zustand store — cart lines, order list, and all mutators      |
| `lib/store/PosStoreProvider.tsx` | React context provider; creates one store instance per component tree |

### Usage

Wrap the POS page (or any subtree) with `<PosStoreProvider>`, then subscribe to slices with the `usePosStore` hook:

```tsx
import { usePosStore } from "@/lib/store/PosStoreProvider";

const cart = usePosStore((s) => s.cart);
const addToCart = usePosStore((s) => s.addToCart);
```

For non-rendering access (inside effects/callbacks), use `usePosStoreApi()` to get the raw store and call `.getState()` or `.setState()` directly.

## Scripts

Utility scripts for development and debugging live in `scripts/`:

| Script                  | Purpose                                 |
| ----------------------- | --------------------------------------- |
| `check-columns.js`      | Verify expected columns exist on tables |
| `check-schema.js`       | Validate overall DB schema              |
| `list-columns.js`       | List all columns for a given table      |
| `probe-enum.js`         | Inspect enum types in the database      |
| `reload-schema.js`      | Reload PostgREST schema cache           |
| `seed-user.js`          | Create a test user for development      |
| `verify-order-items.js` | Verify order_items table integrity      |
| `verify-orders.js`      | Verify orders table integrity           |

## Key Conventions

- **Server Actions** — all writes go through `lib/actions/`; every action calls `requireAuth()` first
- **Realtime** — Supabase Realtime subscriptions live in Client Components only
- **Styling** — Tailwind utility classes only; mobile-first; scrollable pages use `pb-20`
- **Migrations** — one file per schema change, never edit existing migrations
- **Commits** — [Conventional Commits](https://www.conventionalcommits.org/) (`feat`, `fix`, `chore`, etc.)

See [`docs/best-practices.md`](docs/best-practices.md) and [`docs/commit-conventions.md`](docs/commit-conventions.md) for full guidelines.
functions/ # Edge Functions (low-stock alert)

```

## Scripts

| Command         | Description              |
| --------------- | ------------------------ |
| `npm run dev`   | Start development server |
| `npm run build` | Build for production     |
| `npm start`     | Start production server  |
| `npm run lint`  | Run ESLint               |
```
