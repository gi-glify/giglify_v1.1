import { createClient, type SupabaseClient, type User } from "npm:@supabase/supabase-js@2";

export function adminClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export async function requireUser(req: Request): Promise<{ user: User; db: SupabaseClient }> {
  const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) throw new Error("Unauthorized");

  const db = adminClient();
  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user) throw new Error("Unauthorized");
  return { user: data.user, db };
}

export async function requireAdmin(req: Request): Promise<{ user: User; db: SupabaseClient }> {
  const result = await requireUser(req);
  const { data, error } = await result.db
    .from("profiles")
    .select("is_admin")
    .eq("id", result.user.id)
    .single();
  if (error || !data?.is_admin) throw new Error("Forbidden");
  return result;
}
