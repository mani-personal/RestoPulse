import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  return createClient(url!, serviceKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

const defaultPlans = [
  { id: 1, name: "Free trial", price: 0, period: "7 days", features: "Explore core POS, menu items, inventory, and reports.", active: true },
  { id: 2, name: "Monthly", price: 2999, period: "30 days", features: "Full access, table management, live inventory tracking, POS checkout.", active: true },
  { id: 3, name: "Yearly", price: 29999, period: "365 days", features: "Full platform access, priority support, unlimited staff accounts.", active: true },
]

export async function GET() {
  try {
    const supabase = getAdminClient()
    const { data: settingData } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'platform_pricing_plans')
      .maybeSingle()

    if (settingData?.value) {
      try {
        const parsed = JSON.parse(settingData.value)
        if (Array.isArray(parsed) && parsed.length) {
          return NextResponse.json({ plans: parsed })
        }
      } catch {}
    }

    return NextResponse.json({ plans: defaultPlans })
  } catch {
    return NextResponse.json({ plans: defaultPlans })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = getAdminClient()
    const body = await request.json()
    const { plans } = body

    if (!Array.isArray(plans)) {
      return NextResponse.json({ error: 'Invalid plans array' }, { status: 400 })
    }

    await supabase.from('settings').upsert({
      key: 'platform_pricing_plans',
      value: JSON.stringify(plans),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'key' })

    return NextResponse.json({ success: true, plans })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
