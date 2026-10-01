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

    // Default: APPROVE
    const { error: subErr } = await supabase
      .from('subscription_requests')
      .update({ status: 'Approved' })
      .eq('id', request_id)

    if (subErr) {
      return NextResponse.json({ error: subErr.message }, { status: 400 })
    }

    // Calculate days based on plan name
    let days = Number(days_to_add)
    const normalizedPlan = (plan_name || 'Monthly').trim()
    if (!days || isNaN(days)) {
      if (normalizedPlan.toLowerCase().includes('year')) days = 365
      else if (normalizedPlan.toLowerCase().includes('7')) days = 7
      else if (normalizedPlan.toLowerCase().includes('14')) days = 14
      else days = 30
    }

    // Find the matching restaurant record
    let restaurantQuery = supabase.from('restaurants').select('*')
    if (restaurant_id && restaurant_id !== '1') {
      restaurantQuery = restaurantQuery.eq('id', restaurant_id)
    } else if (owner_email && owner_email !== 'owner@example.com') {
      restaurantQuery = restaurantQuery.eq('owner_email', owner_email)
    } else if (restaurant_name) {
      restaurantQuery = restaurantQuery.eq('name', restaurant_name)
    }

    const { data: existingRest } = await restaurantQuery.maybeSingle()

    // Base date: stack onto existing future renewal date if present
    let baseDate = new Date()
    if (existingRest?.renewal_on && existingRest.renewal_on !== '—') {
      const existingRenewal = new Date(existingRest.renewal_on)
      if (!isNaN(existingRenewal.getTime()) && existingRenewal > baseDate) {
        baseDate = existingRenewal
      }
    }

    const nextDate = new Date(baseDate.getTime())
    nextDate.setDate(nextDate.getDate() + days)
    const newRenewalDateStr = nextDate.toISOString().slice(0, 10)

    // Update restaurant record
    let updateQuery = supabase.from('restaurants').update({
      status: 'Active',
      plan: normalizedPlan,
      renewal_on: newRenewalDateStr,
    })

    if (existingRest?.id) {
      await updateQuery.eq('id', existingRest.id)
    } else if (restaurant_id && restaurant_id !== '1') {
      await updateQuery.eq('id', restaurant_id)
    } else if (restaurant_name) {
      await updateQuery.eq('name', restaurant_name)
    } else {
      // Fallback: update the latest restaurant
      const { data: latest } = await supabase.from('restaurants').select('id').order('created_at', { ascending: false }).limit(1).single()
      if (latest?.id) {
        await updateQuery.eq('id', latest.id)
      }
    }

    return NextResponse.json({
      success: true,
      status: 'Approved',
      plan: normalizedPlan,
      renewal_on: newRenewalDateStr,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
