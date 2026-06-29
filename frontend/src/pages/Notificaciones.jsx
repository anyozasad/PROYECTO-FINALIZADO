import { useEffect, useState } from 'react';
import { apiFetch } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { obtenerNotificaciones, marcarNotificacionLeida, marcarTodasLeidas } from '../utils/notificacionesStore';

const DEMO_ADMIN = [
  { id:1, titulo:'Nuevo pedido recibido', mensaje:'Carlos Ramírez realizó el pedido #PG001562 por S/ 150.90', creado_en:new Date(Date.now()-5*60000).toISOString(), leido:false, tipo:'pedido' },
  { id:2, titulo:'Pago confirmado',        mensaje:'El pago del pedido #PG001561 fue confirmado vía Yape', creado_en:new Date(Date.now()-25*60000).toISOString(), leido:false, tipo:'pago' },
  { id:3, titulo:'Stock bajo - Filtro aceite', mensaje:'El producto "Filtro de aceite" tiene solo 5 unidades disponibles', creado_en:new Date(Date.now()-2*3600000).toISOString(), leido:true, tipo:'stock' },
  { id:4, titulo:'Nuevo cliente registrado', mensaje:'María Torres se registró como nuevo cliente', creado_en:new Date(Date.now()-4*3600000).toISOString(), leido:true, tipo:'cliente' },
  { id:5, titulo:'Reclamo recibido',         mensaje:'Pedro Castillo envió un reclamo sobre el pedido #PG001558', creado_en:new Date(Date.now()-6*3600000).toISOString(), leido:false, tipo:'reclamo' },
];
const DEMO_USER = [
  { id:1, titulo:'Tu pedido está en camino 🚚', mensaje:'El pedido #PG001243 ha sido enviado. Llegará en 24-48h.', creado_en:new Date(Date.now()-1*3600000).toISOString(), leido:false, tipo:'pedido' },
  { id:2, titulo:'Pago confirmado ✅',           mensaje:'Hemos recibido tu pago de S/ 89.50 para el pedido #PG001243.', creado_en:new Date(Date.now()-3*3600000).toISOString(), leido:true, tipo:'pago' },
  { id:3, titulo:'¡10% de descuento disponible!', mensaje:'Usa el código PARTGO10 en tu próxima compra antes del 30 de junio.', creado_en:new Date(Date.now()-24*3600000).toISOString(), leido:true, tipo:'oferta' },
];

const TIPO_ICON  = { pedido:'🛒', pago:'💳', stock:'⚠️', cliente:'👤', reclamo:'📢', oferta:'🎁', default:'🔔' };
const TIPO_COLOR = { pedido:'#7c3aed', pago:'#10b981', stock:'#f59e0b', cliente:'#3b82f6', reclamo:'#ef4444', oferta:'#f97316' };

const relTime = d => {
  const s = Math.floor((Date.now()-new Date(d))/1000);
  if(s<60)return 'Hace un momento';
  if(s<3600)return`Hace ${Math.floor(s/60)} min`;
  if(s<86400)return`Hace ${Math.floor(s/3600)} h`;
  return `Hace ${Math.floor(s/86400)} d`;
};

export default function Notificaciones() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const esAdmin = [1,2].includes(Number(usuario?.rol_id));
  const [items, setItems] = useState([]);
  const [filtro, setFiltro] = useState('todas');

  const cargar = () => {
    const locales = esAdmin ? obtenerNotificaciones() : [];
    apiFetch(esAdmin?'/admin/notificaciones':'/mis-notificaciones')
      .then(d => {
        const remotas = Array.isArray(d) ? d : [];
        setItems(esAdmin ? [...locales, ...remotas] : remotas);
      })
      .catch(() => setItems(esAdmin ? (locales.length ? locales : DEMO_ADMIN) : DEMO_USER));
  };
  useEffect(() => {
    cargar();
    const sync = () => cargar();
    window.addEventListener('partgo_notificaciones_changed', sync);
    return () => window.removeEventListener('partgo_notificaciones_changed', sync);
  }, []);

  const marcar = async id => {
    const idsLocales = obtenerNotificaciones().map(n => n.id);
    if (esAdmin && idsLocales.includes(id)) { marcarNotificacionLeida(id); return; }
    try { await apiFetch(esAdmin?`/admin/notificaciones/${id}`:`/mis-notificaciones/${id}`, { method:'PATCH' }); } catch {}
    setItems(prev => prev.map(n => n.id===id ? {...n, leido:true} : n));
  };

  const marcarTodas = async () => {
    if (esAdmin) marcarTodasLeidas();
    try { await apiFetch(esAdmin?'/admin/notificaciones/leer-todo':'/mis-notificaciones/leer-todo', { method:'PATCH' }); } catch {}
    setItems(prev => prev.map(n => ({...n, leido:true})));
  };

  const abrirNotificacion = (n) => {
    marcar(n.id);
    if (esAdmin) return;
    if (['pedido','pago'].includes(n.tipo)) navigate('/mis-pedidos');
    else if (n.tipo === 'oferta') navigate('/ofertas');
    else navigate('/mensajes');
  };

  const filtradas = items.filter(n => filtro==='todas'||(filtro==='nuevas'&&!n.leido)||(filtro==='leidas'&&n.leido));
  const nuevas = items.filter(n=>!n.leido).length;

  return (
    <div style={{padding:'26px 28px',minHeight:'100%',background:'var(--bg)',fontFamily:"'Inter',sans-serif", color:'var(--text)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px' }}>
        <div>
          <h1 style={{ margin:'0 0 4px', fontSize:'22px', fontWeight:'800' }}>🔔 Notificaciones</h1>
          <p style={{ margin:0, color:'var(--muted)', fontSize:'13px' }}>{nuevas>0?`${nuevas} sin leer`:'Todas leídas'}</p>
        </div>
        {nuevas>0 && <button onClick={marcarTodas} style={{ background:'rgba(124,58,237,.15)', color:'#a78bfa', border:'1px solid rgba(124,58,237,.3)', borderRadius:'9px', padding:'9px 18px', fontSize:'13px', fontWeight:'600', cursor:'pointer', fontFamily:"'Inter',sans-serif" }}>✓ Marcar todas como leídas</button>}
      </div>

      {/* Filtros */}
      <div style={{ display:'flex', gap:'8px', marginBottom:'20px' }}>
        {[{k:'todas',l:'Todas'},{k:'nuevas',l:`Sin leer (${nuevas})`},{k:'leidas',l:'Leídas'}].map(f=>(
          <button key={f.k} onClick={()=>setFiltro(f.k)} style={{ padding:'7px 16px', borderRadius:'20px', border:`1px solid ${filtro===f.k?'#7c3aed':'var(--border)'}`, background:filtro===f.k?'rgba(124,58,237,.2)':'transparent', color:filtro===f.k?'#a78bfa':'var(--muted)', fontSize:'12px', fontWeight:'600', cursor:'pointer', fontFamily:"'Inter',sans-serif", transition:'all .15s' }}>{f.l}</button>
        ))}
      </div>

      {filtradas.length===0 ? (
        <div style={{ textAlign:'center', padding:'60px', color:'var(--muted)' }}>
          <div style={{ fontSize:'48px', marginBottom:'12px', opacity:.3 }}>🔔</div>
          <p style={{ margin:0, fontWeight:'600', fontSize:'15px' }}>Sin notificaciones</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
          {filtradas.map(n => {
            const col = TIPO_COLOR[n.tipo]||'#6b7280';
            return (
              <div key={n.id} style={{ background:'var(--bg3)', border:`1px solid ${n.leido?'var(--border)':`${col}35`}`, borderRadius:'14px', padding:'16px 18px', display:'flex', alignItems:'flex-start', gap:'14px', transition:'all .2s', cursor:'pointer', opacity:n.leido?.75:1 }}
                onClick={() => abrirNotificacion(n)}
                onMouseOver={e=>e.currentTarget.style.borderColor=col+'55'} onMouseOut={e=>e.currentTarget.style.borderColor=n.leido?'var(--border)':`${col}35`}>
                <div style={{ width:'42px', height:'42px', borderRadius:'12px', background:`${col}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', flexShrink:0 }}>
                  {TIPO_ICON[n.tipo]||TIPO_ICON.default}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'4px' }}>
                    <h4 style={{ margin:0, fontSize:'14px', fontWeight:n.leido?'500':'700', color:'var(--text)' }}>{n.titulo}</h4>
                    {!n.leido && <span style={{ background:`${col}22`, color:col, fontSize:'10px', fontWeight:'700', padding:'2px 8px', borderRadius:'20px', flexShrink:0 }}>NUEVO</span>}
                  </div>
                  <p style={{ margin:'0 0 8px', fontSize:'13px', color:'var(--muted2)', lineHeight:1.5 }}>{n.mensaje}</p>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:'11px', color:'var(--muted)' }}>{relTime(n.creado_en)}</span>
                    {!n.leido && <button onClick={(e)=>{e.stopPropagation();marcar(n.id);}} style={{ background:'transparent', border:'none', color:'#a78bfa', fontSize:'12px', fontWeight:'600', cursor:'pointer', fontFamily:"'Inter',sans-serif" }}>Marcar como leída →</button>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
