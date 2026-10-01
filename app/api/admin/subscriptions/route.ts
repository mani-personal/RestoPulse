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
    const { data, error } = await supabase
      .from('subscription_requests')
      .select('*')
      .eq('status', 'Pending')
      .order('requested_at', { ascending: false })

    if (error) {
      return NextResponse.json({ requests: [] })
    }
    return NextResponse.json({ requests: data || [] })
  } catch {
    return NextResponse.json({ requests: [] })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = getSupabase()
    const body = await request.json()
    const { request_id, restaurant_id, restaurant_name, owner_email, plan_name, days_to_add, action } = body

    if (action === 'reject') {
      const { error: rejErr } = await supabase
        .from('subscription_requests')
        .update({ status: 'Rejected' })
        .eq('id', request_id)

      if (rejErr) return NextResponse.json({ error: rejErr.message }, { status: 400 })
      return NextResponse.json({ success: true, status: 'Rejected' })
    }

    // Default action: APPROVE
    const { error: subErr } = await supabase
      .from('subscription_requests')
      .update({ status: 'Approved' })
      .eq('id', request_id)

    if (subErr) {
      return NextResponse.json({ error: subErr.message }, { status: 400 })
    }

    const days = Number(days_to_add) || 30
    const planToSet = plan_name || 'Monthly'

    // Fetch existing restaurant to compute cumulative expiration date
    let restaurantQuery = supabase.from('restaurants').select('*')
    if (restaurant_id) {
      restaurantQuery = restaurantQuery.eq('id', restaurant_id)
    } else if (owner_email) {
      restaurantQuery = restaurantQuery.eq('owner_email', owner_email)
    } else if (restaurant_name) {
      restaurantQuery = restaurantQuery.eq('name', restaurant_name)
    }

    const { data: existingRest } = await restaurantQuery.maybeSingle()

    let baseDate = new Date()
    if (existingRest?.renewal_on) {
      const existingRenewal = new Date(existingRest.renewal_on)
      if (!isNaN(existingRenewal.getTime()) && existingRenewal > baseDate) {
        baseDate = existingRenewal
      }
    }

    const nextDate = new Date(baseDate.getTime())
    nextDate.setDate(nextDate.getDate() + days)
    const newRenewalDateStr = nextDate.toISOString().slice(0, 10)

    let updateQuery = supabase.from('restaurants').update({
      status: 'Active',
      plan: planToSet,
      renewal_on: newRenewalDateStr,
    })

    if (existingRest?.id) {
      await updateQuery.eq('id', existingRest.id)
    } else if (restaurant_id) {
      await updateQuery.eq('id', restaurant_id)
    } else if (owner_email) {
      await updateQuery.eq('owner_email', owner_email)
    } else if (restaurant_name) {
      await updateQuery.eq('name', restaurant_name)
    }

    return NextResponse.json({
      success: true,
      status: 'Approved',
      plan: planToSet,
      renewal_on: newRenewalDateStr,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
