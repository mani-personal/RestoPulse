import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/serverAuth';
export const runtime='nodejs';
export async function POST(request:NextRequest){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret=process.env.SUPABASE_SECRET_KEY;
  if(!url||!secret)return NextResponse.json({error:'Server configuration is incomplete'},{status:503});
  const token=request.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
  if(!token)return NextResponse.json({error:'Sign in required'},{status:401});
  const admin=createClient(url,secret,{auth:{autoRefreshToken:false,persistSession:false}});
  const {data:{user},error:authError}=await admin.auth.getUser(token);
  if(authError||!user)return NextResponse.json({error:'Invalid session'},{status:401});
  const {data:adminRow,error:roleError}=await admin.from('platform_admins').select('user_id').eq('user_id',user.id).maybeSingle();
  if(roleError||!adminRow)return NextResponse.json({error:'Platform admin access required'},{status:403});
  let body:Record<string,unknown>;
  try{body=await request.json()}catch{return NextResponse.json({error:'Invalid JSON'},{status:400})}
  const name=String(body.name||'').trim(),owner=String(body.owner||'').trim(),email=String(body.email||'').trim().toLowerCase(),phone=String(body.phone||'').trim(),password=String(body.password||''),city=String(body.city||'').trim(),plan=String(body.plan||'Free Trial');
  if(name.length<2||owner.length<2||!/^\S+@\S+\.\S+$/.test(email)||!/^\+?[0-9 ()-]{7,20}$/.test(phone)||password.length<12||password.length>128){return NextResponse.json({error:'Enter a restaurant, owner, valid email and phone, and a 12–128 character password'},{status:400})}
  const {data:created,error:createError}=await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{full_name:owner}});
  if(createError||!created.user)return NextResponse.json({error:createError?.message||'Could not create owner'},{status:400});
  const ownerId=created.user.id;
  const {data:restaurant,error:restaurantError}=await admin.from('restaurants').insert({name,owner_name:owner,owner_email:email,owner_phone:phone,city,plan,status:'Trial',renewal_on:new Date(Date.now()+7*86400000).toISOString().slice(0,10)}).select().single();
  if(restaurantError||!restaurant){await admin.auth.admin.deleteUser(ownerId);return NextResponse.json({error:restaurantError?.message||'Could not create restaurant'},{status:400})}
  const {error:memberError}=await admin.from('memberships').insert({user_id:ownerId,restaurant_id:restaurant.id,role:'OWNER'});
  if(memberError){await admin.from('restaurants').delete().eq('id',restaurant.id);await admin.auth.admin.deleteUser(ownerId);return NextResponse.json({error:memberError.message},{status:400})}
  return NextResponse.json({restaurant,owner_user_id:ownerId},{status:201});
}


export async function PATCH(request:NextRequest){
  try{
    const {supabase}=await requireAdmin(request);
    const body=await request.json(); const id=String(body.id||"");
    if(!id)return NextResponse.json({error:"Restaurant ID is required"},{status:400});
    const payload:any={};
    for(const key of ["name","owner_name","owner_phone","city","address","business_phone","gstin","plan","status","renewal_on"]){
      if(body[key]!==undefined) payload[key]=body[key];
    }
    if(!Object.keys(payload).length)return NextResponse.json({error:"No changes supplied"},{status:400});
    const {data,error}=await supabase.from("restaurants").update(payload).eq("id",id).select().single();
    if(error)throw error; return NextResponse.json({success:true,restaurant:data});
  }catch(e:any){return NextResponse.json({error:e.message||"Server error"},{status:Number(e.status)||500});}
}

export async function DELETE(request:NextRequest){
  try{
    const {supabase}=await requireAdmin(request);
    const body=await request.json(); const id=String(body.id||"");
    if(!id)return NextResponse.json({error:"Restaurant ID is required"},{status:400});
    const {error}=await supabase.from("restaurants").update({status:"Paused"}).eq("id",id);
    if(error)throw error; return NextResponse.json({success:true,status:"Paused"});
  }catch(e:any){return NextResponse.json({error:e.message||"Server error"},{status:Number(e.status)||500});}
}
