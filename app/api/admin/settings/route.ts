import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

async function checkSuperAdmin(supabase: any) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return false
  const { data } = await supabase.from('platform_admins').select('user_id').eq('user_id', session.user.id).single()
  return !!data
}

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies })
  if (!await checkSuperAdmin(supabase)) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  const { data, error } = await supabase.from('platform_settings').select('*').eq('key', 'admin_upi_id').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  if (!await checkSuperAdmin(supabase)) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  const { upi_id } = await request.json()
  const { data, error } = await supabase.from('platform_settings').update({ value: upi_id, updated_at: new Date().toISOString() }).eq('key', 'admin_upi_id').select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true, data })
}
```[cite: 1, 2]