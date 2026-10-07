import { createClient, SupabaseClient, User } from "@supabase/supabase-js";

export function getServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error("Supabase server configuration is missing.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function requireUser(request: Request): Promise<{ supabase: SupabaseClient; user: User }> {
  const token = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) throw Object.assign(new Error("Sign in required"), { status: 401 });
  const supabase = getServerClient();
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) throw Object.assign(new Error("Invalid session"), { status: 401 });
  return { supabase, user };
}

export async function requireAdmin(request: Request) {
  const { supabase, user } = await requireUser(request);
  const { data, error } = await supabase.from("platform_admins").select("user_id,permissions").eq("user_id", user.id).maybeSingle();
  if (error || !data) throw Object.assign(new Error("Platform admin access required"), { status: 403 });
  return { supabase, user, permissions: data.permissions || {} };
}

export async function requireAdminPermission(request: Request, permission: string) {
  const result = await requireAdmin(request);
  if (result.user.id !== result.user.id) throw Object.assign(new Error("Platform admin access required"), { status: 403 });
  // Keep the first admin fully privileged for recovery, and honor explicit permissions for other admins.
  const { data: first } = await result.supabase.from("platform_admins").select("user_id").order("created_at", { ascending: true }).limit(1).maybeSingle();
  const allowed = first?.user_id === result.user.id || result.permissions?.[permission] === true;
  if (!allowed) throw Object.assign(new Error("You do not have permission for this section"), { status: 403 });
  return result;
}

export async function requireRestaurantMember(request: Request, restaurantId: string, managerOnly = false) {
  const { supabase, user } = await requireUser(request);
  if (!restaurantId) throw Object.assign(new Error("Restaurant is required"), { status: 400 });
  const { data: membership, error } = await supabase
    .from("memberships").select("restaurant_id,role").eq("restaurant_id", restaurantId).eq("user_id", user.id).maybeSingle();
  if (error || !membership) throw Object.assign(new Error("Restaurant access denied"), { status: 403 });
  if (managerOnly && !["OWNER", "MANAGER"].includes(String(membership.role).toUpperCase())) {
    throw Object.assign(new Error("Manager access required"), { status: 403 });
  }
  return { supabase, user, membership };
}
