import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/serverAuth";

export async function GET(request: Request) {
  try {
    const { supabase } = await requireAdmin(request);
    const { data, error } = await supabase
      .from("restaurants")
      .select("*")
      .eq("status", "Pending")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({
      approvals: (data || []).map((r: any) => ({
        id: r.id,
        name: r.name,
        city: r.city || "Not specified",
        submitted: r.created_at ? new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Recent",
        docs: r.gstin ? `GSTIN: ${r.gstin}` : "Business Registration",
        status: "Pending",
        owner: r.owner_name,
        email: r.owner_email,
        phone: r.owner_phone,
        plan: r.plan || "Free Trial",
      })),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: Number(e.status) || 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { supabase } = await requireAdmin(request);
    const { restaurant_id, action } = await request.json();
    if (!restaurant_id) return NextResponse.json({ error: "Restaurant ID is required" }, { status: 400 });
    if (!["approve", "reject"].includes(action)) return NextResponse.json({ error: "Invalid approval action" }, { status: 400 });

    const nextStatus = action === "approve" ? "Active" : "Rejected";
    const { error } = await supabase.from("restaurants").update({ status: nextStatus }).eq("id", restaurant_id).eq("status", "Pending");
    if (error) throw error;

    // Confirm that the request is no longer pending. This prevents a stale UI from
    // reporting success when the database update did not actually affect the row.
    const { data: updated, error: verifyError } = await supabase
      .from("restaurants")
      .select("id,status")
      .eq("id", restaurant_id)
      .maybeSingle();
    if (verifyError) throw verifyError;
    if (!updated) return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    if (updated.status === "Pending") return NextResponse.json({ error: "Approval status was not updated" }, { status: 409 });

    return NextResponse.json({ success: true, status: updated.status });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: Number(e.status) || 500 });
  }
}
