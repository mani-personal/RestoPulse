import { NextResponse } from "next/server";
import { requireRestaurantMember } from "@/lib/serverAuth";

function fail(error: any) {
  const status = Number(error?.status) || 500;
  return NextResponse.json({ error: error?.message || "Server error" }, { status });
}

export async function GET(request: Request) {
  try {
    const { supabase } = await requireRestaurantMember(request, new URL(request.url).searchParams.get("restaurant_id") || "");
    const restaurantId = new URL(request.url).searchParams.get("restaurant_id")!;
    const [{ data: items, error: itemError }, { data: transactions, error: txError }] = await Promise.all([
      supabase.from("inventory_items").select("*").eq("restaurant_id", restaurantId).eq("active", true).order("name"),
      supabase.from("inventory_transactions").select("*").eq("restaurant_id", restaurantId).order("created_at", { ascending: false }).limit(200),
    ]);
    if (itemError) throw itemError;
    if (txError) throw txError;
    return NextResponse.json({ items: items || [], transactions: transactions || [] });
  } catch (e) { return fail(e); }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const restaurantId = String(body.restaurant_id || "");
    const { supabase } = await requireRestaurantMember(request, restaurantId, true);
    const name = String(body.name || "").trim();
    if (!name) return NextResponse.json({ error: "Inventory item name is required" }, { status: 400 });
    const onHand = Math.max(0, Number(body.on_hand) || 0);
    const reorder = Math.max(0, Number(body.reorder_level) || 0);
    const cost = Math.max(0, Number(body.cost) || 0);
    const id = body.id ? String(body.id) : undefined;

    if (id) {
      const { data: old, error: oldError } = await supabase.from("inventory_items").select("*").eq("restaurant_id", restaurantId).eq("id", id).maybeSingle();
      if (oldError || !old) return NextResponse.json({ error: oldError?.message || "Inventory item not found" }, { status: 404 });
      const { data, error } = await supabase.from("inventory_items").update({
        name, category: String(body.category || "General"), on_hand: onHand, unit: String(body.unit || "unit"),
        reorder_level: reorder, ...(body.cost !== undefined ? { cost } : {}), ...(body.selling_price !== undefined ? { selling_price: Math.max(0, Number(body.selling_price) || 0) } : {}), supplier_id: body.supplier_id || null, active: body.active !== false
      }).eq("restaurant_id", restaurantId).eq("id", id).select().single();
      if (error) throw error;
      if (old.on_hand !== onHand) {
        const { error: txError } = await supabase.from("inventory_transactions").insert({
          restaurant_id: restaurantId, inventory_item_id: id, previous_quantity: old.on_hand,
          change_quantity: onHand - old.on_hand, new_quantity: onHand,
          transaction_type: String(body.transaction_type || "Adjustment"), reference_id: String(body.reference_id || ""), note: String(body.note || "")
        });
        if (txError) throw txError;
      }
      return NextResponse.json({ item: data });
    }

    const { data, error } = await supabase.from("inventory_items").insert({
      restaurant_id: restaurantId, name, category: String(body.category || "General"), on_hand: onHand,
      unit: String(body.unit || "unit"), reorder_level: reorder, cost, selling_price: Math.max(0, Number(body.selling_price) || 0), supplier_id: body.supplier_id || null
    }).select().single();
    if (error) throw error;
    if (onHand !== 0) {
      await supabase.from("inventory_transactions").insert({
        restaurant_id: restaurantId, inventory_item_id: data.id, previous_quantity: 0,
        change_quantity: onHand, new_quantity: onHand, transaction_type: "Opening balance",
        reference_id: "", note: "Initial inventory quantity"
      });
    }
    return NextResponse.json({ item: data }, { status: 201 });
  } catch (e) { return fail(e); }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const restaurantId = String(body.restaurant_id || "");
    const { supabase } = await requireRestaurantMember(request, restaurantId, true);
    const { error } = await supabase.from("inventory_items").update({ active: false }).eq("restaurant_id", restaurantId).eq("id", String(body.id));
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e) { return fail(e); }
}
