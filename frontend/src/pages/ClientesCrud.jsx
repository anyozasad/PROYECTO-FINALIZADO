import { useState, useEffect } from 'react';
import { apiFetch } from '../services/api';
import Swal from 'sweetalert2';

const DEMO = [
  { id:1, nombre:'Juan Pérez', email:'juanperez@gmail.com', telefono:'987 654 321', dni:'12345678', ordenes:18, total:2390.50 },
  { id:2, nombre:'María Gómez', email:'mariagomez@gmail.com', telefono:'986 123 456', dni:'87654321', ordenes:12, total:1450.00 },
  { id:3, nombre:'Carlos Ruiz', email:'carlosruiz@gmail.com', telefono:'955 077 788', dni:'11223344', ordenes:6, total:890.00 },
  { id:4, nombre:'Ana Torres', email:'anatorres@gmail.com', telefono:'944 444 222', dni:'44332211', ordenes:4, total:640.00 },
  { id:5, nombre:'Pedro Silva', email:'pedrosilva@gmail.com', telefono:'933 333 111', dni:'55667788', ordenes:9, total:1200.00 },
  { id:6, nombre:'Luis Ramírez', email:'luisramirez@gmail.com', telefono:'922 222 333', dni:'99887766', ordenes:3, total:320.00 },
];

function leerClientesRegistrados() {
  try {
    const raw = JSON.parse(localStorage.getItem('partgo_clientes_registrados') || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function normalizarClienteLocal(c = {}) {
  return {
    id: c.id || c.email || Date.now(),
    nombre: c.nombre || c.name || 'Cliente PartGo',
    email: c.email || c.correo || '',
    telefono: c.telefono || c.phone || '',
    dni: c.dni || c.documento || c.ruc || '—',
    foto: c.foto || c.picture || '',
    ordenes: Number(c.ordenes || 0),
    total: Number(c.total || 0),
    proveedor: c.proveedor || 'Registro',
    ultimo_acceso: c.ultimo_acceso || ''
  };
}

function mezclarClientes(base = [], locales = []) {
  const map = new Map();
  [...locales.map(normalizarClienteLocal), ...base.map(normalizarClienteLocal)].forEach(c => {
    const key = String(c.email || c.id).toLowerCase();
    if (!map.has(key)) map.set(key, c);
  });
  return Array.from(map.values());
}


export default function ClientesCrud() {
  const [clientes, setClientes] = useState(() => mezclarClientes(DEMO, leerClientesRegistrados()));
  const [busqueda, setBusqueda] = useState('');
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [form, setForm] = useState({ nombre:'', email:'', telefono:'', dni:'' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const syncLocales = () => setClientes(prev => mezclarClientes(prev.length ? prev : DEMO, leerClientesRegistrados()));

    apiFetch('/clientes').then(d => {
      const lista = Array.isArray(d) ? d : (d.clientes || []);
      if (lista.length > 0) setClientes(mezclarClientes(lista, leerClientesRegistrados()));
      else syncLocales();
    }).catch(() => syncLocales());

    window.addEventListener('storage', syncLocales);
    window.addEventListener('partgo_clientes_changed', syncLocales);
    return () => {
      window.removeEventListener('storage', syncLocales);
      window.removeEventListener('partgo_clientes_changed', syncLocales);
    };
  }, []);

  const filtrados = clientes.filter(c => 
    c.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.email?.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.dni?.includes(busqueda)
  );

  const abrirCrear = () => { setForm({ nombre:'', email:'', telefono:'', dni:'' }); setEditId(null); setModal(true); };
  const abrirEditar = (c) => { setForm({ nombre:c.nombre||'', email:c.email||'', telefono:c.telefono||'', dni:c.dni||'' }); setEditId(c.id); setModal(true); };

  const guardar = async () => {
    if (!form.nombre) { Swal.fire({ icon:'warning', title:'Nombre requerido', confirmButtonColor:'#7c3aed', background:'var(--card-bg)', color:'var(--text)' }); return; }
    setLoading(true);
    try {
      if (editId) {
        await apiFetch(`/clientes/${editId}`, { method:'PUT', body:JSON.stringify(form) });
        setClientes(prev => prev.map(c => c.id === editId ? {...c, ...form} : c));
      } else {
        setClientes(prev => [...prev, {...form, id:Date.now(), ordenes:0, total:0}]);
      }
      Swal.fire({ icon:'success', title: editId ? 'Actualizado' : 'Cliente creado', timer:1500, showConfirmButton:false, background:'var(--card-bg)', color:'var(--text)' });
      setModal(false);
    } catch {
      setClientes(prev => editId ? prev.map(c => c.id === editId ? {...c, ...form} : c) : [...prev, {...form, id:Date.now(), ordenes:0, total:0}]);
      setModal(false);
      Swal.fire({ icon:'success', title: editId ? 'Actualizado' : 'Cliente creado', timer:1500, showConfirmButton:false, background:'var(--card-bg)', color:'var(--text)' });
    } finally { setLoading(false); }
  };

  const eliminar = async (c) => {
    const r = await Swal.fire({ title:`¿Eliminar a "${c.nombre}"?`, icon:'warning', showCancelButton:true, confirmButtonText:'Eliminar', confirmButtonColor:'#ef4444', background:'var(--card-bg)', color:'var(--text)' });
    if (!r.isConfirmed) return;
    try { await apiFetch(`/clientes/${c.id}`, { method:'DELETE' }); } catch {}
    setClientes(prev => prev.filter(x => x.id !== c.id));
  };

  const initials = (nombre) => nombre?.split(' ').slice(0,2).map(n=>n[0]).join('').toUpperCase() || '?';
  const colors = ['#7c3aed','#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6'];
  const colorFor = (i) => colors[i % colors.length];

  return (
    <div style={{fontFamily:'Inter,sans-serif', color:'var(--text)', animation:'fadeIn 0.3s ease'}}>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}} @keyframes slideIn{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}} .cl-row:hover{background:var(--input-bg)!important;} .cl-row:hover .cl-actions{opacity:1!important;}`}</style>

      {/* HEADER */}
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'24px'}}>
        <div>
          <h1 style={{fontSize:'24px', fontWeight:'800', margin:'0 0 4px', letterSpacing:'-0.3px'}}>Clientes</h1>
          <p style={{color:'#6b7280', fontSize:'14px', margin:0}}>Gestiona los clientes registrados en tu tienda.</p>
        </div>
        <button onClick={abrirCrear} style={{background:'#7c3aed', color:'var(--text)', border:'none', borderRadius:'8px', padding:'10px 18px', fontSize:'13px', fontWeight:'600', cursor:'pointer', display:'flex', alignItems:'center', gap:'6px', boxShadow:'0 4px 12px rgba(124,58,237,0.4)', transition:'all 0.15s'}}>
          + Nuevo Cliente
        </button>
      </div>

      {/* STATS */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'12px', marginBottom:'20px'}}>
        {[
          { label:'Total clientes', value:clientes.length, icon:'👥', color:'#7c3aed' },
          { label:'Clientes activos', value:clientes.filter(c=>c.ordenes>0).length, icon:'✅', color:'#10b981' },
          { label:'Total pedidos', value:clientes.reduce((a,c)=>a+(c.ordenes||0),0), icon:'📋', color:'#3b82f6' },
          { label:'Ingresos totales', value:`S/ ${clientes.reduce((a,c)=>a+(c.total||0),0).toLocaleString()}`, icon:'💰', color:'#f59e0b' },
        ].map(s => (
          <div key={s.label} style={{background:'var(--card-bg)', border:'1px solid var(--border)', borderRadius:'12px', padding:'16px', display:'flex', alignItems:'center', gap:'12px'}}>
            <div style={{width:'40px', height:'40px', borderRadius:'10px', background:s.color+'18', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', flexShrink:0}}>{s.icon}</div>
            <div><div style={{fontSize:'20px', fontWeight:'800', color:'var(--text)'}}>{s.value}</div><div style={{fontSize:'11px', color:'#6b7280', marginTop:'1px'}}>{s.label}</div></div>
          </div>
        ))}
      </div>

      {/* BÚSQUEDA */}
      <div style={{display:'flex', alignItems:'center', background:'var(--card-bg)', border:'1px solid var(--border)', borderRadius:'10px', padding:'10px 16px', gap:'10px', marginBottom:'16px', transition:'border 0.15s'}}
        onFocusCapture={e => e.currentTarget.style.borderColor='#7c3aed'}
        onBlurCapture={e => e.currentTarget.style.borderColor='#1f2035'}>
        <span style={{color:'#6b7280'}}>🔍</span>
        <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar por nombre, correo o DNI..." style={{background:'transparent', border:'none', color:'var(--text)', outline:'none', fontSize:'14px', flex:1}} />
        {busqueda && <button onClick={() => setBusqueda('')} style={{background:'none', border:'none', color:'#6b7280', cursor:'pointer'}}>✕</button>}
      </div>

      {/* TABLA */}
      <div style={{background:'var(--card-bg)', border:'1px solid var(--border)', borderRadius:'14px', overflow:'hidden'}}>
        <table style={{width:'100%', borderCollapse:'collapse'}}>
          <thead>
            <tr style={{background:'var(--bg3)', borderBottom:'1px solid #1f2035'}}>
              {['DNI','Cliente','Correo','Teléfono','Órdenes','Acciones'].map(h => (
                <th key={h} style={{padding:'12px 16px', textAlign:'left', color:'#6b7280', fontSize:'11px', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.05em', whiteSpace:'nowrap'}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtrados.map((c, i) => (
              <tr key={c.id} className="cl-row" style={{borderBottom:'1px solid #1f203530', transition:'background 0.15s', animation:`fadeIn 0.2s ease ${i*0.03}s both`}}>
                <td style={{padding:'13px 16px', color:'#9ca3af', fontSize:'13px', fontWeight:'600'}}>{c.dni || '—'}</td>
                <td style={{padding:'13px 16px'}}>
                  <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                    <div style={{width:'36px', height:'36px', borderRadius:'50%', background:colorFor(i), display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text)', fontSize:'12px', fontWeight:'700', flexShrink:0}}>
                      {initials(c.nombre)}
                    </div>
                    <div>
                      <div style={{color:'var(--text)', fontWeight:'600', fontSize:'13px'}}>{c.nombre}</div>
                      <div style={{color:'#6b7280', fontSize:'11px'}}>{c.ordenes || 0} órdenes</div>
                    </div>
                  </div>
                </td>
                <td style={{padding:'13px 16px', color:'#9ca3af', fontSize:'13px'}}>{c.email}</td>
                <td style={{padding:'13px 16px', color:'#9ca3af', fontSize:'13px'}}>{c.telefono}</td>
                <td style={{padding:'13px 16px'}}>
                  <span style={{background:'rgba(124,58,237,0.12)', color:'#a78bfa', padding:'4px 12px', borderRadius:'20px', fontSize:'12px', fontWeight:'600'}}>{c.ordenes || 0}</span>
                </td>
                <td style={{padding:'13px 16px'}}>
                  <div className="cl-actions" style={{display:'flex', gap:'6px', opacity:1, transition:'opacity 0.2s'}}>
                    <button onClick={() => setDetalle(c)} style={{background:'rgba(59,130,246,0.15)', border:'1px solid rgba(59,130,246,0.3)', color:'#3b82f6', borderRadius:'7px', padding:'6px 10px', cursor:'pointer', fontSize:'12px', fontWeight:'600', transition:'all 0.15s'}}
                      onMouseOver={e => { e.currentTarget.style.background='#3b82f6'; e.currentTarget.style.color='white'; }}
                      onMouseOut={e => { e.currentTarget.style.background='rgba(59,130,246,0.15)'; e.currentTarget.style.color='#3b82f6'; }}>
                      👁️ Ver
                    </button>
                    <button onClick={() => abrirEditar(c)} style={{background:'rgba(124,58,237,0.15)', border:'1px solid rgba(124,58,237,0.3)', color:'#a78bfa', borderRadius:'7px', padding:'6px 10px', cursor:'pointer', fontSize:'12px', fontWeight:'600', transition:'all 0.15s'}}
                      onMouseOver={e => { e.currentTarget.style.background='#7c3aed'; e.currentTarget.style.color='white'; }}
                      onMouseOut={e => { e.currentTarget.style.background='rgba(124,58,237,0.15)'; e.currentTarget.style.color='#a78bfa'; }}>
                      ✏️
                    </button>
                    <button onClick={() => eliminar(c)} style={{background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.25)', color:'#ef4444', borderRadius:'7px', padding:'6px 8px', cursor:'pointer', fontSize:'12px', transition:'all 0.15s'}}
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

      {/* MODAL CREAR/EDITAR */}
      {modal && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px', backdropFilter:'blur(8px)'}}
          onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div style={{background:'var(--card-bg)', border:'1px solid var(--border2)', borderRadius:'18px', padding:'28px', width:'100%', maxWidth:'460px', animation:'slideIn 0.2s ease', boxShadow:'0 24px 60px rgba(0,0,0,0.5)'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px'}}>
              <h2 style={{margin:0, fontSize:'18px', fontWeight:'800'}}>{editId ? '✏️ Editar Cliente' : '👤 Nuevo Cliente'}</h2>
              <button onClick={() => setModal(false)} style={{background:'var(--input-bg)', border:'1px solid var(--border2)', color:'#9ca3af', borderRadius:'8px', width:'34px', height:'34px', cursor:'pointer', fontSize:'16px', display:'flex', alignItems:'center', justifyContent:'center'}}>✕</button>
            </div>
            <div style={{display:'grid', gap:'14px'}}>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px'}}>
                <div><label style={{color:'#9ca3af', fontSize:'12px', fontWeight:'600', display:'block', marginBottom:'7px', textTransform:'uppercase', letterSpacing:'0.04em'}}>Nombre completo *</label><input value={form.nombre} onChange={e => setForm({...form, nombre:e.target.value})} placeholder="Juan Pérez" style={{background:'var(--input-bg)', border:'1px solid var(--border)', borderRadius:'8px', padding:'10px 14px', color:'var(--text)', fontSize:'13px', width:'100%', outline:'none', boxSizing:'border-box'}} /></div>
                <div><label style={{color:'#9ca3af', fontSize:'12px', fontWeight:'600', display:'block', marginBottom:'7px', textTransform:'uppercase', letterSpacing:'0.04em'}}>DNI</label><input value={form.dni} onChange={e => setForm({...form, dni:e.target.value})} placeholder="12345678" style={{background:'var(--input-bg)', border:'1px solid var(--border)', borderRadius:'8px', padding:'10px 14px', color:'var(--text)', fontSize:'13px', width:'100%', outline:'none', boxSizing:'border-box'}} /></div>
              </div>
              <div><label style={{color:'#9ca3af', fontSize:'12px', fontWeight:'600', display:'block', marginBottom:'7px', textTransform:'uppercase', letterSpacing:'0.04em'}}>Correo electrónico</label><input value={form.email} onChange={e => setForm({...form, email:e.target.value})} placeholder="cliente@correo.com" style={{background:'var(--input-bg)', border:'1px solid var(--border)', borderRadius:'8px', padding:'10px 14px', color:'var(--text)', fontSize:'13px', width:'100%', outline:'none', boxSizing:'border-box'}} /></div>
              <div><label style={{color:'#9ca3af', fontSize:'12px', fontWeight:'600', display:'block', marginBottom:'7px', textTransform:'uppercase', letterSpacing:'0.04em'}}>Teléfono</label><input value={form.telefono} onChange={e => setForm({...form, telefono:e.target.value})} placeholder="987 654 321" style={{background:'var(--input-bg)', border:'1px solid var(--border)', borderRadius:'8px', padding:'10px 14px', color:'var(--text)', fontSize:'13px', width:'100%', outline:'none', boxSizing:'border-box'}} /></div>
            </div>
            <div style={{display:'flex', gap:'10px', marginTop:'22px'}}>
              <button onClick={() => setModal(false)} style={{flex:1, padding:'11px', background:'transparent', border:'1px solid var(--border)', color:'#9ca3af', borderRadius:'8px', cursor:'pointer', fontSize:'13px', fontWeight:'500'}}>Cancelar</button>
              <button onClick={guardar} disabled={loading} style={{flex:2, padding:'11px', background:'#7c3aed', border:'none', color:'var(--text)', borderRadius:'8px', cursor:'pointer', fontSize:'13px', fontWeight:'600', boxShadow:'0 4px 12px rgba(124,58,237,0.4)'}}>
                {loading ? '⏳ Guardando...' : editId ? '✅ Actualizar' : '👤 Crear Cliente'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETALLE */}
      {detalle && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px', backdropFilter:'blur(8px)'}}
          onClick={e => e.target === e.currentTarget && setDetalle(null)}>
          <div style={{background:'var(--card-bg)', border:'1px solid var(--border2)', borderRadius:'18px', padding:'28px', width:'100%', maxWidth:'380px', animation:'slideIn 0.2s ease'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
              <h2 style={{margin:0, fontSize:'16px', fontWeight:'800'}}>Detalle del cliente</h2>
              <button onClick={() => setDetalle(null)} style={{background:'var(--input-bg)', border:'1px solid var(--border2)', color:'#9ca3af', borderRadius:'8px', width:'30px', height:'30px', cursor:'pointer', fontSize:'14px', display:'flex', alignItems:'center', justifyContent:'center'}}>✕</button>
            </div>
            <div style={{display:'flex', alignItems:'center', gap:'14px', marginBottom:'20px', padding:'16px', background:'var(--bg3)', borderRadius:'12px', border:'1px solid var(--border)'}}>
              <div style={{width:'52px', height:'52px', borderRadius:'50%', background:'#7c3aed', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text)', fontSize:'18px', fontWeight:'700', flexShrink:0}}>{initials(detalle.nombre)}</div>
              <div>
                <div style={{color:'var(--text)', fontWeight:'700', fontSize:'15px'}}>{detalle.nombre}</div>
                <div style={{color:'#6b7280', fontSize:'12px'}}>{detalle.email}</div>
              </div>
            </div>
            {[
              ['DNI', detalle.dni || '—'],
              ['Teléfono', detalle.telefono],
              ['Total compras', detalle.ordenes || 0],
              ['Total gastado', `S/ ${(detalle.total || 0).toLocaleString()}`],
            ].map(([k,v]) => (
              <div key={k} style={{display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid #1f2035'}}>
                <span style={{color:'#6b7280', fontSize:'13px'}}>{k}</span>
                <span style={{color:'var(--text)', fontSize:'13px', fontWeight:'600'}}>{v}</span>
              </div>
            ))}
            <button onClick={() => setDetalle(null)} style={{width:'100%', marginTop:'18px', padding:'11px', background:'#7c3aed', border:'none', color:'var(--text)', borderRadius:'8px', cursor:'pointer', fontSize:'13px', fontWeight:'600'}}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}
