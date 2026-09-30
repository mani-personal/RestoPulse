import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

type AuthUser = { id: string; user_metadata?: Record<string, unknown> };

function serverClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) throw new Error('Server configuration is incomplete');
  return createClient(url, secret, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function getUser(request: NextRequest) {
  const token = request.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return { admin: null, user: null as AuthUser | null, error: 'Sign in required', status: 401 as const };
  const admin = serverClient();
  const { data: { user }, error } = await admin.auth.getUser(token);
  if (error || !user) return { admin, user: null, error: 'Invalid session', status: 401 as const };
  return { admin, user: user as AuthUser, error: null, status: 200 as const };
}

async function requireAdmin(request: NextRequest) {
  const result = await getUser(request);
  if (result.error || !result.user) return result;
  const { data: row, error } = await result.admin.from('platform_admins').select('user_id').eq('user_id', result.user.id).maybeSingle();
  if (error) return { ...result, error: error.message, status: 500 as const };
  if (!row) return { ...result, error: 'Platform admin access required', status: 403 as const };
  return result;
}

export async function GET(request: NextRequest) {
  try {
    const result = await requireAdmin(request);
    if (result.error) return NextResponse.json({ error: result.error }, { status: result.status });
    const value = typeof result.user?.user_metadata?.admin_upi_id === 'string' ? result.user.user_metadata.admin_upi_id : '';
    return NextResponse.json({ key: 'admin_upi_id', value });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const result = await requireAdmin(request);
    if (result.error) return NextResponse.json({ error: result.error }, { status: result.status });
    const body = await request.json().catch(() => ({}));
    const upiId = String(body.upi_id ?? '').trim();
    if (upiId && !/^[\w.-]+@[\w.-]+$/.test(upiId)) {
      return NextResponse.json({ error: 'Enter a valid UPI ID, for example payments@bank' }, { status: 400 });
    }
    const currentMetadata = result.user?.user_metadata || {};
    const nextMetadata = { ...currentMetadata, admin_upi_id: upiId };
    const { data, error } = await result.admin.auth.admin.updateUserById(result.user!.id, { user_metadata: nextMetadata });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true, value: typeof data.user?.user_metadata?.admin_upi_id === 'string' ? data.user.user_metadata.admin_upi_id : '' });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Server error' }, { status: 500 });
  }
}
