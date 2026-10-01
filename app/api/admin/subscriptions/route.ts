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

    // Mark subscription request as Approved
    const { error: subErr } = await supabase
      .from('subscription_requests')
      .update({ status: 'Approved' })
      .eq('id', request_id)

    if (subErr) {
      return NextResponse.json({ error: subErr.message }, { status: 400 })
    }

    // Calculate days based on plan name
    const normalizedPlan = (plan_name || 'Monthly').trim()
    let days = Number(days_to_add)
    if (!days || isNaN(days)) {
      if (normalizedPlan.toLowerCase().includes('year')) days = 365
      else if (normalizedPlan.toLowerCase().includes('7')) days = 7
      else if (normalizedPlan.toLowerCase().includes('14')) days = 14
      else days = 30
    }

    // Match restaurant
    let existingRest: any = null
    if (restaurant_id && restaurant_id !== '1' && restaurant_id !== 'null') {
      const { data } = await supabase.from('restaurants').select('*').eq('id', restaurant_id).maybeSingle()
      if (data) existingRest = data
    }
    if (!existingRest && owner_email) {
      const { data } = await supabase.from('restaurants').select('*').eq('owner_email', owner_email).maybeSingle()
      if (data) existingRest = data
    }
    if (!existingRest && restaurant_name) {
      const { data } = await supabase.from('restaurants').select('*').ilike('name', restaurant_name).maybeSingle()
      if (data) existingRest = data
    }
    if (!existingRest) {
      const { data } = await supabase.from('restaurants').select('*').order('created_at', { ascending: false }).limit(1).maybeSingle()
      if (data) existingRest = data
    }

    // Stacking: add onto future expiry date if available
    let baseDate = new Date()
    if (existingRest?.renewal_on && existingRest.renewal_on !== '—') {
      const existingRenewal = new Date(existingRest.renewal_on)
      if (!isNaN(existingRenewal.getTime()) && existingRenewal > baseDate) {
        baseDate = existingRenewal
      }
    }

    const nextDate = new Date(baseDate.getTime())
    nextDate.setDate(nextDate.getDate() + days)
    const newRenewalDateStr = nextDate.toISOString().slice(0, 10) // YYYY-MM-DD

    if (existingRest?.id) {
      await supabase
        .from('restaurants')
        .update({
          status: 'Active',
          plan: normalizedPlan,
          renewal_on: newRenewalDateStr,
        })
        .eq('id', existingRest.id)
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
