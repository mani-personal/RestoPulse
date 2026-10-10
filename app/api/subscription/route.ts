import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !serviceKey) {
    throw new Error("Supabase environment variables are missing.");
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function GET(request: Request) {
  try {
    const supabase = getAdminClient();
    const { searchParams } = new URL(request.url);
    const restaurant_id = searchParams.get("restaurant_id");
    const email = searchParams.get("email");
    const user_id = searchParams.get("user_id");

    // 1. UPI setting & Live pricing plans
    const [upiRes, plansRes] = await Promise.all([
      supabase.from("settings").select("value, upi_id").eq("key", "admin_upi").maybeSingle(),
      supabase.from("settings").select("value").eq("key", "platform_pricing_plans").maybeSingle(),
    ]);

    const upi_id = upiRes.data?.upi_id || upiRes.data?.value || "admin-restopulse@upi";

    let livePlans: any[] = [];
    if (plansRes.data?.value) {
      try {
        const parsed = JSON.parse(plansRes.data.value);
        if (Array.isArray(parsed) && parsed.length > 0) livePlans = parsed;
      } catch {}
    }

    // 2. Resolve target restaurant
    let restaurant: any = null;

    if (user_id) {
      const { data: membership } = await supabase
        .from("memberships")
        .select("restaurant_id")
        .eq("user_id", user_id)
        .maybeSingle();

      if (membership?.restaurant_id) {
        const { data: restData } = await supabase
          .from("restaurants")
          .select("*")
          .eq("id", membership.restaurant_id)
          .maybeSingle();
        if (restData) restaurant = restData;
      }
    }

    if (!restaurant && restaurant_id && restaurant_id !== "null") {
      const { data } = await supabase.from("restaurants").select("*").eq("id", restaurant_id).maybeSingle();
      if (data) restaurant = data;
    }

    if (!restaurant && email) {
      const { data } = await supabase.from("restaurants").select("*").eq("owner_email", email).maybeSingle();
      if (data) restaurant = data;
    }

    // 3. Subscription History for this restaurant
    let history: any[] = [];
    if (restaurant?.id) {
      const { data: histData } = await supabase
        .from("subscription_requests")
        .select("*")
        .eq("restaurant_id", restaurant.id)
        .order("requested_at", { ascending: false });
      history = histData || [];
    }

    // 4. Tax Configuration
    let tax = { gst_percent: 5, cgst_percent: 2.5, sgst_percent: 2.5 };
    if (restaurant?.id) {
      const { data: taxSetting } = await supabase
        .from("settings")
        .select("value")
        .eq("key", `tax_${restaurant.id}`)
        .maybeSingle();
      if (taxSetting?.value) {
        try {
          tax = JSON.parse(taxSetting.value);
        } catch {}
      }
    }

    return NextResponse.json({
      upi_id,
      plans: livePlans,
      restaurant: restaurant
        ? {
            id: restaurant.id,
            name: restaurant.name,
            business_type: restaurant.business_type || "restaurant",
            plan: restaurant.plan || "Free trial",
            renewal_on: restaurant.renewal_on || "—",
            status: restaurant.status || "Active",
            owner_name: restaurant.owner_name || "Owner",
            owner_email: restaurant.owner_email || "",
            owner_phone: restaurant.owner_phone || "",
            address: restaurant.address || "",
            gstin: restaurant.gstin || "",
            gst_percent: restaurant.gst_percent ?? tax.gst_percent,
            cgst_percent: restaurant.cgst_percent ?? tax.cgst_percent,
            sgst_percent: restaurant.sgst_percent ?? tax.sgst_percent,
            created_at: restaurant.created_at,
          }
        : null,
      history,
    });
  } catch (err: any) {
    return NextResponse.json({ upi_id: "admin-restopulse@upi", restaurant: null, history: [] });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = getAdminClient();
    const body = await request.json();
    const { restaurant_id, restaurant_name, owner_name, owner_email, plan, amount, upi_id, screenshot_url, reference_id, message } = body;

    const { data, error } = await supabase
      .from("subscription_requests")
      .insert({
        restaurant_id: restaurant_id || null,
        restaurant_name: restaurant_name || "Restaurant",
        owner_name: owner_name || "Owner",
        owner_email: owner_email || "owner@example.com",
        plan: plan || "Monthly",
        amount: Number(amount) || 0,
        upi_id: upi_id || "",
        screenshot_url: screenshot_url || "",
        reference_id: reference_id || "",
        message: message || "",
        status: "Pending",
        requested_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ success: true, request: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
