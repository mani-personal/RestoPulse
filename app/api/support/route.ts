import { NextResponse } from "next/server";
import {
  requireUser,
  requireAdminPermission,
} from "@/lib/serverAuth";

const DEFAULT_SECTIONS = [
  {
    id: "default-support",
    title: "Support & Help",
    description:
      "Need help with RestoPulse? Contact our support team.",
    phone: "8122187039",
    whatsapp: "8122187039",
    email: "hosurwebservices@gmail.com",
    active: true,
  },
];

function fail(e: any) {
  return NextResponse.json(
    {
      error: e?.message || "Server error",
    },
    {
      status: Number(e?.status) || 500,
    }
  );
}

async function readSections(supabase: any) {
  const {
    data,
    error,
  } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "support_help")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data?.value) {
    return DEFAULT_SECTIONS;
  }

  try {
    const parsed = JSON.parse(data.value);

    return Array.isArray(parsed)
      ? parsed
      : DEFAULT_SECTIONS;
  } catch {
    return DEFAULT_SECTIONS;
  }
}

/**
 * Get Support & Help sections.
 *
 * Restaurant users and authenticated users can view
 * the support information.
 */
export async function GET(request: Request) {
  try {
    const { supabase } = await requireUser(request);

    return NextResponse.json({
      sections: await readSections(supabase),
    });
  } catch (e) {
    return fail(e);
  }
}

/**
 * Create or update a Support & Help section.
 *
 * Requires the platform admin "support" permission.
 */
export async function POST(request: Request) {
  try {
    const { supabase } =
      await requireAdminPermission(
        request,
        "support"
      );

    const body = await request.json();

    const sections = await readSections(supabase);

    const id = String(
      body.id || crypto.randomUUID()
    );

    const section = {
      id,
      title: String(
        body.title || "Support & Help"
      ).trim(),
      description: String(
        body.description || ""
      ).trim(),
      phone: String(
        body.phone || ""
      ).trim(),
      whatsapp: String(
        body.whatsapp || ""
      ).trim(),
      email: String(
        body.email || ""
      ).trim(),
      active: body.active !== false,
    };

    if (!section.title) {
      return NextResponse.json(
        {
          error: "Support title is required",
        },
        {
          status: 400,
        }
      );
    }

    const index = sections.findIndex(
      (x: any) => x.id === id
    );

    if (index >= 0) {
      sections[index] = section;
    } else {
      sections.push(section);
    }

    const {
      error,
    } = await supabase
      .from("settings")
      .upsert(
        {
          key: "support_help",
          value: JSON.stringify(sections),
          updated_at:
            new Date().toISOString(),
        },
        {
          onConflict: "key",
        }
      );

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      sections,
    });
  } catch (e) {
    return fail(e);
  }
}

/**
 * Delete a Support & Help section.
 *
 * Requires the platform admin "support" permission.
 */
export async function DELETE(
  request: Request
) {
  try {
    const { supabase } =
      await requireAdminPermission(
        request,
        "support"
      );

    const id =
      new URL(request.url)
        .searchParams.get("id") || "";

    if (!id) {
      return NextResponse.json(
        {
          error:
            "Support section ID is required",
        },
        {
          status: 400,
        }
      );
    }

    const sections = (
      await readSections(supabase)
    ).filter(
      (x: any) => x.id !== id
    );

    const {
      error,
    } = await supabase
      .from("settings")
      .upsert(
        {
          key: "support_help",
          value: JSON.stringify(sections),
          updated_at:
            new Date().toISOString(),
        },
        {
          onConflict: "key",
        }
      );

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      sections,
    });
  } catch (e) {
    return fail(e);
  }
}
