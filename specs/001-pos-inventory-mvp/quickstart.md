# Quickstart: POS & Inventory System (MVP)

**Branch**: `001-pos-inventory-mvp`  
**Date**: 2026-04-20

---

## Prerequisites

- Node.js 20 LTS
- A Supabase project (free tier works for MVP)
- A SendGrid account with a verified sender email
- A Vercel account (for deployment)

---

## Local Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd <project-folder>
npm install
```

### 2. Configure environment variables

Copy the example env file and fill in your values:

```bash
cp .env.local.example .env.local
```

Required values in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

> The `SERVICE_ROLE_KEY` is only used server-side (Server Actions). Never expose it to the browser.

### 3. Run database migrations

Install the Supabase CLI and link your project:

```bash
npm install -g supabase
supabase login
supabase link --project-ref <your-project-ref>
supabase db push
```

This applies all migrations from `supabase/migrations/` to your Supabase project.

### 4. Seed initial data (optional)

```bash
supabase db seed
```

Creates sample products and ingredients so you can test the POS immediately.

### 5. Start the development server

```bash
npm run dev
```

Open `http://localhost:3000` in a tablet-sized browser window.

---

## First-time Configuration

1. **Create admin account**: Navigate to your Supabase dashboard → Authentication →
   Users → Invite user. Set `role = 'admin'` in the `users` table after creation.

2. **Add products**: Log in and go to Settings → Products. Add at least one product
   with a price.

3. **Add ingredients**: Go to Inventory → Ingredients. Add stock items with their
   cost per unit and a low-stock threshold.

4. **Define recipes**: For each non-prepared-stock product, go to the product detail
   and add recipe lines (which ingredients and how much per unit).

5. **Create prepared stock products**: For items like shakes that are batch-made,
   enable "Has Prepared Stock" on the product and run a batch prep before selling.

---

## Low Stock Email Alerts

### Deploy the Edge Function

```bash
supabase functions deploy low-stock-alert
```

### Set Edge Function secrets

```bash
supabase secrets set SENDGRID_API_KEY=<your-sendgrid-api-key>
supabase secrets set OPERATOR_EMAIL=<email-to-receive-alerts>
supabase secrets set SENDGRID_FROM_EMAIL=<your-verified-sender>
```

### Create the Database Webhook

In the Supabase dashboard → Database → Webhooks:

- **Name**: `low-stock-trigger`
- **Table**: `ingredients`
- **Events**: `UPDATE`
- **Type**: Supabase Edge Function
- **Function**: `low-stock-alert`

---

## Deployment (Vercel)

### 1. Push to GitHub

```bash
git push origin 001-pos-inventory-mvp
```

### 2. Import project in Vercel

- Go to vercel.com → New Project → Import from GitHub
- Select the repository

### 3. Set environment variables in Vercel

Add the same variables from `.env.local` in the Vercel project settings:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### 4. Deploy

Vercel auto-deploys on push. Visit the production URL on the tablet.

---

## Key URLs (local dev)

| Screen     | URL                               |
| ---------- | --------------------------------- |
| Login      | `http://localhost:3000/login`     |
| POS        | `http://localhost:3000/pos`       |
| Queue      | `http://localhost:3000/queue`     |
| Inventory  | `http://localhost:3000/inventory` |
| Batch Prep | `http://localhost:3000/batch`     |
| Reports    | `http://localhost:3000/reports`   |

---

## Quick Test (smoke test after setup)

1. Log in as staff
2. Go to POS → tap a product → tap "Place Order"
3. Go to Queue → confirm order appears
4. Tap "Complete Order" on the order
5. Go to Inventory → confirm ingredient or prepared stock decreased
6. Go to Reports → select "Daily" → confirm revenue and profit are shown
