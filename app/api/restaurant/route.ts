import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !serviceKey) {
    throw new Error('Supabase environment variables are missing.')
  }

  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

export async function PATCH(request: Request) {
  try {
    const supabase = getAdminClient()
    const body = await request.json()
    const { id, name, phone, address, gstin, gst_percent, cgst_percent, sgst_percent } = body

    if (!id && !name) {
      return NextResponse.json({ error: 'Restaurant identifier is required' }, { status: 400 })
    }

    // Only update native columns that exist in the Supabase 'restaurants' table schema
    const updatePayload: Record<string, any> = {}
    if (name) updatePayload.name = String(name).trim()
    if (phone) updatePayload.owner_phone = String(phone).trim()
    if (address !== undefined) updatePayload.address = String(address).trim()
    if (gstin !== undefined) updatePayload.gstin = String(gstin).trim()

    let query = supabase.from('restaurants').update(updatePayload)

    if (id && id !== '1' && id !== 'null' && id !== 'undefined') {
      query = query.eq('id', id)
    } else if (name) {
      query = query.ilike('name', String(name).trim())
    }

    const { data, error } = await query.select().maybeSingle()

    if (error) {
      if (error.message?.includes('permission denied')) {
        return NextResponse.json(
          {
            error: "Supabase RLS denied access. Please verify SUPABASE_SERVICE_ROLE_KEY in your deployment environment.",
            fallback: updatePayload,
          },
          { status: 403 }
        )
      }
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Persist tax breakdown safely in settings table without altering restaurant schema
    try {
      await supabase.from('settings').upsert(
        {
          key: `tax_${id || name}`,
          value: JSON.stringify({ gst_percent, cgst_percent, sgst_percent }),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      )
    } catch {}

    return NextResponse.json({
      success: true,
      restaurant: data || updatePayload,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
