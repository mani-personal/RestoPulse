import { NextResponse } from "next/server";
import { requireAdmin, requireUser } from "@/lib/serverAuth";
const defaultPlans = [
  { id: 1, name: "Free trial", price: 0, period: "7 days", features: "Explore core POS, menu items, inventory, and reports.", active: true },
  { id: 2, name: "Monthly", price: 2999, period: "30 days", features: "Full access, table management, live inventory tracking, POS checkout.", active: true },
  { id: 3, name: "Yearly", price: 29999, period: "365 days", features: "Full platform access, priority support, unlimited staff accounts.", active: true },
];
export async function GET(request: Request) {
  try { const {supabase}=await requireUser(request); const {data}=await supabase.from("settings").select("value").eq("key","platform_pricing_plans").maybeSingle(); if(data?.value){try{const p=JSON.parse(data.value);if(Array.isArray(p)&&p.length)return NextResponse.json({plans:p});}catch{}} return NextResponse.json({plans:defaultPlans}); }
  catch(e:any){return NextResponse.json({error:e.message||"Server error",plans:defaultPlans},{status:Number(e.status)||500});}
}
export async function POST(request: Request) {
  try { const {supabase}=await requireAdmin(request); const body=await request.json(); if(!Array.isArray(body.plans))return NextResponse.json({error:"Invalid plans array"},{status:400}); const {error}=await supabase.from("settings").upsert({key:"platform_pricing_plans",value:JSON.stringify(body.plans),updated_at:new Date().toISOString()},{onConflict:"key"}); if(error)throw error; return NextResponse.json({success:true,plans:body.plans});}
  catch(e:any){return NextResponse.json({error:e.message||"Server error"},{status:Number(e.status)||500});}
}
