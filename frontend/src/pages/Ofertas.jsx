import { useState, useEffect } from 'react';
import { apiFetch } from '../services/api';
import Swal from 'sweetalert2';

const OFERTAS_DEMO = [
  { id:1, producto_id:1, nombre:'10% OFF en frenos', descuento:10, fecha_inicio:'2026-01-06', fecha_fin:'2026-06-30', estado:'Activo', codigo:'FRENO10' },
  { id:2, producto_id:3, nombre:'20% OFF en suspensión', descuento:20, fecha_inicio:'2026-01-15', fecha_fin:'2026-05-31', estado:'Programado', codigo:'SUSP20' },
  { id:3, producto_id:5, nombre:'15% OFF en lubricantes', descuento:15, fecha_inicio:'2026-02-25', fecha_fin:'2026-06-15', estado:'Activo', codigo:'LUBR15' },
  { id:4, producto_id:2, nombre:'5% OFF en todo', descuento:5, fecha_inicio:'2026-01-05', fecha_fin:'2026-06-09', estado:'Finalizado', codigo:'TODO05' },
];

const estadoColor = { Activo:'#10b981', Programado:'#3b82f6', Finalizado:'#6b7280', Pausado:'#f59e0b' };

export default function Ofertas() {
  const [ofertas, setOfertas] = useState(OFERTAS_DEMO);
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ producto_id:'', nombre:'', descuento:'', fecha_inicio:'', fecha_fin:'', codigo:'' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiFetch('/ofertas').then(d => {
      const lista = Array.isArray(d) ? d : [];
      if (lista.length > 0) setOfertas(lista);
    }).catch(() => {});
  }, []);

  const abrirCrear = () => { setForm({ producto_id:'', nombre:'', descuento:'', fecha_inicio:'', fecha_fin:'', codigo:'' }); setEditId(null); setModal(true); };
  const abrirEditar = (o) => { setForm({ producto_id:o.producto_id||'', nombre:o.nombre||'', descuento:o.descuento||'', fecha_inicio:o.fecha_inicio?.split('T')[0]||'', fecha_fin:o.fecha_fin?.split('T')[0]||'', codigo:o.codigo||'' }); setEditId(o.id); setModal(true); };

  const guardar = async () => {
    if (!form.nombre || !form.descuento) { Swal.fire({ icon:'warning', title:'Campos requeridos', confirmButtonColor:'#7c3aed', background:'#0e0e1a', color:'white' }); return; }
    setLoading(true);
    try {
      if (editId) {
        await apiFetch(`/ofertas/${editId}`, { method:'PUT', body:JSON.stringify(form) });
        setOfertas(prev => prev.map(o => o.id === editId ? {...o, ...form, id:editId} : o));
      } else {
        setOfertas(prev => [...prev, {...form, id:Date.now(), estado:'Activo'}]);
      }
      Swal.fire({ icon:'success', title:editId?'Actualizado':'Creado', timer:1500, showConfirmButton:false, background:'#0e0e1a', color:'white' });
      setModal(false);
    } catch {
      setOfertas(prev => editId ? prev.map(o => o.id === editId ? {...o, ...form} : o) : [...prev, {...form, id:Date.now(), estado:'Activo'}]);
      setModal(false);
      Swal.fire({ icon:'success', title:editId?'Actualizado':'Creado', timer:1500, showConfirmButton:false, background:'#0e0e1a', color:'white' });
    } finally { setLoading(false); }
  };

  const eliminar = async (o) => {
    const r = await Swal.fire({ title:`¿Eliminar oferta?`, text:`"${o.nombre}"`, icon:'warning', showCancelButton:true, confirmButtonText:'Eliminar', confirmButtonColor:'#ef4444', background:'#0e0e1a', color:'white' });
    if (!r.isConfirmed) return;
    try { await apiFetch(`/ofertas/${o.id}`, { method:'DELETE' }); } catch {}
    setOfertas(prev => prev.filter(x => x.id !== o.id));
  };

  return (
    <div style={{fontFamily:'Inter,sans-serif', color:'white', animation:'fadeIn 0.3s ease'}}>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}} @keyframes slideIn{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}`}</style>

      {/* HEADER */}
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'24px'}}>
        <div>
          <h1 style={{fontSize:'26px', fontWeight:'800', margin:'0 0 4px', letterSpacing:'-0.3px'}}>Promociones y Ofertas</h1>
          <p style={{color:'#6b7280', fontSize:'14px', margin:0}}>Gestiona descuentos y promociones especiales para los clientes.</p>
        </div>
        <button onClick={abrirCrear} className="pg-btn" style={{gap:'8px', fontSize:'14px', padding:'11px 20px', boxShadow:'0 4px 12px rgba(124,58,237,0.4)', display:'flex', alignItems:'center'}}>
          <span>+</span> Nueva Promoción
        </button>
      </div>

      {/* CARDS DE OFERTAS ACTIVAS */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'14px', marginBottom:'28px'}}>
        {ofertas.slice(0,4).map((o, i) => (
          <div key={o.id} style={{background:'linear-gradient(135deg,#0e0e1a,#13131f)', border:`1px solid ${estadoColor[o.estado] || '#1f2035'}33`, borderRadius:'16px', padding:'20px', position:'relative', overflow:'hidden', animation:`fadeIn 0.3s ease ${i*0.05}s both`}}>
            <div style={{position:'absolute', top:'-20px', right:'-20px', fontSize:'60px', opacity:0.05}}>🎁</div>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'12px'}}>
              <span style={{background:(estadoColor[o.estado]||'#6b7280')+'20', color:estadoColor[o.estado]||'#6b7280', padding:'3px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:'700'}}>
                ● {o.estado}
              </span>
              <div style={{fontSize:'28px', fontWeight:'900', color:'white', lineHeight:1}}>{o.descuento}%</div>
            </div>
            <div style={{color:'white', fontWeight:'700', fontSize:'13px', marginBottom:'4px', lineHeight:1.3}}>{o.nombre}</div>
            {o.codigo && <div style={{color:'#7c3aed', fontSize:'11px', fontWeight:'600', background:'rgba(124,58,237,0.1)', padding:'3px 8px', borderRadius:'4px', display:'inline-block', marginBottom:'10px'}}>Código: {o.codigo}</div>}
            <div style={{display:'flex', gap:'6px'}}>
              <button onClick={() => abrirEditar(o)} style={{flex:1, background:'rgba(124,58,237,0.15)', border:'1px solid rgba(124,58,237,0.3)', color:'#a78bfa', borderRadius:'6px', padding:'6px', cursor:'pointer', fontSize:'11px', fontWeight:'600', transition:'all 0.15s'}}
                onMouseOver={e => e.currentTarget.style.background='#7c3aed'}
                onMouseOut={e => e.currentTarget.style.background='rgba(124,58,237,0.15)'}>
                ✏️ Editar
              </button>
              <button onClick={() => eliminar(o)} style={{background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.25)', color:'#ef4444', borderRadius:'6px', padding:'6px 8px', cursor:'pointer', fontSize:'11px', transition:'all 0.15s'}}
                onMouseOver={e => e.currentTarget.style.background='#ef4444'}
                onMouseOut={e => e.currentTarget.style.background='rgba(239,68,68,0.12)'}>
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* TABLA */}
      <div style={{background:'#0e0e1a', border:'1px solid #1f2035', borderRadius:'16px', overflow:'hidden'}}>
        <div style={{padding:'16px 20px', borderBottom:'1px solid #1f2035', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <h3 style={{margin:0, fontSize:'15px', fontWeight:'700'}}>Todas las promociones</h3>
          <span style={{color:'#6b7280', fontSize:'13px'}}>{ofertas.length} promociones</span>
        </div>
        <table style={{width:'100%', borderCollapse:'collapse'}}>
          <thead>
            <tr style={{background:'#13131f'}}>
              {['Promoción','Descuento','Código','Fecha inicio','Fecha fin','Estado','Acciones'].map(h => (
                <th key={h} style={{padding:'12px 16px', textAlign:'left', color:'#6b7280', fontSize:'11px', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.05em', borderBottom:'1px solid #1f2035', whiteSpace:'nowrap'}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ofertas.map((o, i) => (
              <tr key={o.id} style={{borderBottom:'1px solid #1f203530', transition:'background 0.15s', animation:`fadeIn 0.2s ease ${i*0.03}s both`}}
                onMouseOver={e => e.currentTarget.style.background='#1a1a2e'}
                onMouseOut={e => e.currentTarget.style.background='transparent'}>
                <td style={{padding:'14px 16px'}}>
                  <div style={{color:'white', fontWeight:'600', fontSize:'13px', marginBottom:'2px'}}>{o.nombre}</div>
                  <div style={{color:'#6b7280', fontSize:'11px'}}>Producto #{o.producto_id}</div>
                </td>
                <td style={{padding:'14px 16px'}}>
                  <span style={{background:'rgba(124,58,237,0.15)', color:'#a78bfa', padding:'5px 12px', borderRadius:'20px', fontSize:'14px', fontWeight:'800'}}>{o.descuento}%</span>
                </td>
                <td style={{padding:'14px 16px'}}>
                  {o.codigo ? <span style={{background:'#1a1a2e', border:'1px solid #2d2d4e', color:'#e5e7eb', padding:'4px 10px', borderRadius:'6px', fontSize:'12px', fontWeight:'600', fontFamily:'monospace'}}>{o.codigo}</span> : <span style={{color:'#374151'}}>—</span>}
                </td>
                <td style={{padding:'14px 16px', color:'#9ca3af', fontSize:'12px'}}>{o.fecha_inicio?.split('T')[0] || '—'}</td>
                <td style={{padding:'14px 16px', color:'#9ca3af', fontSize:'12px'}}>{o.fecha_fin?.split('T')[0] || '—'}</td>
                <td style={{padding:'14px 16px'}}>
                  <span style={{background:(estadoColor[o.estado]||'#6b7280')+'18', color:estadoColor[o.estado]||'#6b7280', padding:'4px 12px', borderRadius:'20px', fontSize:'11px', fontWeight:'700'}}>● {o.estado || 'Activo'}</span>
                </td>
                <td style={{padding:'14px 16px'}}>
                  <div style={{display:'flex', gap:'6px'}}>
                    <button onClick={() => abrirEditar(o)} style={{background:'rgba(124,58,237,0.15)', border:'1px solid rgba(124,58,237,0.3)', color:'#a78bfa', borderRadius:'7px', padding:'6px 12px', cursor:'pointer', fontSize:'12px', fontWeight:'600', transition:'all 0.15s'}}
                      onMouseOver={e => { e.currentTarget.style.background='#7c3aed'; e.currentTarget.style.color='white'; }}
                      onMouseOut={e => { e.currentTarget.style.background='rgba(124,58,237,0.15)'; e.currentTarget.style.color='#a78bfa'; }}>
                      ✏️ Editar
                    </button>
                    <button onClick={() => eliminar(o)} style={{background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.25)', color:'#ef4444', borderRadius:'7px', padding:'6px 10px', cursor:'pointer', fontSize:'12px', transition:'all 0.15s'}}
                      onMouseOver={e => { e.currentTarget.style.background='#ef4444'; e.currentTarget.style.color='white'; }}
                      onMouseOut={e => { e.currentTarget.style.background='rgba(239,68,68,0.12)'; e.currentTarget.style.color='#ef4444'; }}>
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {modal && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px', backdropFilter:'blur(8px)'}}
          onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div style={{background:'#0e0e1a', border:'1px solid #2d2d4e', borderRadius:'20px', padding:'32px', width:'100%', maxWidth:'480px', animation:'slideIn 0.2s ease', boxShadow:'0 24px 60px rgba(0,0,0,0.5)'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px'}}>
              <h2 style={{margin:0, fontSize:'19px', fontWeight:'800'}}>{editId ? '✏️ Editar Promoción' : '🎁 Nueva Promoción'}</h2>
              <button onClick={() => setModal(false)} style={{background:'#1a1a2e', border:'1px solid #2d2d4e', color:'#9ca3af', borderRadius:'8px', width:'34px', height:'34px', cursor:'pointer', fontSize:'16px', display:'flex', alignItems:'center', justifyContent:'center'}}>✕</button>
            </div>
            <div style={{display:'grid', gap:'14px'}}>
              <div>
                <label style={{color:'#9ca3af', fontSize:'12px', fontWeight:'600', display:'block', marginBottom:'7px', textTransform:'uppercase', letterSpacing:'0.04em'}}>Nombre de la promoción *</label>
                <input value={form.nombre} onChange={e => setForm({...form, nombre:e.target.value})} placeholder="Ej: 20% OFF en frenos" className="pg-input" />
              </div>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px'}}>
                <div>
                  <label style={{color:'#9ca3af', fontSize:'12px', fontWeight:'600', display:'block', marginBottom:'7px', textTransform:'uppercase', letterSpacing:'0.04em'}}>Descuento % *</label>
                  <input type="number" value={form.descuento} onChange={e => setForm({...form, descuento:e.target.value})} placeholder="10" className="pg-input" />
                </div>
                <div>
                  <label style={{color:'#9ca3af', fontSize:'12px', fontWeight:'600', display:'block', marginBottom:'7px', textTransform:'uppercase', letterSpacing:'0.04em'}}>Código</label>
                  <input value={form.codigo} onChange={e => setForm({...form, codigo:e.target.value.toUpperCase()})} placeholder="PROMO10" className="pg-input" />
                </div>
              </div>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px'}}>
                <div>
                  <label style={{color:'#9ca3af', fontSize:'12px', fontWeight:'600', display:'block', marginBottom:'7px', textTransform:'uppercase', letterSpacing:'0.04em'}}>Fecha inicio</label>
                  <input type="date" value={form.fecha_inicio} onChange={e => setForm({...form, fecha_inicio:e.target.value})} className="pg-input" style={{colorScheme:'dark'}} />
                </div>
                <div>
                  <label style={{color:'#9ca3af', fontSize:'12px', fontWeight:'600', display:'block', marginBottom:'7px', textTransform:'uppercase', letterSpacing:'0.04em'}}>Fecha fin</label>
                  <input type="date" value={form.fecha_fin} onChange={e => setForm({...form, fecha_fin:e.target.value})} className="pg-input" style={{colorScheme:'dark'}} />
                </div>
              </div>
            </div>
            <div style={{display:'flex', gap:'10px', marginTop:'24px'}}>
              <button onClick={() => setModal(false)} className="pg-btn-outline" style={{flex:1, padding:'12px'}}>Cancelar</button>
              <button onClick={guardar} disabled={loading} className="pg-btn" style={{flex:2, padding:'12px', boxShadow:'0 4px 12px rgba(124,58,237,0.4)'}}>
                {loading ? '⏳ Guardando...' : editId ? '✅ Actualizar' : '🎁 Crear Promoción'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
