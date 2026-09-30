import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

function serverClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) throw new Error('Server configuration is incomplete');
  return createClient(url, secret, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function requireAdmin(request: NextRequest) {
  const token = request.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return { error: 'Sign in required', status: 401 as const };
  const admin = serverClient();
  const { data: { user }, error: authError } = await admin.auth.getUser(token);
  if (authError || !user) return { error: 'Invalid session', status: 401 as const };
  const { data: row, error } = await admin.from('platform_admins').select('user_id').eq('user_id', user.id).maybeSingle();
  if (error) return { error: error.message, status: 500 as const };
  if (!row) return { error: 'Platform admin access required', status: 403 as const };
  return { admin, user, error: null, status: 200 as const };
}

export async function GET(request: NextRequest) {
  try {
    const result = await requireAdmin(request);
    if (result.error || !result.admin) return NextResponse.json({ error: result.error }, { status: result.status });
    const { data: restaurants, error: restaurantError } = await result.admin.from('restaurants').select('id,name,owner_name,owner_email,plan,status,renewal_on').order('created_at', { ascending: false });
    if (restaurantError) return NextResponse.json({ error: restaurantError.message }, { status: 500 });
    const items = [];
    for (const restaurant of restaurants || []) {
      const { data: owners, error: ownerError } = await result.admin.from('memberships').select('user_id').eq('restaurant_id', restaurant.id).eq('role', 'OWNER').limit(1);
      if (ownerError || !owners?.[0]) continue;
      const { data: ownerUser, error: userError } = await result.admin.auth.admin.getUserById(owners[0].user_id);
      if (userError || !ownerUser.user) continue;
      const metadata = ownerUser.user.user_metadata || {};
      const extensionRequest = metadata.subscription_extension_request && typeof metadata.subscription_extension_request === 'object' ? metadata.subscription_extension_request as Record<string, unknown> : null;
      if (!extensionRequest || extensionRequest.status !== 'Pending') continue;
      items.push({
        user_id: owners[0].user_id,
        restaurant_id: restaurant.id,
        restaurant_name: restaurant.name,
        owner_name: restaurant.owner_name,
        owner_email: restaurant.owner_email,
        plan: restaurant.plan,
        renewal_on: restaurant.renewal_on,
        requested_at: typeof extensionRequest.requested_at === 'string' ? extensionRequest.requested_at : '',
        message: typeof extensionRequest.message === 'string' ? extensionRequest.message : '',
      });
    }
    return NextResponse.json({ requests: items });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const result = await requireAdmin(request);
    if (result.error || !result.admin) return NextResponse.json({ error: result.error }, { status: result.status });
    const body = await request.json().catch(() => ({}));
    const userId = String(body.user_id || '');
    if (!userId) return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    const { data: ownerUser, error: userError } = await result.admin.auth.admin.getUserById(userId);
    if (userError || !ownerUser.user) return NextResponse.json({ error: userError?.message || 'Owner not found' }, { status: 404 });
    const nextMetadata = { ...(ownerUser.user.user_metadata || {}), subscription_extension_request: null };
    const { error } = await result.admin.auth.admin.updateUserById(userId, { user_metadata: nextMetadata });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Server error' }, { status: 500 });
  }
}
