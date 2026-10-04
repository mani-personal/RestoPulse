import { NextResponse } from "next/server";
import { requireRestaurantMember } from "@/lib/serverAuth";
export async function PATCH(request:Request){
  try{
    const body=await request.json(); const id=String(body.id||""); const {supabase}=await requireRestaurantMember(request,id,true);
    const payload:any={}; for(const k of ["name","address","business_phone","gstin","receipt_footer"]){if(body[k]!==undefined)payload[k]=String(body[k]||"").trim();}
    if(body.phone!==undefined)payload.owner_phone=String(body.phone||"").trim();
    if(!Object.keys(payload).length)return NextResponse.json({error:"No changes supplied"},{status:400});
    const {data,error}=await supabase.from("restaurants").update(payload).eq("id",id).select().single(); if(error)throw error;
    return NextResponse.json({success:true,restaurant:data});
  }catch(e:any){return NextResponse.json({error:e.message||"Server error"},{status:Number(e.status)||500});}
}
