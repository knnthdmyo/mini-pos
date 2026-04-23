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
- [Tailwind CSS](https://tailwindcss.com/)
- TypeScript

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

   Apply the SQL files in `supabase/migrations/` to your Supabase project in order (001 → 017) via the Supabase SQL editor or CLI.

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
  supabase/       # Supabase client helpers (browser + server)
supabase/
  migrations/     # SQL migration files
  functions/      # Edge Functions (low-stock alert)
```

## Scripts

| Command         | Description              |
| --------------- | ------------------------ |
| `npm run dev`   | Start development server |
| `npm run build` | Build for production     |
| `npm start`     | Start production server  |
| `npm run lint`  | Run ESLint               |
