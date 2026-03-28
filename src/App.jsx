import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { dbGet, dbSet } from "./supabase";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";

/* ═══════════════════════════════════════════
   ICONS
   ═══════════════════════════════════════════ */
const I={
  Plus:()=><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Trash:()=><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>,
  User:()=><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  File:()=><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  Edit:()=><svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  X:()=><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Check:()=><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>,
  Search:()=><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Calc:()=><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/></svg>,
  Home:()=><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Copy:()=><svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>,
  Chev:({d="down"})=><svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24">{d==="down"?<polyline points="6 9 12 15 18 9"/>:<polyline points="18 15 12 9 6 15"/>}</svg>,
  Dollar:()=><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
  Layers:()=><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
  Settings:()=><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  Printer:()=><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>,
  Package:()=><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  Hammer:()=><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><path d="M15 12l-8.5 8.5c-.83.83-2.17.83-3 0a2.12 2.12 0 010-3L12 9"/><path d="M17.64 15L22 10.64"/><path d="M20.91 11.7l-1.25-1.25c-.6-.6-.93-1.4-.93-2.25V6.5a.5.5 0 00-.5-.5H16.5a3.17 3.17 0 01-2.25-.93L13 3.82"/></svg>,
  Kanban:()=><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>,
  DRE:()=><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>,
  Lock:()=><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>,
  Clip:()=><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>,
  Clock:()=><svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Send:()=><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  Box:()=><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>,
  Percent:()=><svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>,
  Wallet:()=><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><path d="M21 12V7H5a2 2 0 010-4h14v4"/><path d="M3 5v14a2 2 0 002 2h16v-5"/><path d="M18 12a2 2 0 000 4h4v-4h-4z"/></svg>,
  Bank:()=><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><path d="M3 21h18"/><path d="M3 10h18"/><path d="M5 6l7-3 7 3"/><path d="M4 10v11"/><path d="M20 10v11"/><path d="M8 14v4"/><path d="M12 14v4"/><path d="M16 14v4"/></svg>,
  Target:()=><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  Phone:()=><svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>,
  Mail:()=><svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  Star:()=><svg width="13" height="13" fill="currentColor" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  Zap:()=><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
};

/* ═══════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════ */
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const R$=v=>(v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const hoje=()=>new Date().toLocaleDateString("pt-BR");
const hojeISO=()=>new Date().toISOString().split("T")[0];
const MARKUP=3.2;
const GARANTIA=`Garantia de 12 meses contra defeitos de fabricação.\nNão cobre: mau uso, umidade excessiva, modificações por terceiros.\nAjustes dentro da garantia sem custo adicional.`;
const PAGAMENTO=`• 50% na aprovação\n• 30% início fabricação\n• 20% na entrega\n\nPIX (3% desc.), Transf., Boleto, Cartão até 10x.\nValidade: 15 dias.`;
const KCOLS=[{id:"aguardando",label:"Aguardando",color:"#6366f1"},{id:"material",label:"Material",color:"#f59e0b"},{id:"producao",label:"Produção",color:"#3b82f6"},{id:"acabamento",label:"Acabamento",color:"#8b5cf6"},{id:"entrega",label:"Entrega",color:"#10b981"},{id:"concluido",label:"Concluído",color:"#6b7280"}];
const LEAD_STAGES=["Novo Lead","Contato Feito","Proposta Enviada","Negociação","Fechado/Ganho","Perdido"];
const LEAD_COLORS=["#6366f1","#3b82f6","#f59e0b","#8b5cf6","#10b981","#ef4444"];

/* ═══════════════════════════════════════════
   GLOBAL CSS — BLING LIGHT THEME
   ═══════════════════════════════════════════ */
const CSS=`
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap');
:root{
  --bg:#f5f6fa;--sf:#ffffff;--cd:#ffffff;--bd:#e8ecf1;--bd2:#d1d8e0;
  --tx:#1e293b;--tx2:#64748b;--tx3:#94a3b8;
  --pri:#6366f1;--pri2:#4f46e5;--prib:rgba(99,102,241,.08);--prib2:rgba(99,102,241,.15);
  --gn:#10b981;--gnb:rgba(16,185,129,.08);
  --rd:#ef4444;--rdb:rgba(239,68,68,.08);
  --bl:#3b82f6;--blb:rgba(59,130,246,.08);
  --am:#f59e0b;--amb:rgba(245,158,11,.08);
  --pp:#8b5cf6;--ppb:rgba(139,92,246,.08);
  --pk:#ec4899;--pkb:rgba(236,72,153,.08);
  --ft:'Nunito',sans-serif;
  --r:12px;--rl:16px;--sh:0 1px 3px rgba(0,0,0,.06),0 4px 16px rgba(0,0,0,.04);--sh2:0 8px 32px rgba(0,0,0,.1)
}
*{box-sizing:border-box;margin:0;padding:0}
button{cursor:pointer;font-family:var(--ft)}input,textarea,select{font-family:var(--ft)}
::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:var(--bd2);border-radius:3px}
@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
@keyframes scaleIn{from{opacity:0;transform:scale(.97)}to{opacity:1;transform:scale(1)}}
@keyframes slideR{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)}}
.hr:hover{background:var(--bg)!important}
.hr2:hover{border-color:var(--pri)!important;background:var(--prib)!important}
.kcard{transition:all .15s}.kcard:hover{transform:translateY(-2px);box-shadow:var(--sh2)}
/* ── MOBILE ── */
@media(max-width:768px){
  .erp-wrap{flex-direction:column!important}
  .erp-sidebar{width:100%!important;min-height:unset!important;flex-direction:row!important;border-right:none!important;border-bottom:1.5px solid var(--bd)!important;position:sticky!important;top:0!important;z-index:50!important;overflow-x:auto}
  .erp-sidebar .sidebar-logo{display:none!important}
  .erp-sidebar nav{display:flex!important;flex-direction:row!important;padding:0!important;overflow-x:auto!important;flex:1}
  .erp-sidebar nav>div{padding:10px 12px!important;border-left:none!important;border-bottom:3px solid transparent!important;flex-shrink:0;font-size:10px!important}
  .erp-sidebar nav>div[style*="var(--pri)"]{border-bottom-color:var(--pri)!important;border-left-color:transparent!important}
  .erp-sidebar nav>div span{display:none}
  .erp-sidebar .sidebar-user{display:none!important}
  .erp-main{padding:12px!important;min-height:calc(100vh - 60px)!important}
  .mob-kpi{flex-direction:column!important}
  .mob-grid2{grid-template-columns:1fr!important}
  .mob-hide{display:none!important}
}
@media(min-width:769px){.erp-sidebar{width:205px}}
`;

/* ═══════════════════════════════════════════
   SUB COMPONENTS
   ═══════════════════════════════════════════ */
const Modal=({children,onClose,wide,xwide})=>(
  <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(30,41,59,.4)",backdropFilter:"blur(4px)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",animation:"fadeIn .15s"}}>
    <div onClick={e=>e.stopPropagation()} style={{background:"var(--cd)",border:"1px solid var(--bd)",borderRadius:20,padding:28,width:xwide?"97%":wide?"95%":"92%",maxWidth:xwide?1200:wide?900:520,maxHeight:"90vh",overflowY:"auto",animation:"scaleIn .2s",boxShadow:"var(--sh2)"}}>{children}</div>
  </div>
);

// commitOnBlur=true: uncontrolled (não causa re-render no parent a cada tecla)
function Field({label,value,onChange,placeholder,type="text",rows,disabled,style:sx,options,commitOnBlur}){
  const ref=useRef(null);
  // Sincroniza valor externo → input apenas se não estiver focado
  useEffect(()=>{
    if(commitOnBlur&&ref.current&&document.activeElement!==ref.current)
      ref.current.value=value==null?"":String(value);
  },[value,commitOnBlur]);
  const IS=commitOnBlur
    ?{ref,defaultValue:value==null?"":String(value),onBlur:e=>onChange(type==="number"?+e.target.value:e.target.value)}
    :{value:value==null?"":String(value),onChange:e=>onChange(type==="number"?+e.target.value:e.target.value)};
  const ST={width:"100%",padding:"10px 12px",borderRadius:"var(--r)",border:"1.5px solid var(--bd)",background:"var(--sf)",color:"var(--tx)",fontSize:13,fontWeight:500,outline:"none"};
  return(
    <div style={{marginBottom:12,...sx}}>
      {label&&<label style={{display:"block",fontSize:11,fontWeight:700,color:"var(--tx2)",textTransform:"uppercase",letterSpacing:".5px",marginBottom:4}}>{label}</label>}
      {options?<select value={value} onChange={e=>onChange(e.target.value)} disabled={disabled} style={ST}>{options.map(o=><option key={o.v||o} value={o.v||o}>{o.l||o}</option>)}</select>
      :rows?<textarea {...IS} placeholder={placeholder} rows={rows} disabled={disabled} style={{...ST,resize:"vertical",lineHeight:1.5}}/>
      :<input type={type} {...IS} placeholder={placeholder} disabled={disabled} style={ST}/>}
    </div>
  );
}

// Input sem re-render no parent a cada tecla (uncontrolled + commit onBlur)
function BlurInput({value,onCommit,type="text",placeholder,style:sx,...rest}){
  const ref=useRef(null);
  useEffect(()=>{if(ref.current&&document.activeElement!==ref.current)ref.current.value=value==null?"":String(value);},[value]);
  return <input ref={ref} type={type} defaultValue={value==null?"":String(value)} onBlur={e=>onCommit(type==="number"?+e.target.value:e.target.value)} placeholder={placeholder} style={sx} {...rest}/>;
}

const Btn=({children,onClick,v="primary",small,style:sx,disabled})=>{
  const b={padding:small?"6px 14px":"10px 20px",borderRadius:10,border:"none",fontSize:small?12:13,fontWeight:700,display:"inline-flex",alignItems:"center",gap:6,transition:"all .15s",opacity:disabled?.4:1,letterSpacing:".01em"};
  const vs={
    primary:{...b,background:"var(--pri)",color:"#fff",boxShadow:"0 2px 8px rgba(99,102,241,.3)"},
    secondary:{...b,background:"var(--bg)",color:"var(--tx)",border:"1.5px solid var(--bd)"},
    ghost:{...b,background:"transparent",color:"var(--tx2)",border:"1.5px solid var(--bd)"},
    danger:{...b,background:"var(--rdb)",color:"var(--rd)"},
    success:{...b,background:"var(--gnb)",color:"var(--gn)"},
    blue:{...b,background:"var(--blb)",color:"var(--bl)"},
    amber:{...b,background:"var(--amb)",color:"var(--am)"},
  };
  return <button onClick={onClick} style={{...vs[v],...sx}} disabled={disabled}>{children}</button>;
};

const Badge=({children,color="pri"})=>{
  const m={pri:{bg:"var(--prib)",fg:"var(--pri)"},green:{bg:"var(--gnb)",fg:"var(--gn)"},red:{bg:"var(--rdb)",fg:"var(--rd)"},blue:{bg:"var(--blb)",fg:"var(--bl)"},amber:{bg:"var(--amb)",fg:"var(--am)"},purple:{bg:"var(--ppb)",fg:"var(--pp)"},pink:{bg:"var(--pkb)",fg:"var(--pk)"}};
  const c=m[color]||m.pri;
  return <span style={{padding:"3px 10px",borderRadius:20,fontSize:10,fontWeight:800,background:c.bg,color:c.fg,whiteSpace:"nowrap",textTransform:"uppercase",letterSpacing:".3px"}}>{children}</span>;
};

const KPI=({label,value,sub,icon,color="pri",trend})=>(
  <div style={{background:"var(--cd)",border:"1.5px solid var(--bd)",borderRadius:"var(--rl)",padding:"18px 20px",flex:1,minWidth:160,animation:"fadeIn .4s",boxShadow:"var(--sh)"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
      <span style={{fontSize:10,fontWeight:800,color:"var(--tx3)",textTransform:"uppercase",letterSpacing:".6px"}}>{label}</span>
      <div style={{width:34,height:34,borderRadius:10,background:`var(--${color}b)`,display:"flex",alignItems:"center",justifyContent:"center",color:`var(--${color})`}}>{icon}</div>
    </div>
    <div style={{fontSize:22,fontWeight:800,color:"var(--tx)"}}>{value}</div>
    {sub&&<div style={{fontSize:11,color:"var(--tx3)",marginTop:2,fontWeight:600}}>{sub}</div>}
  </div>
);

const Card=({children,style:sx})=><div style={{background:"var(--cd)",border:"1.5px solid var(--bd)",borderRadius:"var(--rl)",boxShadow:"var(--sh)",overflow:"hidden",...sx}}>{children}</div>;

const CardHead=({title,right})=><div style={{padding:"14px 20px",borderBottom:"1.5px solid var(--bd)",display:"flex",justifyContent:"space-between",alignItems:"center"}}><h3 style={{fontSize:14,fontWeight:800,color:"var(--tx)"}}>{title}</h3>{right}</div>;

const TH=({cols})=><div style={{display:"grid",gridTemplateColumns:cols.map(c=>c.w||"1fr").join(" "),gap:6,padding:"10px 18px",borderBottom:"1.5px solid var(--bd)",background:"var(--bg)"}}>{cols.map(c=><span key={c.l} style={{fontSize:9,fontWeight:800,textTransform:"uppercase",letterSpacing:".7px",color:"var(--tx3)"}}>{c.l}</span>)}</div>;

const SH=({title,sub,right})=><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18,flexWrap:"wrap",gap:8}}><div><h1 style={{fontSize:24,fontWeight:800,color:"var(--tx)"}}>{title}</h1>{sub&&<p style={{color:"var(--tx3)",fontSize:12,fontWeight:600,marginTop:2}}>{sub}</p>}</div>{right&&<div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{right}</div>}</div>;

/* ═══════════════════════════════════════════
   MODAL COMPONENTS (fora do ERP para respeitar Rules of Hooks)
   ═══════════════════════════════════════════ */
function ModalEditCli({d,setModal,saveCli}){
  const [f,setF]=useState(d||{});
  const u=(k,v)=>setF(p=>({...p,[k]:v}));
  const isE=!!d?.id;
  return(<><h2 style={{fontSize:16,fontWeight:800,marginBottom:16}}>{isE?"Editar":"Novo"} Cliente</h2>
    <Field label="Nome" value={f.nome||""} onChange={v=>u("nome",v)}/>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
      <Field label="CPF/CNPJ" value={f.doc||""} onChange={v=>u("doc",v)}/>
      <Field label="Telefone" value={f.tel||""} onChange={v=>u("tel",v)}/>
    </div>
    <Field label="E-mail" value={f.email||""} onChange={v=>u("email",v)}/>
    <Field label="Endereço" value={f.endereco||""} onChange={v=>u("endereco",v)}/>
    <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
      <Btn v="ghost" onClick={()=>setModal(null)}>Cancelar</Btn>
      <Btn onClick={()=>saveCli(f)}><I.Check/> Salvar</Btn>
    </div>
  </>);
}

function ModalSelCli({clientes,setModal,criarOrc}){
  const [s,setS]=useState("");
  const l=clientes.filter(c=>c.nome.toLowerCase().includes(s.toLowerCase()));
  return(<><h2 style={{fontSize:16,fontWeight:800,marginBottom:14}}>Selecionar Cliente</h2>
    <div style={{position:"relative",marginBottom:12}}>
      <div style={{position:"absolute",left:12,top:10,color:"var(--tx3)"}}><I.Search/></div>
      <input value={s} onChange={e=>setS(e.target.value)} placeholder="Buscar..." style={{width:"100%",padding:"10px 14px 10px 36px",borderRadius:"var(--r)",border:"1.5px solid var(--bd)",background:"var(--sf)",color:"var(--tx)",fontSize:13,outline:"none"}}/>
    </div>
    <div style={{maxHeight:250,overflowY:"auto"}}>
      {l.map(c=><div key={c.id} onClick={()=>criarOrc(c.id)} className="hr2" style={{padding:"10px 12px",borderRadius:"var(--r)",border:"1.5px solid var(--bd)",marginBottom:5,cursor:"pointer"}}>
        <div style={{fontWeight:700,fontSize:12,color:"var(--tx)"}}>{c.nome}</div>
        <div style={{fontSize:11,color:"var(--tx3)"}}>{c.doc}</div>
      </div>)}
    </div>
    <div style={{borderTop:"1.5px solid var(--bd)",paddingTop:10,marginTop:6}}>
      <Btn v="ghost" onClick={()=>setModal({t:"editCli",d:{}})} style={{width:"100%",justifyContent:"center"}}><I.Plus/> Novo Cliente</Btn>
    </div>
  </>);
}

function ModalEditLead({d,setModal,setLeads,showToast}){
  const isE=!!d?.id;
  const [f,setF]=useState(d||{nome:"",tel:"",email:"",origem:"",interesse:"",valor:0,etapa:"Novo Lead",obs:"",prioridade:"media",data:hoje()});
  const u=(k,v)=>setF(p=>({...p,[k]:v}));
  return(<><h2 style={{fontSize:16,fontWeight:800,marginBottom:16}}>{isE?"Editar":"Novo"} Lead</h2>
    <Field label="Nome" value={f.nome} onChange={v=>u("nome",v)} placeholder="Nome do lead"/>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
      <Field label="Telefone" value={f.tel} onChange={v=>u("tel",v)}/>
      <Field label="E-mail" value={f.email} onChange={v=>u("email",v)}/>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
      <Field label="Origem" value={f.origem} onChange={v=>u("origem",v)} placeholder="Instagram, Site, Indicação..."/>
      <Field label="Valor Estimado" type="number" value={f.valor} onChange={v=>u("valor",+v)}/>
    </div>
    <Field label="Interesse" value={f.interesse} onChange={v=>u("interesse",v)} placeholder="Cozinha, Closet..."/>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
      <Field label="Etapa" value={f.etapa} onChange={v=>u("etapa",v)} options={LEAD_STAGES}/>
      <Field label="Prioridade" value={f.prioridade} onChange={v=>u("prioridade",v)} options={["alta","media","baixa"]}/>
    </div>
    <Field label="Observações" value={f.obs} onChange={v=>u("obs",v)} rows={2}/>
    <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
      <Btn v="ghost" onClick={()=>setModal(null)}>Cancelar</Btn>
      <Btn onClick={()=>{
        if(!f.nome)return showToast("Nome!","red");
        if(isE)setLeads(p=>p.map(l=>l.id===f.id?{...l,...f}:l));
        else setLeads(p=>[...p,{...f,id:uid()}]);
        setModal(null);showToast("Lead salvo!");
      }}><I.Check/> Salvar</Btn>
    </div>
  </>);
}

function ModalNewFin({setModal,setFinanceiro,showToast}){
  const [f,setF]=useState({tipo:"pagar",desc:"",valor:0,fornecedor:"",numParc:1});
  return(<><h2 style={{fontSize:16,fontWeight:800,marginBottom:16}}>Nova Conta</h2>
    <Field label="Tipo" value={f.tipo} onChange={v=>setF(p=>({...p,tipo:v}))} options={[{v:"pagar",l:"A Pagar"},{v:"receber",l:"A Receber"}]}/>
    <Field label="Descrição" value={f.desc} onChange={v=>setF(p=>({...p,desc:v}))} placeholder="Descrição da conta"/>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
      <Field label="Valor Total" type="number" value={f.valor} onChange={v=>setF(p=>({...p,valor:+v}))}/>
      <Field label="Nº Parcelas" type="number" value={f.numParc} onChange={v=>setF(p=>({...p,numParc:Math.max(1,+v)}))}/>
    </div>
    {f.tipo==="pagar"&&<Field label="Fornecedor" value={f.fornecedor} onChange={v=>setF(p=>({...p,fornecedor:v}))}/>}
    <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:8}}>
      <Btn v="ghost" onClick={()=>setModal(null)}>Cancelar</Btn>
      <Btn onClick={()=>{
        if(!f.desc)return showToast("Descrição!","red");
        const vParc=f.valor/f.numParc;
        const parcelas=Array.from({length:f.numParc},(_,i)=>({id:uid(),valor:vParc,venc:"",pago:false,dataPago:""}));
        setFinanceiro(prev=>[...prev,{id:uid(),tipo:f.tipo,desc:f.desc,valor:f.valor,valorPago:0,parcelas,fornecedor:f.fornecedor,status:"aberto"}]);
        setModal(null);showToast("Conta criada!");
      }}><I.Check/> Criar</Btn>
    </div>
  </>);
}

function PgConfig({empresa,saveEmpresa}){
  const [f,setF]=useState({...empresa});
  const u=(k,v)=>setF(p=>({...p,[k]:v}));
  const handleLogo=e=>{const file=e.target.files[0];if(!file)return;const reader=new FileReader();reader.onload=ev=>u("logo",ev.target.result);reader.readAsDataURL(file);};
  return(
    <div style={{animation:"fadeIn .3s",maxWidth:720}}>
      <SH title="Configurações da Empresa" sub="Informações usadas nos orçamentos e proposta comercial"/>
      <Card style={{padding:24,marginBottom:16}}>
        <h3 style={{fontSize:13,fontWeight:800,color:"var(--tx)",marginBottom:16,textTransform:"uppercase",letterSpacing:".5px"}}>Dados da Empresa</h3>
        <Field label="Nome da Empresa" value={f.nome} onChange={v=>u("nome",v)} placeholder="Ex: Marcenaria Silva"/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Field label="CNPJ / CPF" value={f.cnpj} onChange={v=>u("cnpj",v)} placeholder="00.000.000/0001-00"/>
          <Field label="Telefone" value={f.telefone} onChange={v=>u("telefone",v)} placeholder="(00) 00000-0000"/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Field label="E-mail" value={f.email} onChange={v=>u("email",v)} placeholder="contato@empresa.com"/>
          <Field label="Endereço" value={f.endereco} onChange={v=>u("endereco",v)} placeholder="Rua, número - Cidade/UF"/>
        </div>
      </Card>
      <Card style={{padding:24,marginBottom:16}}>
        <h3 style={{fontSize:13,fontWeight:800,color:"var(--tx)",marginBottom:16,textTransform:"uppercase",letterSpacing:".5px"}}>Logo da Empresa</h3>
        <div style={{display:"flex",gap:20,alignItems:"center"}}>
          {f.logo?<img src={f.logo} alt="logo" style={{width:100,height:100,objectFit:"contain",border:"1.5px solid var(--bd)",borderRadius:12,background:"var(--bg)",padding:8}}/>:<div style={{width:100,height:100,border:"2px dashed var(--bd)",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",color:"var(--tx3)",fontSize:11,fontWeight:700}}>Sem logo</div>}
          <div>
            <label style={{display:"inline-flex",alignItems:"center",gap:6,padding:"10px 16px",borderRadius:10,background:"var(--prib)",color:"var(--pri)",fontSize:12,fontWeight:700,cursor:"pointer",border:"1.5px solid var(--pri)"}}>
              <I.Clip/> Carregar Logo
              <input type="file" accept="image/*" onChange={handleLogo} style={{display:"none"}}/>
            </label>
            {f.logo&&<button onClick={()=>u("logo","")} style={{display:"block",marginTop:8,background:"none",border:"none",color:"var(--rd)",fontSize:11,fontWeight:700,cursor:"pointer"}}>Remover logo</button>}
            <p style={{fontSize:10,color:"var(--tx3)",marginTop:6,fontWeight:600}}>PNG ou JPG • Será exibido no cabeçalho dos orçamentos</p>
          </div>
        </div>
        {f.logo&&(
          <div style={{marginTop:16,border:"1.5px solid var(--bd)",borderRadius:12,padding:20,background:"var(--bg)"}}>
            <p style={{fontSize:10,fontWeight:800,color:"var(--tx3)",marginBottom:12,textTransform:"uppercase"}}>Prévia do Cabeçalho</p>
            <div style={{borderBottom:"3px solid #6366f1",paddingBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <img src={f.logo} alt="logo" style={{height:48,objectFit:"contain"}}/>
                <div><div style={{fontWeight:800,fontSize:16,color:"#1e293b"}}>{f.nome||"Empresa"}</div><div style={{fontSize:11,color:"#888"}}>{f.endereco}</div></div>
              </div>
              <div style={{textAlign:"right",fontSize:11,color:"#888"}}><div>{f.telefone}</div><div>{f.email}</div><div>{f.cnpj}</div></div>
            </div>
          </div>
        )}
      </Card>
      <Card style={{padding:24,marginBottom:16}}>
        <h3 style={{fontSize:13,fontWeight:800,color:"var(--tx)",marginBottom:16,textTransform:"uppercase",letterSpacing:".5px"}}>Acesso do Administrador</h3>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Field label="Login do Admin" value={f.loginAdmin} onChange={v=>u("loginAdmin",v)}/>
          <Field label="Senha do Admin" type="password" value={f.senhaAdmin} onChange={v=>u("senhaAdmin",v)}/>
        </div>
        <p style={{fontSize:11,color:"var(--tx3)",fontWeight:600}}>Use essas credenciais para entrar como administrador no sistema.</p>
      </Card>
      <Btn onClick={()=>saveEmpresa(f)} style={{width:"100%",justifyContent:"center",padding:14}}><I.Check/> Salvar Configurações</Btn>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════ */
export default function ERP(){
  const [user,setUser]=useState(()=>{try{const u=localStorage.getItem('erpUser');return u?JSON.parse(u):{role:"admin",nome:"Admin",id:"admin"};}catch{return{role:"admin",nome:"Admin",id:"admin"};}});
  const [loginView,setLoginView]=useState(null);
  const [loginErr,setLoginErr]=useState("");
  const [tab,setTab]=useState("dashboard");
  const [modal,setModal]=useState(null);
  const [toast,setToast]=useState(null);
  const [orcAtivo,setOrcAtivo]=useState(null);
  const [pedAtivo,setPedAtivo]=useState(null);
  const [ambAberto,setAmbAberto]=useState(null);
  const [insModal,setInsModal]=useState(null);

  // ── DATA STORE ──
  const LS=k=>{try{const v=localStorage.getItem('erp_'+k);return v?JSON.parse(v):null;}catch{return null;}};
  const DEMO_CLIENTES=[{id:"cli1",nome:"João Mendes",tel:"(19)99812-3456",email:"joao@email.com",endereco:"Rua Augusta 450, Campinas/SP",doc:"123.456.789-00"},{id:"cli2",nome:"Ana Costa",tel:"(19)98765-4321",email:"ana@email.com",endereco:"Av Brasil 1200, Valinhos/SP",doc:"987.654.321-00"}];
  const DEMO_MARC=[{id:"m1",nome:"Carlos Silva",tel:"(19)99111-2233",esp:"Cozinhas",comissao:12,login:"carlos",senha:"1234",ativo:true},{id:"m2",nome:"Roberto Alves",tel:"(19)99444-5566",esp:"Dormitórios",comissao:10,login:"roberto",senha:"1234",ativo:true}];
  const DEMO_EST=[{id:"e1",nome:"MDF Branco 15mm",un:"chapa",qtd:45,custo:189.90},{id:"e2",nome:"MDF Amadeirado 15mm",un:"chapa",qtd:30,custo:210.50},{id:"e3",nome:"Puxador Gota 128mm",un:"un",qtd:200,custo:12.80},{id:"e4",nome:"Dobradiça 35mm",un:"un",qtd:500,custo:4.50},{id:"e5",nome:"Corrediça 400mm",un:"par",qtd:80,custo:38.90}];
  const DEMO_LEADS=[{id:"l1",nome:"Fernando Lima",tel:"(19)99777-8899",email:"fernando@gmail.com",origem:"Instagram",interesse:"Cozinha completa",valor:25000,etapa:"Novo Lead",obs:"Viu nosso post e entrou em contato",data:hoje(),prioridade:"alta"},{id:"l2",nome:"Mariana Souza",tel:"(19)98888-1122",email:"mari@hotmail.com",origem:"Indicação",interesse:"Closet casal",valor:15000,etapa:"Contato Feito",obs:"Indicação do João Mendes",data:hoje(),prioridade:"media"},{id:"l3",nome:"Ricardo Prado",tel:"(11)99666-3344",email:"ricardo@empresa.com",origem:"Site",interesse:"Escritório completo",valor:35000,etapa:"Proposta Enviada",obs:"Empresa precisa de 3 estações",data:hoje(),prioridade:"alta"}];
  const [clientes,setClientes]=useState(()=>LS('clientes')||DEMO_CLIENTES);
  const [orcamentos,setOrcamentos]=useState(()=>LS('orcamentos')||[]);
  const [pedidos,setPedidos]=useState(()=>LS('pedidos')||[]);
  const [marceneiros,setMarceneiros]=useState(()=>LS('marceneiros')||DEMO_MARC);
  const [estoque,setEstoque]=useState(()=>LS('estoque')||DEMO_EST);
  const [financeiro,setFinanceiro]=useState(()=>LS('financeiro')||[]);
  const [leads,setLeads]=useState(()=>LS('leads')||DEMO_LEADS);
  const [bankSync,setBankSync]=useState({connected:false,banco:"",agencia:"",conta:"",lastSync:""});
  const [dbLoaded,setDbLoaded]=useState(false);
  const [empresa,setEmpresa]=useState(()=>{try{return JSON.parse(localStorage.getItem('erpEmpresa'))||{nome:"Marcenaria",endereco:"",telefone:"",email:"",cnpj:"",logo:"",loginAdmin:"admin",senhaAdmin:"admin123"};}catch{return{nome:"Marcenaria",endereco:"",telefone:"",email:"",cnpj:"",logo:"",loginAdmin:"admin",senhaAdmin:"admin123"};}});

  const showToast=useCallback((msg,type="success")=>{setToast({msg,type});setTimeout(()=>setToast(null),2500)},[]);
  const saveEmpresa=e=>{setEmpresa(e);localStorage.setItem('erpEmpresa',JSON.stringify(e));dbSet('empresa',e);showToast("Empresa salva!");};

  // ── SUPABASE SYNC ──
  const syncTimers=useRef({});
  const syncCloud=(k,v)=>{
    localStorage.setItem('erp_'+k,JSON.stringify(v));
    clearTimeout(syncTimers.current[k]);
    syncTimers.current[k]=setTimeout(()=>dbSet(k,v),1500);
  };
  // Load from Supabase on mount (overrides localStorage if cloud has data)
  useEffect(()=>{
    const load=async()=>{
      const keys=['clientes','orcamentos','pedidos','marceneiros','estoque','financeiro','leads','empresa'];
      const setters={clientes:setClientes,orcamentos:setOrcamentos,pedidos:setPedidos,marceneiros:setMarceneiros,estoque:setEstoque,financeiro:setFinanceiro,leads:setLeads,empresa:setEmpresa};
      for(const k of keys){
        const cloud=await dbGet(k);
        if(cloud!==null) setters[k](cloud);
      }
      setDbLoaded(true);
    };
    load();
  },[]);
  // Save to cloud whenever data changes (skip before initial load completes)
  useEffect(()=>{if(dbLoaded)syncCloud('clientes',clientes);},[clientes,dbLoaded]);
  useEffect(()=>{if(dbLoaded)syncCloud('orcamentos',orcamentos);},[orcamentos,dbLoaded]);
  useEffect(()=>{if(dbLoaded)syncCloud('pedidos',pedidos);},[pedidos,dbLoaded]);
  useEffect(()=>{if(dbLoaded)syncCloud('marceneiros',marceneiros);},[marceneiros,dbLoaded]);
  useEffect(()=>{if(dbLoaded)syncCloud('estoque',estoque);},[estoque,dbLoaded]);
  useEffect(()=>{if(dbLoaded)syncCloud('financeiro',financeiro);},[financeiro,dbLoaded]);
  useEffect(()=>{if(dbLoaded)syncCloud('leads',leads);},[leads,dbLoaded]);

  // ── CRUD ──
  const getCli=id=>clientes.find(c=>c.id===id);
  const getMarc=id=>marceneiros.find(m=>m.id===id);
  const totalOrc=o=>(o?.ambientes||[]).reduce((s,a)=>s+(a.valorTotal||0),0);

  const saveCli=c=>{if(!c.nome?.trim())return showToast("Nome obrigatório","red");if(c.id&&clientes.find(x=>x.id===c.id)){setClientes(p=>p.map(x=>x.id===c.id?{...x,...c}:x))}else{setClientes(p=>[...p,{...c,id:uid()}])}setModal(null);showToast("Cliente salvo!")};

  const criarOrc=cid=>{const o={id:uid(),num:`ORC-${String(orcamentos.length+1).padStart(4,"0")}`,clienteId:cid,data:hoje(),status:"rascunho",ambientes:[],garantia:GARANTIA,garantiaE:false,pagamento:PAGAMENTO,pagamentoE:false};setOrcamentos(p=>[...p,o]);setOrcAtivo(o.id);setTab("orcamentos");setModal(null);showToast(o.num+" criado!")};
  const updOrc=useCallback((id,fn)=>setOrcamentos(p=>p.map(o=>o.id===id?(typeof fn==="function"?fn(o):{...o,...fn}):o)),[]);

  const addAmb=oid=>{const a={id:uid(),nome:"",desc:"",insumos:[],vi:0,valorTotal:0};updOrc(oid,o=>({...o,ambientes:[...o.ambientes,a]}));setAmbAberto(a.id)};
  const updAmb=(oid,aid,d)=>updOrc(oid,o=>({...o,ambientes:o.ambientes.map(a=>a.id===aid?{...a,...d}:a)}));
  const delAmb=(oid,aid)=>{updOrc(oid,o=>({...o,ambientes:o.ambientes.filter(a=>a.id!==aid)}));showToast("Removido","red")};

  const addIns=(oid,aid)=>updOrc(oid,o=>({...o,ambientes:o.ambientes.map(a=>a.id===aid?{...a,insumos:[...a.insumos,{id:uid(),nome:"",qtd:1,vu:0}]}:a)}));
  const updIns=(oid,aid,iid,d)=>updOrc(oid,o=>({...o,ambientes:o.ambientes.map(a=>{if(a.id!==aid)return a;const ins=a.insumos.map(i=>i.id===iid?{...i,...d}:i);const vi=ins.reduce((s,i)=>s+(i.qtd*i.vu),0);return{...a,insumos:ins,vi,valorTotal:vi*MARKUP}})}));
  const delIns=(oid,aid,iid)=>updOrc(oid,o=>({...o,ambientes:o.ambientes.map(a=>{if(a.id!==aid)return a;const ins=a.insumos.filter(i=>i.id!==iid);const vi=ins.reduce((s,i)=>s+(i.qtd*i.vu),0);return{...a,insumos:ins,vi,valorTotal:vi*MARKUP}})}));

  const gerarPedido=orc=>{
    const mats=[];orc.ambientes.forEach(a=>a.insumos.forEach(i=>{if(i.nome)mats.push({id:uid(),nome:i.nome,qtd:i.qtd,vu:i.vu,sub:i.qtd*i.vu})}));
    const vt=totalOrc(orc);const cm=mats.reduce((s,m)=>s+m.sub,0);
    const p={id:uid(),num:`PED-${String(pedidos.length+1).padStart(4,"0")}`,orcId:orc.id,clienteId:orc.clienteId,data:hoje(),dataEntrega:"",status:"em_espera",marcId:"",stage:"aguardando",mats,cm,vt,comPerc:0,comVal:0,pags:[],arquivos:[],ambs:orc.ambientes.map(a=>({nome:a.nome,desc:a.desc,val:a.valorTotal})),garantia:orc.garantia,pgTermos:orc.pagamento};
    setPedidos(prev=>[...prev,p]);updOrc(orc.id,{status:"aprovado"});
    // Gerar conta a receber
    const parcelas=[{id:uid(),valor:vt*0.5,venc:hojeISO(),pago:false,dataPago:""},{id:uid(),valor:vt*0.3,venc:"",pago:false,dataPago:""},{id:uid(),valor:vt*0.2,venc:"",pago:false,dataPago:""}];
    setFinanceiro(prev=>[...prev,{id:uid(),tipo:"receber",desc:`${p.num} - ${getCli(orc.clienteId)?.nome}`,valor:vt,valorPago:0,parcelas,pedidoId:p.id,clienteId:orc.clienteId,status:"aberto"}]);
    // Gerar conta a pagar (materiais)
    if(cm>0){setFinanceiro(prev=>[...prev,{id:uid(),tipo:"pagar",desc:`Materiais ${p.num}`,valor:cm,valorPago:0,parcelas:[{id:uid(),valor:cm,venc:hojeISO(),pago:false,dataPago:""}],pedidoId:p.id,fornecedor:"Fornecedor",status:"aberto"}])}
    showToast(`Pedido ${p.num} gerado!`);setTab("pedidos");
  };

  const updPed=useCallback((id,fn)=>setPedidos(p=>p.map(o=>o.id===id?(typeof fn==="function"?fn(o):{...o,...fn}):o)),[]);

  const designarMarc=(pid,mid)=>{const m=getMarc(mid);if(!m)return;updPed(pid,p=>({...p,marcId:mid,comPerc:m.comissao,comVal:p.vt*(m.comissao/100),status:"em_producao"}));showToast(`Designado: ${m.nome}`)};

  const pagarParcela=(finId,parId,valor)=>{
    setFinanceiro(prev=>prev.map(f=>{
      if(f.id!==finId)return f;
      const parcelas=f.parcelas.map(p=>p.id===parId?{...p,pago:true,dataPago:hoje(),valor:+valor||p.valor}:p);
      const valorPago=parcelas.filter(p=>p.pago).reduce((s,p)=>s+p.valor,0);
      const status=valorPago>=f.valor?"pago":valorPago>0?"parcial":"aberto";
      return{...f,parcelas,valorPago,status};
    }));
    showToast("Pagamento registrado!");
  };

  const addParcela=(finId)=>{
    setFinanceiro(prev=>prev.map(f=>f.id===finId?{...f,parcelas:[...f.parcelas,{id:uid(),valor:0,venc:"",pago:false,dataPago:""}]}:f));
  };

  // Login
  const handleLogin=(l,s)=>{
    if(l===empresa.loginAdmin&&s===empresa.senhaAdmin){const u={role:"admin",nome:"Admin",id:"admin"};setUser(u);localStorage.setItem('erpUser',JSON.stringify(u));setLoginView(null);setLoginErr("");setTab("dashboard");return;}
    const m=marceneiros.find(x=>x.login===l&&x.senha===s&&x.ativo);
    if(m){setUser({role:"marc",nome:m.nome,id:m.id});setTab("minha_area");setLoginView(null);setLoginErr("");}
    else setLoginErr("Credenciais inválidas");
  };

  // Computed
  const orc=orcamentos.find(o=>o.id===orcAtivo);
  const cliOrc=orc?getCli(orc.clienteId):null;
  const pedAtivoObj=pedidos.find(p=>p.id===pedAtivo);
  const meusP=user.role==="marc"?pedidos.filter(p=>p.marcId===user.id):[];

  const stats=useMemo(()=>{
    const rec=pedidos.reduce((s,p)=>s+p.vt,0);
    const cMat=pedidos.reduce((s,p)=>s+p.cm,0);
    const cCom=pedidos.reduce((s,p)=>s+p.comVal,0);
    const aReceber=financeiro.filter(f=>f.tipo==="receber").reduce((s,f)=>s+(f.valor-f.valorPago),0);
    const aPagar=financeiro.filter(f=>f.tipo==="pagar").reduce((s,f)=>s+(f.valor-f.valorPago),0);
    return{cli:clientes.length,orc:orcamentos.length,ped:pedidos.length,pedEsp:pedidos.filter(p=>p.status==="em_espera").length,pedProd:pedidos.filter(p=>p.status==="em_producao").length,rec,cMat,cCom,lucro:rec-cMat-cCom,aReceber,aPagar,leads:leads.length,leadsQuentes:leads.filter(l=>l.prioridade==="alta").length,estVal:estoque.reduce((s,e)=>s+e.qtd*e.custo,0)};
  },[clientes,orcamentos,pedidos,financeiro,leads,estoque]);

  // ── LOGIN SCREEN ──
  if(!user||loginView)return(
    <div style={{fontFamily:"var(--ft)",background:"linear-gradient(135deg,#6366f1,#8b5cf6,#ec4899)",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}><style>{CSS}</style>
      <div style={{background:"#fff",borderRadius:24,padding:36,width:380,boxShadow:"var(--sh2)",animation:"scaleIn .3s"}}>
        <div style={{textAlign:"center",marginBottom:28}}><div style={{width:56,height:56,borderRadius:16,background:"var(--prib2)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px",fontSize:28}}>🪵</div><h1 style={{fontSize:22,fontWeight:800,color:"var(--tx)"}}>Área do Marceneiro</h1><p style={{fontSize:12,color:"var(--tx3)",fontWeight:600,marginTop:4}}>Acesse com suas credenciais</p></div>
        <Field label="Login" value={loginView.l||""} onChange={v=>setLoginView({...loginView,l:v})} placeholder="Seu login"/>
        <Field label="Senha" type="password" value={loginView.s||""} onChange={v=>setLoginView({...loginView,s:v})} placeholder="••••"/>
        {loginErr&&<p style={{color:"var(--rd)",fontSize:12,fontWeight:700,marginBottom:8}}>{loginErr}</p>}
        <Btn onClick={()=>handleLogin(loginView.l,loginView.s)} style={{width:"100%",justifyContent:"center",marginBottom:8,padding:12}}><I.Lock/> Entrar</Btn>
        {loginView&&<Btn v="ghost" onClick={()=>setLoginView(null)} style={{width:"100%",justifyContent:"center"}}>Voltar ao Admin</Btn>}
      </div>
    </div>
  );

  // ── NAV ──
  const adminNav=[
    {k:"dashboard",l:"Dashboard",i:<I.Home/>},
    {k:"crm",l:"CRM / Leads",i:<I.Target/>},
    {k:"clientes",l:"Clientes",i:<I.User/>},
    {k:"orcamentos",l:"Orçamentos",i:<I.File/>},
    {k:"pedidos",l:"Pedidos",i:<I.Package/>},
    {k:"kanban",l:"Produção",i:<I.Kanban/>},
    {k:"marceneiros",l:"Marceneiros",i:<I.Hammer/>},
    {k:"financeiro",l:"Financeiro",i:<I.Wallet/>},
    {k:"estoque",l:"Estoque",i:<I.Box/>},
    {k:"dre",l:"DRE",i:<I.DRE/>},
    {k:"banco",l:"Banco",i:<I.Bank/>},
    {k:"configuracao",l:"Configurações",i:<I.Settings/>},
  ];
  const marcNav=[{k:"minha_area",l:"Projetos",i:<I.Hammer/>},{k:"meu_kanban",l:"Kanban",i:<I.Kanban/>},{k:"comissoes",l:"Comissões",i:<I.Dollar/>}];
  const nav=user.role==="admin"?adminNav:marcNav;

  // ══════════════════════════════
  // PAGES
  // ══════════════════════════════

  // DASHBOARD
  const PgDash=()=>{
    const dreData=[{name:"Receita",valor:stats.rec},{name:"Materiais",valor:stats.cMat},{name:"Comissões",valor:stats.cCom},{name:"Lucro",valor:stats.lucro}];
    const pieData=[{name:"A Receber",value:stats.aReceber,color:"#10b981"},{name:"A Pagar",value:stats.aPagar,color:"#ef4444"}];
    const leadsByStage=LEAD_STAGES.map((s,i)=>({name:s.split("/")[0],value:leads.filter(l=>l.etapa===s).length,color:LEAD_COLORS[i]}));
    return(
      <div style={{animation:"fadeIn .3s"}}>
        <SH title="Dashboard" sub={`Bem-vindo! ${hoje()}`} right={<><Btn onClick={()=>setModal({t:"selCli"})}><I.Plus/> Orçamento</Btn><Btn v="secondary" onClick={()=>setModal({t:"editLead",d:{}})}><I.Target/> Novo Lead</Btn></>}/>
        <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:20}}>
          <KPI label="Leads Quentes" value={stats.leadsQuentes} sub={`${stats.leads} total`} icon={<I.Zap/>} color="pk"/>
          <KPI label="Orçamentos" value={stats.orc} icon={<I.File/>} color="pri"/>
          <KPI label="Em Produção" value={stats.pedProd} icon={<I.Hammer/>} color="am"/>
          <KPI label="Faturamento" value={R$(stats.rec)} icon={<I.Dollar/>} color="gn"/>
          <KPI label="A Receber" value={R$(stats.aReceber)} icon={<I.Wallet/>} color="bl"/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:14,marginBottom:14}}>
          <Card><CardHead title="DRE Resumo"/>
            <div style={{padding:16,height:220}}><ResponsiveContainer><BarChart data={dreData}><CartesianGrid strokeDasharray="3 3" stroke="var(--bd)"/><XAxis dataKey="name" tick={{fontSize:11,fontWeight:700,fill:"var(--tx2)"}}/><YAxis tick={{fontSize:10,fill:"var(--tx3)"}}/><Tooltip formatter={v=>R$(v)}/><Bar dataKey="valor" radius={[8,8,0,0]}>{dreData.map((e,i)=><Cell key={i} fill={["#10b981","#ef4444","#f59e0b","#6366f1"][i]}/>)}</Bar></BarChart></ResponsiveContainer></div>
          </Card>
          <Card><CardHead title="Financeiro"/>
            <div style={{padding:16,height:220,display:"flex",alignItems:"center",justifyContent:"center"}}>{stats.aReceber+stats.aPagar>0?<ResponsiveContainer><PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={4}>{pieData.map((e,i)=><Cell key={i} fill={e.color}/>)}</Pie><Tooltip formatter={v=>R$(v)}/><Legend iconType="circle" wrapperStyle={{fontSize:11,fontWeight:700}}/></PieChart></ResponsiveContainer>:<span style={{color:"var(--tx3)",fontSize:13,fontWeight:600}}>Sem dados</span>}</div>
          </Card>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <Card><CardHead title="Leads por Etapa"/>
            <div style={{padding:16,height:180}}><ResponsiveContainer><BarChart data={leadsByStage} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="var(--bd)"/><XAxis type="number" tick={{fontSize:10,fill:"var(--tx3)"}}/><YAxis type="category" dataKey="name" tick={{fontSize:10,fontWeight:700,fill:"var(--tx2)"}} width={100}/><Tooltip/><Bar dataKey="value" radius={[0,6,6,0]}>{leadsByStage.map((e,i)=><Cell key={i} fill={e.color}/>)}</Bar></BarChart></ResponsiveContainer></div>
          </Card>
          <Card><CardHead title="Pedidos Recentes" right={<Badge color="pri">{pedidos.length}</Badge>}/>
            {pedidos.slice(-4).reverse().map(p=>{const c=getCli(p.clienteId);return(
              <div key={p.id} className="hr" onClick={()=>{setPedAtivo(p.id);setTab("pedidos")}} style={{padding:"10px 18px",borderBottom:"1.5px solid var(--bd)",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:12}}>
                <div><span style={{fontWeight:800,color:"var(--pri)"}}>{p.num}</span> <span style={{color:"var(--tx2)",marginLeft:6}}>{c?.nome}</span></div>
                <Badge color={p.status==="concluido"?"green":p.status==="em_producao"?"amber":"blue"}>{p.status==="em_espera"?"Espera":p.status==="em_producao"?"Produção":"OK"}</Badge>
              </div>
            )})}
            {pedidos.length===0&&<div style={{padding:24,textAlign:"center",color:"var(--tx3)",fontSize:12,fontWeight:600}}>Nenhum pedido</div>}
          </Card>
        </div>
      </div>
    );
  };

  // CRM
  const PgCRM=()=>{
    const [fEtapa,setFEtapa]=useState("todos");
    const list=fEtapa==="todos"?leads:leads.filter(l=>l.etapa===fEtapa);
    const convToClient=lead=>{saveCli({nome:lead.nome,tel:lead.tel,email:lead.email,doc:"",endereco:""});setLeads(p=>p.map(l=>l.id===lead.id?{...l,etapa:"Fechado/Ganho"}:l));showToast("Lead convertido em cliente!")};
    return(
      <div style={{animation:"fadeIn .3s"}}>
        <SH title="CRM — Central de Leads" sub={`${leads.length} leads • ${leads.filter(l=>l.prioridade==="alta").length} quentes`} right={<Btn onClick={()=>setModal({t:"editLead",d:{}})}><I.Plus/> Novo Lead</Btn>}/>
        <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
          <button onClick={()=>setFEtapa("todos")} style={{padding:"6px 14px",borderRadius:20,border:"1.5px solid "+(fEtapa==="todos"?"var(--pri)":"var(--bd)"),background:fEtapa==="todos"?"var(--prib)":"transparent",color:fEtapa==="todos"?"var(--pri)":"var(--tx3)",fontSize:11,fontWeight:700}}>Todos</button>
          {LEAD_STAGES.map((s,i)=><button key={s} onClick={()=>setFEtapa(s)} style={{padding:"6px 14px",borderRadius:20,border:"1.5px solid "+(fEtapa===s?LEAD_COLORS[i]:"var(--bd)"),background:fEtapa===s?LEAD_COLORS[i]+"15":"transparent",color:fEtapa===s?LEAD_COLORS[i]:"var(--tx3)",fontSize:11,fontWeight:700}}>{s.split("/")[0]}</button>)}
        </div>
        <Card>
          <TH cols={[{l:"Lead",w:"1.5fr"},{l:"Contato",w:"1.3fr"},{l:"Interesse",w:"1fr"},{l:"Valor Est.",w:"100px"},{l:"Etapa",w:"130px"},{l:"Prioridade",w:"80px"},{l:"Ações",w:"100px"}]}/>
          {list.map(l=>(
            <div key={l.id} style={{display:"grid",gridTemplateColumns:"1.5fr 1.3fr 1fr 100px 130px 80px 100px",gap:6,padding:"10px 18px",borderBottom:"1.5px solid var(--bd)",alignItems:"center",fontSize:12}}>
              <div><div style={{fontWeight:700,color:"var(--tx)"}}>{l.nome}</div><div style={{fontSize:10,color:"var(--tx3)"}}>{l.origem} • {l.data}</div></div>
              <div style={{color:"var(--tx2)"}}><div style={{display:"flex",alignItems:"center",gap:4}}><I.Phone/>{l.tel}</div><div style={{display:"flex",alignItems:"center",gap:4,marginTop:2}}><I.Mail/>{l.email}</div></div>
              <span style={{color:"var(--tx)"}}>{l.interesse}</span>
              <span style={{fontWeight:700,color:"var(--tx)"}}>{R$(l.valor)}</span>
              <select value={l.etapa} onChange={e=>setLeads(p=>p.map(x=>x.id===l.id?{...x,etapa:e.target.value}:x))} style={{padding:"5px 8px",borderRadius:8,border:"1.5px solid var(--bd)",background:"var(--sf)",color:"var(--tx)",fontSize:11,fontWeight:700,outline:"none"}}>{LEAD_STAGES.map(s=><option key={s} value={s}>{s}</option>)}</select>
              <Badge color={l.prioridade==="alta"?"red":l.prioridade==="media"?"amber":"blue"}>{l.prioridade}</Badge>
              <div style={{display:"flex",gap:3}}>
                <button onClick={()=>setModal({t:"editLead",d:l})} title="Editar" style={{background:"none",border:"none",color:"var(--tx3)",padding:3}}><I.Edit/></button>
                {l.etapa!=="Fechado/Ganho"&&<button onClick={()=>convToClient(l)} title="Converter em Cliente" style={{background:"none",border:"none",color:"var(--gn)",padding:3}}><I.User/></button>}
                <button onClick={()=>{setLeads(p=>p.filter(x=>x.id!==l.id));showToast("Removido","red")}} style={{background:"none",border:"none",color:"var(--rd)",padding:3}}><I.Trash/></button>
              </div>
            </div>
          ))}
          {list.length===0&&<div style={{padding:30,textAlign:"center",color:"var(--tx3)",fontSize:12,fontWeight:600}}>Nenhum lead</div>}
        </Card>
      </div>
    );
  };

  // CLIENTES
  const PgCli=()=>{const [s,setS]=useState("");const list=clientes.filter(c=>c.nome.toLowerCase().includes(s.toLowerCase())||c.doc.includes(s));return(
    <div style={{animation:"fadeIn .3s"}}><SH title="Clientes" sub={`${clientes.length} cadastrados`} right={<Btn onClick={()=>setModal({t:"editCli",d:{}})}><I.Plus/> Novo</Btn>}/>
    <div style={{position:"relative",marginBottom:14}}><div style={{position:"absolute",left:14,top:11,color:"var(--tx3)"}}><I.Search/></div><input value={s} onChange={e=>setS(e.target.value)} placeholder="Buscar..." style={{width:"100%",padding:"10px 14px 10px 38px",borderRadius:"var(--r)",border:"1.5px solid var(--bd)",background:"var(--cd)",color:"var(--tx)",fontSize:13,fontWeight:500,outline:"none"}}/></div>
    <Card><TH cols={[{l:"Nome",w:"2fr"},{l:"Doc",w:"1.2fr"},{l:"Tel",w:"1fr"},{l:"Email",w:"1.5fr"},{l:"",w:"90px"}]}/>
    {list.map(c=><div key={c.id} style={{display:"grid",gridTemplateColumns:"2fr 1.2fr 1fr 1.5fr 90px",gap:6,padding:"10px 18px",borderBottom:"1.5px solid var(--bd)",alignItems:"center",fontSize:12}}>
      <span style={{fontWeight:700,color:"var(--tx)"}}>{c.nome}</span><span style={{color:"var(--tx2)"}}>{c.doc}</span><span style={{color:"var(--tx2)"}}>{c.tel}</span><span style={{color:"var(--tx2)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.email}</span>
      <div style={{display:"flex",gap:3}}><button onClick={()=>setModal({t:"editCli",d:c})} style={{background:"none",border:"none",color:"var(--tx3)",padding:3}}><I.Edit/></button><button onClick={()=>criarOrc(c.id)} style={{background:"none",border:"none",color:"var(--pri)",padding:3}}><I.File/></button><button onClick={()=>{setClientes(p=>p.filter(x=>x.id!==c.id));showToast("Removido","red")}} style={{background:"none",border:"none",color:"var(--rd)",padding:3}}><I.Trash/></button></div>
    </div>)}</Card></div>
  )};

  // ORÇAMENTOS
  const PgOrc=()=>{
    if(orc){const ambs=orc.ambientes;return(
      <div style={{animation:"fadeIn .3s"}}>
        <button onClick={()=>setOrcAtivo(null)} style={{background:"none",border:"none",color:"var(--pri)",fontSize:11,fontWeight:700,marginBottom:6,cursor:"pointer"}}>← Voltar</button>
        <SH title={orc.num} sub={`${cliOrc?.nome} • ${orc.data}`} right={<><select value={orc.status} onChange={e=>updOrc(orc.id,{status:e.target.value})} style={{padding:"8px 12px",borderRadius:10,border:"1.5px solid var(--bd)",background:"var(--sf)",color:"var(--tx)",fontSize:11,fontWeight:700,outline:"none"}}><option value="rascunho">Rascunho</option><option value="enviado">Enviado</option><option value="aprovado">Aprovado</option><option value="rejeitado">Rejeitado</option></select><Btn v="ghost" small onClick={()=>setModal({t:"pdf",d:orc})}><I.Printer/></Btn>{orc.status!=="aprovado"&&<Btn small onClick={()=>gerarPedido(orc)}>Aprovar → Pedido</Btn>}</>}/>
        <div style={{background:"linear-gradient(135deg,#6366f1,#8b5cf6)",borderRadius:"var(--rl)",padding:"20px 24px",marginBottom:18,display:"flex",justifyContent:"space-between",alignItems:"center",color:"#fff",boxShadow:"0 4px 20px rgba(99,102,241,.3)"}}>
          <div><span style={{fontSize:10,fontWeight:800,textTransform:"uppercase",opacity:.8}}>Valor Total</span><div style={{fontSize:28,fontWeight:800,marginTop:2}}>{R$(totalOrc(orc))}</div></div>
          <div style={{textAlign:"right"}}><span style={{fontSize:11,opacity:.8}}>{ambs.length} ambiente{ambs.length!==1?"s":""}</span></div>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><h3 style={{fontSize:14,fontWeight:800,color:"var(--tx)"}}>Ambientes</h3><Btn small onClick={()=>addAmb(orc.id)}><I.Plus/> Ambiente</Btn></div>
        {ambs.map((a,i)=>{const op=ambAberto===a.id;return(
          <Card key={a.id} style={{marginBottom:8}}>
            <div onClick={()=>setAmbAberto(op?null:a.id)} style={{padding:"12px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",borderBottom:op?"1.5px solid var(--bd)":"none"}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:26,height:26,borderRadius:8,background:"var(--prib2)",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--pri)",fontSize:11,fontWeight:800}}>{i+1}</div><span style={{fontWeight:700,fontSize:13,color:"var(--tx)"}}>{a.nome||"Sem nome"}</span></div>
              <div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontWeight:800,fontSize:15,color:"var(--pri)"}}>{R$(a.valorTotal)}</span><I.Chev d={op?"up":"down"}/></div>
            </div>
            {op&&<div style={{padding:16}}>
              <Field label="Nome" value={a.nome} onChange={v=>updAmb(orc.id,a.id,{nome:v})} placeholder="Ex: Cozinha, Closet..." commitOnBlur/>
              <Field label="Descrição" value={a.desc} onChange={v=>updAmb(orc.id,a.id,{desc:v})} placeholder="Medidas, acabamentos..." rows={2} commitOnBlur/>
              <div style={{background:"var(--bg)",borderRadius:"var(--r)",padding:"12px 14px",border:"1.5px solid var(--bd)",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <div style={{fontSize:12}}><span style={{color:"var(--tx3)",fontWeight:600}}>Custo: </span><span style={{fontWeight:700,color:"var(--tx2)"}}>{R$(a.vi)}</span><span style={{color:"var(--tx3)",fontWeight:600,marginLeft:4}}>× {MARKUP} = </span><span style={{fontWeight:800,color:"var(--pri)"}}>{R$(a.valorTotal)}</span></div>
                <Btn small v="secondary" onClick={()=>setInsModal(a.id)}><I.Calc/> Insumos</Btn>
              </div>
              <div style={{textAlign:"right"}}><Btn v="danger" small onClick={()=>delAmb(orc.id,a.id)}><I.Trash/></Btn></div>
            </div>}
          </Card>
        )})}
        {/* Garantia/Pagamento */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginTop:20}}>
          {[{k:"garantia",l:"Garantia",ek:"garantiaE",pd:GARANTIA},{k:"pagamento",l:"Pagamento",ek:"pagamentoE",pd:PAGAMENTO}].map(s=>(
            <Card key={s.k} style={{padding:16}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <h4 style={{fontSize:12,fontWeight:800,color:"var(--tx)",textTransform:"uppercase"}}>{s.l}</h4>
                {orc[s.ek]?<div style={{display:"flex",gap:4}}><Btn v="ghost" small onClick={()=>updOrc(orc.id,{[s.k]:s.pd,[s.ek]:false})}>Reset</Btn><Btn small onClick={()=>updOrc(orc.id,{[s.ek]:false})}><I.Check/></Btn></div>
                :<Btn v="ghost" small onClick={()=>updOrc(orc.id,{[s.ek]:true})}><I.Edit/></Btn>}
              </div>
              {orc[s.ek]?<Field value={orc[s.k]} onChange={v=>updOrc(orc.id,{[s.k]:v})} rows={5} commitOnBlur/>
              :<div style={{fontSize:12,color:"var(--tx2)",whiteSpace:"pre-line",lineHeight:1.5,fontWeight:500}}>{orc[s.k]}</div>}
            </Card>
          ))}
        </div>
        {insModal&&orc.ambientes.find(a=>a.id===insModal)&&(()=>{const amb=orc.ambientes.find(a=>a.id===insModal);return(
          <Modal onClose={()=>setInsModal(null)} wide>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div><h2 style={{fontSize:16,fontWeight:800,color:"var(--tx)"}}>Insumos — {amb.nome||"?"}</h2><p style={{fontSize:11,color:"var(--rd)",fontWeight:700,marginTop:2}}>⚠ Dados internos — NÃO vão na proposta</p></div>
              <button onClick={()=>setInsModal(null)} style={{background:"none",border:"none",color:"var(--tx3)"}}><I.X/></button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"2fr 70px 110px 110px 30px",gap:6,padding:"6px 0",borderBottom:"1.5px solid var(--bd)"}}>
              {["Insumo","Qtd","Vl.Unit","Subtotal",""].map(h=><span key={h} style={{fontSize:9,fontWeight:800,textTransform:"uppercase",letterSpacing:".6px",color:"var(--tx3)"}}>{h}</span>)}
            </div>
            {amb.insumos.map(ins=><div key={ins.id} style={{display:"grid",gridTemplateColumns:"2fr 70px 110px 110px 30px",gap:6,padding:"5px 0",alignItems:"center",borderBottom:"1.5px solid var(--bd)"}}>
              <BlurInput value={ins.nome} onCommit={v=>updIns(orc.id,amb.id,ins.id,{nome:v})} placeholder="Material" style={{width:"100%",padding:"7px 9px",borderRadius:8,border:"1.5px solid var(--bd)",background:"var(--sf)",color:"var(--tx)",fontSize:12,fontWeight:500,outline:"none"}}/>
              <BlurInput type="number" value={ins.qtd} onCommit={v=>updIns(orc.id,amb.id,ins.id,{qtd:Math.max(0,+v)})} style={{width:"100%",padding:"7px",borderRadius:8,border:"1.5px solid var(--bd)",background:"var(--sf)",color:"var(--tx)",fontSize:12,outline:"none",textAlign:"center"}}/>
              <BlurInput type="number" value={ins.vu} onCommit={v=>updIns(orc.id,amb.id,ins.id,{vu:Math.max(0,+v)})} step="0.01" style={{width:"100%",padding:"7px",borderRadius:8,border:"1.5px solid var(--bd)",background:"var(--sf)",color:"var(--tx)",fontSize:12,outline:"none"}}/>
              <span style={{fontSize:12,fontWeight:700,color:"var(--tx)"}}>{R$(ins.qtd*ins.vu)}</span>
              <button onClick={()=>delIns(orc.id,amb.id,ins.id)} style={{background:"none",border:"none",color:"var(--rd)",padding:2}}><I.Trash/></button>
            </div>)}
            <Btn v="ghost" small onClick={()=>addIns(orc.id,amb.id)} style={{marginTop:8}}><I.Plus/> Insumo</Btn>
            <div style={{background:"var(--bg)",borderRadius:"var(--r)",padding:"14px 16px",marginTop:14,border:"1.5px solid var(--bd)"}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12,fontWeight:600,marginBottom:6,color:"var(--tx2)"}}><span>Total</span><span>{R$(amb.vi)}</span></div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12,fontWeight:600,marginBottom:6,color:"var(--tx2)"}}><span>Markup</span><span style={{color:"var(--pri)"}}>× {MARKUP}</span></div>
              <div style={{borderTop:"1.5px solid var(--bd)",paddingTop:8,display:"flex",justifyContent:"space-between",fontWeight:800,fontSize:16}}><span style={{color:"var(--tx)"}}>Final</span><span style={{color:"var(--pri)"}}>{R$(amb.vi*MARKUP)}</span></div>
            </div>
            <div style={{textAlign:"right",marginTop:12}}><Btn onClick={()=>setInsModal(null)}><I.Check/> OK</Btn></div>
          </Modal>
        )})()}
      </div>
    )}
    return(<div style={{animation:"fadeIn .3s"}}><SH title="Orçamentos" sub={`${orcamentos.length} total`} right={<Btn onClick={()=>setModal({t:"selCli"})}><I.Plus/> Novo</Btn>}/>
      <Card><TH cols={[{l:"Nº",w:"90px"},{l:"Cliente",w:"2fr"},{l:"Data",w:"1fr"},{l:"Status",w:"90px"},{l:"Valor",w:"110px"},{l:"",w:"60px"}]}/>
      {orcamentos.map(o=>{const c=getCli(o.clienteId);return(<div key={o.id} onClick={()=>setOrcAtivo(o.id)} className="hr" style={{display:"grid",gridTemplateColumns:"90px 2fr 1fr 90px 110px 60px",gap:6,padding:"10px 18px",borderBottom:"1.5px solid var(--bd)",alignItems:"center",cursor:"pointer",fontSize:12}}>
        <span style={{fontWeight:800,color:"var(--pri)"}}>{o.num}</span><span style={{color:"var(--tx)",fontWeight:600}}>{c?.nome}</span><span style={{color:"var(--tx3)"}}>{o.data}</span>
        <Badge color={o.status==="aprovado"?"green":o.status==="rejeitado"?"red":"pri"}>{o.status}</Badge>
        <span style={{fontWeight:700,color:"var(--tx)"}}>{R$(totalOrc(o))}</span>
        <button onClick={e=>{e.stopPropagation();setOrcamentos(p=>p.filter(x=>x.id!==o.id));showToast("Removido","red")}} style={{background:"none",border:"none",color:"var(--rd)",padding:3}}><I.Trash/></button>
      </div>)})}{orcamentos.length===0&&<div style={{padding:30,textAlign:"center",color:"var(--tx3)",fontSize:12,fontWeight:600}}>Nenhum orçamento</div>}</Card></div>);
  };

  // PEDIDOS
  const PgPed=()=>{
    if(pedAtivoObj){const p=pedAtivoObj;const c=getCli(p.clienteId);const m=getMarc(p.marcId);const fin=financeiro.find(f=>f.pedidoId===p.id&&f.tipo==="receber");
    return(<div style={{animation:"fadeIn .3s"}}>
      <button onClick={()=>setPedAtivo(null)} style={{background:"none",border:"none",color:"var(--pri)",fontSize:11,fontWeight:700,marginBottom:6,cursor:"pointer"}}>← Voltar</button>
      <SH title={p.num} sub={`${c?.nome} • ${p.data}`} right={<><select value={p.stage} onChange={e=>updPed(p.id,{stage:e.target.value,status:e.target.value==="concluido"?"concluido":"em_producao"})} style={{padding:"7px 10px",borderRadius:10,border:"1.5px solid var(--bd)",background:"var(--sf)",color:"var(--tx)",fontSize:11,fontWeight:700,outline:"none"}}>{KCOLS.map(k=><option key={k.id} value={k.id}>{k.label}</option>)}</select><Badge color={p.status==="concluido"?"green":p.status==="em_producao"?"amber":"blue"}>{p.status.replace("_"," ")}</Badge></>}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:16}}>
        <Card style={{padding:16}}><span style={{fontSize:10,fontWeight:800,textTransform:"uppercase",color:"var(--tx3)"}}>Valor</span><div style={{fontSize:22,fontWeight:800,color:"var(--pri)",marginTop:4}}>{R$(p.vt)}</div></Card>
        <Card style={{padding:16}}><span style={{fontSize:10,fontWeight:800,textTransform:"uppercase",color:"var(--tx3)"}}>Marceneiro</span>{m?<div style={{fontSize:14,fontWeight:700,color:"var(--tx)",marginTop:4}}>{m.nome} <Badge color="pri">{p.comPerc}%</Badge></div>:<select onChange={e=>{if(e.target.value)designarMarc(p.id,e.target.value)}} value="" style={{width:"100%",padding:"7px",borderRadius:8,border:"1.5px solid var(--bd)",background:"var(--sf)",color:"var(--tx)",fontSize:12,outline:"none",marginTop:6}}><option value="">Selecionar...</option>{marceneiros.filter(x=>x.ativo).map(x=><option key={x.id} value={x.id}>{x.nome} ({x.comissao}%)</option>)}</select>}</Card>
        <Card style={{padding:16}}><span style={{fontSize:10,fontWeight:800,textTransform:"uppercase",color:"var(--tx3)"}}>Entrega</span><input type="date" value={p.dataEntrega} onChange={e=>updPed(p.id,{dataEntrega:e.target.value})} style={{width:"100%",padding:"7px",borderRadius:8,border:"1.5px solid var(--bd)",background:"var(--sf)",color:"var(--tx)",fontSize:12,outline:"none",marginTop:6}}/></Card>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <Card><CardHead title="Materiais"/><div style={{padding:14}}>{p.mats.map(m=><div key={m.id} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid var(--bd)",fontSize:12}}><span style={{color:"var(--tx)",fontWeight:600}}>{m.nome} <span style={{color:"var(--tx3)"}}>×{m.qtd}</span></span><span style={{fontWeight:700,color:"var(--tx)"}}>{R$(m.sub)}</span></div>)}<div style={{display:"flex",justifyContent:"space-between",paddingTop:8,fontWeight:800,fontSize:13}}><span>Total</span><span style={{color:"var(--pri)"}}>{R$(p.cm)}</span></div></div></Card>
        <Card><CardHead title="Parcelas do Cliente" right={fin&&<Btn v="ghost" small onClick={()=>addParcela(fin.id)}><I.Plus/></Btn>}/><div style={{padding:14}}>{fin?fin.parcelas.map((pa,i)=><div key={pa.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:"1px solid var(--bd)",fontSize:12}}>
          <div><span style={{fontWeight:700,color:"var(--tx)"}}>Parcela {i+1}</span>{pa.venc&&<span style={{color:"var(--tx3)",marginLeft:6,fontSize:10}}>Venc: {pa.venc}</span>}</div>
          <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontWeight:700,color:pa.pago?"var(--gn)":"var(--tx)"}}>{R$(pa.valor)}</span>{pa.pago?<Badge color="green">Pago {pa.dataPago}</Badge>:<Btn v="success" small onClick={()=>pagarParcela(fin.id,pa.id)}>Baixar</Btn>}</div>
        </div>):<span style={{fontSize:12,color:"var(--tx3)"}}>—</span>}
        {fin&&<div style={{marginTop:8,display:"flex",justifyContent:"space-between",fontWeight:800,fontSize:13,paddingTop:8,borderTop:"1.5px solid var(--bd)"}}><span>Pago: <span style={{color:"var(--gn)"}}>{R$(fin.valorPago)}</span></span><span>Restante: <span style={{color:"var(--rd)"}}>{R$(fin.valor-fin.valorPago)}</span></span></div>}
        </div></Card>
      </div>
      <Card style={{marginTop:14}}><CardHead title="Arquivos" right={<Btn v="ghost" small onClick={()=>{const n=prompt("Nome do arquivo:");if(n){updPed(p.id,pp=>({...pp,arquivos:[...pp.arquivos,{id:uid(),nome:n,data:hoje()}]}));showToast("Anexado!")}}}><I.Clip/> Anexar</Btn>}/><div style={{padding:14}}>{p.arquivos.length===0?<span style={{fontSize:12,color:"var(--tx3)"}}>Nenhum</span>:p.arquivos.map(a=><div key={a.id} style={{display:"flex",alignItems:"center",gap:6,padding:"4px 0",fontSize:12,color:"var(--tx2)"}}><I.Clip/>{a.nome}<span style={{fontSize:10,color:"var(--tx3)"}}>{a.data}</span></div>)}</div></Card>
    </div>)}
    const [fP,setFP]=useState("todos");const list=pedidos.filter(p=>fP==="todos"||p.status===fP);
    return(<div style={{animation:"fadeIn .3s"}}><SH title="Pedidos" sub={`${pedidos.length} total`}/>
      <div style={{display:"flex",gap:6,marginBottom:14}}>{[{k:"todos",l:"Todos"},{k:"em_espera",l:"Espera"},{k:"em_producao",l:"Produção"},{k:"concluido",l:"Concluídos"}].map(t=><button key={t.k} onClick={()=>setFP(t.k)} style={{padding:"6px 14px",borderRadius:20,border:"1.5px solid "+(fP===t.k?"var(--pri)":"var(--bd)"),background:fP===t.k?"var(--prib)":"transparent",color:fP===t.k?"var(--pri)":"var(--tx3)",fontSize:11,fontWeight:700}}>{t.l}</button>)}</div>
      <Card><TH cols={[{l:"Nº",w:"90px"},{l:"Cliente",w:"1.5fr"},{l:"Marc.",w:"1fr"},{l:"Status",w:"90px"},{l:"Etapa",w:"110px"},{l:"Valor",w:"100px"}]}/>
      {list.map(p=>{const c=getCli(p.clienteId);const m=getMarc(p.marcId);return(<div key={p.id} onClick={()=>setPedAtivo(p.id)} className="hr" style={{display:"grid",gridTemplateColumns:"90px 1.5fr 1fr 90px 110px 100px",gap:6,padding:"10px 18px",borderBottom:"1.5px solid var(--bd)",alignItems:"center",cursor:"pointer",fontSize:12}}>
        <span style={{fontWeight:800,color:"var(--pri)"}}>{p.num}</span><span style={{color:"var(--tx)",fontWeight:600}}>{c?.nome}</span><span style={{color:m?"var(--tx2)":"var(--rd)",fontWeight:600}}>{m?.nome||"—"}</span>
        <Badge color={p.status==="concluido"?"green":p.status==="em_producao"?"amber":"blue"}>{p.status.split("_").pop()}</Badge>
        <span style={{fontSize:10,color:"var(--tx3)",fontWeight:600}}>{KCOLS.find(k=>k.id===p.stage)?.label}</span>
        <span style={{fontWeight:700,color:"var(--tx)"}}>{R$(p.vt)}</span>
      </div>)})}{list.length===0&&<div style={{padding:30,textAlign:"center",color:"var(--tx3)",fontSize:12,fontWeight:600}}>Nenhum</div>}</Card></div>);
  };

  // KANBAN
  const PgKanban=()=>(<div style={{animation:"fadeIn .3s"}}><SH title="Produção — Kanban"/>
    <div style={{display:"flex",gap:10,overflowX:"auto",paddingBottom:10}}>{KCOLS.map(col=>{const cards=pedidos.filter(p=>p.stage===col.id);return(
      <div key={col.id} style={{minWidth:180,flex:1,background:"var(--bg)",borderRadius:"var(--rl)",border:"1.5px solid var(--bd)"}}>
        <div style={{padding:"10px 14px",borderBottom:"1.5px solid var(--bd)",display:"flex",alignItems:"center",gap:6}}><div style={{width:8,height:8,borderRadius:4,background:col.color}}/><span style={{fontSize:11,fontWeight:800,color:"var(--tx)"}}>{col.label}</span><span style={{fontSize:10,color:"var(--tx3)",marginLeft:"auto",fontWeight:700}}>{cards.length}</span></div>
        <div style={{padding:6,minHeight:80}}>{cards.map(p=>{const c=getCli(p.clienteId);const m=getMarc(p.marcId);return(
          <div key={p.id} className="kcard" onClick={()=>{setPedAtivo(p.id);setTab("pedidos")}} style={{background:"var(--cd)",border:"1.5px solid var(--bd)",borderRadius:"var(--r)",padding:"10px 12px",marginBottom:6,borderLeft:`3px solid ${col.color}`,boxShadow:"var(--sh)",cursor:"pointer"}}>
            <div style={{fontWeight:800,fontSize:11,color:"var(--pri)"}}>{p.num}</div>
            <div style={{fontSize:11,color:"var(--tx)",fontWeight:600,marginTop:1}}>{c?.nome}</div>
            <div style={{fontSize:10,color:"var(--tx3)",fontWeight:600}}>{m?.nome||"Sem marc."}</div>
            {p.dataEntrega&&<div style={{fontSize:10,color:"var(--rd)",marginTop:3,fontWeight:700,display:"flex",alignItems:"center",gap:3}}><I.Clock/>{p.dataEntrega}</div>}
          </div>
        )})}</div>
      </div>
    )})}</div>
  </div>);

  // MARCENEIROS
  const PgMarc=()=>{const [eM,setEM]=useState(null);return(<div style={{animation:"fadeIn .3s"}}><SH title="Marceneiros" sub={`${marceneiros.length} cadastrados`} right={<Btn onClick={()=>setEM({nome:"",tel:"",esp:"",comissao:10,login:"",senha:"",ativo:true})}><I.Plus/> Novo</Btn>}/>
    {eM&&<Modal onClose={()=>setEM(null)}><h2 style={{fontSize:16,fontWeight:800,color:"var(--tx)",marginBottom:16}}>{eM.id?"Editar":"Novo"} Marceneiro</h2>
      <Field label="Nome" value={eM.nome} onChange={v=>setEM({...eM,nome:v})}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><Field label="Telefone" value={eM.tel} onChange={v=>setEM({...eM,tel:v})}/><Field label="Especialidade" value={eM.esp} onChange={v=>setEM({...eM,esp:v})}/></div>
      <Field label="Comissão (%)" type="number" value={eM.comissao} onChange={v=>setEM({...eM,comissao:+v})}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><Field label="Login" value={eM.login} onChange={v=>setEM({...eM,login:v})}/><Field label="Senha" value={eM.senha} onChange={v=>setEM({...eM,senha:v})}/></div>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:8}}><Btn v="ghost" onClick={()=>setEM(null)}>Cancelar</Btn><Btn onClick={()=>{if(!eM.nome||!eM.login)return showToast("Nome e login!","red");if(eM.id){setMarceneiros(p=>p.map(m=>m.id===eM.id?{...m,...eM}:m))}else{setMarceneiros(p=>[...p,{...eM,id:uid()}])}setEM(null);showToast("Salvo!")}}><I.Check/> Salvar</Btn></div>
    </Modal>}
    <Card><TH cols={[{l:"Nome",w:"1.5fr"},{l:"Esp.",w:"1fr"},{l:"Tel",w:"1fr"},{l:"Com.%",w:"70px"},{l:"Login",w:"80px"},{l:"Status",w:"70px"},{l:"Obras",w:"55px"},{l:"",w:"60px"}]}/>
    {marceneiros.map(m=>{const obs=pedidos.filter(p=>p.marcId===m.id).length;return(<div key={m.id} style={{display:"grid",gridTemplateColumns:"1.5fr 1fr 1fr 70px 80px 70px 55px 60px",gap:6,padding:"10px 18px",borderBottom:"1.5px solid var(--bd)",alignItems:"center",fontSize:12}}>
      <span style={{fontWeight:700,color:"var(--tx)"}}>{m.nome}</span><span style={{color:"var(--tx2)"}}>{m.esp}</span><span style={{color:"var(--tx2)"}}>{m.tel}</span><Badge color="pri">{m.comissao}%</Badge><span style={{color:"var(--tx3)",fontSize:11}}>{m.login}</span><Badge color={m.ativo?"green":"red"}>{m.ativo?"Ativo":"Off"}</Badge><span style={{textAlign:"center",fontWeight:700,color:"var(--tx)"}}>{obs}</span>
      <div style={{display:"flex",gap:3}}><button onClick={()=>setEM(m)} style={{background:"none",border:"none",color:"var(--tx3)",padding:3}}><I.Edit/></button><button onClick={()=>{setMarceneiros(p=>p.filter(x=>x.id!==m.id));showToast("Removido","red")}} style={{background:"none",border:"none",color:"var(--rd)",padding:3}}><I.Trash/></button></div>
    </div>)})}</Card></div>)};

  // FINANCEIRO
  const PgFin=()=>{const [fTipo,setFTipo]=useState("todos");const list=financeiro.filter(f=>fTipo==="todos"||f.tipo===fTipo);
    const totalAR=financeiro.filter(f=>f.tipo==="receber").reduce((s,f)=>s+(f.valor-f.valorPago),0);
    const totalAP=financeiro.filter(f=>f.tipo==="pagar").reduce((s,f)=>s+(f.valor-f.valorPago),0);
    return(<div style={{animation:"fadeIn .3s"}}><SH title="Financeiro" sub="Contas a Pagar e Receber" right={<Btn onClick={()=>setModal({t:"newFin"})}><I.Plus/> Nova Conta</Btn>}/>
      <div style={{display:"flex",gap:12,marginBottom:18,flexWrap:"wrap"}}>
        <KPI label="A Receber" value={R$(totalAR)} icon={<I.Dollar/>} color="gn"/>
        <KPI label="A Pagar" value={R$(totalAP)} icon={<I.Wallet/>} color="rd"/>
        <KPI label="Saldo" value={R$(totalAR-totalAP)} icon={<I.DRE/>} color={totalAR-totalAP>=0?"gn":"rd"}/>
      </div>
      <div style={{display:"flex",gap:6,marginBottom:14}}>{[{k:"todos",l:"Todos"},{k:"receber",l:"A Receber"},{k:"pagar",l:"A Pagar"}].map(t=><button key={t.k} onClick={()=>setFTipo(t.k)} style={{padding:"6px 14px",borderRadius:20,border:"1.5px solid "+(fTipo===t.k?"var(--pri)":"var(--bd)"),background:fTipo===t.k?"var(--prib)":"transparent",color:fTipo===t.k?"var(--pri)":"var(--tx3)",fontSize:11,fontWeight:700}}>{t.l}</button>)}</div>
      <Card><TH cols={[{l:"Tipo",w:"80px"},{l:"Descrição",w:"2fr"},{l:"Valor",w:"110px"},{l:"Pago",w:"110px"},{l:"Restante",w:"110px"},{l:"Status",w:"80px"},{l:"Parcelas",w:"60px"}]}/>
      {list.map(f=><div key={f.id} onClick={()=>setModal({t:"detFin",d:f})} className="hr" style={{display:"grid",gridTemplateColumns:"80px 2fr 110px 110px 110px 80px 60px",gap:6,padding:"10px 18px",borderBottom:"1.5px solid var(--bd)",alignItems:"center",cursor:"pointer",fontSize:12}}>
        <Badge color={f.tipo==="receber"?"green":"red"}>{f.tipo==="receber"?"Receber":"Pagar"}</Badge>
        <span style={{color:"var(--tx)",fontWeight:600}}>{f.desc}</span>
        <span style={{fontWeight:700,color:"var(--tx)"}}>{R$(f.valor)}</span>
        <span style={{fontWeight:600,color:"var(--gn)"}}>{R$(f.valorPago)}</span>
        <span style={{fontWeight:700,color:"var(--rd)"}}>{R$(f.valor-f.valorPago)}</span>
        <Badge color={f.status==="pago"?"green":f.status==="parcial"?"amber":"blue"}>{f.status}</Badge>
        <span style={{textAlign:"center",fontWeight:700,color:"var(--tx)"}}>{f.parcelas.length}</span>
      </div>)}{list.length===0&&<div style={{padding:30,textAlign:"center",color:"var(--tx3)",fontSize:12,fontWeight:600}}>Nenhuma conta</div>}</Card>
    </div>)};

  // ESTOQUE
  const PgEst=()=>{const [eE,setEE]=useState(null);return(<div style={{animation:"fadeIn .3s"}}><SH title="Estoque" sub={`${estoque.length} itens • ${R$(stats.estVal)}`} right={<Btn onClick={()=>setEE({nome:"",un:"un",qtd:0,custo:0})}><I.Plus/> Novo</Btn>}/>
    {eE&&<Modal onClose={()=>setEE(null)}><h2 style={{fontSize:16,fontWeight:800,color:"var(--tx)",marginBottom:16}}>{eE.id?"Editar":"Novo"} Item</h2><Field label="Material" value={eE.nome} onChange={v=>setEE({...eE,nome:v})}/><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}><Field label="Unidade" value={eE.un} onChange={v=>setEE({...eE,un:v})}/><Field label="Qtd" type="number" value={eE.qtd} onChange={v=>setEE({...eE,qtd:+v})}/><Field label="Custo Unit." type="number" value={eE.custo} onChange={v=>setEE({...eE,custo:+v})}/></div><div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:8}}><Btn v="ghost" onClick={()=>setEE(null)}>Cancelar</Btn><Btn onClick={()=>{if(!eE.nome)return showToast("Nome!","red");if(eE.id){setEstoque(p=>p.map(e=>e.id===eE.id?{...e,...eE}:e))}else{setEstoque(p=>[...p,{...eE,id:uid()}])}setEE(null);showToast("Salvo!")}}><I.Check/> Salvar</Btn></div></Modal>}
    <Card><TH cols={[{l:"Material",w:"2fr"},{l:"Un.",w:"70px"},{l:"Qtd",w:"70px"},{l:"Custo",w:"100px"},{l:"Total",w:"110px"},{l:"",w:"60px"}]}/>{estoque.map(e=><div key={e.id} style={{display:"grid",gridTemplateColumns:"2fr 70px 70px 100px 110px 60px",gap:6,padding:"10px 18px",borderBottom:"1.5px solid var(--bd)",alignItems:"center",fontSize:12}}>
      <span style={{fontWeight:700,color:"var(--tx)"}}>{e.nome}</span><span style={{color:"var(--tx2)"}}>{e.un}</span><span style={{color:e.qtd<10?"var(--rd)":"var(--tx)",fontWeight:e.qtd<10?800:600}}>{e.qtd}</span><span style={{color:"var(--tx2)"}}>{R$(e.custo)}</span><span style={{fontWeight:700,color:"var(--tx)"}}>{R$(e.qtd*e.custo)}</span>
      <div style={{display:"flex",gap:3}}><button onClick={()=>setEE(e)} style={{background:"none",border:"none",color:"var(--tx3)",padding:3}}><I.Edit/></button><button onClick={()=>{setEstoque(p=>p.filter(x=>x.id!==e.id));showToast("Removido","red")}} style={{background:"none",border:"none",color:"var(--rd)",padding:3}}><I.Trash/></button></div>
    </div>)}</Card></div>)};

  // DRE
  const PgDRE=()=>{
    const rec=pedidos.reduce((s,p)=>s+p.vt,0);const cm=pedidos.reduce((s,p)=>s+p.cm,0);const cc=pedidos.reduce((s,p)=>s+p.comVal,0);const lb=rec-cm;const ll=lb-cc;const mg=rec>0?((ll/rec)*100).toFixed(1):0;
    const rows=[{l:"(+) Receita Bruta",v:rec,c:"gn",b:true},{l:"(−) Custo Materiais",v:-cm,c:"rd"},{l:"= Lucro Bruto",v:lb,c:lb>=0?"gn":"rd",b:true,line:true},{l:"(−) Comissões",v:-cc,c:"rd"},{l:"= Resultado Líquido",v:ll,c:ll>=0?"gn":"rd",b:true,line:true}];
    const chartData=[{name:"Receita",value:rec},{name:"Materiais",value:cm},{name:"Comissões",value:cc},{name:"Lucro Líq.",value:Math.max(0,ll)}];
    const byPed=pedidos.map(p=>({name:p.num,receita:p.vt,custo:p.cm,comissao:p.comVal,lucro:p.vt-p.cm-p.comVal}));
    return(<div style={{animation:"fadeIn .3s"}}><SH title="DRE — Demonstração de Resultados"/>
      <div style={{display:"flex",gap:12,marginBottom:20,flexWrap:"wrap"}}><KPI label="Receita" value={R$(rec)} icon={<I.Dollar/>} color="gn"/><KPI label="Materiais" value={R$(cm)} icon={<I.Package/>} color="rd"/><KPI label="Comissões" value={R$(cc)} icon={<I.Percent/>} color="am"/><KPI label="Margem Líq." value={`${mg}%`} icon={<I.DRE/>} color={ll>=0?"gn":"rd"}/></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
        <Card style={{maxWidth:500}}>{rows.map((r,i)=><div key={i} style={{padding:"12px 20px",borderTop:r.line?"2px solid var(--bd)":"1.5px solid var(--bd)",display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:13,fontWeight:r.b?800:600,color:"var(--tx)"}}>{r.l}</span><span style={{fontSize:r.b?18:14,fontWeight:800,color:`var(--${r.c})`}}>{R$(r.v)}</span></div>)}</Card>
        <Card><CardHead title="Composição"/><div style={{padding:16,height:220}}><ResponsiveContainer><PieChart><Pie data={chartData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>{chartData.map((e,i)=><Cell key={i} fill={["#10b981","#ef4444","#f59e0b","#6366f1"][i]}/>)}</Pie><Tooltip formatter={v=>R$(v)}/><Legend iconType="circle" wrapperStyle={{fontSize:10,fontWeight:700}}/></PieChart></ResponsiveContainer></div></Card>
      </div>
      {byPed.length>0&&<Card><CardHead title="Resultado por Pedido"/><div style={{padding:16,height:250}}><ResponsiveContainer><BarChart data={byPed}><CartesianGrid strokeDasharray="3 3" stroke="var(--bd)"/><XAxis dataKey="name" tick={{fontSize:10,fontWeight:700,fill:"var(--tx2)"}}/><YAxis tick={{fontSize:10,fill:"var(--tx3)"}}/><Tooltip formatter={v=>R$(v)}/><Legend iconType="circle" wrapperStyle={{fontSize:10,fontWeight:700}}/><Bar dataKey="receita" fill="#10b981" radius={[4,4,0,0]} name="Receita"/><Bar dataKey="custo" fill="#ef4444" radius={[4,4,0,0]} name="Custo"/><Bar dataKey="lucro" fill="#6366f1" radius={[4,4,0,0]} name="Lucro"/></BarChart></ResponsiveContainer></div></Card>}
    </div>)};

  // BANCO (placeholder)
  const PgBanco=()=>(<div style={{animation:"fadeIn .3s"}}><SH title="Integração Bancária" sub="Sincronize sua conta bancária com o ERP"/>
    <Card style={{padding:24}}>
      <div style={{textAlign:"center",maxWidth:500,margin:"0 auto"}}>
        <div style={{width:64,height:64,borderRadius:20,background:"var(--prib2)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}><I.Bank/></div>
        <h2 style={{fontSize:18,fontWeight:800,color:"var(--tx)",marginBottom:8}}>Conecte sua Conta Bancária</h2>
        <p style={{fontSize:13,color:"var(--tx2)",fontWeight:600,marginBottom:20,lineHeight:1.6}}>Integração com Open Finance para sincronização automática de extratos, conciliação bancária e controle de fluxo de caixa em tempo real.</p>
        <div style={{background:"var(--bg)",borderRadius:"var(--rl)",padding:20,border:"1.5px solid var(--bd)",textAlign:"left",marginBottom:16}}>
          <Field label="Banco" value={bankSync.banco} onChange={v=>setBankSync({...bankSync,banco:v})} placeholder="Ex: Banco do Brasil, Itaú, Nubank..." options={["","Banco do Brasil","Bradesco","Itaú","Nubank","Santander","Caixa","Sicoob","Inter","C6 Bank"].map(b=>({v:b,l:b||"Selecione..."}))}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <Field label="Agência" value={bankSync.agencia} onChange={v=>setBankSync(p=>({...p,agencia:v}))} placeholder="0000" commitOnBlur/>
            <Field label="Conta" value={bankSync.conta} onChange={v=>setBankSync(p=>({...p,conta:v}))} placeholder="00000-0" commitOnBlur/>
          </div>
        </div>
        <Btn onClick={()=>showToast("Funcionalidade em breve! API Open Finance será integrada.")} style={{padding:"12px 32px"}}><I.Bank/> Conectar Banco</Btn>
        <div style={{marginTop:16,display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
          {["Extrato automático","Conciliação","Fluxo de caixa","Boletos","PIX"].map(f=><Badge key={f} color="pri">{f}</Badge>)}
        </div>
      </div>
    </Card>
  </div>);

  // ÁREA DO MARCENEIRO
  const PgMinhaArea=()=>(<div style={{animation:"fadeIn .3s"}}><SH title="Meus Projetos" sub={`${meusP.length} designados`}/>{meusP.map(p=>{const c=getCli(p.clienteId);const comPaga=p.pags?.filter(pg=>pg.desc?.includes("[COM]")).reduce((s,pg)=>s+pg.valor,0)||0;return(
    <Card key={p.id} style={{marginBottom:12,padding:18}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}><div><h3 style={{fontSize:16,fontWeight:800,color:"var(--pri)"}}>{p.num}</h3><p style={{fontSize:12,color:"var(--tx2)",fontWeight:600}}>{c?.nome}</p></div><div style={{textAlign:"right"}}><Badge color={p.stage==="concluido"?"green":"amber"}>{KCOLS.find(k=>k.id===p.stage)?.label}</Badge>{p.dataEntrega&&<div style={{fontSize:10,color:"var(--rd)",fontWeight:700,marginTop:4}}><I.Clock/> {p.dataEntrega}</div>}</div></div>
      {p.ambs.map((a,i)=><div key={i} style={{padding:"6px 0",borderBottom:"1px solid var(--bd)"}}><strong style={{fontSize:12}}>{a.nome||`Amb ${i+1}`}</strong>{a.desc&&<div style={{fontSize:11,color:"var(--tx3)",whiteSpace:"pre-line"}}>{a.desc}</div>}</div>)}
      <div style={{background:"var(--bg)",borderRadius:"var(--r)",padding:12,border:"1.5px solid var(--bd)",marginTop:10,marginBottom:10}}>
        <div style={{fontSize:10,fontWeight:800,textTransform:"uppercase",color:"var(--tx3)",marginBottom:6}}>Materiais</div>
        {p.mats.map(m=><div key={m.id} style={{display:"flex",justifyContent:"space-between",fontSize:11,padding:"2px 0",color:"var(--tx2)"}}><span>{m.nome}</span><span>×{m.qtd}</span></div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
        <div style={{background:"var(--prib)",borderRadius:"var(--r)",padding:10,textAlign:"center"}}><div style={{fontSize:9,fontWeight:800,color:"var(--tx3)",textTransform:"uppercase"}}>Comissão</div><div style={{fontSize:16,fontWeight:800,color:"var(--pri)"}}>{R$(p.comVal)}</div></div>
        <div style={{background:"var(--gnb)",borderRadius:"var(--r)",padding:10,textAlign:"center"}}><div style={{fontSize:9,fontWeight:800,color:"var(--tx3)",textTransform:"uppercase"}}>Recebido</div><div style={{fontSize:16,fontWeight:800,color:"var(--gn)"}}>{R$(comPaga)}</div></div>
        <div style={{background:"var(--rdb)",borderRadius:"var(--r)",padding:10,textAlign:"center"}}><div style={{fontSize:9,fontWeight:800,color:"var(--tx3)",textTransform:"uppercase"}}>A Receber</div><div style={{fontSize:16,fontWeight:800,color:"var(--rd)"}}>{R$(p.comVal-comPaga)}</div></div>
      </div>
    </Card>)})}{meusP.length===0&&<Card style={{padding:30,textAlign:"center"}}><p style={{color:"var(--tx3)",fontWeight:600}}>Nenhum projeto</p></Card>}</div>);

  const PgMeuKanban=()=>(<div style={{animation:"fadeIn .3s"}}><SH title="Meu Kanban"/><div style={{display:"flex",gap:10,overflowX:"auto",paddingBottom:10}}>{KCOLS.map(col=>{const cards=meusP.filter(p=>p.stage===col.id);return(<div key={col.id} style={{minWidth:170,flex:1,background:"var(--bg)",borderRadius:"var(--rl)",border:"1.5px solid var(--bd)"}}><div style={{padding:"10px 12px",borderBottom:"1.5px solid var(--bd)",display:"flex",alignItems:"center",gap:5}}><div style={{width:7,height:7,borderRadius:4,background:col.color}}/><span style={{fontSize:11,fontWeight:800,color:"var(--tx)"}}>{col.label}</span></div><div style={{padding:6,minHeight:60}}>{cards.map(p=>{const c=getCli(p.clienteId);return(<div key={p.id} className="kcard" style={{background:"var(--cd)",border:"1.5px solid var(--bd)",borderRadius:"var(--r)",padding:"8px 10px",marginBottom:5,borderLeft:`3px solid ${col.color}`,boxShadow:"var(--sh)"}}><div style={{fontWeight:800,fontSize:10,color:"var(--pri)"}}>{p.num}</div><div style={{fontSize:10,color:"var(--tx)",fontWeight:600}}>{c?.nome}</div><select value={p.stage} onChange={e=>{updPed(p.id,{stage:e.target.value,status:e.target.value==="concluido"?"concluido":"em_producao"});showToast("Atualizado!")}} onClick={e=>e.stopPropagation()} style={{width:"100%",padding:"3px 5px",borderRadius:6,border:"1.5px solid var(--bd)",background:"var(--sf)",color:"var(--tx)",fontSize:9,fontWeight:700,outline:"none",marginTop:4}}>{KCOLS.map(k=><option key={k.id} value={k.id}>{k.label}</option>)}</select></div>)})}</div></div>)})}</div></div>);

  const PgCom=()=>{const tc=meusP.reduce((s,p)=>s+p.comVal,0);const tr=meusP.reduce((s,p)=>s+(p.pags?.filter(pg=>pg.desc?.includes("[COM]")).reduce((ss,pg)=>ss+pg.valor,0)||0),0);return(<div style={{animation:"fadeIn .3s"}}><SH title="Minhas Comissões"/><div style={{display:"flex",gap:12,marginBottom:18}}><KPI label="Total" value={R$(tc)} icon={<I.Dollar/>} color="pri"/><KPI label="Recebido" value={R$(tr)} icon={<I.Check/>} color="gn"/><KPI label="A Receber" value={R$(tc-tr)} icon={<I.Clock/>} color="rd"/></div>
    <Card><TH cols={[{l:"Pedido",w:"80px"},{l:"Projeto",w:"1.5fr"},{l:"%",w:"60px"},{l:"Valor",w:"100px"},{l:"Recebido",w:"100px"},{l:"Restante",w:"100px"}]}/>{meusP.map(p=>{const c=getCli(p.clienteId);const r=p.pags?.filter(pg=>pg.desc?.includes("[COM]")).reduce((s,pg)=>s+pg.valor,0)||0;return(<div key={p.id} style={{display:"grid",gridTemplateColumns:"80px 1.5fr 60px 100px 100px 100px",gap:6,padding:"10px 18px",borderBottom:"1.5px solid var(--bd)",alignItems:"center",fontSize:12}}><span style={{fontWeight:800,color:"var(--pri)"}}>{p.num}</span><span style={{color:"var(--tx)",fontWeight:600}}>{c?.nome}</span><Badge>{p.comPerc}%</Badge><span style={{fontWeight:700}}>{R$(p.comVal)}</span><span style={{color:"var(--gn)",fontWeight:700}}>{R$(r)}</span><span style={{color:"var(--rd)",fontWeight:800}}>{R$(p.comVal-r)}</span></div>)})}</Card></div>)};

  // PAGE ROUTER
  const pages={dashboard:PgDash,crm:PgCRM,clientes:PgCli,orcamentos:PgOrc,pedidos:PgPed,kanban:PgKanban,marceneiros:PgMarc,financeiro:PgFin,estoque:PgEst,dre:PgDRE,banco:PgBanco,minha_area:PgMinhaArea,meu_kanban:PgMeuKanban,comissoes:PgCom};
  const Pg=pages[tab]||PgDash;

  // ══════════════════════════════
  // RENDER
  // ══════════════════════════════
  return(
    <div className="erp-wrap" style={{fontFamily:"var(--ft)",background:"var(--bg)",color:"var(--tx)",minHeight:"100vh",display:"flex"}}>
      <style>{CSS}</style>

      {/* SIDEBAR */}
      <aside className="erp-sidebar" style={{width:205,minHeight:"100vh",background:"var(--cd)",borderRight:"1.5px solid var(--bd)",display:"flex",flexDirection:"column",flexShrink:0,zIndex:20,boxShadow:"2px 0 12px rgba(0,0,0,.03)"}}>
        <div className="sidebar-logo" style={{padding:"18px 16px",borderBottom:"1.5px solid var(--bd)",display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:36,height:36,borderRadius:12,background:"linear-gradient(135deg,#6366f1,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 8px rgba(99,102,241,.3)"}}><span style={{fontSize:18,filter:"brightness(10)"}}>🪵</span></div>
          <div><span style={{fontSize:16,fontWeight:800,color:"var(--pri)",display:"block",lineHeight:1}}>ERP</span><span style={{fontSize:9,color:"var(--tx3)",fontWeight:800,letterSpacing:"1.5px",textTransform:"uppercase"}}>Marcenaria</span></div>
        </div>
        <nav style={{flex:1,paddingTop:6,overflowY:"auto"}}>
          {nav.map(n=>(
            <div key={n.k} onClick={()=>{setTab(n.k);setOrcAtivo(null);setPedAtivo(null)}}
              style={{padding:"10px 16px",display:"flex",alignItems:"center",gap:9,cursor:"pointer",color:tab===n.k?"var(--pri)":"var(--tx2)",fontWeight:tab===n.k?800:600,fontSize:12,background:tab===n.k?"var(--prib)":"transparent",borderLeft:tab===n.k?"3px solid var(--pri)":"3px solid transparent",transition:"all .15s"}}>
              {n.i}<span>{n.l}</span>
            </div>
          ))}
        </nav>
        <div className="sidebar-user" style={{padding:"12px 16px",borderTop:"1.5px solid var(--bd)"}}>
          <div style={{fontSize:10,color:"var(--tx3)",fontWeight:700,marginBottom:6}}>{user.role==="admin"?"👤 Administrador":"🔧 "+user.nome}</div>
          {user.role==="admin"
            ?<div style={{display:"flex",flexDirection:"column",gap:4}}>
              <Btn v="ghost" small onClick={()=>setLoginView({l:"",s:""})} style={{width:"100%",justifyContent:"center",fontSize:10}}><I.Lock/> Área Marceneiro</Btn>
              <Btn v="ghost" small onClick={()=>{localStorage.removeItem('erpUser');setUser(null);}} style={{width:"100%",justifyContent:"center",fontSize:10,color:"var(--rd)"}}>Sair</Btn>
             </div>
            :<Btn v="ghost" small onClick={()=>{const u={role:"admin",nome:"Admin",id:"admin"};setUser(u);localStorage.setItem('erpUser',JSON.stringify(u));setTab("dashboard");}} style={{width:"100%",justifyContent:"center",fontSize:10}}>← Voltar ao Admin</Btn>}
        </div>
      </aside>

      {/* MAIN */}
      <main className="erp-main" style={{flex:1,padding:"20px 24px",minHeight:"100vh",overflowY:"auto"}}>{tab==="configuracao"?<PgConfig empresa={empresa} saveEmpresa={saveEmpresa}/>:<Pg/>}</main>

      {/* MODALS */}
      {modal?.t==="editCli"&&<Modal onClose={()=>setModal(null)}><ModalEditCli d={modal.d} setModal={setModal} saveCli={saveCli}/></Modal>}

      {modal?.t==="selCli"&&<Modal onClose={()=>setModal(null)}><ModalSelCli clientes={clientes} setModal={setModal} criarOrc={criarOrc}/></Modal>}

      {modal?.t==="editLead"&&<Modal onClose={()=>setModal(null)}><ModalEditLead d={modal.d} setModal={setModal} setLeads={setLeads} showToast={showToast}/></Modal>}

      {modal?.t==="pdf"&&(()=>{const o=modal.d;const c=getCli(o.clienteId);return(<Modal onClose={()=>setModal(null)} wide><div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}><h2 style={{fontSize:16,fontWeight:800}}>Proposta Comercial</h2><Btn v="ghost" small onClick={()=>setModal(null)}><I.X/></Btn></div>
        <div style={{background:"#fff",borderRadius:12,padding:"36px 40px",fontSize:13,lineHeight:1.6,maxHeight:"70vh",overflowY:"auto",border:"1.5px solid var(--bd)"}}>
          <div style={{borderBottom:"3px solid #6366f1",paddingBottom:16,marginBottom:20,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              {empresa.logo&&<img src={empresa.logo} alt="logo" style={{height:52,objectFit:"contain"}}/>}
              <div><h1 style={{fontSize:22,fontWeight:800,margin:0,color:"#1e293b"}}>{empresa.nome||"Proposta Comercial"}</h1><p style={{color:"#888",fontSize:11}}>{empresa.endereco}</p>{empresa.telefone&&<p style={{color:"#888",fontSize:11}}>{empresa.telefone}{empresa.email?" • "+empresa.email:""}</p>}{empresa.cnpj&&<p style={{color:"#888",fontSize:11}}>CNPJ: {empresa.cnpj}</p>}</div>
            </div>
            <div style={{textAlign:"right"}}><div style={{fontWeight:800,color:"#6366f1",fontSize:15}}>{o.num}</div><div style={{color:"#888",fontSize:11}}>{o.data}</div></div>
          </div>
          <div style={{background:"#f8f7ff",borderRadius:10,padding:"14px 18px",marginBottom:20,border:"1px solid #e8e5f0"}}><div style={{fontSize:10,fontWeight:800,textTransform:"uppercase",color:"#999",marginBottom:6}}>Cliente</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"2px 20px",fontSize:12}}><div><strong>Nome:</strong> {c?.nome}</div><div><strong>Doc:</strong> {c?.doc}</div><div><strong>Tel:</strong> {c?.tel}</div><div><strong>Email:</strong> {c?.email}</div></div></div>
          {o.ambientes.map((a,i)=><div key={a.id} style={{marginBottom:8,border:"1px solid #e8e5f0",borderRadius:8,overflow:"hidden"}}><div style={{background:"#f8f7ff",padding:"10px 16px",display:"flex",justifyContent:"space-between"}}><strong>{a.nome||`Amb ${i+1}`}</strong><span style={{fontWeight:800,color:"#6366f1"}}>{R$(a.valorTotal)}</span></div>{a.desc&&<div style={{padding:"8px 16px",fontSize:12,color:"#555",whiteSpace:"pre-line"}}>{a.desc}</div>}</div>)}
          <div style={{background:"linear-gradient(135deg,#6366f1,#8b5cf6)",borderRadius:10,padding:"16px 20px",margin:"16px 0 20px",display:"flex",justifyContent:"space-between",alignItems:"center",color:"#fff"}}><span style={{fontWeight:700}}>Valor Total</span><span style={{fontSize:24,fontWeight:800}}>{R$(totalOrc(o))}</span></div>
          <div style={{marginBottom:14}}><div style={{fontSize:10,fontWeight:800,textTransform:"uppercase",color:"#999",marginBottom:4}}>Garantia</div><div style={{fontSize:11,color:"#555",whiteSpace:"pre-line"}}>{o.garantia}</div></div>
          <div><div style={{fontSize:10,fontWeight:800,textTransform:"uppercase",color:"#999",marginBottom:4}}>Pagamento</div><div style={{fontSize:11,color:"#555",whiteSpace:"pre-line"}}>{o.pagamento}</div></div>
        </div>
      </Modal>)})()}

      {modal?.t==="detFin"&&(()=>{const f=modal.d;return(<Modal onClose={()=>setModal(null)} wide><h2 style={{fontSize:16,fontWeight:800,marginBottom:14}}>Detalhes — {f.desc}</h2>
        <div style={{display:"flex",gap:12,marginBottom:16}}><div style={{flex:1,background:"var(--bg)",borderRadius:"var(--r)",padding:14,border:"1.5px solid var(--bd)"}}><div style={{fontSize:10,fontWeight:800,textTransform:"uppercase",color:"var(--tx3)"}}>Valor Total</div><div style={{fontSize:18,fontWeight:800,color:"var(--tx)",marginTop:4}}>{R$(f.valor)}</div></div><div style={{flex:1,background:"var(--gnb)",borderRadius:"var(--r)",padding:14}}><div style={{fontSize:10,fontWeight:800,textTransform:"uppercase",color:"var(--tx3)"}}>Pago</div><div style={{fontSize:18,fontWeight:800,color:"var(--gn)",marginTop:4}}>{R$(f.valorPago)}</div></div><div style={{flex:1,background:"var(--rdb)",borderRadius:"var(--r)",padding:14}}><div style={{fontSize:10,fontWeight:800,textTransform:"uppercase",color:"var(--tx3)"}}>Restante</div><div style={{fontSize:18,fontWeight:800,color:"var(--rd)",marginTop:4}}>{R$(f.valor-f.valorPago)}</div></div></div>
        <h3 style={{fontSize:13,fontWeight:800,marginBottom:10}}>Parcelas</h3>
        {f.parcelas.map((p,i)=><div key={p.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1.5px solid var(--bd)",fontSize:12}}>
          <div><span style={{fontWeight:700}}>Parcela {i+1}</span>{p.venc&&<span style={{color:"var(--tx3)",marginLeft:8,fontSize:10}}>Venc: {p.venc}</span>}</div>
          <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontWeight:700}}>{R$(p.valor)}</span>{p.pago?<Badge color="green">Pago {p.dataPago}</Badge>:<Btn v="success" small onClick={()=>{pagarParcela(f.id,p.id);setModal({t:"detFin",d:financeiro.find(x=>x.id===f.id)||f})}}>Baixar</Btn>}</div>
        </div>)}
        <div style={{display:"flex",gap:8,marginTop:12}}><Btn v="ghost" small onClick={()=>{addParcela(f.id);setModal({t:"detFin",d:financeiro.find(x=>x.id===f.id)||f})}}><I.Plus/> Parcela</Btn></div>
        <div style={{textAlign:"right",marginTop:12}}><Btn v="ghost" onClick={()=>setModal(null)}>Fechar</Btn></div>
      </Modal>)})()}

      {modal?.t==="newFin"&&<Modal onClose={()=>setModal(null)}><ModalNewFin setModal={setModal} setFinanceiro={setFinanceiro} showToast={showToast}/></Modal>}

      {/* TOAST */}
      {toast&&<div style={{position:"fixed",bottom:20,right:20,padding:"10px 18px",borderRadius:12,background:toast.type==="red"?"var(--rdb)":"var(--gnb)",color:toast.type==="red"?"var(--rd)":"var(--gn)",border:`1.5px solid ${toast.type==="red"?"rgba(239,68,68,.15)":"rgba(16,185,129,.15)"}`,fontSize:12,fontWeight:800,boxShadow:"var(--sh2)",animation:"scaleIn .2s",zIndex:9999,display:"flex",alignItems:"center",gap:6}}>{toast.type==="red"?<I.X/>:<I.Check/>}{toast.msg}</div>}
    </div>
  );
}
