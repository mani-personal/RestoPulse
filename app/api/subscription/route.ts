import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return createClient(url!, key!)
}

export async function GET() {
  try {
    const supabase = getSupabase()
    const { data: settingData } = await supabase
      .from('settings')
      .select('value, upi_id')
      .eq('key', 'admin_upi')
      .maybeSingle()

    const upi_id = settingData?.upi_id || settingData?.value || 'admin-restopulse@upi'
    return NextResponse.json({ upi_id })
  } catch {
    return NextResponse.json({ upi_id: 'admin-restopulse@upi' })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabase()
    const body = await request.json()
    const { restaurant_id, restaurant_name, owner_name, owner_email, plan, upi_id, screenshot_url, message } = body

    const { data, error } = await supabase
      .from('subscription_requests')
      .insert({
        restaurant_id: restaurant_id || null,
        restaurant_name: restaurant_name || 'Restaurant',
        owner_name: owner_name || 'Owner',
        owner_email: owner_email || 'owner@example.com',
        plan: plan || 'Starter',
        upi_id: upi_id || '',
        screenshot_url: screenshot_url || '',
        message: message || 'Payment proof submitted for renewal',
        status: 'Pending',
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ success: true, request: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
