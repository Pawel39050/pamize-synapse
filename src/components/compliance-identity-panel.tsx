"use client";
import {useEffect,useState} from "react";
type Status={authenticated:boolean;roles?:string[];expiresAt?:number};
export function ComplianceIdentityPanel(){
 const [status,setStatus]=useState<Status|null>(null);
 const [message,setMessage]=useState("");
 useEffect(()=>{
  const controller=new AbortController();
  fetch("/api/compliance/auth/session",{cache:"no-store",credentials:"same-origin",signal:controller.signal})
   .then(r=>{if(!r.ok)throw Error("Session check unavailable");return r.json();})
   .then((v:Status)=>setStatus(v))
   .catch(()=>{if(!controller.signal.aborted)setMessage("Nie udało się sprawdzić sesji Microsoft.");});
  return ()=>controller.abort();
 },[]);
 async function logout(){
  setMessage("");
  try{
   const response=await fetch("/api/compliance/auth/logout",{method:"POST",credentials:"same-origin"});
   if(!response.ok)throw Error("Sign out failed");
   setStatus({authenticated:false});
  }catch{setMessage("Wylogowanie nie powiodło się. Odśwież stronę lub spróbuj ponownie.");}
 }
 return <section className="section-block panel" aria-label="Tożsamość i dostęp Compliance Guardian">
  <div className="panel-top"><h2>Microsoft Entra ID · dostęp testowy</h2><span className="pill">PREVIEW · BEZ DANYCH KLIENTÓW</span></div>
  <p className="muted">Logowanie identyfikuje użytkownika i jego rolę. Dostęp do konkretnej firmy wymaga osobnej weryfikacji członkostwa i pozostaje zablokowany.</p>
  {status===null?<p role="status">{message||"Sprawdzanie sesji…"}</p>:
   status.authenticated?<div className="notice compact">
     <p><strong>Sesja Microsoft:</strong> aktywna</p>
     <p><strong>Role:</strong> {status.roles?.join(", ")||"brak"}</p>
     <p><strong>Dostęp do danych organizacji:</strong> nieaktywny do czasu weryfikacji uprawnień</p>
     <button type="button" onClick={logout}>Wyloguj z modułu Compliance</button>
   </div>:
   <div className="notice compact">
     <p>Brak aktywnej sesji Compliance Guardian.</p>
     <a className="btn primary" href="/api/compliance/auth/login">Zaloguj przez Microsoft</a>
   </div>}
  {message&&status!==null&&<p role="status">{message}</p>}
 </section>;
}
