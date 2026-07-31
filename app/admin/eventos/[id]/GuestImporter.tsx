"use client";

import {useMemo,useRef,useState} from "react";
import * as XLSX from "xlsx";

type ImportRow={row:number;name:string;company:string;email:string;phone:string;errors:string[]};
type Props={eventId:string;onImported:(guests:any[])=>void};

const aliases={
  name:["nome","name","convidado"],
  company:["empresa","company","organizacao","organização"],
  email:["e-mail","email","e_mail"],
  phone:["telefone","phone","celular","whatsapp"]
};
function normalize(value:unknown){return String(value??"").trim()}
function key(value:string){return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\s+/g,"_")}
function getValue(row:Record<string,unknown>,names:string[]){
  const entry=Object.entries(row).find(([k])=>names.map(key).includes(key(k)));
  return normalize(entry?.[1]);
}
function validate(rows:Record<string,unknown>[]):ImportRow[]{
  const emails=new Set<string>();
  return rows.map((raw,index)=>{
    const name=getValue(raw,aliases.name),company=getValue(raw,aliases.company),email=getValue(raw,aliases.email).toLowerCase(),phone=getValue(raw,aliases.phone);
    const errors:string[]=[];
    if(!name) errors.push("Nome obrigatório");
    if(!email||!/^\S+@\S+\.\S+$/.test(email)) errors.push("E-mail inválido");
    else if(emails.has(email)) errors.push("E-mail duplicado no arquivo");
    if(email) emails.add(email);
    return {row:index+2,name,company,email,phone,errors};
  }).filter(r=>r.name||r.company||r.email||r.phone);
}

export default function GuestImporter({eventId,onImported}:Props){
  const inputRef=useRef<HTMLInputElement>(null);
  const [rows,setRows]=useState<ImportRow[]>([]);
  const [fileName,setFileName]=useState("");
  const [loading,setLoading]=useState(false);
  const [duplicateMode,setDuplicateMode]=useState<"skip"|"update">("skip");
  const [result,setResult]=useState("");
  const valid=useMemo(()=>rows.filter(r=>r.errors.length===0),[rows]);

  async function open(file?:File){
    if(!file)return;
    setFileName(file.name);setResult("");
    try{
      const data=await file.arrayBuffer();
      const workbook=XLSX.read(data,{type:"array"});
      const first=workbook.Sheets[workbook.SheetNames[0]];
      const json=XLSX.utils.sheet_to_json<Record<string,unknown>>(first,{defval:"",raw:false});
      setRows(validate(json));
    }catch{setRows([]);setResult("Não foi possível ler o arquivo. Use o modelo XLSX ou um CSV UTF-8.")}
  }
  async function submit(){
    if(!valid.length)return;
    setLoading(true);setResult("");
    try{
      const response=await fetch(`/api/eventos/${eventId}/convidados/importar`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({duplicateMode,rows:valid.map(r=>({row:r.row,name:r.name,company:r.company,email:r.email,phone:r.phone}))})});
      const data=await response.json();
      if(!response.ok)throw new Error(data.error||"Falha na importação");
      onImported(data.created||[]);
      setResult(`${data.created?.length||0} convidados importados. ${data.duplicates?.length||0} duplicados encontrados.`);
      setRows([]);setFileName("");if(inputRef.current)inputRef.current.value="";
    }catch(error){setResult(error instanceof Error?error.message:"Falha na importação")}finally{setLoading(false)}
  }
  return <div className="importer">
    <div className="importer-head"><div><h3>Importar convidados</h3><p>Envie Excel ou CSV seguindo o modelo oficial.</p></div><a className="model-link" href="/modelos/modelo-importacao-convidados.xlsx" download>Baixar modelo</a></div>
    <div className="import-actions"><input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" onChange={e=>open(e.target.files?.[0])}/><select value={duplicateMode} onChange={e=>setDuplicateMode(e.target.value as "skip"|"update")}><option value="skip">Ignorar e-mails já cadastrados</option><option value="update">Atualizar e-mails já cadastrados</option></select></div>
    {fileName&&<p className="file-info"><strong>{fileName}</strong> — {rows.length} linhas, {valid.length} válidas, {rows.length-valid.length} com erro.</p>}
    {rows.length>0&&<div className="import-preview"><table><thead><tr><th>Linha</th><th>Nome</th><th>Empresa</th><th>E-mail</th><th>Telefone</th><th>Validação</th></tr></thead><tbody>{rows.slice(0,100).map(r=><tr key={r.row} className={r.errors.length?"invalid":"valid"}><td>{r.row}</td><td>{r.name||"—"}</td><td>{r.company||"—"}</td><td>{r.email||"—"}</td><td>{r.phone||"—"}</td><td>{r.errors.length?r.errors.join("; "):"Pronto"}</td></tr>)}</tbody></table>{rows.length>100&&<p>Pré-visualização limitada às primeiras 100 linhas.</p>}</div>}
    {rows.length>0&&<div className="import-footer"><button type="button" onClick={()=>{setRows([]);setFileName("");if(inputRef.current)inputRef.current.value=""}}>Cancelar</button><button className="primary" type="button" disabled={!valid.length||loading} onClick={submit}>{loading?"Importando...":`Importar ${valid.length} convidados`}</button></div>}
    {result&&<div className="import-result">{result}</div>}
  </div>
}
