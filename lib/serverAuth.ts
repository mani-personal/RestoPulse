import { createClient, SupabaseClient, User } from "@supabase/supabase-js";

export function getServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    throw new Error("Supabase server configuration is missing.");
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function requireUser(
  request: Request
): Promise<{ supabase: SupabaseClient; user: User }> {
  const token = request.headers
    .get("authorization")
    ?.match(/^Bearer\s+(.+)$/i)?.[1];

  if (!token) {
    throw Object.assign(new Error("Sign in required"), {
      status: 401,
    });
  }

  const supabase = getServerClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw Object.assign(new Error("Invalid session"), {
      status: 401,
    });
  }

  return { supabase, user };
}

export async function requireAdmin(request: Request) {
  const { supabase, user } = await requireUser(request);

  const {
    data,
    error,
  } = await supabase
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) {
    throw Object.assign(
      new Error("Platform admin access required"),
      {
        status: 403,
      }
    );
  }

  return { supabase, user };
}

/**
 * Require platform admin access and verify that the admin
 * has the requested permission.
 *
 * Supported permissions:
 * restaurants
 * approvals
 * pricing
 * settings
 * support
 * admins
 */
export async function requireAdminPermission(
  request: Request,
  permission: string
) {
  const { supabase, user } = await requireUser(request);

  const {
    data: admin,
    error,
  } = await supabase
    .from("platform_admins")
    .select("user_id, permissions")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !admin) {
    throw Object.assign(
      new Error("Platform admin access required"),
      {
        status: 403,
      }
    );
  }

  /*
   * If permissions are not configured for an existing admin,
   * preserve existing full-admin access.
   */
  if (!admin.permissions) {
    return {
      supabase,
      user,
      admin,
    };
  }

  let permissions: string[] = [];

  /*
   * JSON/array format:
   * ["restaurants","support","settings"]
   */
  if (Array.isArray(admin.permissions)) {
    permissions = admin.permissions.map((value: unknown) =>
      String(value).trim().toLowerCase()
    );
  }

  /*
   * String format:
   * ["restaurants","support"]
   *
   * or:
   * restaurants,support,settings
   */
  else if (typeof admin.permissions === "string") {
    try {
      const parsed = JSON.parse(admin.permissions);

      if (Array.isArray(parsed)) {
        permissions = parsed.map((value: unknown) =>
          String(value).trim().toLowerCase()
        );
      } else {
        permissions = admin.permissions
          .split(",")
          .map((value: string) =>
            value.trim().toLowerCase()
          )
          .filter(Boolean);
      }
    } catch {
      permissions = admin.permissions
        .split(",")
        .map((value: string) =>
          value.trim().toLowerCase()
        )
        .filter(Boolean);
    }
  }

  const requestedPermission = String(permission)
    .trim()
    .toLowerCase();

  if (!permissions.includes(requestedPermission)) {
    throw Object.assign(
      new Error(
        `Admin permission required: ${permission}`
      ),
      {
        status: 403,
      }
    );
  }

  return {
    supabase,
    user,
    admin,
  };
}

export async function requireRestaurantOwner(request: Request, restaurantId: string) {
  const { supabase, user, membership } = await requireRestaurantMember(request, restaurantId, false);
  if (String(membership.role).toUpperCase() !== "OWNER") {
    throw Object.assign(new Error("Restaurant owner access required"), { status: 403 });
  }
  return { supabase, user, membership };
}

export async function requireRestaurantPermission(request: Request, restaurantId: string, permission: string) {
  const { supabase, user, membership } = await requireRestaurantMember(request, restaurantId, false);
  const role = String(membership.role || "").toUpperCase();
  if (role === "OWNER") return { supabase, user, membership };
  const permissions = membership.permissions && typeof membership.permissions === "object" ? membership.permissions as Record<string, unknown> : {};
  if (permissions[permission] !== true) {
    throw Object.assign(new Error(`Restaurant permission required: ${permission}`), { status: 403 });
  }
  return { supabase, user, membership };
}

export async function requireRestaurantMember(
  request: Request,
  restaurantId: string,
  managerOnly = false
) {
  const { supabase, user } = await requireUser(request);

  if (!restaurantId) {
    throw Object.assign(
      new Error("Restaurant is required"),
      {
        status: 400,
      }
    );
  }

  const {
    data: membership,
    error,
  } = await supabase
    .from("memberships")
    .select("restaurant_id,role")
    .eq("restaurant_id", restaurantId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !membership) {
    throw Object.assign(
      new Error("Restaurant access denied"),
      {
        status: 403,
      }
    );
  }

  if (
    managerOnly &&
    !["OWNER", "MANAGER"].includes(
      String(membership.role).toUpperCase()
    )
  ) {
    throw Object.assign(
      new Error("Manager access required"),
      {
        status: 403,
      }
    );
  }

  return {
    supabase,
    user,
    membership,
  };
}
