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
  const { data, error } = await supabase.from('restaurants').select('*')
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  if (!await checkSuperAdmin(supabase)) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  const body = await request.json()
  const { data, error } = await supabase.from('restaurants').insert([body]).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

export async function PUT(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  if (!await checkSuperAdmin(supabase)) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  const { id, ...updates } = await request.json()
  const { data, error } = await supabase.from('restaurants').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

export async function DELETE(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  if (!await checkSuperAdmin(supabase)) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const { error } = await supabase.from('restaurants').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
