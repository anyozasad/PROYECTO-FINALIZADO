import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { apiFetch } from '../services/api';
import { obtenerReclamos, actualizarEstadoReclamo, eliminarReclamo } from '../utils/reclamosStore';

const S = {
  page:  { fontFamily:"'Inter',sans-serif", color:'var(--text)' },
  card:  { background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'14px', padding:'20px' },
  th: { color:'var(--muted)', fontSize:'11px', fontWeight:'700', padding:'10px 14px', textAlign:'left', textTransform:'uppercase', letterSpacing:'.05em', borderBottom:'1px solid var(--border)' },
  td: { padding:'13px 14px', fontSize:'13px', color:'var(--text)', borderBottom:'1px solid var(--border)' },
  btnDelete:  { background:'rgba(239,68,68,.15)',  color:'#ef4444', border:'1px solid rgba(239,68,68,.3)', borderRadius:'7px', padding:'5px 12px', fontSize:'12px', fontWeight:'600', cursor:'pointer', fontFamily:"'Inter',sans-serif", transition:'all .15s' },
};

const ESTADO_LABEL = { PENDIENTE:'Pendiente', EN_PROCESO:'En proceso', RESUELTO:'Resuelto', RECHAZADO:'Rechazado' };
const ESTADO_COLOR = { PENDIENTE:'#f59e0b', EN_PROCESO:'#3b82f6', RESUELTO:'#10b981', RECHAZADO:'#ef4444' };
const TIPO_LABEL = { producto:'Producto defectuoso', entrega:'Problema con la entrega', pago:'Error en el cobro', atencion:'Mala atención', otro:'Otro' };

export default function Reclamos() {
  const [items, setItems] = useState([]);
  const [detalle, setDetalle] = useState(null);

  useEffect(() => {
    const cargar = () => {
      const locales = obtenerReclamos();
      apiFetch('/reclamos')
        .then(d => setItems([...locales, ...(Array.isArray(d) ? d : [])]))
        .catch(() => setItems(locales));
    };
    cargar();
    window.addEventListener('partgo_reclamos_changed', cargar);
    return () => window.removeEventListener('partgo_reclamos_changed', cargar);
  }, []);

  const cambiarEstado = (id, estado) => {
    actualizarEstadoReclamo(id, estado);
    Swal.fire({ icon:'success', title:`Estado actualizado: ${ESTADO_LABEL[estado]||estado}`, timer:1300, showConfirmButton:false, background:'var(--card-bg)', color:'var(--text)' });
  };

  const eliminar = async (id) => {
    const r = await Swal.fire({ title:'¿Eliminar reclamo?', icon:'warning', showCancelButton:true, confirmButtonText:'Eliminar', cancelButtonText:'Cancelar', confirmButtonColor:'#ef4444', background:'var(--card-bg)', color:'var(--text)' });
    if (!r.isConfirmed) return;
    eliminarReclamo(id);
  };

  return (
    <div style={S.page}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px' }}>
        <div>
          <h1 style={{ margin:'0 0 4px', fontSize:'22px', fontWeight:'800', letterSpacing:'-0.3px' }}>Reclamos y soporte</h1>
          <p style={{ margin:0, color:'var(--muted)', fontSize:'13px' }}>{items.length} registros en total</p>
        </div>
      </div>

      <div style={S.card}>
        {items.length === 0 ? (
          <div style={{ textAlign:'center', padding:'48px', color:'var(--muted)' }}>
            <div style={{ fontSize:'40px', marginBottom:'12px', opacity:.3 }}>📋</div>
            <p style={{ margin:0, fontWeight:'600' }}>Sin registros aún</p>
          </div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>
                <th style={S.th}>#</th>
                <th style={S.th}>Cliente</th>
                <th style={S.th}>Tipo</th>
                <th style={S.th}>Asunto</th>
                <th style={S.th}>Pedido</th>
                <th style={S.th}>Fecha</th>
                <th style={S.th}>Estado</th>
                <th style={{ ...S.th, textAlign:'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={item.id} style={{ transition:'background .15s' }}
                  onMouseOver={e=>e.currentTarget.style.background='var(--bg4)'}
                  onMouseOut={e=>e.currentTarget.style.background='transparent'}>
                  <td style={{ ...S.td, color:'var(--muted)', fontSize:'12px' }}>{i+1}</td>
                  <td style={S.td}>
                    <div style={{ fontWeight:'600' }}>{item.cliente || 'Cliente'}</div>
                    {item.email && <div style={{ color:'var(--muted)', fontSize:'11px' }}>{item.email}</div>}
                  </td>
                  <td style={S.td}>{TIPO_LABEL[item.tipo] || item.tipo || '-'}</td>
                  <td style={{ ...S.td, maxWidth:'220px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.asunto || '-'}</td>
                  <td style={{ ...S.td, color:'#a78bfa' }}>{item.pedido && item.pedido !== '-' ? item.pedido : '-'}</td>
                  <td style={{ ...S.td, color:'var(--muted)', fontSize:'12px' }}>{item.fecha ? new Date(item.fecha).toLocaleDateString('es-PE') : '-'}</td>
                  <td style={S.td}>
                    <select value={item.estado||'PENDIENTE'} onChange={e => cambiarEstado(item.id, e.target.value)}
                      style={{ background:(ESTADO_COLOR[item.estado]||'#6b7280')+'18', color:ESTADO_COLOR[item.estado]||'#6b7280', border:'1px solid var(--border)', borderRadius:'7px', padding:'5px 8px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:"'Inter',sans-serif", outline:'none' }}>
                      {Object.keys(ESTADO_LABEL).map(e => <option key={e} value={e}>{ESTADO_LABEL[e]}</option>)}
                    </select>
                  </td>
                  <td style={{ ...S.td, textAlign:'right' }}>
                    <button onClick={() => setDetalle(item)} style={{ background:'rgba(124,58,237,.15)', color:'#a78bfa', border:'1px solid rgba(124,58,237,.3)', borderRadius:'7px', padding:'5px 12px', fontSize:'12px', fontWeight:'600', cursor:'pointer', fontFamily:"'Inter',sans-serif", marginRight:'6px' }}>
                      👁️ Ver
                    </button>
                    <button style={S.btnDelete} onClick={() => eliminar(item.id)}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {detalle && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.7)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px', backdropFilter:'blur(4px)' }}
          onClick={e => e.target === e.currentTarget && setDetalle(null)}>
          <div style={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'16px', padding:'28px', width:'100%', maxWidth:'520px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'18px' }}>
              <h3 style={{ margin:0, fontSize:'18px', fontWeight:'700' }}>Detalle del reclamo</h3>
              <button onClick={() => setDetalle(null)} style={{ background:'var(--bg4)', border:'none', color:'var(--muted)', cursor:'pointer', borderRadius:'8px', padding:'6px 10px', fontSize:'16px' }}>✕</button>
            </div>
            <div style={{ display:'grid', gap:'10px' }}>
              <div><b style={{ color:'var(--muted)', fontSize:'11px', textTransform:'uppercase' }}>Cliente</b><p style={{ margin:'2px 0 0' }}>{detalle.cliente} {detalle.email && `· ${detalle.email}`}</p></div>
              <div><b style={{ color:'var(--muted)', fontSize:'11px', textTransform:'uppercase' }}>Tipo</b><p style={{ margin:'2px 0 0' }}>{TIPO_LABEL[detalle.tipo] || detalle.tipo}</p></div>
              <div><b style={{ color:'var(--muted)', fontSize:'11px', textTransform:'uppercase' }}>Pedido relacionado</b><p style={{ margin:'2px 0 0' }}>{detalle.pedido && detalle.pedido !== '-' ? detalle.pedido : 'No especificado'}</p></div>
              <div><b style={{ color:'var(--muted)', fontSize:'11px', textTransform:'uppercase' }}>Descripción</b><p style={{ margin:'2px 0 0', lineHeight:1.5 }}>{detalle.descripcion}</p></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
