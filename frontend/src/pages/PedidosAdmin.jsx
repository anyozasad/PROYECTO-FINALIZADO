import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { apiFetch } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { obtenerPedidos as obtenerPedidosLocales, guardarPedidos as guardarPedidosLocales } from '../utils/shopCore';

const DEMO = [
  { id:1, numero_comprobante:'PG001562', cliente:'Carlos Ramírez',   documento:'71234567', metodo_pago:'Yape',    total:150.90, estado:'EN_PREPARACION', fecha:'2026-06-15T10:30:00' },
  { id:2, numero_comprobante:'PG001561', cliente:'María Fernanda',   documento:'74581236', metodo_pago:'Tarjeta', total:89.50,  estado:'ENTREGADO',       fecha:'2026-06-15T09:15:00' },
  { id:3, numero_comprobante:'PG001560', cliente:'Juan Diego',       documento:'70123456', metodo_pago:'Efectivo',total:120.00, estado:'PENDIENTE',        fecha:'2026-06-14T16:22:00' },
  { id:4, numero_comprobante:'PG001559', cliente:'Lucía Martínez',   documento:'73456789', metodo_pago:'Yape',    total:65.00,  estado:'ENTREGADO',        fecha:'2026-06-14T14:10:00' },
  { id:5, numero_comprobante:'PG001558', cliente:'Pedro Castillo',   documento:'72345678', metodo_pago:'Tarjeta', total:75.00,  estado:'CANCELADO',        fecha:'2026-06-14T11:45:00' },
];

const DEMO_USUARIO = [
  { id:1, numero_comprobante:'PG001245', metodo_pago:'Yape',    total:150.90, estado:'ENTREGADO', fecha:'2024-06-10T10:00:00', detalle:[{producto_nombre:'Disco de freno',cantidad:1,precio_unitario:120,subtotal:120},{producto_nombre:'Cadena DID',cantidad:1,precio_unitario:30.90,subtotal:30.90}] },
  { id:2, numero_comprobante:'PG001243', metodo_pago:'Tarjeta', total:89.50,  estado:'EN_CAMINO', fecha:'2024-06-05T09:00:00', detalle:[{producto_nombre:'Aceite Motul 10W-40',cantidad:2,precio_unitario:32,subtotal:64},{producto_nombre:'Filtro de aceite',cantidad:1,precio_unitario:25.50,subtotal:25.50}] },
  { id:3, numero_comprobante:'PG001241', metodo_pago:'Efectivo',total:120.00, estado:'ENTREGADO', fecha:'2024-06-02T14:00:00', detalle:[{producto_nombre:'Suspensión YSS',cantidad:1,precio_unitario:120,subtotal:120}] },
];

const ESTADOS = ['PENDIENTE','PAGADO','EN_PREPARACION','EN_CAMINO','ENTREGADO','CANCELADO'];
const ESTADO_COLOR = { PENDIENTE:'#f59e0b', PAGADO:'#3b82f6', EN_PREPARACION:'#8b5cf6', EN_CAMINO:'#06b6d4', ENTREGADO:'#10b981', CANCELADO:'#ef4444' };
const ESTADO_LABEL = { PENDIENTE:'Pendiente', PAGADO:'Pagado', EN_PREPARACION:'Preparando', EN_CAMINO:'En camino', ENTREGADO:'Entregado', CANCELADO:'Cancelado' };

const ESTADO_LOCAL_A_CODIGO = { Pendiente:'PENDIENTE', Pagado:'PAGADO', Preparando:'EN_PREPARACION', 'En camino':'EN_CAMINO', Entregado:'ENTREGADO', Cancelado:'CANCELADO' };

/* Convierte un pedido guardado por shopCore.crearPedido() (compra real del cliente)
   al formato de fila que usa esta tabla del admin. */
function normalizarPedidoLocal(p) {
  return {
    id: p.id,
    numero_comprobante: `${p.serie}-${p.numero}`,
    cliente: p.cliente?.nombre || 'Cliente Dorada Motor’s',
    documento: p.cliente?.documento || '-',
    telefono: p.cliente?.telefono || '-',
    direccion: p.entrega?.direccion || (p.entrega?.tipo === 'RECOJO' ? 'Recojo en tienda' : '-'),
    metodo_pago: p.pago?.metodo || '-',
    total: Number(p.resumen?.total || 0),
    estado: ESTADO_LOCAL_A_CODIGO[p.estado] || 'PENDIENTE',
    fecha: p.fecha,
    esLocal: true,
    detalle: (p.items || []).map((it) => ({
      producto_nombre: it.nombre,
      cantidad: it.cantidad,
      precio_unitario: Number(it.precio || 0),
      subtotal: Number(it.precio || 0) * Number(it.cantidad || 1),
    })),
  };
}

const TH = { color:'var(--muted)', fontSize:'11px', fontWeight:'700', padding:'10px 14px', textAlign:'left', textTransform:'uppercase', letterSpacing:'.05em', borderBottom:'1px solid var(--border)', whiteSpace:'nowrap' };
const TD = { padding:'12px 14px', fontSize:'13px', color:'var(--text)', borderBottom:'1px solid var(--border)' };

export default function PedidosAdmin() {
  const { usuario } = useAuth();
  const esAdmin = [1, 2].includes(Number(usuario?.rol_id));
  const [pedidos, setPedidos]   = useState([]);
  const [detalle, setDetalle]   = useState(null);
  const [filtro,  setFiltro]    = useState('TODOS');
  const [busq,    setBusq]      = useState('');
  const [loadDet, setLoadDet]   = useState(false);

  const cargar = () => {
    const ep = esAdmin ? '/admin/pedidos' : '/mis-pedidos';
    const localesNormalizados = obtenerPedidosLocales().map(normalizarPedidoLocal);
    apiFetch(ep)
      .then(d => {
        const remotos = Array.isArray(d) ? d : [];
        setPedidos(esAdmin ? [...localesNormalizados, ...remotos] : remotos);
      })
      .catch(() => setPedidos(esAdmin ? [...localesNormalizados, ...DEMO] : [...localesNormalizados, ...DEMO_USUARIO]));
  };
  useEffect(() => {
    cargar();
    const sync = () => cargar();
    window.addEventListener('partgo_orders_changed', sync);
    window.addEventListener('partgo_pedido_creado', sync);
    return () => {
      window.removeEventListener('partgo_orders_changed', sync);
      window.removeEventListener('partgo_pedido_creado', sync);
    };
  }, []);

  const verDetalle = async (p) => {
    if (p.esLocal) { setDetalle(p); return; }
    setLoadDet(true);
    try {
      setDetalle(await apiFetch(esAdmin ? `/admin/pedidos/${p.id}` : `/mis-pedidos/${p.id}`));
    } catch {
      const base = (esAdmin ? DEMO : DEMO_USUARIO).find(x => x.id === p.id);
      setDetalle(base ? { ...base, detalle: base.detalle || [] } : null);
    } finally { setLoadDet(false); }
  };

  const ESTADO_CODIGO_A_LOCAL = { PENDIENTE:'Pendiente', PAGADO:'Pagado', EN_PREPARACION:'Preparando', EN_CAMINO:'En camino', ENTREGADO:'Entregado', CANCELADO:'Cancelado' };

  const cambiarEstado = async (id, estado) => {
    const esLocal = pedidos.find(p => p.id === id)?.esLocal;
    if (esLocal) {
      const locales = obtenerPedidosLocales();
      guardarPedidosLocales(locales.map(p => p.id === id ? { ...p, estado: ESTADO_CODIGO_A_LOCAL[estado] || estado } : p));
    } else {
      try { await apiFetch(`/admin/pedidos/${id}/estado`, { method:'PATCH', body:JSON.stringify({ estado }) }); }
      catch { setPedidos(prev => prev.map(p => p.id===id ? {...p, estado} : p)); }
    }
    Swal.fire({ icon:'success', title:`Estado actualizado: ${ESTADO_LABEL[estado]||estado}`, timer:1500, showConfirmButton:false, background:'var(--card-bg)', color:'var(--text)' });
    cargar();
  };

  const filtrados = pedidos.filter(p => {
    const matchFiltro = filtro === 'TODOS' || p.estado === filtro;
    const matchBusq   = !busq || p.numero_comprobante?.toLowerCase().includes(busq.toLowerCase()) || p.cliente?.toLowerCase().includes(busq.toLowerCase());
    return matchFiltro && matchBusq;
  });

  const totales = ESTADOS.reduce((a, e) => ({ ...a, [e]: pedidos.filter(p => p.estado===e).length }), { TODOS: pedidos.length });

  return (
    <div style={{ fontFamily:"'Inter',sans-serif", color:'var(--text)' }}>
      {/* HEADER */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px' }}>
        <div>
          <h1 style={{ margin:'0 0 4px', fontSize:'22px', fontWeight:'800', letterSpacing:'-0.3px' }}>
            {esAdmin ? '📋 Pedidos de clientes' : '📋 Mis pedidos'}
          </h1>
          <p style={{ margin:0, color:'var(--muted)', fontSize:'13px' }}>
            {esAdmin ? 'Gestiona y actualiza el estado de los pedidos.' : 'Historial de tus compras en Dorada Motor’s.'}
          </p>
        </div>
        {esAdmin && (
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <div style={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'8px', padding:'8px 14px', display:'flex', alignItems:'center', gap:'8px' }}>
              <span style={{ color:'var(--muted)', fontSize:'14px' }}>🔍</span>
              <input value={busq} onChange={e=>setBusq(e.target.value)} placeholder="Buscar pedido o cliente..."
                style={{ background:'transparent', border:'none', color:'var(--text)', outline:'none', fontSize:'13px', width:'200px', fontFamily:"'Inter',sans-serif" }}/>
            </div>
          </div>
        )}
      </div>

      {/* FILTROS POR ESTADO */}
      <div style={{ display:'flex', gap:'8px', marginBottom:'20px', flexWrap:'wrap' }}>
        {(['TODOS', ...ESTADOS]).map(e => (
          <button key={e} onClick={() => setFiltro(e)} style={{
            padding:'6px 14px', borderRadius:'20px', border:`1px solid ${filtro===e ? (ESTADO_COLOR[e]||'#7c3aed') : 'var(--border)'}`,
            background: filtro===e ? ((ESTADO_COLOR[e]||'#7c3aed')+'22') : 'transparent',
            color: filtro===e ? (ESTADO_COLOR[e]||'#a78bfa') : 'var(--muted)',
            fontSize:'12px', fontWeight:'600', cursor:'pointer', fontFamily:"'Inter',sans-serif",
            transition:'all .15s',
          }}>
            {ESTADO_LABEL[e]||'Todos'} <span style={{ opacity:.6 }}>({totales[e]||0})</span>
          </button>
        ))}
      </div>

      {/* TABLA */}
      <div style={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'14px', overflow:'hidden', marginBottom:'20px' }}>
        {filtrados.length === 0 ? (
          <div style={{ textAlign:'center', padding:'48px', color:'var(--muted)' }}>
            <div style={{ fontSize:'40px', marginBottom:'12px', opacity:.3 }}>📭</div>
            <p style={{ margin:0, fontWeight:'600' }}>No hay pedidos {filtro !== 'TODOS' ? `con estado "${ESTADO_LABEL[filtro]}"` : 'aún'}</p>
          </div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'var(--bg4)' }}>
                <th style={TH}>N° Pedido</th>
                {esAdmin && <th style={TH}>Cliente</th>}
                {esAdmin && <th style={TH}>Documento</th>}
                <th style={TH}>Pago</th>
                <th style={TH}>Total</th>
                <th style={TH}>Fecha</th>
                <th style={TH}>Estado</th>
                <th style={{ ...TH, textAlign:'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map(p => (
                <tr key={p.id} style={{ transition:'background .15s', cursor:'pointer' }}
                  onMouseOver={e=>e.currentTarget.style.background='var(--bg4)'}
                  onMouseOut={e=>e.currentTarget.style.background='transparent'}>
                  <td style={{ ...TD, color:'#a78bfa', fontWeight:'700' }}>{p.numero_comprobante}</td>
                  {esAdmin && <td style={TD}>{p.cliente}</td>}
                  {esAdmin && <td style={{ ...TD, color:'var(--muted)' }}>{p.documento}</td>}
                  <td style={TD}>{p.metodo_pago}</td>
                  <td style={{ ...TD, fontWeight:'700' }}>S/ {Number(p.total).toFixed(2)}</td>
                  <td style={{ ...TD, color:'var(--muted)', fontSize:'12px' }}>{new Date(p.fecha).toLocaleDateString('es-PE')}</td>
                  <td style={TD}>
                    <span style={{ background:(ESTADO_COLOR[p.estado]||'#6b7280')+'22', color:ESTADO_COLOR[p.estado]||'#6b7280', padding:'4px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:'700', whiteSpace:'nowrap' }}>
                      {ESTADO_LABEL[p.estado]||p.estado}
                    </span>
                  </td>
                  <td style={{ ...TD, textAlign:'right' }}>
                    <div style={{ display:'flex', gap:'6px', justifyContent:'flex-end', alignItems:'center' }}>
                      <button onClick={() => verDetalle(p)} style={{ background:'rgba(124,58,237,.15)', color:'#a78bfa', border:'1px solid rgba(124,58,237,.3)', borderRadius:'7px', padding:'5px 12px', fontSize:'12px', fontWeight:'600', cursor:'pointer', fontFamily:"'Inter',sans-serif", transition:'all .15s' }}
                        onMouseOver={e=>{e.currentTarget.style.background='#7c3aed';e.currentTarget.style.color='white';}}
                        onMouseOut={e=>{e.currentTarget.style.background='rgba(124,58,237,.15)';e.currentTarget.style.color='#a78bfa';}}>
                        👁️ Ver
                      </button>
                      {esAdmin && (
                        <select value={p.estado} onChange={e => cambiarEstado(p.id, e.target.value)}
                          style={{ background:'var(--bg4)', border:'1px solid var(--border)', borderRadius:'7px', padding:'5px 8px', fontSize:'12px', color:'var(--text)', cursor:'pointer', fontFamily:"'Inter',sans-serif", outline:'none' }}>
                          {ESTADOS.map(e => <option key={e} value={e}>{ESTADO_LABEL[e]}</option>)}
                        </select>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* DETALLE MODAL */}
      {detalle && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.75)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px', backdropFilter:'blur(4px)' }}
          onClick={e => e.target === e.currentTarget && setDetalle(null)}>
          <div style={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'16px', padding:'28px', width:'100%', maxWidth:'620px', maxHeight:'88vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
              <div>
                <h3 style={{ margin:'0 0 4px', fontSize:'18px', fontWeight:'700' }}>Pedido {detalle.numero_comprobante}</h3>
                <span style={{ background:(ESTADO_COLOR[detalle.estado]||'#6b7280')+'22', color:ESTADO_COLOR[detalle.estado]||'#6b7280', padding:'3px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:'700' }}>
                  {ESTADO_LABEL[detalle.estado]||detalle.estado}
                </span>
              </div>
              <button onClick={() => setDetalle(null)} style={{ background:'var(--bg4)', border:'none', color:'var(--muted)', cursor:'pointer', borderRadius:'8px', padding:'6px 10px', fontSize:'16px' }}>✕</button>
            </div>

            {/* Info */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'20px' }}>
              {[
                { label:'Cliente',   val: detalle.cliente || usuario?.nombre },
                { label:'Documento', val: detalle.documento || '-' },
                { label:'Teléfono',  val: detalle.telefono || '-' },
                { label:'Dirección', val: detalle.direccion || '-' },
                { label:'Método de pago', val: detalle.metodo_pago },
                { label:'Fecha',     val: new Date(detalle.fecha||Date.now()).toLocaleString('es-PE') },
              ].map(item => (
                <div key={item.label} style={{ background:'var(--bg4)', borderRadius:'10px', padding:'12px 14px' }}>
                  <p style={{ margin:'0 0 2px', fontSize:'10px', fontWeight:'700', color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.05em' }}>{item.label}</p>
                  <p style={{ margin:0, fontSize:'13px', fontWeight:'600', color:'var(--text)' }}>{item.val||'-'}</p>
                </div>
              ))}
            </div>

            {/* Productos */}
            {detalle.detalle?.length > 0 && (
              <>
                <h4 style={{ margin:'0 0 14px', fontSize:'14px', fontWeight:'700' }}>Productos del pedido</h4>
                <table style={{ width:'100%', borderCollapse:'collapse', marginBottom:'16px' }}>
                  <thead>
                    <tr>
                      {['Producto','Cant.','Precio','Subtotal'].map(h => <th key={h} style={TH}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {detalle.detalle.map((d, i) => (
                      <tr key={i} style={{ borderBottom:'1px solid var(--border)' }}>
                        <td style={TD}>{d.producto_nombre}</td>
                        <td style={{ ...TD, textAlign:'center' }}>{d.cantidad}</td>
                        <td style={TD}>S/ {Number(d.precio_unitario).toFixed(2)}</td>
                        <td style={{ ...TD, fontWeight:'700', color:'#a78bfa' }}>S/ {Number(d.subtotal).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px', background:'var(--bg4)', borderRadius:'10px' }}>
              <span style={{ fontSize:'16px', fontWeight:'700' }}>Total del pedido</span>
              <span style={{ fontSize:'22px', fontWeight:'900', color:'#a78bfa' }}>S/ {Number(detalle.total).toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
