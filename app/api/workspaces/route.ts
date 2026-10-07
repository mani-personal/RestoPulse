import { NextResponse } from "next/server";
import { requireUser } from "@/lib/serverAuth";

export async function GET(request: Request) {
  try {
    const { supabase, user } = await requireUser(request);
    const { data: memberships, error: membershipError } = await supabase
      .from("memberships")
      .select("restaurant_id,role")
      .eq("user_id", user.id)
      .order("restaurant_id");
    if (membershipError) throw membershipError;

    const ids = (memberships || []).map((m:any) => m.restaurant_id).filter(Boolean);
    if (!ids.length) return NextResponse.json({ workspaces: [] });

    const { data: restaurants, error: restaurantError } = await supabase
      .from("restaurants")
      .select("id,name,plan,status,renewal_on,city,owner_name,owner_email,owner_phone")
      .in("id", ids);
    if (restaurantError) throw restaurantError;

    const byId = new Map((restaurants || []).map((r:any) => [r.id, r]));
    const workspaces = (memberships || []).map((m:any) => {
      const r = byId.get(m.restaurant_id);
      if (!r) return null;
      return {
        id: r.id,
        name: r.name,
        plan: r.plan,
        status: r.status,
        renewal: r.renewal_on || "—",
        city: r.city || "",
        phone: r.owner_phone || "",
        role: m.role,
      };
    }).filter(Boolean);

    return NextResponse.json({ workspaces });
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || "Could not load workspaces" }, { status: Number(e?.status) || 500 });
  }
}
