import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return createClient(url!, key!)
}

export async function PATCH(request: Request) {
  try {
    const supabase = getSupabase()
    const body = await request.json()
    const { id, name, phone, address, gstin, gst_percent, cgst_percent, sgst_percent } = body

    if (!id && !name) {
      return NextResponse.json({ error: 'Restaurant ID or Name required' }, { status: 400 })
    }

    let query = supabase.from('restaurants').update({
      name: name || undefined,
      owner_phone: phone || undefined,
      address: address || undefined,
      gstin: gstin || undefined,
      gst_percent: Number(gst_percent) || 5,
      cgst_percent: Number(cgst_percent) || 2.5,
      sgst_percent: Number(sgst_percent) || 2.5,
    })

    if (id && id !== '1') {
      query = query.eq('id', id)
    } else {
      query = query.ilike('name', name)
    }

    const { data, error } = await query.select().single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, restaurant: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
