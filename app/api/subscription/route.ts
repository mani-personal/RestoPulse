import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return createClient(url!, key!)
}

export async function GET(request: Request) {
  try {
    const supabase = getSupabase()
    const { searchParams } = new URL(request.url)
    const restaurant_id = searchParams.get('restaurant_id')
    const email = searchParams.get('email')
    const user_id = searchParams.get('user_id')

    // 1. Fetch active Admin UPI
    const { data: settingData } = await supabase
      .from('settings')
      .select('value, upi_id')
      .eq('key', 'admin_upi')
      .maybeSingle()

    const upi_id = settingData?.upi_id || settingData?.value || 'admin-restopulse@upi'

    // 2. Fetch the target restaurant
    let restaurant: any = null

    if (user_id) {
      const { data: membership } = await supabase
        .from('memberships')
        .select('restaurant_id')
        .eq('user_id', user_id)
        .maybeSingle()

      if (membership?.restaurant_id) {
        const { data: restData } = await supabase
          .from('restaurants')
          .select('*')
          .eq('id', membership.restaurant_id)
          .maybeSingle()
        if (restData) restaurant = restData
      }
    }

    if (!restaurant && restaurant_id && restaurant_id !== '1' && restaurant_id !== 'null') {
      const { data } = await supabase.from('restaurants').select('*').eq('id', restaurant_id).maybeSingle()
      if (data) restaurant = data
    }

    if (!restaurant && email) {
      const { data } = await supabase.from('restaurants').select('*').eq('owner_email', email).maybeSingle()
      if (data) restaurant = data
    }

    return NextResponse.json({
      upi_id,
      restaurant: restaurant
        ? {
            id: restaurant.id,
            name: restaurant.name,
            plan: restaurant.plan || 'Free trial',
            renewal_on: restaurant.renewal_on || '—',
            status: restaurant.status || 'Active',
            owner_email: restaurant.owner_email,
          }
        : null,
    })
  } catch {
    return NextResponse.json({ upi_id: 'admin-restopulse@upi', restaurant: null })
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
        plan: plan || 'Monthly',
        upi_id: upi_id || '',
        screenshot_url: screenshot_url || '',
        message: message || '',
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
