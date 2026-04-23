# Best Practices

Guidelines for working on this codebase.

---

## Next.js / React

- **Server vs Client components** — default to Server Components. Only add `"use client"` when you need interactivity, browser APIs, or React hooks.
- **Server Actions** — all data mutations go in `lib/actions/`. Never call Supabase directly from a Client Component for writes.
- **`requireAuth()`** — call at the top of every server action to gate access. Never skip it.
- **`revalidatePath()`** — call after every mutation. Revalidate the affected route(s) only.
- Keep page files (`page.tsx`) as thin wrappers — fetch data server-side and pass it to Client Components as props.

## TypeScript

- Define explicit interfaces for all component props and server action inputs/outputs.
- Avoid `any`. Use `unknown` and narrow with type guards when necessary.
- Co-locate interfaces with the file that owns them; only extract to shared types if used in 3+ places.

## Supabase

- Use `lib/supabase/server.ts` (cookie-based) for all server-side queries and actions.
- Use `lib/supabase/client.ts` (browser) only for Realtime subscriptions in Client Components.
- Always check for errors: `if (error) throw new Error(error.message)`.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` client-side.

## Tailwind CSS

- Use utility classes directly — do not create custom CSS unless Tailwind cannot achieve it.
- Follow the mobile-first breakpoint order: base → `sm` → `md` → `lg`.
- Use `pb-20` on scrollable pages to clear the fixed bottom nav.
- Consistent spacing scale: `gap-3`, `p-4`, `rounded-2xl` for cards.

## Components

- Keep components small and single-purpose.
- Put shared primitives (Button, Badge, Toast) in `components/ui/`.
- Feature components live under their feature folder (`components/pos/`, `components/queue/`, etc.).
- Avoid prop drilling more than 2 levels — lift state or pass handlers from the page level.

## Database / Migrations

- Every schema change gets its own numbered migration file in `supabase/migrations/`.
- Never edit an existing migration — always create a new one.
- Use RPC functions (`supabase.rpc(...)`) for complex multi-step operations that need atomicity.

## Security

- Validate and sanitize inputs at the server action boundary.
- Row Level Security (RLS) is enabled on all tables — do not disable it.
- Never commit `.env.local`. Use `.env.local.example` to document required variables.
