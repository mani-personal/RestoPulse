import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  // Prioritize the service role key to bypass table RLS policies
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
      return NextResponse.json({ error: 'Restaurant ID or Name required' }, { status: 400 })
    }

    // Prepare safe update payload containing only native restaurants table columns
    const updatePayload: Record<string, any> = {}
    if (name) updatePayload.name = name.trim()
    if (phone) updatePayload.owner_phone = phone.trim()
    if (address !== undefined) updatePayload.address = address.trim()
    if (gstin !== undefined) updatePayload.gstin = gstin.trim()

    let query = supabase.from('restaurants').update(updatePayload)

    if (id && id !== '1' && id !== 'null' && id !== 'undefined') {
      query = query.eq('id', id)
    } else if (name) {
      query = query.ilike('name', name.trim())
    }

    const { data, error } = await query.select().maybeSingle()

    if (error) {
      // If RLS blocked it because service role key isn't set in Vercel
      if (error.message?.includes('permission denied')) {
        return NextResponse.json(
          {
            error:
              "Permission denied by Supabase RLS. Please add 'SUPABASE_SERVICE_ROLE_KEY' to your Vercel Environment Variables.",
            fallback: updatePayload,
          },
          { status: 403 }
        )
      }
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Optionally save tax configuration to settings table
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
