import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return createClient(supabaseUrl!, supabaseKey!)
}

export async function GET(request: Request) {
  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('subscription_requests')
      .select('*')
      .eq('status', 'Pending')
      .order('requested_at', { ascending: false })

    if (error) return NextResponse.json({ requests: [] }, { status: 200 })
    return NextResponse.json({ requests: data || [] }, { status: 200 })
  } catch {
    return NextResponse.json({ requests: [] }, { status: 200 })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = getSupabaseClient()
    const body = await request.json()
    const { request_id } = body

    const { error } = await supabase
      .from('subscription_requests')
      .update({ status: 'Approved' })
      .eq('id', request_id)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
