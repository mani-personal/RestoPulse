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

    // Only update columns that exist in the database schema
    const updatePayload: Record<string, any> = {}
    if (name) updatePayload.name = name
    if (phone) updatePayload.owner_phone = phone
    if (address !== undefined) updatePayload.address = address
    if (gstin !== undefined) updatePayload.gstin = gstin

    let query = supabase.from('restaurants').update(updatePayload)

    if (id && id !== '1' && id !== 'null') {
      query = query.eq('id', id)
    } else if (name) {
      query = query.ilike('name', name)
    }

    const { data, error } = await query.select().maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Save tax settings in the settings table if available
    try {
      await supabase.from('settings').upsert({
        key: `tax_settings_${id || name}`,
        value: JSON.stringify({ gst_percent, cgst_percent, sgst_percent }),
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' })
    } catch {}

    return NextResponse.json({
      success: true,
      restaurant: data || updatePayload
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
