import fs from "fs";
import path from "path";
import crypto from "crypto";

export type EventDate={id:string;label:string;capacity?:number};
export type EventGuest={id:string;token:string;name:string;company:string;email:string;phone?:string;status:"pending"|"confirmed"|"declined";selectedDate?:string;notes?:string;sentAt?:string;respondedAt?:string;createdAt:string};
export type EventItem={id:string;slug:string;name:string;description:string;location:string;startInfo:string;primaryColor:string;secondaryColor:string;logo?:string;banner?:string;emailFrom:string;emailSubject:string;emailBody:string;status:"draft"|"published"|"closed";dates:EventDate[];guests:EventGuest[];createdAt:string;updatedAt:string};
type Store={events:EventItem[]};
const dir=path.join(process.cwd(),"data"); const file=path.join(dir,"eventos.json");
function init(){if(!fs.existsSync(dir))fs.mkdirSync(dir,{recursive:true});if(!fs.existsSync(file))fs.writeFileSync(file,JSON.stringify({events:[]},null,2));}
function read():Store{init();return JSON.parse(fs.readFileSync(file,"utf8"));}
function write(s:Store){init();fs.writeFileSync(file,JSON.stringify(s,null,2));}
export function listEvents(){return read().events;}
export function getEvent(id:string){return listEvents().find(e=>e.id===id);}
export function getEventBySlug(slug:string){return listEvents().find(e=>e.slug===slug);}
export function saveEvent(input:Partial<EventItem> & {name:string;slug:string}){const s=read();const now=new Date().toISOString();const existing=input.id?s.events.find(e=>e.id===input.id):undefined;const base:EventItem=existing||{id:crypto.randomUUID(),slug:input.slug,name:input.name,description:"",location:"",startInfo:"",primaryColor:"#173b57",secondaryColor:"#d5a44c",emailFrom:"Eventos <eventos@seudominio.com>",emailSubject:"Convite: {{evento}}",emailBody:"Olá, {{nome}}. Você está convidado para o evento {{evento}}. Confirme sua participação: {{link}}",status:"draft",dates:[],guests:[],createdAt:now,updatedAt:now};Object.assign(base,input,{updatedAt:now});if(!existing)s.events.unshift(base);write(s);return base;}
export function removeEvent(id:string){const s=read();s.events=s.events.filter(e=>e.id!==id);write(s);}
export function addGuest(eventId:string,input:{name:string;company:string;email:string;phone?:string}){const s=read();const ev=s.events.find(e=>e.id===eventId);if(!ev)return null;const g:EventGuest={id:crypto.randomUUID(),token:crypto.randomBytes(18).toString("hex"),name:input.name,company:input.company,email:input.email,phone:input.phone||"",status:"pending",createdAt:new Date().toISOString()};ev.guests.unshift(g);ev.updatedAt=new Date().toISOString();write(s);return g;}
export function deleteGuest(eventId:string,guestId:string){const s=read();const ev=s.events.find(e=>e.id===eventId);if(!ev)return false;const n=ev.guests.length;ev.guests=ev.guests.filter(g=>g.id!==guestId);write(s);return ev.guests.length<n;}
export function findGuest(slug:string,token:string){const ev=getEventBySlug(slug);const guest=ev?.guests.find(g=>g.token===token);return ev&&guest?{event:ev,guest}:null;}
export function respond(slug:string,token:string,input:{status:"confirmed"|"declined";selectedDate?:string;notes?:string}){const s=read();const ev=s.events.find(e=>e.slug===slug);const g=ev?.guests.find(x=>x.token===token);if(!ev||!g)return null;g.status=input.status;g.selectedDate=input.status==="confirmed"?input.selectedDate:"";g.notes=input.notes||"";g.respondedAt=new Date().toISOString();write(s);return g;}
export function markSent(eventId:string,guestIds:string[]){const s=read();const ev=s.events.find(e=>e.id===eventId);if(!ev)return;const now=new Date().toISOString();ev.guests.forEach(g=>{if(guestIds.includes(g.id))g.sentAt=now});write(s);}

export type GuestImportInput={name:string;company?:string;email:string;phone?:string;row?:number};
export type GuestImportResult={created:EventGuest[];duplicates:GuestImportInput[];invalid:{row?:number;reason:string;data:GuestImportInput}[]};

export function importGuests(eventId:string,rows:GuestImportInput[],duplicateMode:"skip"|"update"="skip"):GuestImportResult{
  const s=read();
  const ev=s.events.find(e=>e.id===eventId);
  if(!ev) throw new Error("Evento não encontrado");
  const result:GuestImportResult={created:[],duplicates:[],invalid:[]};
  const normalizedExisting=new Map(ev.guests.map(g=>[g.email.trim().toLowerCase(),g]));
  const seen=new Set<string>();
  const now=new Date().toISOString();

  for(const row of rows){
    const name=(row.name||"").trim();
    const company=(row.company||"").trim();
    const email=(row.email||"").trim().toLowerCase();
    const phone=(row.phone||"").trim();
    const data={...row,name,company,email,phone};
    if(!name){result.invalid.push({row:row.row,reason:"Nome obrigatório",data});continue;}
    if(!email||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){result.invalid.push({row:row.row,reason:"E-mail inválido",data});continue;}
    if(seen.has(email)){result.invalid.push({row:row.row,reason:"E-mail duplicado no arquivo",data});continue;}
    seen.add(email);
    const existing=normalizedExisting.get(email);
    if(existing){
      result.duplicates.push(data);
      if(duplicateMode==="update"){
        existing.name=name;
        existing.company=company;
        existing.phone=phone;
      }
      continue;
    }
    const guest:EventGuest={id:crypto.randomUUID(),token:crypto.randomBytes(18).toString("hex"),name,company,email,phone,status:"pending",createdAt:now};
    ev.guests.unshift(guest);
    normalizedExisting.set(email,guest);
    result.created.push(guest);
  }
  ev.updatedAt=now;
  write(s);
  return result;
}
