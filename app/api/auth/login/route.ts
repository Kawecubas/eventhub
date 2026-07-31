import { NextResponse } from "next/server";
import { cookieName, token } from "@/lib/admin-auth";
export async function POST(req:Request){const body=await req.json();if(body.password!==(process.env.EVENTHUB_ADMIN_PASSWORD || process.env.EVENT_ADMIN_PASSWORD || "admin123"))return NextResponse.json({error:"Senha inválida."},{status:401});const res=NextResponse.json({ok:true});res.cookies.set(cookieName(),token(),{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",maxAge:60*60*8,path:"/"});return res;}
