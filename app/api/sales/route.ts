import { NextResponse } from "next/server";
import { requireRestaurantMember } from "@/lib/serverAuth";

function fail(error: any) {
  return NextResponse.json({ error: error?.message || "Server error" }, { status: Number(error?.status) || 500 });
}

export async function GET(request: Request) {
  try {
    const restaurantId = new URL(request.url).searchParams.get("restaurant_id") || "";
    const { supabase } = await requireRestaurantMember(request, restaurantId);
    const { data, error } = await supabase.from("sales").select("*").eq("restaurant_id", restaurantId).order("placed_at", { ascending: false }).limit(500);
    if (error) throw error;
    return NextResponse.json({ sales: data || [] });
  } catch (e) { return fail(e); }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const restaurantId = String(body.restaurant_id || "");
    const { supabase } = await requireRestaurantMember(request, restaurantId);
    const bill = body.receipt;
    if (!bill?.id || !bill?.items?.length) return NextResponse.json({ error: "A complete receipt is required" }, { status: 400 });
    const { data, error } = await supabase.from("sales").insert({
      restaurant_id: restaurantId,
      bill_no: String(bill.id),
      placed_at: body.placed_at || new Date().toISOString(),
      order_type: String(bill.type || "Dine-in"),
      amount: Number(bill.total) || 0,
      status: String(bill.status || "Paid"),
      receipt: bill,
    }).select().single();
    if (error) throw error;
    return NextResponse.json({ sale: data }, { status: 201 });
  } catch (e) { return fail(e); }
}
