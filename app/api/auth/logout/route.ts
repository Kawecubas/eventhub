import { NextResponse } from "next/server";
import { cookieName } from "@/lib/admin-auth";
export async function POST(){const res=NextResponse.json({ok:true});res.cookies.set(cookieName(),"",{expires:new Date(0),path:"/"});return res;}
