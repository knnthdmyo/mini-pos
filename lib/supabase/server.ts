import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";

export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options?: Record<string, unknown>;
          }[],
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // setAll called from a Server Component — safe to ignore
          }
        },
      },
    },
  );
}

/**
 * Cached getUser — deduplicates across all calls within the same
 * React server render (layout + page + actions in a single request).
 */
export const getUser = cache(async () => {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  return { user, error };
});

/**
 * Verifies the current session and returns the user.
 * Throws 'UNAUTHORIZED' if no valid session exists.
 * Use this at the top of every Server Action that mutates data.
 */
export async function requireAuth() {
  const { user, error } = await getUser();

  if (error || !user) {
    throw new Error("UNAUTHORIZED");
  }

  return user;
}
