import { NextResponse } from "next/server";
import { requireAdmin, requireRestaurantMember, getServerClient } from "@/lib/serverAuth";

function fail(e:any){return NextResponse.json({error:e?.message||"Server error"},{status:Number(e?.status)||500});}

export async function GET(request:Request){
  try{
    const url=new URL(request.url), restaurantId=url.searchParams.get("restaurant_id")||"";
    const server=getServerClient();
    const {data:setting}=await server.from("settings").select("value,upi_id").eq("key","admin_upi").maybeSingle();
    const upi_id=setting?.upi_id||setting?.value||"";
    if(restaurantId){
      const {supabase,user}=await requireRestaurantMember(request,restaurantId);
      const {data:restaurant,error}=await supabase.from("restaurants").select("*").eq("id",restaurantId).single();
      if(error)throw error;
      const {data:history}=await supabase.from("subscription_requests").select("*").eq("restaurant_id",restaurantId).order("requested_at",{ascending:false}).limit(100);
      return NextResponse.json({upi_id,restaurant:{id:restaurant.id,name:restaurant.name,plan:restaurant.plan,renewal_on:restaurant.renewal_on,status:restaurant.status,owner_name:restaurant.owner_name,owner_email:restaurant.owner_email,owner_phone:restaurant.owner_phone,address:restaurant.address,gstin:restaurant.gstin},history:history||[],user_id:user.id});
    }
    const {supabase}=await requireAdmin(request);
    const {data:requests,error}=await supabase.from("subscription_requests").select("*").order("requested_at",{ascending:false}).limit(500);
    if(error)throw error;
    const pending=(requests||[]).filter((x:any)=>x.status==="Pending");
    const history=requests||[];
    const revenue=history.filter((x:any)=>x.status==="Approved").reduce((n:any,x:any)=>n+Number(x.amount||0),0);
    return NextResponse.json({upi_id,requests:pending,history,revenue});
  }catch(e){return fail(e);}
}

export async function POST(request:Request){
  try{
    const body=await request.json(), restaurantId=String(body.restaurant_id||"");
    const {supabase}=await requireRestaurantMember(request,restaurantId);
    const {data:rest,error:restError}=await supabase.from("restaurants").select("id,name,owner_name,owner_email").eq("id",restaurantId).single();
    if(restError||!rest)throw restError||new Error("Restaurant not found");
    const amount=Number(body.amount)||0;
    const {data,error}=await supabase.from("subscription_requests").insert({
      restaurant_id:restaurantId,restaurant_name:rest.name,owner_name:rest.owner_name,owner_email:rest.owner_email,
      plan:String(body.plan||"Monthly"),amount,upi_id:String(body.upi_id||""),screenshot_url:String(body.screenshot_url||""),
      reference_id:String(body.reference_id||""),message:String(body.message||""),status:"Pending",requested_at:new Date().toISOString()
    }).select().single();
    if(error)throw error;
    return NextResponse.json({success:true,request:data},{status:201});
  }catch(e){return fail(e);}
}

export async function PATCH(request:Request){
  try{
    const {supabase,user}=await requireAdmin(request); const body=await request.json();
    const requestId=String(body.request_id||""); const action=String(body.action||"");
    if(!requestId)return NextResponse.json({error:"Request ID is required"},{status:400});
    const {data:req,error:reqError}=await supabase.from("subscription_requests").select("*").eq("id",requestId).single();
    if(reqError||!req)throw reqError||new Error("Subscription request not found");
    if(action==="reject"){
      const {error}=await supabase.from("subscription_requests").update({status:"Rejected",reviewed_at:new Date().toISOString(),reviewed_by:user.id}).eq("id",requestId);
      if(error)throw error; return NextResponse.json({success:true,status:"Rejected"});
    }
    const days=Number(body.days_to_add)||((String(req.plan).toLowerCase().includes("year"))?365:(String(req.plan).toLowerCase().includes("7")?7:30));
    const {data:rest,error:restError}=await supabase.from("restaurants").select("id,renewal_on").eq("id",req.restaurant_id).single(); if(restError||!rest)throw restError||new Error("Restaurant not found");
    let base=new Date(); if(rest.renewal_on){const d=new Date(rest.renewal_on);if(!isNaN(d.getTime())&&d>base)base=d;}
    base.setDate(base.getDate()+days); const renewal=base.toISOString().slice(0,10);
    const {error:updateError}=await supabase.from("restaurants").update({status:"Active",plan:req.plan,renewal_on:renewal}).eq("id",rest.id); if(updateError)throw updateError;
    const {error:reqUpdate}=await supabase.from("subscription_requests").update({status:"Approved",reviewed_at:new Date().toISOString(),reviewed_by:user.id}).eq("id",requestId); if(reqUpdate)throw reqUpdate;
    return NextResponse.json({success:true,status:"Approved",restaurant_id:rest.id,plan:req.plan,renewal_on:renewal});
  }catch(e){return fail(e);}
}
