import { useEffect, useRef, useState } from 'react';
import { obtenerPedidos } from '../utils/shopCore';

const baseMsgs = [
  {de:'bot',txt:'Hola 👋 Soy la IA de Dorada Motor’s. Puedo ayudarte con pedidos, envíos, boletas, pagos, devoluciones y repuestos.',h:'Ahora'},
];
const conversaciones = [
  { id:1, n:'IA Soporte Dorada Motor’s', icon:'🤖', badge:'IA', online:true },
  { id:2, n:'Ventas', icon:'🛒', badge:'', online:true },
  { id:3, n:'Envíos', icon:'🚚', badge:'', online:true },
  { id:4, n:'Boletas', icon:'📑', badge:'', online:true },
];

function hora(){ return new Date().toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit'}); }
function respuestaIA(texto){
  const t = texto.toLowerCase();
  const pedidos = obtenerPedidos();
  const ultimo = pedidos[0];
  if(t.includes('pedido') || t.includes('estado') || t.includes('rastrea')) return ultimo ? `Tu último pedido ${ultimo.id} está en estado: ${ultimo.estado}. Total: S/ ${Number(ultimo.resumen?.total||0).toFixed(2)}. También puedes verlo en Mis pedidos.` : 'Aún no tienes pedidos registrados. Cuando finalices una compra aparecerá en Mis pedidos.';
  if(t.includes('boleta') || t.includes('comprobante') || t.includes('factura')) return ultimo ? `Ya generamos tu Boleta de Venta Electrónica ${ultimo.serie}-${ultimo.numero}. Entra a Mis pedidos y pulsa “Ver boleta”.` : 'La boleta se genera automáticamente al finalizar una compra.';
  if(t.includes('envio') || t.includes('delivery') || t.includes('entrega')) return 'Realizamos delivery y recojo en tienda. En compras mayores a S/ 250 el envío sale gratis; de lo contrario se calcula desde S/ 10.';
  if(t.includes('pago') || t.includes('yape') || t.includes('plin') || t.includes('tarjeta')) return 'Aceptamos Yape, Plin, tarjeta y efectivo. En el checkout puedes elegir tu método de pago y registrar el número de operación.';
  if(t.includes('devolucion') || t.includes('cambio') || t.includes('garantia')) return 'Tienes soporte para cambios o devoluciones. Escríbenos el número de pedido y el motivo para ayudarte con el caso.';
  if(t.includes('hola') || t.includes('buenas')) return '¡Hola! 😊 Dime qué necesitas: comprar, consultar un pedido, generar boleta, ver envíos o hablar de un repuesto.';
  return 'Te entiendo. Para ayudarte mejor dime si tu consulta es sobre: pedido, envío, boleta, pago, devolución o producto.';
}

export default function PubMensajes(){
  const [conv,setConv]=useState(1);
  const [msg,setMsg]=useState('');
  const [hist,setHist]=useState(()=>JSON.parse(localStorage.getItem('partgo_chat_ia')||'null') || baseMsgs);
  const [typing,setTyping]=useState(false);
  const endRef=useRef(null);
  const current=conversaciones.find(c=>c.id===conv) || conversaciones[0];

  useEffect(()=>{endRef.current?.scrollIntoView({behavior:'smooth'}); localStorage.setItem('partgo_chat_ia',JSON.stringify(hist));},[hist,typing]);
  const send=(texto=msg)=>{ const clean=texto.trim(); if(!clean) return; setHist(h=>[...h,{de:'user',txt:clean,h:hora()}]); setMsg(''); setTyping(true); setTimeout(()=>{setHist(h=>[...h,{de:'bot',txt:respuestaIA(clean),h:hora()}]); setTyping(false);},650); };
  const quick=['¿Dónde está mi pedido?','Quiero mi boleta','Métodos de pago','Costo de envío'];

  return <div style={{display:'flex',height:'calc(100vh - 64px)',background:'var(--pg-bg)',color:'var(--pg-text)',fontFamily:"'Inter',sans-serif"}}>
    <div style={{width:'240px',background:'var(--pg-surface)',borderRight:'1px solid var(--pg-border)',padding:'16px 10px',display:'flex',flexDirection:'column'}}><h3 style={{margin:'0 0 4px',fontSize:'15px'}}>Centro de mensajes</h3><p style={{margin:'0 0 16px',fontSize:'11px',color:'var(--pg-muted)'}}>IA lista para atenderte 24/7</p>{conversaciones.map(c=><div key={c.id} onClick={()=>setConv(c.id)} style={{display:'flex',alignItems:'center',gap:'10px',padding:'10px 12px',borderRadius:'10px',cursor:'pointer',marginBottom:'3px',background:conv===c.id?'var(--pg-soft)':'transparent',border:`1px solid ${conv===c.id?'rgba(124,58,237,.35)':'transparent'}`}}><div style={{width:'34px',height:'34px',background:'rgba(124,58,237,.2)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px',flexShrink:0,position:'relative'}}>{c.icon}<span style={{position:'absolute',bottom:'1px',right:'1px',width:'9px',height:'9px',background:'#10b981',borderRadius:'50%',border:'2px solid var(--pg-surface)'}}/></div><div style={{flex:1,minWidth:0}}><p style={{margin:0,fontSize:'12px',fontWeight:'800',color:'var(--pg-text)'}}>{c.n}</p><p style={{margin:0,fontSize:'10px',color:'var(--pg-muted)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>Respuesta automática inteligente</p></div>{c.badge&&<span style={{background:'#7c3aed',color:'white',fontSize:'9px',fontWeight:'800',padding:'2px 6px',borderRadius:'20px'}}>{c.badge}</span>}</div>)}</div>
    <div style={{flex:1,display:'flex',flexDirection:'column',minWidth:0}}><div style={{padding:'14px 20px',borderBottom:'1px solid var(--pg-border)',display:'flex',alignItems:'center',gap:'12px',background:'var(--pg-surface)'}}><div style={{width:'36px',height:'36px',background:'rgba(124,58,237,.2)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px'}}>{current.icon}</div><div><p style={{margin:0,fontSize:'14px',fontWeight:'800'}}>{current.n}</p><p style={{margin:0,fontSize:'11px',color:'#10b981',fontWeight:'700'}}>● En línea</p></div></div>
      <div style={{flex:1,overflowY:'auto',padding:'20px',display:'flex',flexDirection:'column',gap:'12px'}}>{hist.map((m,i)=><div key={i} style={{display:'flex',justifyContent:m.de==='user'?'flex-end':'flex-start',gap:'8px',alignItems:'flex-end'}}>{m.de==='bot'&&<div style={{width:'28px',height:'28px',background:'rgba(124,58,237,.2)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px',flexShrink:0}}>🤖</div>}<div style={{maxWidth:'68%'}}><div style={{background:m.de==='user'?'linear-gradient(135deg,#7c3aed,#9333ea)':'var(--pg-input)',padding:'10px 14px',borderRadius:m.de==='user'?'14px 14px 4px 14px':'14px 14px 14px 4px',border:m.de==='user'?'none':'1px solid var(--pg-border2)'}}><p style={{margin:0,fontSize:'13px',color:m.de==='user'?'white':'var(--pg-text)',lineHeight:1.45}}>{m.txt}</p></div><p style={{margin:'3px 0 0',fontSize:'10px',color:'var(--pg-muted)',textAlign:m.de==='user'?'right':'left'}}>{m.h}</p></div></div>)}{typing&&<div style={{color:'var(--pg-muted)',fontSize:'12px'}}>🤖 La IA está escribiendo...</div>}<div ref={endRef}/></div>
      <div style={{padding:'0 20px 10px',display:'flex',gap:'8px',flexWrap:'wrap'}}>{quick.map(q=><button key={q} onClick={()=>send(q)} style={{background:'var(--pg-soft)',border:'1px solid rgba(124,58,237,.28)',color:'#a78bfa',borderRadius:'999px',padding:'7px 12px',fontSize:'11px',fontWeight:'800',cursor:'pointer'}}>{q}</button>)}</div>
      <div style={{padding:'14px 20px',borderTop:'1px solid var(--pg-border)',display:'flex',gap:'10px',background:'var(--pg-surface)'}}><input value={msg} onChange={e=>setMsg(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="Escribe tu mensaje a la IA..." style={{flex:1,background:'var(--pg-input)',border:'1px solid var(--pg-border2)',borderRadius:'10px',padding:'11px 16px',color:'var(--pg-text)',fontSize:'13px',outline:'none',fontFamily:"'Inter',sans-serif"}}/><button onClick={()=>send()} style={{background:'linear-gradient(135deg,#7c3aed,#9333ea)',border:'none',borderRadius:'10px',width:'44px',color:'white',fontSize:'18px',cursor:'pointer'}}>➤</button></div>
    </div>
  </div>;
}
