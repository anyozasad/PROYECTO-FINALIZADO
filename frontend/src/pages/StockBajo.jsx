import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { obtenerCatalogo } from '../utils/catalogoStore';

const S = {
  page:  { fontFamily:"'Inter',sans-serif", color:'var(--text)' },
  card:  { background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'14px', padding:'20px' },
  th: { color:'var(--muted)', fontSize:'11px', fontWeight:'700', padding:'10px 14px', textAlign:'left', textTransform:'uppercase', letterSpacing:'.05em', borderBottom:'1px solid var(--border)' },
  td: { padding:'13px 14px', fontSize:'13px', color:'var(--text)', borderBottom:'1px solid var(--border)' },
};

const UMBRAL = 10;

export default function StockBajo() {
  const navigate = useNavigate();
  const [productos, setProductos] = useState([]);

  useEffect(() => {
    const cargar = () => {
      const catalogo = obtenerCatalogo().filter(p => !p.eliminado);
      setProductos(
        catalogo
          .filter(p => Number(p.stock) <= UMBRAL)
          .sort((a, b) => Number(a.stock) - Number(b.stock))
      );
    };
    cargar();
    window.addEventListener('partgo_catalogo_changed', cargar);
    return () => window.removeEventListener('partgo_catalogo_changed', cargar);
  }, []);

  const agotados = productos.filter(p => Number(p.stock) === 0).length;
  const criticos = productos.filter(p => Number(p.stock) > 0 && Number(p.stock) <= 5).length;
  const bajos = productos.filter(p => Number(p.stock) > 5).length;

  return (
    <div style={S.page}>
      <div style={{ marginBottom:'24px' }}>
        <h1 style={{ margin:'0 0 4px', fontSize:'22px', fontWeight:'800' }}>⚠️ Stock bajo</h1>
        <p style={{ margin:0, color:'var(--muted)', fontSize:'13px' }}>Productos con {UMBRAL} unidades o menos en inventario.</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'14px', marginBottom:'22px' }}>
        {[
          { label:'Agotados', val:agotados, color:'#ef4444', bg:'rgba(239,68,68,.15)', icon:'❌' },
          { label:'Stock crítico (≤5)', val:criticos, color:'#f59e0b', bg:'rgba(245,158,11,.15)', icon:'⚠️' },
          { label:'Stock bajo (6-10)', val:bajos, color:'#3b82f6', bg:'rgba(59,130,246,.15)', icon:'📉' },
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

      <div style={S.card}>
        {productos.length === 0 ? (
          <div style={{ textAlign:'center', padding:'48px', color:'var(--muted)' }}>
            <div style={{ fontSize:'40px', marginBottom:'12px', opacity:.3 }}>✅</div>
            <p style={{ margin:0, fontWeight:'600' }}>Todo el stock está en buen nivel</p>
          </div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>
                <th style={S.th}>#</th>
                <th style={S.th}>Producto</th>
                <th style={S.th}>Categoría</th>
                <th style={S.th}>SKU</th>
                <th style={S.th}>Stock</th>
                <th style={{ ...S.th, textAlign:'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productos.map((p, i) => (
                <tr key={p.id} style={{ transition:'background .15s' }}
                  onMouseOver={e=>e.currentTarget.style.background='var(--bg4)'}
                  onMouseOut={e=>e.currentTarget.style.background='transparent'}>
                  <td style={{ ...S.td, color:'var(--muted)', fontSize:'12px' }}>{i+1}</td>
                  <td style={{ ...S.td, fontWeight:'600' }}>{p.nombre}</td>
                  <td style={S.td}>
                    <span style={{ background:'rgba(124,58,237,.12)', color:'#a78bfa', padding:'3px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:'600' }}>{p.categoria}</span>
                  </td>
                  <td style={{ ...S.td, color:'var(--muted)' }}>PG-{String(p.id).padStart(5,'0')}</td>
                  <td style={S.td}>
                    <span style={{ background:Number(p.stock)===0?'rgba(239,68,68,.18)':'rgba(245,158,11,.18)', color:Number(p.stock)===0?'#ef4444':'#f59e0b', padding:'4px 12px', borderRadius:'20px', fontSize:'12px', fontWeight:'700' }}>
                      {Number(p.stock)===0?'Agotado':`${p.stock} un`}
                    </span>
                  </td>
                  <td style={{ ...S.td, textAlign:'right' }}>
                    <button onClick={() => navigate('/productos')} style={{ background:'rgba(124,58,237,.15)', color:'#a78bfa', border:'1px solid rgba(124,58,237,.3)', borderRadius:'7px', padding:'5px 12px', fontSize:'12px', fontWeight:'600', cursor:'pointer', fontFamily:"'Inter',sans-serif" }}>
                      Reabastecer →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
