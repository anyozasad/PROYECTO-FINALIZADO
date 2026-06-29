import { useEffect, useState } from 'react';
import { apiFetch } from '../services/api';
import { obtenerCatalogo, obtenerHistorialStockLocal } from '../utils/catalogoStore';

const DEMO = [
  { id:1, producto_id:6,  producto_nombre:'Alternador 4P CGL',         stock_anterior:12, stock_nuevo:9,  movimiento:'VENTA',   referencia:'PG001562', fecha:new Date(Date.now()-1*3600000).toISOString() },
  { id:2, producto_id:15, producto_nombre:'Zapata freno roja',          stock_anterior:15, stock_nuevo:12, movimiento:'VENTA',   referencia:'PG001561', fecha:new Date(Date.now()-2*3600000).toISOString() },
  { id:3, producto_id:3,  producto_nombre:'Aceite Lubricante 4T25W-50', stock_anterior:20, stock_nuevo:30, movimiento:'COMPRA',  referencia:'OC-2026-01',fecha:new Date(Date.now()-5*3600000).toISOString() },
  { id:4, producto_id:14, producto_nombre:'Cadena 428-114L',            stock_anterior:8,  stock_nuevo:5,  movimiento:'VENTA',   referencia:'PG001559', fecha:new Date(Date.now()-8*3600000).toISOString() },
  { id:5, producto_id:13, producto_nombre:'Bobina 12V',                 stock_anterior:18, stock_nuevo:19, movimiento:'AJUSTE',  referencia:'ADJ-001',  fecha:new Date(Date.now()-12*3600000).toISOString() },
];

const MC = { VENTA:'#ef4444', COMPRA:'#10b981', AJUSTE:'#f59e0b', DEVOLUCION:'#3b82f6' };
const TH = { color:'var(--muted)', fontSize:'11px', fontWeight:'700', padding:'10px 14px', textAlign:'left', textTransform:'uppercase', letterSpacing:'.05em', borderBottom:'1px solid var(--border)' };
const TD = { padding:'12px 14px', fontSize:'13px', color:'var(--text)', borderBottom:'1px solid var(--border)' };

export default function HistorialStock() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    const cargar = () => {
      const locales = obtenerHistorialStockLocal();
      apiFetch('/historial_stock')
        .then(d => setItems([...locales, ...(Array.isArray(d) ? d : [])]))
        .catch(() => setItems([...locales, ...DEMO]));
    };
    cargar();
    window.addEventListener('partgo_historial_stock_changed', cargar);
    return () => window.removeEventListener('partgo_historial_stock_changed', cargar);
  }, []);

  const catalogo = obtenerCatalogo();
  const nombreProducto = (it) => {
    if (it.producto_nombre) return it.producto_nombre;
    const p = catalogo.find(c => Number(c.id) === Number(it.producto_id));
    return p?.nombre || `Producto #${it.producto_id}`;
  };

  const resumen = { entradas:items.filter(i=>i.movimiento==='COMPRA').length, salidas:items.filter(i=>i.movimiento==='VENTA').length, ajustes:items.filter(i=>i.movimiento==='AJUSTE').length };

  return (
    <div style={{ fontFamily:"'Inter',sans-serif", color:'var(--text)' }}>
      <div style={{ marginBottom:'24px' }}>
        <h1 style={{ margin:'0 0 4px', fontSize:'22px', fontWeight:'800' }}>📦 Historial de Stock</h1>
        <p style={{ margin:0, color:'var(--muted)', fontSize:'13px' }}>Movimientos de inventario por compras, ventas y ajustes.</p>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'14px', marginBottom:'20px' }}>
        {[{l:'Entradas',v:resumen.entradas,c:'#10b981',i:'📥'},{l:'Salidas',v:resumen.salidas,c:'#ef4444',i:'📤'},{l:'Ajustes',v:resumen.ajustes,c:'#f59e0b',i:'🔧'}].map(s=>(
          <div key={s.l} style={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'14px', padding:'18px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div><p style={{ margin:'0 0 4px', fontSize:'12px', color:'var(--muted)' }}>{s.l}</p><p style={{ margin:0, fontSize:'24px', fontWeight:'800', color:s.c }}>{s.v}</p></div>
            <div style={{ width:'40px', height:'40px', background:`${s.c}18`, borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px' }}>{s.i}</div>
          </div>
        ))}
      </div>
      <div style={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'14px', overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead><tr style={{ background:'var(--bg4)' }}>
            <th style={TH}>#</th><th style={TH}>Producto</th><th style={TH}>Stock anterior</th><th style={TH}>Stock nuevo</th><th style={TH}>Diferencia</th><th style={TH}>Movimiento</th><th style={TH}>Referencia</th><th style={TH}>Fecha</th>
          </tr></thead>
          <tbody>{items.map((it,i)=>{
            const diff = it.stock_nuevo - it.stock_anterior;
            const col = MC[it.movimiento]||'#6b7280';
            return (
              <tr key={it.id} onMouseOver={e=>e.currentTarget.style.background='var(--bg4)'} onMouseOut={e=>e.currentTarget.style.background='transparent'} style={{ transition:'background .15s' }}>
                <td style={{ ...TD, color:'var(--muted)', fontSize:'12px' }}>{i+1}</td>
                <td style={{ ...TD, fontWeight:'600' }}>{nombreProducto(it)}</td>
                <td style={TD}>{it.stock_anterior}</td>
                <td style={TD}>{it.stock_nuevo}</td>
                <td style={TD}><span style={{ color:diff>0?'#10b981':'#ef4444', fontWeight:'700' }}>{diff>0?'+':''}{diff}</span></td>
                <td style={TD}><span style={{ background:`${col}22`, color:col, padding:'3px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:'700' }}>{it.movimiento}</span></td>
                <td style={{ ...TD, color:'#a78bfa' }}>{it.referencia}</td>
                <td style={{ ...TD, color:'var(--muted)', fontSize:'12px' }}>{new Date(it.fecha||Date.now()).toLocaleDateString('es-PE')}</td>
              </tr>
            );
          })}</tbody>
        </table>
        {items.length===0&&<div style={{ textAlign:'center', padding:'40px', color:'var(--muted)' }}>Sin registros de stock</div>}
      </div>
    </div>
  );
}
