import { useEffect, useState } from 'react';
import { apiFetch } from '../services/api';
import { obtenerPedidos as obtenerPedidosLocales } from '../utils/shopCore';

const DEMO = [
  { id:1, numero_comprobante:'B001-000001', cliente:'Carlos Ramírez',  documento:'71234567', metodo_pago:'Yape',    total:150.90, estado:'ENTREGADO',  fecha:'2026-06-15T10:30:00' },
  { id:2, numero_comprobante:'B001-000002', cliente:'María Fernanda',  documento:'74581236', metodo_pago:'Tarjeta', total:89.50,  estado:'EN_CAMINO',  fecha:'2026-06-14T09:15:00' },
  { id:3, numero_comprobante:'B001-000003', cliente:'Juan Diego',      documento:'70123456', metodo_pago:'Efectivo',total:220.00, estado:'ENTREGADO',  fecha:'2026-06-13T16:00:00' },
  { id:4, numero_comprobante:'B001-000004', cliente:'Lucía Martínez',  documento:'73456789', metodo_pago:'Yape',    total:65.00,  estado:'CANCELADO',  fecha:'2026-06-12T14:10:00' },
  { id:5, numero_comprobante:'B001-000005', cliente:'Pedro Castillo',  documento:'72345678', metodo_pago:'Tarjeta', total:310.50, estado:'ENTREGADO',  fecha:'2026-06-11T11:45:00' },
  { id:6, numero_comprobante:'B001-000006', cliente:'Ana Torres',      documento:'71987654', metodo_pago:'Yape',    total:47.90,  estado:'ENTREGADO',  fecha:'2026-06-10T08:30:00' },
];
const EC = { ENTREGADO:'#10b981', EN_CAMINO:'#3b82f6', PENDIENTE:'#f59e0b', CANCELADO:'#ef4444', PAGADO:'#8b5cf6' };
const EL = { ENTREGADO:'Entregado', EN_CAMINO:'En camino', PENDIENTE:'Pendiente', CANCELADO:'Cancelado', PAGADO:'Pagado' };
const TH = { color:'var(--muted)', fontSize:'11px', fontWeight:'700', padding:'10px 14px', textAlign:'left', textTransform:'uppercase', letterSpacing:'.05em', borderBottom:'1px solid var(--border)' };
const TD = { padding:'12px 14px', fontSize:'13px', color:'var(--text)', borderBottom:'1px solid var(--border)' };

const ESTADO_LOCAL_A_CODIGO = { Pendiente:'PENDIENTE', Pagado:'PAGADO', Preparando:'EN_PREPARACION', 'En camino':'EN_CAMINO', Entregado:'ENTREGADO', Cancelado:'CANCELADO' };

function normalizarVentaLocal(p) {
  return {
    id: p.id,
    numero_comprobante: `${p.serie}-${p.numero}`,
    cliente: p.cliente?.nombre || 'Cliente Dorada Motor’s',
    documento: p.cliente?.documento || '-',
    metodo_pago: p.pago?.metodo || '-',
    total: Number(p.resumen?.total || 0),
    estado: ESTADO_LOCAL_A_CODIGO[p.estado] || 'PENDIENTE',
    fecha: p.fecha,
  };
}

export default function Ventas() {
  const [ventas, setVentas] = useState([]);
  const [filtro, setFiltro] = useState('');

  useEffect(() => {
    const cargar = () => {
      const locales = obtenerPedidosLocales().map(normalizarVentaLocal);
      apiFetch('/ventas')
        .then(d => setVentas([...locales, ...(Array.isArray(d) ? d : [])]))
        .catch(() => setVentas([...locales, ...DEMO]));
    };
    cargar();
    window.addEventListener('partgo_orders_changed', cargar);
    window.addEventListener('partgo_pedido_creado', cargar);
    return () => {
      window.removeEventListener('partgo_orders_changed', cargar);
      window.removeEventListener('partgo_pedido_creado', cargar);
    };
  }, []);

  const total = ventas.reduce((a,v) => a + Number(v.total||0), 0);
  const entregadas = ventas.filter(v => v.estado === 'ENTREGADO').length;
  const filtradas = ventas.filter(v => !filtro || v.estado === filtro || v.numero_comprobante?.includes(filtro) || v.cliente?.toLowerCase().includes(filtro.toLowerCase()));

  return (
    <div style={{ fontFamily:"'Inter',sans-serif", color:'var(--text)' }}>
      <div style={{ marginBottom:'24px' }}>
        <h1 style={{ margin:'0 0 4px', fontSize:'22px', fontWeight:'800' }}>💰 Historial de Ventas</h1>
        <p style={{ margin:0, color:'var(--muted)', fontSize:'13px' }}>Registro completo de ventas y pedidos completados.</p>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'14px', marginBottom:'22px' }}>
        {[
          { label:'Total ventas', val:`S/ ${total.toLocaleString('es-PE',{minimumFractionDigits:2})}`, color:'#10b981', bg:'rgba(16,185,129,.15)', icon:'💵' },
          { label:'Órdenes totales', val:ventas.length, color:'#3b82f6', bg:'rgba(59,130,246,.15)', icon:'📋' },
          { label:'Entregadas', val:entregadas, color:'#10b981', bg:'rgba(16,185,129,.15)', icon:'✅' },
          { label:'Canceladas', val:ventas.filter(v=>v.estado==='CANCELADO').length, color:'#ef4444', bg:'rgba(239,68,68,.15)', icon:'❌' },
        ].map(s => (
          <div key={s.label} style={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'14px', padding:'16px 18px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <p style={{ margin:'0 0 4px', fontSize:'12px', color:'var(--muted)', fontWeight:'500' }}>{s.label}</p>
              <p style={{ margin:0, fontSize:'22px', fontWeight:'800', color:s.color }}>{s.val}</p>
            </div>
            <div style={{ width:'40px', height:'40px', background:s.bg, borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px' }}>{s.icon}</div>
          </div>
        ))}
      </div>

      {/* Buscador */}
      <div style={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'10px', padding:'8px 14px', display:'flex', alignItems:'center', gap:'8px', maxWidth:'360px', marginBottom:'18px' }}>
        <span style={{ color:'var(--muted)', fontSize:'14px' }}>🔍</span>
        <input value={filtro} onChange={e=>setFiltro(e.target.value)} placeholder="Buscar venta, cliente..."
          style={{ background:'transparent', border:'none', color:'var(--text)', outline:'none', fontSize:'13px', width:'100%', fontFamily:"'Inter',sans-serif" }}/>
      </div>

      {/* Tabla */}
      <div style={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'14px', overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead><tr style={{ background:'var(--bg4)' }}>
            <th style={TH}>N° Comprobante</th><th style={TH}>Cliente</th><th style={TH}>Documento</th>
            <th style={TH}>Método pago</th><th style={TH}>Total</th><th style={TH}>Estado</th><th style={TH}>Fecha</th>
          </tr></thead>
          <tbody>
            {filtradas.map(v => (
              <tr key={v.id} onMouseOver={e=>e.currentTarget.style.background='var(--bg4)'} onMouseOut={e=>e.currentTarget.style.background='transparent'} style={{ transition:'background .15s' }}>
                <td style={{ ...TD, color:'#a78bfa', fontWeight:'700' }}>{v.numero_comprobante}</td>
                <td style={TD}>{v.cliente}</td>
                <td style={{ ...TD, color:'var(--muted)' }}>{v.documento}</td>
                <td style={TD}>{v.metodo_pago}</td>
                <td style={{ ...TD, fontWeight:'700' }}>S/ {Number(v.total).toFixed(2)}</td>
                <td style={TD}><span style={{ background:(EC[v.estado]||'#6b7280')+'22', color:EC[v.estado]||'#6b7280', padding:'3px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:'700' }}>{EL[v.estado]||v.estado}</span></td>
                <td style={{ ...TD, color:'var(--muted)', fontSize:'12px' }}>{new Date(v.fecha).toLocaleDateString('es-PE')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtradas.length===0 && <div style={{ textAlign:'center', padding:'40px', color:'var(--muted)' }}>Sin registros</div>}
      </div>
    </div>
  );
}
