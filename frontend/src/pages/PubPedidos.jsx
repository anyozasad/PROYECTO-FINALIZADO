import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { obtenerPedidos } from '../utils/shopCore';

const demo = [
  { id:'#PGO-2026-00124', fecha:'20 Jun 2026', resumen:{ total:299.90 }, estado:'Entregado', serie:'B001', numero:'00000001', items:[] },
  { id:'#PGO-2026-00123', fecha:'15 Jun 2026', resumen:{ total:150.00 }, estado:'En camino', serie:'B001', numero:'00000002', items:[] },
  { id:'#PGO-2026-00122', fecha:'08 Jun 2026', resumen:{ total:59.90 }, estado:'Pendiente', serie:'B001', numero:'00000003', items:[] },
];

const tabs = ['Todos', 'Pendiente', 'En camino', 'Entregado', 'Cancelado'];
const money = (n) => Number(n || 0).toFixed(2);
const fechaPedido = (fecha) => fecha?.includes?.('T') ? new Date(fecha).toLocaleDateString('es-PE') : fecha;
const badge = (estado = '') => {
  const e = String(estado).toLowerCase();
  if (e.includes('entregado')) return '#10b981';
  if (e.includes('camino')) return '#3b82f6';
  if (e.includes('cancelado')) return '#ef4444';
  return '#f59e0b';
};

export default function PubPedidos() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('Todos');
  const [detalle, setDetalle] = useState(null);
  const [orders, setOrders] = useState(() => [...obtenerPedidos(), ...demo]);

  useEffect(() => {
    const sync = () => setOrders([...obtenerPedidos(), ...demo]);
    window.addEventListener('partgo_orders_changed', sync);
    return () => window.removeEventListener('partgo_orders_changed', sync);
  }, []);

  const lista = useMemo(() => (
    tab === 'Todos' ? orders : orders.filter((p) => String(p.estado).toLowerCase() === tab.toLowerCase())
  ), [orders, tab]);

  const abrirBoleta = (pedido) => navigate(`/s/boleta/${encodeURIComponent(pedido.id)}`);

  return (
    <div className="pub-pedidos-page">
      <style>{`
        .pub-pedidos-page{padding:22px 24px 130px;font-family:'Inter',sans-serif;color:var(--pg-text);background:var(--pg-bg);min-height:100%}
        .pub-pedidos-title{margin:0 0 4px;font-size:22px;font-weight:900;letter-spacing:-.4px}
        .pub-pedidos-sub{margin:0 0 24px;color:var(--pg-muted);font-size:13px}
        .pub-pedidos-tabs{display:flex;gap:4px;background:var(--pg-card);border:1px solid var(--pg-border);border-radius:12px;padding:4px;margin-bottom:18px;overflow-x:auto}
        .pub-pedidos-tab{flex:1;min-width:104px;padding:9px 10px;border-radius:9px;border:none;cursor:pointer;font-size:12px;font-weight:800;font-family:'Inter',sans-serif;background:transparent;color:var(--pg-muted2)}
        .pub-pedidos-tab.active{background:linear-gradient(135deg,#7c3aed,#9333ea);color:#fff;box-shadow:0 6px 16px rgba(124,58,237,.22)}
        .pub-pedidos-table-wrap{background:var(--pg-card);border:1px solid var(--pg-border);border-radius:14px;overflow:hidden;box-shadow:var(--pg-shadow)}
        .pub-pedidos-table{width:100%;border-collapse:collapse;font-size:13px;table-layout:auto}
        .pub-pedidos-table th{padding:12px;text-align:left;background:var(--pg-input);color:var(--pg-muted2);text-transform:uppercase;font-size:11px;white-space:nowrap}
        .pub-pedidos-table th:last-child{text-align:right}
        .pub-pedidos-table td{padding:13px;border-bottom:1px solid var(--pg-border);vertical-align:middle}
        .pub-pedido-id{font-weight:900;color:#a78bfa;word-break:break-word}
        .pub-pedido-estado{border-radius:999px;padding:4px 9px;font-size:11px;font-weight:900;white-space:nowrap}
        .pub-pedidos-actions{display:flex;gap:8px;justify-content:flex-end;align-items:center;flex-wrap:wrap}
        .pub-pedidos-btn{border-radius:8px;padding:7px 12px;font-size:12px;font-weight:900;cursor:pointer;font-family:'Inter',sans-serif;transition:.15s ease;white-space:nowrap}
        .pub-pedidos-btn:hover{transform:translateY(-1px);filter:brightness(1.05)}
        .pub-pedidos-btn.outline{background:var(--pg-soft);color:#a78bfa;border:1px solid rgba(124,58,237,.3)}
        .pub-pedidos-btn.primary{background:linear-gradient(135deg,#7c3aed,#9333ea);color:#fff;border:0}
        .pub-pedidos-cards{display:none;gap:12px}
        .pub-pedido-card{background:var(--pg-card);border:1px solid var(--pg-border);border-radius:16px;padding:14px;box-shadow:var(--pg-shadow)}
        .pub-pedido-card-head{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:12px}
        .pub-pedido-card-id{font-size:14px;font-weight:900;color:#a78bfa;line-height:1.25;word-break:break-word}
        .pub-pedido-card-total{font-size:18px;font-weight:900;color:var(--pg-text);white-space:nowrap}
        .pub-pedido-card-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0 14px}
        .pub-pedido-info{background:var(--pg-input);border:1px solid var(--pg-border);border-radius:10px;padding:9px}
        .pub-pedido-info small{display:block;color:var(--pg-muted);font-size:10px;text-transform:uppercase;font-weight:800;margin-bottom:3px}
        .pub-pedido-info strong{display:block;color:var(--pg-text2);font-size:12px}
        .pub-pedido-card-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px}
        .pub-pedido-help{margin-top:14px;background:var(--pg-card);border:1px solid var(--pg-border);border-radius:12px;padding:14px;display:flex;justify-content:space-between;align-items:center;gap:12px}
        .pub-pedidos-modal{position:fixed;inset:0;background:rgba(0,0,0,.72);z-index:2147481000;display:grid;place-items:center;backdrop-filter:blur(4px);padding:16px}
        .pub-pedidos-modal-card{background:var(--pg-card);border:1px solid var(--pg-border2);border-radius:16px;width:min(560px,92vw);max-height:85dvh;overflow:auto;padding:22px;color:var(--pg-text)}
        .pub-pedidos-modal-head{display:flex;justify-content:space-between;align-items:center;gap:10px}
        @media(max-width:760px){
          .pub-pedidos-page{padding:18px 12px 140px}
          .pub-pedidos-title{font-size:24px}
          .pub-pedidos-sub{font-size:13px;margin-bottom:16px}
          .pub-pedidos-tabs{margin-bottom:14px;padding:5px;scroll-snap-type:x mandatory}
          .pub-pedidos-tab{flex:0 0 auto;min-width:118px;scroll-snap-align:start}
          .pub-pedidos-table-wrap{display:none}
          .pub-pedidos-cards{display:grid}
          .pub-pedido-help{display:grid;gap:10px;text-align:center}
          .pub-pedido-help .pub-pedidos-btn{width:100%}
        }
        @media(max-width:420px){
          .pub-pedido-card-grid{grid-template-columns:1fr}
          .pub-pedido-card-actions{grid-template-columns:1fr}
        }
      `}</style>

      <h1 className="pub-pedidos-title">Mis pedidos</h1>
      <p className="pub-pedidos-sub">Encuentra el estado de tus compras y descarga tu boleta.</p>

      <div className="pub-pedidos-tabs">
        {tabs.map((t) => (
          <button key={t} className={`pub-pedidos-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      <div className="pub-pedidos-table-wrap">
        <table className="pub-pedidos-table">
          <thead>
            <tr><th>Pedido</th><th>Fecha</th><th>Total</th><th>Estado</th><th>Acción</th></tr>
          </thead>
          <tbody>
            {lista.map((p) => {
              const color = badge(p.estado);
              return (
                <tr key={p.id}>
                  <td className="pub-pedido-id">{p.id}</td>
                  <td>{fechaPedido(p.fecha)}</td>
                  <td style={{ fontWeight: 900 }}>S/ {money(p.resumen?.total)}</td>
                  <td><span className="pub-pedido-estado" style={{ background: `${color}22`, color }}>{p.estado}</span></td>
                  <td>
                    <div className="pub-pedidos-actions">
                      <button className="pub-pedidos-btn outline" onClick={() => setDetalle(p)}>Ver detalle</button>
                      {p.serie && <button className="pub-pedidos-btn primary" onClick={() => abrirBoleta(p)}>Ver boleta</button>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="pub-pedidos-cards">
        {lista.map((p) => {
          const color = badge(p.estado);
          return (
            <article className="pub-pedido-card" key={p.id}>
              <div className="pub-pedido-card-head">
                <div className="pub-pedido-card-id">{p.id}</div>
                <div className="pub-pedido-card-total">S/ {money(p.resumen?.total)}</div>
              </div>
              <div className="pub-pedido-card-grid">
                <div className="pub-pedido-info"><small>Fecha</small><strong>{fechaPedido(p.fecha)}</strong></div>
                <div className="pub-pedido-info"><small>Estado</small><strong><span className="pub-pedido-estado" style={{ background: `${color}22`, color }}>{p.estado}</span></strong></div>
              </div>
              <div className="pub-pedido-card-actions">
                <button className="pub-pedidos-btn outline" onClick={() => setDetalle(p)}>Ver detalle</button>
                {p.serie && <button className="pub-pedidos-btn primary" onClick={() => abrirBoleta(p)}>Ver boleta</button>}
              </div>
            </article>
          );
        })}
      </div>

      <div className="pub-pedido-help">
        <span style={{ fontSize: '12px', color: 'var(--pg-muted2)' }}>¿No encuentras tu pedido?</span>
        <button className="pub-pedidos-btn primary" onClick={() => navigate('/s/mensajes')}>Contactar IA soporte →</button>
      </div>

      {detalle && (
        <div className="pub-pedidos-modal" onClick={(e) => e.target === e.currentTarget && setDetalle(null)}>
          <div className="pub-pedidos-modal-card">
            <div className="pub-pedidos-modal-head">
              <h2 style={{ margin: 0, fontSize: 18 }}>Detalle {detalle.id}</h2>
              <button onClick={() => setDetalle(null)} style={{ background: 'var(--pg-input)', border: 'none', color: 'var(--pg-muted2)', borderRadius: 8, padding: '7px 10px', cursor: 'pointer' }}>✕</button>
            </div>
            <p style={{ marginTop: 14 }}>Estado: <b>{detalle.estado}</b></p>
            <p>Total: <b>S/ {money(detalle.resumen?.total)}</b></p>
            {detalle.items?.length > 0 && detalle.items.map((i) => <p key={i.id}>• {i.nombre} x{i.cantidad}</p>)}
            {detalle.serie && <button className="pub-pedidos-btn primary" onClick={() => abrirBoleta(detalle)}>Abrir boleta electrónica</button>}
          </div>
        </div>
      )}
    </div>
  );
}
