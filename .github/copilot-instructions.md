# Copilot Workspace Instructions

## Anti-Hallucination — Always Use Context7

When answering questions or generating code involving any library, framework, SDK, or API, **always fetch live documentation via Context7 before responding**. Do not rely on training data alone — it may be outdated or incorrect.

This applies to (but is not limited to):
- Next.js (App Router, Server Actions, middleware, routing)
- Supabase (auth, database, Realtime, SSR, RLS)
- Tailwind CSS (utility classes, config, plugins)
- React (hooks, patterns, concurrent features)
- TypeScript (types, generics, config)

### How to use Context7

Use the `resolve-library-id` tool to find the library, then `query-docs` to fetch relevant documentation before generating code. For known libraries, use the ID directly:

| Library | Context7 ID |
|---|---|
| Next.js | `/vercel/next.js` |
| Supabase JS | `/supabase/supabase-js` |
| Supabase SSR | `/supabase/ssr` |
| Tailwind CSS | `/tailwindlabs/tailwindcss` |
| React | `/facebook/react` |
| TypeScript | `/microsoft/typescript` |

### Rule

> Before writing any integration code, configuration, or API usage — fetch the current docs with Context7. Never guess at API signatures, config options, or method names.

---

## Project Context

- **Stack**: Next.js 14 (App Router), Supabase (Postgres + Auth + Realtime), Tailwind CSS, TypeScript
- **Mutations**: all writes go through Server Actions in `lib/actions/`
- **Auth guard**: every server action calls `requireAuth()` first
- **Realtime**: Supabase Realtime subscriptions live in Client Components only
- **Styling**: Tailwind utility classes only — no custom CSS files
- **Mobile**: mobile-first layout; bottom nav is fixed at `h-16`; scrollable pages use `pb-20`

See `docs/best-practices.md` and `docs/commit-conventions.md` for full guidelines.
