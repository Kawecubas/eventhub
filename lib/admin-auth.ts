import crypto from "crypto";
import { cookies } from "next/headers";
const COOKIE="eventhub_admin";
function secret(){return process.env.EVENTHUB_ADMIN_SECRET || process.env.EVENT_ADMIN_SECRET || "troque-esta-senha";}
export function token(){return crypto.createHash("sha256").update(secret()).digest("hex");}
export function isAdmin(){return cookies().get(COOKIE)?.value===token();}
export function cookieName(){return COOKIE;}
