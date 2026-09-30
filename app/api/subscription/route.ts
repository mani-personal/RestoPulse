import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

function serverClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) throw new Error('Server configuration is incomplete');
  return createClient(url, secret, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function authenticated(request: NextRequest) {
  const token = request.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return { error: 'Sign in required', status: 401 as const };
  const admin = serverClient();
  const { data: { user }, error } = await admin.auth.getUser(token);
  if (error || !user) return { error: 'Invalid session', status: 401 as const };
  return { admin, user, error: null, status: 200 as const };
}

export async function GET(request: NextRequest) {
  try {
    const result = await authenticated(request);
    if (result.error || !result.user) return NextResponse.json({ error: result.error }, { status: result.status });
    const { data: membership, error: membershipError } = await result.admin.from('memberships').select('restaurant_id,role').eq('user_id', result.user.id).order('role').limit(1).maybeSingle();
    if (membershipError) return NextResponse.json({ error: membershipError.message }, { status: 500 });
    if (!membership) return NextResponse.json({ error: 'No restaurant assigned' }, { status: 404 });
    const { data: restaurant, error: restaurantError } = await result.admin.from('restaurants').select('id,name,plan,status,renewal_on').eq('id', membership.restaurant_id).single();
    if (restaurantError || !restaurant) return NextResponse.json({ error: restaurantError?.message || 'Restaurant not found' }, { status: 404 });
    const { data: platformAdmin, error: platformError } = await result.admin.from('platform_admins').select('user_id').order('created_at').limit(1).maybeSingle();
    if (platformError) return NextResponse.json({ error: platformError.message }, { status: 500 });
    let upiId = '';
    if (platformAdmin) {
      const { data: adminUser, error: adminUserError } = await result.admin.auth.admin.getUserById(platformAdmin.user_id);
      if (!adminUserError && adminUser.user && typeof adminUser.user.user_metadata?.admin_upi_id === 'string') upiId = adminUser.user.user_metadata.admin_upi_id;
    }
    const metadata = result.user.user_metadata || {};
    const extensionRequest = metadata.subscription_extension_request && typeof metadata.subscription_extension_request === 'object'
      ? metadata.subscription_extension_request
      : null;
    return NextResponse.json({ restaurant, upi_id: upiId, extension_request: extensionRequest });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const result = await authenticated(request);
    if (result.error || !result.user) return NextResponse.json({ error: result.error }, { status: result.status });
    const body = await request.json().catch(() => ({}));
    const action = String(body.action || '');
    if (action !== 'request-extension') return NextResponse.json({ error: 'Unsupported subscription action' }, { status: 400 });
    const { data: membership, error: membershipError } = await result.admin.from('memberships').select('restaurant_id,role').eq('user_id', result.user.id).order('role').limit(1).maybeSingle();
    if (membershipError) return NextResponse.json({ error: membershipError.message }, { status: 500 });
    if (!membership) return NextResponse.json({ error: 'No restaurant assigned' }, { status: 404 });
    const message = String(body.message || '').trim().slice(0, 500);
    const nextMetadata = {
      ...(result.user.user_metadata || {}),
      subscription_extension_request: {
        restaurant_id: membership.restaurant_id,
        requested_at: new Date().toISOString(),
        message,
        status: 'Pending',
      },
    };
    const { error } = await result.admin.auth.admin.updateUserById(result.user.id, { user_metadata: nextMetadata });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true, request: nextMetadata.subscription_extension_request });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Server error' }, { status: 500 });
  }
}
