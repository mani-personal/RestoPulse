import { NextResponse } from "next/server";
import { requireUser } from "@/lib/serverAuth";

export async function GET(request: Request) {
  try {
    const { supabase, user } = await requireUser(request);
    const { data: memberships, error: membershipError } = await supabase
      .from("memberships")
      .select("restaurant_id,role,permissions")
      .eq("user_id", user.id)
      .order("restaurant_id");
    if (membershipError) throw membershipError;

    const ids = (memberships || []).map((m:any) => m.restaurant_id).filter(Boolean);
    if (!ids.length) return NextResponse.json({ workspaces: [] });

    const { data: restaurants, error: restaurantError } = await supabase
      .from("restaurants")
      .select("id,name,plan,status,renewal_on,city,owner_name,owner_email,owner_phone,business_type")
      .in("id", ids);
    if (restaurantError) throw restaurantError;

    const byId = new Map((restaurants || []).map((r:any) => [r.id, r]));
    const workspaces = (memberships || []).map((m:any) => {
      const r = byId.get(m.restaurant_id);
      if (!r) return null;
      return {
        id: r.id,
        name: r.name,
        business_type: r.business_type || "restaurant",
        plan: r.plan,
        status: r.status,
        renewal: r.renewal_on || "—",
        city: r.city || "",
        phone: r.owner_phone || "",
        role: m.role,
        permissions: m.permissions || {},
      };
    }).filter(Boolean);

    return NextResponse.json({ workspaces });
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || "Could not load workspaces" }, { status: Number(e?.status) || 500 });
  }
}


export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireUser(request);
    const body = await request.json();
    const name = String(body.name || "").trim();
    const businessType = String(body.business_type || "");
    const allowedTypes = ["fruit_shop", "juice_shop", "vegetable_shop"];
    if (name.length < 2 || name.length > 120) return NextResponse.json({ error: "Enter a shop name between 2 and 120 characters" }, { status: 400 });
    if (!allowedTypes.includes(businessType)) return NextResponse.json({ error: "Choose Fruit, Juice, or Vegetable shop" }, { status: 400 });
    const { data: memberships, error: membershipError } = await supabase.from("memberships").select("restaurant_id,role").eq("user_id", user.id);
    if (membershipError) throw membershipError;
    const ownerMemberships = (memberships || []).filter((m:any) => String(m.role || "").toUpperCase() === "OWNER");
    if (!ownerMemberships.length) return NextResponse.json({ error: "Only the shop owner can create another shop" }, { status: 403 });
    const { data: existing, error: existingError } = await supabase.from("restaurants").select("owner_name,owner_email,owner_phone,city").eq("id", ownerMemberships[0].restaurant_id).maybeSingle();
    if (existingError || !existing) throw existingError || new Error("Owner profile could not be loaded");
    const renewal = new Date(); renewal.setDate(renewal.getDate() + 7);
    const { data: restaurant, error: restaurantError } = await supabase.from("restaurants").insert({
      name, owner_name: existing.owner_name || user.user_metadata?.full_name || "Owner", owner_email: user.email || existing.owner_email,
      owner_phone: existing.owner_phone || "", city: existing.city || "", business_type: businessType, plan: "Free Trial", status: "Trial", renewal_on: renewal.toISOString().slice(0,10)
    }).select("id,name,plan,status,renewal_on,city,owner_name,owner_email,owner_phone,business_type").single();
    if (restaurantError || !restaurant) throw restaurantError || new Error("Could not create shop");
    const { error: linkError } = await supabase.from("memberships").insert({ user_id: user.id, restaurant_id: restaurant.id, role: "OWNER", permissions: {} });
    if (linkError) { await supabase.from("restaurants").delete().eq("id", restaurant.id); throw linkError; }
    return NextResponse.json({ success: true, workspace: { id: restaurant.id, name: restaurant.name, business_type: restaurant.business_type, plan: restaurant.plan, status: restaurant.status, renewal: restaurant.renewal_on || "—", city: restaurant.city || "", phone: restaurant.owner_phone || "", role: "OWNER", permissions: {} } }, { status: 201 });
  } catch (e:any) { return NextResponse.json({ error: e?.message || "Could not create shop" }, { status: Number(e?.status) || 500 }); }
}
