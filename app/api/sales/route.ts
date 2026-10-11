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
    const { supabase, user } = await requireRestaurantMember(request, restaurantId);
    const bill = body.receipt;
    if (!bill?.id || !bill?.items?.length) return NextResponse.json({ error: "A complete receipt is required" }, { status: 400 });
    // Always determine the business type on the server. Produce shops must never
    // fall through to the restaurant-only sales insert, which does not deduct stock.
    const { data: restaurant, error: restaurantError } = await supabase.from("restaurants").select("business_type").eq("id", restaurantId).single();
    if (restaurantError) throw restaurantError;
    const businessType = String(restaurant?.business_type || "").trim().toLowerCase().replace(/[\s-]+/g, "_");
    const isProduceShop = ["fruit_shop", "vegetable_shop", "fruit", "vegetable", "fruits", "vegetables"].includes(businessType);
    if (isProduceShop) {
      if (!Array.isArray(body.retail_lines) || body.retail_lines.length === 0) {
        return NextResponse.json({ error: "No inventory items were sent for this produce sale. Please remove the cart items and add them again from Inventory POS." }, { status: 400 });
      }
      const { data: sale, error: retailError } = await supabase.rpc("complete_retail_sale", {
        p_restaurant_id: restaurantId, p_user_id: user.id, p_bill_no: String(bill.id), p_placed_at: body.placed_at || new Date().toISOString(),
        p_order_type: String(bill.type || "Retail"), p_amount: Number(bill.total) || 0, p_status: String(bill.status || "Paid"),
        p_receipt: bill, p_lines: body.retail_lines
      });
      if (retailError) throw retailError;
      return NextResponse.json({ sale }, { status: 201 });
    }
    if (Array.isArray(body.retail_lines) && body.retail_lines.length) {
      return NextResponse.json({ error: "Inventory-based POS lines are not supported for this business type" }, { status: 400 });
    }
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
