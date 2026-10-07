import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/serverAuth";

function fail(e:any, fallback="Server error") {
  return NextResponse.json({ error: e?.message || fallback }, { status: Number(e?.status) || 500 });
}

async function listAdmins(supabase:any) {
  const { data: rows, error } = await supabase.from("platform_admins").select("user_id,created_at").order("created_at", { ascending: true });
  if (error) throw error;
  const result:any[] = [];
  for (const row of rows || []) {
    const { data, error: userError } = await supabase.auth.admin.getUserById(row.user_id);
    if (userError || !data?.user) continue;
    result.push({
      id: row.user_id,
      email: data.user.email || "",
      name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || data.user.email?.split("@")[0] || "Admin",
      created_at: row.created_at,
    });
  }
  return result;
}

export async function GET(request:NextRequest) {
  try {
    const { supabase } = await requireAdmin(request);
    return NextResponse.json({ admins: await listAdmins(supabase) });
  } catch (e:any) { return fail(e, "Could not load admins"); }
}

export async function POST(request:NextRequest) {
  try {
    const { supabase } = await requireAdmin(request);
    const body = await request.json();
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const requestedPassword = String(body.password || "").trim();
    if (name.length < 2) return NextResponse.json({ error:"Admin name is required" }, {status:400});
    if (!/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error:"Enter a valid admin email" }, {status:400});
    if (requestedPassword && (requestedPassword.length < 12 || requestedPassword.length > 128)) return NextResponse.json({ error:"Password must be 12–128 characters" }, {status:400});

    const { data: existingRows } = await supabase.from("platform_admins").select("user_id");
    let userId = "";
    let createdNew = false;
    let temporaryPassword: string | undefined;
    const existingUser = await (async () => {
      const { data } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
      return (data?.users || []).find((u:any) => String(u.email || "").toLowerCase() === email) || null;
    })();

    if (existingUser) {
      userId = existingUser.id;
      if ((existingRows || []).some((r:any) => r.user_id === userId)) {
        return NextResponse.json({ error:"This user is already a platform admin" }, {status:409});
      }
      const { error: metaError } = await supabase.auth.admin.updateUserById(userId, { user_metadata: { ...(existingUser.user_metadata || {}), full_name: name } });
      if (metaError) throw metaError;
    } else {
      const password = requestedPassword || `${crypto.randomUUID().replace(/-/g, '').slice(0, 10)}A9!x7Q2`;
      temporaryPassword = requestedPassword ? undefined : password;
      const { data: created, error } = await supabase.auth.admin.createUser({ email, password, email_confirm:true, user_metadata:{ full_name:name } });
      if (error || !created.user) return NextResponse.json({ error:error?.message || "Could not create admin account" }, {status:400});
      userId = created.user.id;
      createdNew = true;
    }

    const { error: insertError } = await supabase.from("platform_admins").insert({ user_id:userId });
    if (insertError) {
      if (createdNew) await supabase.auth.admin.deleteUser(userId);
      throw insertError;
    }
    return NextResponse.json({ success:true, admin:{ id:userId, name, email }, temporary_password: temporaryPassword }, {status:201});
  } catch (e:any) { return fail(e, "Could not create admin"); }
}

export async function PATCH(request:NextRequest) {
  try {
    const { supabase } = await requireAdmin(request);
    const body = await request.json();
    const id = String(body.id || "");
    if (!id) return NextResponse.json({error:"Admin ID is required"},{status:400});
    const { data:userData, error:getError } = await supabase.auth.admin.getUserById(id);
    if (getError || !userData?.user) return NextResponse.json({error:"Admin account not found"},{status:404});
    const name = String(body.name ?? userData.user.user_metadata?.full_name ?? "").trim();
    const email = String(body.email ?? userData.user.email ?? "").trim().toLowerCase();
    const password = String(body.password || "").trim();
    const update:any = { user_metadata:{ ...(userData.user.user_metadata || {}), full_name:name } };
    if (email && email !== String(userData.user.email || "").toLowerCase()) update.email=email;
    if (password) {
      if (password.length < 12 || password.length > 128) return NextResponse.json({error:"Password must be 12–128 characters"},{status:400});
      update.password=password;
    }
    const { error } = await supabase.auth.admin.updateUserById(id, update);
    if (error) throw error;
    return NextResponse.json({success:true});
  } catch (e:any) { return fail(e, "Could not update admin"); }
}

export async function DELETE(request:NextRequest) {
  try {
    const { supabase, user } = await requireAdmin(request);
    const body = await request.json();
    const id = String(body.id || "");
    if (!id) return NextResponse.json({error:"Admin ID is required"},{status:400});
    if (id === user.id) return NextResponse.json({error:"You cannot remove your own admin access"},{status:400});
    const { count, error: countError } = await supabase.from("platform_admins").select("user_id", { count:"exact", head:true });
    if (countError) throw countError;
    if ((count || 0) <= 1) return NextResponse.json({error:"At least one platform admin must remain"},{status:400});
    const { error } = await supabase.from("platform_admins").delete().eq("user_id",id);
    if (error) throw error;
    return NextResponse.json({success:true});
  } catch (e:any) { return fail(e, "Could not remove admin"); }
}
