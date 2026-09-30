import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, supabaseKey)
}

export async function GET(request: Request) {
  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('key', 'admin_upi')
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ value: data?.value || data?.upi_id || '' }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseClient()
    const body = await request.json()
    const upiId = body.upi_id

    const { data, error } = await supabase
      .from('settings')
      .upsert({ 
        key: 'admin_upi', 
        upi_id: upiId, 
        value: upiId,
        updated_at: new Date().toISOString() 
      }, { onConflict: 'key' })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, value: data?.upi_id || data?.value }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
