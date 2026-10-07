import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/serverAuth';

export const runtime = 'nodejs';

function errorResponse(error: any, fallback = 'Server error') {
  return NextResponse.json({ error: error?.message || fallback }, { status: Number(error?.status) || 500 });
}


export async function GET(request: NextRequest) {
  try {
    const { supabase } = await requireAdmin(request);
    const { data, error } = await supabase.from("restaurants").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ restaurants: data || [] });
  } catch (e: any) { return errorResponse(e, "Could not load restaurants"); }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase: admin } = await requireAdmin(request);
    let body: Record<string, unknown>;
    try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

    const name = String(body.name || '').trim();
    const owner = String(body.owner || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const phone = String(body.phone || '').trim();
    const requestedPassword = String(body.password || '').trim();
    const city = String(body.city || '').trim();

    if (name.length < 2) return NextResponse.json({ error: 'Restaurant name is required' }, { status: 400 });
    if (owner.length < 2) return NextResponse.json({ error: 'Owner name is required' }, { status: 400 });
    if (!/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: 'Enter a valid owner email' }, { status: 400 });
    if (!/^\+?[0-9 ()-]{7,20}$/.test(phone)) return NextResponse.json({ error: 'Enter a valid owner phone number' }, { status: 400 });
    if (requestedPassword && (requestedPassword.length < 12 || requestedPassword.length > 128)) return NextResponse.json({ error: 'Temporary password must be 12–128 characters' }, { status: 400 });

    // A restaurant owner may already have a login. Reuse that auth identity so
    // one sign-in can be linked to multiple restaurants through memberships.
    const { data: usersData, error: usersError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (usersError) throw usersError;
    let ownerUser = (usersData?.users || []).find((u:any) => String(u.email || '').toLowerCase() === email) || null;
    let createdNewUser = false;
    let temporaryPassword: string | undefined;

    if (!ownerUser) {
      temporaryPassword = requestedPassword || `${crypto.randomUUID().replace(/-/g, '').slice(0, 10)}A9!x7Q2`;
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email, password: temporaryPassword, email_confirm: true, user_metadata: { full_name: owner },
      });
      if (createError || !created.user) {
        const msg = createError?.message || 'Could not create owner account';
        return NextResponse.json({ error: msg.includes('already registered') ? 'An account with this owner email already exists.' : msg }, { status: 400 });
      }
      ownerUser = created.user;
      createdNewUser = true;
    } else if (requestedPassword) {
      // For an existing owner, do not silently change their password from the
      // Add Restaurant screen. The existing sign-in must remain stable.
      return NextResponse.json({ error: 'This owner already has a login. Leave Temporary password blank to add another restaurant to the same sign-in.' }, { status: 400 });
    }

    const renewal = new Date();
    renewal.setDate(renewal.getDate() + 7);
    const { data: restaurant, error: restaurantError } = await admin.from('restaurants').insert({
      name, owner_name: owner, owner_email: email, owner_phone: phone, city,
      plan: 'Free Trial', status: 'Trial', renewal_on: renewal.toISOString().slice(0, 10),
    }).select().single();

    if (restaurantError || !restaurant) {
      if (createdNewUser && ownerUser) await admin.auth.admin.deleteUser(ownerUser.id);
      return NextResponse.json({ error: restaurantError?.message || 'Could not create restaurant' }, { status: 400 });
    }

    const { error: memberError } = await admin.from('memberships').insert({
      user_id: ownerUser.id, restaurant_id: restaurant.id, role: 'OWNER',
    });
    if (memberError) {
      await admin.from('restaurants').delete().eq('id', restaurant.id);
      if (createdNewUser && ownerUser) await admin.auth.admin.deleteUser(ownerUser.id);
      return NextResponse.json({ error: memberError.message }, { status: 400 });
    }

    return NextResponse.json({
      restaurant,
      owner_user_id: ownerUser.id,
      reused_existing_login: !createdNewUser,
      temporary_password: createdNewUser ? temporaryPassword : undefined,
    }, { status: 201 });
  } catch (e: any) { return errorResponse(e, 'Could not create restaurant'); }
}

export async function PATCH(request: NextRequest) {
  try {
    const { supabase } = await requireAdmin(request);
    const body = await request.json();
    const id = String(body.id || '');
    if (!id) return NextResponse.json({ error: 'Restaurant ID is required' }, { status: 400 });
    const payload: Record<string, unknown> = {};
    for (const key of ['name','owner_name','owner_email','owner_phone','city','address','business_phone','gstin','plan','status','renewal_on']) {
      if (body[key] !== undefined) payload[key] = body[key];
    }
    if (!Object.keys(payload).length) return NextResponse.json({ error: 'No changes supplied' }, { status: 400 });
    const { data, error } = await supabase.from('restaurants').update(payload).eq('id', id).select().single();
    if (error) throw error;
    return NextResponse.json({ success: true, restaurant: data });
  } catch (e: any) { return errorResponse(e); }
}

export async function DELETE(request: NextRequest) {
  try {
    const { supabase } = await requireAdmin(request);
    const body = await request.json();
    const id = String(body.id || '');
    if (!id) return NextResponse.json({ error: 'Restaurant ID is required' }, { status: 400 });
    const { error } = await supabase.from('restaurants').update({ status: 'Paused' }).eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true, status: 'Paused' });
  } catch (e: any) { return errorResponse(e); }
}
