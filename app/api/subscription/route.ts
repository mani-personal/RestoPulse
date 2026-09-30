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
    
    // Fetch Admin UPI ID from settings
    const { data: settingData } = await supabase
      .from('settings')
      .select('*')
      .eq('key', 'admin_upi')
      .maybeSingle()

    const upi_id = settingData?.upi_id || settingData?.value || 'admin-restopulse@upi'

    return NextResponse.json({ upi_id }, { status: 200 })
  } catch {
    return NextResponse.json({ upi_id: 'admin-restopulse@upi' }, { status: 200 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseClient()
    const body = await request.json()
    const { restaurant_id, restaurant_name, owner_name, owner_email, plan, upi_id, screenshot_url, message } = body

    const { data, error } = await supabase
      .from('subscription_requests')
      .insert({
        restaurant_id,
        restaurant_name,
        owner_name,
        owner_email,
        plan,
        upi_id,
        screenshot_url,
        message: message || 'Payment screenshot uploaded for renewal',
        status: 'Pending'
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true, request: data }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
