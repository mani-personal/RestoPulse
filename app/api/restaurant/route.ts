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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const name = searchParams.get("name");
    if (!id && !name) {
      return NextResponse.json({ error: "Restaurant ID or Name required" }, { status: 400 });
    }

    const supabase = getAdminClient();
    let query = supabase.from("restaurants").select("*");
    if (id && id !== "null") {
      query = query.eq("id", id);
    } else if (name) {
      query = query.ilike("name", name.trim());
    }
    const { data: restaurant, error } = await query.maybeSingle();

    if (error || !restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    // Load tax setting fallback
    const { data: taxSetting } = await supabase
      .from("settings")
      .select("value")
      .eq("key", `tax_${restaurant.id}`)
      .maybeSingle();

    let taxConfig = { gst_percent: 5, cgst_percent: 2.5, sgst_percent: 2.5 };
    if (taxSetting?.value) {
      try {
        taxConfig = JSON.parse(taxSetting.value);
      } catch {}
    }

    return NextResponse.json({
      restaurant: {
        ...restaurant,
        gst_percent: restaurant.gst_percent ?? taxConfig.gst_percent,
        cgst_percent: restaurant.cgst_percent ?? taxConfig.cgst_percent,
        sgst_percent: restaurant.sgst_percent ?? taxConfig.sgst_percent,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, name, phone, address, gstin, gst_percent, cgst_percent, sgst_percent } = body;

    if (!id && !name) {
      return NextResponse.json({ error: "Restaurant identifier is required" }, { status: 400 });
    }

    const supabase = getAdminClient();

    const updatePayload: Record<string, any> = {};
    if (name) updatePayload.name = String(name).trim();
    if (phone !== undefined) updatePayload.owner_phone = String(phone).trim();
    if (address !== undefined) updatePayload.address = String(address).trim();
    if (gstin !== undefined) updatePayload.gstin = String(gstin).trim();

    let query = supabase.from("restaurants").update(updatePayload);
    if (id && id !== "1" && id !== "null") {
      query = query.eq("id", id);
    } else if (name) {
      query = query.ilike("name", String(name).trim());
    }

    const { data, error } = await query.select().maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Persist GST tax rates reliably into settings table
    const taxData = {
      gst_percent: Number(gst_percent) || 5,
      cgst_percent: Number(cgst_percent) || (Number(gst_percent) ? Number(gst_percent) / 2 : 2.5),
      sgst_percent: Number(sgst_percent) || (Number(gst_percent) ? Number(gst_percent) / 2 : 2.5),
    };

    try {
      await supabase.from("settings").upsert(
        {
          key: `tax_${id || data?.id || name}`,
          value: JSON.stringify(taxData),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" }
      );
    } catch {}

    return NextResponse.json({
      success: true,
      restaurant: {
        ...(data || updatePayload),
        ...taxData,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
