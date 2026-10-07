import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requirePlatformAdmin } from "@/lib/serverAuth";

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
    await requirePlatformAdmin(request);
    const supabase = getAdminClient();

    const [requestsRes, historyRes] = await Promise.all([
      supabase.from("subscription_requests").select("*").eq("status", "Pending").order("requested_at", { ascending: false }),
      supabase.from("subscription_requests").select("*").order("requested_at", { ascending: false }).limit(100),
    ]);

    return NextResponse.json({
      requests: requestsRes.data || [],
      history: historyRes.data || [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Unauthorized" }, { status: err.status || 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    await requirePlatformAdmin(request);
    const supabase = getAdminClient();
    const body = await request.json();
    const { request_id, restaurant_id, restaurant_name, owner_email, plan_name, days_to_add, action } = body;

    // Handle single request rejection
    if (action === "reject") {
      const { error: rejErr } = await supabase
        .from("subscription_requests")
        .update({ status: "Rejected", reviewed_at: new Date().toISOString() })
        .eq("id", request_id);

      if (rejErr) return NextResponse.json({ error: rejErr.message }, { status: 400 });
      return NextResponse.json({ success: true, status: "Rejected" });
    }

    // Compute days to add
    const normalizedPlan = (plan_name || "Monthly").trim();
    let days = Number(days_to_add);
    if (!days || isNaN(days)) {
      if (normalizedPlan.toLowerCase().includes("year")) days = 365;
      else if (normalizedPlan.toLowerCase().includes("7")) days = 7;
      else if (normalizedPlan.toLowerCase().includes("14")) days = 14;
      else days = 30;
    }

    // Match restaurant record
    let targetRest: any = null;
    if (restaurant_id && restaurant_id !== "1" && restaurant_id !== "null") {
      const { data } = await supabase.from("restaurants").select("*").eq("id", restaurant_id).maybeSingle();
      if (data) targetRest = data;
    }

    if (!targetRest && restaurant_name) {
      const { data } = await supabase.from("restaurants").select("*").ilike("name", restaurant_name).maybeSingle();
      if (data) targetRest = data;
    }

    if (!targetRest && owner_email) {
      const { data } = await supabase.from("restaurants").select("*").eq("owner_email", owner_email).maybeSingle();
      if (data) targetRest = data;
    }

    if (!targetRest) {
      return NextResponse.json({ error: "Restaurant record not found" }, { status: 404 });
    }

    // Renewal date calculation: stack onto existing valid future date
    let baseDate = new Date();
    if (targetRest.renewal_on && targetRest.renewal_on !== "—") {
      const existing = new Date(targetRest.renewal_on);
      if (!isNaN(existing.getTime()) && existing > baseDate) {
        baseDate = existing;
      }
    }

    const nextDate = new Date(baseDate.getTime());
    nextDate.setDate(nextDate.getDate() + days);
    const newRenewalDateStr = nextDate.toISOString().slice(0, 10);

    // Update restaurant
    const { error: updateErr } = await supabase
      .from("restaurants")
      .update({
        status: "Active",
        plan: normalizedPlan,
        renewal_on: newRenewalDateStr,
      })
      .eq("id", targetRest.id);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 400 });
    }

    // If an approval was linked to a subscription request, update it
    if (request_id) {
      await supabase
        .from("subscription_requests")
        .update({
          status: "Approved",
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", request_id);
    }

    return NextResponse.json({
      success: true,
      status: "Approved",
      restaurant_id: targetRest.id,
      plan: normalizedPlan,
      renewal_on: newRenewalDateStr,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
