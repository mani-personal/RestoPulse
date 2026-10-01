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
      .from('restaurants')
      .select('*')
      .eq('status', 'Pending')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ approvals: [] }, { status: 200 })
    }

    const formatted = (data || []).map((r: any) => ({
      id: r.id,
      name: r.name,
      city: r.city || 'Not specified',
      submitted: r.created_at
        ? new Date(r.created_at).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })
        : 'Recent',
      docs: r.gstin ? `GSTIN: ${r.gstin}` : 'Business Registration',
      status: 'Pending',
      owner: r.owner_name,
      email: r.owner_email,
      phone: r.owner_phone,
      plan: r.plan || 'Free Trial',
    }))

    return NextResponse.json({ approvals: formatted }, { status: 200 })
  } catch {
    return NextResponse.json({ approvals: [] }, { status: 200 })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = getSupabase()
    const body = await request.json()
    const { restaurant_id, action } = body

    const nextStatus = action === 'approve' ? 'Active' : 'Rejected'

    const { error } = await supabase
      .from('restaurants')
      .update({ status: nextStatus })
      .eq('id', restaurant_id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, status: nextStatus }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
