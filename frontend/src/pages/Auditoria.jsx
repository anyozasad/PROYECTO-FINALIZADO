import { useEffect, useState } from 'react';
import { apiFetch } from '../services/api';

const DEMO = [
  { id:1, usuario_id:1, usuario_nombre:'Admin PartGo', accion:'CREATE', tabla_afectada:'productos', descripcion:'Creó el producto "Filtro de aceite HF303"', fecha:new Date(Date.now()-30*60000).toISOString() },
  { id:2, usuario_id:1, usuario_nombre:'Admin PartGo', accion:'UPDATE', tabla_afectada:'pedidos',   descripcion:'Actualizó el estado del pedido #PG001560 a ENTREGADO', fecha:new Date(Date.now()-1*3600000).toISOString() },
  { id:3, usuario_id:1, usuario_nombre:'Admin PartGo', accion:'DELETE', tabla_afectada:'ofertas',   descripcion:'Eliminó la oferta "5% OFF en todo"', fecha:new Date(Date.now()-3*3600000).toISOString() },
  { id:4, usuario_id:1, usuario_nombre:'Admin PartGo', accion:'LOGIN',  tabla_afectada:'usuarios',  descripcion:'Inicio de sesión desde 192.168.1.1', fecha:new Date(Date.now()-6*3600000).toISOString() },
  { id:5, usuario_id:1, usuario_nombre:'Admin PartGo', accion:'UPDATE', tabla_afectada:'clientes',  descripcion:'Actualizó datos del cliente Carlos Ramírez', fecha:new Date(Date.now()-8*3600000).toISOString() },
];
const AC = { CREATE:'#10b981', UPDATE:'#3b82f6', DELETE:'#ef4444', LOGIN:'#7c3aed', LOGOUT:'#6b7280' };
const AI = { CREATE:'➕', UPDATE:'✏️', DELETE:'🗑️', LOGIN:'🔑', LOGOUT:'🚪' };
const TH = { color:'var(--muted)', fontSize:'11px', fontWeight:'700', padding:'10px 14px', textAlign:'left', textTransform:'uppercase', letterSpacing:'.05em', borderBottom:'1px solid var(--border)' };
const TD = { padding:'12px 14px', fontSize:'13px', color:'var(--text)', borderBottom:'1px solid var(--border)' };

export default function Auditoria() {
  const [items, setItems] = useState([]);
  const [filtro, setFiltro] = useState('');
  useEffect(() => { apiFetch('/auditoria').then(d=>setItems(Array.isArray(d)?d:[])).catch(()=>setItems(DEMO)); }, []);

  const filtrados = items.filter(it => !filtro || it.accion===filtro || it.tabla_afectada?.includes(filtro.toLowerCase()));

  return (
    <div style={{ fontFamily:"'Inter',sans-serif", color:'var(--text)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px' }}>
        <div>
          <h1 style={{ margin:'0 0 4px', fontSize:'22px', fontWeight:'800' }}>🔍 Auditoría del sistema</h1>
          <p style={{ margin:0, color:'var(--muted)', fontSize:'13px' }}>Registro de todas las acciones administrativas.</p>
        </div>
        <div style={{ display:'flex', gap:'8px' }}>
          {['','CREATE','UPDATE','DELETE','LOGIN'].map(a=>(
            <button key={a} onClick={()=>setFiltro(a)} style={{ padding:'6px 14px', borderRadius:'20px', border:`1px solid ${filtro===a?'#7c3aed':'var(--border)'}`, background:filtro===a?'rgba(124,58,237,.2)':'transparent', color:filtro===a?'#a78bfa':'var(--muted)', fontSize:'12px', fontWeight:'600', cursor:'pointer', fontFamily:"'Inter',sans-serif" }}>
              {a||'Todas'}
            </button>
          ))}
        </div>
      </div>
      <div style={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'14px', overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead><tr style={{ background:'var(--bg4)' }}>
            <th style={TH}>#</th><th style={TH}>Usuario</th><th style={TH}>Acción</th><th style={TH}>Módulo</th><th style={TH}>Descripción</th><th style={TH}>Fecha</th>
          </tr></thead>
          <tbody>{filtrados.map((it,i)=>{
            const col=AC[it.accion]||'#6b7280';
            return (
              <tr key={it.id} onMouseOver={e=>e.currentTarget.style.background='var(--bg4)'} onMouseOut={e=>e.currentTarget.style.background='transparent'} style={{ transition:'background .15s' }}>
                <td style={{ ...TD, color:'var(--muted)', fontSize:'12px' }}>{i+1}</td>
                <td style={{ ...TD, fontWeight:'600' }}>{it.usuario_nombre||`Usuario #${it.usuario_id}`}</td>
                <td style={TD}><span style={{ background:`${col}22`, color:col, padding:'4px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:'700', display:'inline-flex', alignItems:'center', gap:'4px' }}>{AI[it.accion]||'•'} {it.accion}</span></td>
                <td style={{ ...TD, color:'var(--muted)' }}>{it.tabla_afectada}</td>
                <td style={{ ...TD, fontSize:'12px' }}>{it.descripcion}</td>
                <td style={{ ...TD, color:'var(--muted)', fontSize:'12px', whiteSpace:'nowrap' }}>{new Date(it.fecha||Date.now()).toLocaleString('es-PE')}</td>
              </tr>
            );
          })}</tbody>
        </table>
        {filtrados.length===0&&<div style={{ textAlign:'center', padding:'40px', color:'var(--muted)' }}>Sin registros de auditoría</div>}
      </div>
    </div>
  );
}
