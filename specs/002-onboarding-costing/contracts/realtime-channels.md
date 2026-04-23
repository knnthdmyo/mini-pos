# Realtime Channels: Onboarding & Costing

**Branch**: `002-onboarding-costing` | **Date**: 2026-04-23

## Realtime Requirements

**None required for MVP2.**

The costing system is a single-admin workflow. There is no multi-user
coordination or live data synchronization needed. All data is fetched
on page load and revalidated after server action mutations via
`revalidatePath()`.

If a future version introduces multi-admin costing (out of scope for
MVP2), Supabase Realtime subscriptions on `product_costings` and
`ingredients` tables could be added to sync changes across sessions.
