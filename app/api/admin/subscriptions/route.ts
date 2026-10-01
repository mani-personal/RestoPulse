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
    const { request_id, restaurant_id, plan_name, days_to_add } = body

    // 1. Mark subscription request as Approved
    const { error: subErr } = await supabase
      .from('subscription_requests')
      .update({ status: 'Approved' })
      .eq('id', request_id)

    if (subErr) {
      return NextResponse.json({ error: subErr.message }, { status: 400 })
    }

    // 2. Automatically compute the renewal expiration date based on the plan duration
    if (restaurant_id) {
      const days = Number(days_to_add) || 30
      const nextDate = new Date()
      nextDate.setDate(nextDate.getDate() + days)
      const renewalDateStr = nextDate.toLocaleDateString('en-CA') // YYYY-MM-DD

      await supabase
        .from('restaurants')
        .update({
          status: 'Active',
          plan: plan_name || 'Growth',
          renewal_on: renewalDateStr,
        })
        .eq('id', restaurant_id)
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
