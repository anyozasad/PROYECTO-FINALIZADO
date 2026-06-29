import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { obtenerPedidos } from '../utils/shopCore';
import { obtenerCatalogo } from '../utils/catalogoStore';

const S = {
  page: { fontFamily:"'Inter',sans-serif", color:'var(--text)' },
  card: { background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'14px', padding:'20px' },
};

const PERIODOS = [
  { k:'7d',  l:'7 días'  },
  { k:'30d', l:'30 días' },
  { k:'todo',l:'Todo'    },
];

function dentroDelPeriodo(fechaIso, periodo) {
  if (periodo === 'todo') return true;
  const dias = periodo === '7d' ? 7 : 30;
  const limite = Date.now() - dias * 24 * 3600 * 1000;
  return new Date(fechaIso).getTime() >= limite;
}

export default function MasVendidos() {
  const navigate = useNavigate();

  const abrirProductoAdmin = (producto) => {
    const q = encodeURIComponent(producto?.nombre || producto?.categoria || '');
    navigate(`/productos?buscar=${q}`);
  };
  const [periodo, setPeriodo] = useState('30d');
  const [ranking, setRanking] = useState([]);
  const [totalUnidades, setTotalUnidades] = useState(0);
  const [totalIngresos, setTotalIngresos] = useState(0);
  const [pedidosContados, setPedidosContados] = useState(0);

  useEffect(() => {
    const calcular = () => {
      const pedidos = obtenerPedidos().filter(p => dentroDelPeriodo(p.fecha, periodo));
      const catalogo = obtenerCatalogo();
      const acumulado = {};

      pedidos.forEach((p) => {
        (p.items || []).forEach((it) => {
          const key = it.id ?? it.nombre;
          const precio = Number(it.precio || 0);
          const cantidad = Number(it.cantidad || 1);
          if (!acumulado[key]) {
            const enCatalogo = catalogo.find(c => Number(c.id) === Number(it.id) && c.nombre === it.nombre);
            acumulado[key] = {
              id: it.id,
              nombre: it.nombre,
              imagen: it.imagen || it.img || enCatalogo?.imagen,
              categoria: it.categoria && it.categoria !== 'Repuestos' ? it.categoria : (enCatalogo?.categoria || it.categoria || 'Repuestos'),
              unidades: 0,
              ingresos: 0,
            };
          }
          acumulado[key].unidades += cantidad;
          acumulado[key].ingresos += precio * cantidad;
        });
      });

      const lista = Object.values(acumulado).sort((a, b) => b.unidades - a.unidades);
      setRanking(lista);
      setTotalUnidades(lista.reduce((s, p) => s + p.unidades, 0));
      setTotalIngresos(lista.reduce((s, p) => s + p.ingresos, 0));
      setPedidosContados(pedidos.length);
    };

    calcular();
    window.addEventListener('partgo_orders_changed', calcular);
    window.addEventListener('partgo_pedido_creado', calcular);
    return () => {
      window.removeEventListener('partgo_orders_changed', calcular);
      window.removeEventListener('partgo_pedido_creado', calcular);
    };
  }, [periodo]);

  const top3 = ranking.slice(0, 3);
  const resto = ranking.slice(3);
  const maxUnidades = ranking[0]?.unidades || 1;
  const medallas = ['🥇', '🥈', '🥉'];
  const coloresPodio = ['#f59e0b', '#94a3b8', '#b45309'];

  return (
    <div style={S.page}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px', flexWrap:'wrap', gap:'14px' }}>
        <div>
          <h1 style={{ margin:'0 0 4px', fontSize:'22px', fontWeight:'800', letterSpacing:'-0.3px' }}>📊 Productos más vendidos</h1>
          <p style={{ margin:0, color:'var(--muted)', fontSize:'13px' }}>Ranking calculado a partir de las compras reales de tus clientes.</p>
        </div>
        <div style={{ display:'flex', gap:'8px' }}>
          {PERIODOS.map(p => (
            <button key={p.k} onClick={() => setPeriodo(p.k)} style={{
              padding:'7px 16px', borderRadius:'20px', border:`1px solid ${periodo===p.k ? '#7c3aed' : 'var(--border)'}`,
              background: periodo===p.k ? 'rgba(124,58,237,.2)' : 'transparent',
              color: periodo===p.k ? '#a78bfa' : 'var(--muted)',
              fontSize:'12px', fontWeight:'600', cursor:'pointer', fontFamily:"'Inter',sans-serif", transition:'all .15s',
            }}>{p.l}</button>
          ))}
        </div>
      </div>

      {/* STATS */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'14px', marginBottom:'24px' }}>
        {[
          { label:'Pedidos en el periodo', val:pedidosContados, icon:'🧾', color:'#7c3aed', bg:'rgba(124,58,237,.15)' },
          { label:'Unidades vendidas', val:totalUnidades, icon:'📦', color:'#3b82f6', bg:'rgba(59,130,246,.15)' },
          { label:'Ingresos del periodo', val:`S/ ${totalIngresos.toLocaleString('es-PE',{minimumFractionDigits:2})}`, icon:'💵', color:'#10b981', bg:'rgba(16,185,129,.15)' },
        ].map(s => (
          <div key={s.label} style={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'14px', padding:'18px 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <p style={{ margin:'0 0 4px', fontSize:'12px', color:'var(--muted)', fontWeight:'500' }}>{s.label}</p>
              <p style={{ margin:0, fontSize:'22px', fontWeight:'800', color:s.color }}>{s.val}</p>
            </div>
            <div style={{ width:'42px', height:'42px', background:s.bg, borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'19px' }}>{s.icon}</div>
          </div>
        ))}
      </div>

      {ranking.length === 0 ? (
        <div style={{ ...S.card, textAlign:'center', padding:'60px' }}>
          <div style={{ fontSize:'44px', marginBottom:'14px', opacity:.3 }}>📊</div>
          <p style={{ margin:0, fontWeight:'600', color:'var(--muted)' }}>Aún no hay ventas registradas en este periodo</p>
        </div>
      ) : (
        <>
          {/* PODIO TOP 3 */}
          {top3.length > 0 && (
            <div style={{ display:'grid', gridTemplateColumns:`repeat(${top3.length},1fr)`, gap:'14px', marginBottom:'20px' }}>
              {top3.map((p, i) => (
                <div key={p.id ?? p.nombre} onClick={() => abrirProductoAdmin(p)} style={{
                  background:'var(--bg3)', border:`1px solid ${coloresPodio[i]}35`, borderRadius:'16px', padding:'20px',
                  cursor:'pointer', transition:'transform .2s,box-shadow .2s', position:'relative', overflow:'hidden',
                }}
                  onMouseOver={e=>{e.currentTarget.style.transform='translateY(-3px)';e.currentTarget.style.boxShadow=`0 10px 26px ${coloresPodio[i]}25`;}}
                  onMouseOut={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='none';}}>
                  <span style={{ position:'absolute', top:'14px', right:'16px', fontSize:'12px', fontWeight:'800', color:coloresPodio[i], opacity:.55 }}>#{i+1}</span>
                  <div style={{ fontSize:'30px', marginBottom:'10px' }}>{medallas[i]}</div>
                  <div style={{ width:'64px', height:'64px', background:'var(--bg4)', borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', marginBottom:'12px' }}>
                    {p.imagen
                      ? <img src={p.imagen} alt="" style={{ maxWidth:'56px', maxHeight:'56px', objectFit:'contain' }} onError={e=>{e.target.style.display='none';}}/>
                      : <span style={{ fontSize:'24px' }}>📦</span>}
                  </div>
                  <p style={{ margin:'0 0 4px', fontSize:'14px', fontWeight:'700', color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.nombre}</p>
                  <p style={{ margin:'0 0 12px', fontSize:'11px', color:'var(--muted)' }}>{p.categoria}</p>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
                    <span style={{ fontSize:'20px', fontWeight:'800', color:coloresPodio[i] }}>{p.unidades}</span>
                    <span style={{ fontSize:'11px', color:'var(--muted)' }}>unidades</span>
                  </div>
                  <p style={{ margin:'6px 0 0', fontSize:'12px', color:'#a78bfa', fontWeight:'700' }}>S/ {p.ingresos.toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}

          {/* RESTO DEL RANKING */}
          {resto.length > 0 && (
            <div style={S.card}>
              <h3 style={{ margin:'0 0 16px', fontSize:'15px', fontWeight:'700' }}>Resto del ranking</h3>
              <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                {resto.map((p, i) => (
                  <div key={p.id ?? p.nombre} onClick={() => abrirProductoAdmin(p)} title="Ver producto" style={{ display:'flex', alignItems:'center', gap:'14px', cursor:p.id?'pointer':'default', borderRadius:'10px', padding:'6px', transition:'background .15s' }} onMouseOver={e=>{ if(p.id) e.currentTarget.style.background='var(--bg4)'; }} onMouseOut={e=>{ e.currentTarget.style.background='transparent'; }}>
                    <span style={{ width:'22px', textAlign:'center', color:'var(--muted)', fontSize:'12px', fontWeight:'700', flexShrink:0 }}>#{i + 4}</span>
                    <div style={{ width:'38px', height:'38px', background:'var(--bg4)', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', flexShrink:0 }}>
                      {p.imagen
                        ? <img src={p.imagen} alt="" style={{ maxWidth:'32px', maxHeight:'32px', objectFit:'contain' }} onError={e=>{e.target.style.display='none';}}/>
                        : <span style={{ fontSize:'16px' }}>📦</span>}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ margin:'0 0 5px', fontSize:'13px', fontWeight:'600', color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.nombre}</p>
                      <div style={{ height:'5px', background:'var(--bg4)', borderRadius:'4px', overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${Math.max(4, (p.unidades / maxUnidades) * 100)}%`, background:'linear-gradient(90deg,#7c3aed,#a78bfa)', borderRadius:'4px', transition:'width .3s' }} />
                      </div>
                    </div>
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      <p style={{ margin:'0 0 2px', fontSize:'13px', fontWeight:'800', color:'var(--text)' }}>{p.unidades} un</p>
                      <p style={{ margin:0, fontSize:'11px', color:'var(--muted)' }}>S/ {p.ingresos.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
