import { useState, useCallback, useMemo, useRef, useEffect, useLayoutEffect } from "react";
import { dbGet, dbGetRow, dbSet, dbSetMany } from "./supabase";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

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
const isoToBR=d=>{if(!d)return"";const p=d.split("-");return p.length===3?`${p[2]}/${p[1]}/${p[0]}`:d;};
const MARKUP=3.2;
const CATS={pagar:["Aluguel","Folha/Comissão","Fornecedores","Marketing","Manutenção","Impostos","Utilidades","Outros"],receber:["Venda Móveis","Serviços","Outros"]};
const getEmpresaCats=()=>{try{const e=JSON.parse(localStorage.getItem('erpEmpresa'));return{pagar:(e?.cats?.pagar?.length?e.cats.pagar:CATS.pagar),receber:(e?.cats?.receber?.length?e.cats.receber:CATS.receber)};}catch{return CATS;}};
const GARANTIA=`Garantia de 12 meses contra defeitos de fabricação.\nNão cobre: mau uso, umidade excessiva, modificações por terceiros.\nAjustes dentro da garantia sem custo adicional.`;
const PAGAMENTO=`• 50% na aprovação\n• 30% início fabricação\n• 20% na entrega\n\nPIX (3% desc.), Transf., Boleto, Cartão até 10x.\nValidade: 15 dias.`;
const ESPECIFICACOES=`Material: MDF 15mm com revestimento melamínico BP.\nFerros: Puxadores e corrediças Blum ou equivalente.\nAcabamento: Faca BP padrão, borda PVC 0,4mm colada a quente.\nMontagem: Inclusa no valor do projeto.`;
const KCOLS=[{id:"aguardando",label:"Aguardando Aceite",color:"#94a3b8"},{id:"corte",label:"Plano de Corte",color:"#f59e0b"},{id:"montagem",label:"Montagem",color:"#3b82f6"},{id:"instalacao",label:"Instalação",color:"#8b5cf6"},{id:"concluido",label:"Concluído",color:"#10b981"}];
const LEAD_STAGES=["Novo Lead","Contato Feito","Proposta Enviada","Negociação","Fechado/Ganho","Perdido"];
const LEAD_COLORS=["#6366f1","#3b82f6","#f59e0b","#8b5cf6","#10b981","#ef4444"];
const LS=k=>{try{const v=localStorage.getItem('erp_'+k);return v?JSON.parse(v):null;}catch{return null;}};
const DEMO_CLIENTES=[{id:"cli1",nome:"João Mendes",tel:"(19)99812-3456",email:"joao@email.com",endereco:"Rua Augusta 450, Campinas/SP",doc:"123.456.789-00"},{id:"cli2",nome:"Ana Costa",tel:"(19)98765-4321",email:"ana@email.com",endereco:"Av Brasil 1200, Valinhos/SP",doc:"987.654.321-00"}];
const DEMO_MARC=[{id:"m1",nome:"Carlos Silva",tel:"(19)99111-2233",esp:"Cozinhas",comissao:12,login:"carlos",senha:"1234",ativo:true},{id:"m2",nome:"Roberto Alves",tel:"(19)99444-5566",esp:"Dormitórios",comissao:10,login:"roberto",senha:"1234",ativo:true}];
const DEMO_EST=[{id:"e1",nome:"MDF Branco 15mm",un:"chapa",qtd:45,custo:189.90},{id:"e2",nome:"MDF Amadeirado 15mm",un:"chapa",qtd:30,custo:210.50},{id:"e3",nome:"Puxador Gota 128mm",un:"un",qtd:200,custo:12.80},{id:"e4",nome:"Dobradiça 35mm",un:"un",qtd:500,custo:4.50},{id:"e5",nome:"Corrediça 400mm",un:"par",qtd:80,custo:38.90}];
const DEMO_LEADS=[{id:"l1",nome:"Fernando Lima",tel:"(19)99777-8899",email:"fernando@gmail.com",origem:"Instagram",interesse:"Cozinha completa",valor:25000,etapa:"Novo Lead",obs:"Viu nosso post e entrou em contato",data:hoje(),prioridade:"alta"},{id:"l2",nome:"Mariana Souza",tel:"(19)98888-1122",email:"mari@hotmail.com",origem:"Indicação",interesse:"Closet casal",valor:15000,etapa:"Contato Feito",obs:"Indicação do João Mendes",data:hoje(),prioridade:"media"},{id:"l3",nome:"Ricardo Prado",tel:"(11)99666-3344",email:"ricardo@empresa.com",origem:"Site",interesse:"Escritório completo",valor:35000,etapa:"Proposta Enviada",obs:"Empresa precisa de 3 estações",data:hoje(),prioridade:"alta"}];

/* ═══════════════════════════════════════════
   GLOBAL CSS — BLING LIGHT THEME
   ═══════════════════════════════════════════ */
const CSS=`
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
  --ft:'Calibri','Trebuchet MS','Segoe UI',Arial,sans-serif;
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
  .mobile-logout{display:flex!important}
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
  const ST={width:"100%",padding:"10px 12px",borderRadius:"var(--r)",border:"1.5px solid var(--bd)",background:"var(--sf)",color:"var(--tx)",fontSize:13,fontWeight:500,outline:"none"};
  if(commitOnBlur){
    // Estado local: preserva o texto digitado mesmo quando o pai re-renderiza
    // (evita perda de texto ao clicar em botões próximos antes de fazer blur)
    const [local,setLocal]=useState(value==null?"":String(value));
    const editing=useRef(false);
    useEffect(()=>{
      // Só sincroniza do pai se o campo não estiver sendo editado
      if(!editing.current)setLocal(value==null?"":String(value));
    },[value]);
    const commit=v=>{editing.current=false;onChange(type==="number"?+v:v);};
    return(
      <div style={{marginBottom:12,...sx}}>
        {label&&<label style={{display:"block",fontSize:13,fontWeight:800,color:"var(--tx2)",textTransform:"uppercase",letterSpacing:".5px",marginBottom:5}}>{label}</label>}
        {rows
          ?<textarea value={local} placeholder={placeholder} rows={rows} disabled={disabled}
              style={{...ST,resize:"vertical",lineHeight:1.5}}
              onChange={e=>{editing.current=true;setLocal(e.target.value);}}
              onBlur={e=>commit(e.target.value)}/>
          :<input type={type} value={local} placeholder={placeholder} disabled={disabled}
              style={ST}
              onChange={e=>{editing.current=true;setLocal(e.target.value);}}
              onBlur={e=>commit(e.target.value)}/>}
      </div>
    );
  }
  // Modo controlado normal (sem commitOnBlur)
  return(
    <div style={{marginBottom:12,...sx}}>
      {label&&<label style={{display:"block",fontSize:13,fontWeight:800,color:"var(--tx2)",textTransform:"uppercase",letterSpacing:".5px",marginBottom:5}}>{label}</label>}
      {options?<select value={value==null?"":String(value)} onChange={e=>onChange(e.target.value)} disabled={disabled} style={ST}>{options.map(o=><option key={o.v||o} value={o.v||o}>{o.l||o}</option>)}</select>
      :rows?<textarea value={value==null?"":String(value)} onChange={e=>onChange(type==="number"?+e.target.value:e.target.value)} placeholder={placeholder} rows={rows} disabled={disabled} style={{...ST,resize:"vertical",lineHeight:1.5}}/>
      :<input type={type} value={value==null?"":String(value)} onChange={e=>onChange(type==="number"?+e.target.value:e.target.value)} placeholder={placeholder} disabled={disabled} style={ST}/>}
    </div>
  );
}

// Input sem re-render no parent a cada tecla (uncontrolled + commit onBlur)
function BlurInput({value,onCommit,type="text",placeholder,style:sx,...rest}){
  const ref=useRef(null);
  useEffect(()=>{if(ref.current&&document.activeElement!==ref.current)ref.current.value=value==null?"":String(value);},[value]);
  return <input ref={ref} type={type} defaultValue={value==null?"":String(value)} onBlur={e=>onCommit(type==="number"?+e.target.value:e.target.value)} placeholder={placeholder} style={sx} {...rest}/>;
}
// Textarea sem re-render no parent a cada tecla (uncontrolled + commit onBlur)
function BlurTextarea({value,onCommit,placeholder,rows=3,style:sx,...rest}){
  const ref=useRef(null);
  useEffect(()=>{if(ref.current&&document.activeElement!==ref.current)ref.current.value=value==null?"":String(value);},[value]);
  return <textarea ref={ref} defaultValue={value==null?"":String(value)} onBlur={e=>onCommit(e.target.value)} placeholder={placeholder} rows={rows} style={sx} {...rest}/>;
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

const CardHead=({title,right})=><div style={{padding:"16px 20px",borderBottom:"1.5px solid var(--bd)",display:"flex",justifyContent:"space-between",alignItems:"center"}}><h3 style={{fontSize:20,fontWeight:800,color:"var(--tx)"}}>{title}</h3>{right}</div>;

const TH=({cols})=><div style={{display:"grid",gridTemplateColumns:cols.map(c=>c.w||"1fr").join(" "),gap:6,padding:"10px 18px",borderBottom:"1.5px solid var(--bd)",background:"var(--bg)"}}>{cols.map(c=><span key={c.l} style={{fontSize:11,fontWeight:800,textTransform:"uppercase",letterSpacing:".7px",color:"var(--tx3)"}}>{c.l}</span>)}</div>;

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

function ModalNewFin({setModal,setFinanceiro,setRecorrentes,showToast,cats:catsProp,fonteCartao,fontePool,fornecedorSugerido}){
  const [f,setF]=useState({tipo:"pagar",desc:"",valor:0,fornecedor:fornecedorSugerido||"",numParc:1,categoria:"Outros",venc:"",recorrente:false,diaRec:1});
  const eCats=catsProp||getEmpresaCats();
  const cats=eCats[f.tipo]||eCats.pagar;
  return(<><h2 style={{fontSize:16,fontWeight:800,marginBottom:16}}>Nova Conta</h2>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
      <Field label="Tipo" value={f.tipo} onChange={v=>setF(p=>({...p,tipo:v,categoria:"Outros"}))} options={[{v:"pagar",l:"A Pagar"},{v:"receber",l:"A Receber"}]}/>
      <Field label="Categoria" value={f.categoria} onChange={v=>setF(p=>({...p,categoria:v}))} options={cats}/>
    </div>
    <Field label="Descrição" value={f.desc} onChange={v=>setF(p=>({...p,desc:v}))} placeholder="Descrição da conta"/>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
      <Field label="Valor Total" type="number" value={f.valor} onChange={v=>setF(p=>({...p,valor:+v}))}/>
      {!f.recorrente&&<Field label="Nº Parcelas" type="number" value={f.numParc} onChange={v=>setF(p=>({...p,numParc:Math.max(1,+v)}))}/>}
      {!f.recorrente&&<Field label="1º Vencimento" type="date" value={f.venc} onChange={v=>setF(p=>({...p,venc:v}))}/>}
      {f.recorrente&&<Field label="Dia do mês" type="number" value={f.diaRec} onChange={v=>setF(p=>({...p,diaRec:Math.min(31,Math.max(1,+v))}))}/>}
    </div>
    {f.tipo==="pagar"&&<Field label="Fornecedor/Credor" value={f.fornecedor} onChange={v=>setF(p=>({...p,fornecedor:v}))}/>}
    {/* Toggle recorrente */}
    <div onClick={()=>setF(p=>({...p,recorrente:!p.recorrente}))} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:"var(--r)",border:"1.5px solid "+(f.recorrente?"var(--pp)":"var(--bd)"),background:f.recorrente?"var(--ppb)":"var(--bg)",cursor:"pointer",marginTop:4,userSelect:"none"}}>
      <div style={{width:36,height:20,borderRadius:10,background:f.recorrente?"var(--pp)":"var(--bd2)",transition:"background .2s",position:"relative",flexShrink:0}}>
        <div style={{position:"absolute",top:2,left:f.recorrente?18:2,width:16,height:16,borderRadius:"50%",background:"#fff",transition:"left .2s",boxShadow:"0 1px 3px rgba(0,0,0,.2)"}}/>
      </div>
      <div>
        <div style={{fontSize:12,fontWeight:800,color:f.recorrente?"var(--pp)":"var(--tx)"}}>🔄 Conta Recorrente</div>
        <div style={{fontSize:10,color:"var(--tx3)"}}>Gerada automaticamente todo mês neste dia</div>
      </div>
    </div>
    <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:8}}>
      <Btn v="ghost" onClick={()=>setModal(null)}>Cancelar</Btn>
      <Btn onClick={()=>{
        if(!f.desc)return showToast("Descrição!","red");
        if(!f.valor)return showToast("Informe o valor!","red");
        if(f.recorrente){
          // Adiciona à lista de recorrentes
          const novaRec={id:uid(),tipo:f.tipo,desc:f.desc,valor:f.valor,dia:f.diaRec,categoria:f.categoria||"Outros",fornecedor:f.fornecedor||"",ativo:true};
          setRecorrentes(prev=>[...prev,novaRec]);
          // Gera a parcela do mês atual imediatamente
          const mes=hojeISO().slice(0,7);
          const venc=`${mes}-${String(f.diaRec).padStart(2,"0")}`;
          setFinanceiro(prev=>[...prev,{id:uid(),tipo:f.tipo,desc:`${f.desc} ${mes}`,valor:f.valor,valorPago:0,parcelas:[{id:uid(),valor:f.valor,venc,pago:false,dataPago:""}],fornecedor:f.fornecedor||"",categoria:f.categoria||"Outros",recorrenteId:novaRec.id,status:"aberto"}]);
          setModal(null);showToast("Conta recorrente criada! Gerada também para este mês.");
        } else {
          const vParc=f.valor/Math.max(1,f.numParc);
          const parcelas=Array.from({length:Math.max(1,f.numParc)},(_,i)=>{
            let vd="";if(f.venc){const d=new Date(f.venc+"T12:00:00");d.setMonth(d.getMonth()+i);vd=d.toISOString().split("T")[0];}
            return{id:uid(),valor:vParc,venc:vd,pago:false,dataPago:""};
          });
          setFinanceiro(prev=>[...prev,{id:uid(),tipo:f.tipo,desc:f.desc,valor:f.valor,valorPago:0,parcelas,fornecedor:f.fornecedor,categoria:f.categoria||"Outros",status:"aberto",...(fonteCartao?{fonteCartao:true}:{}),...(fontePool?{fontePool}:{})}]);
          setModal(null);showToast("Conta criada!");
        }
      }}><I.Check/> {f.recorrente?"Criar Recorrente":"Criar"}</Btn>
    </div>
  </>);
}

function PgConfig({empresa,saveEmpresa,getBackup,importBackup,limparDuplicatas}){
  const [f,setF]=useState({...empresa});
  const u=(k,v)=>setF(p=>({...p,[k]:v}));
  const handleLogo=e=>{const file=e.target.files[0];if(!file)return;const reader=new FileReader();reader.onload=ev=>u("logo",ev.target.result);reader.readAsDataURL(file);};
  return(
    <div style={{animation:"fadeIn .3s",maxWidth:720}}>
      <SH title="Configurações da Empresa" sub="Informações usadas nos orçamentos e proposta comercial"/>
      <Card style={{padding:24,marginBottom:16}}>
        <h3 style={{fontSize:18,fontWeight:800,color:"var(--tx)",marginBottom:16,textTransform:"uppercase",letterSpacing:".5px"}}>Dados da Empresa</h3>
        <Field label="Nome da Empresa" value={f.nome} onChange={v=>u("nome",v)} placeholder="Ex: Marcenaria Silva"/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Field label="Slogan / Especialidade" value={f.tagline||""} onChange={v=>u("tagline",v)} placeholder="Ex: Movelaria de alto padrão"/>
          <Field label="Instagram (sem @)" value={f.instagram||""} onChange={v=>u("instagram",v)} placeholder="Ex: suamarcenaria"/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Field label="CNPJ / CPF" value={f.cnpj} onChange={v=>u("cnpj",v)} placeholder="00.000.000/0001-00"/>
          <Field label="Telefone" value={f.telefone} onChange={v=>u("telefone",v)} placeholder="(00) 00000-0000"/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Field label="E-mail" value={f.email} onChange={v=>u("email",v)} placeholder="contato@empresa.com"/>
          <Field label="Endereço completo" value={f.endereco} onChange={v=>u("endereco",v)} placeholder="Rua, número - Cidade/UF"/>
        </div>
        <Field label="Prazo padrão de execução (aparece nos orçamentos)" value={f.prazoExecucao||""} onChange={v=>u("prazoExecucao",v)} placeholder="Ex: 45 dias corridos"/>
      </Card>
      <Card style={{padding:24,marginBottom:16}}>
        <h3 style={{fontSize:18,fontWeight:800,color:"var(--tx)",marginBottom:16,textTransform:"uppercase",letterSpacing:".5px"}}>Logo da Empresa</h3>
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
        <h3 style={{fontSize:18,fontWeight:800,color:"var(--tx)",marginBottom:16,textTransform:"uppercase",letterSpacing:".5px"}}>Acesso do Administrador</h3>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Field label="Login do Admin" value={f.loginAdmin} onChange={v=>u("loginAdmin",v)}/>
          <Field label="Senha do Admin" type="password" value={f.senhaAdmin} onChange={v=>u("senhaAdmin",v)}/>
        </div>
        <p style={{fontSize:11,color:"var(--tx3)",fontWeight:600}}>Use essas credenciais para entrar como administrador no sistema.</p>
      </Card>
      <Card style={{padding:24,marginBottom:16}}>
        <h3 style={{fontSize:18,fontWeight:800,color:"var(--tx)",marginBottom:4,textTransform:"uppercase",letterSpacing:".5px"}}>Textos Padrão dos Orçamentos</h3>
        <p style={{fontSize:11,color:"var(--tx3)",fontWeight:600,marginBottom:16}}>Estes textos são usados automaticamente em todos os novos orçamentos. Você pode editar individualmente em cada orçamento.</p>
        <Field label="Garantia (padrão)" value={f.garantia||GARANTIA} onChange={v=>u("garantia",v)} rows={4} commitOnBlur/>
        <Field label="Forma de Pagamento (padrão)" value={f.pagamento||PAGAMENTO} onChange={v=>u("pagamento",v)} rows={4} commitOnBlur/>
        <Field label="Especificações dos Materiais (padrão)" value={f.especificacoes||ESPECIFICACOES} onChange={v=>u("especificacoes",v)} rows={4} commitOnBlur/>
      </Card>
      <Card style={{padding:24,marginBottom:16}}>
        <h3 style={{fontSize:18,fontWeight:800,color:"var(--tx)",marginBottom:4,textTransform:"uppercase",letterSpacing:".5px"}}>Aparência dos Documentos PDF</h3>
        <p style={{fontSize:11,color:"var(--tx3)",fontWeight:600,marginBottom:16}}>Escolha o tema de cores e o layout para orçamentos e ordens de serviço.</p>
        <div style={{marginBottom:20}}>
          <p style={{fontSize:11,fontWeight:800,color:"var(--tx)",marginBottom:10,textTransform:"uppercase",letterSpacing:".5px"}}>Tema de Cores</p>
          <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
            {Object.entries(PDF_TEMAS).map(([k,t])=>{
              const sel=(f.pdfTema||"classico")===k;
              return(
                <button key={k} onClick={()=>u("pdfTema",k)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8,padding:"14px 20px",borderRadius:12,border:`2px solid ${sel?t.acc:"var(--bd)"}`,background:sel?"var(--sf)":"var(--bg)",cursor:"pointer",minWidth:100,transition:"all .15s"}}>
                  <div style={{display:"flex",gap:4}}>
                    <div style={{width:22,height:22,borderRadius:"50%",background:t.dark,border:"2px solid #fff",boxShadow:"0 1px 4px #0004"}}/>
                    <div style={{width:22,height:22,borderRadius:"50%",background:t.acc,border:"2px solid #fff",boxShadow:"0 1px 4px #0004",marginLeft:-8}}/>
                  </div>
                  <span style={{fontSize:11,fontWeight:sel?800:600,color:sel?"var(--tx)":"var(--tx3)"}}>{t.nome}</span>
                  {sel&&<span style={{fontSize:9,fontWeight:800,color:t.acc,textTransform:"uppercase"}}>✓ Selecionado</span>}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <p style={{fontSize:11,fontWeight:800,color:"var(--tx)",marginBottom:10,textTransform:"uppercase",letterSpacing:".5px"}}>Layout</p>
          <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
            {[
              {k:"tradicional",desc:"Clássico com banner e blocos",icon:"≡"},
              {k:"moderno",desc:"Logo grande e seções limpas",icon:"◫"},
              {k:"minimalista",desc:"Simples e direto ao ponto",icon:"—"},
            ].map(({k,desc,icon})=>{
              const sel=(f.pdfLayout||"tradicional")===k;
              const t=PDF_TEMAS[f.pdfTema||"classico"];
              return(
                <button key={k} onClick={()=>u("pdfLayout",k)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6,padding:"14px 18px",borderRadius:12,border:`2px solid ${sel?t.acc:"var(--bd)"}`,background:sel?"var(--sf)":"var(--bg)",cursor:"pointer",minWidth:110,transition:"all .15s"}}>
                  <span style={{fontSize:22,lineHeight:1,color:sel?t.dark:"var(--tx3)"}}>{icon}</span>
                  <span style={{fontSize:11,fontWeight:sel?800:600,color:sel?"var(--tx)":"var(--tx3)",textTransform:"capitalize"}}>{k}</span>
                  <span style={{fontSize:9,color:"var(--tx3)",fontWeight:600,textAlign:"center",maxWidth:90}}>{desc}</span>
                  {sel&&<span style={{fontSize:9,fontWeight:800,color:t.acc,textTransform:"uppercase"}}>✓ Selecionado</span>}
                </button>
              );
            })}
          </div>
        </div>
      </Card>
      <Card style={{padding:24,marginBottom:16}}>
        <h3 style={{fontSize:18,fontWeight:800,color:"var(--tx)",marginBottom:4,textTransform:"uppercase",letterSpacing:".5px"}}>Categorias Financeiras</h3>
        <p style={{fontSize:11,color:"var(--tx3)",fontWeight:600,marginBottom:14}}>Personalize as categorias usadas nas contas e na DRE. Uma categoria por linha.</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <div>
            <label style={{fontSize:11,fontWeight:800,color:"var(--rd)",display:"block",marginBottom:6}}>Despesas (A Pagar)</label>
            <textarea value={(f.cats?.pagar||CATS.pagar).join("\n")} onChange={e=>u("cats",{...f.cats,pagar:e.target.value.split("\n").map(s=>s.trim()).filter(Boolean)})} rows={8} style={{width:"100%",padding:"8px 10px",borderRadius:10,border:"1.5px solid var(--bd)",background:"var(--sf)",color:"var(--tx)",fontSize:12,fontFamily:"var(--ft)",outline:"none",resize:"vertical"}}/>
          </div>
          <div>
            <label style={{fontSize:11,fontWeight:800,color:"var(--gn)",display:"block",marginBottom:6}}>Receitas (A Receber)</label>
            <textarea value={(f.cats?.receber||CATS.receber).join("\n")} onChange={e=>u("cats",{...f.cats,receber:e.target.value.split("\n").map(s=>s.trim()).filter(Boolean)})} rows={8} style={{width:"100%",padding:"8px 10px",borderRadius:10,border:"1.5px solid var(--bd)",background:"var(--sf)",color:"var(--tx)",fontSize:12,fontFamily:"var(--ft)",outline:"none",resize:"vertical"}}/>
          </div>
        </div>
      </Card>
      <Btn onClick={()=>saveEmpresa(f)} style={{width:"100%",justifyContent:"center",padding:14}}><I.Check/> Salvar Configurações</Btn>
      <div style={{marginTop:24,padding:20,background:"var(--bg)",borderRadius:"var(--rl)",border:"1.5px solid var(--bd)"}}>
        <h3 style={{fontSize:18,fontWeight:800,color:"var(--tx)",marginBottom:4,textTransform:"uppercase",letterSpacing:".5px"}}>Backup dos Dados</h3>
        <p style={{fontSize:11,color:"var(--tx3)",fontWeight:600,marginBottom:12}}>Exporte todos os dados como JSON para backup ou restauração em caso de perda.</p>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <Btn v="secondary" onClick={()=>{
            const backup={...getBackup(),_exportedAt:new Date().toISOString()};
            const blob=new Blob([JSON.stringify(backup,null,2)],{type:'application/json'});
            const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`erp_backup_${new Date().toISOString().slice(0,10)}.json`;document.body.appendChild(a);a.click();document.body.removeChild(a);
          }}><I.File/> Exportar Backup JSON</Btn>
          <label style={{display:"inline-flex",alignItems:"center",gap:6,padding:"9px 16px",borderRadius:10,background:"var(--prib)",color:"var(--pri)",fontSize:12,fontWeight:700,cursor:"pointer",border:"1.5px solid var(--pri)"}}>
            <I.Clip/> Importar Backup
            <input type="file" accept=".json" style={{display:"none"}} onChange={e=>{
              const file=e.target.files[0];if(!file)return;
              const reader=new FileReader();
              reader.onload=async ev=>{
                try{
                  const data=JSON.parse(ev.target.result);
                  if(!data.clientes&&!data.pedidos)return alert('Arquivo inválido');
                  if(!window.confirm('Substituir TODOS os dados atuais pelo backup? Essa ação não pode ser desfeita.'))return;
                  await importBackup(data);
                }catch{alert('Erro ao ler o arquivo de backup.');}
              };
              reader.readAsText(file);
            }}/>
          </label>
          {limparDuplicatas&&<Btn v="ghost" onClick={()=>{if(window.confirm('Remover entradas duplicadas do financeiro? Serão mantidas as versões com maior valor pago.'))limparDuplicatas();}} style={{color:"var(--rd)",border:"1px solid rgba(239,68,68,.2)",background:"var(--rdb)"}}><I.Trash/> Limpar Duplicatas</Btn>}
        </div>
      </div>
      <div style={{marginTop:16,padding:20,background:"var(--bg)",borderRadius:"var(--rl)",border:"1.5px solid var(--bd)"}}>
        <h3 style={{fontSize:18,fontWeight:800,color:"var(--tx)",marginBottom:4,textTransform:"uppercase",letterSpacing:".5px"}}>Atualizar App</h3>
        <p style={{fontSize:11,color:"var(--tx3)",fontWeight:600,marginBottom:12}}>Se o app instalado estiver com versão antiga ou configurações não aparecerem, force a atualização.</p>
        <Btn v="secondary" onClick={()=>{if('serviceWorker' in navigator){navigator.serviceWorker.getRegistrations().then(regs=>{regs.forEach(r=>r.unregister());window.location.reload();});}else{window.location.reload();}}}><I.Zap/> Forçar Atualização do App</Btn>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════ */
function ModalDetFin({f:fInit,financeiro,setModal,pagarParcela,editParcela,addParcela,delParcela,updFin,showToast,cats:catsProp}){
  const f=financeiro.find(x=>x.id===fInit.id)||fInit;
  const [editId,setEditId]=useState(null);
  const [editData,setEditData]=useState({});
  const [payId,setPayId]=useState(null);
  const [payVal,setPayVal]=useState("");
  const [payFormaPag,setPayFormaPag]=useState("pix");
  const [editMeta,setEditMeta]=useState(false);
  const [meta,setMeta]=useState({desc:f.desc,categoria:f.categoria||"Outros",fornecedor:f.fornecedor||"",valor:f.valor||0});
  const eCats=catsProp||getEmpresaCats();
  const cats=eCats[f.tipo]||eCats.pagar;
  const isCom=!!f.marcId;
  const pct=f.valor>0?Math.min(100,(f.valorPago/f.valor)*100):0;
  const inpST=(border)=>({display:"block",padding:"5px 8px",borderRadius:8,border:`1.5px solid ${border}`,background:"var(--sf)",color:"var(--tx)",fontSize:12,outline:"none"});
  return(<>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
      <div style={{flex:1}}>
        {editMeta?(
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            <input value={meta.desc} onChange={e=>setMeta(m=>({...m,desc:e.target.value}))} style={{padding:"6px 10px",borderRadius:8,border:"1.5px solid var(--pri)",background:"var(--sf)",color:"var(--tx)",fontSize:14,fontWeight:700,outline:"none",width:"100%"}}/>
            <div style={{display:"flex",gap:6}}>
              <select value={meta.categoria} onChange={e=>setMeta(m=>({...m,categoria:e.target.value}))} style={{flex:1,padding:"5px 8px",borderRadius:8,border:"1.5px solid var(--bd)",background:"var(--sf)",color:"var(--tx)",fontSize:12,fontWeight:600,outline:"none"}}>
                {cats.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
              <input value={meta.fornecedor} onChange={e=>setMeta(m=>({...m,fornecedor:e.target.value}))} placeholder="Fornecedor/Credor" style={{flex:1,padding:"5px 8px",borderRadius:8,border:"1.5px solid var(--bd)",background:"var(--sf)",color:"var(--tx)",fontSize:12,outline:"none"}}/>
            </div>
            <div style={{display:"flex",gap:6,alignItems:"center"}}>
              <label style={{fontSize:10,color:"var(--tx3)",whiteSpace:"nowrap"}}>Valor total R$</label>
              <input type="number" value={meta.valor} onChange={e=>setMeta(m=>({...m,valor:+e.target.value}))} step="0.01" min="0" style={{padding:"5px 8px",borderRadius:8,border:"1.5px solid var(--bd)",background:"var(--sf)",color:"var(--tx)",fontSize:12,fontWeight:700,outline:"none",width:130}}/>
            </div>
            <div style={{display:"flex",gap:5}}>
              <Btn small onClick={()=>{updFin(f.id,meta);setEditMeta(false);showToast("Conta atualizada!")}}><I.Check/> Salvar</Btn>
              <Btn v="ghost" small onClick={()=>setEditMeta(false)}>Cancelar</Btn>
            </div>
          </div>
        ):(
          <div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <h2 style={{fontSize:15,fontWeight:800,color:"var(--tx)"}}>{f.desc}</h2>
              <button onClick={()=>setEditMeta(true)} style={{background:"none",border:"none",color:"var(--tx3)",cursor:"pointer",padding:2}}><I.Edit/></button>
            </div>
            {(f.categoria||f.fornecedor)&&<div style={{fontSize:11,color:"var(--tx3)",marginTop:2,fontWeight:600}}>{[f.categoria,f.fornecedor].filter(Boolean).join(" • ")}</div>}
          </div>
        )}
      </div>
      {!editMeta&&isCom&&<Badge color="purple">Comissão Marceneiro</Badge>}
    </div>
    <div style={{display:"flex",gap:10,marginBottom:12}}>
      <div style={{flex:1,background:"var(--bg)",borderRadius:"var(--r)",padding:12,border:"1.5px solid var(--bd)",textAlign:"center"}}>
        <div style={{fontSize:9,fontWeight:800,textTransform:"uppercase",color:"var(--tx3)"}}>Total</div>
        <div style={{fontSize:18,fontWeight:800,color:"var(--tx)",marginTop:2}}>{R$(f.valor)}</div>
      </div>
      <div style={{flex:1,background:"var(--gnb)",borderRadius:"var(--r)",padding:12,textAlign:"center"}}>
        <div style={{fontSize:9,fontWeight:800,textTransform:"uppercase",color:"var(--tx3)"}}>Pago</div>
        <div style={{fontSize:18,fontWeight:800,color:"var(--gn)",marginTop:2}}>{R$(f.valorPago)}</div>
      </div>
      <div style={{flex:1,background:"var(--rdb)",borderRadius:"var(--r)",padding:12,textAlign:"center"}}>
        <div style={{fontSize:9,fontWeight:800,textTransform:"uppercase",color:"var(--tx3)"}}>Restante</div>
        <div style={{fontSize:18,fontWeight:800,color:"var(--rd)",marginTop:2}}>{R$(f.valor-f.valorPago)}</div>
      </div>
    </div>
    <div style={{background:"var(--bg)",borderRadius:6,height:8,marginBottom:16,overflow:"hidden"}}>
      <div style={{background:"var(--gn)",height:"100%",width:`${pct}%`,borderRadius:6,transition:"width .5s"}}/>
    </div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
      <h3 style={{fontSize:13,fontWeight:800}}>Parcelas</h3>
      <Btn v="ghost" small onClick={()=>addParcela(f.id)}><I.Plus/> Parcela</Btn>
    </div>
    {f.parcelas.map((p,i)=>(
      <div key={p.id} style={{background:"var(--bg)",borderRadius:"var(--r)",border:"1.5px solid var(--bd)",padding:"10px 12px",marginBottom:6}}>
        {editId===p.id?(
          <div style={{display:"flex",gap:8,alignItems:"flex-end",flexWrap:"wrap"}}>
            <div><label style={{fontSize:10,color:"var(--tx3)",display:"block",marginBottom:3}}>Parcela {i+1} — Valor R$</label>
              <input type="number" value={editData.valor} onChange={e=>setEditData(d=>({...d,valor:+e.target.value}))} step="0.01" style={{...inpST("var(--pri)"),width:130}}/>
            </div>
            <div><label style={{fontSize:10,color:"var(--tx3)",display:"block",marginBottom:3}}>Vencimento</label>
              <input type="date" value={editData.venc||""} onChange={e=>setEditData(d=>({...d,venc:e.target.value}))} style={{...inpST("var(--bd)")}}/>
            </div>
            <div><label style={{fontSize:10,color:"var(--tx3)",display:"block",marginBottom:3}}>Forma de Pagamento</label>
              <select value={editData.formaPag||""} onChange={e=>setEditData(d=>({...d,formaPag:e.target.value}))} style={{...inpST("var(--bd)"),width:150}}>
                <option value="">Não definido</option>
                {FORMAS.map(fm=><option key={fm.v} value={fm.v}>{fm.l}</option>)}
              </select>
            </div>
            <div style={{display:"flex",gap:4,paddingBottom:1}}>
              <Btn small onClick={()=>{editParcela(f.id,p.id,editData);setEditId(null);showToast("Parcela atualizada!")}}><I.Check/> Salvar</Btn>
              <Btn v="ghost" small onClick={()=>setEditId(null)}>Cancelar</Btn>
            </div>
          </div>
        ):payId===p.id?(
          <div style={{display:"flex",gap:8,alignItems:"flex-end",flexWrap:"wrap"}}>
            <div><label style={{fontSize:10,color:"var(--tx3)",display:"block",marginBottom:3}}>Parcela {i+1} — Valor R$</label>
              <input type="number" value={payVal} onChange={e=>setPayVal(e.target.value)} step="0.01" autoFocus style={{...inpST("var(--gn)"),width:130}}/>
            </div>
            <div><label style={{fontSize:10,color:"var(--tx3)",display:"block",marginBottom:3}}>Forma de Pagamento</label>
              <select value={payFormaPag} onChange={e=>setPayFormaPag(e.target.value)} style={{...inpST("var(--bd)"),width:150}}>
                <option value="">Não definido</option>
                {FORMAS.map(fm=><option key={fm.v} value={fm.v}>{fm.l}</option>)}
              </select>
            </div>
            <div style={{display:"flex",gap:4,paddingBottom:1}}>
              <Btn small v="success" onClick={()=>{pagarParcela(f.id,p.id,+payVal||p.valor,payFormaPag);setPayId(null);showToast("Pagamento registrado!")}}><I.Check/> Confirmar</Btn>
              <Btn v="ghost" small onClick={()=>setPayId(null)}>Cancelar</Btn>
            </div>
          </div>
        ):(
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:6}}>
            <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
              <span style={{fontWeight:700,fontSize:12,color:"var(--tx)"}}>Parcela {i+1}</span>
              <span style={{fontWeight:800,fontSize:13,color:p.pago?"var(--gn)":"var(--tx)"}}>{R$(p.valor)}</span>
              {p.venc&&<span style={{color:"var(--tx3)",fontSize:10}}>Venc: {p.venc}</span>}
              {p.formaPag&&!p.pago&&<Badge color={FORMA_CLR[p.formaPag]||"pri"}>{FORMAS_LAB[p.formaPag]||p.formaPag}</Badge>}
            </div>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              {p.pago
                ?<><Badge color="green">✓ {p.dataPago}</Badge>{p.formaPag&&<Badge color={FORMA_CLR[p.formaPag]||"pri"}>{FORMAS_LAB[p.formaPag]||p.formaPag}</Badge>}<button onClick={()=>{editParcela(f.id,p.id,{pago:false,dataPago:"",formaPag:p.formaPag||""});showToast("Estornado!")}} style={{background:"none",border:"none",color:"var(--tx3)",cursor:"pointer",fontSize:10,padding:4}}>↩</button></>
                :<><button onClick={()=>{setEditId(p.id);setEditData({valor:p.valor,venc:p.venc||"",formaPag:p.formaPag||""});setPayId(null)}} style={{background:"none",border:"none",color:"var(--tx3)",cursor:"pointer",padding:4}}><I.Edit/></button>
                  <Btn v="success" small onClick={()=>{setPayId(p.id);setPayVal(String(p.valor));setPayFormaPag(p.formaPag||"pix");setEditId(null)}}>$ Baixar</Btn>
                  <button onClick={()=>delParcela(f.id,p.id)} style={{background:"none",border:"none",color:"var(--rd)",cursor:"pointer",padding:4}}><I.Trash/></button>
                </>
              }
            </div>
          </div>
        )}
      </div>
    ))}
    {f.parcelas.length===0&&<div style={{padding:14,textAlign:"center",color:"var(--tx3)",fontSize:12}}>Nenhuma parcela. Clique em "+ Parcela" para adicionar.</div>}
    <div style={{textAlign:"right",marginTop:14}}><Btn v="ghost" onClick={()=>setModal(null)}>Fechar</Btn></div>
  </>);
}

const PDF_TEMAS={
  classico: {dark:"#2b2b2b",acc:"#b8860b",accLight:"#fdf6e3",nome:"Clássico"},
  executivo:{dark:"#1a2f4e",acc:"#3b7dd8",accLight:"#eef4fb",nome:"Executivo"},
  natural:  {dark:"#2d4a3e",acc:"#c47c3e",accLight:"#fdf0e6",nome:"Natural"},
};
const PDF_LAYOUTS={
  tradicional:{nome:"Tradicional"},
  moderno:    {nome:"Moderno"},
  minimalista:{nome:"Minimalista"},
};

function ModalPDF({o,empresa,getCli,setModal,totalOrcFinal,totalOrc,totalOrcComNF,defaultTab}){
  const [tab,setTab]=useState(defaultTab||"proposta");
  const [semTotal,setSemTotal]=useState(false);
  const c=getCli(o.clienteId);
  const vtBase=totalOrcFinal(o);
  const vtCliente=totalOrcComNF?totalOrcComNF(o):vtBase;
  const vtB=totalOrc(o);const desc=o.desconto||0;const descR=o.descontoR||0;
  const zoneRef=useRef(null);
  const fmtR=v=>"R$ "+(v||0).toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2});
  const validadeTxt=o.validade||(()=>{const m=(o.pagamento||"").match(/validade[:\s]+([^\n.]+)/i);return m?m[1].trim():"30 dias";})();
  const prazoTxt=o.prazoEntrega||empresa.prazoExecucao||"A combinar";
  const tema=PDF_TEMAS[empresa.pdfTema]||PDF_TEMAS.classico;
  const layout=empresa.pdfLayout||"tradicional";
  const D=tema.dark, A=tema.acc, AL=tema.accLight;
  // CSS base compartilhado entre layouts — parameterizado por tema
  const cssBase=`
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Calibri','Trebuchet MS','Segoe UI',Arial,sans-serif;background:#fff;color:#1a1a1a;font-size:13pt;line-height:1.6}
    .doc{max-width:800px;margin:0 auto;background:#fff}
    /* serviços (comum) */
    .svc-table{width:100%;border-collapse:collapse}
    .svc-table thead tr{border-bottom:2px solid ${D}}
    .svc-table thead th{font-size:10pt;font-weight:800;text-transform:uppercase;letter-spacing:1.2px;color:#888;padding:9px 8px 9px 0;text-align:left}
    .svc-table thead th.r{text-align:right;padding-right:0}
    .svc-table tbody tr{border-bottom:1px solid #eeeeee;page-break-inside:avoid;break-inside:avoid}
    .svc-table tbody tr:last-child{border-bottom:none}
    .td-desc{padding:12px 8px 6px 0;vertical-align:top}
    .td-desc strong{font-size:13pt;font-weight:800;color:#111;display:block;margin-bottom:3px}
    .td-desc p{font-size:12.5pt;color:#555;white-space:pre-line;line-height:1.6;margin:0}
    .td-val{font-size:13pt;font-weight:800;color:#111;text-align:right;padding:12px 0;vertical-align:top;white-space:nowrap}
    /* condições */
    .cond-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:0;border:1px solid #e2e2e2;margin-top:18px;break-inside:avoid;page-break-inside:avoid}
    .cond-card{padding:14px 16px;border-right:1px solid #e2e2e2;break-inside:avoid;page-break-inside:avoid}
    .cond-card:last-child{border-right:none}
    .cond-title{font-size:13pt;font-weight:800;text-transform:uppercase;letter-spacing:1.2px;color:${A};margin-bottom:9px}
    .cond-body{font-size:12.5pt;color:#333;white-space:pre-line;line-height:1.7;word-break:keep-all;overflow-wrap:break-word}
    /* assinatura */
    .sign-wrap{margin-top:40px;padding-top:20px;border-top:1px solid #e2e8f0}
    .sign-city{font-size:9.5pt;font-weight:600;color:#334155;text-align:center;margin-bottom:32px}
    .sign-area{display:flex;justify-content:space-around;align-items:flex-end;break-inside:avoid;page-break-inside:avoid;gap:60px}
    .sign-block{flex:1;text-align:center;break-inside:avoid;page-break-inside:avoid;max-width:240px}
    .sign-stamp{height:80px;display:flex;align-items:center;justify-content:center;margin-bottom:0}
    .sign-stamp img{height:70px;width:auto;max-width:160px;object-fit:contain;display:block;margin:0 auto}
    .sign-space{height:72px}
    .sign-line{border-top:1.5px solid #1e293b;padding-top:7px;margin-top:0}
    .sign-name{font-size:10.5pt;font-weight:800;color:#1e293b;letter-spacing:.2px}
    .sign-name2{font-size:9pt;font-weight:400;color:#475569;margin-top:2px}
    .sign-doc{font-size:8pt;color:#64748b;margin-top:2px}
    .sign-role{font-size:7.5pt;color:#94a3b8;margin-top:3px;font-weight:700;text-transform:uppercase;letter-spacing:.8px}
    /* footer */
    .footer{text-align:center;font-size:9pt;color:#bbb;padding:14px 0 4px;border-top:1px solid #ebebeb;margin-top:24px;break-inside:avoid;page-break-inside:avoid}
    /* blocos gerais — nunca quebrar internamente */
    .cli-endereco{font-size:10pt;color:#555;margin-top:4px}
    .hdr,.orc-banner,.cli-row,.info-grid,.info-cell,.sec-title,.total-row,.sign-wrap,.footer-wrap{break-inside:avoid;page-break-inside:avoid}
    @page{size:A4;margin:12mm 10mm}
    @media print{body{padding:0}.doc{max-width:100%}}
  `;

  // CSS específico por layout
  const cssLayouts={
    tradicional:`
      .hdr{padding:24px 36px 20px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #d0d0d0}
      .logo-col{flex:0 0 62%;display:flex;align-items:center}
      .hdr-logo{max-height:190px;max-width:380px;object-fit:contain}
      .hdr-info-col{flex:0 0 38%;text-align:right}
      .hdr-nome{font-size:19pt;font-weight:800;color:#111;margin-bottom:3px;line-height:1.2}
      .hdr-sub{font-size:11pt;color:#888;font-style:italic;margin-bottom:5px}
      .hdr-info{font-size:10pt;color:#555;line-height:1.8}
      .hdr-date{font-size:11pt;font-weight:700;color:#111;margin-top:6px}
      .orc-banner{background:${D};padding:13px 36px;display:flex;align-items:baseline;gap:14px}
      .orc-num{font-size:19pt;font-weight:700;color:#fff}
      .orc-ref{font-size:11pt;color:#aaa}
      .orc-badge{margin-left:auto;background:${A};color:#fff;font-size:9pt;font-weight:700;padding:3px 12px;letter-spacing:1px;text-transform:uppercase}
      .cli-row{padding:11px 36px;border-bottom:1px solid #e8e8e8}
      .cli-lbl{font-size:9pt;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#999;margin-bottom:2px}
      .cli-nome{font-size:16pt;font-weight:700;color:#111}
      .cli-meta{font-size:11pt;color:#666;margin-top:3px}
      .sec-title{font-size:14pt;font-weight:700;color:${A};margin:18px 36px 10px}
      .info-grid{display:grid;grid-template-columns:1fr 1fr;margin:0 36px;border:1px solid #e2e2e2}
      .info-cell{padding:10px 16px;border-right:1px solid #e2e2e2}
      .info-cell:last-child{border-right:none}
      .info-lbl{font-size:9pt;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:3px}
      .info-val{font-size:13pt;font-weight:600;color:#222}
      .svc-wrap{margin:0 36px}
      .total-row{background:${D};display:flex;justify-content:space-between;align-items:center;padding:14px 36px;margin-top:2px}
      .total-lbl{font-size:12pt;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:1px}
      .total-right{text-align:right}
      .total-val{font-size:22pt;font-weight:700;color:#fff}
      .total-old{font-size:10pt;color:#aaa;text-decoration:line-through;margin-bottom:2px}
      .total-sub{font-size:9pt;color:#ccc;margin-top:2px}
      .cond-wrap{margin:0 36px}
      .sign-wrap{margin:40px 36px 0}
      .footer-wrap{margin:0 36px}
    `,
    moderno:`
      .hdr{border-top:5px solid ${A};padding:24px 36px 20px;display:flex;justify-content:space-between;align-items:center}
      .logo-col{flex:0 0 62%;display:flex;align-items:center}
      .hdr-logo{max-height:190px;max-width:380px;object-fit:contain}
      .hdr-info-col{flex:0 0 38%;text-align:right}
      .hdr-nome{font-size:19pt;font-weight:800;color:${D};margin-bottom:4px;line-height:1.15}
      .hdr-sub{font-size:11pt;color:${A};font-weight:600;margin-bottom:6px}
      .hdr-info{font-size:10pt;color:#555;line-height:1.8}
      .hdr-date{font-size:11pt;font-weight:700;color:${D};margin-top:6px}
      .orc-banner{background:${AL};border-left:5px solid ${A};padding:12px 36px;display:flex;align-items:baseline;gap:14px;margin-top:1px}
      .orc-num{font-size:18pt;font-weight:700;color:${D}}
      .orc-ref{font-size:11pt;color:#888}
      .orc-badge{margin-left:auto;background:${A};color:#fff;font-size:9pt;font-weight:700;padding:3px 12px;letter-spacing:1px;text-transform:uppercase}
      .cli-row{padding:11px 36px;border-top:1px solid #e2e2e2;border-bottom:1px solid #e2e2e2;background:#fafafa}
      .cli-lbl{font-size:9pt;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#999;margin-bottom:2px}
      .cli-nome{font-size:16pt;font-weight:700;color:#111}
      .cli-meta{font-size:11pt;color:#666;margin-top:3px}
      .sec-title{font-size:13pt;font-weight:700;color:${D};margin:16px 36px 10px;padding-left:10px;border-left:4px solid ${A};text-transform:uppercase;letter-spacing:.5px}
      .info-grid{display:grid;grid-template-columns:1fr 1fr;margin:0 36px;border:1px solid #e2e2e2;background:#fafafa}
      .info-cell{padding:10px 16px;border-right:1px solid #e2e2e2}
      .info-cell:last-child{border-right:none}
      .info-lbl{font-size:9pt;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:3px}
      .info-val{font-size:13pt;font-weight:600;color:#222}
      .svc-wrap{margin:0 36px}
      .svc-table tbody tr:nth-child(even){background:#f9f9f9}
      .total-row{background:${A};display:flex;justify-content:space-between;align-items:center;padding:14px 36px;margin-top:2px}
      .total-lbl{font-size:12pt;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:1px}
      .total-right{text-align:right}
      .total-val{font-size:22pt;font-weight:700;color:#fff}
      .total-old{font-size:10pt;color:rgba(255,255,255,.6);text-decoration:line-through;margin-bottom:2px}
      .total-sub{font-size:9pt;color:rgba(255,255,255,.75);margin-top:2px}
      .cond-wrap{margin:0 36px}
      .sign-wrap{margin:40px 36px 0}
      .footer-wrap{margin:0 36px}
    `,
    minimalista:`
      .hdr{padding:20px 36px 16px;display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid ${D}}
      .logo-col{flex:0 0 62%;display:flex;align-items:center}
      .hdr-logo{max-height:190px;max-width:380px;object-fit:contain}
      .hdr-info-col{flex:0 0 38%;text-align:right}
      .hdr-nome{font-size:18pt;font-weight:800;color:#111;margin-bottom:2px}
      .hdr-sub{font-size:11pt;color:#888;margin-bottom:4px}
      .hdr-info{font-size:10pt;color:#666;line-height:1.8}
      .hdr-date{font-size:11pt;font-weight:700;color:#111;margin-top:5px}
      .orc-banner{padding:10px 36px;display:flex;align-items:baseline;gap:12px;border-bottom:1px solid #e0e0e0;background:#fff}
      .orc-num{font-size:17pt;font-weight:700;color:${D}}
      .orc-ref{font-size:11pt;color:#999}
      .orc-badge{margin-left:auto;border:1px solid ${D};color:${D};font-size:9pt;font-weight:700;padding:2px 10px;letter-spacing:1px;text-transform:uppercase}
      .cli-row{padding:10px 36px;border-bottom:1px solid #ebebeb}
      .cli-lbl{font-size:9pt;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#bbb;margin-bottom:2px}
      .cli-nome{font-size:16pt;font-weight:700;color:#111}
      .cli-meta{font-size:11pt;color:#888;margin-top:2px}
      .sec-title{font-size:10pt;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#aaa;margin:16px 36px 8px;display:flex;align-items:center;gap:10px}
      .sec-title::after{content:'';flex:1;height:1px;background:#e8e8e8}
      .info-grid{display:grid;grid-template-columns:1fr 1fr;margin:0 36px}
      .info-cell{padding:8px 0 8px 16px;border-left:2px solid ${A}}
      .info-cell:first-child{margin-right:24px}
      .info-lbl{font-size:9pt;font-weight:700;color:#aaa;text-transform:uppercase;letter-spacing:1px;margin-bottom:3px}
      .info-val{font-size:13pt;font-weight:600;color:#333}
      .svc-wrap{margin:0 36px}
      .total-row{border-top:2px solid ${D};padding:12px 0;margin:2px 36px 0;display:flex;justify-content:space-between;align-items:baseline}
      .total-lbl{font-size:11pt;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#888}
      .total-right{text-align:right}
      .total-val{font-size:22pt;font-weight:700;color:${D}}
      .total-old{font-size:10pt;color:#ccc;text-decoration:line-through;margin-bottom:2px}
      .total-sub{font-size:9pt;color:#aaa;margin-top:2px}
      .cond-wrap{margin:0 36px}
      .sign-wrap{margin:40px 36px 0}
      .footer-wrap{margin:0 36px}
    `,
  };

  const printCSS=cssBase+(cssLayouts[layout]||cssLayouts.tradicional);
  const [downloading,setDownloading]=useState(false);
  const downloadPDF=async()=>{
    setDownloading(true);
    try{
      const el=zoneRef.current;
      const prevMax=el.style.maxHeight,prevOv=el.style.overflowY,prevW=el.style.width,prevMinW=el.style.minWidth;
      el.style.maxHeight='none';el.style.overflowY='visible';
      el.style.width='800px';el.style.minWidth='800px';
      await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
      const elRect=el.getBoundingClientRect();
      const mkBounds=sel=>Array.from(el.querySelectorAll(sel)).map(row=>{
        const r=row.getBoundingClientRect();
        return{topPx:Math.round((r.top-elRect.top)*2),botPx:Math.round((r.bottom-elRect.top)*2)};
      }).sort((a,b)=>a.topPx-b.topPx);
      const rowBounds=mkBounds('.svc-table tbody tr,.cond-card,.sign-block,.total-row,.hdr,.orc-banner,.cli-row,.footer-wrap,.sec-title,.svc-table thead');
      const canvas=await html2canvas(el,{scale:2,useCORS:true,backgroundColor:'#fff',logging:false,scrollY:-window.scrollY,windowWidth:800});
      el.style.maxHeight=prevMax;el.style.overflowY=prevOv;el.style.width=prevW;el.style.minWidth=prevMinW;
      const pdf=new jsPDF({orientation:'p',unit:'mm',format:'a4'});
      const pw=pdf.internal.pageSize.getWidth(),ph=pdf.internal.pageSize.getHeight();
      const mx=8,my=8,cW=pw-mx*2,cH=ph-my*2;
      const pxPerMm=canvas.width/cW,pageHpx=cH*pxPerMm;
      let pageStart=0,pageNum=0;
      while(pageStart<canvas.height){
        let pageEnd=Math.min(pageStart+pageHpx,canvas.height);
        if(pageEnd<canvas.height){
          let safeEnd=pageEnd;
          // 1) Não cortar dentro de blocos — mas só recua se o bloco está na metade inferior
          //    da página (topPx > 40% da altura). Blocos grandes que começam cedo são cortados.
          for(const rb of rowBounds){
            if(rb.topPx<safeEnd&&rb.botPx>safeEnd&&rb.topPx>pageStart+pageHpx*0.4) safeEnd=rb.topPx;
          }
          // 2) Bloco maior que página: avança ao fim do bloco
          if(safeEnd<=pageStart){
            const big=rowBounds.find(rb=>rb.topPx<=pageStart+10&&rb.botPx>pageStart);
            safeEnd=big?big.botPx:pageEnd;
          }
          if(safeEnd<=pageStart) safeEnd=pageEnd;
          pageEnd=safeEnd;
        }
        const cropH=Math.round(pageEnd-pageStart);
        if(cropH<=0){pageStart=Math.round(pageEnd)+1;continue;}
        if(pageNum>0)pdf.addPage();
        const off=document.createElement('canvas');
        off.width=canvas.width;off.height=cropH;
        off.getContext('2d').drawImage(canvas,0,pageStart,canvas.width,cropH,0,0,canvas.width,cropH);
        pdf.addImage(off.toDataURL('image/jpeg',0.93),'JPEG',mx,my,cW,cropH/pxPerMm);
        pageStart=Math.round(pageEnd);pageNum++;
      }
      pdf.save(`${isOS?'OS':'ORC'}_${o.num}_${c?.nome||'cliente'}.pdf`.replace(/\s+/g,'_'));
    }catch(err){
      console.error('[PDF] Erro ao gerar PDF:',err);
      alert('Erro ao gerar PDF: '+(err?.message||String(err)));
    }finally{setDownloading(false);}
  };
  const isOS=tab==="os";
  const cidade=(empresa.endereco||"").split(/[-,]/).pop()?.trim().replace(/\s*\/.*$/,"").trim()||"";

  // JSX compartilhado para corpo do documento (serviços, total, condições)
  const DocBody=()=><>
    <div className="svc-wrap">
      <table className="svc-table">
        <thead><tr><th>Descrição</th><th className="r" style={{width:120}}>Valor</th></tr></thead>
        <tbody>
          {[...o.ambientes].sort((a,b)=>(a.desc||'').length-(b.desc||'').length).map((a,i)=>(
            <tr key={a.id}>
              <td className="td-desc"><strong>{a.nome||`Serviço ${i+1}`}</strong>{a.desc&&<p>{a.desc}</p>}</td>
              <td className="td-val">{fmtR(a.valorTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    {!semTotal&&<div className="total-row">
      <div className="total-lbl">Total</div>
      <div className="total-right">
        {(desc>0||descR>0)&&<div className="total-old">{fmtR(vtB)}</div>}
        <div className="total-val">{fmtR(vtCliente)}</div>
        {(desc>0||descR>0)&&<div className="total-sub">{[descR>0&&`Desconto de ${fmtR(descR)}`,desc>0&&`${desc}% aplicado`].filter(Boolean).join(" + ")}</div>}
      </div>
    </div>}
    <div className="cond-wrap">
      <div className="cond-grid">
        {o.especificacoes&&<div className="cond-card"><div className="cond-title">Especificações</div><div className="cond-body">{o.especificacoes}</div></div>}
        <div className="cond-card"><div className="cond-title">Garantia</div><div className="cond-body">{o.garantia}</div></div>
        <div className="cond-card"><div className="cond-title">Pagamento</div><div className="cond-body">{o.pagamento}</div></div>
      </div>
    </div>
    {/* Assinatura APENAS na OS */}
    {isOS&&<div className="sign-wrap">
      <div className="sign-city">{cidade||""}</div>
      <div className="sign-area">
        <div className="sign-block">
          <div className="sign-stamp">
            {empresa.logo&&<img src={empresa.logo} alt="" style={{height:70,width:"auto",maxWidth:160,objectFit:"contain",display:"block",margin:"0 auto"}}/>}
          </div>
          <div className="sign-line"/>
          <div className="sign-name">{empresa.nome}</div>
          {empresa.cnpj&&<div className="sign-doc">CNPJ: {empresa.cnpj}</div>}
          <div className="sign-role">Contratada — Responsável Técnico</div>
        </div>
        <div className="sign-block">
          <div className="sign-space"/>
          <div className="sign-line"/>
          <div className="sign-name">{c?.nome||"Cliente"}</div>
          {c?.doc&&<div className="sign-doc">CPF/CNPJ: {c.doc}</div>}
          <div className="sign-role">Contratante</div>
        </div>
      </div>
    </div>}
    <div className="footer-wrap"><div className="footer">{empresa.nome}{empresa.cnpj?" · CNPJ "+empresa.cnpj:""}</div></div>
  </>;

  const LogoEl=()=>empresa.logo
    ?<img src={empresa.logo} className="hdr-logo" alt="logo"/>
    :<div style={{width:220,height:100,background:D,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:800,color:"#fff",borderRadius:4}}>LOGO</div>;

  const HdrCompany=()=><div className="hdr-info-col">
    <div className="hdr-nome">{empresa.nome||"Marcenaria"}</div>
    {empresa.tagline&&<div className="hdr-sub">{empresa.tagline}</div>}
    {empresa.cnpj&&<div className="hdr-info">CNPJ: {empresa.cnpj}</div>}
    {empresa.endereco&&<div className="hdr-info">{empresa.endereco}</div>}
    {(empresa.telefone||empresa.email)&&<div className="hdr-info">{[empresa.telefone&&`✆ ${empresa.telefone}`,empresa.email&&`✉ ${empresa.email}`].filter(Boolean).join("  •  ")}</div>}
    {empresa.instagram&&<div className="hdr-info">@{empresa.instagram}</div>}
    <div className="hdr-date">{o.data}</div>
  </div>;

  const OrcBanner=()=><div className="orc-banner">
    <div className="orc-num">{isOS?"Ordem de Serviço":"Orçamento"} {o.num}</div>
    {!isOS&&c?.endereco&&<div className="orc-ref">{c.endereco.split(",")[0]}</div>}
    {isOS&&<div className="orc-badge">Em Produção</div>}
  </div>;

  const CliRow=()=><div className="cli-row">
    <div className="cli-lbl">Cliente</div>
    <div className="cli-nome">{c?.nome||"—"}</div>
    <div className="cli-meta">
      {c?.tel&&<span style={{marginRight:16}}>✆ {c.tel}</span>}
      {c?.email&&<span style={{marginRight:16}}>✉ {c.email}</span>}
      {c?.doc&&<span>CPF/CNPJ: {c.doc}</span>}
    </div>
    {isOS&&c?.endereco&&<div className="cli-endereco">{c.endereco}</div>}
  </div>;

  const InfoGrid=()=><>
    <div className="sec-title">Informações básicas</div>
    <div className="info-grid">
      {!isOS&&<div className="info-cell"><div className="info-lbl">Validade do orçamento</div><div className="info-val">{validadeTxt}</div></div>}
      <div className="info-cell"><div className="info-lbl">Prazo de execução</div><div className="info-val">{prazoTxt}</div></div>
    </div>
    <div className="sec-title">Serviços</div>
  </>;

  return(<>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
      <div style={{display:"flex",gap:6}}>
        {["proposta","os"].map(t=><button key={t} onClick={()=>setTab(t)} style={{padding:"6px 16px",borderRadius:20,border:"1.5px solid "+(tab===t?"var(--pri)":"var(--bd)"),background:tab===t?"var(--prib)":"transparent",color:tab===t?"var(--pri)":"var(--tx3)",fontSize:11,fontWeight:700,cursor:"pointer"}}>{t==="proposta"?"📄 Proposta Comercial":"📋 Ordem de Serviço"}</button>)}
      </div>
      <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
        <button onClick={()=>setSemTotal(v=>!v)} style={{padding:"5px 12px",borderRadius:20,border:`1.5px solid ${semTotal?"var(--am)":"var(--bd)"}`,background:semTotal?"rgba(245,158,11,.12)":"transparent",color:semTotal?"#d97706":"var(--tx3)",fontSize:11,fontWeight:700,cursor:"pointer"}}>
          {semTotal?"✓ Sem Total":"Sem Total"}
        </button>
        <span style={{fontSize:10,color:"var(--tx3)",fontWeight:700}}>Tema:</span>
        {Object.entries(PDF_TEMAS).map(([k,t])=><span key={k} title={t.nome} onClick={()=>{}} style={{width:16,height:16,borderRadius:"50%",background:t.dark,display:"inline-block",cursor:"default",border:empresa.pdfTema===k?"2px solid var(--tx)":"2px solid transparent",opacity:empresa.pdfTema===k?1:.5}}/>)}
        <Btn small onClick={downloadPDF} disabled={downloading}>{downloading?"⏳ Gerando...":"⬇ Baixar PDF"}</Btn>
        <Btn v="ghost" small onClick={()=>setModal(null)}><I.X/></Btn>
      </div>
    </div>
    <div ref={zoneRef} style={{background:"#fff",borderRadius:8,overflow:"hidden",fontSize:11,lineHeight:1.6,maxHeight:"74vh",overflowY:"auto",border:"1.5px solid var(--bd)",boxShadow:"var(--sh2)"}}>
      <style>{printCSS}</style>

      {/* ── LAYOUT TRADICIONAL ── */}
      {layout==="tradicional"&&<>
        <div className="hdr">
          <div className="logo-col"><LogoEl/></div>
          <HdrCompany/>
        </div>
        <OrcBanner/><CliRow/><InfoGrid/><DocBody/>
      </>}

      {/* ── LAYOUT MODERNO ── */}
      {layout==="moderno"&&<>
        <div className="hdr">
          <div className="logo-col"><LogoEl/></div>
          <HdrCompany/>
        </div>
        <OrcBanner/><CliRow/><InfoGrid/><DocBody/>
      </>}

      {/* ── LAYOUT MINIMALISTA ── */}
      {layout==="minimalista"&&<>
        <div className="hdr">
          <div className="logo-col"><LogoEl/></div>
          <HdrCompany/>
        </div>
        <OrcBanner/><CliRow/><InfoGrid/><DocBody/>
      </>}
    </div>
  </>);
}

const FORMAS=[{v:"pix",l:"PIX"},{v:"cartao_cred",l:"Cartão Crédito"},{v:"cred_10x",l:"Crédito 10x"},{v:"cred_12x",l:"Crédito 12x"},{v:"cred_18x",l:"Crédito 18x"},{v:"cartao_deb",l:"Cartão Débito"},{v:"dinheiro",l:"Dinheiro"},{v:"boleto",l:"Boleto"},{v:"transferencia",l:"Transferência"}];
const FORMAS_LAB=Object.fromEntries(FORMAS.map(f=>[f.v,f.l]));
const FORMA_CLR={pix:"blue",cartao_cred:"purple",cred_10x:"purple",cred_12x:"purple",cred_18x:"purple",cartao_deb:"pri",dinheiro:"green",boleto:"amber",transferencia:"blue"};

/* ═══════════════════════════════════════════
   PWA INSTALL PROMPT
   ═══════════════════════════════════════════ */
function InstallPrompt(){
  const [prompt,setPrompt]=useState(null);
  const [dismissed,setDismissed]=useState(false);
  useEffect(()=>{
    const h=e=>{e.preventDefault();setPrompt(e);};
    window.addEventListener('beforeinstallprompt',h);
    return()=>window.removeEventListener('beforeinstallprompt',h);
  },[]);
  if(!prompt||dismissed)return null;
  return(
    <div style={{position:"fixed",bottom:24,left:16,right:16,background:"linear-gradient(135deg,#6366f1,#8b5cf6)",borderRadius:18,padding:"14px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:"0 8px 32px rgba(99,102,241,.45)",zIndex:9998,animation:"scaleIn .3s"}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontSize:26}}>📲</span>
        <div>
          <div style={{color:"#fff",fontWeight:800,fontSize:13}}>Instalar app</div>
          <div style={{color:"rgba(255,255,255,.75)",fontSize:11}}>Acesse direto da tela inicial</div>
        </div>
      </div>
      <div style={{display:"flex",gap:8}}>
        <button onClick={()=>setDismissed(true)} style={{background:"rgba(255,255,255,.15)",border:"none",borderRadius:10,padding:"8px 12px",color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer"}}>Depois</button>
        <button onClick={()=>{prompt.prompt();setPrompt(null);}} style={{background:"#fff",border:"none",borderRadius:10,padding:"8px 16px",color:"#6366f1",fontSize:12,fontWeight:800,cursor:"pointer"}}>Instalar</button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   GUILLOTINE CUTTING ALGORITHM
   ═══════════════════════════════════════════ */
function packSheets(pecasIn,cW,cH){
  const TRIM=4,GAP=2,usW=cW-TRIM*2,usH=cH-TRIM*2;
  const sorted=[...pecasIn].sort((a,b)=>b.w*b.h-a.w*a.h);
  const sheets=[];let curPieces=[];let freeRects=[{x:TRIM,y:TRIM,w:usW,h:usH}];
  const startSheet=()=>{if(curPieces.length>0){sheets.push({pieces:curPieces});curPieces=[];}freeRects=[{x:TRIM,y:TRIM,w:usW,h:usH}];};
  const tryPlace=(piece)=>{
    let best=null,bestS=Infinity,rot=false;
    for(const r of freeRects){
      if(piece.w+GAP<=r.w&&piece.h+GAP<=r.h){const s=r.w*r.h;if(s<bestS){bestS=s;best=r;rot=false;}}
      if(piece.fio==='N'&&piece.h+GAP<=r.w&&piece.w+GAP<=r.h){const s=r.w*r.h;if(s<bestS){bestS=s;best=r;rot=true;}}
    }
    if(!best)return false;
    const pw=rot?piece.h:piece.w,ph=rot?piece.w:piece.h;
    curPieces.push({...piece,x:best.x,y:best.y,w:pw,h:ph,rotated:rot});
    const idx=freeRects.indexOf(best);freeRects.splice(idx,1);
    if(best.w-pw-GAP>8)freeRects.push({x:best.x+pw+GAP,y:best.y,w:best.w-pw-GAP,h:ph});
    if(best.h-ph-GAP>8)freeRects.push({x:best.x,y:best.y+ph+GAP,w:best.w,h:best.h-ph-GAP});
    return true;
  };
  startSheet();
  for(const p of sorted){
    if(!tryPlace(p)){sheets.push({pieces:curPieces});curPieces=[];freeRects=[{x:TRIM,y:TRIM,w:usW,h:usH}];tryPlace(p);}
  }
  if(curPieces.length>0)sheets.push({pieces:curPieces});
  const totArea=usW*usH;
  sheets.forEach(s=>{const used=s.pieces.reduce((a,p)=>a+p.w*p.h,0);s.aprov=Math.round(used/totArea*100);});
  return sheets;
}

function CanvasCorte({sheet,cW,cH}){
  const ref=useRef();
  useEffect(()=>{
    const cv=ref.current;if(!cv)return;
    const ctx=cv.getContext('2d');
    const maxW=340;const sc=maxW/cW;
    cv.width=Math.round(cW*sc);cv.height=Math.round(cH*sc);
    ctx.fillStyle='#e8e8e8';ctx.fillRect(0,0,cv.width,cv.height);
    ctx.strokeStyle='#999';ctx.lineWidth=1;ctx.strokeRect(0,0,cv.width,cv.height);
    const COLS=['#6366f1','#8b5cf6','#ec4899','#14b8a6','#f59e0b','#ef4444','#3b82f6','#10b981','#f97316','#06b6d4','#84cc16','#a855f7'];
    const FTC={'0.5':'#fbbf24','1':'#f59e0b','2':'#d97706','3':'#b45309'};
    sheet.pieces.forEach((p,i)=>{
      const cl=COLS[i%COLS.length];
      const x=p.x*sc,y=p.y*sc,w=p.w*sc,h=p.h*sc;
      ctx.fillStyle=cl+'55';ctx.fillRect(x,y,w,h);
      ctx.strokeStyle=cl;ctx.lineWidth=1.5;ctx.strokeRect(x,y,w,h);
      const fw=Math.max(3,Math.min(5,w*0.05));
      const fit=p.fitamento||{};
      const sides=[['topo',x,y,w,fw],['base',x,y+h-fw,w,fw],['esq',x,y,fw,h],['dir',x+w-fw,y,fw,h]];
      sides.forEach(([k,sx,sy,sw,sh])=>{const t=fit[k]?.tipo;if(t&&t!=='N'){ctx.fillStyle=FTC[t]||'#fbbf24';ctx.fillRect(sx,sy,sw,sh);}});
      if(w>24&&h>14){
        ctx.fillStyle='#111';ctx.font=`bold ${Math.max(7,Math.min(10,w/7))}px Arial`;ctx.textAlign='center';ctx.textBaseline='middle';
        ctx.fillText(p.nome.length>10?p.nome.slice(0,10)+'\u2026':p.nome,x+w/2,y+h/2-5);
        ctx.font=`${Math.max(6,Math.min(8,w/9))}px Arial`;ctx.fillStyle='#444';
        ctx.fillText(`${p.w}\xd7${p.h}`,x+w/2,y+h/2+6);
      }
    });
    const barH=18;ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(0,cv.height-barH,cv.width,barH);
    ctx.fillStyle='#fff';ctx.font='bold 9px Arial';ctx.textAlign='left';ctx.textBaseline='middle';
    ctx.fillText(` \u2713 ${sheet.aprov}% aproveitamento  |  ${sheet.pieces.length} pe\xe7as`,2,cv.height-barH/2);
  },[sheet,cW,cH]);
  return <canvas ref={ref} style={{width:'100%',height:'auto',borderRadius:6,border:'1px solid var(--bd)',display:'block'}}/>;
}

/* ═══════════════════════════════════════════
   MARCENEIRO APP — TELA MOBILE
   ═══════════════════════════════════════════ */
function MarceneiroApp({user,pedidos,setPedidos,clientes,financeiro,showToast,onRefresh,onLogout,ordensCort,setOrdensCort,cortadores}){
  const [nav,setNav]=useState("pedidos");
  const [filtro,setFiltro]=useState("andamento");
  const [expandId,setExpandId]=useState(null);
  const [instPid,setInstPid]=useState(null);
  const [instData,setInstData]=useState("");
  const [instDias,setInstDias]=useState("");
  const [refreshing,setRefreshing]=useState(false);
  const doRefresh=async()=>{setRefreshing(true);await onRefresh?.();setRefreshing(false);showToast("Atualizado!");};
  const meusP=pedidos.filter(p=>(p.marcId===user.id||p.ambs?.some(a=>a.marcId===user.id))&&p.status!=="cancelado");
  const getCli=id=>clientes.find(c=>c.id===id);
  const getComFin=p=>financeiro?.find(f=>f.pedidoId===p.id&&f.marcId===user.id&&f.tipo==="pagar");
  const atrasados=meusP.filter(p=>p.dataEntrega&&p.stage!=="concluido"&&new Date(p.dataEntrega.split("/").reverse().join("-"))<new Date());
  const totalCom=meusP.reduce((s,p)=>{const f=getComFin(p);return s+(f?.valor||p.comVal||0);},0);
  const totalPago=meusP.reduce((s,p)=>{const f=getComFin(p);return s+(f?.valorPago||0);},0);
  const totalPend=totalCom-totalPago;
  const setStage=(pid,stage,extra={})=>{setPedidos(prev=>prev.map(p=>p.id===pid?{...p,stage,...extra}:p));showToast("Etapa atualizada!");setExpandId(null);setInstPid(null);};
  const dlFile=(url,nome)=>{try{const a=document.createElement("a");a.href=url;a.download=nome||"arquivo";a.target="_blank";document.body.appendChild(a);a.click();setTimeout(()=>document.body.removeChild(a),100);}catch{window.open(url,"_blank");}};
  const filtrados=meusP.filter(p=>{
    if(filtro==="andamento")return p.stage!=="concluido";
    if(filtro==="concluido")return p.stage==="concluido";
    return true;
  });
  const kpis=nav==="pedidos"
    ?[{l:"Pedidos",v:meusP.length,c:"rgba(255,255,255,.9)"},{l:"Em andamento",v:meusP.filter(p=>p.stage!=="concluido").length,c:"#fbbf24"},{l:"Atrasados",v:atrasados.length,c:atrasados.length>0?"#f87171":"rgba(255,255,255,.55)"}]
    :[{l:"Comissão Total",v:R$(totalCom),c:"rgba(255,255,255,.9)"},{l:"Já Pago",v:R$(totalPago),c:"#4ade80"},{l:"Pendente",v:R$(totalPend),c:totalPend>0?"#fbbf24":"rgba(255,255,255,.55)"}];

  const Card2=({children,style})=><div style={{background:"var(--sf)",borderRadius:12,border:"1.5px solid var(--bd)",boxShadow:"var(--sh)",...style}}>{children}</div>;

  const PgCortes=()=>{
    const [view,setView]=useState("list");
    const [form,setForm]=useState(null);
    const [selOrdem,setSelOrdem]=useState(null);
    const minhasOrdens=ordensCort.filter(o=>o.marcId===user.id);
    const statusCor={aguardando:"var(--am)",em_corte:"var(--pri)",concluido:"var(--gn)",cancelado:"var(--rd)"};
    const statusLabel={aguardando:"\u23f3 Aguardando",em_corte:"\u2699 Em Corte",concluido:"\u2713 Conclu\xeddo",cancelado:"\u2715 Cancelado"};
    const FIT_TIPOS=[{v:"N",l:"\u2014"},{v:"0.5",l:"0,5mm"},{v:"1",l:"1mm"},{v:"2",l:"2mm"},{v:"3",l:"3mm"}];
    const MATERIAIS=["MDF","MDP","Compensado","OSB","Madeira Maci\xe7a"];
    const ESPESSURAS=["6","9","12","15","18","20","25","30"];
    const CHAPAS_STD=[{l:"MDF 2750\xd71850",w:2750,h:1850},{l:"MDF 2440\xd71220",w:2440,h:1220},{l:"Personalizado",w:0,h:0}];

    const novaOrdem=()=>{
      setForm({
        pedidoId:"",cortadorId:"",obs:"",
        chapa:{material:"MDF",espessura:"15",largura:2750,altura:1850,cor:"Branco TX",qt_chapas:1,preset:"MDF 2750\xd71850"},
        pecas:[{id:uid(),nome:"",larg:400,alt:300,qt:1,fio:"N",fitamento:{topo:{tipo:"N",cor:""},base:{tipo:"N",cor:""},esq:{tipo:"N",cor:""},dir:{tipo:"N",cor:""}}}]
      });
      setView("novo");
    };

    const addPeca=()=>setForm(f=>({...f,pecas:[...f.pecas,{id:uid(),nome:"",larg:400,alt:300,qt:1,fio:"N",fitamento:{topo:{tipo:"N",cor:""},base:{tipo:"N",cor:""},esq:{tipo:"N",cor:""},dir:{tipo:"N",cor:""}}}]}));
    const updPeca=(idx,k,v)=>setForm(f=>({...f,pecas:f.pecas.map((p,i)=>i===idx?{...p,[k]:v}:p)}));
    const updFit=(idx,lado,k,v)=>setForm(f=>({...f,pecas:f.pecas.map((p,i)=>i===idx?{...p,fitamento:{...p.fitamento,[lado]:{...p.fitamento[lado],[k]:v}}}:p)}));
    const delPeca=(idx)=>setForm(f=>({...f,pecas:f.pecas.filter((_,i)=>i!==idx)}));

    const computeLayout=(f)=>{
      const flat=f.pecas.flatMap(p=>Array.from({length:p.qt},(_,i)=>({...p,id:p.id+'_'+i,nome:p.nome||(i>0?`Pe\xe7a ${i+1}`:p.nome)})));
      return packSheets(flat.map(p=>({...p,w:p.larg,h:p.alt})),+f.chapa.largura,+f.chapa.altura);
    };

    const enviarOrdem=()=>{
      if(!form.cortadorId)return showToast("Selecione um cortador!","red");
      if(form.pecas.length===0||form.pecas.some(p=>!p.nome||p.larg<=0||p.alt<=0))return showToast("Preencha todas as pe\xe7as!","red");
      const sheets=computeLayout(form);
      const num="CRT"+(String(ordensCort.length+1).padStart(3,"0"));
      const nova={id:uid(),num,marcId:user.id,pedidoId:form.pedidoId||null,cortadorId:form.cortadorId,status:"aguardando",createdAt:hojeISO(),obs:form.obs,chapa:form.chapa,pecas:form.pecas,sheets_count:sheets.length};
      setOrdensCort(prev=>[...prev,nova]);
      // Move pedido vinculado para a etapa "Plano de Corte" no Kanban
      if(form.pedidoId)setPedidos(prev=>prev.map(p=>p.id===form.pedidoId?{...p,stage:"corte",status:p.status==="em_espera"?"em_producao":p.status}:p));
      showToast("Ordem enviada! Pedido movido para Plano de Corte ✓");
      setView("list");setForm(null);
    };

    if(view==="detail"&&selOrdem){
      const o=ordensCort.find(x=>x.id===selOrdem);
      if(!o)return null;
      const sheets=computeLayout(o);
      const cort=cortadores.find(c=>c.id===o.cortadorId);
      return(<div style={{animation:"fadeIn .3s"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
          <button onClick={()=>{setView("list");setSelOrdem(null);}} style={{background:"none",border:"1px solid var(--bd)",borderRadius:8,padding:"6px 12px",cursor:"pointer",color:"var(--tx2)",fontSize:12}}>\u2190 Voltar</button>
          <span style={{fontWeight:800,fontSize:14,color:"var(--tx)"}}>{o.num}</span>
          <span style={{padding:"3px 10px",borderRadius:20,fontSize:10,fontWeight:800,background:"var(--sf)",color:statusCor[o.status]}}>{statusLabel[o.status]}</span>
        </div>
        <Card2 style={{marginBottom:10,padding:"12px 16px"}}>
          <div style={{fontSize:11,fontWeight:800,color:"var(--tx3)",textTransform:"uppercase",marginBottom:6}}>Chapa</div>
          <div style={{fontSize:12,color:"var(--tx)",fontWeight:700}}>{o.chapa.material} {o.chapa.espessura}mm \u2014 {o.chapa.largura}\xd7{o.chapa.altura}mm</div>
          <div style={{fontSize:11,color:"var(--tx3)",marginTop:2}}>{o.chapa.cor} \xb7 {o.chapa.qt_chapas} chapa(s) dispon\xedvel \xb7 Cortador: <b>{cort?.nome||"\u2014"}</b></div>
        </Card2>
        {sheets.map((sh,si)=>(
          <Card2 key={si} style={{marginBottom:10,padding:"12px 16px"}}>
            <div style={{fontSize:11,fontWeight:800,color:"var(--tx)",marginBottom:8}}>Chapa {si+1} \u2014 {sh.aprov}% aproveitamento</div>
            <CanvasCorte sheet={sh} cW={+o.chapa.largura} cH={+o.chapa.altura}/>
          </Card2>
        ))}
        <Card2 style={{padding:"12px 16px"}}>
          <div style={{fontSize:11,fontWeight:800,color:"var(--tx3)",textTransform:"uppercase",marginBottom:8}}>Pe\xe7as ({o.pecas.reduce((s,p)=>s+p.qt,0)} unidades)</div>
          {o.pecas.map((p,i)=>(
            <div key={p.id} style={{padding:"8px 0",borderBottom:"1px solid var(--bd)",fontSize:12}}>
              <div style={{fontWeight:700,color:"var(--tx)",marginBottom:3}}>{i+1}. {p.nome} \u2014 {p.larg}\xd7{p.alt}mm \xb7 Qt:{p.qt} \xb7 Fio:{p.fio}</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap",fontSize:10,color:"var(--tx3)"}}>
                {['topo','base','esq','dir'].map(l=>{const t=p.fitamento?.[l]?.tipo;return t&&t!=='N'?<span key={l} style={{background:"rgba(245,158,11,.15)",color:"#d97706",padding:"1px 6px",borderRadius:4,fontWeight:700}}>{l.toUpperCase()}: {t}mm{p.fitamento[l].cor?` (${p.fitamento[l].cor})`:""}</span>:null;})}
                {['topo','base','esq','dir'].every(l=>!p.fitamento?.[l]?.tipo||p.fitamento[l].tipo==='N')&&<span style={{color:"var(--tx3)"}}>Sem fitamento</span>}
              </div>
            </div>
          ))}
          {o.obs&&<div style={{marginTop:8,fontSize:11,color:"var(--tx3)"}}><b>Obs:</b> {o.obs}</div>}
        </Card2>
      </div>);
    }

    if(view==="novo"&&form){
      const previewSheets=form.pecas.length>0&&form.pecas.some(p=>p.nome&&p.larg>0&&p.alt>0)?computeLayout(form):[];
      return(<div style={{animation:"fadeIn .3s",paddingBottom:100}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
          <button onClick={()=>{setView("list");setForm(null);}} style={{background:"none",border:"1px solid var(--bd)",borderRadius:8,padding:"6px 12px",cursor:"pointer",color:"var(--tx2)",fontSize:12}}>\u2190 Cancelar</button>
          <span style={{fontWeight:800,fontSize:14,color:"var(--tx)"}}>Nova Ordem de Corte</span>
        </div>
        <Card2 style={{marginBottom:10,padding:"12px 16px"}}>
          <div style={{fontSize:11,fontWeight:800,color:"var(--tx3)",textTransform:"uppercase",marginBottom:8}}>Cortador Respons\xe1vel</div>
          {cortadores.filter(c=>c.ativo).length===0
            ?<div style={{fontSize:12,color:"var(--rd)"}}>Nenhum cortador cadastrado. Solicite ao administrador.</div>
            :<select value={form.cortadorId} onChange={e=>setForm(f=>({...f,cortadorId:e.target.value}))} style={{width:"100%",padding:"9px 10px",borderRadius:8,border:"1.5px solid var(--bd)",background:"var(--sf)",color:"var(--tx)",fontSize:12}}>
              <option value="">\u2014 Selecionar cortador \u2014</option>
              {cortadores.filter(c=>c.ativo).map(c=><option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>}
          {pedidos.filter(p=>p.marcId===user.id).length>0&&<div style={{marginTop:8}}>
            <div style={{fontSize:10,color:"var(--tx3)",fontWeight:700,marginBottom:4}}>Vincular Pedido (opcional)</div>
            <select value={form.pedidoId||""} onChange={e=>setForm(f=>({...f,pedidoId:e.target.value}))} style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1.5px solid var(--bd)",background:"var(--sf)",color:"var(--tx)",fontSize:12}}>
              <option value="">\u2014 Sem v\xednculo \u2014</option>
              {pedidos.filter(p=>p.marcId===user.id).map(p=><option key={p.id} value={p.id}>{p.num} \u2014 {p.cliente}</option>)}
            </select>
          </div>}
        </Card2>
        <Card2 style={{marginBottom:10,padding:"12px 16px"}}>
          <div style={{fontSize:11,fontWeight:800,color:"var(--tx3)",textTransform:"uppercase",marginBottom:8}}>Especifica\xe7\xe3o da Chapa</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
            <div>
              <div style={{fontSize:10,color:"var(--tx3)",fontWeight:700,marginBottom:3}}>MATERIAL</div>
              <select value={form.chapa.material} onChange={e=>setForm(f=>({...f,chapa:{...f.chapa,material:e.target.value}}))} style={{width:"100%",padding:"8px",borderRadius:8,border:"1.5px solid var(--bd)",background:"var(--sf)",color:"var(--tx)",fontSize:12}}>
                {MATERIAIS.map(m=><option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <div style={{fontSize:10,color:"var(--tx3)",fontWeight:700,marginBottom:3}}>ESPESSURA (mm)</div>
              <select value={form.chapa.espessura} onChange={e=>setForm(f=>({...f,chapa:{...f.chapa,espessura:e.target.value}}))} style={{width:"100%",padding:"8px",borderRadius:8,border:"1.5px solid var(--bd)",background:"var(--sf)",color:"var(--tx)",fontSize:12}}>
                {ESPESSURAS.map(e=><option key={e} value={e}>{e}mm</option>)}
              </select>
            </div>
          </div>
          <div style={{marginBottom:8}}>
            <div style={{fontSize:10,color:"var(--tx3)",fontWeight:700,marginBottom:3}}>DIMENS\xc3O PADR\xc3O</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {CHAPAS_STD.map(c=>(
                <button key={c.l} onClick={()=>{if(c.w>0)setForm(f=>({...f,chapa:{...f.chapa,largura:c.w,altura:c.h,preset:c.l}}));}} style={{padding:"6px 10px",borderRadius:8,border:`1.5px solid ${form.chapa.preset===c.l?"var(--pri)":"var(--bd)"}`,background:form.chapa.preset===c.l?"var(--prib)":"var(--sf)",color:form.chapa.preset===c.l?"var(--pri)":"var(--tx2)",fontSize:11,fontWeight:700,cursor:"pointer"}}>{c.l}</button>
              ))}
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8}}>
            <div><div style={{fontSize:10,color:"var(--tx3)",fontWeight:700,marginBottom:3}}>LARG (mm)</div><input type="number" value={form.chapa.largura} onChange={e=>setForm(f=>({...f,chapa:{...f.chapa,largura:+e.target.value,preset:"Personalizado"}}))} style={{width:"100%",padding:"8px",borderRadius:8,border:"1.5px solid var(--bd)",background:"var(--sf)",color:"var(--tx)",fontSize:12}}/></div>
            <div><div style={{fontSize:10,color:"var(--tx3)",fontWeight:700,marginBottom:3}}>ALT (mm)</div><input type="number" value={form.chapa.altura} onChange={e=>setForm(f=>({...f,chapa:{...f.chapa,altura:+e.target.value,preset:"Personalizado"}}))} style={{width:"100%",padding:"8px",borderRadius:8,border:"1.5px solid var(--bd)",background:"var(--sf)",color:"var(--tx)",fontSize:12}}/></div>
            <div><div style={{fontSize:10,color:"var(--tx3)",fontWeight:700,marginBottom:3}}>Qt CHAPAS</div><input type="number" value={form.chapa.qt_chapas} min="1" onChange={e=>setForm(f=>({...f,chapa:{...f.chapa,qt_chapas:+e.target.value}}))} style={{width:"100%",padding:"8px",borderRadius:8,border:"1.5px solid var(--bd)",background:"var(--sf)",color:"var(--tx)",fontSize:12}}/></div>
            <div><div style={{fontSize:10,color:"var(--tx3)",fontWeight:700,marginBottom:3}}>COR/MODELO</div><input value={form.chapa.cor} onChange={e=>setForm(f=>({...f,chapa:{...f.chapa,cor:e.target.value}}))} placeholder="Ex: Branco TX" style={{width:"100%",padding:"8px",borderRadius:8,border:"1.5px solid var(--bd)",background:"var(--sf)",color:"var(--tx)",fontSize:12}}/></div>
          </div>
        </Card2>
        <Card2 style={{marginBottom:10,padding:"12px 16px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div style={{fontSize:11,fontWeight:800,color:"var(--tx3)",textTransform:"uppercase"}}>Pe\xe7as ({form.pecas.reduce((s,p)=>s+p.qt,0)} unidades)</div>
            <button onClick={addPeca} style={{padding:"5px 12px",borderRadius:8,border:"1.5px solid var(--pri)",background:"var(--prib)",color:"var(--pri)",fontSize:11,fontWeight:800,cursor:"pointer"}}>+ Pe\xe7a</button>
          </div>
          {form.pecas.map((p,idx)=>(
            <div key={p.id} style={{border:"1.5px solid var(--bd)",borderRadius:10,padding:"10px 12px",marginBottom:8,background:"var(--bg)"}}>
              <div style={{display:"grid",gridTemplateColumns:"2fr 70px 70px 50px 60px 28px",gap:6,marginBottom:8,alignItems:"flex-end"}}>
                <div><div style={{fontSize:9,color:"var(--tx3)",fontWeight:700,marginBottom:2}}>NOME DA PE\xc7A</div><input value={p.nome} onChange={e=>updPeca(idx,"nome",e.target.value)} placeholder="Ex: Lateral Esq." style={{width:"100%",padding:"7px 8px",borderRadius:7,border:"1.5px solid var(--bd)",background:"var(--sf)",color:"var(--tx)",fontSize:11}}/></div>
                <div><div style={{fontSize:9,color:"var(--tx3)",fontWeight:700,marginBottom:2}}>LARG</div><input type="number" value={p.larg} onChange={e=>updPeca(idx,"larg",+e.target.value)} style={{width:"100%",padding:"7px 6px",borderRadius:7,border:"1.5px solid var(--bd)",background:"var(--sf)",color:"var(--tx)",fontSize:11}}/></div>
                <div><div style={{fontSize:9,color:"var(--tx3)",fontWeight:700,marginBottom:2}}>ALT</div><input type="number" value={p.alt} onChange={e=>updPeca(idx,"alt",+e.target.value)} style={{width:"100%",padding:"7px 6px",borderRadius:7,border:"1.5px solid var(--bd)",background:"var(--sf)",color:"var(--tx)",fontSize:11}}/></div>
                <div><div style={{fontSize:9,color:"var(--tx3)",fontWeight:700,marginBottom:2}}>QT</div><input type="number" value={p.qt} min="1" onChange={e=>updPeca(idx,"qt",+e.target.value)} style={{width:"100%",padding:"7px 6px",borderRadius:7,border:"1.5px solid var(--bd)",background:"var(--sf)",color:"var(--tx)",fontSize:11}}/></div>
                <div><div style={{fontSize:9,color:"var(--tx3)",fontWeight:700,marginBottom:2}}>FIO</div><select value={p.fio} onChange={e=>updPeca(idx,"fio",e.target.value)} style={{width:"100%",padding:"7px 4px",borderRadius:7,border:"1.5px solid var(--bd)",background:"var(--sf)",color:"var(--tx)",fontSize:11}}><option value="N">\u2014</option><option value="H">\u2194 H</option><option value="V">\u2195 V</option></select></div>
                <button onClick={()=>delPeca(idx)} style={{background:"none",border:"none",color:"var(--rd)",cursor:"pointer",fontSize:18,paddingBottom:4}}>\xd7</button>
              </div>
              <div style={{background:"rgba(245,158,11,.06)",borderRadius:7,padding:"7px 10px",border:"1px solid rgba(245,158,11,.2)"}}>
                <div style={{fontSize:9,fontWeight:800,color:"#d97706",textTransform:"uppercase",marginBottom:6}}>FITAMENTO (fita de borda)</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:6}}>
                  {[["topo","TOPO \u2191"],["base","BASE \u2193"],["esq","ESQ \u2190"],["dir","DIR \u2192"]].map(([lado,label])=>(
                    <div key={lado}>
                      <div style={{fontSize:8,color:"var(--tx3)",fontWeight:700,marginBottom:2}}>{label}</div>
                      <select value={p.fitamento[lado].tipo} onChange={e=>updFit(idx,lado,"tipo",e.target.value)} style={{width:"100%",padding:"5px 4px",borderRadius:6,border:`1.5px solid ${p.fitamento[lado].tipo!=='N'?"#f59e0b":"var(--bd)"}`,background:p.fitamento[lado].tipo!=='N'?"rgba(245,158,11,.1)":"var(--sf)",color:"var(--tx)",fontSize:10,fontWeight:700}}>
                        {FIT_TIPOS.map(t=><option key={t.v} value={t.v}>{t.l}</option>)}
                      </select>
                      {p.fitamento[lado].tipo!=='N'&&<input value={p.fitamento[lado].cor||""} onChange={e=>updFit(idx,lado,"cor",e.target.value)} placeholder="cor/ref" style={{width:"100%",marginTop:3,padding:"4px 5px",borderRadius:5,border:"1px solid var(--bd)",background:"var(--sf)",color:"var(--tx3)",fontSize:9}}/>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </Card2>
        {previewSheets.length>0&&<Card2 style={{marginBottom:10,padding:"12px 16px"}}>
          <div style={{fontSize:11,fontWeight:800,color:"var(--tx3)",textTransform:"uppercase",marginBottom:8}}>Preview \u2014 {previewSheets.length} chapa(s)</div>
          {previewSheets.map((sh,si)=>(
            <div key={si} style={{marginBottom:12}}>
              <div style={{fontSize:11,fontWeight:700,color:"var(--tx)",marginBottom:6}}>Chapa {si+1} \u2014 {sh.aprov}% aproveitamento</div>
              <CanvasCorte sheet={sh} cW={+form.chapa.largura} cH={+form.chapa.altura}/>
            </div>
          ))}
        </Card2>}
        <Card2 style={{marginBottom:10,padding:"12px 16px"}}>
          <div style={{fontSize:10,color:"var(--tx3)",fontWeight:700,marginBottom:4}}>OBSERVA\xc7\xd5ES</div>
          <textarea value={form.obs} onChange={e=>setForm(f=>({...f,obs:e.target.value}))} placeholder="Ex: Refor\xe7ar pe\xe7as maiores, prefer\xeancia de corte..." rows={3} style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1.5px solid var(--bd)",background:"var(--sf)",color:"var(--tx)",fontSize:12,resize:"vertical"}}/>
        </Card2>
        <button onClick={enviarOrdem} style={{width:"100%",padding:"14px",borderRadius:12,background:"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"#fff",fontSize:14,fontWeight:800,border:"none",cursor:"pointer",boxShadow:"0 4px 16px rgba(99,102,241,.4)"}}>\u2709 Enviar Ordem de Corte</button>
      </div>);
    }

    return(<div style={{animation:"fadeIn .3s"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div><div style={{fontSize:16,fontWeight:800,color:"var(--tx)"}}>✂ Ordens de Corte</div><div style={{fontSize:11,color:"var(--tx3)",marginTop:2}}>{minhasOrdens.length} ordem(ns)</div></div>
        <button onClick={novaOrdem} style={{padding:"9px 16px",borderRadius:10,background:"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"#fff",fontSize:12,fontWeight:800,border:"none",cursor:"pointer"}}>+ Nova Ordem</button>
      </div>
      {minhasOrdens.length===0&&<Card2 style={{padding:40,textAlign:"center"}}><div style={{fontSize:36,marginBottom:8}}>✂</div><div style={{fontSize:13,fontWeight:700,color:"var(--tx3)"}}>Nenhuma ordem ainda</div><div style={{fontSize:11,color:"var(--tx3)",marginTop:4}}>Crie sua primeira ordem de corte</div></Card2>}
      {minhasOrdens.slice().reverse().map(o=>{
        const cort=cortadores.find(c=>c.id===o.cortadorId);
        return(<div key={o.id} onClick={()=>{setSelOrdem(o.id);setView("detail");}} style={{background:"var(--sf)",borderRadius:12,border:"1.5px solid var(--bd)",padding:"12px 14px",marginBottom:10,cursor:"pointer",transition:"border-color .15s"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
            <span style={{fontWeight:800,fontSize:13,color:"var(--tx)"}}>{o.num}</span>
            <span style={{padding:"3px 10px",borderRadius:20,fontSize:10,fontWeight:800,color:statusCor[o.status],background:"var(--bg)"}}>{statusLabel[o.status]}</span>
          </div>
          <div style={{fontSize:11,color:"var(--tx3)",display:"flex",gap:12,flexWrap:"wrap"}}>
            <span>\ud83d\udccb {o.chapa.material} {o.chapa.espessura}mm</span>
            <span>\ud83d\udcd0 {o.pecas.reduce((s,p)=>s+p.qt,0)} pe\xe7as</span>
            <span>\ud83e\ude9a {cort?.nome||"\u2014"}</span>
            <span>\ud83d\udcc5 {o.createdAt}</span>
          </div>
        </div>);
      })}
    </div>);
  };

  return(
    <div style={{fontFamily:"var(--ft)",background:"var(--bg)",minHeight:"100vh",maxWidth:520,margin:"0 auto",paddingBottom:"env(safe-area-inset-bottom,0px)"}}>
      <style>{CSS}</style>

      {/* ── HEADER ── */}
      <div style={{background:"linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%)",padding:"max(env(safe-area-inset-top),14px) 20px 20px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:42,height:42,borderRadius:14,background:"rgba(255,255,255,.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>🔨</div>
            <div>
              <div style={{color:"#fff",fontWeight:800,fontSize:17}}>Olá, {user.nome.split(" ")[0]}!</div>
              <div style={{color:"rgba(255,255,255,.65)",fontSize:11,fontWeight:600}}>{user.nome}</div>
            </div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={doRefresh} disabled={refreshing} style={{background:"rgba(255,255,255,.15)",border:"none",borderRadius:10,padding:"8px 12px",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",opacity:refreshing?.6:1}}>{refreshing?"⏳":"🔄"}</button>
            <button onClick={onLogout} style={{background:"rgba(255,255,255,.15)",border:"none",borderRadius:10,padding:"8px 14px",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>Sair</button>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
          {kpis.map(k=>(
            <div key={k.l} style={{background:"rgba(255,255,255,.12)",borderRadius:12,padding:"10px 8px",textAlign:"center"}}>
              <div style={{fontSize:typeof k.v==="number"?22:13,fontWeight:800,color:k.c,lineHeight:1.1}}>{k.v}</div>
              <div style={{fontSize:10,color:"rgba(255,255,255,.6)",fontWeight:600,marginTop:3}}>{k.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CONTEÚDO ── */}
      {nav==="pedidos"&&<>
        <div style={{display:"flex",gap:8,padding:"14px 16px 8px"}}>
          {[["andamento","Em andamento"],["todos","Todos"],["concluido","Concluídos"]].map(([k,l])=>(
            <button key={k} onClick={()=>setFiltro(k)} style={{flex:1,padding:"9px 0",borderRadius:20,border:"none",background:filtro===k?"var(--pri)":"var(--sf)",color:filtro===k?"#fff":"var(--tx2)",fontSize:11,fontWeight:700,cursor:"pointer",boxShadow:filtro===k?"none":"var(--sh)"}}>
              {l}
            </button>
          ))}
        </div>
        <div style={{padding:"0 16px 110px"}}>
          {filtrados.length===0&&<div style={{textAlign:"center",padding:"48px 24px"}}><div style={{fontSize:40,marginBottom:8}}>📋</div><div style={{fontWeight:700,fontSize:14,color:"var(--tx2)"}}>Nenhum pedido {filtro==="andamento"?"em andamento":filtro==="concluido"?"concluído":"atribuído"}</div></div>}
          {filtrados.map(p=>{
            const cli=getCli(p.clienteId);
            const stage=KCOLS.find(k=>k.id===p.stage)||KCOLS[0];
            const exp=expandId===p.id;
            const atrasado=p.dataEntrega&&p.stage!=="concluido"&&new Date(p.dataEntrega.split("/").reverse().join("-"))<new Date();
            const comFin=getComFin(p);
            const comTotal=comFin?.valor||p.comVal||0;
            const comPago=comFin?.valorPago||0;
            const comPct=comTotal>0?Math.round(comPago/comTotal*100):0;
            return(
              <div key={p.id} style={{background:"var(--sf)",borderRadius:16,marginBottom:12,boxShadow:"var(--sh)",overflow:"hidden",border:`2px solid ${exp?"var(--pri)":atrasado?"var(--rd)":"transparent"}`}}>
                <div onClick={()=>setExpandId(exp?null:p.id)} style={{padding:"14px 16px",cursor:"pointer",userSelect:"none"}}>
                  <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8}}>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",alignItems:"center",gap:7,flexWrap:"wrap",marginBottom:4}}>
                        <span style={{fontWeight:800,fontSize:14,color:"var(--tx)"}}>{p.num}</span>
                        <span style={{fontSize:10,padding:"3px 8px",borderRadius:10,background:stage.color+"22",color:stage.color,fontWeight:700}}>{stage.label}</span>
                        {atrasado&&<span style={{fontSize:10,padding:"3px 8px",borderRadius:10,background:"var(--rdb)",color:"var(--rd)",fontWeight:700}}>⚠ Atrasado</span>}
                        {p.arquivos?.length>0&&<span style={{fontSize:10,padding:"3px 7px",borderRadius:10,background:"var(--blb)",color:"var(--bl)",fontWeight:700}}>📎 {p.arquivos.length}</span>}
                      </div>
                      <div style={{fontSize:14,fontWeight:700,color:"var(--tx)"}}>{cli?.nome||"Cliente"}</div>
                      {p.ambs?.length>0&&<div style={{fontSize:11,color:"var(--tx3)",marginTop:2}}>{p.ambs.map(a=>a.nome).join(" · ")}</div>}
                      {p.dataEntrega&&<div style={{fontSize:11,color:atrasado?"var(--rd)":"var(--tx3)",marginTop:3,display:"flex",alignItems:"center",gap:4,fontWeight:atrasado?700:400}}><I.Clock/> Entrega: {p.dataEntrega}</div>}
                      {comTotal>0&&<div style={{marginTop:6}}>
                        <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"var(--tx3)",marginBottom:3}}>
                          <span>Comissão {p.comPerc}%</span>
                          <span style={{fontWeight:700,color:comPct===100?"var(--gn)":comPago>0?"var(--am)":"var(--tx3)"}}>{comPct===100?"✓ Pago":comPago>0?`${comPct}% pago`:"Pendente"}</span>
                        </div>
                        <div style={{height:4,background:"var(--bd)",borderRadius:4,overflow:"hidden"}}>
                          <div style={{height:"100%",width:`${comPct}%`,background:comPct===100?"var(--gn)":"var(--am)",borderRadius:4,transition:"width .3s"}}/>
                        </div>
                      </div>}
                    </div>
                    <div style={{color:"var(--tx3)",marginTop:2,flexShrink:0}}><I.Chev d={exp?"up":"down"}/></div>
                  </div>
                </div>
                {exp&&<div style={{borderTop:"1.5px solid var(--bd)",padding:"14px 16px",animation:"fadeIn .2s"}}>
                  {/* ETAPA ATUAL + AÇÃO */}
                  {p.stage==="aguardando"&&<button onClick={()=>setStage(p.id,"corte")} style={{width:"100%",padding:"14px",borderRadius:14,border:"none",background:"linear-gradient(135deg,#10b981,#34d399)",color:"#fff",fontSize:14,fontWeight:800,cursor:"pointer",marginBottom:12}}>✅ Aceitar este Pedido</button>}
                  {p.stage==="corte"&&<div style={{marginBottom:12}}>
                    <div style={{fontSize:12,fontWeight:700,color:"var(--am)",marginBottom:8}}>📐 Plano de Corte em andamento</div>
                    <button onClick={()=>setStage(p.id,"montagem")} style={{width:"100%",padding:"11px",borderRadius:12,border:"none",background:"var(--bl)",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>Avançar para Montagem →</button>
                  </div>}
                  {p.stage==="montagem"&&<div style={{marginBottom:12}}>
                    <div style={{fontSize:12,fontWeight:700,color:"var(--bl)",marginBottom:8}}>🔧 Montagem em andamento</div>
                    {instPid===p.id
                      ?<div style={{background:"var(--ppb)",borderRadius:12,padding:"12px 14px"}}>
                        <div style={{fontSize:11,fontWeight:800,color:"var(--pp)",marginBottom:10}}>📅 Agendar Instalação</div>
                        <label style={{fontSize:10,fontWeight:700,color:"var(--tx3)",display:"block",marginBottom:3}}>Data prevista de instalação</label>
                        <input type="date" value={instData} onChange={e=>setInstData(e.target.value)} style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1.5px solid var(--bd)",background:"var(--sf)",color:"var(--tx)",fontSize:12,outline:"none",marginBottom:8}}/>
                        <label style={{fontSize:10,fontWeight:700,color:"var(--tx3)",display:"block",marginBottom:3}}>Dias previstos para finalizar</label>
                        <input type="number" min="1" value={instDias} onChange={e=>setInstDias(e.target.value)} placeholder="Ex: 3" style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1.5px solid var(--bd)",background:"var(--sf)",color:"var(--tx)",fontSize:12,outline:"none",marginBottom:10}}/>
                        <div style={{display:"flex",gap:8}}>
                          <button onClick={()=>setInstPid(null)} style={{flex:1,padding:"9px",borderRadius:10,border:"1.5px solid var(--bd)",background:"none",color:"var(--tx3)",fontSize:12,fontWeight:700,cursor:"pointer"}}>Cancelar</button>
                          <button onClick={()=>{if(!instData||!instDias)return showToast("Preencha data e dias!","red");setStage(p.id,"instalacao",{dataInstalacao:instData,diasPrevistos:+instDias});setInstData("");setInstDias("");}} style={{flex:2,padding:"9px",borderRadius:10,border:"none",background:"var(--pp)",color:"#fff",fontSize:12,fontWeight:800,cursor:"pointer"}}>✓ Confirmar Agendamento</button>
                        </div>
                      </div>
                      :<button onClick={()=>{setInstPid(p.id);setInstData(p.dataInstalacao||"");setInstDias(p.diasPrevistos||"");}} style={{width:"100%",padding:"11px",borderRadius:12,border:"none",background:"var(--pp)",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>📅 Agendar Instalação →</button>
                    }
                  </div>}
                  {p.stage==="instalacao"&&<div style={{marginBottom:12}}>
                    <div style={{background:"var(--ppb)",borderRadius:12,padding:"12px 14px",marginBottom:8}}>
                      <div style={{fontSize:11,fontWeight:800,color:"var(--pp)",marginBottom:6}}>📅 Instalação Agendada</div>
                      <div style={{fontSize:13,fontWeight:700,color:"var(--tx)"}}>{p.dataInstalacao||"—"} <span style={{fontSize:11,color:"var(--tx3)",fontWeight:500}}>• {p.diasPrevistos||"?"} dia(s)</span></div>
                      <button onClick={()=>{setInstPid(p.id);setInstData(p.dataInstalacao||"");setInstDias(p.diasPrevistos||"");}} style={{fontSize:11,color:"var(--pp)",background:"none",border:"none",cursor:"pointer",marginTop:4,fontWeight:700,padding:0}}>✏ Alterar data/dias</button>
                    </div>
                    {instPid===p.id&&<div style={{background:"var(--ppb)",borderRadius:12,padding:"12px 14px",marginBottom:8}}>
                      <input type="date" value={instData} onChange={e=>setInstData(e.target.value)} style={{width:"100%",padding:"8px",borderRadius:8,border:"1.5px solid var(--bd)",background:"var(--sf)",color:"var(--tx)",fontSize:12,outline:"none",marginBottom:6}}/>
                      <input type="number" min="1" value={instDias} onChange={e=>setInstDias(e.target.value)} placeholder="Dias" style={{width:"100%",padding:"8px",borderRadius:8,border:"1.5px solid var(--bd)",background:"var(--sf)",color:"var(--tx)",fontSize:12,outline:"none",marginBottom:8}}/>
                      <button onClick={()=>{if(!instData||!instDias)return showToast("Preencha tudo!","red");setPedidos(prev=>prev.map(x=>x.id===p.id?{...x,dataInstalacao:instData,diasPrevistos:+instDias}:x));setInstPid(null);showToast("Atualizado!");}} style={{width:"100%",padding:"8px",borderRadius:10,border:"none",background:"var(--pp)",color:"#fff",fontSize:12,fontWeight:800,cursor:"pointer"}}>✓ Salvar</button>
                    </div>}
                    <button onClick={()=>setStage(p.id,"concluido")} style={{width:"100%",padding:"11px",borderRadius:12,border:"none",background:"linear-gradient(135deg,#10b981,#34d399)",color:"#fff",fontSize:13,fontWeight:800,cursor:"pointer"}}>✅ Marcar como Concluído</button>
                  </div>}
                  {p.stage==="concluido"&&<div style={{background:"var(--gnb)",borderRadius:12,padding:"12px 14px",marginBottom:12,textAlign:"center"}}>
                    <div style={{fontSize:14,fontWeight:800,color:"var(--gn)"}}>✓ Projeto Concluído</div>
                    <button onClick={()=>setStage(p.id,"instalacao")} style={{fontSize:11,color:"var(--tx3)",background:"none",border:"none",cursor:"pointer",marginTop:4}}>Desfazer</button>
                  </div>}
                  {p.mats?.filter(m=>m.nome).length>0&&<div style={{background:"var(--bg)",borderRadius:12,padding:"10px 14px",marginBottom:10}}>
                    <div style={{fontSize:13,fontWeight:800,color:"var(--tx3)",textTransform:"uppercase",letterSpacing:".5px",marginBottom:7}}>Materiais</div>
                    {p.mats.filter(m=>m.nome).map(m=>(
                      <div key={m.id} style={{display:"flex",justifyContent:"space-between",fontSize:12,padding:"4px 0",borderBottom:"1px solid var(--bd)",color:"var(--tx2)"}}>
                        <span>{m.nome}</span><span style={{fontWeight:700,color:"var(--tx)"}}>{m.qtd} un</span>
                      </div>
                    ))}
                  </div>}
                  {(()=>{const meusAmbs=(p.ambs||[]).filter(a=>!a.marcId||a.marcId===user.id);return meusAmbs.length>0&&<div style={{background:"var(--prib)",borderRadius:12,padding:"10px 14px",marginBottom:10}}>
                    <div style={{fontSize:10,fontWeight:800,color:"var(--pri)",marginBottom:6,textTransform:"uppercase",letterSpacing:".5px"}}>Meus Ambientes ({meusAmbs.length})</div>
                    {meusAmbs.map((a,i)=><div key={i} style={{padding:"8px 0",borderBottom:"1px solid var(--bd2)"}}>
                      <div style={{fontSize:13,fontWeight:700,color:"var(--tx)"}}>{a.nome}</div>
                      {a.desc&&<div style={{fontSize:11,color:"var(--tx3)",marginTop:3,whiteSpace:"pre-line",lineHeight:1.6}}>{a.desc}</div>}
                    </div>)}
                  </div>;})()}
                  {p.arquivos?.length>0&&<div style={{background:"var(--blb)",borderRadius:12,padding:"10px 14px"}}>
                    <div style={{fontSize:10,fontWeight:800,color:"var(--bl)",marginBottom:8}}>📎 Anexos do Projeto</div>
                    {p.arquivos.map(a=>(
                      <button key={a.id} onClick={()=>dlFile(a.url,a.nome)} style={{display:"flex",alignItems:"center",gap:8,width:"100%",fontSize:12,color:"var(--bl)",fontWeight:600,background:"none",border:"none",cursor:"pointer",padding:"6px 0",borderBottom:"1px solid rgba(59,130,246,.15)",textAlign:"left"}}>
                        <I.Clip/><span style={{flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.nome}</span><span style={{fontSize:11,fontWeight:800,flexShrink:0}}>⬇</span>
                      </button>
                    ))}
                  </div>}
                </div>}
              </div>
            );
          })}
        </div>
      </>}

      {nav==="comissoes"&&<div style={{padding:"14px 16px 110px"}}>
        {/* Barra total */}
        {totalCom>0&&<div style={{background:"var(--sf)",borderRadius:16,padding:"18px 18px",marginBottom:14,boxShadow:"var(--sh)"}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
            <div><div style={{fontSize:11,color:"var(--tx3)",fontWeight:600}}>Comissão Total</div><div style={{fontSize:20,fontWeight:800,color:"var(--tx)"}}>{R$(totalCom)}</div></div>
            <div style={{textAlign:"right"}}><div style={{fontSize:11,color:"var(--tx3)",fontWeight:600}}>Progresso Geral</div><div style={{fontSize:20,fontWeight:800,color:totalPend===0?"var(--gn)":"var(--am)"}}>{totalCom>0?Math.round(totalPago/totalCom*100):0}%</div></div>
          </div>
          <div style={{height:10,background:"var(--bd)",borderRadius:10,overflow:"hidden",marginBottom:10}}>
            <div style={{height:"100%",width:`${totalCom>0?Math.round(totalPago/totalCom*100):0}%`,background:"linear-gradient(90deg,var(--gn),#34d399)",borderRadius:10,transition:"width .4s"}}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div style={{background:"var(--gnb)",borderRadius:10,padding:"10px 14px"}}>
              <div style={{fontSize:10,color:"var(--gn)",fontWeight:700,marginBottom:2}}>✓ Já Recebido</div>
              <div style={{fontSize:16,fontWeight:800,color:"var(--gn)"}}>{R$(totalPago)}</div>
            </div>
            <div style={{background:"var(--amb)",borderRadius:10,padding:"10px 14px"}}>
              <div style={{fontSize:10,color:"var(--am)",fontWeight:700,marginBottom:2}}>⏳ Pendente</div>
              <div style={{fontSize:16,fontWeight:800,color:"var(--am)"}}>{R$(totalPend)}</div>
            </div>
          </div>
        </div>}
        {meusP.length===0&&<div style={{textAlign:"center",padding:"48px 24px"}}><div style={{fontSize:40,marginBottom:8}}>💰</div><div style={{fontWeight:700,fontSize:14,color:"var(--tx2)"}}>Nenhum projeto atribuído ainda</div></div>}
        {meusP.map(p=>{
          const cli=getCli(p.clienteId);
          const cf=getComFin(p);
          const comTotal=cf?.valor||p.comVal||0;
          const comPago=cf?.valorPago||0;
          const comPend=comTotal-comPago;
          const pct=comTotal>0?Math.round(comPago/comTotal*100):0;
          const stage=KCOLS.find(k=>k.id===p.stage)||KCOLS[0];
          if(!comTotal&&!p.comPerc)return null;
          return(
            <div key={p.id} style={{background:"var(--sf)",borderRadius:16,marginBottom:12,boxShadow:"var(--sh)",overflow:"hidden"}}>
              <div style={{padding:"14px 16px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                  <div>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                      <span style={{fontWeight:800,fontSize:13,color:"var(--tx)"}}>{p.num}</span>
                      <span style={{fontSize:10,padding:"2px 8px",borderRadius:8,background:stage.color+"22",color:stage.color,fontWeight:700}}>{stage.label}</span>
                    </div>
                    <div style={{fontSize:14,fontWeight:700,color:"var(--tx)"}}>{cli?.nome||"—"}</div>
                    {p.ambs?.length>0&&<div style={{fontSize:11,color:"var(--tx3)",marginTop:1}}>{p.ambs.map(a=>a.nome).join(" · ")}</div>}
                  </div>
                  <div style={{textAlign:"right",flexShrink:0,marginLeft:8}}>
                    <div style={{fontSize:10,color:"var(--tx3)",fontWeight:600}}>Comissão {p.comPerc}%</div>
                    <div style={{fontSize:16,fontWeight:800,color:"var(--tx)"}}>{R$(comTotal)}</div>
                  </div>
                </div>
                {/* Barra progresso */}
                <div style={{height:8,background:"var(--bd)",borderRadius:8,overflow:"hidden",marginBottom:8}}>
                  <div style={{height:"100%",width:`${pct}%`,background:pct===100?"var(--gn)":"linear-gradient(90deg,#6366f1,#10b981)",borderRadius:8,transition:"width .4s"}}/>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
                  <div style={{background:"var(--gnb)",borderRadius:8,padding:"8px 10px",textAlign:"center"}}>
                    <div style={{fontSize:9,color:"var(--gn)",fontWeight:700,textTransform:"uppercase"}}>Pago</div>
                    <div style={{fontSize:13,fontWeight:800,color:"var(--gn)",marginTop:1}}>{R$(comPago)}</div>
                  </div>
                  <div style={{background:comPend>0?"var(--amb)":"var(--gnb)",borderRadius:8,padding:"8px 10px",textAlign:"center"}}>
                    <div style={{fontSize:9,color:comPend>0?"var(--am)":"var(--gn)",fontWeight:700,textTransform:"uppercase"}}>Pendente</div>
                    <div style={{fontSize:13,fontWeight:800,color:comPend>0?"var(--am)":"var(--gn)",marginTop:1}}>{R$(comPend)}</div>
                  </div>
                  <div style={{background:"var(--prib)",borderRadius:8,padding:"8px 10px",textAlign:"center"}}>
                    <div style={{fontSize:9,color:"var(--pri)",fontWeight:700,textTransform:"uppercase"}}>%</div>
                    <div style={{fontSize:13,fontWeight:800,color:pct===100?"var(--gn)":"var(--pri)",marginTop:1}}>{pct}%</div>
                  </div>
                </div>
                {cf?.parcelas?.length>0&&<div style={{marginTop:10,borderTop:"1.5px solid var(--bd)",paddingTop:10}}>
                  <div style={{fontSize:13,fontWeight:800,color:"var(--tx3)",textTransform:"uppercase",letterSpacing:".5px",marginBottom:6}}>Histórico de Pagamentos</div>
                  {cf.parcelas.filter(x=>x.pago).map(x=>(
                    <div key={x.id} style={{display:"flex",justifyContent:"space-between",fontSize:12,padding:"4px 0",borderBottom:"1px solid var(--bd)",color:"var(--gn)",fontWeight:600}}>
                      <span>✓ {x.dataPago||"—"}</span><span>{R$(x.valor)}</span>
                    </div>
                  ))}
                  {cf.parcelas.filter(x=>!x.pago).map(x=>(
                    <div key={x.id} style={{display:"flex",justifyContent:"space-between",fontSize:12,padding:"4px 0",borderBottom:"1px solid var(--bd)",color:"var(--tx3)"}}>
                      <span>⏳ {x.venc||"Aguardando"}</span><span>{R$(x.valor)}</span>
                    </div>
                  ))}
                </div>}
              </div>
            </div>
          );
        })}
      </div>}

      {/* ── CORTES ── */}
      {nav==="cortes"&&<div style={{padding:"0 16px 110px"}}><PgCortes/></div>}

      {/* ── BOTTOM NAV ── */}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:520,background:"var(--sf)",borderTop:"1.5px solid var(--bd)",display:"flex",zIndex:100,paddingBottom:"env(safe-area-inset-bottom,0px)"}}>
        {[
          {k:"pedidos",l:"Pedidos",icon:"🔨"},
          {k:"comissoes",l:"Comissões",icon:"💰"},
          {k:"cortes",l:"Cortes",icon:"✂"},
        ].map(t=>(
          <button key={t.k} onClick={()=>setNav(t.k)} style={{flex:1,padding:"12px 8px 10px",border:"none",background:"none",display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:"pointer",borderTop:`2.5px solid ${nav===t.k?"var(--pri)":"transparent"}`,transition:"border-color .15s"}}>
            <span style={{fontSize:20,lineHeight:1}}>{t.icon}</span>
            <span style={{fontSize:10,fontWeight:700,color:nav===t.k?"var(--pri)":"var(--tx3)"}}>{t.l}</span>
          </button>
        ))}
      </div>
      <InstallPrompt/>
    </div>
  );
}

function CortadorApp({user,ordensCort,setOrdensCort,setPedidos,showToast,onLogout}){
  const [nav,setNav]=useState("ordens");
  const [selId,setSelId]=useState(null);
  const minhasOrdens=ordensCort.filter(o=>o.cortadorId===user.id);
  const statusCor={aguardando:"var(--am)",em_corte:"var(--pri)",concluido:"var(--gn)",cancelado:"var(--rd)"};
  const statusLabel={aguardando:"\u23f3 Aguardando",em_corte:"\u2699 Em Corte",concluido:"\u2713 Conclu\xeddo",cancelado:"\u2715 Cancelado"};

  const updStatus=(id,status)=>{
    const ordem=ordensCort.find(o=>o.id===id);
    const now=hojeISO();
    setOrdensCort(prev=>prev.map(o=>o.id===id?{...o,status,
      ...(status==="em_corte"?{emCorteAt:now}:{}),
      ...(status==="concluido"?{concluidoAt:now}:{}),
    }:o));
    if(ordem?.pedidoId&&setPedidos){
      if(status==="em_corte")
        setPedidos(prev=>prev.map(p=>p.id===ordem.pedidoId?{...p,stage:"corte",corteInicio:now,status:p.status==="em_espera"?"em_producao":p.status}:p));
      if(status==="concluido")
        setPedidos(prev=>prev.map(p=>p.id===ordem.pedidoId?{...p,stage:"montagem",corteFim:now}:p));
    }
    showToast(status==="em_corte"?"⚙ Corte iniciado! Kanban → Plano de Corte":"✓ Corte concluído! Pedido avançou para Montagem");
  };

  const selOrdem=minhasOrdens.find(o=>o.id===selId);

  const computeLayout=(o)=>{
    const flat=o.pecas.flatMap(p=>Array.from({length:p.qt},(_,i)=>({...p,id:p.id+'_'+i,w:p.larg,h:p.alt})));
    return packSheets(flat,+o.chapa.largura,+o.chapa.altura);
  };

  const DetalhePeca=({p,i})=>(
    <div style={{padding:"10px 0",borderBottom:"1px solid var(--bd)"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
        <span style={{fontWeight:800,fontSize:12,color:"var(--tx)"}}>{i+1}. {p.nome}</span>
        <span style={{fontSize:11,color:"var(--tx3)",fontWeight:700}}>{p.larg}\xd7{p.alt}mm \xb7 \xd7{p.qt}</span>
      </div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:4}}>
        <span style={{fontSize:10,padding:"2px 7px",borderRadius:4,background:"var(--prib)",color:"var(--pri)",fontWeight:700}}>Fio: {p.fio==='N'?'Livre':p.fio}</span>
        {(['topo','base','esq','dir']).map(l=>{
          const t=p.fitamento?.[l]?.tipo;const cor=p.fitamento?.[l]?.cor;
          return t&&t!=='N'?<span key={l} style={{fontSize:10,padding:"2px 7px",borderRadius:4,background:"rgba(245,158,11,.15)",color:"#d97706",fontWeight:700}}>{l.toUpperCase()} {t}mm{cor?` ${cor}`:""}</span>:null;
        })}
        {(['topo','base','esq','dir']).every(l=>!p.fitamento?.[l]?.tipo||p.fitamento[l].tipo==='N')&&<span style={{fontSize:10,color:"var(--tx3)"}}>Sem fitamento</span>}
      </div>
    </div>
  );

  return(
    <div style={{fontFamily:"var(--ft)",background:"var(--bg)",minHeight:"100vh",maxWidth:520,margin:"0 auto",paddingBottom:80}}>
      <style>{CSS}</style>
      <div style={{background:"linear-gradient(135deg,#0ea5e9,#0284c7)",padding:"16px 18px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontSize:16,fontWeight:800,color:"#fff"}}>\ud83e\ude9a Painel do Cortador</div>
          <div style={{fontSize:11,color:"rgba(255,255,255,.8)",marginTop:2}}>{user.nome}</div>
        </div>
        <button onClick={onLogout} style={{background:"rgba(255,255,255,.15)",border:"none",borderRadius:10,padding:"8px 14px",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>Sair</button>
      </div>
      <div style={{padding:"14px 16px"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
          {[
            {l:"Aguardando",v:minhasOrdens.filter(o=>o.status==="aguardando").length,c:"var(--am)"},
            {l:"Em Corte",v:minhasOrdens.filter(o=>o.status==="em_corte").length,c:"var(--pri)"},
            {l:"Conclu\xeddos",v:minhasOrdens.filter(o=>o.status==="concluido").length,c:"var(--gn)"},
          ].map(k=>(
            <div key={k.l} style={{background:"var(--sf)",borderRadius:10,padding:"10px 8px",border:"1.5px solid var(--bd)",textAlign:"center"}}>
              <div style={{fontSize:20,fontWeight:800,color:k.c}}>{k.v}</div>
              <div style={{fontSize:9,fontWeight:700,color:"var(--tx3)",textTransform:"uppercase"}}>{k.l}</div>
            </div>
          ))}
        </div>
        {selId&&selOrdem?(<>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
            <button onClick={()=>setSelId(null)} style={{background:"none",border:"1px solid var(--bd)",borderRadius:8,padding:"6px 12px",cursor:"pointer",color:"var(--tx2)",fontSize:12}}>\u2190 Voltar</button>
            <span style={{fontWeight:800,fontSize:14,color:"var(--tx)"}}>{selOrdem.num}</span>
            <span style={{padding:"3px 10px",borderRadius:20,fontSize:10,fontWeight:800,color:statusCor[selOrdem.status]}}>{statusLabel[selOrdem.status]}</span>
          </div>
          <div style={{display:"flex",gap:8,marginBottom:12}}>
            {selOrdem.status==="aguardando"&&<button onClick={()=>updStatus(selOrdem.id,"em_corte")} style={{flex:1,padding:"11px",borderRadius:10,background:"var(--pri)",color:"#fff",fontSize:12,fontWeight:800,border:"none",cursor:"pointer"}}>\u2699 Iniciar Corte</button>}
            {selOrdem.status==="em_corte"&&<button onClick={()=>updStatus(selOrdem.id,"concluido")} style={{flex:1,padding:"11px",borderRadius:10,background:"var(--gn)",color:"#fff",fontSize:12,fontWeight:800,border:"none",cursor:"pointer"}}>\u2713 Marcar Conclu\xeddo</button>}
            {selOrdem.status==="concluido"&&<div style={{flex:1,padding:"11px",borderRadius:10,background:"var(--gnb)",color:"var(--gn)",fontSize:12,fontWeight:800,textAlign:"center"}}>\u2713 Corte Conclu\xeddo</div>}
          </div>
          <div style={{background:"var(--sf)",borderRadius:12,border:"1.5px solid var(--bd)",padding:"12px 14px",marginBottom:10}}>
            <div style={{fontSize:11,fontWeight:800,color:"var(--tx3)",textTransform:"uppercase",marginBottom:6}}>Chapa</div>
            <div style={{fontSize:13,fontWeight:800,color:"var(--tx)"}}>{selOrdem.chapa.material} {selOrdem.chapa.espessura}mm</div>
            <div style={{fontSize:11,color:"var(--tx3)",marginTop:2}}>{selOrdem.chapa.largura}\xd7{selOrdem.chapa.altura}mm \xb7 {selOrdem.chapa.cor} \xb7 {selOrdem.chapa.qt_chapas} chapa(s)</div>
          </div>
          {(()=>{const sheets=computeLayout(selOrdem);return sheets.map((sh,si)=>(
            <div key={si} style={{background:"var(--sf)",borderRadius:12,border:"1.5px solid var(--bd)",padding:"12px 14px",marginBottom:10}}>
              <div style={{fontSize:11,fontWeight:800,color:"var(--tx)",marginBottom:8}}>Plano de Corte \u2014 Chapa {si+1} ({sh.aprov}% aproveitamento)</div>
              <CanvasCorte sheet={sh} cW={+selOrdem.chapa.largura} cH={+selOrdem.chapa.altura}/>
            </div>
          ))})()}
          <div style={{background:"var(--sf)",borderRadius:12,border:"1.5px solid var(--bd)",padding:"12px 14px",marginBottom:10}}>
            <div style={{fontSize:11,fontWeight:800,color:"var(--tx3)",textTransform:"uppercase",marginBottom:8}}>Lista de Pe\xe7as com Fitamento</div>
            {selOrdem.pecas.map((p,i)=><DetalhePeca key={p.id} p={p} i={i}/>)}
            {selOrdem.obs&&<div style={{marginTop:8,padding:"8px 10px",borderRadius:8,background:"var(--bg)",fontSize:11,color:"var(--tx2)"}}><b>Obs:</b> {selOrdem.obs}</div>}
          </div>
        </>):(
          <>
            <div style={{fontSize:13,fontWeight:800,color:"var(--tx)",marginBottom:10}}>Minhas Ordens de Corte</div>
            {minhasOrdens.length===0&&<div style={{textAlign:"center",padding:40,color:"var(--tx3)"}}>
              <div style={{fontSize:36,marginBottom:8}}>\ud83e\ude9a</div>
              <div style={{fontWeight:700,fontSize:13}}>Nenhuma ordem recebida</div>
            </div>}
            {minhasOrdens.slice().reverse().map(o=>(
              <div key={o.id} onClick={()=>setSelId(o.id)} style={{background:"var(--sf)",borderRadius:12,border:`1.5px solid ${o.status==="aguardando"?"rgba(245,158,11,.4)":o.status==="em_corte"?"rgba(99,102,241,.4)":"var(--bd)"}`,padding:"12px 14px",marginBottom:10,cursor:"pointer"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                  <span style={{fontWeight:800,fontSize:13,color:"var(--tx)"}}>{o.num}</span>
                  <span style={{padding:"3px 10px",borderRadius:20,fontSize:10,fontWeight:800,color:statusCor[o.status]}}>{statusLabel[o.status]}</span>
                </div>
                <div style={{fontSize:11,color:"var(--tx3)",display:"flex",gap:10,flexWrap:"wrap"}}>
                  <span>\ud83d\udccb {o.chapa.material} {o.chapa.espessura}mm</span>
                  <span>\ud83d\udcd0 {o.pecas.reduce((s,p)=>s+p.qt,0)} pe\xe7as</span>
                  <span>\ud83d\udcc5 {o.createdAt}</span>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function ModalNovoRec({clientes,setModal,setRecebimentos,showToast}){
  const [f,setF]=useState({clienteId:"",nome:"",valorTotal:0,numParc:1,vencInicial:hojeISO(),obs:""});
  const u=(k,v)=>setF(p=>({...p,[k]:v}));
  return(<><h2 style={{fontSize:16,fontWeight:800,marginBottom:16}}>Novo Recebimento</h2>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
      <Field label="Selecionar Cliente" value={f.clienteId} onChange={v=>setF(p=>({...p,clienteId:v,nome:clientes.find(c=>c.id===v)?.nome||p.nome}))} options={[{v:"",l:"— Digitar nome —"},...clientes.map(c=>({v:c.id,l:c.nome}))]}/>
      <Field label={f.clienteId?"Nome (do cadastro)":"Nome do Cliente"} value={f.clienteId?(clientes.find(c=>c.id===f.clienteId)?.nome||""):f.nome} onChange={v=>u("nome",v)} disabled={!!f.clienteId}/>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
      <Field label="Valor Total R$" type="number" value={f.valorTotal} onChange={v=>u("valorTotal",+v)}/>
      <Field label="Nº Parcelas" type="number" value={f.numParc} onChange={v=>u("numParc",Math.max(1,+v))}/>
      <Field label="1º Vencimento" type="date" value={f.vencInicial} onChange={v=>u("vencInicial",v)}/>
    </div>
    <Field label="Observação / Pedido" value={f.obs} onChange={v=>u("obs",v)} placeholder="Ex: PED-0001, Cozinha Ana..."/>
    <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:8}}>
      <Btn v="ghost" onClick={()=>setModal(null)}>Cancelar</Btn>
      <Btn onClick={()=>{
        const nome=f.clienteId?(clientes.find(c=>c.id===f.clienteId)?.nome||f.nome):f.nome;
        if(!nome?.trim())return showToast("Nome!","red");
        if(!f.valorTotal)return showToast("Informe o valor!","red");
        const vp=+(f.valorTotal/f.numParc).toFixed(2);
        const parcelas=Array.from({length:f.numParc},(_,i)=>{
          let vd="";if(f.vencInicial){const d=new Date(f.vencInicial+"T12:00:00");d.setMonth(d.getMonth()+i);vd=d.toISOString().split("T")[0];}
          return{id:uid(),num:i+1,valor:vp,venc:vd,pago:false,dataPago:"",formaPag:""};
        });
        setRecebimentos(prev=>[...prev,{id:uid(),clienteId:f.clienteId||"",cliente:nome.trim(),valorTotal:f.valorTotal,obs:f.obs,parcelas}]);
        setModal(null);showToast("Recebimento criado!");
      }}><I.Check/> Criar</Btn>
    </div>
  </>);
}

function ModalBaixaRec({modal,setModal,setRecebimentos,showToast}){
  const {rec,parcela}=modal.d;
  const [f,setF]=useState({dataPago:hojeISO(),formaPag:"pix",valor:parcela.valor});
  return(<><h2 style={{fontSize:15,fontWeight:800,marginBottom:8}}>Dar Baixa — Parcela #{parcela.num}</h2>
    <div style={{background:"var(--prib)",borderRadius:"var(--r)",padding:"10px 14px",marginBottom:14}}>
      <div style={{fontWeight:800,fontSize:14,color:"var(--pri)"}}>{rec.cliente}</div>
      {rec.obs&&<div style={{fontSize:11,color:"var(--tx3)",marginTop:2}}>{rec.obs}</div>}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
      <Field label="Data do Pagamento" type="date" value={f.dataPago} onChange={v=>setF(p=>({...p,dataPago:v}))}/>
      <Field label="Forma de Pagamento" value={f.formaPag} onChange={v=>setF(p=>({...p,formaPag:v}))} options={FORMAS}/>
    </div>
    <Field label="Valor Recebido R$" type="number" value={f.valor} onChange={v=>setF(p=>({...p,valor:+v}))}/>
    <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:8}}>
      <Btn v="ghost" onClick={()=>setModal(null)}>Cancelar</Btn>
      <Btn v="success" onClick={()=>{
        setRecebimentos(prev=>prev.map(r=>r.id!==rec.id?r:{...r,parcelas:r.parcelas.map(p=>p.id!==parcela.id?p:{...p,pago:true,dataPago:f.dataPago,formaPag:f.formaPag,valor:f.valor})}));
        setModal(null);showToast("Baixa registrada!");
      }}><I.Check/> Confirmar Baixa</Btn>
    </div>
  </>);
}

// ── Valor por extenso (pt-BR) ───────────────────────────────────────────────
function _numExt(n){
  const u=['','um','dois','três','quatro','cinco','seis','sete','oito','nove','dez','onze','doze','treze','quatorze','quinze','dezesseis','dezessete','dezoito','dezenove'];
  const d=['','','vinte','trinta','quarenta','cinquenta','sessenta','setenta','oitenta','noventa'];
  const c=['','cento','duzentos','trezentos','quatrocentos','quinhentos','seiscentos','setecentos','oitocentos','novecentos'];
  if(n===0)return'zero';if(n<0)return'menos '+_numExt(-n);
  let r='';
  if(n>=1000000){const m=Math.floor(n/1000000);r+=_numExt(m)+(m===1?' milhão':' milhões');n%=1000000;if(n>0)r+=' e ';}
  if(n>=1000){const t=Math.floor(n/1000);r+=(t===1?'mil':_numExt(t)+' mil');n%=1000;if(n>0)r+=' e ';}
  if(n>=100){const h=Math.floor(n/100);r+=(n===100?'cem':c[h]);n%=100;if(n>0)r+=' e ';}
  if(n>=20){r+=d[Math.floor(n/10)];n%=10;if(n>0)r+=' e '+u[n];}
  else if(n>0)r+=u[n];
  return r;
}
function valorExtenso(v){
  const reais=Math.floor(v);const cts=Math.round((v-reais)*100);
  let t=_numExt(reais)+(reais===1?' real':' reais');
  if(cts>0)t+=' e '+_numExt(cts)+(cts===1?' centavo':' centavos');
  return t.charAt(0).toUpperCase()+t.slice(1);
}

function ModalRecibo({empresa,getCli,setModal,pedido,parcela,numProx}){
  const [num,setNum]=useState(String(numProx||1).padStart(3,'0'));
  const [data,setData]=useState(hojeISO());
  const [nomeCli,setNomeCli]=useState(()=>{const c=getCli(pedido?.clienteId);return c?.nome||'';});
  const [cpfCnpj,setCpfCnpj]=useState(()=>{const c=getCli(pedido?.clienteId);return c?.cpf||c?.cnpj||'';});
  const [valor,setValor]=useState(parcela?.valor??pedido?.vt??0);
  const [desc,setDesc]=useState(parcela
    ?`${parcela.descExtra||'Parcela'} referente ao pedido ${pedido?.num||''}`
    :`Serviços de marcenaria — pedido ${pedido?.num||''}`);
  const [formaPag,setFormaPag]=useState(parcela?.formaPag||'pix');
  const formaLabel={pix:'PIX',ted:'TED/DOC',dinheiro:'Dinheiro',cheque:'Cheque',cartao:'Cartão',boleto:'Boleto',outros:'Outros'};
  const dataFmt=data?new Date(data+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'}):'';
  const cidadeEmp=(empresa.endereco||'').split(/[-,]/).pop()?.trim().replace(/\s*\/.*$/,'').trim()||empresa.nome||'';

  const imprimir=()=>{
    const w=window.open('','_blank','width=820,height=700');
    const logoHtml=empresa.logo?`<img src="${empresa.logo}" style="height:50px;object-fit:contain;margin-bottom:4px"/>`:
      `<div style="font-size:22px;font-weight:900;color:#1e293b;letter-spacing:-1px">${empresa.nome||'Empresa'}</div>`;
    const html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Recibo ${num}</title><style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Arial',sans-serif;background:#fff;color:#1e293b;padding:0}
.page{max-width:740px;margin:0 auto;padding:36px 40px;border:2px solid #e2e8f0;min-height:400px;position:relative}
.hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #6366f1}
.hdr-left{}
.hdr-info{font-size:10px;color:#64748b;margin-top:2px}
.hdr-right{text-align:right}
.badge{display:inline-block;background:#6366f1;color:#fff;font-size:22px;font-weight:900;letter-spacing:2px;padding:6px 18px;border-radius:8px}
.num{font-size:12px;color:#6366f1;font-weight:700;margin-top:4px;text-align:right}
.body{margin:20px 0 28px}
.recebemos{font-size:13px;color:#475569;margin-bottom:14px;line-height:1.6}
.valor-box{background:#f0f4ff;border:1.5px solid #c7d2fe;border-radius:10px;padding:14px 20px;margin:18px 0;text-align:center}
.valor-rs{font-size:28px;font-weight:900;color:#4338ca;letter-spacing:-1px}
.valor-ext{font-size:11px;color:#6366f1;margin-top:4px;font-style:italic}
.ref{margin-top:16px}
.ref-label{font-size:9px;font-weight:800;text-transform:uppercase;color:#94a3b8;letter-spacing:.8px;margin-bottom:4px}
.ref-val{font-size:12px;color:#1e293b;font-weight:600;padding:8px 12px;background:#f8fafc;border-radius:7px;border:1px solid #e2e8f0}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px}
.footer{margin-top:32px;padding-top:20px;border-top:1.5px dashed #cbd5e1;display:flex;justify-content:space-between;align-items:flex-end}
.sign{text-align:center}
.sign-line{border-bottom:1.5px solid #334155;width:220px;margin-bottom:6px}
.sign-name{font-size:11px;font-weight:700;color:#1e293b}
.sign-role{font-size:9px;color:#94a3b8}
.date-place{font-size:11px;color:#64748b}
.watermark{position:absolute;bottom:12px;right:16px;font-size:9px;color:#e2e8f0;font-weight:700;letter-spacing:1px;text-transform:uppercase}
@media print{body{padding:0}.page{border:none;max-width:100%;padding:20px 24px}}
</style></head><body>
<div class="page">
  <div class="hdr">
    <div class="hdr-left">
      ${logoHtml}
      ${empresa.cnpj?`<div class="hdr-info">CNPJ: ${empresa.cnpj}</div>`:''}
      ${empresa.endereco?`<div class="hdr-info">${empresa.endereco}</div>`:''}
      ${empresa.telefone?`<div class="hdr-info">Tel: ${empresa.telefone}</div>`:''}
    </div>
    <div class="hdr-right">
      <div class="badge">RECIBO</div>
      <div class="num">Nº ${num}</div>
    </div>
  </div>
  <div class="body">
    <div class="recebemos">
      Recebi(emos) de <strong>${nomeCli||'—'}</strong>${cpfCnpj?` · CPF/CNPJ: ${cpfCnpj}`:''}
    </div>
    <div class="valor-box">
      <div class="valor-rs">R$ ${valor.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})}</div>
      <div class="valor-ext">(${valorExtenso(valor)})</div>
    </div>
    <div class="ref">
      <div class="ref-label">Referente a</div>
      <div class="ref-val">${desc}</div>
    </div>
    <div class="grid2">
      <div>
        <div class="ref-label">Forma de pagamento</div>
        <div class="ref-val">${formaLabel[formaPag]||formaPag||'—'}</div>
      </div>
      <div>
        <div class="ref-label">Data</div>
        <div class="ref-val">${dataFmt}</div>
      </div>
    </div>
  </div>
  <div class="footer">
    <div class="date-place">${cidadeEmp}, ${dataFmt}</div>
    <div class="sign">
      <div class="sign-line"></div>
      <div class="sign-name">${empresa.nome||'Empresa'}</div>
      <div class="sign-role">${empresa.cnpj?'CNPJ: '+empresa.cnpj:'Responsável'}</div>
    </div>
  </div>
  <div class="watermark">RECIBO Nº ${num}</div>
</div>
<script>setTimeout(()=>window.print(),350)</script>
</body></html>`;
    w.document.write(html);w.document.close();
  };

  return(<>
    <h2 style={{fontSize:16,fontWeight:800,color:"var(--tx)",marginBottom:16}}>Emitir Recibo</h2>
    <div style={{display:"grid",gridTemplateColumns:"120px 1fr",gap:10,marginBottom:10}}>
      <Field label="Nº do Recibo" value={num} onChange={setNum}/>
      <Field label="Data" type="date" value={data} onChange={setData}/>
    </div>
    <Field label="Nome do Cliente / Pagador" value={nomeCli} onChange={setNomeCli}/>
    <Field label="CPF / CNPJ do Cliente (opcional)" value={cpfCnpj} onChange={setCpfCnpj}/>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
      <Field label="Valor R$" type="number" value={valor} onChange={v=>setValor(+v)}/>
      <Field label="Forma de Pagamento" value={formaPag} onChange={setFormaPag} options={FORMAS}/>
    </div>
    <Field label="Referente a (descrição)" value={desc} onChange={setDesc}/>
    {valor>0&&<div style={{background:"var(--prib)",borderRadius:"var(--r)",padding:"8px 12px",fontSize:11,color:"var(--pri)",fontStyle:"italic",marginTop:4}}>
      {valorExtenso(valor)}
    </div>}
    <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:16}}>
      <Btn v="ghost" onClick={()=>setModal(null)}>Cancelar</Btn>
      <Btn onClick={imprimir}><I.Printer/> Gerar e Imprimir</Btn>
    </div>
  </>);
}

// Wrapper estável: identidade fixa → React nunca desmonta ao re-renderizar o pai
function StablePageWrapper({renderFn}){return renderFn();}

export default function ERP(){
  const [user,setUser]=useState(()=>{try{const u=localStorage.getItem('erpUser');return u?JSON.parse(u):null;}catch{return null;}});
  const [loginView,setLoginView]=useState(null);
  const [loginErr,setLoginErr]=useState("");
  const [loginBlocked,setLoginBlocked]=useState(()=>{
    try{const b=JSON.parse(localStorage.getItem('_lb')||'{}');return b;}catch{return{};}
  });
  const loginAttemptsRef=useRef(()=>{try{return JSON.parse(localStorage.getItem('_la')||'{}');}catch{return{};}});
  const [tab,setTab]=useState("dashboard");
  const [modal,setModal]=useState(null);
  const [toast,setToast]=useState(null);
  const [orcAtivo,setOrcAtivo]=useState(null);
  const [pedAtivo,setPedAtivo]=useState(null);
  const [ambAberto,setAmbAberto]=useState(null);
  const [insModal,setInsModal]=useState(null);

  // ── DATA STORE ──
  const [clientes,setClientes]=useState(()=>LS('clientes')||DEMO_CLIENTES);
  const [orcamentos,setOrcamentos]=useState(()=>LS('orcamentos')||[]);
  const [pedidos,setPedidos]=useState(()=>LS('pedidos')||[]);
  const [marceneiros,setMarceneiros]=useState(()=>LS('marceneiros')||DEMO_MARC);
  const [estoque,setEstoque]=useState(()=>LS('estoque')||DEMO_EST);
  const [financeiro,setFinanceiro]=useState(()=>LS('financeiro')||[]);
  const [leads,setLeads]=useState(()=>LS('leads')||DEMO_LEADS);
  const [bankSync,setBankSync]=useState({connected:false,banco:"",agencia:"",conta:"",lastSync:""});
  const [biblioteca,setBiblioteca]=useState(()=>LS('biblioteca')||[]);
  const [recebimentos,setRecebimentos]=useState(()=>LS('recebimentos')||[]);
  const [recorrentes,setRecorrentes]=useState(()=>LS('recorrentes')||[]);
  const [vendedores,setVendedores]=useState(()=>LS('vendedores')||[]);
  const [cortadores,setCortadores]=useState(()=>LS('cortadores')||[]);
  const [ordensCort,setOrdensCort]=useState(()=>LS('ordensCort')||[]);
  const [showComissoes,setShowComissoes]=useState(false);
  const [showComissoesVend,setShowComissoesVend]=useState(false);
  const [saldoInicial,setSaldoInicial]=useState(()=>+(LS('saldoInicial')||0));
  const [editSaldoInicial,setEditSaldoInicial]=useState(false);
  const [dreAno,setDreAno]=useState(new Date().getFullYear());
  const [dreMes,setDreMes]=useState("");
  const [dbLoaded,setDbLoaded]=useState(false);
  const [syncStatus,setSyncStatus]=useState("idle"); // idle | syncing | ok | error
  const recNomeRef=useRef("");const recMesRef=useRef(hojeISO().slice(0,7));const [recAddingMes,setRecAddingMes]=useState(false);
  const [recExpId,setRecExpId]=useState(null);
  const [recTab,setRecTab]=useState("pedidos");
  const [editRecId,setEditRecId]=useState(null);
  const [editRecDraft,setEditRecDraft]=useState({cliente:"",obs:""});
  const [poolTab,setPoolTab]=useState("1012");
  const recorrentesRef=useRef(recorrentes);useEffect(()=>{recorrentesRef.current=recorrentes;},[recorrentes]);
  const recGeradoRef=useRef(false);
  const EMPRESA_DEF={nome:"Marcenaria",endereco:"",telefone:"",email:"",cnpj:"",logo:"",loginAdmin:"admin",senhaAdmin:"admin123"};
  const [empresa,setEmpresa]=useState(()=>{try{const s=JSON.parse(localStorage.getItem('erpEmpresa'));return s?{...EMPRESA_DEF,...s}:EMPRESA_DEF;}catch{return EMPRESA_DEF;}});

  const showToast=useCallback((msg,type="success")=>{setToast({msg,type});setTimeout(()=>setToast(null),2500)},[]);
  const saveEmpresa=async e=>{setEmpresa(e);localStorage.setItem('erpEmpresa',JSON.stringify(e));setSyncStatus("syncing");const ok=await dbSet('empresa',e);setSyncStatus(ok?"ok":"error");showToast(ok?"Configurações salvas na nuvem!":"Salvo localmente (verificar conexão)","success");};

  // ── SUPABASE SYNC ──
  const DB_KEYS=['clientes','orcamentos','pedidos','marceneiros','estoque','financeiro','leads','biblioteca','recebimentos','recorrentes','vendedores','cortadores','ordensCort'];
  const syncTimers=useRef({});
  const pendingSync=useRef(new Set()); // chaves com gravações pendentes (debounce ativo)

  const getSnap=useCallback(()=>({
    clientes,orcamentos,pedidos,marceneiros,estoque,financeiro,
    leads,biblioteca,recebimentos,recorrentes,vendedores,cortadores,ordensCort,
  }),[clientes,orcamentos,pedidos,marceneiros,estoque,financeiro,leads,biblioteca,recebimentos,recorrentes,vendedores,cortadores,ordensCort]);

  const _getFinMes=(f)=>{
    const venc=f.parcelas&&f.parcelas.find(p=>p.venc)?.venc;
    if(venc)return venc.slice(0,7);
    return((f.desc||'').match(/\d{4}-\d{2}/)||[])[0]||'';
  };
  const _deduplicateFin=(arr)=>{
    const seen=new Map();const keep=[];
    for(const f of arr){
      let key=null;
      if(f.pedidoId)key='ped|'+f.pedidoId+'|'+f.tipo+'|'+(f.marcId||'')+'|'+(f.vendedorId||'');
      else if(f.recorrenteId)key='rec|'+f.recorrenteId+'|'+_getFinMes(f);
      if(key){
        if(seen.has(key)){
          const ex=seen.get(key);
          const fHasVenc=!!(f.parcelas&&f.parcelas.find(p=>p.venc));
          const exHasVenc=!!(ex.parcelas&&ex.parcelas.find(p=>p.venc));
          if((fHasVenc&&!exHasVenc)||((fHasVenc||!exHasVenc)&&(f.valorPago||0)>(ex.valorPago||0))){
            keep.splice(keep.indexOf(ex),1);keep.push(f);seen.set(key,f);
          }
        }else{seen.set(key,f);keep.push(f);}
      }else keep.push(f);
    }
    return keep;
  };

  // ── SAVE ENGINE ─────────────────────────────────────────────────────────────
  // Financeiro: escrita imediata + retry. Outros: debounce 800ms.
  // writeInFlight evita gravações simultâneas para a mesma chave.
  const writeInFlight=useRef({});

  const _writeWithRetry=useCallback(async(k,val,attempt=0)=>{
    if(writeInFlight.current[k]){
      // Já tem uma gravação em andamento — agenda re-check após ela terminar
      writeInFlight.current[k+'_queued']=val;
      return;
    }
    writeInFlight.current[k]=true;
    setSyncStatus("syncing");
    const ok=await dbSet(k,val);
    writeInFlight.current[k]=false;
    if(ok){
      pendingSync.current.delete(k);
      setSyncStatus("ok");
      // Se houve atualização enquanto gravava, gravar a versão mais recente
      if(writeInFlight.current[k+'_queued']!==undefined){
        const next=writeInFlight.current[k+'_queued'];
        delete writeInFlight.current[k+'_queued'];
        _writeWithRetry(k,next,0);
      }
    } else {
      setSyncStatus("error");
      if(attempt<4){
        // Retry exponencial: 2s, 4s, 8s, 16s
        setTimeout(()=>_writeWithRetry(k,val,attempt+1),2000*(attempt+1));
      }
    }
  },[]);

  const syncCloud=(k,v)=>{
    const val=k==='financeiro'?_deduplicateFin(v):v;
    // Salva timestamp local junto com os dados
    const ts=new Date().toISOString();
    localStorage.setItem('erp_'+k,JSON.stringify(val));
    localStorage.setItem('erp_ts_'+k,ts);
    pendingSync.current.add(k);
    // Todos os dados críticos: escrita IMEDIATA sem debounce
    clearTimeout(syncTimers.current[k]);
    _writeWithRetry(k,val,0);
  };

  // Backup: lê do estado em memória (não do localStorage)
  const getBackup=useCallback(()=>({
    ...getSnap(), empresa,
  }),[getSnap,empresa]);

  // Import: restaura estado + localStorage + Supabase
  const importBackup=useCallback(async(data)=>{
    const keys=['clientes','orcamentos','pedidos','marceneiros','estoque','financeiro','leads','biblioteca','recebimentos','recorrentes','vendedores','cortadores','ordensCort'];
    const setters2={clientes:setClientes,orcamentos:setOrcamentos,pedidos:setPedidos,marceneiros:setMarceneiros,
      estoque:setEstoque,financeiro:setFinanceiro,leads:setLeads,biblioteca:setBiblioteca,
      recebimentos:setRecebimentos,recorrentes:setRecorrentes,vendedores:setVendedores,
      cortadores:setCortadores,ordensCort:setOrdensCort};
    const entries=[];
    keys.forEach(k=>{
      if(data[k]!==undefined){
        setters2[k](data[k]);
        localStorage.setItem('erp_'+k,JSON.stringify(data[k]));
        entries.push([k,data[k]]);
      }
    });
    if(data.empresa){
      setEmpresa(cur=>({...cur,...data.empresa}));
      localStorage.setItem('erpEmpresa',JSON.stringify(data.empresa));
      entries.push(['empresa',data.empresa]);
    }
    setSyncStatus("syncing");
    const {fail}=await dbSetMany(entries);
    setSyncStatus(fail.length===0?"ok":"error");
    showToast(fail.length===0?"Backup restaurado e sincronizado com a nuvem!":"Backup restaurado localmente (verifique conexão)","success");
  },[showToast]);

  // Backup automático diário — salva snapshot em chave separada com data
  const saveBackup=useCallback(async(snap,emp)=>{
    try{
      const today=new Date().toISOString().slice(0,10);
      const backupKey=`backup_${today}`;
      const existing=await dbGet(backupKey);
      if(existing)return; // já tem backup de hoje
      await dbSet(backupKey,{...snap,empresa:emp,ts:new Date().toISOString()});
      console.log('[backup] Backup diário salvo:',backupKey);
    }catch(e){console.warn('[backup] erro',e);}
  },[]);

  // Sincronização forçada — salva tudo no Supabase e mostra resultado
  const forceSyncAll=useCallback(async()=>{
    setSyncStatus("syncing");
    const snap=getSnap();
    const entries=Object.entries(snap).concat([['empresa',empresa]]);
    // Salva local também
    entries.forEach(([k,v])=>{
      if(k==="empresa") localStorage.setItem('erpEmpresa',JSON.stringify(v));
      else localStorage.setItem('erp_'+k,JSON.stringify(v));
    });
    const {ok,fail}=await dbSetMany(entries);
    // Salva backup diário junto
    await saveBackup(snap,empresa);
    if(fail.length===0){setSyncStatus("ok");return{ok,fail};}
    else{setSyncStatus("error");return{ok,fail};}
  },[getSnap,empresa,saveBackup]);

  // Load from Supabase — lógica: quem tem MAIS dados ganha (protege contra sobrescrita)
  const loadFromCloud=useCallback(async(isInitial=false)=>{
    setSyncStatus("syncing");
    const setters={clientes:setClientes,orcamentos:setOrcamentos,pedidos:setPedidos,
      marceneiros:setMarceneiros,estoque:setEstoque,financeiro:setFinanceiro,
      leads:setLeads,biblioteca:setBiblioteca,recebimentos:setRecebimentos,
      recorrentes:setRecorrentes,vendedores:setVendedores,
      cortadores:setCortadores,ordensCort:setOrdensCort};
    const toUpload=[];
    for(const k of DB_KEYS){
      // Nunca sobrescrever mudanças locais não sincronizadas (evita reverter delete/edição)
      if(pendingSync.current.has(k))continue;
      try{
        const row=await dbGetRow(k);
        const localRaw=localStorage.getItem('erp_'+k);
        const local=localRaw?JSON.parse(localRaw):null;
        const localTs=localStorage.getItem('erp_ts_'+k)||'';
        const cloud=row?.data??null;
        const cloudTs=row?.updatedAt||'';
        const hasCloud=cloud!=null&&(Array.isArray(cloud)?cloud.length>0:Object.keys(cloud).length>0);
        const hasLocal=local!=null&&(Array.isArray(local)?local.length>0:Object.keys(local).length>0);
        // Comparação por timestamp: quem foi gravado mais recentemente vence
        // Isso garante que deleções/edições nunca sejam revertidas por dispositivo desatualizado
        const cloudNewer=!localTs||(cloudTs&&cloudTs>localTs);
        if(hasCloud&&cloudNewer){
          // Cloud é mais recente — usa cloud
          const cloudJson=JSON.stringify(cloud);
          if(cloudJson!==localRaw){
            const val=k==='financeiro'?_deduplicateFin(cloud):cloud;
            setters[k](val);
            localStorage.setItem('erp_'+k,JSON.stringify(val));
            localStorage.setItem('erp_ts_'+k,cloudTs);
          }
        } else if(hasLocal&&!cloudNewer){
          // Local é mais recente — sobe para cloud
          toUpload.push([k, k==='financeiro'?_deduplicateFin(local):local]);
        } else if(hasCloud&&!hasLocal){
          // Só tem cloud — carrega cloud (primeiro acesso neste dispositivo)
          const val=k==='financeiro'?_deduplicateFin(cloud):cloud;
          setters[k](val);
          localStorage.setItem('erp_'+k,JSON.stringify(val));
          localStorage.setItem('erp_ts_'+k,cloudTs);
        } else if(hasLocal&&!hasCloud){
          // Só tem local — sobe para cloud
          toUpload.push([k, k==='financeiro'?_deduplicateFin(local):local]);
        }
        // ambos vazios → mantém estado inicial, não faz nada
      }catch(e){console.warn('[load] erro ao carregar',k,e);}
    }
    try{
      const cloud=await dbGet('empresa');
      const localE=JSON.parse(localStorage.getItem('erpEmpresa')||'null');
      const cloudKeys=Object.keys(cloud||{}).filter(x=>!['loginAdmin','senhaAdmin'].includes(x)).length;
      const localKeys=Object.keys(localE||{}).filter(x=>!['loginAdmin','senhaAdmin'].includes(x)).length;
      if(cloudKeys>0&&cloudKeys>=localKeys){
        setEmpresa(cur=>({...EMPRESA_DEF,...cur,...cloud}));
        localStorage.setItem('erpEmpresa',JSON.stringify({...EMPRESA_DEF,...localE,...cloud}));
      } else if(localKeys>0&&localKeys>cloudKeys){
        // Local tem configs mais ricas → faz upload
        toUpload.push(['empresa',localE]);
      }
    }catch(e){console.warn('[load] erro empresa',e);}
    if(toUpload.length>0){
      const empEntry=toUpload.find(([k])=>k==='empresa');
      await dbSetMany(toUpload.filter(([k])=>k!=='empresa'));
      if(empEntry)await dbSet('empresa',empEntry[1]);
      showToast(`☁️ Dados locais enviados para nuvem (${toUpload.length} chave(s))`);
    }
    setDbLoaded(true);
    setSyncStatus("ok");
    // Backup diário automático após carregamento
    if(isInitial){
      const snap2={clientes:JSON.parse(localStorage.getItem('erp_clientes')||'[]'),orcamentos:JSON.parse(localStorage.getItem('erp_orcamentos')||'[]'),pedidos:JSON.parse(localStorage.getItem('erp_pedidos')||'[]'),marceneiros:JSON.parse(localStorage.getItem('erp_marceneiros')||'[]'),estoque:JSON.parse(localStorage.getItem('erp_estoque')||'[]'),financeiro:JSON.parse(localStorage.getItem('erp_financeiro')||'[]'),leads:JSON.parse(localStorage.getItem('erp_leads')||'[]'),biblioteca:JSON.parse(localStorage.getItem('erp_biblioteca')||'[]'),recebimentos:JSON.parse(localStorage.getItem('erp_recebimentos')||'[]'),recorrentes:JSON.parse(localStorage.getItem('erp_recorrentes')||'[]'),vendedores:JSON.parse(localStorage.getItem('erp_vendedores')||'[]')};
      const empSnap=JSON.parse(localStorage.getItem('erpEmpresa')||'{}');
      saveBackup(snap2,empSnap);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[saveBackup]);

  useEffect(()=>{loadFromCloud(true);},[loadFromCloud]);

  // Visibilidade: flush ao sair, reload ao voltar só se ficou 3+ min fora
  const hiddenAtRef=useRef(0);
  useEffect(()=>{
    if(!dbLoaded)return;
    const onVisibility=()=>{
      if(document.visibilityState==='hidden'){
        hiddenAtRef.current=Date.now();
        // Flush imediato com keepalive ao sair da aba
        Object.values(syncTimers.current).forEach(t=>clearTimeout(t));
        const snap=getSnap();
        Object.entries(snap).forEach(([k,v])=>{
          if(pendingSync.current.has(k)){
            const val=k==='financeiro'?_deduplicateFin(v):v;
            localStorage.setItem('erp_'+k,JSON.stringify(val));
            dbSet(k,val,true);
          }
        });
      } else {
        // Voltou para a aba: só recarregar se ficou 3+ minutos fora
        const away=Date.now()-hiddenAtRef.current;
        if(away>180000)loadFromCloud(false);
      }
    };
    document.addEventListener('visibilitychange',onVisibility);
    return()=>document.removeEventListener('visibilitychange',onVisibility);
  },[dbLoaded,loadFromCloud,getSnap]);

  // Auto-sync a cada mudança de estado
  useEffect(()=>{if(dbLoaded)syncCloud('clientes',clientes);},[clientes,dbLoaded]);
  useEffect(()=>{if(dbLoaded)syncCloud('orcamentos',orcamentos);},[orcamentos,dbLoaded]);
  useEffect(()=>{if(dbLoaded)syncCloud('pedidos',pedidos);},[pedidos,dbLoaded]);
  useEffect(()=>{if(dbLoaded)syncCloud('marceneiros',marceneiros);},[marceneiros,dbLoaded]);
  useEffect(()=>{if(dbLoaded)syncCloud('estoque',estoque);},[estoque,dbLoaded]);
  useEffect(()=>{if(dbLoaded)syncCloud('financeiro',financeiro);},[financeiro,dbLoaded]);
  useEffect(()=>{if(dbLoaded)syncCloud('leads',leads);},[leads,dbLoaded]);
  useEffect(()=>{if(dbLoaded)syncCloud('biblioteca',biblioteca);},[biblioteca,dbLoaded]);
  useEffect(()=>{if(dbLoaded)syncCloud('recebimentos',recebimentos);},[recebimentos,dbLoaded]);
  useEffect(()=>{if(dbLoaded)syncCloud('recorrentes',recorrentes);},[recorrentes,dbLoaded]);
  useEffect(()=>{if(dbLoaded)syncCloud('vendedores',vendedores);},[vendedores,dbLoaded]);
  useEffect(()=>{if(dbLoaded)syncCloud('cortadores',cortadores);},[cortadores,dbLoaded]);
  useEffect(()=>{if(dbLoaded)syncCloud('ordensCort',ordensCort);},[ordensCort,dbLoaded]);

  // Flush antes de fechar a aba — keepalive=true garante que o request complete mesmo após unload
  useEffect(()=>{
    const flush=()=>{
      if(!dbLoaded)return;
      Object.values(syncTimers.current).forEach(t=>clearTimeout(t));
      const snap=getSnap();
      Object.entries(snap).forEach(([k,v])=>{
        const val=k==='financeiro'?_deduplicateFin(v):v;
        localStorage.setItem('erp_'+k,JSON.stringify(val));
        dbSet(k,val,true); // keepalive=true: request sobrevive ao fechamento da aba
      });
    };
    window.addEventListener('beforeunload',flush);
    return()=>window.removeEventListener('beforeunload',flush);
  },[dbLoaded,getSnap]);

  // ── OneSignal: inicializar e vincular usuário logado ──
  useEffect(()=>{
    const appId=import.meta.env.VITE_ONESIGNAL_APP_ID;
    if(!appId)return;
    window.OneSignalDeferred=window.OneSignalDeferred||[];
    window.OneSignalDeferred.push(async(OS)=>{
      try{
        await OS.init({
          appId,
          serviceWorkerParam:{scope:"/"},
          promptOptions:{slidedown:{prompts:[{type:"push",autoPrompt:true,text:{actionMessage:"Ativar notificações de novos pedidos?",acceptButton:"Ativar",cancelButton:"Agora não"}}]}},
        });
        if(user?.id&&user.id!=="admin") await OS.login(user.id);
      }catch{}
    });
  },[user?.id]);

  // ── Notificar marceneiro via Edge Function ──
  const notifyMarceneiro=async(pedido,marcId)=>{
    const m=getMarc(marcId);
    if(!m)return;
    try{
      await fetch("/api/notify",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({marceId:marcId,title:"🔨 Novo pedido atribuído",body:`${pedido.num||"Pedido"} — ${getCli(pedido.clienteId)?.nome||""}`}),
      });
    }catch{}
  };

  // Reconcilia vt dos pedidos com o orçamento vinculado ao carregar (corrige divergências históricas)
  useEffect(()=>{
    if(!dbLoaded)return;
    setPedidos(prev=>{
      let changed=false;
      const next=prev.map(p=>{
        const o=orcamentos.find(x=>x.id===p.orcId);
        if(!o)return p;
        const vtCorreto=Math.max(0,((o.ambientes||[]).reduce((s,a)=>s+(a.valorTotal||0),0))-(o.descontoR||0))*(1-(o.desconto||0)/100);
        if(Math.abs(vtCorreto-p.vt)>0.01){changed=true;return{...p,vt:vtCorreto};}
        return p;
      });
      return changed?next:prev;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[dbLoaded]);

  // Auto-gerar contas recorrentes no mês atual
  // Lock de sessão (recGeradoRef) + guard por dados: nunca gera duas vezes
  useEffect(()=>{
    if(!dbLoaded||recGeradoRef.current)return;
    recGeradoRef.current=true;
    const mes=hojeISO().slice(0,7);
    const recs=recorrentesRef.current.filter(r=>r.ativo);
    if(!recs.length)return;
    setFinanceiro(prev=>{
      // Verifica existência usando _getFinMes para cobrir casos com venc=undefined
      const novas=recs.filter(r=>
        !prev.some(f=>f.recorrenteId===r.id&&_getFinMes(f)===mes)
      ).map(r=>({id:uid(),tipo:r.tipo||"pagar",desc:`${r.desc} ${mes}`,valor:r.valor,valorPago:0,parcelas:[{id:uid(),valor:r.valor,venc:`${mes}-${String(r.dia||1).padStart(2,"0")}`,pago:false,dataPago:""}],categoria:r.categoria||"Outros",recorrenteId:r.id,fornecedor:r.fornecedor||"",status:"aberto"}));
      if(!novas.length)return prev;
      setTimeout(()=>showToast(`${novas.length} conta(s) recorrente(s) gerada(s)!`),200);
      return[...prev,...novas];
    });
  },[dbLoaded]);

  // ── CRUD ──
  const getCli=id=>clientes.find(c=>c.id===id);
  const getMarc=id=>marceneiros.find(m=>m.id===id);
  const totalOrc=o=>(o?.ambientes||[]).reduce((s,a)=>s+(a.valorTotal||0),0);
  const totalOrcFinal=o=>{const t=totalOrc(o);const dR=o?.descontoR||0;const dP=o?.desconto||0;return Math.max(0,t-dR)*(1-dP/100);};
  const totalOrcComNF=o=>{const t=totalOrcFinal(o);return t*(1+(o?.percNF||0)/100);};

  const saveCli=c=>{if(!c.nome?.trim())return showToast("Nome obrigatório","red");if(c.id&&clientes.find(x=>x.id===c.id)){setClientes(p=>p.map(x=>x.id===c.id?{...x,...c}:x))}else{setClientes(p=>[...p,{...c,id:uid()}])}setModal(null);showToast("Cliente salvo!")};

  const criarOrc=cid=>{const o={id:uid(),num:`ORC-${String(orcamentos.length+1).padStart(4,"0")}`,clienteId:cid,data:hoje(),status:"rascunho",ambientes:[],garantia:empresa.garantia||GARANTIA,garantiaE:false,pagamento:empresa.pagamento||PAGAMENTO,pagamentoE:false,markup:MARKUP,desconto:0,vendedorId:"",percNF:0,especificacoes:empresa.especificacoes||ESPECIFICACOES,especificacoesE:false,validade:"30 dias",prazoEntrega:empresa.prazoExecucao||"A combinar"};setOrcamentos(p=>[...p,o]);setOrcAtivo(o.id);setTab("orcamentos");setModal(null);showToast(o.num+" criado!")};
  const updOrc=useCallback((id,fn)=>{
    setOrcamentos(prev=>prev.map(o=>{
      if(o.id!==id)return o;
      const updated=typeof fn==="function"?fn(o):{...o,...fn};
      // Sempre recalcula total e sincroniza pedido/financeiro vinculados se o valor mudou
      const vtOld=Math.max(0,((o.ambientes||[]).reduce((s,a)=>s+(a.valorTotal||0),0))-(o.descontoR||0))*(1-(o.desconto||0)/100);
      const vtFinalNew=Math.max(0,((updated.ambientes||[]).reduce((s,a)=>s+(a.valorTotal||0),0))-(updated.descontoR||0))*(1-(updated.desconto||0)/100);
      const newAmbs=updated.ambientes.map(a=>({nome:a.nome,desc:a.desc,val:a.valorTotal}));
      if(vtFinalNew!==vtOld){
        setPedidos(pp=>pp.map(p=>p.orcId===id?{...p,vt:vtFinalNew,ambs:newAmbs}:p));
        setFinanceiro(ff=>ff.map(f=>{
          if(!f.pedidoId)return f;
          const ped=pedidos.find(p=>p.orcId===id&&p.id===f.pedidoId);
          if(!ped||f.tipo!=="receber")return f;
          const ratio=ped.vt>0?vtFinalNew/ped.vt:1;
          const parcelas=f.parcelas.map(p=>p.pago?p:{...p,valor:+(p.valor*ratio).toFixed(2)});
          return{...f,valor:vtFinalNew,parcelas};
        }));
      } else {
        setPedidos(pp=>pp.map(p=>p.orcId===id?{...p,ambs:newAmbs}:p));
      }
      return updated;
    }));
  },[pedidos]);

  const addAmb=oid=>{const a={id:uid(),nome:"",desc:"",insumos:[],vi:0,valorTotal:0};updOrc(oid,o=>({...o,ambientes:[...o.ambientes,a]}));setAmbAberto(a.id)};
  const updAmb=(oid,aid,d)=>updOrc(oid,o=>({...o,ambientes:o.ambientes.map(a=>a.id===aid?{...a,...d}:a)}));
  const delAmb=(oid,aid)=>{updOrc(oid,o=>({...o,ambientes:o.ambientes.filter(a=>a.id!==aid)}));showToast("Removido","red")};

  const addIns=(oid,aid)=>updOrc(oid,o=>({...o,ambientes:o.ambientes.map(a=>a.id===aid?{...a,insumos:[...a.insumos,{id:uid(),nome:"",qtd:1,vu:0}]}:a)}));
  const addInsFromEst=(oid,aid,e)=>updOrc(oid,o=>{const mk=o.markup||MARKUP;return{...o,ambientes:o.ambientes.map(a=>{if(a.id!==aid)return a;const ins=[...a.insumos,{id:uid(),nome:e.nome,qtd:1,vu:e.custo}];const vi=ins.reduce((s,i)=>s+(i.qtd*i.vu),0);return{...a,insumos:ins,vi,valorTotal:vi*mk}})};});
  const addInsFromBib=(oid,aid,b)=>updOrc(oid,o=>{const mk=o.markup||MARKUP;return{...o,ambientes:o.ambientes.map(a=>{if(a.id!==aid)return a;const ins=[...a.insumos,{id:uid(),nome:b.nome,qtd:1,vu:b.custo}];const vi=ins.reduce((s,i)=>s+(i.qtd*i.vu),0);return{...a,insumos:ins,vi,valorTotal:vi*mk}})};});
  const updIns=(oid,aid,iid,d)=>updOrc(oid,o=>({...o,ambientes:o.ambientes.map(a=>{if(a.id!==aid)return a;const ins=a.insumos.map(i=>i.id===iid?{...i,...d}:i);const vi=ins.reduce((s,i)=>s+(i.qtd*i.vu),0);return{...a,insumos:ins,vi,valorTotal:vi*(o.markup||MARKUP)}})}));
  const delIns=(oid,aid,iid)=>updOrc(oid,o=>({...o,ambientes:o.ambientes.map(a=>{if(a.id!==aid)return a;const ins=a.insumos.filter(i=>i.id!==iid);const vi=ins.reduce((s,i)=>s+(i.qtd*i.vu),0);return{...a,insumos:ins,vi,valorTotal:vi*(o.markup||MARKUP)}})}));
  const updMat=(pid,mid,d)=>setPedidos(prev=>prev.map(p=>{if(p.id!==pid)return p;const mats=p.mats.map(m=>{if(m.id!==mid)return m;const nm={...m,...d};return{...nm,sub:nm.qtd*nm.vu};});const cm=mats.reduce((s,m)=>s+m.sub,0);return{...p,mats,cm};}));
  const addMat=(pid)=>setPedidos(prev=>prev.map(p=>p.id===pid?{...p,mats:[...p.mats,{id:uid(),nome:"",qtd:1,vu:0,sub:0}]}:p));
  const delMat=(pid,mid)=>setPedidos(prev=>prev.map(p=>{if(p.id!==pid)return p;const mats=p.mats.filter(m=>m.id!==mid);const cm=mats.reduce((s,m)=>s+m.sub,0);return{...p,mats,cm};}));

  const gerarPedido=orc=>{
    // Guard: impede duplicata se orçamento já foi aprovado
    if(pedidos.some(x=>x.orcId===orc.id)){showToast("Este orçamento já foi aprovado!","red");return;}
    const mats=[];orc.ambientes.forEach(a=>a.insumos.forEach(i=>{if(i.nome)mats.push({id:uid(),nome:i.nome,qtd:i.qtd,vu:i.vu,sub:i.qtd*i.vu})}));
    const cm=mats.reduce((s,m)=>s+m.sub,0);
    const vtFinal=totalOrcFinal(orc);
    const pid=uid();
    const num=`PED-${String(pedidos.length+1).padStart(4,"0")}`;
    const p={id:pid,num,orcId:orc.id,clienteId:orc.clienteId,data:hoje(),dataEntrega:"",status:"em_espera",marcId:"",stage:"aguardando",mats,cm,vt:vtFinal,comPerc:0,comVal:0,vendedorId:orc.vendedorId||"",percNF:orc.percNF||0,pags:[],arquivos:[],ambs:orc.ambientes.map(a=>({nome:a.nome,desc:a.desc,val:a.valorTotal})),garantia:orc.garantia,pgTermos:orc.pagamento};
    setPedidos(prev=>prev.some(x=>x.orcId===orc.id)?prev:[...prev,p]);
    updOrc(orc.id,{status:"aprovado"});
    // Gera entradas financeiras (fora do setPedidos — nunca chamar setState dentro de setState)
    const parcelas=[{id:uid(),valor:vtFinal*0.5,venc:hojeISO(),pago:false,dataPago:""},{id:uid(),valor:vtFinal*0.3,venc:"",pago:false,dataPago:""},{id:uid(),valor:vtFinal*0.2,venc:"",pago:false,dataPago:""}];
    setFinanceiro(prev=>{
      if(prev.some(f=>f.pedidoId===pid))return prev;
      const novas=[{id:uid(),tipo:"receber",desc:`${num} - ${getCli(orc.clienteId)?.nome}`,valor:vtFinal,valorPago:0,parcelas,pedidoId:pid,clienteId:orc.clienteId,status:"aberto"}];
      if(cm>0)novas.push({id:uid(),tipo:"pagar",desc:`Materiais ${num}`,valor:cm,valorPago:0,parcelas:[{id:uid(),valor:cm,venc:hojeISO(),pago:false,dataPago:""}],pedidoId:pid,fornecedor:"Fornecedor",status:"aberto"});
      if(orc.vendedorId){const vend=vendedores.find(v=>v.id===orc.vendedorId);if(vend){const comVend=vtFinal*(vend.comissao/100);novas.push({id:uid(),tipo:"pagar",desc:`Comissão Vendedor ${vend.nome}`,valor:comVend,valorPago:0,parcelas:[{id:uid(),valor:comVend,venc:"",pago:false,dataPago:""}],pedidoId:pid,vendedorId:vend.id,fornecedor:vend.nome,categoria:"Folha/Comissão",status:"aberto"});}}
      return[...prev,...novas];
    });
    showToast(`Pedido ${num} gerado!`);setTab("pedidos");
  };

  const updPed=useCallback((id,fn)=>setPedidos(p=>p.map(o=>o.id===id?(typeof fn==="function"?fn(o):{...o,...fn}):o)),[]);

  const designarMarc=(pid,mid)=>{
    const m=getMarc(mid);if(!m)return;
    const ped=pedidos.find(x=>x.id===pid);
    const comVal=ped?+(ped.vt*(m.comissao/100)).toFixed(2):0;
    const oldMarcId=ped?.marcId;
    updPed(pid,p=>({...p,marcId:mid,comPerc:m.comissao,comVal,status:"em_producao"}));
    setFinanceiro(prev=>{
      // Remove a entrada de comissão do marceneiro anterior (se não paga)
      let next=prev;
      if(oldMarcId&&oldMarcId!==mid){
        next=prev.filter(f=>!(f.pedidoId===pid&&f.tipo==="pagar"&&f.marcId===oldMarcId&&!(f.valorPago>0)));
      }
      const existing=next.find(f=>f.pedidoId===pid&&f.tipo==="pagar"&&f.marcId===mid);
      if(existing){
        // Atualiza o valor da entrada existente
        return next.map(f=>f.id===existing.id?{...f,valor:comVal,desc:`Comissão ${ped?.num||''} - ${m.nome}`,parcelas:f.parcelas.map(pa=>pa.pago?pa:{...pa,valor:comVal})}:f);
      }
      return[...next,{id:uid(),tipo:"pagar",desc:`Comissão ${ped?.num||''} - ${m.nome}`,valor:comVal,valorPago:0,parcelas:[{id:uid(),valor:comVal,venc:"",pago:false,dataPago:""}],pedidoId:pid,marcId:mid,fornecedor:m.nome,status:"aberto"}];
    });
    showToast(`Designado: ${m.nome}`);
    if(ped) notifyMarceneiro(ped,mid);
  };

  // Recalcula comissões por ambiente: cada marceneiro recebe % sobre os ambientes que executa
  const recalcComissoesMult=(pedId,ambs)=>{
    const ped=pedidos.find(x=>x.id===pedId);if(!ped)return;
    const byMarc={};
    (ambs||[]).forEach(a=>{if(!a.marcId)return;byMarc[a.marcId]=(byMarc[a.marcId]||0)+(a.val||0);});
    setFinanceiro(prev=>{
      let next=[...prev];
      Object.entries(byMarc).forEach(([marcId,total])=>{
        const marc=marceneiros.find(m=>m.id===marcId);if(!marc)return;
        const comVal=+(total*(marc.comissao/100)).toFixed(2);
        const ex=next.find(f=>f.pedidoId===pedId&&f.marcId===marcId&&f.tipo==="pagar");
        if(ex){next=next.map(f=>f.id===ex.id?{...f,valor:comVal,desc:`Comissão ${ped.num||''} - ${marc.nome}`,parcelas:f.parcelas.map(pa=>pa.pago?pa:{...pa,valor:comVal})}:f);}
        else{next=[...next,{id:uid(),tipo:"pagar",desc:`Comissão ${ped.num||''} - ${marc.nome}`,valor:comVal,valorPago:0,parcelas:[{id:uid(),valor:comVal,venc:"",pago:false,dataPago:"",formaPag:"pix"}],pedidoId:pedId,marcId,fornecedor:marc.nome,status:"aberto"}];}
      });
      return next;
    });
  };

  const pagarParcela=(finId,parId,valor,formaPag="")=>{
    setFinanceiro(prev=>prev.map(f=>{
      if(f.id!==finId)return f;
      const parcelas=f.parcelas.map(p=>p.id===parId?{...p,pago:true,dataPago:hojeISO(),valor:+valor||p.valor,formaPag}:p);
      const valorPago=parcelas.filter(p=>p.pago).reduce((s,p)=>s+p.valor,0);
      const status=valorPago>=f.valor?"pago":valorPago>0?"parcial":"aberto";
      return{...f,parcelas,valorPago,status};
    }));
    showToast("Pagamento registrado!");
  };

  const addParcela=(finId)=>{
    setFinanceiro(prev=>prev.map(f=>f.id===finId?{...f,parcelas:[...f.parcelas,{id:uid(),valor:0,venc:"",pago:false,dataPago:""}]}:f));
  };

  const editParcela=(finId,parId,data)=>{
    setFinanceiro(prev=>prev.map(f=>{
      if(f.id!==finId)return f;
      const parcelas=f.parcelas.map(p=>p.id===parId?{...p,...data}:p);
      const valorPago=parcelas.filter(p=>p.pago).reduce((s,p)=>s+p.valor,0);
      const status=valorPago>=f.valor?"pago":valorPago>0?"parcial":"aberto";
      return{...f,parcelas,valorPago,status};
    }));
  };

  const delParcela=(finId,parId)=>{
    setFinanceiro(prev=>prev.map(f=>{
      if(f.id!==finId)return f;
      const parcelas=f.parcelas.filter(p=>p.id!==parId);
      const valorPago=parcelas.filter(p=>p.pago).reduce((s,p)=>s+p.valor,0);
      const status=valorPago>=f.valor?"pago":valorPago>0?"parcial":"aberto";
      return{...f,parcelas,valorPago,status};
    }));
  };
  const updFin=(id,d)=>setFinanceiro(prev=>prev.map(f=>f.id===id?{...f,...d}:f));

  const limparDuplicatas=()=>{
    let removidos=0;
    setFinanceiro(prev=>{
      const seen=new Map();
      const keep=[];
      for(const f of prev){
        let key=null;
        if(f.pedidoId){
          key=`ped|${f.pedidoId}|${f.tipo}|${f.marcId||''}|${f.vendedorId||''}`;
        }else if(f.recorrenteId){
          const mes=f.parcelas[0]?.venc?.slice(0,7)||'';
          key=`rec|${f.recorrenteId}|${mes}`;
        }
        if(key){
          if(seen.has(key)){
            const ex=seen.get(key);
            if((f.valorPago||0)>(ex.valorPago||0)){
              keep.splice(keep.indexOf(ex),1);keep.push(f);seen.set(key,f);
            }
            removidos++;
          }else{seen.set(key,f);keep.push(f);}
        }else{keep.push(f);}
      }
      return keep;
    });
    setTimeout(()=>showToast(`Limpeza concluída! Duplicatas removidas.`),100);
  };

  // Login com proteção contra força bruta
  const BLOCK_LIMIT=5;const BLOCK_MS=15*60*1000;
  const handleLogin=(l,s)=>{
    const key='_la';const bkey='_lb';
    const now=Date.now();
    // Verifica bloqueio ativo
    const blk=JSON.parse(localStorage.getItem(bkey)||'{}');
    if(blk.until&&now<blk.until){
      const min=Math.ceil((blk.until-now)/60000);
      setLoginErr(`Muitas tentativas. Aguarde ${min} minuto${min>1?'s':''} para tentar novamente.`);
      return;
    }
    const lt=(l||"").trim();const st=(s||"").trim();
    const adminLogin=(empresa.loginAdmin||"admin").trim();const adminSenha=(empresa.senhaAdmin||"admin123").trim();
    const ok=(lt===adminLogin&&st===adminSenha)
      ||(()=>{const m=marceneiros.find(x=>x.login?.trim()===lt&&x.senha?.trim()===st&&x.ativo);if(m){setUser({role:"marc",nome:m.nome,id:m.id});setTab("minha_area");setLoginView(null);setLoginErr("");localStorage.setItem('erpUser',JSON.stringify({role:"marc",nome:m.nome,id:m.id}));return true;}return false;})()
      ||(()=>{const c=cortadores.find(x=>x.login?.trim()===lt&&x.senha?.trim()===st&&x.ativo);if(c){setUser({role:"cort",nome:c.nome,id:c.id});setLoginView(null);setLoginErr("");localStorage.setItem('erpUser',JSON.stringify({role:"cort",nome:c.nome,id:c.id}));return true;}return false;})();
    if(lt===adminLogin&&st===adminSenha){
      localStorage.removeItem(key);localStorage.removeItem(bkey);
      const u={role:"admin",nome:"Admin",id:"admin"};setUser(u);localStorage.setItem('erpUser',JSON.stringify(u));setLoginView(null);setLoginErr("");setTab("dashboard");return;
    }
    if(ok)return;
    // Incrementa tentativas falhas
    const att=JSON.parse(localStorage.getItem(key)||'{"count":0}');
    const newCount=(att.count||0)+1;
    if(newCount>=BLOCK_LIMIT){
      const until=now+BLOCK_MS;
      localStorage.setItem(bkey,JSON.stringify({until}));
      localStorage.setItem(key,JSON.stringify({count:0}));
      setLoginErr(`Acesso bloqueado por 15 minutos após ${BLOCK_LIMIT} tentativas incorretas.`);
    } else {
      localStorage.setItem(key,JSON.stringify({count:newCount}));
      const restam=BLOCK_LIMIT-newCount;
      setLoginErr(`Credenciais inválidas. ${restam} tentativa${restam>1?'s':''} restante${restam>1?'s':''}.`);
    }
  };

  // Computed
  const orc=orcamentos.find(o=>o.id===orcAtivo);
  const cliOrc=orc?getCli(orc.clienteId):null;
  const pedAtivoObj=pedidos.find(p=>p.id===pedAtivo);
  const meusP=user?.role==="marc"?pedidos.filter(p=>p.marcId===user.id):[];

  const stats=useMemo(()=>{
    const rec=pedidos.reduce((s,p)=>s+p.vt,0);
    const cMat=pedidos.reduce((s,p)=>s+p.cm,0);
    const cCom=pedidos.reduce((s,p)=>s+p.comVal,0);
    const aReceber=financeiro.filter(f=>f.tipo==="receber").reduce((s,f)=>s+(f.valor-f.valorPago),0)+recebimentos.reduce((s,r)=>s+r.parcelas.filter(p=>!p.pago).reduce((ss,p)=>ss+p.valor,0),0);
    const aPagar=financeiro.filter(f=>f.tipo==="pagar").reduce((s,f)=>s+(f.valor-f.valorPago),0);
    const recCartao=recebimentos.reduce((s,r)=>s+r.parcelas.filter(p=>p.pago&&p.formaPag==="cartao_cred").reduce((ss,p)=>ss+p.valor,0),0);
    const finCartao=financeiro.filter(f=>f.tipo==="receber").reduce((s,f)=>s+f.parcelas.filter(p=>p.pago&&p.formaPag==="cartao_cred").reduce((ss,p)=>ss+p.valor,0),0);
    const cartaoPago=financeiro.filter(f=>f.tipo==="pagar"&&f.fonteCartao).reduce((s,f)=>s+(f.valorPago||0),0);
    const saldoCartao=recCartao+finCartao-cartaoPago;
    const estMinAlert=estoque.filter(e=>e.estoqueMin>0&&e.qtd<=e.estoqueMin).length;
    return{cli:clientes.length,orc:orcamentos.length,ped:pedidos.length,pedEsp:pedidos.filter(p=>p.status==="em_espera").length,pedProd:pedidos.filter(p=>p.status==="em_producao").length,rec,cMat,cCom,lucro:rec-cMat-cCom,aReceber,aPagar,leads:leads.length,leadsQuentes:leads.filter(l=>l.prioridade==="alta").length,estVal:estoque.reduce((s,e)=>s+e.qtd*e.custo,0),saldoCartao,estMinAlert};
  },[clientes,orcamentos,pedidos,financeiro,leads,estoque,recebimentos]);

  // ── CORTADOR APP ──
  if(user?.role==="cort"&&!loginView)return(
    <CortadorApp
      user={user}
      ordensCort={ordensCort}
      setOrdensCort={setOrdensCort}
      setPedidos={setPedidos}
      showToast={showToast}
      onLogout={()=>{setUser(null);localStorage.removeItem('erpUser');setLoginView({l:"",s:""});}}
    />
  );

  // ── MARCENEIRO APP (mobile) ──
  if(user?.role==="marc"&&!loginView)return(
    <MarceneiroApp
      user={user}
      pedidos={pedidos}
      setPedidos={setPedidos}
      clientes={clientes}
      financeiro={financeiro}
      showToast={showToast}
      onRefresh={()=>loadFromCloud(false)}
      ordensCort={ordensCort}
      setOrdensCort={setOrdensCort}
      cortadores={cortadores}
      onLogout={()=>{setUser(null);localStorage.removeItem('erpUser');setLoginView({l:"",s:""});}}
    />
  );

  // ── LOGIN SCREEN ──
  if(!user||loginView){
    const doLogin=()=>handleLogin(loginView?.l,loginView?.s);
    const onKey=e=>{if(e.key==="Enter")doLogin();};
    return(
    <div style={{fontFamily:"var(--ft)",background:"linear-gradient(135deg,#6366f1,#8b5cf6,#ec4899)",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}><style>{CSS}</style>
      <div style={{background:"#fff",borderRadius:24,padding:36,width:380,boxShadow:"var(--sh2)",animation:"scaleIn .3s"}}>
        <div style={{textAlign:"center",marginBottom:28}}><div style={{width:56,height:56,borderRadius:16,background:"var(--prib2)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px",fontSize:28}}>🪵</div><h1 style={{fontSize:22,fontWeight:800,color:"var(--tx)"}}>ERP Marcenaria</h1><p style={{fontSize:12,color:"var(--tx3)",fontWeight:600,marginTop:4}}>Acesse com suas credenciais</p></div>
        <div onKeyDown={onKey}>
          <Field label="Login" value={loginView?.l||""} onChange={v=>setLoginView(p=>({...(p||{}),l:v}))} placeholder="Seu login"/>
          <Field label="Senha" type="password" value={loginView?.s||""} onChange={v=>setLoginView(p=>({...(p||{}),s:v}))} placeholder="••••"/>
        </div>
        {loginErr&&<p style={{color:"var(--rd)",fontSize:12,fontWeight:700,marginBottom:8}}>{loginErr}</p>}
        <Btn onClick={doLogin} style={{width:"100%",justifyContent:"center",marginBottom:8,padding:12}}><I.Lock/> Entrar</Btn>
        {user&&loginView&&<Btn v="ghost" onClick={()=>setLoginView(null)} style={{width:"100%",justifyContent:"center"}}>Voltar ao Admin</Btn>}
      </div>
    </div>
  );}

  // ── NAV ──
  const adminNav=[
    {k:"dashboard",l:"Dashboard",i:<I.Home/>},
    {k:"crm",l:"CRM / Leads",i:<I.Target/>},
    {k:"clientes",l:"Clientes",i:<I.User/>},
    {k:"orcamentos",l:"Orçamentos",i:<I.File/>},
    {k:"pedidos",l:"Pedidos",i:<I.Package/>},
    {k:"kanban",l:"Produção",i:<I.Kanban/>},
    {k:"marceneiros",l:"Marceneiros",i:<I.Hammer/>},
    {k:"vendedores",l:"Vendedores",i:<I.Star/>},
    {k:"financeiro",l:"Financeiro",i:<I.Wallet/>},
    {k:"recebimentos",l:"Recebimentos",i:<I.Dollar/>},
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
    const hj=hojeISO();
    const mesAtual=hj.slice(0,7);
    const nd=d=>{if(!d)return"";if(/^\d{4}-\d{2}-\d{2}/.test(d))return d;const pts=d.split("/");return pts.length===3?`${pts[2]}-${pts[1]}-${pts[0]}`:d;};
    // Semana atual seg→dom
    const hjD=new Date(hj+"T12:00");const dow=hjD.getDay();
    const monD=new Date(hjD);monD.setDate(hjD.getDate()-(dow===0?6:dow-1));
    const sunD=new Date(monD);sunD.setDate(monD.getDate()+6);
    const semIni=monD.toISOString().split("T")[0];
    const semFim=sunD.toISOString().split("T")[0];
    // Todas parcelas financeiro
    const todasParc=financeiro.flatMap(f=>f.parcelas.map(p=>({...p,tipo:f.tipo,desc:f.desc,finId:f.id})));
    // ── MÊS VIGENTE ──
    const mesRecebido=todasParc.filter(p=>p.pago&&p.tipo==="receber"&&nd(p.dataPago).startsWith(mesAtual)).reduce((s,p)=>s+p.valor,0);
    const mesPago_=todasParc.filter(p=>p.pago&&p.tipo==="pagar"&&nd(p.dataPago).startsWith(mesAtual)).reduce((s,p)=>s+p.valor,0);
    const mesAReceber=todasParc.filter(p=>!p.pago&&p.tipo==="receber"&&p.venc?.startsWith(mesAtual)).reduce((s,p)=>s+p.valor,0);
    const mesAPagar=todasParc.filter(p=>!p.pago&&p.tipo==="pagar"&&p.venc?.startsWith(mesAtual)).reduce((s,p)=>s+p.valor,0);
    const mesSaldo=mesRecebido-mesPago_;
    // ── SEMANA ── (inclui pagos e pendentes)
    const parcSemPagRec=todasParc.filter(p=>p.pago&&p.tipo==="receber"&&nd(p.dataPago)>=semIni&&nd(p.dataPago)<=semFim);
    const parcSemPagPag=todasParc.filter(p=>p.pago&&p.tipo==="pagar"&&nd(p.dataPago)>=semIni&&nd(p.dataPago)<=semFim);
    const parcSemPendRec=todasParc.filter(p=>!p.pago&&p.tipo==="receber"&&p.venc&&p.venc>=semIni&&p.venc<=semFim);
    const parcSemPendPag=todasParc.filter(p=>!p.pago&&p.tipo==="pagar"&&p.venc&&p.venc>=semIni&&p.venc<=semFim);
    const semRecTotal=parcSemPagRec.reduce((s,p)=>s+p.valor,0)+parcSemPendRec.reduce((s,p)=>s+p.valor,0);
    const semPagTotal=parcSemPagPag.reduce((s,p)=>s+p.valor,0)+parcSemPendPag.reduce((s,p)=>s+p.valor,0);
    // ── ALERTAS ──
    const atrasados=todasParc.filter(p=>!p.pago&&p.venc&&p.venc<hj);
    const venceHoje=todasParc.filter(p=>!p.pago&&p.venc===hj);
    const atrasadosPag=atrasados.filter(p=>p.tipo==="pagar");
    const atrasadosRec=atrasados.filter(p=>p.tipo==="receber");
    // ── CHARTS ──
    const dreData=[{name:"Receitas",valor:mesRecebido},{name:"Despesas",valor:mesPago_},{name:"A Receber",valor:mesAReceber},{name:"A Pagar",valor:mesAPagar}];
    const nomeMes=new Date(mesAtual+"-15").toLocaleDateString("pt-BR",{month:"long",year:"numeric"});
    // Linha de itens da semana
    const SemRow=({p,pago})=>(<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:"1px solid var(--bd)"}}>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:11,fontWeight:700,color:pago?"var(--tx3)":"var(--tx)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{pago&&"✓ "}{p.desc}</div>
        <div style={{fontSize:9,color:"var(--tx3)",fontWeight:600}}>{pago?`pago ${nd(p.dataPago)}`:`venc. ${p.venc}`}</div>
      </div>
      <span style={{fontWeight:800,fontSize:12,marginLeft:8,flexShrink:0,color:pago?"var(--tx3)":p.tipo==="pagar"?"var(--rd)":"var(--gn)"}}>{R$(p.valor)}</span>
    </div>);
    return(
      <div style={{animation:"fadeIn .3s"}}>
        <SH title="Dashboard" sub={`Bem-vindo! ${hoje()}`} right={<><Btn onClick={()=>setModal({t:"selCli"})}><I.Plus/> Orçamento</Btn><Btn v="secondary" onClick={()=>setModal({t:"editLead",d:{}})}><I.Target/> Novo Lead</Btn></>}/>

        {/* ── ALERTAS ── */}
        {(atrasados.length>0||venceHoje.length>0)&&<div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
          {atrasados.length>0&&<div style={{flex:1,minWidth:220,background:"rgba(239,68,68,.08)",border:"1.5px solid rgba(239,68,68,.25)",borderRadius:"var(--rl)",padding:"12px 16px",display:"flex",gap:12,alignItems:"center"}}>
            <div style={{width:36,height:36,borderRadius:10,background:"var(--rd)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:16,flexShrink:0}}>⚠</div>
            <div><div style={{fontSize:12,fontWeight:800,color:"var(--rd)"}}>Contas Atrasadas!</div>
              <div style={{fontSize:11,color:"var(--tx2)",marginTop:2}}>{atrasadosPag.length} a pagar ({R$(atrasadosPag.reduce((s,p)=>s+p.valor,0))}) · {atrasadosRec.length} a receber ({R$(atrasadosRec.reduce((s,p)=>s+p.valor,0))})</div>
            </div>
            <button onClick={()=>setTab("financeiro")} style={{marginLeft:"auto",padding:"5px 12px",borderRadius:8,border:"1.5px solid var(--rd)",background:"transparent",color:"var(--rd)",fontSize:11,fontWeight:700,cursor:"pointer",flexShrink:0}}>Ver →</button>
          </div>}
          {venceHoje.length>0&&<div style={{flex:1,minWidth:220,background:"rgba(245,158,11,.08)",border:"1.5px solid rgba(245,158,11,.3)",borderRadius:"var(--rl)",padding:"12px 16px",display:"flex",gap:12,alignItems:"center"}}>
            <div style={{width:36,height:36,borderRadius:10,background:"#f59e0b",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:16,flexShrink:0}}>📅</div>
            <div><div style={{fontSize:12,fontWeight:800,color:"#b45309"}}>Vence Hoje</div>
              <div style={{fontSize:11,color:"var(--tx2)",marginTop:2}}>{venceHoje.length} conta{venceHoje.length!==1?"s":""} — {R$(venceHoje.reduce((s,p)=>s+p.valor,0))}</div>
            </div>
            <button onClick={()=>setTab("financeiro")} style={{marginLeft:"auto",padding:"5px 12px",borderRadius:8,border:"1.5px solid #f59e0b",background:"transparent",color:"#b45309",fontSize:11,fontWeight:700,cursor:"pointer",flexShrink:0}}>Ver →</button>
          </div>}
        </div>}

        {/* ── KPIs DO MÊS ── */}
        <div style={{marginBottom:6}}><span style={{fontSize:10,fontWeight:800,color:"var(--tx3)",textTransform:"uppercase",letterSpacing:"1px"}}>Resumo de {nomeMes}</span></div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,marginBottom:18}}>
          {[
            {l:"Recebido",v:mesRecebido,c:"#10b981",bg:"rgba(16,185,129,.08)",icon:"💰"},
            {l:"Pago",v:mesPago_,c:"#ef4444",bg:"rgba(239,68,68,.06)",icon:"📤"},
            {l:"Saldo",v:mesSaldo,c:mesSaldo>=0?"#10b981":"#ef4444",bg:mesSaldo>=0?"rgba(16,185,129,.08)":"rgba(239,68,68,.06)",icon:"📊"},
            {l:"A Receber",v:mesAReceber,c:"#3b82f6",bg:"rgba(59,130,246,.07)",icon:"🔜"},
            {l:"A Pagar",v:mesAPagar,c:"#f59e0b",bg:"rgba(245,158,11,.07)",icon:"⏰"},
          ].map(k=>(
            <div key={k.l} style={{background:k.bg,borderRadius:"var(--rl)",padding:"14px 16px",border:`1.5px solid ${k.c}22`}}>
              <div style={{fontSize:10,fontWeight:800,color:"var(--tx3)",textTransform:"uppercase",marginBottom:6,display:"flex",alignItems:"center",gap:4}}>{k.icon} {k.l}</div>
              <div style={{fontSize:18,fontWeight:800,color:k.c,lineHeight:1}}>{R$(k.v)}</div>
            </div>
          ))}
        </div>

        {/* ── OPERAÇÕES ── */}
        <div style={{display:"flex",gap:10,marginBottom:18,flexWrap:"wrap"}}>
          {[
            {l:"Em Produção",v:stats.pedProd,c:"am",icon:<I.Hammer/>,click:()=>setTab("pedidos")},
            {l:"Aguardando",v:stats.pedEsp,c:"bl",icon:<I.Clock/>,click:()=>setTab("pedidos")},
            {l:"Orçamentos",v:stats.orc,c:"pri",icon:<I.File/>,click:()=>setTab("orcamentos")},
            {l:"Leads Quentes",v:stats.leadsQuentes,c:"pk",icon:<I.Zap/>,click:()=>setTab("crm")},
          ].map(k=>(
            <div key={k.l} onClick={k.click} className="hr" style={{flex:1,minWidth:130,cursor:"pointer",background:"var(--sf)",borderRadius:"var(--rl)",padding:"12px 16px",border:"1.5px solid var(--bd)",display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:36,height:36,borderRadius:10,background:`var(--${k.c}b)`,display:"flex",alignItems:"center",justifyContent:"center",color:`var(--${k.c})`,fontSize:16}}>{k.icon}</div>
              <div><div style={{fontSize:22,fontWeight:800,color:"var(--tx)",lineHeight:1}}>{k.v}</div><div style={{fontSize:10,fontWeight:700,color:"var(--tx3)",marginTop:2}}>{k.l}</div></div>
            </div>
          ))}
        </div>

        {/* ── SEMANA ATUAL ── */}
        <div style={{marginBottom:6,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:10,fontWeight:800,color:"var(--tx3)",textTransform:"uppercase",letterSpacing:"1px"}}>Semana Atual — {isoToBR(semIni)} a {isoToBR(semFim)}</span>
          <div style={{display:"flex",gap:16}}>
            <span style={{fontSize:11,fontWeight:700,color:"var(--gn)"}}>Entradas: {R$(semRecTotal)}</span>
            <span style={{fontSize:11,fontWeight:700,color:"var(--rd)"}}>Saídas: {R$(semPagTotal)}</span>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:18}}>
          {/* A PAGAR */}
          <Card>
            <div style={{padding:"12px 16px 0"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <span style={{fontSize:12,fontWeight:800,color:"var(--rd)"}}>Saídas da Semana</span>
                <div style={{display:"flex",gap:6}}>
                  {parcSemPagPag.length>0&&<Badge color="green">{parcSemPagPag.length} pago{parcSemPagPag.length!==1?"s":""}</Badge>}
                  {parcSemPendPag.length>0&&<Badge color="red">{parcSemPendPag.length} pendente{parcSemPendPag.length!==1?"s":""}</Badge>}
                </div>
              </div>
            </div>
            <div style={{padding:"0 16px 12px",maxHeight:220,overflowY:"auto"}}>
              {parcSemPendPag.length===0&&parcSemPagPag.length===0&&<div style={{fontSize:11,color:"var(--tx3)",padding:"8px 0"}}>Nenhuma saída esta semana</div>}
              {parcSemPendPag.sort((a,b)=>a.venc>b.venc?1:-1).map((p,i)=><SemRow key={i} p={p} pago={false}/>)}
              {parcSemPagPag.length>0&&<div style={{fontSize:9,fontWeight:800,color:"var(--tx3)",textTransform:"uppercase",margin:"8px 0 4px"}}>Já pagos esta semana</div>}
              {parcSemPagPag.sort((a,b)=>nd(a.dataPago)>nd(b.dataPago)?1:-1).map((p,i)=><SemRow key={"pg"+i} p={p} pago={true}/>)}
            </div>
          </Card>
          {/* A RECEBER */}
          <Card>
            <div style={{padding:"12px 16px 0"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <span style={{fontSize:12,fontWeight:800,color:"var(--gn)"}}>Entradas da Semana</span>
                <div style={{display:"flex",gap:6}}>
                  {parcSemPagRec.length>0&&<Badge color="green">{parcSemPagRec.length} recebido{parcSemPagRec.length!==1?"s":""}</Badge>}
                  {parcSemPendRec.length>0&&<Badge color="blue">{parcSemPendRec.length} pendente{parcSemPendRec.length!==1?"s":""}</Badge>}
                </div>
              </div>
            </div>
            <div style={{padding:"0 16px 12px",maxHeight:220,overflowY:"auto"}}>
              {parcSemPendRec.length===0&&parcSemPagRec.length===0&&<div style={{fontSize:11,color:"var(--tx3)",padding:"8px 0"}}>Nenhuma entrada esta semana</div>}
              {parcSemPendRec.sort((a,b)=>a.venc>b.venc?1:-1).map((p,i)=><SemRow key={i} p={p} pago={false}/>)}
              {parcSemPagRec.length>0&&<div style={{fontSize:9,fontWeight:800,color:"var(--tx3)",textTransform:"uppercase",margin:"8px 0 4px"}}>Já recebidos esta semana</div>}
              {parcSemPagRec.sort((a,b)=>nd(a.dataPago)>nd(b.dataPago)?1:-1).map((p,i)=><SemRow key={"pg"+i} p={p} pago={true}/>)}
            </div>
          </Card>
        </div>

        {/* ── GRÁFICO + PEDIDOS ── */}
        <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:14}}>
          <Card><CardHead title={`DRE — ${nomeMes}`}/>
            <div style={{padding:16,height:210}}><ResponsiveContainer><BarChart data={dreData}><CartesianGrid strokeDasharray="3 3" stroke="var(--bd)"/><XAxis dataKey="name" tick={{fontSize:11,fontWeight:700,fill:"var(--tx2)"}}/><YAxis tick={{fontSize:10,fill:"var(--tx3)"}}/><Tooltip formatter={v=>R$(v)}/><Bar dataKey="valor" radius={[8,8,0,0]}>{dreData.map((e,i)=><Cell key={i} fill={["#10b981","#ef4444","#3b82f6","#f59e0b"][i]}/>)}</Bar></BarChart></ResponsiveContainer></div>
          </Card>
          <Card><CardHead title="Pedidos Recentes" right={<Btn v="ghost" small onClick={()=>setTab("pedidos")}>Ver todos</Btn>}/>
            {pedidos.slice(-5).reverse().map(p=>{const c=getCli(p.clienteId);return(
              <div key={p.id} className="hr" onClick={()=>{setPedAtivo(p.id);setTab("pedidos")}} style={{padding:"9px 16px",borderBottom:"1px solid var(--bd)",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div><div style={{fontSize:12,fontWeight:800,color:"var(--pri)"}}>{p.num}</div><div style={{fontSize:10,color:"var(--tx3)",marginTop:1}}>{c?.nome}</div></div>
                <div style={{textAlign:"right"}}><div style={{fontSize:12,fontWeight:700,color:"var(--tx)"}}>{R$(p.vt)}</div><Badge color={p.status==="concluido"?"green":p.status==="em_producao"?"amber":"blue"}>{p.status==="em_espera"?"Espera":p.status==="em_producao"?"Produção":"Concluído"}</Badge></div>
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
  const PgOrc=()=>{const [catMode,setCatMode]=useState(null);const [bibForm,setBibForm]=useState(null);
    if(orc){const ambs=orc.ambientes;return(
      <div style={{animation:"fadeIn .3s"}}>
        <button onClick={()=>setOrcAtivo(null)} style={{background:"none",border:"none",color:"var(--pri)",fontSize:11,fontWeight:700,marginBottom:6,cursor:"pointer"}}>← Voltar</button>
        <SH title={orc.num} sub={`${cliOrc?.nome} • ${orc.data}`} right={<><select value={orc.status} onChange={e=>updOrc(orc.id,{status:e.target.value})} style={{padding:"8px 12px",borderRadius:10,border:"1.5px solid var(--bd)",background:"var(--sf)",color:"var(--tx)",fontSize:11,fontWeight:700,outline:"none"}}><option value="rascunho">Rascunho</option><option value="enviado">Enviado</option><option value="aprovado">Aprovado</option><option value="rejeitado">Rejeitado</option></select><Btn v="secondary" small onClick={()=>setModal({t:"pdf",d:orc})}><I.Printer/> Ver / Baixar PDF</Btn>{orc.status!=="aprovado"&&<Btn small onClick={()=>gerarPedido(orc)}>Aprovar → Pedido</Btn>}</>}/>
        <div style={{background:"linear-gradient(135deg,#6366f1,#8b5cf6)",borderRadius:"var(--rl)",padding:"20px 24px",marginBottom:18,display:"flex",justifyContent:"space-between",alignItems:"center",color:"#fff",boxShadow:"0 4px 20px rgba(99,102,241,.3)"}}>
          <div><span style={{fontSize:10,fontWeight:800,textTransform:"uppercase",opacity:.8}}>Valor Total (Cliente)</span><div style={{fontSize:28,fontWeight:800,marginTop:2}}>{R$(totalOrcFinal(orc))}</div>{(orc.desconto>0||orc.descontoR>0)&&<div style={{fontSize:11,opacity:.8}}>Sem desconto: {R$(totalOrc(orc))}{orc.descontoR>0&&` • -${R$(orc.descontoR)}`}{orc.desconto>0&&` • -${orc.desconto}%`}</div>}{(orc.percNF>0)&&<div style={{fontSize:11,marginTop:4,background:"rgba(255,255,255,.15)",borderRadius:8,padding:"3px 8px",display:"inline-block"}}>Admin c/ NF ({orc.percNF}%): {R$(totalOrcComNF(orc))}</div>}</div>
          <div style={{textAlign:"right",display:"flex",flexDirection:"column",gap:8,alignItems:"flex-end"}}>
            <span style={{fontSize:11,opacity:.8}}>{ambs.length} ambiente{ambs.length!==1?"s":""}</span>
            <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",justifyContent:"flex-end"}}>
              <span style={{fontSize:10,opacity:.7}}>Markup ×</span>
              <BlurInput type="number" value={orc.markup||MARKUP} onCommit={v=>updOrc(orc.id,{markup:Math.max(1,+v||MARKUP)})} step="0.1" style={{width:58,padding:"3px 6px",borderRadius:6,border:"none",background:"rgba(255,255,255,.2)",color:"#fff",fontSize:12,fontWeight:700,textAlign:"center",outline:"none"}}/>
              <span style={{fontSize:10,opacity:.7}}>Desc%</span>
              <input type="number" value={orc.desconto||0} onChange={e=>updOrc(orc.id,{desconto:Math.min(100,Math.max(0,+e.target.value||0))})} step="1" style={{width:48,padding:"3px 6px",borderRadius:6,border:"none",background:"rgba(255,255,255,.2)",color:"#fff",fontSize:12,fontWeight:700,textAlign:"center",outline:"none"}}/>
              <span style={{fontSize:10,opacity:.7}}>Desc R$</span>
              <input type="number" value={orc.descontoR||0} onChange={e=>updOrc(orc.id,{descontoR:Math.max(0,+e.target.value||0)})} step="0.01" style={{width:72,padding:"3px 6px",borderRadius:6,border:"none",background:"rgba(255,255,255,.2)",color:"#fff",fontSize:12,fontWeight:700,textAlign:"center",outline:"none"}}/>
              <span style={{fontSize:10,opacity:.7}}>NF%</span>
              <BlurInput type="number" value={orc.percNF||0} onCommit={v=>updOrc(orc.id,{percNF:Math.min(100,Math.max(0,+v||0))})} step="0.1" style={{width:48,padding:"3px 6px",borderRadius:6,border:"none",background:"rgba(255,255,255,.2)",color:"#fff",fontSize:12,fontWeight:700,textAlign:"center",outline:"none"}}/>
            </div>
            {vendedores.length>0&&<div style={{display:"flex",gap:8,alignItems:"center",justifyContent:"flex-end",marginTop:6}}>
              <span style={{fontSize:10,opacity:.7}}>Vendedor</span>
              <select value={orc.vendedorId||""} onChange={e=>updOrc(orc.id,{vendedorId:e.target.value})} style={{padding:"3px 8px",borderRadius:6,border:"none",background:"rgba(255,255,255,.2)",color:"#fff",fontSize:11,fontWeight:700,outline:"none"}}>
                <option value="" style={{color:"#000"}}>Nenhum</option>
                {vendedores.filter(v=>v.ativo).map(v=><option key={v.id} value={v.id} style={{color:"#000"}}>{v.nome} ({v.comissao}%)</option>)}
              </select>
              {orc.vendedorId&&<span style={{fontSize:10,opacity:.8}}>Com. R$ {R$(totalOrcFinal(orc)*(vendedores.find(v=>v.id===orc.vendedorId)?.comissao||0)/100)}</span>}
            </div>}
          </div>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><h3 style={{fontSize:14,fontWeight:800,color:"var(--tx)"}}>Ambientes</h3><Btn small onClick={()=>addAmb(orc.id)}><I.Plus/> Ambiente</Btn></div>
        {ambs.map((a,i)=>{const op=ambAberto===a.id;return(
          <Card key={a.id} style={{marginBottom:8}}>
            <div onClick={()=>setAmbAberto(op?null:a.id)} style={{padding:"12px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",borderBottom:op?"1.5px solid var(--bd)":"none"}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:26,height:26,borderRadius:8,background:"var(--prib2)",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--pri)",fontSize:11,fontWeight:800}}>{i+1}</div><span style={{fontWeight:700,fontSize:13,color:"var(--tx)"}}>{a.nome||"Sem nome"}</span></div>
              <div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontWeight:800,fontSize:15,color:"var(--pri)",minWidth:140,textAlign:"right"}}>{R$(a.valorTotal)}</span><I.Chev d={op?"up":"down"}/></div>
            </div>
            {op&&<div style={{padding:16}}>
              <Field label="Nome" value={a.nome} onChange={v=>updAmb(orc.id,a.id,{nome:v})} placeholder="Ex: Cozinha, Closet..." commitOnBlur/>
              <Field label="Descrição" value={a.desc} onChange={v=>updAmb(orc.id,a.id,{desc:v})} placeholder="Medidas, acabamentos..." rows={2} commitOnBlur/>
              {/* Modo: valor fixo ou por insumos */}
              <div style={{display:"flex",gap:6,marginBottom:10}}>
                <button onClick={()=>updAmb(orc.id,a.id,{modoFixo:false})} style={{flex:1,padding:"7px 0",borderRadius:8,border:"1.5px solid "+(a.modoFixo?"var(--bd)":"var(--pri)"),background:a.modoFixo?"transparent":"var(--prib)",color:a.modoFixo?"var(--tx3)":"var(--pri)",fontSize:11,fontWeight:700,cursor:"pointer"}}>📋 Por Insumos</button>
                <button onClick={()=>updAmb(orc.id,a.id,{modoFixo:true})} style={{flex:1,padding:"7px 0",borderRadius:8,border:"1.5px solid "+(a.modoFixo?"var(--pri)":"var(--bd)"),background:a.modoFixo?"var(--prib)":"transparent",color:a.modoFixo?"var(--pri)":"var(--tx3)",fontSize:11,fontWeight:700,cursor:"pointer"}}>💰 Valor Direto</button>
              </div>
              {a.modoFixo?(
                <div style={{marginBottom:10}}>
                  <label style={{display:"block",fontSize:13,fontWeight:800,color:"var(--tx2)",textTransform:"uppercase",letterSpacing:".5px",marginBottom:5}}>Valor do Ambiente R$</label>
                  <input type="number" defaultValue={a.valorTotal||""} onBlur={e=>updAmb(orc.id,a.id,{valorTotal:+e.target.value,vi:+e.target.value})} step="0.01" placeholder="0,00" style={{width:"100%",minWidth:220,padding:"10px 12px",borderRadius:"var(--r)",border:"1.5px solid var(--pri)",background:"var(--sf)",color:"var(--tx)",fontSize:18,fontWeight:800,outline:"none"}}/>
                </div>
              ):(
                <div style={{background:"var(--bg)",borderRadius:"var(--r)",padding:"12px 14px",border:"1.5px solid var(--bd)",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <div style={{fontSize:12}}><span style={{color:"var(--tx3)",fontWeight:600}}>Custo: </span><span style={{fontWeight:700,color:"var(--tx2)"}}>{R$(a.vi)}</span><span style={{color:"var(--tx3)",fontWeight:600,marginLeft:4}}>× {orc.markup||MARKUP} = </span><span style={{fontWeight:800,color:"var(--pri)"}}>{R$(a.valorTotal)}</span></div>
                  <Btn small v="secondary" onClick={()=>setInsModal(a.id)}><I.Calc/> Insumos</Btn>
                </div>
              )}
              <div style={{textAlign:"right"}}><Btn v="danger" small onClick={()=>delAmb(orc.id,a.id)}><I.Trash/></Btn></div>
            </div>}
          </Card>
        )})}
        {/* Prazo / Validade */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginTop:20}}>
          {[{k:"prazoEntrega",l:"Prazo de Entrega",pd:empresa.prazoExecucao||"A combinar"},{k:"validade",l:"Validade do Orçamento",pd:"30 dias"}].map(s=>(
            <Card key={s.k} style={{padding:16}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <h4 style={{fontSize:11,fontWeight:800,color:"var(--tx)",textTransform:"uppercase",letterSpacing:".3px"}}>{s.l}</h4>
                {orc[s.k+"E"]
                  ?<Btn small onClick={()=>updOrc(orc.id,{[s.k+"E"]:false})}><I.Check/></Btn>
                  :<Btn v="ghost" small onClick={()=>updOrc(orc.id,{[s.k+"E"]:true})}><I.Edit/></Btn>}
              </div>
              {orc[s.k+"E"]
                ?<Field value={orc[s.k]||s.pd} onChange={v=>updOrc(orc.id,{[s.k]:v})} placeholder={s.pd} commitOnBlur/>
                :<div style={{fontSize:13,fontWeight:700,color:"var(--pri)"}}>{orc[s.k]||s.pd}</div>}
            </Card>
          ))}
        </div>
        {/* Garantia/Pagamento */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginTop:14}}>
          {[{k:"garantia",l:"Garantia",ek:"garantiaE",pd:GARANTIA},{k:"pagamento",l:"Pagamento",ek:"pagamentoE",pd:PAGAMENTO},{k:"especificacoes",l:"Especificações",ek:"especificacoesE",pd:ESPECIFICACOES}].map(s=>(
            <Card key={s.k} style={{padding:16}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <h4 style={{fontSize:16,fontWeight:800,color:"var(--tx)",textTransform:"uppercase"}}>{s.l}</h4>
                {orc[s.ek]?<div style={{display:"flex",gap:4}}><Btn v="ghost" small onClick={()=>updOrc(orc.id,{[s.k]:s.pd,[s.ek]:false})}>Reset</Btn><Btn small onClick={()=>updOrc(orc.id,{[s.ek]:false})}><I.Check/></Btn></div>
                :<Btn v="ghost" small onClick={()=>updOrc(orc.id,{[s.ek]:true})}><I.Edit/></Btn>}
              </div>
              {orc[s.ek]?<Field value={orc[s.k]} onChange={v=>updOrc(orc.id,{[s.k]:v})} rows={5} commitOnBlur/>
              :<div style={{fontSize:12,color:"var(--tx2)",whiteSpace:"pre-line",lineHeight:1.5,fontWeight:500}}>{orc[s.k]}</div>}
            </Card>
          ))}
        </div>
        {insModal&&orc.ambientes.find(a=>a.id===insModal)&&(()=>{
          const amb=orc.ambientes.find(a=>a.id===insModal);
          const getBibQty=b=>amb.insumos.find(i=>i.bibId===b.id||(!i.bibId&&i.nome===b.nome))?.qtd||0;
          const setBibQty=(b,raw)=>{
            const q=Math.max(0,+raw||0);
            updOrc(orc.id,o=>{const mk=o.markup||MARKUP;return{...o,ambientes:o.ambientes.map(a=>{if(a.id!==amb.id)return a;let ins=a.insumos.filter(i=>!(i.bibId===b.id||(!i.bibId&&i.nome===b.nome)));if(q>0)ins=[...ins,{id:uid(),nome:b.nome,qtd:q,vu:b.custo,bibId:b.id}];const vi=ins.reduce((s,i)=>s+i.qtd*i.vu,0);return{...a,insumos:ins,vi,valorTotal:vi*mk};})};});
          };
          const manualIns=amb.insumos.filter(i=>!i.bibId);
          return(
            <Modal onClose={()=>setInsModal(null)} wide>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <div><h2 style={{fontSize:16,fontWeight:800,color:"var(--tx)"}}>Insumos — {amb.nome||"?"}</h2><p style={{fontSize:11,color:"var(--rd)",fontWeight:700,marginTop:2}}>⚠ Dados internos — NÃO vão na proposta</p></div>
                <button onClick={()=>setInsModal(null)} style={{background:"none",border:"none",color:"var(--tx3)"}}><I.X/></button>
              </div>

              {/* ── BIBLIOTECA: grade com qty direta ── */}
              <div style={{fontSize:10,fontWeight:800,color:"var(--tx3)",textTransform:"uppercase",letterSpacing:".7px",marginBottom:6}}>📚 Biblioteca — coloque as quantidades</div>
              {biblioteca.length===0
                ?<div style={{padding:"12px 14px",background:"var(--amb)",borderRadius:"var(--r)",border:"1.5px dashed var(--bd)",fontSize:12,color:"var(--tx3)",marginBottom:14}}>Biblioteca vazia — cadastre insumos na aba <strong>Estoque → Biblioteca</strong> primeiro.</div>
                :<div style={{border:"1.5px solid var(--bd)",borderRadius:"var(--r)",overflow:"hidden",marginBottom:14}}>
                  <div style={{display:"grid",gridTemplateColumns:"2fr 55px 100px 80px 90px",background:"var(--bg)",padding:"7px 12px",borderBottom:"1.5px solid var(--bd)"}}>
                    {["Insumo","Un.","Custo un.","Qtd","Subtotal"].map(h=><span key={h} style={{fontSize:9,fontWeight:800,textTransform:"uppercase",letterSpacing:".6px",color:"var(--tx3)"}}>{h}</span>)}
                  </div>
                  {biblioteca.map(b=>{const q=getBibQty(b);return(
                    <div key={b.id} style={{display:"grid",gridTemplateColumns:"2fr 55px 100px 80px 90px",padding:"8px 12px",borderBottom:"1px solid var(--bd)",alignItems:"center",background:q>0?"var(--prib)":"transparent",transition:"background .15s"}}>
                      <span style={{fontSize:12,fontWeight:q>0?700:500,color:q>0?"var(--pri)":"var(--tx)"}}>{b.nome}</span>
                      <span style={{fontSize:11,color:"var(--tx3)"}}>{b.un||"—"}</span>
                      <span style={{fontSize:11,color:"var(--tx2)"}}>{R$(b.custo)}</span>
                      <BlurInput type="number" value={q||""} onCommit={v=>setBibQty(b,v)} placeholder="0" style={{width:"100%",padding:"5px 6px",borderRadius:7,border:`1.5px solid ${q>0?"var(--pri)":"var(--bd)"}`,background:"var(--sf)",color:"var(--tx)",fontSize:13,fontWeight:q>0?700:400,outline:"none",textAlign:"center"}}/>
                      <span style={{fontSize:12,fontWeight:700,color:q>0?"var(--pri)":"var(--tx3)",textAlign:"right",paddingRight:4}}>{q>0?R$(q*b.custo):"—"}</span>
                    </div>
                  );})}
                </div>
              }

              {/* ── ITENS MANUAIS (não vinculados à biblioteca) ── */}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                <span style={{fontSize:10,fontWeight:800,color:"var(--tx3)",textTransform:"uppercase",letterSpacing:".7px"}}>✏ Itens manuais</span>
                <Btn v="ghost" small onClick={()=>addIns(orc.id,amb.id)}><I.Plus/> Adicionar</Btn>
              </div>
              {manualIns.length>0&&<>
                <div style={{display:"grid",gridTemplateColumns:"2fr 70px 110px 110px 30px",gap:6,padding:"6px 0",borderBottom:"1.5px solid var(--bd)"}}>
                  {["Insumo","Qtd","Vl.Unit","Subtotal",""].map(h=><span key={h} style={{fontSize:9,fontWeight:800,textTransform:"uppercase",letterSpacing:".6px",color:"var(--tx3)"}}>{h}</span>)}
                </div>
                {manualIns.map(ins=><div key={ins.id} style={{display:"grid",gridTemplateColumns:"2fr 70px 110px 110px 30px",gap:6,padding:"5px 0",alignItems:"center",borderBottom:"1.5px solid var(--bd)"}}>
                  <BlurInput value={ins.nome} onCommit={v=>updIns(orc.id,amb.id,ins.id,{nome:v})} placeholder="Material" style={{width:"100%",padding:"7px 9px",borderRadius:8,border:"1.5px solid var(--bd)",background:"var(--sf)",color:"var(--tx)",fontSize:12,fontWeight:500,outline:"none"}}/>
                  <BlurInput type="number" value={ins.qtd} onCommit={v=>updIns(orc.id,amb.id,ins.id,{qtd:Math.max(0,+v)})} style={{width:"100%",padding:"7px",borderRadius:8,border:"1.5px solid var(--bd)",background:"var(--sf)",color:"var(--tx)",fontSize:12,outline:"none",textAlign:"center"}}/>
                  <BlurInput type="number" value={ins.vu} onCommit={v=>updIns(orc.id,amb.id,ins.id,{vu:Math.max(0,+v)})} step="0.01" style={{width:"100%",padding:"7px",borderRadius:8,border:"1.5px solid var(--bd)",background:"var(--sf)",color:"var(--tx)",fontSize:12,outline:"none"}}/>
                  <span style={{fontSize:12,fontWeight:700,color:"var(--tx)"}}>{R$(ins.qtd*ins.vu)}</span>
                  <button onClick={()=>delIns(orc.id,amb.id,ins.id)} style={{background:"none",border:"none",color:"var(--rd)",padding:2}}><I.Trash/></button>
                </div>)}
              </>}
              {manualIns.length===0&&<div style={{fontSize:11,color:"var(--tx3)",padding:"6px 0 10px",fontStyle:"italic"}}>Nenhum item manual adicionado.</div>}

              {/* ── Total ── */}
              <div style={{background:"var(--bg)",borderRadius:"var(--r)",padding:"14px 16px",marginTop:14,border:"1.5px solid var(--bd)"}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:12,fontWeight:600,marginBottom:6,color:"var(--tx2)"}}><span>Total Insumos</span><span>{R$(amb.vi)}</span></div>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:12,fontWeight:600,marginBottom:6,color:"var(--tx2)"}}><span>Markup</span><span style={{color:"var(--pri)"}}>× {orc.markup||MARKUP}</span></div>
                <div style={{borderTop:"1.5px solid var(--bd)",paddingTop:8,display:"flex",justifyContent:"space-between",fontWeight:800,fontSize:16}}><span style={{color:"var(--tx)"}}>Final Ambiente</span><span style={{color:"var(--pri)"}}>{R$(amb.valorTotal)}</span></div>
              </div>
              <div style={{textAlign:"right",marginTop:12}}><Btn onClick={()=>setInsModal(null)}><I.Check/> OK</Btn></div>
            </Modal>
          );
        })()}
      </div>
    )}
    return(<div style={{animation:"fadeIn .3s"}}><SH title="Orçamentos" sub={`${orcamentos.length} total`} right={<Btn onClick={()=>setModal({t:"selCli"})}><I.Plus/> Novo</Btn>}/>
      <Card><TH cols={[{l:"Nº",w:"90px"},{l:"Cliente",w:"2fr"},{l:"Data",w:"1fr"},{l:"Status",w:"90px"},{l:"Valor",w:"110px"},{l:"",w:"60px"}]}/>
      {orcamentos.map(o=>{const c=getCli(o.clienteId);return(<div key={o.id} onClick={()=>setOrcAtivo(o.id)} className="hr" style={{display:"grid",gridTemplateColumns:"90px 2fr 1fr 90px 110px 60px",gap:6,padding:"10px 18px",borderBottom:"1.5px solid var(--bd)",alignItems:"center",cursor:"pointer",fontSize:12}}>
        <span style={{fontWeight:800,color:"var(--pri)"}}>{o.num}</span><span style={{color:"var(--tx)",fontWeight:600}}>{c?.nome}</span><span style={{color:"var(--tx3)"}}>{o.data}</span>
        <Badge color={o.status==="aprovado"?"green":o.status==="rejeitado"?"red":"pri"}>{o.status}</Badge>
        <span style={{fontWeight:700,color:"var(--tx)"}}>{R$(totalOrcFinal(o))}</span>
        <button onClick={e=>{e.stopPropagation();setOrcamentos(p=>p.filter(x=>x.id!==o.id));showToast("Removido","red")}} style={{background:"none",border:"none",color:"var(--rd)",padding:3}}><I.Trash/></button>
      </div>)})}{orcamentos.length===0&&<div style={{padding:30,textAlign:"center",color:"var(--tx3)",fontSize:12,fontWeight:600}}>Nenhum orçamento</div>}</Card></div>);
  };

  // PEDIDOS
  const PgPed=()=>{
    if(pedAtivoObj){const p=pedAtivoObj;const c=getCli(p.clienteId);const m=getMarc(p.marcId);const fin=financeiro.find(f=>f.pedidoId===p.id&&f.tipo==="receber");
    return(<div style={{animation:"fadeIn .3s"}}>
      <button onClick={()=>setPedAtivo(null)} style={{background:"none",border:"none",color:"var(--pri)",fontSize:11,fontWeight:700,marginBottom:6,cursor:"pointer"}}>← Voltar</button>
      <SH title={p.num} sub={`${c?.nome} • ${p.data}`} right={<div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
        {p.status!=="cancelado"&&<select value={p.stage} onChange={e=>updPed(p.id,{stage:e.target.value,status:e.target.value==="concluido"?"concluido":"em_producao"})} style={{padding:"7px 10px",borderRadius:10,border:"1.5px solid var(--bd)",background:"var(--sf)",color:"var(--tx)",fontSize:11,fontWeight:700,outline:"none"}}>{KCOLS.map(k=><option key={k.id} value={k.id}>{k.label}</option>)}</select>}
        <Badge color={p.status==="concluido"?"green":p.status==="em_producao"?"amber":p.status==="cancelado"?"red":"blue"}>{p.status==="cancelado"?"Cancelado":p.status.replace("_"," ")}</Badge>
        {(()=>{const orc=orcamentos.find(x=>x.id===p.orcId);return orc&&<Btn v="secondary" small onClick={()=>setModal({t:"pdf",d:orc,tab:"os"})}><I.Printer/> OS PDF</Btn>})()}
        <Btn v="ghost" small onClick={()=>{const numProx=1+(financeiro.filter(f=>f.reciboNum).length||0);setModal({t:"recibo",pedido:p,numProx});}}><I.Printer/> Recibo</Btn>
        {p.status!=="cancelado"
          ?<Btn v="ghost" small style={{color:"var(--rd)",border:"1px solid rgba(239,68,68,.3)"}} onClick={()=>{if(window.confirm(`Cancelar o pedido ${p.num}? Essa ação não pode ser desfeita.`)){updPed(p.id,{status:"cancelado",stage:"cancelado",marcId:null});showToast("Pedido cancelado","red");}}}><I.X/> Cancelar Pedido</Btn>
          :<div style={{display:"flex",gap:6}}><Btn v="ghost" small onClick={()=>{if(window.confirm("Reativar este pedido?"))updPed(p.id,{status:"em_espera",stage:"corte"});}}><I.Check/> Reativar</Btn><Btn v="ghost" small style={{color:"var(--rd)",border:"1px solid rgba(239,68,68,.3)"}} onClick={()=>{if(window.confirm(`Excluir permanentemente o pedido ${p.num}? Esta ação não pode ser desfeita.`)){setPedidos(prev=>prev.filter(x=>x.id!==p.id));setFinanceiro(prev=>prev.filter(f=>f.pedidoId!==p.id));setPedAtivo(null);showToast("Pedido excluído","red");}}}><I.Trash/> Excluir</Btn></div>}
      </div>}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:16}}>
        <Card style={{padding:16}}><span style={{fontSize:10,fontWeight:800,textTransform:"uppercase",color:"var(--tx3)"}}>Valor do Pedido</span>
          <input type="number" defaultValue={p.vt} key={p.vt} onBlur={e=>{
            const novo=Math.max(0,+e.target.value||0);
            const novaComissao=m?+(novo*(m.comissao/100)).toFixed(2):0;
            updPed(p.id,{vt:novo,comVal:novaComissao});
            // Atualiza financeiro vinculado
            setFinanceiro(ff=>ff.map(f=>{
              if(f.pedidoId!==p.id)return f;
              if(f.tipo==="receber"){
                const ratio=f.valor>0?novo/f.valor:1;
                const parcelas=f.parcelas.map(pa=>pa.pago?pa:{...pa,valor:+(pa.valor*ratio).toFixed(2)});
                return{...f,valor:novo,parcelas};
              }
              if(f.tipo==="pagar"&&f.marcId===p.marcId&&novaComissao>0){
                const ratio=f.valor>0?novaComissao/f.valor:1;
                const parcelas=f.parcelas.map(pa=>pa.pago?pa:{...pa,valor:+(pa.valor*ratio).toFixed(2)});
                return{...f,valor:novaComissao,parcelas};
              }
              return f;
            }));
            showToast("Valor atualizado!");
          }} step="0.01" style={{width:"100%",padding:"4px 0",border:"none",borderBottom:"2px solid var(--pri)",background:"transparent",color:"var(--pri)",fontSize:22,fontWeight:800,marginTop:4,outline:"none"}}/>
        </Card>
        <Card style={{padding:16}}><span style={{fontSize:10,fontWeight:800,textTransform:"uppercase",color:"var(--tx3)"}}>Marceneiro</span>
          {m&&<div style={{fontSize:13,fontWeight:700,color:"var(--tx)",marginTop:4,marginBottom:6}}>{m.nome} <Badge color="pri">{p.comPerc}%</Badge></div>}
          <select value={p.marcId||""} onChange={e=>{
            if(e.target.value){designarMarc(p.id,e.target.value);}
            else{
              // Remove marceneiro: limpa comissão não paga e zera marcId
              const oldMarcId=p.marcId;
              updPed(p.id,pp=>({...pp,marcId:"",comPerc:0,comVal:0}));
              if(oldMarcId)setFinanceiro(prev=>prev.filter(f=>!(f.pedidoId===p.id&&f.tipo==="pagar"&&f.marcId===oldMarcId&&!(f.valorPago>0))));
              showToast("Marceneiro removido");
            }
          }} style={{width:"100%",padding:"7px",borderRadius:8,border:"1.5px solid var(--bd)",background:"var(--sf)",color:"var(--tx)",fontSize:12,outline:"none",marginTop:m?2:6}}>
            <option value="">{m?"— Remover marceneiro —":"Selecionar..."}</option>
            {marceneiros.filter(x=>x.ativo).map(x=><option key={x.id} value={x.id}>{x.nome} ({x.comissao}%)</option>)}
          </select>
        </Card>
        <Card style={{padding:16}}><span style={{fontSize:10,fontWeight:800,textTransform:"uppercase",color:"var(--tx3)"}}>Prazo de Entrega</span><input type="date" value={p.dataEntrega} onChange={e=>updPed(p.id,{dataEntrega:e.target.value})} style={{width:"100%",padding:"7px",borderRadius:8,border:"1.5px solid var(--bd)",background:"var(--sf)",color:"var(--tx)",fontSize:12,outline:"none",marginTop:6}}/>{p.dataInstalacao&&<div style={{marginTop:8,padding:"8px 10px",background:"var(--ppb)",borderRadius:8}}><div style={{fontSize:9,fontWeight:800,color:"var(--pp)",textTransform:"uppercase",marginBottom:3}}>📅 Instalação (marceneiro)</div><div style={{fontSize:12,fontWeight:700,color:"var(--pp)"}}>{p.dataInstalacao} • {p.diasPrevistos||"?"} dia(s)</div></div>}</Card>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:14}}>
        <Card style={{padding:14}}><span style={{fontSize:9,fontWeight:800,textTransform:"uppercase",color:"var(--tx3)",display:"block",marginBottom:4}}>Cliente</span>
          <select value={p.clienteId||""} onChange={e=>updPed(p.id,{clienteId:e.target.value})} style={{width:"100%",padding:"7px",borderRadius:8,border:"1.5px solid var(--bd)",background:"var(--sf)",color:"var(--tx)",fontSize:12,outline:"none",fontWeight:600}}>
            <option value="">— Selecionar —</option>
            {clientes.map(cl=><option key={cl.id} value={cl.id}>{cl.nome}</option>)}
          </select>
        </Card>
        <Card style={{padding:14}}><span style={{fontSize:9,fontWeight:800,textTransform:"uppercase",color:"var(--tx3)",display:"block",marginBottom:4}}>Data do Pedido</span>
          <input type="date" value={(p.data||"").split("/").reverse().join("-").replace(/(\d{2})-(\d{2})-(\d{4})/,"$3-$2-$1")||p.data||""} onChange={e=>{const d=e.target.value;const br=d.split("-").reverse().join("/");updPed(p.id,{data:br});}} style={{width:"100%",padding:"7px",borderRadius:8,border:"1.5px solid var(--bd)",background:"var(--sf)",color:"var(--tx)",fontSize:12,outline:"none"}}/>
        </Card>
        <Card style={{padding:14}}><span style={{fontSize:9,fontWeight:800,textTransform:"uppercase",color:"var(--tx3)",display:"block",marginBottom:4}}>Nº do Pedido</span>
          <BlurInput value={p.num||""} onCommit={v=>updPed(p.id,{num:v})} style={{width:"100%",padding:"7px",borderRadius:8,border:"1.5px solid var(--bd)",background:"var(--sf)",color:"var(--tx)",fontSize:12,outline:"none",fontWeight:700}}/>
        </Card>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <Card><CardHead title="Materiais" right={<Btn v="ghost" small onClick={()=>addMat(p.id)}><I.Plus/> Item</Btn>}/><div style={{padding:14}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 55px 80px 70px 20px",gap:4,marginBottom:6}}>
            {["Material","Qtd","Vl.Un","Sub",""].map(h=><span key={h} style={{fontSize:9,fontWeight:800,textTransform:"uppercase",color:"var(--tx3)",letterSpacing:".5px"}}>{h}</span>)}
          </div>
          {p.mats.map(m=><div key={m.id} style={{display:"grid",gridTemplateColumns:"1fr 55px 80px 70px 20px",gap:4,alignItems:"center",marginBottom:4}}>
            <BlurInput value={m.nome} onCommit={v=>updMat(p.id,m.id,{nome:v})} placeholder="Material" style={{width:"100%",padding:"5px 7px",borderRadius:6,border:"1.5px solid var(--bd)",background:"var(--sf)",color:"var(--tx)",fontSize:11,outline:"none"}}/>
            <BlurInput type="number" value={m.qtd} onCommit={v=>updMat(p.id,m.id,{qtd:Math.max(0,+v)})} style={{width:"100%",padding:"5px",borderRadius:6,border:"1.5px solid var(--bd)",background:"var(--sf)",color:"var(--tx)",fontSize:11,outline:"none",textAlign:"center"}}/>
            <BlurInput type="number" value={m.vu} onCommit={v=>updMat(p.id,m.id,{vu:Math.max(0,+v)})} step="0.01" style={{width:"100%",padding:"5px",borderRadius:6,border:"1.5px solid var(--bd)",background:"var(--sf)",color:"var(--tx)",fontSize:11,outline:"none"}}/>
            <span style={{fontWeight:700,fontSize:11,color:"var(--tx)"}}>{R$(m.sub)}</span>
            <button onClick={()=>delMat(p.id,m.id)} style={{background:"none",border:"none",color:"var(--rd)",padding:1,cursor:"pointer"}}><I.Trash/></button>
          </div>)}
          <div style={{display:"flex",justifyContent:"space-between",paddingTop:8,fontWeight:800,fontSize:13,borderTop:"1.5px solid var(--bd)",marginTop:4}}><span>Total Materiais</span><span style={{color:"var(--pri)"}}>{R$(p.cm)}</span></div>
        </div></Card>
        <Card><CardHead title="Parcelas do Cliente" right={
          fin
            ?<Btn v="ghost" small onClick={()=>addParcela(fin.id)}><I.Plus/> Parcela</Btn>
            :<Btn small onClick={()=>{
              const finId=uid();
              const paId=uid();
              setFinanceiro(prev=>[...prev,{id:finId,tipo:"receber",desc:`${p.num} - ${getCli(p.clienteId)?.nome||"Cliente"}`,valor:p.vt,valorPago:0,parcelas:[{id:paId,valor:p.vt,venc:"",pago:false,dataPago:"",formaPag:""}],pedidoId:p.id,clienteId:p.clienteId,status:"aberto"}]);
              showToast("Lançamento criado!");
            }}><I.Plus/> Criar Lançamento</Btn>
        }/>
        <div style={{padding:14}}>{fin?fin.parcelas.map((pa,i)=>{
          const inpST={padding:"5px 7px",borderRadius:6,border:"1.5px solid var(--bd)",background:"var(--sf)",color:"var(--tx)",fontSize:11,outline:"none",fontFamily:"var(--ft)"};
          const inpGN={...inpST,border:"1.5px solid var(--gn)",background:"rgba(34,197,94,.06)"};
          return(<div key={pa.id} style={{marginBottom:8,padding:"10px 12px",background:"var(--bg)",borderRadius:10,border:"1.5px solid "+(pa.pago?"var(--gn)":"var(--bd)")}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <span style={{fontWeight:800,fontSize:12,color:"var(--tx)"}}>Parcela {i+1}{pa.pago&&<span style={{marginLeft:6,fontSize:10,color:"var(--gn)",fontWeight:700}}>✓ PAGA</span>}</span>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                {pa.pago
                  ?<><button onClick={()=>editParcela(fin.id,pa.id,{pago:false,dataPago:""})} style={{background:"none",border:"1px solid var(--bd)",borderRadius:6,color:"var(--tx3)",cursor:"pointer",fontSize:10,padding:"3px 7px",fontWeight:700}}>↩ Reabrir</button><button onClick={()=>setModal({t:"recibo",pedido:p,parcela:{...pa,descExtra:`Parcela ${i+1}/${fin.parcelas.length}`},numProx:i+1})} style={{background:"none",border:"1px solid var(--pri)",borderRadius:6,color:"var(--pri)",cursor:"pointer",fontSize:10,padding:"3px 7px",fontWeight:700}}>🧾 Recibo</button><button onClick={()=>delParcela(fin.id,pa.id)} style={{background:"none",border:"none",color:"var(--rd)",cursor:"pointer",padding:2}}><I.Trash/></button></>
                  :<><Btn v="success" small onClick={()=>{pagarParcela(fin.id,pa.id,pa.valor,pa.formaPag||"");showToast("Parcela baixada!");}}>✓ Baixar</Btn>
                    <button onClick={()=>delParcela(fin.id,pa.id)} style={{background:"none",border:"none",color:"var(--rd)",cursor:"pointer",padding:2}}><I.Trash/></button></>
                }
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
              <div><label style={{fontSize:9,fontWeight:800,color:pa.pago?"var(--gn)":"var(--tx3)",display:"block",marginBottom:2,textTransform:"uppercase"}}>Valor R$</label>
                <input type="number" defaultValue={pa.valor||""} key={pa.id+"_v"} onBlur={e=>editParcela(fin.id,pa.id,{valor:+e.target.value})} step="0.01" placeholder="0,00" style={{...(pa.pago?inpGN:inpST),width:"100%",fontWeight:700}}/>
              </div>
              <div><label style={{fontSize:9,fontWeight:800,color:pa.pago?"var(--gn)":"var(--tx3)",display:"block",marginBottom:2,textTransform:"uppercase"}}>{pa.pago?"Data Pago":"Vencimento"}</label>
                <input type="date" value={(pa.pago?pa.dataPago:pa.venc)||""} onChange={e=>editParcela(fin.id,pa.id,pa.pago?{dataPago:e.target.value}:{venc:e.target.value})} style={{...(pa.pago?inpGN:inpST),width:"100%"}}/>
              </div>
              <div><label style={{fontSize:9,fontWeight:800,color:pa.pago?"var(--gn)":"var(--tx3)",display:"block",marginBottom:2,textTransform:"uppercase"}}>Forma Pag.</label>
                <select value={pa.formaPag||""} onChange={e=>editParcela(fin.id,pa.id,{formaPag:e.target.value})} style={{...(pa.pago?inpGN:inpST),width:"100%"}}>
                  <option value="">—</option>
                  {FORMAS.map(fm=><option key={fm.v} value={fm.v}>{fm.l}</option>)}
                </select>
              </div>
            </div>
          </div>);
        }):<span style={{fontSize:12,color:"var(--tx3)"}}>Nenhuma parcela vinculada.</span>}
        {fin&&<div style={{marginTop:8,display:"flex",justifyContent:"space-between",fontWeight:800,fontSize:13,paddingTop:8,borderTop:"1.5px solid var(--bd)"}}><span>Pago: <span style={{color:"var(--gn)"}}>{R$(fin.valorPago)}</span></span><span>Restante: <span style={{color:"var(--rd)"}}>{R$(fin.valor-fin.valorPago)}</span></span></div>}
        </div></Card>
      </div>
      <Card style={{marginTop:14}}><CardHead title="Ambientes / Escopo do Pedido" right={<div style={{display:"flex",gap:8,alignItems:"center"}}><span style={{fontSize:10,color:"var(--tx3)",fontWeight:600}}>Marceneiro vê em tempo real</span><Btn v="ghost" small onClick={()=>updPed(p.id,pp=>({...pp,ambs:[...(pp.ambs||[]),{nome:"",desc:"",val:0}]}))}><I.Plus/> Ambiente</Btn></div>}/>
        <div style={{padding:14}}>
          {p.ambs?.map((a,i)=>{const ambMarc=getMarc(a.marcId);return(
            <div key={i} style={{marginBottom:12,padding:"10px 12px",background:"var(--bg)",borderRadius:10,border:`1.5px solid ${a.marcId?"var(--pri)":"var(--bd)"}`}}>
              <div style={{display:"flex",gap:6,marginBottom:6,alignItems:"center"}}>
                <BlurInput value={a.nome||""} onCommit={v=>updPed(p.id,pp=>({...pp,ambs:pp.ambs.map((x,j)=>j===i?{...x,nome:v}:x)}))} placeholder={`Ambiente ${i+1}`} style={{flex:1,padding:"6px 8px",borderRadius:7,border:"1.5px solid var(--pri)",background:"var(--sf)",color:"var(--tx)",fontSize:12,fontWeight:700,outline:"none"}}/>
                <select value={a.marcId||""} onChange={e=>{const newAmbs=p.ambs.map((x,j)=>j===i?{...x,marcId:e.target.value}:x);updPed(p.id,{ambs:newAmbs});recalcComissoesMult(p.id,newAmbs);showToast(e.target.value?`Ambiente → ${getMarc(e.target.value)?.nome}`:"Marceneiro removido do ambiente");}} style={{padding:"5px 8px",borderRadius:7,border:"1.5px solid var(--bd)",background:"var(--sf)",color:a.marcId?"var(--pri)":"var(--tx3)",fontSize:11,fontWeight:700,outline:"none",maxWidth:160}}>
                  <option value="">— Marceneiro —</option>
                  {marceneiros.filter(x=>x.ativo).map(x=><option key={x.id} value={x.id}>{x.nome} ({x.comissao}%)</option>)}
                </select>
                <button onClick={()=>updPed(p.id,pp=>({...pp,ambs:pp.ambs.filter((_,j)=>j!==i)}))} style={{background:"none",border:"none",color:"var(--rd)",padding:4,cursor:"pointer"}}><I.Trash/></button>
              </div>
              {ambMarc&&<div style={{fontSize:10,color:"var(--pri)",fontWeight:700,marginBottom:5}}>👷 {ambMarc.nome} · {ambMarc.comissao}% · Comissão: {a.val>0?`R$ ${((a.val*(ambMarc.comissao/100)).toFixed(2)).replace(".",",")}`:"-"}</div>}
              <BlurTextarea value={a.desc||""} onCommit={v=>updPed(p.id,pp=>({...pp,ambs:pp.ambs.map((x,j)=>j===i?{...x,desc:v}:x)}))} placeholder="Descrição, medidas, acabamentos, observações..." rows={2} style={{width:"100%",padding:"6px 8px",borderRadius:7,border:"1.5px solid var(--bd)",background:"var(--sf)",color:"var(--tx)",fontSize:11,outline:"none",resize:"vertical",fontFamily:"var(--ft)",lineHeight:1.5}}/>
            </div>
          );})}
          {(!p.ambs||p.ambs.length===0)&&<div style={{padding:"12px 0",color:"var(--tx3)",fontSize:12,fontWeight:600}}>Nenhum ambiente — clique em "+ Ambiente" para adicionar</div>}
        </div>
      </Card>
      <Card style={{marginTop:14}}><CardHead title="Garantia / Termos de Pagamento"/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,padding:14}}>
          <div>
            <label style={{fontSize:9,fontWeight:800,color:"var(--tx3)",display:"block",marginBottom:4,textTransform:"uppercase"}}>Garantia</label>
            <BlurTextarea value={p.garantia||""} onCommit={v=>updPed(p.id,{garantia:v})} rows={3} placeholder="Ex: 5 anos de garantia..." style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1.5px solid var(--bd)",background:"var(--sf)",color:"var(--tx)",fontSize:11,outline:"none",resize:"vertical",fontFamily:"var(--ft)",lineHeight:1.5}}/>
          </div>
          <div>
            <label style={{fontSize:9,fontWeight:800,color:"var(--tx3)",display:"block",marginBottom:4,textTransform:"uppercase"}}>Termos de Pagamento</label>
            <BlurTextarea value={p.pgTermos||""} onCommit={v=>updPed(p.id,{pgTermos:v})} rows={3} placeholder="Ex: 50% entrada, 50% na entrega..." style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1.5px solid var(--bd)",background:"var(--sf)",color:"var(--tx)",fontSize:11,outline:"none",resize:"vertical",fontFamily:"var(--ft)",lineHeight:1.5}}/>
          </div>
        </div>
      </Card>
      <Card style={{marginTop:14}}><CardHead title="Observações Internas"/>
        <div style={{padding:14}}>
          <BlurTextarea value={p.obs||""} onCommit={v=>updPed(p.id,{obs:v})} rows={3} placeholder="Anotações internas, pendências, histórico do pedido..." style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1.5px solid var(--bd)",background:"var(--sf)",color:"var(--tx)",fontSize:12,outline:"none",resize:"vertical",fontFamily:"var(--ft)",lineHeight:1.6}}/>
        </div>
      </Card>
      <Card style={{marginTop:14}}><CardHead title={`Arquivos (${p.arquivos.length})`} right={
        <label style={{cursor:"pointer",display:"flex",alignItems:"center",gap:5,padding:"5px 10px",borderRadius:"var(--r)",border:"1.5px solid var(--bd)",background:"var(--sf)",fontSize:11,fontWeight:700,color:"var(--tx2)"}}>
          <I.Clip/> Anexar
          <input type="file" multiple style={{display:"none"}} onChange={e=>{Array.from(e.target.files||[]).forEach(f=>{if(f.size>10485760){showToast("Máx 10MB por arquivo","red");return;}const r=new FileReader();r.onload=ev=>updPed(p.id,pp=>({...pp,arquivos:[...pp.arquivos,{id:uid(),nome:f.name,data:hoje(),url:ev.target.result}]}));r.readAsDataURL(f)});e.target.value="";showToast("Arquivo(s) anexado(s)!")}}/>
        </label>
      }/>
      <div style={{padding:14}}>
        {p.arquivos.length===0?<span style={{fontSize:12,color:"var(--tx3)"}}>Nenhum arquivo anexado</span>
        :p.arquivos.map(a=><div key={a.id} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:"1px solid var(--bd)"}}>
          <I.Clip/>
          {a.url?<a href={a.url} download={a.nome} style={{fontSize:12,color:"var(--pri)",fontWeight:600,textDecoration:"none",flex:1}}>{a.nome}</a>:<span style={{fontSize:12,color:"var(--tx2)",flex:1}}>{a.nome}</span>}
          <span style={{fontSize:10,color:"var(--tx3)"}}>{a.data}</span>
          <button onClick={()=>updPed(p.id,pp=>({...pp,arquivos:pp.arquivos.filter(x=>x.id!==a.id)}))} style={{background:"none",border:"none",color:"var(--rd)",padding:2,cursor:"pointer"}}><I.Trash/></button>
        </div>)}
      </div></Card>
    </div>)}
    const [fP,setFP]=useState("todos");const list=pedidos.filter(p=>fP==="todos"||p.status===fP);
    const META=200000;const totalAprov=pedidos.filter(p=>p.status!=="cancelado").reduce((s,p)=>s+p.vt,0);const pct=Math.min(100,totalAprov/META*100);const falta=Math.max(0,META-totalAprov);
    return(<div style={{animation:"fadeIn .3s"}}><SH title="Pedidos" sub={`${pedidos.length} total`}/>
      <Card style={{padding:18,marginBottom:16,background:"linear-gradient(135deg,#0f172a,#1e293b)",border:"none"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
          <div><div style={{fontSize:10,fontWeight:800,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"1px",marginBottom:4}}>Meta de Faturamento</div>
            <div style={{fontSize:22,fontWeight:800,color:"#fff"}}>{R$(totalAprov)}<span style={{fontSize:12,color:"#94a3b8",fontWeight:600}}> / {R$(META)}</span></div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:10,fontWeight:800,color:"#94a3b8",textTransform:"uppercase",marginBottom:4}}>Falta</div>
            <div style={{fontSize:18,fontWeight:800,color:falta===0?"#4ade80":"#f87171"}}>{falta===0?"✓ Meta atingida!":R$(falta)}</div>
          </div>
        </div>
        <div style={{background:"rgba(255,255,255,.1)",borderRadius:99,height:10,overflow:"hidden"}}>
          <div style={{width:`${pct}%`,height:"100%",background:`linear-gradient(90deg,#6366f1,${pct>=100?"#4ade80":"#8b5cf6"})`,borderRadius:99,transition:"width .5s"}}/>
        </div>
        <div style={{marginTop:6,fontSize:10,fontWeight:700,color:"#94a3b8",textAlign:"right"}}>{pct.toFixed(1)}% da meta</div>
      </Card>
      <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>{[{k:"todos",l:"Todos"},{k:"em_espera",l:"Espera"},{k:"em_producao",l:"Produção"},{k:"concluido",l:"Concluídos"},{k:"cancelado",l:"Cancelados"}].map(t=><button key={t.k} onClick={()=>setFP(t.k)} style={{padding:"6px 14px",borderRadius:20,border:"1.5px solid "+(fP===t.k?"var(--pri)":"var(--bd)"),background:fP===t.k?"var(--prib)":"transparent",color:fP===t.k?"var(--pri)":"var(--tx3)",fontSize:11,fontWeight:700}}>{t.l}</button>)}</div>
      <Card><TH cols={[{l:"Nº",w:"90px"},{l:"Cliente",w:"1.5fr"},{l:"Marc.",w:"1fr"},{l:"Status",w:"90px"},{l:"Etapa",w:"110px"},{l:"Valor",w:"100px"}]}/>
      {list.map(p=>{const c=getCli(p.clienteId);const m=getMarc(p.marcId);return(<div key={p.id} onClick={()=>setPedAtivo(p.id)} className="hr" style={{display:"grid",gridTemplateColumns:"90px 1.5fr 1fr 90px 110px 100px",gap:6,padding:"10px 18px",borderBottom:"1.5px solid var(--bd)",alignItems:"center",cursor:"pointer",fontSize:12}}>
        <span style={{fontWeight:800,color:"var(--pri)"}}>{p.num}</span><span style={{color:"var(--tx)",fontWeight:600}}>{c?.nome}</span><span style={{color:m?"var(--tx2)":"var(--rd)",fontWeight:600}}>{m?.nome||"—"}</span>
        <Badge color={p.status==="concluido"?"green":p.status==="em_producao"?"amber":p.status==="cancelado"?"red":"blue"}>{p.status==="cancelado"?"Cancelado":p.status.split("_").pop()}</Badge>
        <span style={{fontSize:10,color:"var(--tx3)",fontWeight:600}}>{KCOLS.find(k=>k.id===p.stage)?.label}</span>
        <span style={{fontWeight:700,color:"var(--tx)"}}>{R$(p.vt)}</span>
      </div>)})}{list.length===0&&<div style={{padding:30,textAlign:"center",color:"var(--tx3)",fontSize:12,fontWeight:600}}>Nenhum</div>}</Card></div>);
  };

  // KANBAN
  const PgKanban=()=>{
    const [kView,setKView]=useState("semana"); // semana | etapa
    const getMon=d=>{const x=new Date(d);x.setHours(0,0,0,0);const day=x.getDay();x.setDate(x.getDate()-day+(day===0?-6:1));return x;};
    const today=new Date();today.setHours(0,0,0,0);
    const thisMon=getMon(today);
    const fmtDate=d=>d?new Date(d+"T12:00").toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"}):"";
    const diffDays=(a,b)=>Math.ceil((a-b)/86400000);
    // Gerar semanas: 1 passada + 7 futuras
    const weeks=Array.from({length:9},(_,i)=>{const m=new Date(thisMon);m.setDate(m.getDate()+(i-1)*7);return m;});
    const inWeek=(p,mon)=>{
      if(!p.dataInstalacao)return false;
      const di=new Date(p.dataInstalacao+"T12:00:00");
      const sun=new Date(mon);sun.setDate(sun.getDate()+6);sun.setHours(23,59,59,999);
      return di>=mon&&di<=sun;
    };
    const ativas=pedidos.filter(p=>p.stage!=="concluido"&&p.status!=="cancelado");
    const semData=ativas.filter(p=>!p.dataInstalacao);
    const KCard=({p,stageColor})=>{
      const c=getCli(p.clienteId);const m=getMarc(p.marcId);
      const stage=KCOLS.find(k=>k.id===p.stage)||KCOLS[0];
      const sc=stageColor||stage.color;
      const diasAte=p.dataInstalacao?diffDays(new Date(p.dataInstalacao+"T12:00"),today):null;
      const atrasado=p.dataEntrega&&p.dataEntrega<hojeISO()&&p.stage!=="concluido";
      return(
        <div onClick={()=>{setPedAtivo(p.id);setTab("pedidos")}} style={{background:"var(--cd)",border:"1.5px solid var(--bd)",borderRadius:"var(--r)",padding:"10px 12px",marginBottom:6,borderLeft:`3px solid ${sc}`,boxShadow:"var(--sh)",cursor:"pointer"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div style={{fontWeight:800,fontSize:11,color:"var(--pri)"}}>{p.num}</div>
            <span style={{fontSize:9,padding:"2px 6px",borderRadius:8,background:stage.color+"22",color:stage.color,fontWeight:700,whiteSpace:"nowrap"}}>{stage.label}</span>
          </div>
          <div style={{fontSize:11,color:"var(--tx)",fontWeight:600,marginTop:2}}>{c?.nome}</div>
          <div style={{fontSize:10,color:"var(--tx3)"}}>{m?.nome||"Sem marceneiro"}</div>
          {p.dataEntrega&&<div style={{fontSize:10,color:atrasado?"var(--rd)":"var(--tx3)",marginTop:3,display:"flex",alignItems:"center",gap:3,fontWeight:atrasado?700:400}}><I.Clock/>{fmtDate(p.dataEntrega)}{atrasado&&" ⚠"}</div>}
          {p.dataInstalacao&&<div style={{fontSize:10,color:"var(--pp)",marginTop:2,fontWeight:700}}>🔧 {fmtDate(p.dataInstalacao)}{p.diasPrevistos?` (${p.diasPrevistos}d)`:""}</div>}
          {diasAte!==null&&<div style={{fontSize:9,marginTop:2,fontWeight:800,color:diasAte<0?"var(--rd)":diasAte===0?"var(--gn)":diasAte<=3?"var(--am)":"var(--tx3)"}}>{diasAte<0?`${Math.abs(diasAte)}d atrás`:diasAte===0?"HOJE!":diasAte===1?"Amanhã":`em ${diasAte} dias`}</div>}
          {(()=>{const oc=ordensCort.find(o=>o.pedidoId===p.id&&o.status!=="cancelado");if(!oc)return null;return(<div style={{marginTop:4,padding:"3px 6px",borderRadius:5,fontSize:9,fontWeight:800,display:"inline-flex",gap:4,alignItems:"center",background:oc.status==="concluido"?"rgba(16,185,129,.12)":oc.status==="em_corte"?"rgba(99,102,241,.12)":"rgba(245,158,11,.12)",color:oc.status==="concluido"?"var(--gn)":oc.status==="em_corte"?"var(--pri)":"#d97706"}}>✂ {oc.status==="aguardando"?"Corte Aguardando":oc.status==="em_corte"?`Em Corte desde ${oc.emCorteAt||oc.createdAt}`:`Corte ✓ ${oc.concluidoAt||""}`}</div>);})()}
        </div>
      );
    };
    return(<div style={{animation:"fadeIn .3s"}}>
      <SH title="Kanban de Produção" right={
        <div style={{display:"flex",gap:6}}>
          {[["semana","📅 Por Semana"],["etapa","📋 Por Etapa"]].map(([k,l])=>(
            <button key={k} onClick={()=>setKView(k)} style={{padding:"6px 14px",borderRadius:20,border:"1.5px solid "+(kView===k?"var(--pri)":"var(--bd)"),background:kView===k?"var(--prib)":"transparent",color:kView===k?"var(--pri)":"var(--tx3)",fontSize:11,fontWeight:700,cursor:"pointer"}}>{l}</button>
          ))}
        </div>
      }/>
      {kView==="semana"&&<div style={{display:"flex",gap:10,overflowX:"auto",paddingBottom:10,alignItems:"flex-start"}}>
        {/* Sem data */}
        {semData.length>0&&<div style={{minWidth:190,flexShrink:0,background:"var(--bg)",borderRadius:"var(--rl)",border:"1.5px dashed var(--bd2)"}}>
          <div style={{padding:"10px 14px",borderBottom:"1.5px solid var(--bd)",display:"flex",alignItems:"center",gap:6}}>
            <span style={{fontSize:11,fontWeight:800,color:"var(--tx3)"}}>Não Agendados</span>
            <span style={{fontSize:10,color:"var(--tx3)",marginLeft:"auto",fontWeight:700}}>{semData.length}</span>
          </div>
          <div style={{padding:6}}>{semData.map(p=><KCard key={p.id} p={p}/>)}</div>
        </div>}
        {/* Semanas */}
        {weeks.map((mon,wi)=>{
          const sun=new Date(mon);sun.setDate(sun.getDate()+6);
          const isThis=mon.getTime()===thisMon.getTime();
          const cards=ativas.filter(p=>inWeek(p,mon));
          if(cards.length===0&&!isThis)return null;
          const label=isThis?"Esta Semana":`${fmtDate(mon.toISOString().split("T")[0])} – ${fmtDate(sun.toISOString().split("T")[0])}`;
          return(
            <div key={wi} style={{minWidth:190,flexShrink:0,background:isThis?"#fefce8":"var(--bg)",borderRadius:"var(--rl)",border:`1.5px solid ${isThis?"#fde68a":"var(--bd)"}`}}>
              <div style={{padding:"10px 14px",borderBottom:`1.5px solid ${isThis?"#fde68a":"var(--bd)"}`,display:"flex",alignItems:"center",gap:6}}>
                <div style={{width:8,height:8,borderRadius:4,background:isThis?"#f59e0b":"var(--bd2)"}}/>
                <span style={{fontSize:11,fontWeight:800,color:isThis?"#b45309":"var(--tx)"}}>{label}</span>
                <span style={{fontSize:10,color:"var(--tx3)",marginLeft:"auto",fontWeight:700}}>{cards.length}</span>
              </div>
              <div style={{padding:6,minHeight:60}}>{cards.length===0?<div style={{padding:8,fontSize:10,color:"var(--tx3)",textAlign:"center"}}>Livre</div>:cards.map(p=><KCard key={p.id} p={p}/>)}</div>
            </div>
          );
        })}
      </div>}
      {kView==="etapa"&&<div style={{display:"flex",gap:10,overflowX:"auto",paddingBottom:10}}>{KCOLS.map(col=>{const cards=pedidos.filter(p=>p.stage===col.id&&p.status!=="cancelado");return(
        <div key={col.id} style={{minWidth:180,flex:1,background:"var(--bg)",borderRadius:"var(--rl)",border:"1.5px solid var(--bd)"}}>
          <div style={{padding:"10px 14px",borderBottom:"1.5px solid var(--bd)",display:"flex",alignItems:"center",gap:6}}><div style={{width:8,height:8,borderRadius:4,background:col.color}}/><span style={{fontSize:11,fontWeight:800,color:"var(--tx)"}}>{col.label}</span><span style={{fontSize:10,color:"var(--tx3)",marginLeft:"auto",fontWeight:700}}>{cards.length}</span></div>
          <div style={{padding:6,minHeight:80}}>{cards.map(p=><KCard key={p.id} p={p} stageColor={col.color}/>)}</div>
        </div>
      )})}</div>}
    </div>);
  };

  // MARCENEIROS
  const PgMarc=()=>{
    const [eM,setEM]=useState(null);
    const [eC,setEC]=useState(null);
    const [marcTab,setMarcTab]=useState("marceneiros");
    return(<div style={{animation:"fadeIn .3s"}}>
      <SH title="Marceneiros" sub={`${marceneiros.length} marceneiros · ${cortadores.length} cortadores`} right={marcTab==="marceneiros"?<Btn onClick={()=>setEM({nome:"",tel:"",esp:"",comissao:10,login:"",senha:"",ativo:true})}><I.Plus/> Novo</Btn>:<Btn onClick={()=>setEC({nome:"",tel:"",esp:"",login:"",senha:"",ativo:true})}><I.Plus/> Novo</Btn>}/>
      <div style={{display:"flex",gap:6,marginBottom:14}}>
        {[{k:"marceneiros",l:"Marceneiros"},{k:"cortadores",l:"Cortadores \ud83e\ude9a"}].map(t=><button key={t.k} onClick={()=>setMarcTab(t.k)} style={{padding:"8px 18px",borderRadius:20,border:"1.5px solid "+(marcTab===t.k?"var(--pri)":"var(--bd)"),background:marcTab===t.k?"var(--prib)":"transparent",color:marcTab===t.k?"var(--pri)":"var(--tx3)",fontSize:12,fontWeight:700,cursor:"pointer"}}>{t.l}</button>)}
      </div>
      {marcTab==="marceneiros"&&<>
        {eM&&<Modal onClose={()=>setEM(null)}><h2 style={{fontSize:16,fontWeight:800,color:"var(--tx)",marginBottom:16}}>{eM.id?"Editar":"Novo"} Marceneiro</h2>
          <Field label="Nome" value={eM.nome} onChange={v=>setEM({...eM,nome:v})}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><Field label="Telefone" value={eM.tel} onChange={v=>setEM({...eM,tel:v})}/><Field label="Especialidade" value={eM.esp} onChange={v=>setEM({...eM,esp:v})}/></div>
          <Field label="Comiss\xe3o (%)" type="number" value={eM.comissao} onChange={v=>setEM({...eM,comissao:+v})}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><Field label="Login" value={eM.login} onChange={v=>setEM({...eM,login:v})}/><Field label="Senha" value={eM.senha} onChange={v=>setEM({...eM,senha:v})}/></div>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:8}}><Btn v="ghost" onClick={()=>setEM(null)}>Cancelar</Btn><Btn onClick={()=>{if(!eM.nome||!eM.login)return showToast("Nome e login!","red");if(eM.id){setMarceneiros(p=>p.map(m=>m.id===eM.id?{...m,...eM}:m))}else{setMarceneiros(p=>[...p,{...eM,id:uid()}])}setEM(null);showToast("Salvo!")}}><I.Check/> Salvar</Btn></div>
        </Modal>}
        <Card><TH cols={[{l:"Nome",w:"1.5fr"},{l:"Esp.",w:"1fr"},{l:"Tel",w:"1fr"},{l:"Com.%",w:"70px"},{l:"Login",w:"80px"},{l:"Status",w:"70px"},{l:"Obras",w:"55px"},{l:"",w:"60px"}]}/>
        {marceneiros.map(m=>{const obs=pedidos.filter(p=>p.marcId===m.id).length;return(<div key={m.id} style={{display:"grid",gridTemplateColumns:"1.5fr 1fr 1fr 70px 80px 70px 55px 60px",gap:6,padding:"10px 18px",borderBottom:"1.5px solid var(--bd)",alignItems:"center",fontSize:12}}>
          <span style={{fontWeight:700,color:"var(--tx)"}}>{m.nome}</span><span style={{color:"var(--tx2)"}}>{m.esp}</span><span style={{color:"var(--tx2)"}}>{m.tel}</span><Badge color="pri">{m.comissao}%</Badge><span style={{color:"var(--tx3)",fontSize:11}}>{m.login}</span><Badge color={m.ativo?"green":"red"}>{m.ativo?"Ativo":"Off"}</Badge><span style={{textAlign:"center",fontWeight:700,color:"var(--tx)"}}>{obs}</span>
          <div style={{display:"flex",gap:3}}><button onClick={()=>setEM(m)} style={{background:"none",border:"none",color:"var(--tx3)",padding:3}}><I.Edit/></button><button onClick={()=>{setMarceneiros(p=>p.filter(x=>x.id!==m.id));showToast("Removido","red")}} style={{background:"none",border:"none",color:"var(--rd)",padding:3}}><I.Trash/></button></div>
        </div>)})}</Card>

        {/* ── POSIÇÃO FINANCEIRA POR MARCENEIRO ── */}
        {(()=>{
          const comEntries=financeiro.filter(f=>f.marcId&&f.tipo==="pagar");
          const totalGeralCom=comEntries.reduce((s,f)=>s+f.valor,0);
          const totalPagoCom=comEntries.reduce((s,f)=>s+f.valorPago,0);
          const totalPendCom=totalGeralCom-totalPagoCom;
          if(comEntries.length===0)return null;
          return(<>
            <div style={{margin:"20px 0 10px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:11,fontWeight:800,color:"var(--tx3)",textTransform:"uppercase",letterSpacing:"1px"}}>💰 Posição Financeira — Comissões</span>
              <div style={{display:"flex",gap:16}}>
                <span style={{fontSize:11,fontWeight:700,color:"var(--tx3)"}}>Total: <b style={{color:"var(--tx)"}}>{R$(totalGeralCom)}</b></span>
                <span style={{fontSize:11,fontWeight:700,color:"var(--tx3)"}}>Pago: <b style={{color:"var(--gn)"}}>{R$(totalPagoCom)}</b></span>
                <span style={{fontSize:11,fontWeight:700,color:"var(--tx3)"}}>Pendente: <b style={{color:totalPendCom>0?"var(--rd)":"var(--tx3)"}}>{R$(totalPendCom)}</b></span>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:10}}>
              {marceneiros.map(m=>{
                const comM=comEntries.filter(f=>f.marcId===m.id);
                if(comM.length===0)return null;
                const totalM=comM.reduce((s,f)=>s+f.valor,0);
                const pagoM=comM.reduce((s,f)=>s+f.valorPago,0);
                const pendM=totalM-pagoM;
                const pct=totalM>0?Math.min(100,(pagoM/totalM)*100):0;
                const parcPend=comM.flatMap(f=>(f.parcelas||[]).filter(p=>!p.pago));
                const proxVenc=parcPend.filter(p=>p.venc).sort((a,b)=>a.venc>b.venc?1:-1)[0];
                return(<Card key={m.id} style={{padding:"14px 16px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                    <div>
                      <div style={{fontWeight:800,fontSize:13,color:"var(--tx)"}}>{m.nome}</div>
                      <div style={{fontSize:10,color:"var(--tx3)",marginTop:2}}>{m.comissao}% comissão · {comM.length} lançamento{comM.length!==1?"s":""}</div>
                    </div>
                    <Badge color={pendM===0?"green":"red"}>{pendM===0?"✓ Quitado":"Pendente"}</Badge>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:10}}>
                    <div style={{background:"var(--bg)",borderRadius:8,padding:"8px 10px",textAlign:"center"}}>
                      <div style={{fontSize:8,fontWeight:800,color:"var(--tx3)",textTransform:"uppercase",marginBottom:3}}>Total</div>
                      <div style={{fontSize:13,fontWeight:800,color:"var(--tx)"}}>{R$(totalM)}</div>
                    </div>
                    <div style={{background:"rgba(16,185,129,.06)",borderRadius:8,padding:"8px 10px",textAlign:"center"}}>
                      <div style={{fontSize:8,fontWeight:800,color:"var(--gn)",textTransform:"uppercase",marginBottom:3}}>Pago</div>
                      <div style={{fontSize:13,fontWeight:800,color:"var(--gn)"}}>{R$(pagoM)}</div>
                    </div>
                    <div style={{background:"rgba(239,68,68,.06)",borderRadius:8,padding:"8px 10px",textAlign:"center"}}>
                      <div style={{fontSize:8,fontWeight:800,color:"var(--rd)",textTransform:"uppercase",marginBottom:3}}>Pendente</div>
                      <div style={{fontSize:13,fontWeight:800,color:pendM>0?"var(--rd)":"var(--tx3)"}}>{R$(pendM)}</div>
                    </div>
                  </div>
                  <div style={{height:4,background:"var(--bg)",borderRadius:4,marginBottom:8}}>
                    <div style={{height:"100%",width:`${pct}%`,background:"linear-gradient(90deg,#10b981,#3b82f6)",borderRadius:4,transition:"width .5s"}}/>
                  </div>
                  {proxVenc&&<div style={{fontSize:10,color:"var(--tx3)",fontWeight:600}}>Próx. venc.: <span style={{color:"var(--am)",fontWeight:800}}>{isoToBR(proxVenc.venc)}</span> — {R$(proxVenc.valor)}</div>}
                  {parcPend.length>0&&<div style={{fontSize:10,color:"var(--tx3)",marginTop:2}}>{parcPend.length} parcela{parcPend.length!==1?"s":""} em aberto</div>}
                </Card>);
              })}
            </div>
          </>);
        })()}
      </>}
      {marcTab==="cortadores"&&<>
        {eC&&<Modal onClose={()=>setEC(null)}><h2 style={{fontSize:16,fontWeight:800,color:"var(--tx)",marginBottom:16}}>{eC.id?"Editar":"Novo"} Cortador</h2>
          <Field label="Nome" value={eC.nome} onChange={v=>setEC(p=>({...p,nome:v}))}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><Field label="Telefone" value={eC.tel||""} onChange={v=>setEC(p=>({...p,tel:v}))} /><Field label="Especialidade" value={eC.esp||""} onChange={v=>setEC(p=>({...p,esp:v}))}/></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><Field label="Login" value={eC.login} onChange={v=>setEC(p=>({...p,login:v}))} /><Field label="Senha" value={eC.senha} onChange={v=>setEC(p=>({...p,senha:v}))}/></div>
          <div style={{display:"flex",alignItems:"center",gap:8,marginTop:4,marginBottom:8}}>
            <label style={{fontSize:12,color:"var(--tx2)",fontWeight:600}}>Ativo</label>
            <button onClick={()=>setEC(p=>({...p,ativo:!p.ativo}))} style={{width:28,height:28,borderRadius:8,border:"2px solid "+(eC.ativo?"var(--gn)":"var(--bd)"),background:eC.ativo?"var(--gn)":"transparent",cursor:"pointer"}}/>
          </div>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:8}}><Btn v="ghost" onClick={()=>setEC(null)}>Cancelar</Btn><Btn onClick={()=>{if(!eC.nome||!eC.login)return showToast("Nome e login!","red");if(eC.id){setCortadores(p=>p.map(c=>c.id===eC.id?{...c,...eC}:c))}else{setCortadores(p=>[...p,{...eC,id:uid()}])}setEC(null);showToast("Cortador salvo!")}}><I.Check/> Salvar</Btn></div>
        </Modal>}
        <Card>
          <TH cols={[{l:"Nome",w:"1.5fr"},{l:"Especialidade",w:"1fr"},{l:"Tel",w:"1fr"},{l:"Login",w:"80px"},{l:"Status",w:"70px"},{l:"Ordens",w:"70px"},{l:"",w:"60px"}]}/>
          {cortadores.map(c=>{const nOrdens=ordensCort.filter(o=>o.cortadorId===c.id).length;return(<div key={c.id} style={{display:"grid",gridTemplateColumns:"1.5fr 1fr 1fr 80px 70px 70px 60px",gap:6,padding:"10px 18px",borderBottom:"1.5px solid var(--bd)",alignItems:"center",fontSize:12}}>
            <span style={{fontWeight:700,color:"var(--tx)"}}>{c.nome}</span>
            <span style={{color:"var(--tx2)"}}>{c.esp||"\u2014"}</span>
            <span style={{color:"var(--tx2)"}}>{c.tel||"\u2014"}</span>
            <span style={{color:"var(--tx3)",fontSize:11}}>{c.login}</span>
            <Badge color={c.ativo?"green":"red"}>{c.ativo?"Ativo":"Off"}</Badge>
            <span style={{textAlign:"center",fontWeight:700,color:"var(--tx)"}}>{nOrdens}</span>
            <div style={{display:"flex",gap:3}}><button onClick={()=>setEC(c)} style={{background:"none",border:"none",color:"var(--tx3)",padding:3}}><I.Edit/></button><button onClick={()=>{setCortadores(p=>p.filter(x=>x.id!==c.id));showToast("Removido","red")}} style={{background:"none",border:"none",color:"var(--rd)",padding:3}}><I.Trash/></button></div>
          </div>);})}
          {cortadores.length===0&&<div style={{padding:30,textAlign:"center",color:"var(--tx3)",fontSize:12,fontWeight:600}}>Nenhum cortador cadastrado</div>}
        </Card>
      </>}
    </div>);
  };

  // FINANCEIRO
  const PgFin=()=>{
    const [showRec,setShowRec]=useState(false);
    const [recForm,setRecForm]=useState(null);
    const [fluxoTab,setFluxoTab]=useState("mes");
    const [editObsFin,setEditObsFin]=useState(null); // {finId, cliente, obs}
    const [showStats,setShowStats]=useState(false);
    const [semSel,setSemSel]=useState(null);
    const [showFluxo,setShowFluxo]=useState(false);
    const [fluxoMes,setFluxoMes]=useState(hojeISO().slice(0,7));
    const navFluxoMes=delta=>{const[y,m]=fluxoMes.split("-").map(Number);const d=new Date(y,m-1+delta,1);setSemSel(null);setFluxoMes(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`);};
    const nomeMesFluxo=new Date(fluxoMes+"-15").toLocaleDateString("pt-BR",{month:"long",year:"numeric"});
    const eCats=empresa.cats||CATS;
    // Comissões de marceneiros
    const comEntries=financeiro.filter(f=>f.marcId&&f.tipo==="pagar");
    const pedsMarcados=pedidos.filter(p=>p.marcId);
    const semLancamento=pedsMarcados.filter(p=>!comEntries.find(f=>f.pedidoId===p.id));
    const gerarLancamento=(ped)=>{
      const m=marceneiros.find(x=>x.id===ped.marcId);
      if(!m)return;
      const comVal=+(ped.vt*(m.comissao/100)).toFixed(2);
      setFinanceiro(prev=>[...prev,{id:uid(),tipo:"pagar",desc:`Comissão ${ped.num||''} - ${m.nome}`,valor:comVal,valorPago:0,parcelas:[{id:uid(),valor:comVal,venc:"",pago:false,dataPago:"",formaPag:"pix"}],pedidoId:ped.id,marcId:ped.marcId,fornecedor:m.nome,status:"aberto"}]);
      showToast("Lançamento criado!");
    };
    const comPendTotal=comEntries.reduce((s,f)=>(f.parcelas||[]).filter(p=>!p.pago).reduce((a,p)=>a+p.valor,s),0);
    // Comissões de vendedores
    const vendComEntries=financeiro.filter(f=>f.vendedorId&&f.tipo==="pagar");
    const pedsComVend=pedidos.filter(p=>p.vendedorId);
    const semLancVend=pedsComVend.filter(p=>!vendComEntries.find(f=>f.pedidoId===p.id));
    const gerarLancVend=(ped)=>{
      const v=vendedores.find(x=>x.id===ped.vendedorId);if(!v)return;
      const comVend=+(ped.vt*(v.comissao/100)).toFixed(2);
      setFinanceiro(prev=>[...prev,{id:uid(),tipo:"pagar",desc:`Comissão Vendedor ${ped.num||''} - ${v.nome}`,valor:comVend,valorPago:0,parcelas:[{id:uid(),valor:comVend,venc:"",pago:false,dataPago:"",formaPag:"pix"}],pedidoId:ped.id,vendedorId:v.id,fornecedor:v.nome,categoria:"Folha/Comissão",status:"aberto"}]);
      showToast("Lançamento vendedor criado!");
    };
    const vendComPendTotal=vendComEntries.reduce((s,f)=>(f.parcelas||[]).filter(p=>!p.pago).reduce((a,p)=>a+p.valor,s),0);
    const hj=hojeISO();
    const mesAtual=fluxoMes;
    // Normaliza dataPago — suporta formato ISO (yyyy-mm-dd) e BR legado (dd/mm/yyyy)
    const normDate=d=>{if(!d)return"";if(/^\d{4}-\d{2}-\d{2}/.test(d))return d;const p=d.split("/");return p.length===3?`${p[2]}-${p[1]}-${p[0]}`:d;};
    // Semana atual (seg→dom)
    const hjDate=new Date(hj+"T12:00:00");
    const dow=hjDate.getDay();
    const mon=new Date(hjDate);mon.setDate(hjDate.getDate()-(dow===0?6:dow-1));
    const sun=new Date(mon);sun.setDate(mon.getDate()+6);
    const semIni=mon.toISOString().split("T")[0];
    const semFim=sun.toISOString().split("T")[0];
    // Semanas do mês vigente (seg→dom) para seletor
    const [mesY_,mesM_]=[parseInt(mesAtual.slice(0,4)),parseInt(mesAtual.slice(5,7))];
    const primDiaMes=new Date(mesY_,mesM_-1,1);const ultDiaMes=new Date(mesY_,mesM_,0);
    const dow1_=primDiaMes.getDay();
    const monInicio=new Date(primDiaMes);monInicio.setDate(primDiaMes.getDate()-(dow1_===0?6:dow1_-1));
    const semanasDoMes=[];let sc_=new Date(monInicio);
    while(sc_<=ultDiaMes){const si=sc_.toISOString().split("T")[0];const sf_=new Date(sc_);sf_.setDate(sc_.getDate()+6);semanasDoMes.push({ini:si,fim:sf_.toISOString().split("T")[0]});sc_.setDate(sc_.getDate()+7);}
    const semAtualIdx=semanasDoMes.findIndex(s=>semIni>=s.ini&&semIni<=s.fim);
    const selIdx=semSel!==null?semSel:(semAtualIdx>=0?semAtualIdx:0);
    const selSem=semanasDoMes[selIdx]||{ini:semIni,fim:semFim};
    const selSemIni=selSem.ini;const selSemFim=selSem.fim;
    // ── Cálculos por parcela ──
    const recParcelas=recebimentos.flatMap(r=>r.parcelas.map(p=>({...p,finId:r.id,tipo:"receber",desc:r.obs?`${r.cliente} — ${r.obs}`:r.cliente,categoria:"Recebimento Manual",fonteManual:true})));
    // Deduplicação por id de parcela — evita doubles se financeiro tiver entradas duplicadas no banco
    const _allParc=[...financeiro.flatMap(f=>f.parcelas.map(p=>({...p,finId:f.id,tipo:f.tipo,desc:f.desc,categoria:f.categoria,fornecedor:f.fornecedor}))),...recParcelas];
    const todasParcelas=[...new Map(_allParc.map(p=>[p.id,p])).values()];
    // ── Pools de Cartão ──
    const FNS_1012=["mestre marceneiro","az ferragens"];
    const FNS_18=["léo madeiras","leo madeiras"];
    const matchForn=(forn,lista)=>lista.some(n=>(forn||"").toLowerCase().includes(n));
    // Formas de pagamento que vão para o pool de fornecedores (não entram no fluxo de caixa)
    const POOL_FORMAS=new Set(["cred_10x","cred_12x","cartao_cred","cred_18x"]);
    const isPoolParc=(p)=>p.tipo==="receber"&&POOL_FORMAS.has(p.formaPag);
    const pool1012Parc=todasParcelas.filter(p=>["cred_10x","cred_12x","cartao_cred"].includes(p.formaPag)&&p.tipo==="receber");
    const pool18Parc=todasParcelas.filter(p=>p.formaPag==="cred_18x"&&p.tipo==="receber");
    const pool1012Rec=pool1012Parc.filter(p=>p.pago).reduce((s,p)=>s+p.valor,0);
    const pool1012Fut=pool1012Parc.filter(p=>!p.pago).reduce((s,p)=>s+p.valor,0);
    const pool18Rec=pool18Parc.filter(p=>p.pago).reduce((s,p)=>s+p.valor,0);
    const pool18Fut=pool18Parc.filter(p=>!p.pago).reduce((s,p)=>s+p.valor,0);
    // !f.marcId exclui comissões de marceneiro (já exibidas no pedido — evita duplicata)
    const pool1012FinPag=financeiro.filter(f=>f.tipo==="pagar"&&!f.marcId&&(f.fontePool==="1012"||matchForn(f.fornecedor,FNS_1012)));
    const pool18FinPag=financeiro.filter(f=>f.tipo==="pagar"&&!f.marcId&&(f.fontePool==="18"||matchForn(f.fornecedor,FNS_18)));
    const pool1012Pago=pool1012FinPag.reduce((s,f)=>s+f.valorPago,0);
    const pool18Pago=pool18FinPag.reduce((s,f)=>s+f.valorPago,0);
    const pool1012Saldo=pool1012Rec-pool1012Pago;
    const pool18Saldo=pool18Rec-pool18Pago;
    // Parcelas para o fluxo de caixa — exclui recebimentos em cartão (vão para pool) E pagamentos ao pool (Mestre Marceneiro, AZ Ferragens, Léo Madeiras)
    const poolPayFinIds=new Set([...pool1012FinPag,...pool18FinPag].map(f=>f.id));
    const parcelasFluxo=todasParcelas.filter(p=>!isPoolParc(p)&&!poolPayFinIds.has(p.finId));
    // HOJE
    const parHojeRec=parcelasFluxo.filter(p=>p.pago&&normDate(p.dataPago)===hj&&p.tipo==="receber");
    const parHojePag=parcelasFluxo.filter(p=>p.pago&&normDate(p.dataPago)===hj&&p.tipo==="pagar");
    const recHoje=parHojeRec.reduce((s,p)=>s+p.valor,0);
    const pagHoje=parHojePag.reduce((s,p)=>s+p.valor,0);
    // SEMANA — pendentes
    const parSemRec=parcelasFluxo.filter(p=>!p.pago&&p.venc&&p.venc>=semIni&&p.venc<=semFim&&p.tipo==="receber");
    const parSemPag=parcelasFluxo.filter(p=>!p.pago&&p.venc&&p.venc>=semIni&&p.venc<=semFim&&p.tipo==="pagar");
    // SEMANA — já realizadas
    const parSemPagoRec=parcelasFluxo.filter(p=>p.pago&&normDate(p.dataPago)>=semIni&&normDate(p.dataPago)<=semFim&&p.tipo==="receber");
    const parSemPagoPag=parcelasFluxo.filter(p=>p.pago&&normDate(p.dataPago)>=semIni&&normDate(p.dataPago)<=semFim&&p.tipo==="pagar");
    const semRecTotal=parSemRec.reduce((s,p)=>s+p.valor,0)+parSemPagoRec.reduce((s,p)=>s+p.valor,0);
    const semPagTotal=parSemPag.reduce((s,p)=>s+p.valor,0)+parSemPagoPag.reduce((s,p)=>s+p.valor,0);
    // SEMANA SELECIONADA — para a aba semana (pode ser diferente da semana atual)
    const parSelSemRec=parcelasFluxo.filter(p=>!p.pago&&p.venc&&p.venc>=selSemIni&&p.venc<=selSemFim&&p.tipo==="receber");
    const parSelSemPag=parcelasFluxo.filter(p=>!p.pago&&p.venc&&p.venc>=selSemIni&&p.venc<=selSemFim&&p.tipo==="pagar");
    const parSelSemPagoRec=parcelasFluxo.filter(p=>p.pago&&normDate(p.dataPago)>=selSemIni&&normDate(p.dataPago)<=selSemFim&&p.tipo==="receber");
    const parSelSemPagoPag=parcelasFluxo.filter(p=>p.pago&&normDate(p.dataPago)>=selSemIni&&normDate(p.dataPago)<=selSemFim&&p.tipo==="pagar");
    const selSemRecTotal=parSelSemRec.reduce((s,p)=>s+p.valor,0)+parSelSemPagoRec.reduce((s,p)=>s+p.valor,0);
    const selSemPagTotal=parSelSemPag.reduce((s,p)=>s+p.valor,0)+parSelSemPagoPag.reduce((s,p)=>s+p.valor,0);
    // MÊS — pendentes
    const parMesRec=parcelasFluxo.filter(p=>!p.pago&&p.venc?.startsWith(mesAtual)&&p.tipo==="receber");
    const parMesPag=parcelasFluxo.filter(p=>!p.pago&&p.venc?.startsWith(mesAtual)&&p.tipo==="pagar");
    // MÊS — já realizadas
    const parPagoMesRec=parcelasFluxo.filter(p=>p.pago&&normDate(p.dataPago).startsWith(mesAtual)&&p.tipo==="receber");
    const parPagoMesPag=parcelasFluxo.filter(p=>p.pago&&normDate(p.dataPago).startsWith(mesAtual)&&p.tipo==="pagar");
    const recebidoMes=parPagoMesRec.reduce((s,p)=>s+p.valor,0);
    const saidoMes=parPagoMesPag.reduce((s,p)=>s+p.valor,0);
    const esteMesRec=recebidoMes+parMesRec.reduce((s,p)=>s+p.valor,0);
    const esteMesPag=saidoMes+parMesPag.reduce((s,p)=>s+p.valor,0);
    // VENCIDOS
    const parVencRec=parcelasFluxo.filter(p=>!p.pago&&p.venc&&p.venc<hj&&p.tipo==="receber");
    const parVencPag=parcelasFluxo.filter(p=>!p.pago&&p.venc&&p.venc<hj&&p.tipo==="pagar");
    const vencidoRec=parVencRec.reduce((s,p)=>s+p.valor,0);
    const vencidoPag=parVencPag.reduce((s,p)=>s+p.valor,0);
    // TOTAIS — excluir recebimentos de cartão (pool) do saldo do caixa
    const recAsF=recebimentos.map(r=>({id:r.id,tipo:"receber",desc:r.obs?`${r.cliente} — ${r.obs}`:r.cliente,valor:r.valorTotal,valorPago:r.parcelas.filter(p=>p.pago).reduce((s,p)=>s+p.valor,0),parcelas:r.parcelas,categoria:"Recebimento Manual",status:r.parcelas.length&&r.parcelas.every(p=>p.pago)?"pago":r.parcelas.some(p=>p.pago)?"parcial":"aberto",fonteManual:true}));
    // totalAR: valor a receber excluindo parcelas de pool ainda não pagas
    const totalAR=[...financeiro,...recAsF].filter(f=>f.tipo==="receber").reduce((s,f)=>{
      const apagar=f.parcelas.filter(p=>!p.pago&&!POOL_FORMAS.has(p.formaPag)).reduce((ss,p)=>ss+p.valor,0);
      return s+apagar;
    },0);
    const totalAP=financeiro.filter(f=>f.tipo==="pagar").reduce((s,f)=>s+(f.valor-f.valorPago),0);
    const saldo=saldoInicial+totalAR-totalAP;
    // CAIXA REAL = abertura + recebido (exceto cartão/pool) − pago
    const totalRecebidoReal=parcelasFluxo.filter(p=>p.pago&&p.tipo==="receber").reduce((s,p)=>s+p.valor,0);
    const totalPagoReal=parcelasFluxo.filter(p=>p.pago&&p.tipo==="pagar").reduce((s,p)=>s+p.valor,0);
    const caixaHoje=saldoInicial+totalRecebidoReal-totalPagoReal;
    // PROJEÇÃO ANUAL — mês a mês do mês atual até dezembro do ano corrente
    const anoAtual=hj.slice(0,4);
    const mesAtualNum=parseInt(mesAtual.slice(5));
    const MESES_NOMES=["","Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
    const FORMAS_GRUPO={pix:"PIX",transferencia:"PIX",dinheiro:"Dinheiro",boleto:"Boleto",cartao_deb:"Débito",cartao_cred:"Cartão",cred_10x:"Cartão 10x",cred_12x:"Cartão 12x",cred_18x:"Cartão 18x"};
    const projecaoAnual=Array.from({length:13-mesAtualNum},(_,i)=>{
      const mn=mesAtualNum+i;
      const mesStr=`${anoAtual}-${String(mn).padStart(2,"0")}`;
      const pRec=parcelasFluxo.filter(p=>!p.pago&&p.venc?.startsWith(mesStr)&&p.tipo==="receber");
      const pPag=parcelasFluxo.filter(p=>!p.pago&&p.venc?.startsWith(mesStr)&&p.tipo==="pagar");
      const pRecPago=parcelasFluxo.filter(p=>p.pago&&normDate(p.dataPago).startsWith(mesStr)&&p.tipo==="receber");
      const pPagPago=parcelasFluxo.filter(p=>p.pago&&normDate(p.dataPago).startsWith(mesStr)&&p.tipo==="pagar");
      const totalRec=pRec.reduce((s,p)=>s+p.valor,0)+pRecPago.reduce((s,p)=>s+p.valor,0);
      const totalPag=pPag.reduce((s,p)=>s+p.valor,0)+pPagPago.reduce((s,p)=>s+p.valor,0);
      // Agrupa entradas por forma de pagamento
      const grpRec={};[...pRec,...pRecPago].forEach(p=>{const g=FORMAS_GRUPO[p.formaPag]||"Outros";grpRec[g]=(grpRec[g]||0)+p.valor;});
      const grpPag={};[...pPag,...pPagPago].forEach(p=>{const g=FORMAS_GRUPO[p.formaPag]||"Outros";grpPag[g]=(grpPag[g]||0)+p.valor;});
      return{mes:mesStr,label:MESES_NOMES[mn],totalRec,totalPag,saldo:totalRec-totalPag,grpRec,grpPag,pRec,pPag,pRecPago,pPagPago,isAtual:mn===mesAtualNum};
    });
    // VENCIMENTOS DE HOJE (pendentes)
    const parVencHojeRec=parcelasFluxo.filter(p=>!p.pago&&p.venc===hj&&p.tipo==="receber");
    const parVencHojePag=parcelasFluxo.filter(p=>!p.pago&&p.venc===hj&&p.tipo==="pagar");
    const inpST={padding:"5px 8px",borderRadius:6,border:"1.5px solid var(--bd)",background:"var(--sf)",color:"var(--tx)",fontSize:11,outline:"none"};
    // Baixar parcela — funciona para financeiro e recebimentos manuais
    const baixarParc=(p)=>{
      if(p.fonteManual){
        setRecebimentos(prev=>prev.map(r=>r.id!==p.finId?r:{...r,parcelas:r.parcelas.map(pa=>pa.id!==p.id?pa:{...pa,pago:true,dataPago:hojeISO()})}));
        showToast("Baixado!");
      } else {
        pagarParcela(p.finId,p.id,p.valor,p.formaPag||"");
      }
    };
    const abrirEdicao=(p)=>{
      const f=financeiro.find(x=>x.id===p.finId);
      if(f)setModal({t:"detFin",d:f});
    };
    // FluxoRow com ações de baixar / editar
    const FluxoRow=({p,cor})=>{
      const editing=editObsFin?.finId===p.finId&&p.fonteManual;
      return(<div style={{borderBottom:"1px solid var(--bd)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",fontSize:13}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",alignItems:"center",gap:4}}>
              <span style={{fontWeight:700,color:"var(--tx)",display:"block",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.desc}</span>
              {p.fonteManual&&<button onClick={()=>setEditObsFin(editing?null:{finId:p.finId,cliente:recebimentos.find(r=>r.id===p.finId)?.cliente||"",obs:recebimentos.find(r=>r.id===p.finId)?.obs||""})} title="Editar descrição" style={{background:"none",border:"none",color:"var(--tx3)",cursor:"pointer",padding:"1px 3px",fontSize:11,flexShrink:0,opacity:.7}}>✏</button>}
            </div>
            <span style={{color:"var(--tx3)",fontSize:11}}>{p.pago?isoToBR(normDate(p.dataPago)):isoToBR(p.venc)}{p.formaPag&&" · "}{p.formaPag&&(FORMAS_LAB[p.formaPag]||p.formaPag)}</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
            {p.pago
              ?<span style={{fontSize:11,color:"var(--gn)",fontWeight:700}}>✓ Pago</span>
              :<Btn v="success" small onClick={()=>baixarParc(p)}>✓ Baixar</Btn>}
            {!p.fonteManual&&<button onClick={()=>abrirEdicao(p)} title="Editar" style={{background:"none",border:"none",color:"var(--tx3)",padding:2,cursor:"pointer",fontSize:14}}><I.Edit/></button>}
            <span style={{fontWeight:800,color:cor,fontSize:13,minWidth:80,textAlign:"right"}}>{R$(p.valor)}</span>
          </div>
        </div>
        {editing&&<div style={{background:"var(--prib)",borderRadius:8,padding:"8px 10px",marginBottom:8,display:"flex",gap:8,flexWrap:"wrap",alignItems:"flex-end"}}>
          <div style={{flex:1,minWidth:140}}>
            <div style={{fontSize:9,fontWeight:800,color:"var(--tx3)",marginBottom:3}}>NOME</div>
            <input value={editObsFin.cliente} onChange={e=>setEditObsFin(p=>({...p,cliente:e.target.value}))}
              style={{width:"100%",padding:"4px 8px",borderRadius:6,border:"1.5px solid var(--pri)",background:"var(--sf)",color:"var(--tx)",fontSize:12,fontWeight:700,outline:"none"}}/>
          </div>
          <div style={{flex:2,minWidth:180}}>
            <div style={{fontSize:9,fontWeight:800,color:"var(--tx3)",marginBottom:3}}>DESCRIÇÃO</div>
            <input value={editObsFin.obs} onChange={e=>setEditObsFin(p=>({...p,obs:e.target.value}))}
              placeholder="Descrição curta..."
              style={{width:"100%",padding:"4px 8px",borderRadius:6,border:"1.5px solid var(--bd)",background:"var(--sf)",color:"var(--tx)",fontSize:12,outline:"none"}}/>
          </div>
          <div style={{display:"flex",gap:4}}>
            <button onClick={()=>{setRecebimentos(prev=>prev.map(r=>r.id===editObsFin.finId?{...r,cliente:editObsFin.cliente.trim()||r.cliente,obs:editObsFin.obs}:r));setEditObsFin(null);showToast("Salvo!");}}
              style={{padding:"5px 10px",borderRadius:6,background:"var(--gn)",border:"none",color:"#fff",fontSize:11,fontWeight:800,cursor:"pointer"}}>✓</button>
            <button onClick={()=>setEditObsFin(null)}
              style={{padding:"5px 8px",borderRadius:6,background:"none",border:"1px solid var(--bd)",color:"var(--tx3)",fontSize:11,cursor:"pointer"}}>✕</button>
          </div>
        </div>}
      </div>);
    };
    return(<div style={{animation:"fadeIn .3s"}}>
      <SH title="Financeiro" sub="Gestão de Caixa — Contas a Pagar e Receber" right={<Btn onClick={()=>setModal({t:"newFin"})}><I.Plus/> Nova Conta</Btn>}/>

      {/* ══ LINHA 1 — SALDO REAL ══ */}
      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:10,marginBottom:10}}>
        {/* Caixa do Dia */}
        <div style={{background:"linear-gradient(135deg,#0f172a 0%,#1e293b 100%)",borderRadius:"var(--rl)",padding:"18px 22px",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",right:16,top:16,fontSize:32,opacity:.08}}>💰</div>
          <div style={{fontSize:9,fontWeight:800,color:"#64748b",textTransform:"uppercase",letterSpacing:"1.5px",marginBottom:6}}>💰 Saldo em Conta — Hoje</div>
          <div style={{fontSize:28,fontWeight:900,color:caixaHoje>=0?"#4ade80":"#f87171",letterSpacing:"-1px"}}>{R$(caixaHoje)}</div>
          <div style={{display:"flex",gap:16,marginTop:8}}>
            <div><div style={{fontSize:8,color:"#475569",textTransform:"uppercase",fontWeight:700}}>Abertura</div><div style={{fontSize:12,fontWeight:800,color:"#94a3b8"}}>{R$(saldoInicial)}</div></div>
            <div><div style={{fontSize:8,color:"#22c55e",textTransform:"uppercase",fontWeight:700}}>Entrou Hoje</div><div style={{fontSize:12,fontWeight:800,color:"#4ade80"}}>{R$(recHoje)}</div></div>
            <div><div style={{fontSize:8,color:"#ef4444",textTransform:"uppercase",fontWeight:700}}>Saiu Hoje</div><div style={{fontSize:12,fontWeight:800,color:"#f87171"}}>{R$(pagHoje)}</div></div>
          </div>
        </div>
        {/* Total a Pagar */}
        <div style={{background:"rgba(239,68,68,.07)",borderRadius:"var(--rl)",padding:"14px 16px",border:"1px solid rgba(239,68,68,.2)"}}>
          <div style={{fontSize:8,fontWeight:800,color:"var(--rd)",textTransform:"uppercase",letterSpacing:"1px",marginBottom:4}}>❤️ Total a Pagar</div>
          <div style={{fontSize:20,fontWeight:800,color:"var(--rd)"}}>{R$(totalAP)}</div>
          <div style={{fontSize:9,color:"var(--tx3)",marginTop:4}}>{financeiro.filter(f=>f.tipo==="pagar"&&f.status!=="pago").length} conta{financeiro.filter(f=>f.tipo==="pagar"&&f.status!=="pago").length!==1?"s":""} em aberto</div>
        </div>
      </div>

      {/* ══ LINHA 2 — SEMANA / MÊS (colapsável) ══ */}
      <div style={{marginBottom:10}}>
        <button onClick={()=>setShowStats(p=>!p)} style={{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 14px",borderRadius:"var(--r)",border:"1.5px solid var(--bd)",background:"var(--sf)",color:"var(--tx2)",fontSize:11,fontWeight:700,cursor:"pointer",marginBottom:showStats?8:0}}>
          <span>📊 Semana / Mês — Entradas & Saídas</span>
          <span style={{fontSize:10}}>{showStats?"▲ Fechar":"▼ Abrir"}</span>
        </button>
        {showStats&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:10}}>
          <div style={{background:"var(--gnb)",borderRadius:"var(--rl)",padding:"12px 16px",border:"1px solid var(--gn)33"}}>
            <div style={{fontSize:8,fontWeight:800,color:"var(--gn)",textTransform:"uppercase",letterSpacing:"1px",marginBottom:3}}>📅 Esta Semana — Entradas</div>
            <div style={{fontSize:18,fontWeight:800,color:"var(--gn)"}}>{R$(semRecTotal)}</div>
            <div style={{fontSize:9,color:"var(--tx3)",marginTop:2}}>{parSemPagoRec.length} recebida{parSemPagoRec.length!==1?"s":""} · {parSemRec.length} pendente{parSemRec.length!==1?"s":""}</div>
          </div>
          <div style={{background:"rgba(239,68,68,.05)",borderRadius:"var(--rl)",padding:"12px 16px",border:"1px solid rgba(239,68,68,.15)"}}>
            <div style={{fontSize:8,fontWeight:800,color:"var(--rd)",textTransform:"uppercase",letterSpacing:"1px",marginBottom:3}}>📅 Esta Semana — Saídas</div>
            <div style={{fontSize:18,fontWeight:800,color:"var(--rd)"}}>{R$(semPagTotal)}</div>
            <div style={{fontSize:9,color:"var(--tx3)",marginTop:2}}>{parSemPagoPag.length} paga{parSemPagoPag.length!==1?"s":""} · {parSemPag.length} pendente{parSemPag.length!==1?"s":""}</div>
          </div>
          <div style={{background:"var(--gnb)",borderRadius:"var(--rl)",padding:"12px 16px",border:"1px solid var(--gn)33"}}>
            <div style={{fontSize:8,fontWeight:800,color:"var(--gn)",textTransform:"uppercase",letterSpacing:"1px",marginBottom:3}}>🗓 Este Mês — Entradas</div>
            <div style={{fontSize:18,fontWeight:800,color:"var(--gn)"}}>{R$(esteMesRec)}</div>
            <div style={{fontSize:9,color:"var(--tx3)",marginTop:2}}>{parPagoMesRec.length} recebida{parPagoMesRec.length!==1?"s":""} · {parMesRec.length} pendente{parMesRec.length!==1?"s":""}</div>
          </div>
          <div style={{background:"rgba(239,68,68,.05)",borderRadius:"var(--rl)",padding:"12px 16px",border:"1px solid rgba(239,68,68,.15)"}}>
            <div style={{fontSize:8,fontWeight:800,color:"var(--rd)",textTransform:"uppercase",letterSpacing:"1px",marginBottom:3}}>🗓 Este Mês — Saídas</div>
            <div style={{fontSize:18,fontWeight:800,color:"var(--rd)"}}>{R$(esteMesPag)}</div>
            <div style={{fontSize:9,color:"var(--tx3)",marginTop:2}}>{parPagoMesPag.length} paga{parPagoMesPag.length!==1?"s":""} · {parMesPag.length} pendente{parMesPag.length!==1?"s":""}</div>
          </div>
        </div>}
      </div>

      {/* ══ ALERTAS VENCIDOS ══ */}
      {(vencidoRec>0||vencidoPag>0)&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
        {vencidoRec>0&&<div style={{background:"rgba(245,158,11,.1)",borderRadius:"var(--rl)",padding:"10px 16px",border:"1.5px solid rgba(245,158,11,.4)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div><div style={{fontSize:9,fontWeight:800,color:"#d97706",textTransform:"uppercase"}}>⚠ Atrasado a Receber</div><div style={{fontSize:16,fontWeight:800,color:"#d97706"}}>{R$(vencidoRec)}</div></div>
          <div style={{fontSize:11,color:"#92400e",fontWeight:700}}>{parVencRec.length} parc.</div>
        </div>}
        {vencidoPag>0&&<div style={{background:"rgba(239,68,68,.1)",borderRadius:"var(--rl)",padding:"10px 16px",border:"1.5px solid rgba(239,68,68,.35)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div><div style={{fontSize:9,fontWeight:800,color:"var(--rd)",textTransform:"uppercase"}}>⚠ Atrasado a Pagar</div><div style={{fontSize:16,fontWeight:800,color:"var(--rd)"}}>{R$(vencidoPag)}</div></div>
            <div style={{fontSize:11,color:"#991b1b",fontWeight:700}}>{parVencPag.length} parc.</div>
          </div>
          <div style={{marginTop:4,fontSize:10,color:"#991b1b"}}>{parVencPag.map(p=>`${p.desc||p.fornecedor||"?"} (venc. ${isoToBR(p.venc)})`).join(" · ")}</div>
        </div>}
      </div>}

      {/* ══ POOLS DE CARTÃO DE CRÉDITO ══ */}
      <Card style={{marginBottom:14,padding:0,overflow:"hidden"}}>
        {/* Cabeçalho + Tabs */}
        <div style={{padding:"14px 20px 0",background:"var(--sf)"}}>
          <div style={{fontSize:13,fontWeight:800,color:"var(--tx)",marginBottom:12}}>💳 Gestão de Recebimentos — Cartão de Crédito</div>
          <div style={{display:"flex",gap:0,borderBottom:"2px solid var(--bd)"}}>
            {[["1012","💳 Crédito 10x / 12x"],["18","💳 Crédito 18x"]].map(([k,l])=>(
              <button key={k} onClick={()=>setPoolTab(k)} style={{padding:"10px 24px",fontSize:12,fontWeight:700,background:poolTab===k?"var(--prib)":"transparent",color:poolTab===k?"var(--pri)":"var(--tx3)",border:"none",cursor:"pointer",borderBottom:poolTab===k?"2px solid var(--pri)":"2px solid transparent",marginBottom:-2}}>{l}</button>
            ))}
          </div>
        </div>
        {/* Conteúdo Pool 10x/12x */}
        {poolTab==="1012"&&(()=>{
          const mesAtual=new Date().toISOString().slice(0,7);
          const proxParc=pool1012Parc.filter(p=>!p.pago&&p.venc&&p.venc.startsWith(mesAtual)).sort((a,b)=>a.venc>b.venc?1:-1);
          return(<div style={{padding:16}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:10,marginBottom:14}}>
              <div style={{background:"var(--gnb)",borderRadius:"var(--r)",padding:"12px 14px",border:"1px solid var(--gn)33"}}>
                <div style={{fontSize:8,fontWeight:800,color:"var(--gn)",textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>✅ Já Recebido</div>
                <div style={{fontSize:18,fontWeight:800,color:"var(--gn)"}}>{R$(pool1012Rec)}</div>
                <div style={{fontSize:9,color:"var(--tx3)",marginTop:2}}>via 10x e 12x</div>
              </div>
              <div style={{background:"var(--blb)",borderRadius:"var(--r)",padding:"12px 14px",border:"1px solid var(--bl)33"}}>
                <div style={{fontSize:8,fontWeight:800,color:"var(--bl)",textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>🔜 A Receber (futuro)</div>
                <div style={{fontSize:18,fontWeight:800,color:"var(--bl)"}}>{R$(pool1012Fut)}</div>
                <div style={{fontSize:9,color:"var(--tx3)",marginTop:2}}>{pool1012Parc.filter(p=>!p.pago).length} parcela{pool1012Parc.filter(p=>!p.pago).length!==1?"s":""} pendente{pool1012Parc.filter(p=>!p.pago).length!==1?"s":""}</div>
              </div>
              <div style={{background:"var(--rdb)",borderRadius:"var(--r)",padding:"12px 14px",border:"1px solid var(--rd)33"}}>
                <div style={{fontSize:8,fontWeight:800,color:"var(--rd)",textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>💸 Pago Fornecedores</div>
                <div style={{fontSize:18,fontWeight:800,color:"var(--rd)"}}>{R$(pool1012Pago)}</div>
                <div style={{fontSize:9,color:"var(--tx3)",marginTop:2}}>Mestre Marc. · AZ Ferragens</div>
              </div>
              <div style={{background:pool1012Saldo>=0?"var(--gnb)":"var(--rdb)",borderRadius:"var(--r)",padding:"12px 14px",border:`1px solid ${pool1012Saldo>=0?"var(--gn)":"var(--rd)"}33`}}>
                <div style={{fontSize:8,fontWeight:800,color:pool1012Saldo>=0?"var(--gn)":"var(--rd)",textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>⚖ Saldo Disponível</div>
                <div style={{fontSize:18,fontWeight:800,color:pool1012Saldo>=0?"var(--gn)":"var(--rd)"}}>{R$(pool1012Saldo)}</div>
                <div style={{fontSize:9,color:"var(--tx3)",marginTop:2}}>Recebido − Pago fornec.</div>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div>
                <div style={{fontSize:10,fontWeight:800,color:"var(--bl)",textTransform:"uppercase",marginBottom:8}}>📅 Parcelas do mês — {new Date().toLocaleString("pt-BR",{month:"long",year:"numeric"})}</div>
                {proxParc.length===0?<div style={{fontSize:11,color:"var(--tx3)"}}>Nenhuma parcela neste mês</div>
                :proxParc.map((p,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:"1px solid var(--bd)",fontSize:12,gap:8}}>
                  <div style={{flex:1}}><div style={{fontWeight:700,color:"var(--tx)"}}>{p.desc}</div><div style={{fontSize:10,color:"var(--tx3)"}}>{isoToBR(p.venc)} · {FORMAS_LAB[p.formaPag]||p.formaPag}</div></div>
                  <span style={{fontWeight:800,color:"var(--bl)",whiteSpace:"nowrap"}}>{R$(p.valor)}</span>
                  <button onClick={()=>{baixarParc(p);showToast("Parcela baixada!");}} style={{padding:"4px 10px",borderRadius:6,background:"var(--gnb)",border:"1.5px solid var(--gn)",color:"var(--gn)",fontSize:11,fontWeight:800,cursor:"pointer",whiteSpace:"nowrap"}}>✓ Baixar</button>
                </div>)}
              </div>
              <div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <div style={{fontSize:10,fontWeight:800,color:"var(--rd)",textTransform:"uppercase"}}>💸 Pagamentos a fornecedores</div>
                  <Btn small onClick={()=>setModal({t:"newFin",d:{fontePool:"1012",fornecedorSugerido:"Mestre Marceneiro"}})}><I.Plus/> Pagar Fornecedor</Btn>
                </div>
                {pool1012FinPag.length===0?<div style={{fontSize:11,color:"var(--tx3)"}}>Nenhum pagamento registrado</div>
                :pool1012FinPag.slice(0,8).map(f=>{const proxV=f.parcelas?.[0];return(<div key={f.id} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid var(--bd)",fontSize:12}}>
                  <div><div style={{fontWeight:700,color:"var(--tx)"}}>{f.fornecedor||f.desc}</div><div style={{fontSize:10,color:"var(--tx3)"}}>{proxV?isoToBR(proxV.venc):""}</div></div>
                  <div style={{textAlign:"right"}}><div style={{fontWeight:800,color:"var(--rd)"}}>{R$(f.valor)}</div><div style={{fontSize:10,color:"var(--gn)",fontWeight:600}}>pago {R$(f.valorPago)}</div></div>
                </div>);})}
              </div>
            </div>
          </div>);
        })()}
        {/* Conteúdo Pool 18x */}
        {poolTab==="18"&&(()=>{
          const mesAtual=new Date().toISOString().slice(0,7);
          const proxParc18=pool18Parc.filter(p=>!p.pago&&p.venc&&p.venc.startsWith(mesAtual)).sort((a,b)=>a.venc>b.venc?1:-1);
          return(<div style={{padding:16}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:10,marginBottom:14}}>
              <div style={{background:"var(--gnb)",borderRadius:"var(--r)",padding:"12px 14px",border:"1px solid var(--gn)33"}}>
                <div style={{fontSize:8,fontWeight:800,color:"var(--gn)",textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>✅ Já Recebido</div>
                <div style={{fontSize:18,fontWeight:800,color:"var(--gn)"}}>{R$(pool18Rec)}</div>
                <div style={{fontSize:9,color:"var(--tx3)",marginTop:2}}>via 18x</div>
              </div>
              <div style={{background:"var(--ppb)",borderRadius:"var(--r)",padding:"12px 14px",border:"1px solid var(--pp)33"}}>
                <div style={{fontSize:8,fontWeight:800,color:"var(--pp)",textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>🔜 A Receber (futuro)</div>
                <div style={{fontSize:18,fontWeight:800,color:"var(--pp)"}}>{R$(pool18Fut)}</div>
                <div style={{fontSize:9,color:"var(--tx3)",marginTop:2}}>{pool18Parc.filter(p=>!p.pago).length} parcela{pool18Parc.filter(p=>!p.pago).length!==1?"s":""} pendente{pool18Parc.filter(p=>!p.pago).length!==1?"s":""}</div>
              </div>
              <div style={{background:"var(--rdb)",borderRadius:"var(--r)",padding:"12px 14px",border:"1px solid var(--rd)33"}}>
                <div style={{fontSize:8,fontWeight:800,color:"var(--rd)",textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>💸 Pago Fornecedores</div>
                <div style={{fontSize:18,fontWeight:800,color:"var(--rd)"}}>{R$(pool18Pago)}</div>
                <div style={{fontSize:9,color:"var(--tx3)",marginTop:2}}>Léo Madeiras</div>
              </div>
              <div style={{background:pool18Saldo>=0?"var(--gnb)":"var(--rdb)",borderRadius:"var(--r)",padding:"12px 14px",border:`1px solid ${pool18Saldo>=0?"var(--gn)":"var(--rd)"}33`}}>
                <div style={{fontSize:8,fontWeight:800,color:pool18Saldo>=0?"var(--gn)":"var(--rd)",textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>⚖ Saldo Disponível</div>
                <div style={{fontSize:18,fontWeight:800,color:pool18Saldo>=0?"var(--gn)":"var(--rd)"}}>{R$(pool18Saldo)}</div>
                <div style={{fontSize:9,color:"var(--tx3)",marginTop:2}}>Recebido − Pago fornec.</div>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div>
                <div style={{fontSize:10,fontWeight:800,color:"var(--pp)",textTransform:"uppercase",marginBottom:8}}>📅 Parcelas do mês — {new Date().toLocaleString("pt-BR",{month:"long",year:"numeric"})}</div>
                {proxParc18.length===0?<div style={{fontSize:11,color:"var(--tx3)"}}>Nenhuma parcela neste mês</div>
                :proxParc18.map((p,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:"1px solid var(--bd)",fontSize:12,gap:8}}>
                  <div style={{flex:1}}><div style={{fontWeight:700,color:"var(--tx)"}}>{p.desc}</div><div style={{fontSize:10,color:"var(--tx3)"}}>{isoToBR(p.venc)} · {FORMAS_LAB[p.formaPag]||p.formaPag}</div></div>
                  <span style={{fontWeight:800,color:"var(--pp)",whiteSpace:"nowrap"}}>{R$(p.valor)}</span>
                  <button onClick={()=>{baixarParc(p);showToast("Parcela baixada!");}} style={{padding:"4px 10px",borderRadius:6,background:"var(--gnb)",border:"1.5px solid var(--gn)",color:"var(--gn)",fontSize:11,fontWeight:800,cursor:"pointer",whiteSpace:"nowrap"}}>✓ Baixar</button>
                </div>)}
              </div>
              <div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <div style={{fontSize:10,fontWeight:800,color:"var(--rd)",textTransform:"uppercase"}}>💸 Pagamentos a fornecedores</div>
                  <Btn small onClick={()=>setModal({t:"newFin",d:{fontePool:"18",fornecedorSugerido:"Léo Madeiras"}})}><I.Plus/> Pagar Fornecedor</Btn>
                </div>
                {pool18FinPag.length===0?<div style={{fontSize:11,color:"var(--tx3)"}}>Nenhum pagamento registrado</div>
                :pool18FinPag.slice(0,8).map(f=>{const proxV=f.parcelas?.[0];return(<div key={f.id} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid var(--bd)",fontSize:12}}>
                  <div><div style={{fontWeight:700,color:"var(--tx)"}}>{f.fornecedor||f.desc}</div><div style={{fontSize:10,color:"var(--tx3)"}}>{proxV?isoToBR(proxV.venc):""}</div></div>
                  <div style={{textAlign:"right"}}><div style={{fontWeight:800,color:"var(--rd)"}}>{R$(f.valor)}</div><div style={{fontSize:10,color:"var(--gn)",fontWeight:600}}>pago {R$(f.valorPago)}</div></div>
                </div>);})}
              </div>
            </div>
          </div>);
        })()}
      </Card>

      {/* ══ COMISSÕES DE MARCENEIROS (colapsável) ══ */}
      <div style={{marginBottom:14}}>
        <button onClick={()=>setShowComissoes(p=>!p)} style={{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 14px",borderRadius:"var(--r)",border:"1.5px solid rgba(239,68,68,.4)",background:"var(--sf)",color:"var(--tx2)",fontSize:11,fontWeight:700,cursor:"pointer",marginBottom:showComissoes?8:0}}>
          <span>👷 Comissões de Marceneiros{comPendTotal>0?` — A pagar: ${R$(comPendTotal)}`:""}</span>
          <span style={{fontSize:10}}>{showComissoes?"▲ Fechar":"▼ Abrir"}</span>
        </button>
        {showComissoes&&<Card style={{padding:0,border:"1.5px solid rgba(239,68,68,.2)"}}>
          <div style={{padding:"12px 16px"}}>
            {semLancamento.length===0&&comEntries.length===0&&(
              <div style={{fontSize:12,color:"var(--tx3)",textAlign:"center",padding:"10px 0"}}>Nenhum pedido com marceneiro designado ainda.</div>
            )}
            {semLancamento.map(ped=>{
              const m=marceneiros.find(x=>x.id===ped.marcId);
              const comVal=+(ped.vt*(m?.comissao||0)/100).toFixed(2);
              return(<div key={ped.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid var(--bd)",gap:8,flexWrap:"wrap"}}>
                <div>
                  <div style={{fontSize:12,fontWeight:700,color:"var(--tx)"}}>Pedido {ped.num} — {ped.cliente}</div>
                  <div style={{fontSize:10,color:"var(--tx3)"}}>{m?.nome} · {m?.comissao}% · <strong style={{color:"var(--rd)"}}>{R$(comVal)}</strong></div>
                </div>
                <Btn small onClick={()=>gerarLancamento(ped)}><I.Plus/> Gerar Lançamento</Btn>
              </div>);
            })}
            {comEntries.map(f=>{
              const marc=marceneiros.find(m=>m.id===f.marcId);
              const pedCom=pedidos.find(p=>p.id===f.pedidoId);
              const pago=(f.parcelas||[]).filter(p=>p.pago).reduce((s,p)=>s+p.valor,0);
              const pendente=(f.parcelas||[]).filter(p=>!p.pago).reduce((s,p)=>s+p.valor,0);
              return(<div key={f.id} style={{borderBottom:"1px solid var(--bd)",paddingBottom:12,marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <div>
                    <div style={{fontSize:12,fontWeight:800,color:"var(--tx)"}}>{f.desc}{(()=>{const cliNome=getCli(pedCom?.clienteId)?.nome||pedCom?.cliente;return cliNome?<span style={{fontWeight:600,color:"var(--tx2)",marginLeft:6}}>— {cliNome}</span>:null;})()}</div>
                    <div style={{fontSize:10,color:"var(--tx3)",display:"flex",gap:10,marginTop:2,flexWrap:"wrap"}}>
                      <span>{marc?.nome}</span><span>Total: <b>{R$(f.valor)}</b></span>
                      <span style={{color:"var(--gn)"}}>Pago: <b>{R$(pago)}</b></span>
                      <span style={{color:pendente>0?"var(--rd)":"var(--tx3)"}}>Pendente: <b>{R$(pendente)}</b></span>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:6,alignItems:"center"}}>
                    <Badge color={pendente===0?"green":"red"}>{pendente===0?"✓ Quitado":"Pendente"}</Badge>
                    <button onClick={()=>{if(window.confirm("Cancelar esta comissão? O lançamento será removido."))setFinanceiro(ff=>ff.filter(x=>x.id!==f.id));}} style={{padding:"3px 8px",borderRadius:5,background:"none",border:"1px solid var(--rd)",color:"var(--rd)",fontSize:10,cursor:"pointer",fontWeight:700}} title="Cancelar comissão">✕ Cancelar</button>
                  </div>
                </div>
                {(f.parcelas||[]).length===0&&<div style={{fontSize:11,color:"var(--tx3)",fontStyle:"italic",marginBottom:6}}>Sem parcelas. Use "+ Parcela".</div>}
                {(f.parcelas||[]).map((p,pi)=>(
                  <div key={p.id||pi} style={{display:"grid",gridTemplateColumns:"140px 100px 110px 1fr 28px",gap:6,alignItems:"flex-end",padding:"6px 0",borderBottom:"1px solid var(--bd)33"}}>
                    <div><div style={{fontSize:8,color:"var(--tx3)",fontWeight:700,marginBottom:2}}>VENC.</div>
                      <input type="date" value={p.venc||""} onChange={e=>{const v=e.target.value;setFinanceiro(ff=>ff.map(x=>x.id===f.id?{...x,parcelas:x.parcelas.map((q,qi)=>qi===pi?{...q,venc:v}:q)}:x));}} style={{padding:"5px 6px",borderRadius:6,border:"1.5px solid var(--bd)",background:"var(--sf)",color:"var(--tx)",fontSize:11,width:"100%"}}/>
                    </div>
                    <div><div style={{fontSize:8,color:"var(--tx3)",fontWeight:700,marginBottom:2}}>VALOR</div>
                      <input type="number" value={p.valor||0} step="0.01" onChange={e=>{const v=+e.target.value;setFinanceiro(ff=>ff.map(x=>x.id===f.id?{...x,parcelas:x.parcelas.map((q,qi)=>qi===pi?{...q,valor:v}:q)}:x));}} style={{padding:"5px 6px",borderRadius:6,border:"1.5px solid var(--bd)",background:"var(--sf)",color:"var(--tx)",fontSize:11,width:"100%"}}/>
                    </div>
                    <div><div style={{fontSize:8,color:"var(--tx3)",fontWeight:700,marginBottom:2}}>FORMA</div>
                      <select value={p.formaPag||"pix"} onChange={e=>{const v=e.target.value;setFinanceiro(ff=>ff.map(x=>x.id===f.id?{...x,parcelas:x.parcelas.map((q,qi)=>qi===pi?{...q,formaPag:v}:q)}:x));}} style={{padding:"5px 6px",borderRadius:6,border:"1.5px solid var(--bd)",background:"var(--sf)",color:"var(--tx)",fontSize:11,width:"100%"}}>
                        <option value="pix">PIX</option><option value="ted">TED</option><option value="dinheiro">Dinheiro</option><option value="cheque">Cheque</option>
                      </select>
                    </div>
                    <div style={{display:"flex",justifyContent:"center"}}>
                      {p.pago
                        ?<div style={{textAlign:"center"}}>
                            <div style={{fontSize:9,color:"var(--gn)",fontWeight:800}}>✓{isoToBR(p.dataPago)}</div>
                            <button onClick={()=>{setFinanceiro(ff=>ff.map(x=>x.id===f.id?{...x,valorPago:Math.max(0,(x.valorPago||0)-p.valor),parcelas:x.parcelas.map((q,qi)=>qi===pi?{...q,pago:false,dataPago:""}:q)}:x));showToast("Reaberto");}} style={{padding:"2px 6px",borderRadius:4,background:"none",border:"1px solid var(--rd)",color:"var(--rd)",fontSize:9,cursor:"pointer"}}>↩</button>
                          </div>
                        :<button onClick={()=>{setFinanceiro(ff=>ff.map(x=>x.id===f.id?{...x,valorPago:(x.valorPago||0)+p.valor,parcelas:x.parcelas.map((q,qi)=>qi===pi?{...q,pago:true,dataPago:hojeISO()}:q)}:x));showToast("Pago!");}} style={{padding:"6px 10px",borderRadius:6,background:"var(--gnb)",border:"1.5px solid var(--gn)",color:"var(--gn)",fontSize:11,fontWeight:800,cursor:"pointer"}}>✓ Baixar</button>
                      }
                    </div>
                    <button onClick={()=>setFinanceiro(ff=>ff.map(x=>x.id===f.id?{...x,parcelas:x.parcelas.filter((_,qi)=>qi!==pi)}:x))} style={{background:"none",border:"none",color:"var(--rd)",cursor:"pointer",fontSize:16,paddingBottom:4}}>×</button>
                  </div>
                ))}
                <div style={{marginTop:8}}>
                  <Btn v="ghost" small onClick={()=>setFinanceiro(ff=>ff.map(x=>{if(x.id!==f.id)return x;const somaAtual=(x.parcelas||[]).reduce((s,p)=>s+p.valor,0);const restante=+Math.max(0,x.valor-somaAtual).toFixed(2);return{...x,parcelas:[...(x.parcelas||[]),{id:uid(),valor:restante,venc:"",pago:false,dataPago:"",formaPag:"pix"}]};}))}><I.Plus/> Parcela</Btn>
                </div>
              </div>);
            })}
          </div>
        </Card>}
      </div>

      {/* ══ COMISSÕES DE VENDEDORES (colapsável) ══ */}
      <div style={{marginBottom:14}}>
        <button onClick={()=>setShowComissoesVend(p=>!p)} style={{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 14px",borderRadius:"var(--r)",border:"1.5px solid rgba(99,102,241,.4)",background:"var(--sf)",color:"var(--tx2)",fontSize:11,fontWeight:700,cursor:"pointer",marginBottom:showComissoesVend?8:0}}>
          <span>🧑‍💼 Comissões de Vendedores{vendComPendTotal>0?` — A pagar: ${R$(vendComPendTotal)}`:""}</span>
          <span style={{fontSize:10}}>{showComissoesVend?"▲ Fechar":"▼ Abrir"}</span>
        </button>
        {showComissoesVend&&<Card style={{padding:0,border:"1.5px solid rgba(99,102,241,.2)"}}>
          <div style={{padding:"12px 16px"}}>
            {semLancVend.length===0&&vendComEntries.length===0&&(
              <div style={{fontSize:12,color:"var(--tx3)",textAlign:"center",padding:"10px 0"}}>Nenhum pedido com vendedor designado.</div>
            )}
            {semLancVend.map(ped=>{
              const v=vendedores.find(x=>x.id===ped.vendedorId);
              const comVend=+(ped.vt*(v?.comissao||0)/100).toFixed(2);
              return(<div key={ped.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid var(--bd)",gap:8,flexWrap:"wrap"}}>
                <div>
                  <div style={{fontSize:12,fontWeight:700,color:"var(--tx)"}}>Pedido {ped.num} — {getCli(ped.clienteId)?.nome}</div>
                  <div style={{fontSize:10,color:"var(--tx3)"}}>{v?.nome} · {v?.comissao}% · <strong style={{color:"var(--rd)"}}>{R$(comVend)}</strong></div>
                </div>
                <Btn small onClick={()=>gerarLancVend(ped)}><I.Plus/> Gerar Lançamento</Btn>
              </div>);
            })}
            {vendComEntries.map(f=>{
              const vend=vendedores.find(v=>v.id===f.vendedorId);
              const pedCom=pedidos.find(p=>p.id===f.pedidoId);
              const pago=(f.parcelas||[]).filter(p=>p.pago).reduce((s,p)=>s+p.valor,0);
              const pendente=(f.parcelas||[]).filter(p=>!p.pago).reduce((s,p)=>s+p.valor,0);
              return(<div key={f.id} style={{borderBottom:"1px solid var(--bd)",paddingBottom:12,marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <div>
                    <div style={{fontSize:12,fontWeight:800,color:"var(--tx)"}}>{f.desc}{(()=>{const cliNome=getCli(pedCom?.clienteId)?.nome;return cliNome?<span style={{fontWeight:600,color:"var(--tx2)",marginLeft:6}}>— {cliNome}</span>:null;})()}</div>
                    <div style={{fontSize:10,color:"var(--tx3)",display:"flex",gap:10,marginTop:2,flexWrap:"wrap"}}>
                      <span>{vend?.nome}</span><span>Total: <b>{R$(f.valor)}</b></span>
                      <span style={{color:"var(--gn)"}}>Pago: <b>{R$(pago)}</b></span>
                      <span style={{color:pendente>0?"var(--rd)":"var(--tx3)"}}>Pendente: <b>{R$(pendente)}</b></span>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:6,alignItems:"center"}}>
                    <Badge color={pendente===0?"green":"red"}>{pendente===0?"✓ Quitado":"Pendente"}</Badge>
                    <button onClick={()=>{if(window.confirm("Cancelar esta comissão?"))setFinanceiro(ff=>ff.filter(x=>x.id!==f.id));}} style={{padding:"3px 8px",borderRadius:5,background:"none",border:"1px solid var(--rd)",color:"var(--rd)",fontSize:10,cursor:"pointer",fontWeight:700}}>✕ Cancelar</button>
                  </div>
                </div>
                {(f.parcelas||[]).length===0&&<div style={{fontSize:11,color:"var(--tx3)",fontStyle:"italic",marginBottom:6}}>Sem parcelas. Use "+ Parcela".</div>}
                {(f.parcelas||[]).map((p,pi)=>(
                  <div key={p.id||pi} style={{display:"grid",gridTemplateColumns:"140px 100px 110px 1fr 28px",gap:6,alignItems:"flex-end",padding:"6px 0",borderBottom:"1px solid var(--bd)33"}}>
                    <div><div style={{fontSize:8,color:"var(--tx3)",fontWeight:700,marginBottom:2}}>VENC.</div>
                      <input type="date" value={p.venc||""} onChange={e=>{const v=e.target.value;setFinanceiro(ff=>ff.map(x=>x.id===f.id?{...x,parcelas:x.parcelas.map((q,qi)=>qi===pi?{...q,venc:v}:q)}:x));}} style={{padding:"5px 6px",borderRadius:6,border:"1.5px solid var(--bd)",background:"var(--sf)",color:"var(--tx)",fontSize:11,width:"100%"}}/>
                    </div>
                    <div><div style={{fontSize:8,color:"var(--tx3)",fontWeight:700,marginBottom:2}}>VALOR</div>
                      <input type="number" value={p.valor||0} step="0.01" onChange={e=>{const v=+e.target.value;setFinanceiro(ff=>ff.map(x=>x.id===f.id?{...x,parcelas:x.parcelas.map((q,qi)=>qi===pi?{...q,valor:v}:q)}:x));}} style={{padding:"5px 6px",borderRadius:6,border:"1.5px solid var(--bd)",background:"var(--sf)",color:"var(--tx)",fontSize:11,width:"100%"}}/>
                    </div>
                    <div><div style={{fontSize:8,color:"var(--tx3)",fontWeight:700,marginBottom:2}}>FORMA</div>
                      <select value={p.formaPag||"pix"} onChange={e=>{const v=e.target.value;setFinanceiro(ff=>ff.map(x=>x.id===f.id?{...x,parcelas:x.parcelas.map((q,qi)=>qi===pi?{...q,formaPag:v}:q)}:x));}} style={{padding:"5px 6px",borderRadius:6,border:"1.5px solid var(--bd)",background:"var(--sf)",color:"var(--tx)",fontSize:11,width:"100%"}}>
                        <option value="pix">PIX</option><option value="ted">TED</option><option value="dinheiro">Dinheiro</option><option value="cheque">Cheque</option>
                      </select>
                    </div>
                    <div style={{display:"flex",justifyContent:"center"}}>
                      {p.pago
                        ?<div style={{textAlign:"center"}}>
                            <div style={{fontSize:9,color:"var(--gn)",fontWeight:800}}>✓{isoToBR(p.dataPago)}</div>
                            <button onClick={()=>{setFinanceiro(ff=>ff.map(x=>x.id===f.id?{...x,valorPago:Math.max(0,(x.valorPago||0)-p.valor),parcelas:x.parcelas.map((q,qi)=>qi===pi?{...q,pago:false,dataPago:""}:q)}:x));showToast("Reaberto");}} style={{padding:"2px 6px",borderRadius:4,background:"none",border:"1px solid var(--rd)",color:"var(--rd)",fontSize:9,cursor:"pointer"}}>↩</button>
                          </div>
                        :<button onClick={()=>{setFinanceiro(ff=>ff.map(x=>x.id===f.id?{...x,valorPago:(x.valorPago||0)+p.valor,parcelas:x.parcelas.map((q,qi)=>qi===pi?{...q,pago:true,dataPago:hojeISO()}:q)}:x));showToast("Pago!");}} style={{padding:"6px 10px",borderRadius:6,background:"var(--gnb)",border:"1.5px solid var(--gn)",color:"var(--gn)",fontSize:11,fontWeight:800,cursor:"pointer"}}>✓ Baixar</button>
                      }
                    </div>
                    <button onClick={()=>setFinanceiro(ff=>ff.map(x=>x.id===f.id?{...x,parcelas:x.parcelas.filter((_,qi)=>qi!==pi)}:x))} style={{background:"none",border:"none",color:"var(--rd)",cursor:"pointer",fontSize:16,paddingBottom:4}}>×</button>
                  </div>
                ))}
                <div style={{marginTop:8}}>
                  <Btn v="ghost" small onClick={()=>setFinanceiro(ff=>ff.map(x=>{if(x.id!==f.id)return x;const somaAtual=(x.parcelas||[]).reduce((s,p)=>s+p.valor,0);const restante=+Math.max(0,x.valor-somaAtual).toFixed(2);return{...x,parcelas:[...(x.parcelas||[]),{id:uid(),valor:restante,venc:"",pago:false,dataPago:"",formaPag:"pix"}]};}))}><I.Plus/> Parcela</Btn>
                </div>
              </div>);
            })}
          </div>
        </Card>}
      </div>

      {/* ══ PAINEL FLUXO DE CAIXA (colapsável) ══ */}
      <div style={{marginBottom:14}}>
        <button onClick={()=>setShowFluxo(p=>!p)} style={{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 14px",borderRadius:"var(--r)",border:"1.5px solid var(--bd)",background:"var(--sf)",color:"var(--tx2)",fontSize:11,fontWeight:700,cursor:"pointer",marginBottom:showFluxo?8:0}}>
          <span>⚡ Fluxo de Caixa — Hoje / Semana / Mês / Projeção</span>
          <span style={{fontSize:10}}>{showFluxo?"▲ Fechar":"▼ Abrir"}</span>
        </button>
        {showFluxo&&<Card style={{padding:0,overflow:"hidden"}}>
        {/* Tabs */}
        <div style={{display:"flex",gap:0,borderBottom:"2px solid var(--bd)",background:"var(--sf)"}}>
          {[["hoje","⚡ Hoje"],["semana","📅 Semana"],["mes","🗓 Mês"],["anual","📊 Projeção Anual"]].map(([k,l])=>(
            <button key={k} onClick={()=>setFluxoTab(k)} style={{flex:1,padding:"11px 0",fontSize:11,fontWeight:700,background:fluxoTab===k?"var(--pri)":"transparent",color:fluxoTab===k?"#fff":"var(--tx3)",border:"none",cursor:"pointer",transition:"all .15s",borderBottom:fluxoTab===k?"2px solid var(--pri)":"2px solid transparent",marginBottom:-2}}>{l}</button>
          ))}
        </div>
        <div style={{padding:16}}>

          {/* ── ABA HOJE ── */}
          {fluxoTab==="hoje"&&<>
            {/* Vencimentos de hoje ainda não pagos */}
            {(parVencHojeRec.length>0||parVencHojePag.length>0)&&<div style={{background:"rgba(245,158,11,.08)",border:"1.5px solid rgba(245,158,11,.3)",borderRadius:"var(--r)",padding:"10px 14px",marginBottom:14}}>
              <div style={{fontSize:10,fontWeight:800,color:"#d97706",textTransform:"uppercase",marginBottom:8}}>⏰ Vence Hoje — Ação Necessária</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div>{parVencHojeRec.map((p,i)=><FluxoRow key={"vh"+i} p={p} cor="#d97706"/>)}{parVencHojeRec.length===0&&<span style={{fontSize:11,color:"var(--tx3)"}}>—</span>}</div>
                <div>{parVencHojePag.map((p,i)=><FluxoRow key={"vhp"+i} p={p} cor="#ef4444"/>)}{parVencHojePag.length===0&&<span style={{fontSize:11,color:"var(--tx3)"}}>—</span>}</div>
              </div>
            </div>}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
              <div>
                <div style={{fontSize:10,fontWeight:800,color:"var(--gn)",textTransform:"uppercase",marginBottom:8}}>✅ Recebido Hoje — {R$(recHoje)}</div>
                {parHojeRec.length===0?<div style={{fontSize:11,color:"var(--tx3)"}}>Nenhum recebimento registrado hoje</div>:parHojeRec.map((p,i)=><FluxoRow key={i} p={p} cor="var(--gn)"/>)}
              </div>
              <div>
                <div style={{fontSize:10,fontWeight:800,color:"var(--rd)",textTransform:"uppercase",marginBottom:8}}>✅ Pago Hoje — {R$(pagHoje)}</div>
                {parHojePag.length===0?<div style={{fontSize:11,color:"var(--tx3)"}}>Nenhum pagamento registrado hoje</div>:parHojePag.map((p,i)=><FluxoRow key={i} p={p} cor="var(--rd)"/>)}
              </div>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:12,paddingTop:12,borderTop:"1.5px solid var(--bd)"}}>
              <span style={{fontSize:12,fontWeight:800,color:recHoje-pagHoje>=0?"var(--gn)":"var(--rd)"}}>Resultado do Dia: {R$(recHoje-pagHoje)}</span>
              <span style={{fontSize:10,color:"var(--tx3)",fontWeight:600}}>Saldo em Caixa: {R$(caixaHoje)}</span>
            </div>
          </>}

          {/* ── ABA SEMANA ── */}
          {fluxoTab==="semana"&&<>
            {/* Seletor de semana do mês */}
            <div style={{marginBottom:16}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                <button onClick={()=>navFluxoMes(-1)} style={{background:"var(--sf)",border:"1.5px solid var(--bd)",borderRadius:8,padding:"3px 10px",fontSize:13,fontWeight:800,cursor:"pointer",color:"var(--tx)"}}>◀</button>
                <span style={{fontSize:9,fontWeight:800,color:"var(--tx3)",textTransform:"uppercase",letterSpacing:"1px",flex:1,textAlign:"center"}}>Semana do mês de {nomeMesFluxo}</span>
                <button onClick={()=>navFluxoMes(1)} style={{background:"var(--sf)",border:"1.5px solid var(--bd)",borderRadius:8,padding:"3px 10px",fontSize:13,fontWeight:800,cursor:"pointer",color:"var(--tx)"}}>▶</button>
              </div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {semanasDoMes.map((s,i)=>{
                  const isAtual=i===semAtualIdx;
                  const isSel=i===selIdx;
                  const label=`${isoToBR(s.ini).slice(0,5)} – ${isoToBR(s.fim).slice(0,5)}`;
                  return(
                    <button key={i} onClick={()=>setSemSel(i===semAtualIdx&&semSel===null?null:i)} style={{padding:"6px 12px",borderRadius:20,border:"1.5px solid "+(isSel?"var(--pri)":"var(--bd)"),background:isSel?"var(--prib)":"transparent",color:isSel?"var(--pri)":"var(--tx3)",fontSize:11,fontWeight:700,cursor:"pointer",position:"relative"}}>
                      {isAtual&&<span style={{position:"absolute",top:-5,right:-3,background:"var(--am)",color:"#fff",fontSize:7,fontWeight:800,borderRadius:6,padding:"1px 4px"}}>ATUAL</span>}
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
              <div>
                <div style={{fontSize:13,fontWeight:800,color:"var(--gn)",textTransform:"uppercase",marginBottom:8}}>Entradas —{R$(selSemRecTotal)}</div>
                {parSelSemPagoRec.length>0&&<><div style={{fontSize:12,color:"var(--tx3)",fontWeight:700,textTransform:"uppercase",marginBottom:4}}>✅ Recebidas ({parSelSemPagoRec.length})</div>{parSelSemPagoRec.map((p,i)=><FluxoRow key={"sr"+i} p={p} cor="var(--gn)"/>)}</>}
                {parSelSemRec.length>0&&<><div style={{fontSize:12,color:"var(--tx3)",fontWeight:700,textTransform:"uppercase",marginBottom:4,marginTop:8}}>🔜 A Receber ({parSelSemRec.length})</div>{parSelSemRec.sort((a,b)=>a.venc>b.venc?1:-1).map((p,i)=><FluxoRow key={"sr2"+i} p={p} cor="var(--gn)"/>)}</>}
                {parSelSemPagoRec.length===0&&parSelSemRec.length===0&&<div style={{fontSize:11,color:"var(--tx3)"}}>Nenhuma entrada nesta semana</div>}
              </div>
              <div>
                <div style={{fontSize:13,fontWeight:800,color:"var(--rd)",textTransform:"uppercase",marginBottom:8}}>Saídas —{R$(selSemPagTotal)}</div>
                {parSelSemPagoPag.length>0&&<><div style={{fontSize:12,color:"var(--tx3)",fontWeight:700,textTransform:"uppercase",marginBottom:4}}>✅ Pagas ({parSelSemPagoPag.length})</div>{parSelSemPagoPag.map((p,i)=><FluxoRow key={"sp"+i} p={p} cor="var(--rd)"/>)}</>}
                {parSelSemPag.length>0&&<><div style={{fontSize:12,color:"var(--tx3)",fontWeight:700,textTransform:"uppercase",marginBottom:4,marginTop:8}}>🔜 A Pagar ({parSelSemPag.length})</div>{parSelSemPag.sort((a,b)=>a.venc>b.venc?1:-1).map((p,i)=><FluxoRow key={"sp2"+i} p={p} cor="var(--rd)"/>)}</>}
                {parSelSemPagoPag.length===0&&parSelSemPag.length===0&&<div style={{fontSize:11,color:"var(--tx3)"}}>Nenhuma saída nesta semana</div>}
              </div>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:12,paddingTop:12,borderTop:"1.5px solid var(--bd)"}}>
              <span style={{fontSize:14,fontWeight:800,color:selSemRecTotal-selSemPagTotal>=0?"var(--gn)":"var(--rd)"}}>Resultado da Semana: {R$(selSemRecTotal-selSemPagTotal)}</span>
              <span style={{fontSize:12,color:"var(--tx3)",fontWeight:600}}>{isoToBR(selSemIni)} → {isoToBR(selSemFim)}</span>
            </div>
          </>}

          {/* ── ABA MÊS ── */}
          {fluxoTab==="mes"&&<>
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:16}}>
              <button onClick={()=>navFluxoMes(-1)} style={{background:"var(--sf)",border:"1.5px solid var(--bd)",borderRadius:8,padding:"5px 12px",fontSize:14,fontWeight:800,cursor:"pointer",color:"var(--tx)"}}>◀</button>
              <span style={{fontSize:13,fontWeight:800,color:"var(--tx)",textTransform:"capitalize",minWidth:140,textAlign:"center"}}>{nomeMesFluxo}</span>
              <button onClick={()=>navFluxoMes(1)} style={{background:"var(--sf)",border:"1.5px solid var(--bd)",borderRadius:8,padding:"5px 12px",fontSize:14,fontWeight:800,cursor:"pointer",color:"var(--tx)"}}>▶</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
              <div>
                <div style={{fontSize:13,fontWeight:800,color:"var(--gn)",textTransform:"uppercase",marginBottom:8}}>Entradas —{R$(esteMesRec)}</div>
                {parPagoMesRec.length>0&&<><div style={{fontSize:12,color:"var(--tx3)",fontWeight:700,textTransform:"uppercase",marginBottom:4}}>✅ Recebidas ({parPagoMesRec.length})</div>{parPagoMesRec.sort((a,b)=>normDate(a.dataPago)>normDate(b.dataPago)?1:-1).map((p,i)=><FluxoRow key={"mr"+i} p={p} cor="var(--gn)"/>)}</>}
                {parMesRec.length>0&&<><div style={{fontSize:12,color:"var(--tx3)",fontWeight:700,textTransform:"uppercase",marginBottom:4,marginTop:8}}>🔜 A Receber ({parMesRec.length})</div>{parMesRec.sort((a,b)=>a.venc>b.venc?1:-1).map((p,i)=><FluxoRow key={"mr2"+i} p={p} cor="var(--gn)"/>)}</>}
                {parPagoMesRec.length===0&&parMesRec.length===0&&<div style={{fontSize:11,color:"var(--tx3)"}}>Nenhuma entrada este mês</div>}
              </div>
              <div>
                <div style={{fontSize:13,fontWeight:800,color:"var(--rd)",textTransform:"uppercase",marginBottom:8}}>Saídas —{R$(esteMesPag)}</div>
                {parPagoMesPag.length>0&&<><div style={{fontSize:12,color:"var(--tx3)",fontWeight:700,textTransform:"uppercase",marginBottom:4}}>✅ Pagas ({parPagoMesPag.length})</div>{parPagoMesPag.sort((a,b)=>normDate(a.dataPago)>normDate(b.dataPago)?1:-1).map((p,i)=><FluxoRow key={"mp"+i} p={p} cor="var(--rd)"/>)}</>}
                {parMesPag.length>0&&<><div style={{fontSize:12,color:"var(--tx3)",fontWeight:700,textTransform:"uppercase",marginBottom:4,marginTop:8}}>🔜 A Pagar ({parMesPag.length})</div>{parMesPag.sort((a,b)=>a.venc>b.venc?1:-1).map((p,i)=><FluxoRow key={"mp2"+i} p={p} cor="var(--rd)"/>)}</>}
                {parPagoMesPag.length===0&&parMesPag.length===0&&<div style={{fontSize:11,color:"var(--tx3)"}}>Nenhuma saída este mês</div>}
              </div>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:12,paddingTop:12,borderTop:"1.5px solid var(--bd)"}}>
              <span style={{fontSize:14,fontWeight:800,color:esteMesRec-esteMesPag>=0?"var(--gn)":"var(--rd)"}}>Resultado do Mês: {R$(esteMesRec-esteMesPag)}</span>
              <span style={{fontSize:12,color:"var(--tx3)",fontWeight:600}}>{R$(recebidoMes)} recebido · {R$(saidoMes)} pago</span>
            </div>
          </>}

          {/* ── ABA PROJEÇÃO ANUAL ── */}
          {fluxoTab==="anual"&&<>
            <div style={{fontSize:11,color:"var(--tx3)",fontWeight:600,marginBottom:12}}>Projeção {anoAtual} — mês a mês até Dezembro, com breakdown por forma de pagamento</div>
            {/* Tabela anual */}
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                <thead>
                  <tr style={{background:"var(--sf)"}}>
                    <th style={{padding:"8px 10px",textAlign:"left",fontWeight:800,color:"var(--tx3)",fontSize:9,textTransform:"uppercase",borderBottom:"2px solid var(--bd)"}}>Mês</th>
                    <th style={{padding:"8px 10px",textAlign:"right",fontWeight:800,color:"var(--gn)",fontSize:9,textTransform:"uppercase",borderBottom:"2px solid var(--bd)"}}>Total Entradas</th>
                    <th style={{padding:"8px 10px",textAlign:"right",fontWeight:800,color:"#22d3ee",fontSize:9,textTransform:"uppercase",borderBottom:"2px solid var(--bd)"}}>PIX/TED</th>
                    <th style={{padding:"8px 10px",textAlign:"right",fontWeight:800,color:"var(--pp)",fontSize:9,textTransform:"uppercase",borderBottom:"2px solid var(--bd)"}}>Cartão 12x</th>
                    <th style={{padding:"8px 10px",textAlign:"right",fontWeight:800,color:"#f59e0b",fontSize:9,textTransform:"uppercase",borderBottom:"2px solid var(--bd)"}}>Cartão 18x</th>
                    <th style={{padding:"8px 10px",textAlign:"right",fontWeight:800,color:"var(--tx3)",fontSize:9,textTransform:"uppercase",borderBottom:"2px solid var(--bd)"}}>Outros</th>
                    <th style={{padding:"8px 10px",textAlign:"right",fontWeight:800,color:"var(--rd)",fontSize:9,textTransform:"uppercase",borderBottom:"2px solid var(--bd)"}}>Total Saídas</th>
                    <th style={{padding:"8px 10px",textAlign:"right",fontWeight:800,color:"var(--tx)",fontSize:9,textTransform:"uppercase",borderBottom:"2px solid var(--bd)"}}>Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {projecaoAnual.map((m,i)=>{
                    const pix=(m.grpRec["PIX"]||0);
                    const c12=(m.grpRec["Cartão 12x"]||0);
                    const c18=(m.grpRec["Cartão 18x"]||0);
                    const outros=m.totalRec-pix-c12-c18;
                    const saldoAcum=projecaoAnual.slice(0,i+1).reduce((s,x)=>s+x.saldo,0);
                    return(<tr key={m.mes} style={{background:m.isAtual?"rgba(99,102,241,.08)":"transparent",borderBottom:"1px solid var(--bd)"}}>
                      <td style={{padding:"9px 10px",fontWeight:800,color:m.isAtual?"var(--pri)":"var(--tx)"}}>
                        {m.label}{m.isAtual&&<span style={{fontSize:8,background:"var(--pri)",color:"#fff",borderRadius:4,padding:"1px 5px",marginLeft:5,fontWeight:700}}>ATUAL</span>}
                      </td>
                      <td style={{padding:"9px 10px",textAlign:"right",fontWeight:800,color:"var(--gn)"}}>{m.totalRec>0?R$(m.totalRec):<span style={{color:"var(--tx3)"}}>—</span>}</td>
                      <td style={{padding:"9px 10px",textAlign:"right",color:"#22d3ee",fontWeight:600}}>{pix>0?R$(pix):<span style={{color:"var(--tx3)"}}>—</span>}</td>
                      <td style={{padding:"9px 10px",textAlign:"right",color:"var(--pp)",fontWeight:600}}>{c12>0?R$(c12):<span style={{color:"var(--tx3)"}}>—</span>}</td>
                      <td style={{padding:"9px 10px",textAlign:"right",color:"#f59e0b",fontWeight:600}}>{c18>0?R$(c18):<span style={{color:"var(--tx3)"}}>—</span>}</td>
                      <td style={{padding:"9px 10px",textAlign:"right",color:"var(--tx3)",fontWeight:600}}>{outros>0?R$(outros):<span style={{color:"var(--tx3)"}}>—</span>}</td>
                      <td style={{padding:"9px 10px",textAlign:"right",fontWeight:800,color:"var(--rd)"}}>{m.totalPag>0?R$(m.totalPag):<span style={{color:"var(--tx3)"}}>—</span>}</td>
                      <td style={{padding:"9px 10px",textAlign:"right",fontWeight:900,color:m.saldo>=0?"var(--gn)":"var(--rd)"}}>{R$(m.saldo)}</td>
                    </tr>);
                  })}
                </tbody>
                <tfoot>
                  <tr style={{background:"var(--sf)",borderTop:"2px solid var(--bd)"}}>
                    <td style={{padding:"10px",fontWeight:900,color:"var(--tx)",fontSize:12}}>TOTAL {anoAtual}</td>
                    <td style={{padding:"10px",textAlign:"right",fontWeight:900,color:"var(--gn)",fontSize:12}}>{R$(projecaoAnual.reduce((s,m)=>s+m.totalRec,0))}</td>
                    <td style={{padding:"10px",textAlign:"right",fontWeight:800,color:"#22d3ee"}}>{R$(projecaoAnual.reduce((s,m)=>s+(m.grpRec["PIX"]||0),0))}</td>
                    <td style={{padding:"10px",textAlign:"right",fontWeight:800,color:"var(--pp)"}}>{R$(projecaoAnual.reduce((s,m)=>s+(m.grpRec["Cartão 12x"]||0),0))}</td>
                    <td style={{padding:"10px",textAlign:"right",fontWeight:800,color:"#f59e0b"}}>{R$(projecaoAnual.reduce((s,m)=>s+(m.grpRec["Cartão 18x"]||0),0))}</td>
                    <td style={{padding:"10px",textAlign:"right",fontWeight:800,color:"var(--tx3)"}}>{R$(projecaoAnual.reduce((s,m)=>s+Math.max(0,m.totalRec-(m.grpRec["PIX"]||0)-(m.grpRec["Cartão 12x"]||0)-(m.grpRec["Cartão 18x"]||0)),0))}</td>
                    <td style={{padding:"10px",textAlign:"right",fontWeight:900,color:"var(--rd)",fontSize:12}}>{R$(projecaoAnual.reduce((s,m)=>s+m.totalPag,0))}</td>
                    <td style={{padding:"10px",textAlign:"right",fontWeight:900,fontSize:13,color:projecaoAnual.reduce((s,m)=>s+m.saldo,0)>=0?"var(--gn)":"var(--rd)"}}>{R$(projecaoAnual.reduce((s,m)=>s+m.saldo,0))}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            {/* Detalhamento por mês expandível */}
            <div style={{marginTop:16}}>
              <div style={{fontSize:10,fontWeight:800,color:"var(--tx3)",textTransform:"uppercase",marginBottom:8}}>Detalhamento por Mês</div>
              {projecaoAnual.filter(m=>m.totalRec>0||m.totalPag>0).map(m=>(
                <details key={m.mes} style={{borderBottom:"1px solid var(--bd)",padding:"6px 0"}} open={m.isAtual}>
                  <summary style={{cursor:"pointer",fontSize:12,fontWeight:800,color:m.isAtual?"var(--pri)":"var(--tx)",padding:"4px 0",listStyle:"none",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span>{m.label} {anoAtual}{m.isAtual?" (mês atual)":""}</span>
                    <span style={{display:"flex",gap:16}}>
                      <span style={{color:"var(--gn)",fontWeight:800}}>{R$(m.totalRec)}</span>
                      <span style={{color:"var(--rd)",fontWeight:800}}>{R$(m.totalPag)}</span>
                      <span style={{color:m.saldo>=0?"var(--gn)":"var(--rd)",fontWeight:900}}>{R$(m.saldo)}</span>
                    </span>
                  </summary>
                  <div style={{paddingTop:8,display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                    <div>
                      <div style={{fontSize:9,fontWeight:800,color:"var(--gn)",textTransform:"uppercase",marginBottom:4}}>Entradas</div>
                      {[...m.pRecPago,...m.pRec].sort((a,b)=>(a.venc||a.dataPago||"")>(b.venc||b.dataPago||"")?1:-1).map((p,i)=><FluxoRow key={i} p={p} cor="var(--gn)"/>)}
                      {m.pRec.length===0&&m.pRecPago.length===0&&<span style={{fontSize:11,color:"var(--tx3)"}}>—</span>}
                    </div>
                    <div>
                      <div style={{fontSize:9,fontWeight:800,color:"var(--rd)",textTransform:"uppercase",marginBottom:4}}>Saídas</div>
                      {[...m.pPagPago,...m.pPag].sort((a,b)=>(a.venc||a.dataPago||"")>(b.venc||b.dataPago||"")?1:-1).map((p,i)=><FluxoRow key={i} p={p} cor="var(--rd)"/>)}
                      {m.pPag.length===0&&m.pPagPago.length===0&&<span style={{fontSize:11,color:"var(--tx3)"}}>—</span>}
                    </div>
                  </div>
                </details>
              ))}
              {projecaoAnual.every(m=>m.totalRec===0&&m.totalPag===0)&&<div style={{fontSize:12,color:"var(--tx3)",textAlign:"center",padding:20}}>Nenhuma parcela cadastrada com vencimento em {anoAtual}</div>}
            </div>
          </>}

        </div>
        </Card>}
      </div>

      {/* ── OLD COMISSÕES REMOVED ── */}
      {false&&<div>
          {/* Pedidos sem lançamento — botão para gerar */}
          {semLancamento.map(ped=>{
            const m=marceneiros.find(x=>x.id===ped.marcId);
            const comVal=+(ped.vt*(m?.comissao||0)/100).toFixed(2);
            return(<div key={ped.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",borderRadius:"var(--r)",border:"1.5px dashed var(--bd)",background:"var(--sf)",marginBottom:8,gap:8,flexWrap:"wrap"}}>
              <div>
                <div style={{fontSize:12,fontWeight:700,color:"var(--tx)"}}>Pedido {ped.num} — {ped.cliente}</div>
                <div style={{fontSize:10,color:"var(--tx3)"}}>{m?.nome} · {m?.comissao}% · Comissão: {R$(comVal)}</div>
              </div>
              <Btn small onClick={()=>gerarLancamento(ped)}><I.Plus/> Gerar Lançamento</Btn>
            </div>);
          })}
          {/* Entradas já criadas — editáveis */}
          {comEntries.map(f=>{
            const marc=marceneiros.find(m=>m.id===f.marcId);
            const pago=(f.parcelas||[]).filter(p=>p.pago).reduce((s,p)=>s+p.valor,0);
            const pendente=(f.parcelas||[]).filter(p=>!p.pago).reduce((s,p)=>s+p.valor,0);
            return(<Card key={f.id} style={{marginBottom:10,padding:"12px 16px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                <div>
                  <div style={{fontSize:13,fontWeight:800,color:"var(--tx)"}}>{f.desc}</div>
                  <div style={{fontSize:10,color:"var(--tx3)",marginTop:2}}>{marc?.nome} · Total: {R$(f.valor)} · Pago: <span style={{color:"var(--gn)",fontWeight:700}}>{R$(pago)}</span> · Pendente: <span style={{color:pendente>0?"var(--rd)":"var(--tx3)",fontWeight:700}}>{R$(pendente)}</span></div>
                </div>
                <Badge color={pendente===0?"green":"red"}>{pendente===0?"✓ Quitado":"Pendente"}</Badge>
              </div>
              {(f.parcelas||[]).length===0&&<div style={{fontSize:11,color:"var(--tx3)",marginBottom:8}}>Nenhuma parcela. Clique em "+ Parcela" para adicionar.</div>}
              {(f.parcelas||[]).map((p,pi)=>(
                <div key={p.id||pi} style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr auto auto",gap:6,alignItems:"flex-end",padding:"8px 0",borderBottom:"1px solid var(--bd)",fontSize:11}}>
                  <div>
                    <div style={{fontSize:9,color:"var(--tx3)",fontWeight:700,marginBottom:2}}>Vencimento</div>
                    <input type="date" value={p.venc||""} onChange={e=>{const v=e.target.value;setFinanceiro(ff=>ff.map(x=>x.id===f.id?{...x,parcelas:x.parcelas.map((q,qi)=>qi===pi?{...q,venc:v}:q)}:x));}} style={{padding:"5px 8px",borderRadius:6,border:"1.5px solid var(--bd)",background:"var(--sf)",color:"var(--tx)",fontSize:11,width:"100%"}}/>
                  </div>
                  <div>
                    <div style={{fontSize:9,color:"var(--tx3)",fontWeight:700,marginBottom:2}}>Valor (R$)</div>
                    <input type="number" value={p.valor||0} onChange={e=>{const v=+e.target.value;setFinanceiro(ff=>ff.map(x=>x.id===f.id?{...x,parcelas:x.parcelas.map((q,qi)=>qi===pi?{...q,valor:v}:q)}:x));}} style={{padding:"5px 8px",borderRadius:6,border:"1.5px solid var(--bd)",background:"var(--sf)",color:"var(--tx)",fontSize:11,width:"100%"}}/>
                  </div>
                  <div>
                    <div style={{fontSize:9,color:"var(--tx3)",fontWeight:700,marginBottom:2}}>Forma</div>
                    <select value={p.formaPag||"pix"} onChange={e=>{const v=e.target.value;setFinanceiro(ff=>ff.map(x=>x.id===f.id?{...x,parcelas:x.parcelas.map((q,qi)=>qi===pi?{...q,formaPag:v}:q)}:x));}} style={{padding:"5px 8px",borderRadius:6,border:"1.5px solid var(--bd)",background:"var(--sf)",color:"var(--tx)",fontSize:11,width:"100%"}}>
                      <option value="pix">PIX</option><option value="ted">TED</option><option value="dinheiro">Dinheiro</option><option value="cheque">Cheque</option>
                    </select>
                  </div>
                  {p.pago
                    ?<div style={{display:"flex",gap:4,alignItems:"center",flexDirection:"column",paddingBottom:2}}>
                        <span style={{fontSize:9,color:"var(--gn)",fontWeight:800,whiteSpace:"nowrap"}}>✓ {isoToBR(p.dataPago)}</span>
                        <button onClick={()=>{setFinanceiro(ff=>ff.map(x=>x.id===f.id?{...x,valorPago:Math.max(0,(x.valorPago||0)-p.valor),parcelas:x.parcelas.map((q,qi)=>qi===pi?{...q,pago:false,dataPago:""}:q)}:x));showToast("Baixa desfeita");}} style={{background:"none",border:"1px solid var(--rd)",color:"var(--rd)",borderRadius:6,padding:"2px 6px",fontSize:9,cursor:"pointer",whiteSpace:"nowrap"}}>↩ Reabrir</button>
                      </div>
                    :<button onClick={()=>{const hoje=hojeISO();setFinanceiro(ff=>ff.map(x=>x.id===f.id?{...x,valorPago:(x.valorPago||0)+p.valor,parcelas:x.parcelas.map((q,qi)=>qi===pi?{...q,pago:true,dataPago:hoje}:q)}:x));showToast("Pagamento registrado!");}} style={{padding:"6px 12px",borderRadius:6,background:"var(--gnb)",border:"1.5px solid var(--gn)",color:"var(--gn)",fontSize:11,fontWeight:800,cursor:"pointer",whiteSpace:"nowrap"}}>✓ Baixar</button>
                  }
                  <button onClick={()=>{setFinanceiro(ff=>ff.map(x=>x.id===f.id?{...x,parcelas:x.parcelas.filter((_,qi)=>qi!==pi)}:x));}} style={{background:"none",border:"none",color:"var(--rd)",cursor:"pointer",padding:4}}><I.Trash/></button>
                </div>
              ))}
              <div style={{marginTop:8,display:"flex",gap:8}}>
                <Btn v="ghost" small onClick={()=>setFinanceiro(ff=>ff.map(x=>{if(x.id!==f.id)return x;const somaAtual=(x.parcelas||[]).reduce((s,p)=>s+p.valor,0);const restante=+Math.max(0,x.valor-somaAtual).toFixed(2);return{...x,parcelas:[...(x.parcelas||[]),{id:uid(),valor:restante,venc:"",pago:false,dataPago:"",formaPag:"pix"}]};}))}><I.Plus/> Parcela</Btn>
              </div>
            </Card>);
          })}
      </div>}

      {/* ── ABERTURA DE CAIXA ── */}
      {editSaldoInicial&&<div style={{background:"var(--prib)",borderRadius:"var(--r)",padding:"10px 16px",marginBottom:12,display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
        <span style={{fontSize:12,fontWeight:700,color:"var(--tx)"}}>Abertura de Caixa:</span>
        <input type="number" defaultValue={saldoInicial} id="siInput" step="0.01" style={{padding:"5px 10px",borderRadius:8,border:"1.5px solid var(--pri)",background:"var(--sf)",color:"var(--tx)",fontSize:13,fontWeight:700,outline:"none",width:140}}/>
        <Btn small onClick={()=>{const v=+(document.getElementById("siInput").value||0);setSaldoInicial(v);localStorage.setItem('erp_saldoInicial',JSON.stringify(v));setEditSaldoInicial(false);showToast("Abertura de caixa salva!")}}><I.Check/> Salvar</Btn>
        <Btn v="ghost" small onClick={()=>setEditSaldoInicial(false)}>Cancelar</Btn>
      </div>}
      <div style={{marginBottom:14,display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
        <button onClick={()=>setEditSaldoInicial(!editSaldoInicial)} style={{background:"none",border:"1.5px solid var(--bd)",color:"var(--tx2)",fontSize:11,fontWeight:700,borderRadius:8,padding:"5px 12px",cursor:"pointer"}}>💰 Abertura de Caixa</button>
      </div>
    </div>);};

  // ESTOQUE
  const PgEst=()=>{const [eE,setEE]=useState(null);
    const alerta=estoque.filter(e=>e.estoqueMin>0&&e.qtd<=e.estoqueMin);
    return(<div style={{animation:"fadeIn .3s"}}>
      <SH title="Estoque" sub={`${estoque.length} itens • Valor total: ${R$(stats.estVal)}`} right={<div style={{display:"flex",gap:6,alignItems:"center"}}>{alerta.length>0&&<Badge color="red">⚠ {alerta.length} em alerta</Badge>}<Btn onClick={()=>setEE({nome:"",un:"un",qtd:0,custo:0,estoqueMin:0})}><I.Plus/> Novo</Btn></div>}/>
      {alerta.length>0&&<div style={{background:"rgba(239,68,68,.06)",border:"1.5px solid rgba(239,68,68,.2)",borderRadius:"var(--r)",padding:"10px 16px",marginBottom:14,display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
        <span style={{fontSize:12,fontWeight:800,color:"var(--rd)"}}>⚠ Estoque mínimo atingido:</span>
        {alerta.map(e=><Badge key={e.id} color="red">{e.nome} ({e.qtd} {e.un})</Badge>)}
      </div>}
      {eE&&<Modal onClose={()=>setEE(null)}>
        <h2 style={{fontSize:16,fontWeight:800,color:"var(--tx)",marginBottom:16}}>{eE.id?"Editar":"Novo"} Item</h2>
        <Field label="Material" value={eE.nome} onChange={v=>setEE({...eE,nome:v})}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:10}}>
          <Field label="Unidade" value={eE.un} onChange={v=>setEE({...eE,un:v})}/>
          <Field label="Qtd" type="number" value={eE.qtd} onChange={v=>setEE({...eE,qtd:+v})}/>
          <Field label="Custo Unit." type="number" value={eE.custo} onChange={v=>setEE({...eE,custo:+v})}/>
          <Field label="Estoque Mín." type="number" value={eE.estoqueMin||0} onChange={v=>setEE({...eE,estoqueMin:+v})}/>
        </div>
        <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:8}}>
          <Btn v="ghost" onClick={()=>setEE(null)}>Cancelar</Btn>
          <Btn onClick={()=>{if(!eE.nome)return showToast("Nome!","red");if(eE.id){setEstoque(p=>p.map(e=>e.id===eE.id?{...e,...eE}:e))}else{setEstoque(p=>[...p,{...eE,id:uid()}])}setEE(null);showToast("Salvo!")}}><I.Check/> Salvar</Btn>
        </div>
      </Modal>}
      <Card><TH cols={[{l:"Material",w:"2fr"},{l:"Un.",w:"60px"},{l:"Qtd",w:"80px"},{l:"Mín.",w:"60px"},{l:"Custo",w:"90px"},{l:"Total",w:"100px"},{l:"",w:"60px"}]}/>
      {estoque.map(e=>{const minAlert=e.estoqueMin>0&&e.qtd<=e.estoqueMin;return(<div key={e.id} style={{display:"grid",gridTemplateColumns:"2fr 60px 80px 60px 90px 100px 60px",gap:6,padding:"10px 18px",borderBottom:"1.5px solid var(--bd)",alignItems:"center",fontSize:12,background:minAlert?"rgba(239,68,68,.03)":"transparent"}}>
        <div style={{display:"flex",alignItems:"center",gap:6}}>{minAlert&&<span title="Estoque mínimo atingido" style={{color:"var(--rd)",fontWeight:800,fontSize:14}}>⚠</span>}<span style={{fontWeight:700,color:"var(--tx)"}}>{e.nome}</span></div>
        <span style={{color:"var(--tx2)"}}>{e.un}</span>
        <span style={{color:minAlert?"var(--rd)":"var(--tx)",fontWeight:minAlert?800:600}}>{e.qtd}</span>
        <span style={{color:"var(--tx3)",fontSize:11}}>{e.estoqueMin||"—"}</span>
        <span style={{color:"var(--tx2)"}}>{R$(e.custo)}</span>
        <span style={{fontWeight:700,color:"var(--tx)"}}>{R$(e.qtd*e.custo)}</span>
        <div style={{display:"flex",gap:3}}><button onClick={()=>setEE(e)} style={{background:"none",border:"none",color:"var(--tx3)",padding:3}}><I.Edit/></button><button onClick={()=>{setEstoque(p=>p.filter(x=>x.id!==e.id));showToast("Removido","red")}} style={{background:"none",border:"none",color:"var(--rd)",padding:3}}><I.Trash/></button></div>
      </div>)})}</Card>
    </div>);};

  // DRE
  const PgDRE=()=>{
    const anos=[...new Set([...pedidos.map(p=>p.data?.split("/")[2]||new Date().getFullYear().toString()),...financeiro.map(f=>f.parcelas?.[0]?.venc?.slice(0,4)).filter(Boolean)])].sort().reverse();
    const anoStr=String(dreAno);
    const pedAno=pedidos.filter(p=>p.data?.endsWith(anoStr));
    const finAno=financeiro.filter(f=>f.parcelas?.some(p=>p.venc?.startsWith(anoStr)));
    const recPed=pedAno.reduce((s,p)=>s+p.vt,0);
    const cm=pedAno.reduce((s,p)=>s+p.cm,0);
    const cc=pedAno.reduce((s,p)=>s+p.comVal,0);
    // Receitas manuais: financeiro receber sem vínculo com pedido + recebimentos manuais
    const recFinMan=financeiro.filter(f=>f.tipo==="receber"&&!f.pedidoId).reduce((s,f)=>s+f.parcelas.filter(p=>p.venc?.startsWith(anoStr)).reduce((ss,p)=>ss+p.valor,0),0);
    const recRecMan=recebimentos.reduce((s,r)=>s+r.parcelas.filter(p=>p.venc?.startsWith(anoStr)).reduce((ss,p)=>ss+p.valor,0),0);
    const rec=recPed+recFinMan+recRecMan;
    // Despesas: excluir marcId (comissão marceneiro, já em cc) e materiais de pedido (já em cm)
    // Manter: vendedorId (comissão vendedor, não está em cc) e entradas manuais sem pedidoId
    const filtroDespesas=f=>f.tipo==="pagar"&&(!f.pedidoId||f.vendedorId);
    const despesasFin=financeiro.filter(filtroDespesas).reduce((s,f)=>s+f.parcelas.filter(p=>p.venc?.startsWith(anoStr)).reduce((ss,p)=>ss+p.valor,0),0);
    const despesasFinPagas=financeiro.filter(filtroDespesas).reduce((s,f)=>s+f.parcelas.filter(p=>p.venc?.startsWith(anoStr)&&p.pago).reduce((ss,p)=>ss+p.valor,0),0);
    const lb=rec-cm;const ll=lb-cc-despesasFin;const mg=rec>0?((ll/rec)*100).toFixed(1):0;
    const rows=[{l:"(+) Receita Bruta",v:rec,c:"gn",b:true},{l:"(−) Custo Materiais",v:-cm,c:"rd"},{l:"= Lucro Bruto",v:lb,c:lb>=0?"gn":"rd",b:true,line:true},{l:"(−) Comissões",v:-cc,c:"rd"},{l:"(−) Despesas (competência)",v:-despesasFin,c:"rd"},{l:"    ↳ Já pagas",v:-despesasFinPagas,c:"rd",sub:true},{l:"= Resultado Líquido",v:ll,c:ll>=0?"gn":"rd",b:true,line:true}];
    const chartData=[{name:"Receita",value:rec},{name:"Materiais",value:cm},{name:"Comissões",value:cc},{name:"Despesas",value:despesasFin},{name:"Lucro Líq.",value:Math.max(0,ll)}];
    const byPed=pedAno.map(p=>({name:p.num,receita:p.vt,custo:p.cm,comissao:p.comVal,lucro:p.vt-p.cm-p.comVal}));
    // Mensal para fechamento anual
    const MESES=["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
    const mensalData=MESES.map((m,i)=>{
      const mm=String(i+1).padStart(2,"0");const prefx=`${anoStr}-${mm}`;
      const recMPed=pedidos.filter(p=>{const[d,mo,a]=p.data?.split("/")||[];return a===anoStr&&mo===mm;}).reduce((s,p)=>s+p.vt,0);
      const recMFin=financeiro.filter(f=>f.tipo==="receber"&&!f.pedidoId).reduce((s,f)=>s+f.parcelas.filter(p=>p.venc?.startsWith(prefx)).reduce((ss,p)=>ss+p.valor,0),0);
      const recMRec=recebimentos.reduce((s,r)=>s+r.parcelas.filter(p=>p.venc?.startsWith(prefx)).reduce((ss,p)=>ss+p.valor,0),0);
      const recM=recMPed+recMFin+recMRec;
      const pagM=financeiro.filter(f=>f.tipo==="pagar"&&(!f.pedidoId||f.vendedorId)).reduce((s,f)=>s+f.parcelas.filter(p=>p.venc?.startsWith(prefx)).reduce((ss,p)=>ss+p.valor,0),0);
      return{name:m,receita:recM,despesas:pagM,resultado:recM-pagM};
    });
    // Categorias de despesa para o ano
    const byCat={};financeiro.filter(f=>f.tipo==="pagar"&&(!f.pedidoId||f.vendedorId)).forEach(f=>{const pags=f.parcelas.filter(p=>p.venc?.startsWith(anoStr));if(!pags.length)return;const v=pags.reduce((s,p)=>s+p.valor,0);const c=f.categoria||"Outros";byCat[c]=(byCat[c]||0)+v;});
    const catData=Object.entries(byCat).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value);
    const print=()=>{const w=window.open('','_blank','width=900,height=700');const s=`body{font-family:Arial,sans-serif;padding:30px;font-size:12px;color:#1e293b}h1{font-size:20px;font-weight:800;color:#6366f1}table{width:100%;border-collapse:collapse;margin:12px 0}th{background:#f8f7ff;padding:7px;font-size:10px;text-transform:uppercase;color:#999;border-bottom:2px solid #e0e0f0;text-align:left}td{padding:8px;border-bottom:1px solid #f0eeff}.total{font-weight:800;font-size:14px}.green{color:#10b981}.red{color:#ef4444}`;w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><style>${s}</style></head><body><h1>DRE — Fechamento ${dreAno}</h1><p style="color:#888">Empresa: ${empresa.nome} • Gerado em ${hoje()}</p><table><tr>${rows.map(r=>`<tr><td>${r.l}</td><td class="${r.v>=0?'green':'red'} ${r.b?'total':''}">${R$(r.v)}</td></tr>`).join('')}</table><h2 style="font-size:14px;margin-top:20px">Resultado Mensal</h2><table><tr><th>Mês</th><th>Receita</th><th>Despesas</th><th>Resultado</th></tr>${mensalData.map(m=>`<tr><td>${m.name}</td><td class="green">${R$(m.receita)}</td><td class="red">${R$(m.despesas)}</td><td class="${m.resultado>=0?'green':'red'}">${R$(m.resultado)}</td></tr>`).join('')}</table></body></html>`);w.document.close();setTimeout(()=>w.print(),400);};
    const printMes=()=>{if(!dreMes)return;const[aaaa,mm]=dreMes.split("-");const nomeMes=MESES[+mm-1];const recM=pedidos.filter(p=>{const[d,mo,a]=p.data?.split("/")||[];return a===aaaa&&mo===mm;}).reduce((s,p)=>s+p.vt,0);const pagM=financeiro.filter(f=>f.tipo==="pagar"&&(!f.pedidoId||f.vendedorId)).reduce((s,f)=>s+f.parcelas.filter(p=>p.venc?.startsWith(dreMes)&&p.pago).reduce((ss,p)=>ss+p.valor,0),0);const recM2=financeiro.filter(f=>f.tipo==="receber"&&!f.pedidoId).reduce((s,f)=>s+f.parcelas.filter(p=>p.venc?.startsWith(dreMes)&&p.pago).reduce((ss,p)=>ss+p.valor,0),0);const recTotal=recM+recM2;const byCatM={};financeiro.filter(f=>f.tipo==="pagar"&&(!f.pedidoId||f.vendedorId)).forEach(f=>{const pags=f.parcelas.filter(p=>p.venc?.startsWith(dreMes)&&p.pago);if(!pags.length)return;const v=pags.reduce((s,p)=>s+p.valor,0);const c=f.categoria||"Outros";byCatM[c]=(byCatM[c]||0)+v;});const w=window.open('','_blank','width=900,height=700');const s=`body{font-family:Arial,sans-serif;padding:30px;font-size:12px;color:#1e293b}h1{font-size:20px;font-weight:800;color:#6366f1}h2{font-size:14px;color:#334155;margin-top:20px}table{width:100%;border-collapse:collapse;margin:10px 0}th{background:#f8f7ff;padding:7px;font-size:10px;text-transform:uppercase;color:#999;border-bottom:2px solid #e0e0f0;text-align:left}td{padding:8px;border-bottom:1px solid #f0eeff}.total{font-weight:800}.gn{color:#10b981}.rd{color:#ef4444}`;w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><style>${s}</style></head><body><h1>Fechamento Mensal — ${nomeMes}/${aaaa}</h1><p style="color:#888">Empresa: ${empresa.nome} • Gerado em ${hoje()}</p><table><tr><th>Item</th><th>Valor</th></tr><tr><td>Receita Pedidos</td><td class="gn">${R$(recM)}</td></tr><tr><td>Receita Financeiro (parcelas recebidas)</td><td class="gn">${R$(recM2)}</td></tr><tr><td class="total">Total Receitas</td><td class="gn total">${R$(recTotal)}</td></tr><tr><td>Despesas Pagas</td><td class="rd">${R$(pagM)}</td></tr><tr><td class="total">Resultado</td><td class="${recTotal-pagM>=0?'gn':'rd'} total">${R$(recTotal-pagM)}</td></tr></table><h2>Despesas por Categoria</h2><table><tr><th>Categoria</th><th>Valor</th></tr>${Object.entries(byCatM).map(([c,v])=>`<tr><td>${c}</td><td class="rd">${R$(v)}</td></tr>`).join('')}</table></body></html>`);w.document.close();setTimeout(()=>w.print(),400);};
    return(<div style={{animation:"fadeIn .3s"}}><SH title="DRE — Demonstração de Resultados" right={<div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}><select value={dreAno} onChange={e=>setDreAno(+e.target.value)} style={{padding:"7px 12px",borderRadius:10,border:"1.5px solid var(--bd)",background:"var(--sf)",color:"var(--tx)",fontSize:12,fontWeight:700,outline:"none"}}>{[...new Set([dreAno,new Date().getFullYear(),new Date().getFullYear()-1])].sort().reverse().map(a=><option key={a} value={a}>{a}</option>)}</select><Btn v="ghost" small onClick={print}><I.Printer/> Fechar Ano</Btn><input type="month" value={dreMes} onChange={e=>setDreMes(e.target.value)} style={{padding:"6px 10px",borderRadius:10,border:"1.5px solid var(--bd)",background:"var(--sf)",color:"var(--tx)",fontSize:12,fontWeight:700,outline:"none"}}/>{dreMes&&<Btn v="secondary" small onClick={printMes}><I.Printer/> Fechar Mês</Btn>}{dreMes&&<button onClick={()=>setDreMes("")} style={{background:"none",border:"none",color:"var(--tx3)",cursor:"pointer",fontSize:12}}>✕</button>}</div>}/>
      <div style={{display:"flex",gap:12,marginBottom:20,flexWrap:"wrap"}}><KPI label="Receita" value={R$(rec)} icon={<I.Dollar/>} color="gn"/><KPI label="Materiais" value={R$(cm)} icon={<I.Package/>} color="rd"/><KPI label="Comissões" value={R$(cc)} icon={<I.Percent/>} color="am"/><KPI label="Margem Líq." value={`${mg}%`} icon={<I.DRE/>} color={ll>=0?"gn":"rd"}/></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
        <Card style={{maxWidth:500}}>{rows.map((r,i)=><div key={i} style={{padding:r.sub?"6px 20px 6px 32px":"12px 20px",borderTop:r.line?"2px solid var(--bd)":r.sub?"none":"1.5px solid var(--bd)",display:"flex",justifyContent:"space-between",alignItems:"center",background:r.sub?"var(--bg)":"transparent"}}><span style={{fontSize:r.sub?11:13,fontWeight:r.b?800:600,color:r.sub?"var(--tx3)":"var(--tx)",fontStyle:r.sub?"italic":"normal"}}>{r.l}</span><span style={{fontSize:r.b?18:r.sub?11:14,fontWeight:r.sub?600:800,color:r.sub?"var(--tx3)":`var(--${r.c})`}}>{R$(r.v)}</span></div>)}</Card>
        <Card><CardHead title="Composição"/><div style={{padding:16,height:220}}><ResponsiveContainer><PieChart><Pie data={chartData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>{chartData.map((e,i)=><Cell key={i} fill={["#10b981","#ef4444","#f59e0b","#6366f1"][i]}/>)}</Pie><Tooltip formatter={v=>R$(v)}/><Legend iconType="circle" wrapperStyle={{fontSize:10,fontWeight:700}}/></PieChart></ResponsiveContainer></div></Card>
      </div>
      {/* FECHAMENTO MENSAL */}
      <Card style={{marginBottom:14}}><CardHead title={`Resultado Mensal — ${dreAno}`}/>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",minWidth:700}}>
            <thead><tr style={{background:"var(--bg)"}}>
              {["Mês","Receita","Despesas","Resultado"].map(h=><th key={h} style={{padding:"8px 12px",fontSize:9,fontWeight:800,textTransform:"uppercase",color:"var(--tx3)",borderBottom:"1.5px solid var(--bd)",textAlign:"right",firstChild:{textAlign:"left"}}}>{h}</th>)}
            </tr></thead>
            <tbody>
              {mensalData.map((m,i)=><tr key={i} style={{background:i%2===0?"transparent":"var(--bg)"}}>
                <td style={{padding:"8px 12px",fontWeight:700,color:"var(--tx)",fontSize:12}}>{m.name}/{dreAno}</td>
                <td style={{padding:"8px 12px",textAlign:"right",fontWeight:700,color:"var(--gn)",fontSize:12}}>{m.receita>0?R$(m.receita):"—"}</td>
                <td style={{padding:"8px 12px",textAlign:"right",fontWeight:700,color:"var(--rd)",fontSize:12}}>{m.despesas>0?R$(m.despesas):"—"}</td>
                <td style={{padding:"8px 12px",textAlign:"right",fontWeight:800,color:m.resultado>=0?"var(--gn)":"var(--rd)",fontSize:13}}>{m.receita+m.despesas>0?R$(m.resultado):"—"}</td>
              </tr>)}
              <tr style={{background:"var(--prib)",borderTop:"2px solid var(--bd)"}}>
                <td style={{padding:"10px 12px",fontWeight:800,color:"var(--pri)",fontSize:12}}>TOTAL {dreAno}</td>
                <td style={{padding:"10px 12px",textAlign:"right",fontWeight:800,color:"var(--gn)",fontSize:13}}>{R$(rec)}</td>
                <td style={{padding:"10px 12px",textAlign:"right",fontWeight:800,color:"var(--rd)",fontSize:13}}>{R$(despesasFin)}</td>
                <td style={{padding:"10px 12px",textAlign:"right",fontWeight:800,color:ll>=0?"var(--gn)":"var(--rd)",fontSize:14}}>{R$(ll)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
        {byPed.length>0&&<Card><CardHead title="Resultado por Pedido"/><div style={{padding:16,height:220}}><ResponsiveContainer><BarChart data={byPed}><CartesianGrid strokeDasharray="3 3" stroke="var(--bd)"/><XAxis dataKey="name" tick={{fontSize:10,fontWeight:700,fill:"var(--tx2)"}}/><YAxis tick={{fontSize:10,fill:"var(--tx3)"}}/><Tooltip formatter={v=>R$(v)}/><Legend iconType="circle" wrapperStyle={{fontSize:10,fontWeight:700}}/><Bar dataKey="receita" fill="#10b981" radius={[4,4,0,0]} name="Receita"/><Bar dataKey="custo" fill="#ef4444" radius={[4,4,0,0]} name="Custo"/><Bar dataKey="lucro" fill="#6366f1" radius={[4,4,0,0]} name="Lucro"/></BarChart></ResponsiveContainer></div></Card>}
        {catData.length>0&&<Card><CardHead title="Despesas por Categoria"/><div style={{padding:14}}>{catData.map((c,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:"1px solid var(--bd)",fontSize:12}}><span style={{fontWeight:600,color:"var(--tx)"}}>{c.name}</span><span style={{fontWeight:800,color:"var(--rd)"}}>{R$(c.value)}</span></div>)}</div></Card>}
      </div>
    </div>);};

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
  const PgMinhaArea=()=>(<div style={{animation:"fadeIn .3s"}}><SH title="Meus Projetos" sub={`${meusP.length} designados`}/>{meusP.map(p=>{const c=getCli(p.clienteId);const comFin=financeiro.find(f=>f.pedidoId===p.id&&f.marcId===user.id);const comPaga=comFin?.valorPago||0;const comTotal=comFin?.valor||p.comVal;return(
    <Card key={p.id} style={{marginBottom:12,padding:18}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}><div><h3 style={{fontSize:16,fontWeight:800,color:"var(--pri)"}}>{p.num}</h3><p style={{fontSize:12,color:"var(--tx2)",fontWeight:600}}>{c?.nome}</p></div><div style={{textAlign:"right"}}><Badge color={p.stage==="concluido"?"green":"amber"}>{KCOLS.find(k=>k.id===p.stage)?.label}</Badge>{p.dataEntrega&&<div style={{fontSize:10,color:"var(--rd)",fontWeight:700,marginTop:4}}><I.Clock/> {p.dataEntrega}</div>}</div></div>
      {p.ambs?.map((a,i)=><div key={i} style={{padding:"8px 0",borderBottom:"1px solid var(--bd)"}}><div style={{fontSize:13,fontWeight:700,color:"var(--tx)"}}>{a.nome||`Ambiente ${i+1}`}</div>{a.desc&&<div style={{fontSize:11,color:"var(--tx3)",whiteSpace:"pre-line",marginTop:3,lineHeight:1.6}}>{a.desc}</div>}</div>)}
      <div style={{background:"var(--bg)",borderRadius:"var(--r)",padding:12,border:"1.5px solid var(--bd)",marginTop:10,marginBottom:10}}>
        <div style={{fontSize:10,fontWeight:800,textTransform:"uppercase",color:"var(--tx3)",marginBottom:6}}>Materiais</div>
        {p.mats.map(m=><div key={m.id} style={{display:"flex",justifyContent:"space-between",fontSize:11,padding:"2px 0",color:"var(--tx2)"}}><span>{m.nome}</span><span>×{m.qtd}</span></div>)}
      </div>
      {p.arquivos?.length>0&&<div style={{marginBottom:10,padding:10,background:"var(--bg)",borderRadius:"var(--r)",border:"1.5px solid var(--bd)"}}>
        <div style={{fontSize:10,fontWeight:800,textTransform:"uppercase",color:"var(--tx3)",marginBottom:6}}>Arquivos</div>
        {p.arquivos.map(a=><a key={a.id} href={a.url} download={a.nome} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"var(--pri)",fontWeight:600,textDecoration:"none",padding:"2px 0"}}><I.Clip/>{a.nome}</a>)}
      </div>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:10}}>
        <div style={{background:"var(--prib)",borderRadius:"var(--r)",padding:10,textAlign:"center"}}><div style={{fontSize:9,fontWeight:800,color:"var(--tx3)",textTransform:"uppercase"}}>Comissão</div><div style={{fontSize:16,fontWeight:800,color:"var(--pri)"}}>{R$(comTotal)}</div></div>
        <div style={{background:"var(--gnb)",borderRadius:"var(--r)",padding:10,textAlign:"center"}}><div style={{fontSize:9,fontWeight:800,color:"var(--tx3)",textTransform:"uppercase"}}>Recebido</div><div style={{fontSize:16,fontWeight:800,color:"var(--gn)"}}>{R$(comPaga)}</div></div>
        <div style={{background:"var(--rdb)",borderRadius:"var(--r)",padding:10,textAlign:"center"}}><div style={{fontSize:9,fontWeight:800,color:"var(--tx3)",textTransform:"uppercase"}}>A Receber</div><div style={{fontSize:16,fontWeight:800,color:"var(--rd)"}}>{R$(comTotal-comPaga)}</div></div>
      </div>
      {comFin&&comFin.valor>0&&<div style={{background:"var(--bg)",borderRadius:4,height:6,marginBottom:10,overflow:"hidden"}}><div style={{background:"var(--gn)",height:"100%",width:`${Math.min(100,comFin.valor>0?(comPaga/comFin.valor)*100:0)}%`,borderRadius:4,transition:"width .4s"}}/></div>}
      {comFin?.parcelas?.length>0&&<div style={{border:"1.5px solid var(--bd)",borderRadius:"var(--r)",overflow:"hidden",marginBottom:2}}>
        <div style={{padding:"5px 10px",background:"var(--prib)",fontSize:9,fontWeight:800,textTransform:"uppercase",color:"var(--pri)"}}>Agenda de Pagamento</div>
        {comFin.parcelas.map((pa,i)=><div key={pa.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 10px",borderBottom:"1px solid var(--bd)",fontSize:11}}>
          <div><span style={{fontWeight:700}}>Parcela {i+1}</span>{pa.venc&&<span style={{color:"var(--tx3)",marginLeft:6,fontSize:10}}>Venc: {pa.venc}</span>}</div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontWeight:800,color:pa.pago?"var(--gn)":"var(--tx)"}}>{R$(pa.valor)}</span>
            {pa.pago?<Badge color="green">✓ {pa.dataPago}</Badge>:<Badge color="amber">Pendente</Badge>}
          </div>
        </div>)}
      </div>}
    </Card>)})}{meusP.length===0&&<Card style={{padding:30,textAlign:"center"}}><p style={{color:"var(--tx3)",fontWeight:600}}>Nenhum projeto</p></Card>}</div>);

  const PgMeuKanban=()=>(<div style={{animation:"fadeIn .3s"}}><SH title="Meu Kanban"/><div style={{display:"flex",gap:10,overflowX:"auto",paddingBottom:10}}>{KCOLS.map(col=>{const cards=meusP.filter(p=>p.stage===col.id);return(<div key={col.id} style={{minWidth:170,flex:1,background:"var(--bg)",borderRadius:"var(--rl)",border:"1.5px solid var(--bd)"}}><div style={{padding:"10px 12px",borderBottom:"1.5px solid var(--bd)",display:"flex",alignItems:"center",gap:5}}><div style={{width:7,height:7,borderRadius:4,background:col.color}}/><span style={{fontSize:11,fontWeight:800,color:"var(--tx)"}}>{col.label}</span></div><div style={{padding:6,minHeight:60}}>{cards.map(p=>{const c=getCli(p.clienteId);return(<div key={p.id} className="kcard" style={{background:"var(--cd)",border:"1.5px solid var(--bd)",borderRadius:"var(--r)",padding:"8px 10px",marginBottom:5,borderLeft:`3px solid ${col.color}`,boxShadow:"var(--sh)"}}><div style={{fontWeight:800,fontSize:10,color:"var(--pri)"}}>{p.num}</div><div style={{fontSize:10,color:"var(--tx)",fontWeight:600}}>{c?.nome}</div><select value={p.stage} onChange={e=>{updPed(p.id,{stage:e.target.value,status:e.target.value==="concluido"?"concluido":"em_producao"});showToast("Atualizado!")}} onClick={e=>e.stopPropagation()} style={{width:"100%",padding:"3px 5px",borderRadius:6,border:"1.5px solid var(--bd)",background:"var(--sf)",color:"var(--tx)",fontSize:9,fontWeight:700,outline:"none",marginTop:4}}>{KCOLS.map(k=><option key={k.id} value={k.id}>{k.label}</option>)}</select></div>)})}</div></div>)})}</div></div>);

  const PgCom=()=>{
    const [exp,setExp]=useState(null);
    const gcf=p=>financeiro.find(f=>f.pedidoId===p.id&&f.marcId===user.id);
    const tc=meusP.reduce((s,p)=>s+(gcf(p)?.valor||p.comVal),0);
    const tr=meusP.reduce((s,p)=>s+(gcf(p)?.valorPago||0),0);
    return(<div style={{animation:"fadeIn .3s"}}><SH title="Minhas Comissões"/>
    <div style={{display:"flex",gap:12,marginBottom:18}}><KPI label="Total" value={R$(tc)} icon={<I.Dollar/>} color="pri"/><KPI label="Recebido" value={R$(tr)} icon={<I.Check/>} color="gn"/><KPI label="A Receber" value={R$(tc-tr)} icon={<I.Clock/>} color="rd"/></div>
    <Card>
      <TH cols={[{l:"Pedido",w:"80px"},{l:"Projeto",w:"1.5fr"},{l:"%",w:"60px"},{l:"Valor",w:"100px"},{l:"Recebido",w:"100px"},{l:"Restante",w:"100px"},{l:"",w:"30px"}]}/>
      {meusP.map(p=>{const c=getCli(p.clienteId);const cf=gcf(p);const r=cf?.valorPago||0;const v=cf?.valor||p.comVal;const op=exp===p.id;return(<div key={p.id}>
        <div onClick={()=>setExp(op?null:p.id)} className="hr" style={{display:"grid",gridTemplateColumns:"80px 1.5fr 60px 100px 100px 100px 30px",gap:6,padding:"10px 18px",borderBottom:"1.5px solid var(--bd)",alignItems:"center",fontSize:12,cursor:"pointer"}}>
          <span style={{fontWeight:800,color:"var(--pri)"}}>{p.num}</span>
          <span style={{color:"var(--tx)",fontWeight:600}}>{c?.nome}</span>
          <Badge>{p.comPerc}%</Badge>
          <span style={{fontWeight:700}}>{R$(v)}</span>
          <span style={{color:"var(--gn)",fontWeight:700}}>{R$(r)}</span>
          <span style={{color:"var(--rd)",fontWeight:800}}>{R$(v-r)}</span>
          <I.Chev d={op?"up":"down"}/>
        </div>
        {op&&cf&&<div style={{padding:"10px 18px",background:"var(--bg)",borderBottom:"1.5px solid var(--bd)"}}>
          <div style={{background:"var(--bd)",borderRadius:4,height:5,marginBottom:8,overflow:"hidden"}}><div style={{background:"var(--gn)",height:"100%",width:`${v>0?Math.min(100,(r/v)*100):0}%`,borderRadius:4}}/></div>
          {cf.parcelas.map((pa,i)=><div key={pa.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",borderBottom:"1px solid var(--bd)",fontSize:11}}>
            <div><span style={{fontWeight:700}}>Parcela {i+1}</span>{pa.venc&&<span style={{color:"var(--tx3)",marginLeft:6,fontSize:10}}>Venc: {pa.venc}</span>}</div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontWeight:800,color:pa.pago?"var(--gn)":"var(--tx)"}}>{R$(pa.valor)}</span>
              {pa.pago?<Badge color="green">✓ {pa.dataPago}</Badge>:<Badge color="amber">Pendente</Badge>}
            </div>
          </div>)}
          {cf.parcelas.length===0&&<span style={{fontSize:11,color:"var(--tx3)"}}>Nenhuma parcela cadastrada</span>}
        </div>}
      </div>)})}</Card></div>)};

  // VENDEDORES
  const PgVendedores=()=>{
    const [eV,setEV]=useState(null);
    const [expandVend,setExpandVend]=useState(null);
    // Entradas financeiras de comissão por vendedor
    const vendFinEntries=v=>financeiro.filter(f=>f.vendedorId===v.id&&f.tipo==="pagar");
    const vendPedsSemLanc=v=>pedidos.filter(p=>p.vendedorId===v.id&&!financeiro.find(f=>f.pedidoId===p.id&&f.vendedorId===v.id&&f.tipo==="pagar"));
    const gerarLancVendPg=(ped)=>{
      const v=vendedores.find(x=>x.id===ped.vendedorId);if(!v)return;
      const comVend=+(ped.vt*(v.comissao/100)).toFixed(2);
      setFinanceiro(prev=>[...prev,{id:uid(),tipo:"pagar",desc:`Comissão Vendedor ${ped.num||''} - ${v.nome}`,valor:comVend,valorPago:0,parcelas:[{id:uid(),valor:comVend,venc:"",pago:false,dataPago:"",formaPag:"pix"}],pedidoId:ped.id,vendedorId:v.id,fornecedor:v.nome,categoria:"Folha/Comissão",status:"aberto"}]);
      showToast("Lançamento criado!");
    };
    return(<div style={{animation:"fadeIn .3s"}}>
      <SH title="Vendedores" sub={`${vendedores.length} cadastrados`} right={<Btn onClick={()=>setEV({nome:"",tel:"",comissao:5,ativo:true})}><I.Plus/> Novo</Btn>}/>
      {eV&&<Modal onClose={()=>setEV(null)}>
        <h2 style={{fontSize:16,fontWeight:800,color:"var(--tx)",marginBottom:16}}>{eV.id?"Editar":"Novo"} Vendedor</h2>
        <Field label="Nome" value={eV.nome} onChange={v=>setEV(p=>({...p,nome:v}))}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Field label="Telefone" value={eV.tel||""} onChange={v=>setEV(p=>({...p,tel:v}))}/>
          <Field label="Comissão %" type="number" value={eV.comissao} onChange={v=>setEV(p=>({...p,comissao:+v}))}/>
        </div>
        <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:8}}>
          <Btn v="ghost" onClick={()=>setEV(null)}>Cancelar</Btn>
          <Btn onClick={()=>{
            if(!eV.nome)return showToast("Nome!","red");
            if(eV.id)setVendedores(p=>p.map(v=>v.id===eV.id?{...v,...eV}:v));
            else setVendedores(p=>[...p,{...eV,id:uid()}]);
            setEV(null);showToast("Vendedor salvo!");
          }}><I.Check/> Salvar</Btn>
        </div>
      </Modal>}
      <Card>
        <TH cols={[{l:"Nome",w:"2fr"},{l:"Telefone",w:"1fr"},{l:"Comissão",w:"80px"},{l:"Total",w:"100px"},{l:"A Pagar",w:"100px"},{l:"Ativo",w:"60px"},{l:"",w:"80px"}]}/>
        {vendedores.map(v=>{
          const fins=vendFinEntries(v);
          const semLanc=vendPedsSemLanc(v);
          const totalCom=fins.reduce((s,f)=>s+f.valor,0);
          const totalPago=fins.reduce((s,f)=>s+f.valorPago,0);
          const aPagar=totalCom-totalPago;
          const isExp=expandVend===v.id;
          return(<React.Fragment key={v.id}>
            <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 80px 100px 100px 60px 80px",gap:6,padding:"10px 18px",borderBottom:"1.5px solid var(--bd)",alignItems:"center",fontSize:12,cursor:"pointer",background:isExp?"var(--prib)":"transparent"}} onClick={()=>setExpandVend(isExp?null:v.id)}>
              <span style={{fontWeight:700,color:"var(--tx)"}}>{v.nome}</span>
              <span style={{color:"var(--tx2)"}}>{v.tel}</span>
              <Badge color="pri">{v.comissao}%</Badge>
              <span style={{fontWeight:700,color:"var(--tx)"}}>{totalCom>0?R$(totalCom):"—"}</span>
              <span style={{fontWeight:700,color:aPagar>0?"var(--rd)":"var(--gn)"}}>{aPagar>0?R$(aPagar):"✓"}</span>
              <button onClick={e=>{e.stopPropagation();setVendedores(p=>p.map(x=>x.id===v.id?{...x,ativo:!x.ativo}:x));}} style={{width:28,height:28,borderRadius:8,border:"2px solid "+(v.ativo?"var(--gn)":"var(--bd)"),background:v.ativo?"var(--gn)":"transparent",cursor:"pointer"}}/>
              <div style={{display:"flex",gap:3}} onClick={e=>e.stopPropagation()}>
                <button onClick={()=>setEV(v)} style={{background:"none",border:"none",color:"var(--tx3)",padding:3}}><I.Edit/></button>
                <button onClick={()=>{setVendedores(p=>p.filter(x=>x.id!==v.id));showToast("Removido","red");}} style={{background:"none",border:"none",color:"var(--rd)",padding:3}}><I.Trash/></button>
              </div>
            </div>
            {isExp&&<div style={{padding:"14px 20px",background:"var(--bg)",borderBottom:"2px solid var(--pri)"}}>
              {/* Pedidos sem lançamento */}
              {semLanc.length>0&&<div style={{marginBottom:12}}>
                <div style={{fontSize:10,fontWeight:800,color:"var(--am)",textTransform:"uppercase",marginBottom:6}}>Pedidos sem lançamento de comissão</div>
                {semLanc.map(ped=>{
                  const comVend=+(ped.vt*(v.comissao/100)).toFixed(2);
                  return(<div key={ped.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 10px",borderRadius:8,background:"rgba(245,158,11,.08)",border:"1px solid rgba(245,158,11,.3)",marginBottom:6}}>
                    <span style={{fontSize:12,fontWeight:600,color:"var(--tx)"}}>Pedido {ped.num} — {getCli(ped.clienteId)?.nome} · <b style={{color:"var(--rd)"}}>{R$(comVend)}</b></span>
                    <Btn small onClick={()=>gerarLancVendPg(ped)}><I.Plus/> Gerar</Btn>
                  </div>);
                })}
              </div>}
              {/* Entradas de comissão existentes */}
              {fins.length===0&&semLanc.length===0&&<div style={{fontSize:12,color:"var(--tx3)",padding:"8px 0"}}>Nenhum lançamento de comissão ainda.</div>}
              {fins.map(f=>{
                const pedCom=pedidos.find(p=>p.id===f.pedidoId);
                const pago=(f.parcelas||[]).filter(p=>p.pago).reduce((s,p)=>s+p.valor,0);
                const pendente=(f.parcelas||[]).filter(p=>!p.pago).reduce((s,p)=>s+p.valor,0);
                return(<div key={f.id} style={{background:"var(--sf)",borderRadius:10,border:"1.5px solid var(--bd)",padding:"12px 14px",marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                    <div>
                      <div style={{fontSize:12,fontWeight:800,color:"var(--tx)"}}>{f.desc}</div>
                      <div style={{fontSize:10,color:"var(--tx3)",display:"flex",gap:10,marginTop:2,flexWrap:"wrap"}}>
                        {pedCom&&<span>Pedido {pedCom.num} · {getCli(pedCom.clienteId)?.nome}</span>}
                        <span>Total: <b>{R$(f.valor)}</b></span>
                        <span style={{color:"var(--gn)"}}>Pago: <b>{R$(pago)}</b></span>
                        <span style={{color:pendente>0?"var(--rd)":"var(--tx3)"}}>Pendente: <b>{R$(pendente)}</b></span>
                      </div>
                    </div>
                    <Badge color={pendente===0?"green":"red"}>{pendente===0?"✓ Quitado":"Pendente"}</Badge>
                  </div>
                  {(f.parcelas||[]).map((p,pi)=>(
                    <div key={p.id||pi} style={{display:"grid",gridTemplateColumns:"140px 100px 110px 1fr 28px",gap:6,alignItems:"flex-end",padding:"6px 0",borderBottom:"1px solid var(--bd)33"}}>
                      <div><div style={{fontSize:8,color:"var(--tx3)",fontWeight:700,marginBottom:2}}>VENC.</div>
                        <input type="date" value={p.venc||""} onChange={e=>{const nv=e.target.value;setFinanceiro(ff=>ff.map(x=>x.id===f.id?{...x,parcelas:x.parcelas.map((q,qi)=>qi===pi?{...q,venc:nv}:q)}:x));}} style={{padding:"5px 6px",borderRadius:6,border:"1.5px solid var(--bd)",background:"var(--sf)",color:"var(--tx)",fontSize:11,width:"100%"}}/>
                      </div>
                      <div><div style={{fontSize:8,color:"var(--tx3)",fontWeight:700,marginBottom:2}}>VALOR</div>
                        <input type="number" defaultValue={p.valor||0} key={f.id+"_"+pi+"_v"} step="0.01" onBlur={e=>{const nv=+e.target.value;setFinanceiro(ff=>ff.map(x=>x.id===f.id?{...x,parcelas:x.parcelas.map((q,qi)=>qi===pi?{...q,valor:nv}:q)}:x));}} style={{padding:"5px 6px",borderRadius:6,border:"1.5px solid var(--bd)",background:"var(--sf)",color:"var(--tx)",fontSize:11,width:"100%"}}/>
                      </div>
                      <div><div style={{fontSize:8,color:"var(--tx3)",fontWeight:700,marginBottom:2}}>FORMA</div>
                        <select value={p.formaPag||"pix"} onChange={e=>{const nv=e.target.value;setFinanceiro(ff=>ff.map(x=>x.id===f.id?{...x,parcelas:x.parcelas.map((q,qi)=>qi===pi?{...q,formaPag:nv}:q)}:x));}} style={{padding:"5px 6px",borderRadius:6,border:"1.5px solid var(--bd)",background:"var(--sf)",color:"var(--tx)",fontSize:11,width:"100%"}}>
                          <option value="pix">PIX</option><option value="ted">TED</option><option value="dinheiro">Dinheiro</option><option value="cheque">Cheque</option>
                        </select>
                      </div>
                      <div style={{display:"flex",justifyContent:"center"}}>
                        {p.pago
                          ?<div style={{textAlign:"center"}}>
                              <div style={{fontSize:9,color:"var(--gn)",fontWeight:800}}>✓{isoToBR(p.dataPago)}</div>
                              <button onClick={()=>{setFinanceiro(ff=>ff.map(x=>x.id===f.id?{...x,valorPago:Math.max(0,(x.valorPago||0)-p.valor),parcelas:x.parcelas.map((q,qi)=>qi===pi?{...q,pago:false,dataPago:""}:q)}:x));showToast("Reaberto");}} style={{padding:"2px 6px",borderRadius:4,background:"none",border:"1px solid var(--rd)",color:"var(--rd)",fontSize:9,cursor:"pointer"}}>↩</button>
                            </div>
                          :<button onClick={()=>{setFinanceiro(ff=>ff.map(x=>x.id===f.id?{...x,valorPago:(x.valorPago||0)+p.valor,parcelas:x.parcelas.map((q,qi)=>qi===pi?{...q,pago:true,dataPago:hojeISO()}:q)}:x));showToast("Pago!");}} style={{padding:"6px 10px",borderRadius:6,background:"var(--gnb)",border:"1.5px solid var(--gn)",color:"var(--gn)",fontSize:11,fontWeight:800,cursor:"pointer"}}>✓ Baixar</button>
                        }
                      </div>
                      <button onClick={()=>setFinanceiro(ff=>ff.map(x=>x.id===f.id?{...x,parcelas:x.parcelas.filter((_,qi)=>qi!==pi)}:x))} style={{background:"none",border:"none",color:"var(--rd)",cursor:"pointer",fontSize:16,paddingBottom:4}}>×</button>
                    </div>
                  ))}
                  <div style={{marginTop:8}}>
                    <Btn v="ghost" small onClick={()=>setFinanceiro(ff=>ff.map(x=>{if(x.id!==f.id)return x;const somaAtual=(x.parcelas||[]).reduce((s,p)=>s+p.valor,0);const restante=+Math.max(0,x.valor-somaAtual).toFixed(2);return{...x,parcelas:[...(x.parcelas||[]),{id:uid(),valor:restante,venc:"",pago:false,dataPago:"",formaPag:"pix"}]};}))}><I.Plus/> Parcela</Btn>
                  </div>
                </div>);
              })}
            </div>}
          </React.Fragment>);
        })}
        {vendedores.length===0&&<div style={{padding:30,textAlign:"center",color:"var(--tx3)",fontSize:12,fontWeight:600}}>Nenhum vendedor cadastrado</div>}
      </Card>
    </div>);
  };

  // RECEBIMENTOS PARCELADOS
  const PgRecebimentos=()=>{
    const updRec=(id,fn)=>setRecebimentos(prev=>prev.map(r=>r.id===id?fn(r):r));
    const updParc=(rid,pid,d)=>updRec(rid,r=>({...r,parcelas:r.parcelas.map(p=>p.id===pid?{...p,...d}:p)}));
    const addParc=(rid)=>updRec(rid,r=>({...r,parcelas:[...r.parcelas,{id:uid(),num:r.parcelas.length+1,valor:0,venc:"",pago:false,dataPago:"",formaPag:""}]}));
    const delParc=(rid,pid)=>updRec(rid,r=>{const ps=r.parcelas.filter(p=>p.id!==pid).map((p,i)=>({...p,num:i+1}));return{...r,parcelas:ps};});
    const redistribuir=(rid)=>updRec(rid,r=>{if(!r.parcelas.length)return r;const vp=+(r.valorTotal/r.parcelas.length).toFixed(2);return{...r,parcelas:r.parcelas.map(p=>({...p,valor:vp}))};});
    const totalGeral=recebimentos.reduce((s,r)=>s+r.valorTotal,0);
    const totalPago=recebimentos.reduce((s,r)=>s+r.parcelas.filter(p=>p.pago).reduce((ss,p)=>ss+p.valor,0),0);
    const vencAtrasado=p=>p.venc&&p.venc<hojeISO()&&!p.pago;
    // Pedidos aprovados com financeiro vinculado
    const pedFinanceiro=financeiro.filter(f=>f.pedidoId&&f.tipo==="receber");
    const totalPedGeral=pedFinanceiro.reduce((s,f)=>s+f.valor,0);
    const totalPedPago=pedFinanceiro.reduce((s,f)=>s+f.valorPago,0);
    const totalPedVencido=pedFinanceiro.reduce((s,f)=>s+f.parcelas.filter(p=>!p.pago&&p.venc&&p.venc<hojeISO()).reduce((ss,p)=>ss+p.valor,0),0);
    return(<div style={{animation:"fadeIn .3s"}}>
      <SH title="Recebimentos" sub={`Controle de recebimento por pedido e planos de pagamento`} right={<Btn onClick={()=>setModal({t:"novoRec"})}><I.Plus/> Novo Recebimento</Btn>}/>
      {/* TABS */}
      <div style={{display:"flex",gap:6,marginBottom:16}}>
        {[{k:"pedidos",l:"📦 Pedidos Aprovados"},{k:"manuais",l:"📋 Planos Manuais"}].map(t=><button key={t.k} onClick={()=>setRecTab(t.k)} style={{padding:"8px 18px",borderRadius:20,border:"1.5px solid "+(recTab===t.k?"var(--pri)":"var(--bd)"),background:recTab===t.k?"var(--prib)":"transparent",color:recTab===t.k?"var(--pri)":"var(--tx3)",fontSize:12,fontWeight:700,cursor:"pointer"}}>{t.l}</button>)}
      </div>
      {/* KPIs dinâmicos por tab */}
      {recTab==="pedidos"&&<div style={{display:"flex",gap:12,marginBottom:18,flexWrap:"wrap"}}>
        <KPI label="Total Pedidos" value={R$(totalPedGeral)} icon={<I.Dollar/>} color="pri"/>
        <KPI label="Recebido" value={R$(totalPedPago)} icon={<I.Check/>} color="gn"/>
        <KPI label="Pendente" value={R$(totalPedGeral-totalPedPago)} icon={<I.Clock/>} color="rd"/>
        {totalPedVencido>0&&<KPI label="Vencido" value={R$(totalPedVencido)} icon={<I.Zap/>} color="am"/>}
      </div>}
      {recTab==="manuais"&&<div style={{display:"flex",gap:12,marginBottom:18,flexWrap:"wrap"}}>
        <KPI label="Total Contratado" value={R$(totalGeral)} icon={<I.Dollar/>} color="pri"/>
        <KPI label="Total Recebido" value={R$(totalPago)} icon={<I.Check/>} color="gn"/>
        <KPI label="Pendente" value={R$(totalGeral-totalPago)} icon={<I.Clock/>} color="rd"/>
        <KPI label="Em Atraso" value={R$(recebimentos.reduce((s,r)=>s+r.parcelas.filter(vencAtrasado).reduce((ss,p)=>ss+p.valor,0),0))} icon={<I.Zap/>} color="am"/>
      </div>}
      {/* ── PEDIDOS APROVADOS ── */}
      {recTab==="pedidos"&&<>{pedFinanceiro.length===0?<Card style={{padding:48,textAlign:"center"}}><p style={{color:"var(--tx3)",fontWeight:700}}>Nenhum pedido aprovado com financeiro vinculado</p></Card>
      :pedFinanceiro.map(f=>{
        const ped=pedidos.find(p=>p.id===f.pedidoId);
        const cli=getCli(ped?.clienteId||"");
        const pago=f.valorPago;const pendente=f.valor-pago;
        const pct=f.valor>0?Math.min(100,(pago/f.valor)*100):0;
        const exp=recExpId===f.id;
        const atrasadas=f.parcelas.filter(p=>!p.pago&&p.venc&&p.venc<hojeISO()).length;
        return(<Card key={f.id} style={{marginBottom:10}}>
          <div onClick={()=>setRecExpId(exp?null:f.id)} style={{padding:"14px 20px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:40,height:40,borderRadius:12,background:"linear-gradient(135deg,var(--pri),var(--pp))",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:15,flexShrink:0}}>
                {cli?.nome?.[0]?.toUpperCase()||"?"}
              </div>
              <div>
                <div style={{fontWeight:800,fontSize:14,color:"var(--tx)"}}>{cli?.nome||"Cliente"}</div>
                <div style={{fontSize:11,color:"var(--tx3)",fontWeight:600,marginTop:1}}>
                  {ped?.num||f.desc} • {f.parcelas.length} parcela{f.parcelas.length!==1?"s":""}
                  {atrasadas>0&&<span style={{color:"var(--rd)",fontWeight:800}}> • {atrasadas} atrasada{atrasadas>1?"s":""} ⚠</span>}
                  <span style={{marginLeft:6}}><Badge color={ped?.status==="concluido"?"green":ped?.status==="cancelado"?"red":"amber"}>{ped?.status||"—"}</Badge></span>
                </div>
              </div>
            </div>
            <div style={{display:"flex",gap:20,alignItems:"center"}}>
              <div style={{textAlign:"right"}}><div style={{fontSize:9,color:"var(--tx3)",fontWeight:700,textTransform:"uppercase"}}>Total</div><div style={{fontWeight:800,fontSize:15,color:"var(--tx)"}}>{R$(f.valor)}</div></div>
              <div style={{textAlign:"right"}}><div style={{fontSize:9,color:"var(--tx3)",fontWeight:700,textTransform:"uppercase"}}>Recebido</div><div style={{fontWeight:800,fontSize:15,color:"var(--gn)"}}>{R$(pago)}</div></div>
              <div style={{textAlign:"right"}}><div style={{fontSize:9,color:"var(--tx3)",fontWeight:700,textTransform:"uppercase"}}>Pendente</div><div style={{fontWeight:800,fontSize:15,color:pendente>0?"var(--rd)":"var(--gn)"}}>{R$(pendente)}</div></div>
              <div style={{display:"flex",gap:4,alignItems:"center"}}>
                <div style={{width:36,height:36,borderRadius:10,background:"var(--prib)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:"var(--pri)"}}>{pct.toFixed(0)}%</div>
                <I.Chev d={exp?"up":"down"}/>
              </div>
            </div>
          </div>
          <div style={{height:3,background:"var(--bg)"}}>
            <div style={{height:"100%",width:`${pct}%`,background:"linear-gradient(90deg,#10b981,#3b82f6)",borderRadius:3,transition:"width .5s"}}/>
          </div>
          {exp&&<div style={{padding:"14px 20px"}}>
            <div style={{display:"grid",gridTemplateColumns:"28px 1fr 1fr 80px 1fr 110px",gap:6,padding:"5px 8px",borderBottom:"1.5px solid var(--bd)",marginBottom:4}}>
              {["#","Vencimento","Valor R$","Status","Forma Pag.","Ação"].map(h=><span key={h} style={{fontSize:9,fontWeight:800,textTransform:"uppercase",color:"var(--tx3)",letterSpacing:".5px"}}>{h}</span>)}
            </div>
            {f.parcelas.map((p,i)=>{
              const atrasada=p.venc&&p.venc<hojeISO()&&!p.pago;
              const inp={padding:"5px 7px",borderRadius:6,fontSize:11,outline:"none",fontFamily:"var(--ft)",width:"100%",
                border:p.pago?"1.5px solid var(--gn)":"1.5px solid var(--bd)",
                background:p.pago?"rgba(16,185,129,.06)":"var(--sf)",
                color:"var(--tx)"};
              return(<div key={p.id} style={{display:"grid",gridTemplateColumns:"28px 1fr 1fr 80px 1fr 110px",gap:6,padding:"6px 8px",borderBottom:"1px solid var(--bd)",alignItems:"center",background:p.pago?"rgba(16,185,129,.03)":atrasada?"rgba(239,68,68,.03)":"transparent"}}>
                <span style={{fontWeight:800,fontSize:11,color:"var(--tx3)",textAlign:"center"}}>#{i+1}</span>
                {/* Vencimento / Data Pago */}
                <input type="date" value={(p.pago?p.dataPago:p.venc)||""} onChange={e=>editParcela(f.id,p.id,p.pago?{dataPago:e.target.value}:{venc:e.target.value})} style={inp}/>
                {/* Valor */}
                <input type="number" defaultValue={p.valor||0} key={p.id+"v"} onBlur={e=>editParcela(f.id,p.id,{valor:Math.max(0,+e.target.value)})} step="0.01" style={{...inp,fontWeight:700}}/>
                {/* Status */}
                {p.pago?<Badge color="green">✓ Pago</Badge>:atrasada?<Badge color="red">Atrasado</Badge>:<Badge color="blue">Pendente</Badge>}
                {/* Forma */}
                <select value={p.formaPag||""} onChange={e=>editParcela(f.id,p.id,{formaPag:e.target.value})} style={inp}>
                  <option value="">—</option>
                  {FORMAS.map(fm=><option key={fm.v} value={fm.v}>{fm.l}</option>)}
                </select>
                {/* Ação */}
                <div style={{display:"flex",gap:3,alignItems:"center"}}>
                  {!p.pago&&<Btn v="success" small onClick={()=>{pagarParcela(f.id,p.id,p.valor,p.formaPag||"");showToast("Baixado!");}}>✓ Baixar</Btn>}
                  {p.pago&&<button onClick={()=>editParcela(f.id,p.id,{pago:false,dataPago:""})} title="Reabrir parcela" style={{background:"none",border:"1px solid var(--bd)",borderRadius:6,color:"var(--tx3)",cursor:"pointer",fontSize:10,padding:"3px 6px",fontWeight:700}}>↩</button>}
                  <button onClick={()=>delParcela(f.id,p.id)} style={{background:"none",border:"none",color:"var(--rd)",cursor:"pointer",padding:2}}><I.Trash/></button>
                </div>
              </div>);
            })}
            <div style={{display:"flex",gap:12,marginTop:10,padding:"8px 8px",background:"var(--bg)",borderRadius:"var(--r)",fontSize:11,fontWeight:700,flexWrap:"wrap",alignItems:"center"}}>
              <span style={{color:"var(--tx3)"}}>PAGAS: <span style={{color:"var(--gn)",fontWeight:800}}>{f.parcelas.filter(p=>p.pago).length}/{f.parcelas.length}</span></span>
              <span style={{color:"var(--tx3)"}}>RECEBIDO: <span style={{color:"var(--gn)",fontWeight:800}}>{R$(pago)}</span></span>
              <span style={{color:"var(--tx3)"}}>PENDENTE: <span style={{color:"var(--rd)",fontWeight:800}}>{R$(pendente)}</span></span>
              <Btn v="ghost" small onClick={()=>addParcela(f.id)}><I.Plus/> Parcela</Btn>
              <Btn v="ghost" small onClick={()=>{setTab("pedidos");setPedAtivo(ped?.id);}}>Ver Pedido →</Btn>
            </div>
          </div>}
        </Card>);
      })}</>}
      {recTab==="manuais"&&<>{recebimentos.map(r=>{
        const pago=r.parcelas.filter(p=>p.pago).reduce((s,p)=>s+p.valor,0);
        const pendente=r.valorTotal-pago;
        const pct=r.valorTotal>0?Math.min(100,(pago/r.valorTotal)*100):0;
        const exp=recExpId===r.id;
        const atrasadas=r.parcelas.filter(vencAtrasado).length;
        const cli=getCli(r.clienteId);
        return(<Card key={r.id} style={{marginBottom:10}}>
          {/* HEADER CARD */}
          <div onClick={()=>setRecExpId(exp?null:r.id)} style={{padding:"14px 20px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",userSelect:"none"}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:40,height:40,borderRadius:12,background:"linear-gradient(135deg,var(--pri),var(--pp))",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:16,flexShrink:0}}>
                {r.cliente?.[0]?.toUpperCase()||"?"}
              </div>
              <div>
                {editRecId===r.id
                  ?<div onClick={e=>e.stopPropagation()} style={{display:"flex",flexDirection:"column",gap:4}}>
                    <input autoFocus value={editRecDraft.cliente} onChange={e=>setEditRecDraft(p=>({...p,cliente:e.target.value}))}
                      placeholder="Nome do cliente"
                      style={{fontWeight:800,fontSize:14,padding:"3px 7px",borderRadius:6,border:"1.5px solid var(--pri)",background:"var(--sf)",color:"var(--tx)",outline:"none",width:220}}/>
                    <input value={editRecDraft.obs} onChange={e=>setEditRecDraft(p=>({...p,obs:e.target.value}))}
                      placeholder="Descrição / observação"
                      style={{fontSize:11,padding:"3px 7px",borderRadius:6,border:"1.5px solid var(--bd)",background:"var(--sf)",color:"var(--tx)",outline:"none",width:280}}/>
                    <div style={{display:"flex",gap:4,marginTop:2}}>
                      <button onClick={()=>{updRec(r.id,x=>({...x,cliente:editRecDraft.cliente.trim()||x.cliente,obs:editRecDraft.obs}));setEditRecId(null);}}
                        style={{background:"var(--gn)",border:"none",color:"#fff",borderRadius:5,fontSize:10,fontWeight:800,padding:"3px 8px",cursor:"pointer"}}>✓ Salvar</button>
                      <button onClick={()=>setEditRecId(null)}
                        style={{background:"none",border:"1px solid var(--bd)",color:"var(--tx3)",borderRadius:5,fontSize:10,fontWeight:700,padding:"3px 7px",cursor:"pointer"}}>Cancelar</button>
                    </div>
                  </div>
                  :<div>
                    <div style={{display:"flex",alignItems:"center",gap:5}}>
                      <span style={{fontWeight:800,fontSize:14,color:"var(--tx)"}}>{r.cliente}</span>
                      <button onClick={e=>{e.stopPropagation();setEditRecDraft({cliente:r.cliente,obs:r.obs||""});setEditRecId(r.id);}}
                        title="Editar nome e descrição"
                        style={{background:"none",border:"none",color:"var(--tx3)",cursor:"pointer",padding:"1px 3px",display:"flex",alignItems:"center",opacity:.6,fontSize:11}}>✏</button>
                    </div>
                    <div style={{fontSize:11,color:"var(--tx3)",fontWeight:600,marginTop:1}}>
                      {r.obs&&<span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:320,display:"inline-block",verticalAlign:"bottom"}}>{r.obs} • </span>}
                      {r.parcelas.length} parcela{r.parcelas.length!==1?"s":""}
                      {atrasadas>0&&<span style={{color:"var(--rd)",fontWeight:800}}> • {atrasadas} atrasada{atrasadas>1?"s":""}</span>}
                      {cli&&<span> • <button onClick={e=>{e.stopPropagation();setTab("clientes")}} style={{background:"none",border:"none",color:"var(--pri)",fontSize:11,fontWeight:700,cursor:"pointer",padding:0}}>ver cadastro</button></span>}
                    </div>
                  </div>
                }
              </div>
            </div>
            <div style={{display:"flex",gap:20,alignItems:"center"}}>
              <div style={{textAlign:"right"}}><div style={{fontSize:9,color:"var(--tx3)",fontWeight:700,textTransform:"uppercase"}}>Total</div><div style={{fontWeight:800,fontSize:15,color:"var(--tx)"}}>{R$(r.valorTotal)}</div></div>
              <div style={{textAlign:"right"}}><div style={{fontSize:9,color:"var(--tx3)",fontWeight:700,textTransform:"uppercase"}}>Recebido</div><div style={{fontWeight:800,fontSize:15,color:"var(--gn)"}}>{R$(pago)}</div></div>
              <div style={{textAlign:"right"}}><div style={{fontSize:9,color:"var(--tx3)",fontWeight:700,textTransform:"uppercase"}}>Pendente</div><div style={{fontWeight:800,fontSize:15,color:pendente>0?"var(--rd)":"var(--gn)"}}>{R$(pendente)}</div></div>
              <div style={{display:"flex",gap:4,alignItems:"center"}}>
                <div style={{width:36,height:36,borderRadius:10,background:"var(--prib)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:"var(--pri)"}}>{pct.toFixed(0)}%</div>
                <I.Chev d={exp?"up":"down"}/>
              </div>
            </div>
          </div>
          {/* BARRA PROGRESSO */}
          <div style={{height:3,background:"var(--bg)",marginBottom:exp?0:undefined}}>
            <div style={{height:"100%",width:`${pct}%`,background:"linear-gradient(90deg,#10b981,#3b82f6)",borderRadius:3,transition:"width .5s"}}/>
          </div>
          {/* PARCELAS EXPANDIDAS */}
          {exp&&<div style={{padding:"14px 20px"}}>
            <div style={{display:"flex",gap:8,marginBottom:12,justifyContent:"space-between",alignItems:"center",flexWrap:"wrap"}}>
              <div style={{display:"flex",gap:6}}>
                <Btn v="ghost" small onClick={()=>addParc(r.id)}><I.Plus/> Parcela</Btn>
                <Btn v="ghost" small onClick={()=>redistribuir(r.id)}>⚖ Redistribuir</Btn>
              </div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <span style={{fontSize:11,color:"var(--tx3)",fontWeight:700}}>Total R$:</span>
                <BlurInput type="number" value={r.valorTotal} onCommit={v=>updRec(r.id,x=>({...x,valorTotal:+v}))} step="0.01" style={{width:110,padding:"5px 8px",borderRadius:8,border:"1.5px solid var(--bd)",background:"var(--sf)",color:"var(--tx)",fontSize:12,fontWeight:700,outline:"none"}}/>
                <button onClick={()=>{setRecebimentos(p=>p.filter(x=>x.id!==r.id));showToast("Removido","red")}} style={{background:"none",border:"none",color:"var(--rd)",padding:4,cursor:"pointer"}}><I.Trash/></button>
              </div>
            </div>
            {/* GRID PARCELAS */}
            <div style={{display:"grid",gridTemplateColumns:"38px 110px 110px 90px 155px 80px",gap:6,padding:"5px 8px",borderBottom:"1.5px solid var(--bd)",marginBottom:4}}>
              {["#","Vencimento","Valor R$","Status","Forma Pag.","Ação"].map(h=><span key={h} style={{fontSize:9,fontWeight:800,textTransform:"uppercase",color:"var(--tx3)",letterSpacing:".5px"}}>{h}</span>)}
            </div>
            {r.parcelas.map(p=>{
              const atrasada=vencAtrasado(p);
              const rowBg=p.pago?"rgba(16,185,129,.05)":atrasada?"rgba(239,68,68,.04)":"transparent";
              return(<div key={p.id} style={{display:"grid",gridTemplateColumns:"38px 110px 110px 90px 155px 80px",gap:6,padding:"6px 8px",borderBottom:"1px solid var(--bd)",alignItems:"center",background:rowBg}}>
                <span style={{fontWeight:800,fontSize:12,color:"var(--tx3)",textAlign:"center"}}>#{p.num}</span>
                <BlurInput type="date" value={p.venc||""} onCommit={v=>updParc(r.id,p.id,{venc:v})} style={{width:"100%",padding:"4px 6px",borderRadius:6,border:`1.5px solid ${p.pago?"var(--gn)":atrasada?"var(--rd)":"var(--bd)"}`,background:"var(--sf)",color:"var(--tx)",fontSize:11,outline:"none"}}/>
                <BlurInput type="number" value={p.valor} onCommit={v=>updParc(r.id,p.id,{valor:+v})} step="0.01" style={{width:"100%",padding:"4px 6px",borderRadius:6,border:"1.5px solid var(--bd)",background:p.pago?"var(--gnb)":"var(--sf)",color:p.pago?"var(--gn)":"var(--tx)",fontSize:12,fontWeight:700,outline:"none",textAlign:"right"}}/>
                {p.pago?<Badge color="green">✓ Pago</Badge>:atrasada?<Badge color="red">Atrasado</Badge>:<Badge color="blue">Pendente</Badge>}
                <div style={{display:"flex",alignItems:"center",gap:4}}>
                  {p.pago
                    ?<>{p.formaPag&&<Badge color={FORMA_CLR[p.formaPag]||"pri"}>{FORMAS_LAB[p.formaPag]||p.formaPag}</Badge>}<span style={{fontSize:10,color:"var(--tx3)",fontWeight:600,marginLeft:2}}>{p.dataPago}</span></>
                    :<select value={p.formaPag||""} onChange={e=>updParc(r.id,p.id,{formaPag:e.target.value})} style={{width:"100%",padding:"4px 5px",borderRadius:6,border:"1.5px solid var(--bd)",background:"var(--sf)",color:p.formaPag?"var(--tx)":"var(--tx3)",fontSize:11,outline:"none",cursor:"pointer"}}>
                      <option value="">— Selecionar —</option>
                      {FORMAS.map(fm=><option key={fm.v} value={fm.v}>{fm.l}</option>)}
                    </select>}
                </div>
                <div style={{display:"flex",gap:3,alignItems:"center"}}>
                  {!p.pago&&<Btn v="success" small onClick={()=>setModal({t:"baixaRec",d:{rec:r,parcela:p}})}>$ Baixar</Btn>}
                  {p.pago&&<button onClick={()=>updParc(r.id,p.id,{pago:false,dataPago:"",formaPag:""})} title="Estornar" style={{background:"none",border:"none",color:"var(--tx3)",cursor:"pointer",fontSize:10,padding:2}}>↩</button>}
                  <button onClick={()=>delParc(r.id,p.id)} style={{background:"none",border:"none",color:"var(--rd)",padding:2,cursor:"pointer"}}><I.Trash/></button>
                </div>
              </div>);
            })}
            {r.parcelas.length===0&&<div style={{padding:16,textAlign:"center",color:"var(--tx3)",fontSize:12}}>Sem parcelas. Clique em "+ Parcela" para adicionar.</div>}
            {/* RESUMO */}
            <div style={{display:"flex",gap:20,marginTop:12,padding:"10px 12px",background:"var(--bg)",borderRadius:"var(--r)",flexWrap:"wrap"}}>
              <span style={{fontSize:11,fontWeight:700,color:"var(--tx3)"}}>PAGAS: <span style={{color:"var(--gn)",fontWeight:800}}>{r.parcelas.filter(p=>p.pago).length}/{r.parcelas.length}</span></span>
              <span style={{fontSize:11,fontWeight:700,color:"var(--tx3)"}}>RECEBIDO: <span style={{color:"var(--gn)",fontWeight:800}}>{R$(pago)}</span></span>
              <span style={{fontSize:11,fontWeight:700,color:"var(--tx3)"}}>PENDENTE: <span style={{color:"var(--rd)",fontWeight:800}}>{R$(pendente)}</span></span>
              {atrasadas>0&&<span style={{fontSize:11,fontWeight:800,color:"var(--rd)"}}>⚠ {atrasadas} parcela{atrasadas>1?"s":""} em atraso</span>}
            </div>
          </div>}
        </Card>);
      })}
      {recebimentos.length===0&&<Card style={{padding:48,textAlign:"center"}}><div style={{fontSize:40,marginBottom:12}}>💰</div><p style={{color:"var(--tx3)",fontWeight:700,fontSize:14}}>Nenhum recebimento cadastrado</p><Btn onClick={()=>setModal({t:"novoRec"})}><I.Plus/> Novo Recebimento</Btn></Card>}
      </>}
    </div>);
  };

  // PAGE ROUTER
  const pages={dashboard:PgDash,crm:PgCRM,clientes:PgCli,orcamentos:PgOrc,pedidos:PgPed,kanban:PgKanban,marceneiros:PgMarc,vendedores:PgVendedores,financeiro:PgFin,estoque:PgEst,dre:PgDRE,banco:PgBanco,recebimentos:PgRecebimentos,minha_area:PgMinhaArea,meu_kanban:PgMeuKanban,comissoes:PgCom};
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
        {/* Logout visível só no mobile — sidebar-user fica oculta no mobile */}
        <div className="mobile-logout" style={{display:"none",alignItems:"center",padding:"0 8px",flexShrink:0,borderLeft:"1.5px solid var(--bd)"}}>
          <button onClick={()=>{localStorage.removeItem('erpUser');setUser(null);setLoginView(null);}} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"10px 10px",border:"none",background:"none",cursor:"pointer",color:"var(--rd)"}}>
            <I.X style={{width:18,height:18}}/>
            <span style={{fontSize:9,fontWeight:800}}>Sair</span>
          </button>
        </div>
        <div className="sidebar-user" style={{padding:"12px 16px",borderTop:"1.5px solid var(--bd)"}}>
          <div style={{fontSize:10,color:"var(--tx3)",fontWeight:700,marginBottom:4}}>{user.role==="admin"?"👤 Administrador":"🔧 "+user.nome}</div>
          <div style={{fontSize:9,fontWeight:700,marginBottom:6,display:"flex",alignItems:"center",gap:4,
            color:syncStatus==="ok"?"var(--gn)":syncStatus==="error"?"var(--rd)":syncStatus==="syncing"?"var(--am)":"var(--tx3)"}}>
            <span style={{width:6,height:6,borderRadius:"50%",display:"inline-block",
              background:syncStatus==="ok"?"var(--gn)":syncStatus==="error"?"var(--rd)":syncStatus==="syncing"?"var(--am)":"var(--bd2)"}}/>
            {syncStatus==="ok"?"☁ Salvo na nuvem":syncStatus==="error"?"⚠ Erro ao salvar":syncStatus==="syncing"?"⏳ Salvando...":"⏳ Carregando..."}
          </div>
          {user.role==="admin"
            ?<div style={{display:"flex",flexDirection:"column",gap:4}}>
              <Btn v="ghost" small onClick={async()=>{
                const r=await forceSyncAll();
                if(r.fail.length===0)showToast(`✓ ${r.ok} itens salvos na nuvem!`);
                else showToast(`⚠ ${r.ok} salvos, ${r.fail.length} com erro`,"red");
              }} style={{width:"100%",justifyContent:"center",fontSize:10,
                background:syncStatus==="error"?"var(--rdb)":"transparent",
                color:syncStatus==="error"?"var(--rd)":"var(--tx2)"}}>☁ Salvar Tudo Agora</Btn>
              <Btn v="ghost" small onClick={async()=>{
                const today=new Date().toISOString().slice(0,10);
                const yesterday=new Date(Date.now()-86400000).toISOString().slice(0,10);
                const bk=await dbGet(`backup_${today}`)||await dbGet(`backup_${yesterday}`);
                if(!bk){showToast("Nenhum backup encontrado","red");return;}
                const keys=['clientes','orcamentos','pedidos','marceneiros','estoque','financeiro','leads','biblioteca','recebimentos','recorrentes','vendedores'];
                const setters2={clientes:setClientes,orcamentos:setOrcamentos,pedidos:setPedidos,marceneiros:setMarceneiros,estoque:setEstoque,financeiro:setFinanceiro,leads:setLeads,biblioteca:setBiblioteca,recebimentos:setRecebimentos,recorrentes:setRecorrentes,vendedores:setVendedores};
                keys.forEach(k=>{if(bk[k])setters2[k](bk[k]);});
                if(bk.empresa)setEmpresa(bk.empresa);
                showToast(`✓ Backup de ${bk.ts?.slice(0,10)||today} restaurado!`);
              }} style={{width:"100%",justifyContent:"center",fontSize:10,color:"var(--am)"}}>🕐 Restaurar Backup</Btn>
              <Btn v="ghost" small onClick={()=>setLoginView({l:"",s:""})} style={{width:"100%",justifyContent:"center",fontSize:10}}><I.Lock/> Área Marceneiro</Btn>
              <Btn v="ghost" small onClick={()=>{localStorage.removeItem('erpUser');setUser(null);setLoginView(null);}} style={{width:"100%",justifyContent:"center",fontSize:10,color:"var(--rd)",border:"1px solid rgba(239,68,68,.2)",background:"var(--rdb)"}}><I.X/> Sair da Conta</Btn>
             </div>
            :null}
        </div>
      </aside>

      {/* MAIN */}
      <main className="erp-main" style={{flex:1,padding:"20px 24px",minHeight:"100vh",overflowY:"auto"}}>{tab==="configuracao"?<PgConfig empresa={empresa} saveEmpresa={saveEmpresa} getBackup={getBackup} importBackup={importBackup} limparDuplicatas={limparDuplicatas}/>:tab==="financeiro"?<StablePageWrapper renderFn={PgFin}/>:<Pg/>}</main>

      {/* MODALS */}
      {modal?.t==="editCli"&&<Modal onClose={()=>setModal(null)}><ModalEditCli d={modal.d} setModal={setModal} saveCli={saveCli}/></Modal>}

      {modal?.t==="selCli"&&<Modal onClose={()=>setModal(null)}><ModalSelCli clientes={clientes} setModal={setModal} criarOrc={criarOrc}/></Modal>}

      {modal?.t==="editLead"&&<Modal onClose={()=>setModal(null)}><ModalEditLead d={modal.d} setModal={setModal} setLeads={setLeads} showToast={showToast}/></Modal>}

      {modal?.t==="pdf"&&<Modal onClose={()=>setModal(null)} wide><ModalPDF o={modal.d} empresa={empresa} getCli={getCli} setModal={setModal} totalOrcFinal={totalOrcFinal} totalOrc={totalOrc} totalOrcComNF={totalOrcComNF} defaultTab={modal.tab}/></Modal>}

      {modal?.t==="detFin"&&<Modal onClose={()=>setModal(null)} wide><ModalDetFin f={modal.d} financeiro={financeiro} setModal={setModal} pagarParcela={pagarParcela} editParcela={editParcela} addParcela={addParcela} delParcela={delParcela} updFin={updFin} showToast={showToast} cats={empresa.cats||CATS}/></Modal>}

      {modal?.t==="newFin"&&<Modal onClose={()=>setModal(null)}><ModalNewFin setModal={setModal} setFinanceiro={setFinanceiro} setRecorrentes={setRecorrentes} showToast={showToast} cats={empresa.cats||CATS} fonteCartao={modal.d?.fonteCartao} fontePool={modal.d?.fontePool} fornecedorSugerido={modal.d?.fornecedorSugerido}/></Modal>}

      {modal?.t==="recibo"&&<Modal onClose={()=>setModal(null)}><ModalRecibo empresa={empresa} getCli={getCli} setModal={setModal} pedido={modal.pedido} parcela={modal.parcela} numProx={modal.numProx}/></Modal>}

      {modal?.t==="novoRec"&&<Modal onClose={()=>setModal(null)}><ModalNovoRec clientes={clientes} setModal={setModal} setRecebimentos={setRecebimentos} showToast={showToast}/></Modal>}
      {modal?.t==="baixaRec"&&<Modal onClose={()=>setModal(null)}><ModalBaixaRec modal={modal} setModal={setModal} setRecebimentos={setRecebimentos} showToast={showToast}/></Modal>}

      {/* TOAST */}
      {toast&&<div style={{position:"fixed",bottom:20,right:20,padding:"10px 18px",borderRadius:12,background:toast.type==="red"?"var(--rdb)":"var(--gnb)",color:toast.type==="red"?"var(--rd)":"var(--gn)",border:`1.5px solid ${toast.type==="red"?"rgba(239,68,68,.15)":"rgba(16,185,129,.15)"}`,fontSize:12,fontWeight:800,boxShadow:"var(--sh2)",animation:"scaleIn .2s",zIndex:9999,display:"flex",alignItems:"center",gap:6}}>{toast.type==="red"?<I.X/>:<I.Check/>}{toast.msg}</div>}

      <InstallPrompt/>
    </div>
  );
}
