import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../services/api';
import Swal from 'sweetalert2';
import { obtenerCategoriasAdmin, guardarCategoriasAdmin, guardarCategoriaAdmin, eliminarCategoriaAdmin, calcularConteosCategorias } from '../utils/categoriasStore';

const CATS_DEMO = [
  { id:1, nombre:'Lubricantes', descripcion:'Aceites y lubricantes para motos', productos:28, icon:'🛢️', color:'#f59e0b' },
  { id:2, nombre:'Frenos', descripcion:'Pastillas, discos y accesorios de freno', productos:45, icon:'🛑', color:'#ef4444' },
  { id:3, nombre:'Llantas', descripcion:'Llantas para diferentes modelos de moto', productos:32, icon:'🛞', color:'#3b82f6' },
  { id:4, nombre:'Baterías', descripcion:'Baterías para motocicletas', productos:18, icon:'🔋', color:'#10b981' },
  { id:5, nombre:'Accesorios', descripcion:'Cascos, guantes y accesorios', productos:22, icon:'⛑️', color:'#8b5cf6' },
  { id:6, nombre:'Transmisión', descripcion:'Cadenas, piñones y coronas', productos:27, icon:'⛓️', color:'#6b7280' },
  { id:7, nombre:'Aceites', descripcion:'Categoría Aceites', productos:14, icon:'🧴', color:'#f97316' },
  { id:8, nombre:'Cadenas', descripcion:'Categoría Cadenas', productos:19, icon:'🔗', color:'#14b8a6' },
  { id:9, nombre:'Luces', descripcion:'Categoría Luces', productos:11, icon:'💡', color:'#eab308' },
  { id:10, nombre:'Motor', descripcion:'Categoría Motor', productos:56, icon:'🔧', color:'#7c3aed' },
  { id:11, nombre:'Suspensión', descripcion:'Categoría Suspensión', productos:38, icon:'⚙️', color:'#64748b' },
];

const ICONS = ['🛢️','🛑','🛞','🔋','⛑️','⛓️','🧴','🔗','💡','🔧','⚙️','⚡','🔩','🏍️','🎯','🔌'];
const COLORS = ['#7c3aed','#ef4444','#3b82f6','#10b981','#f59e0b','#8b5cf6','#f97316','#14b8a6','#eab308','#64748b','#a855f7','#ec4899'];

const toastOk = (title = 'Guardado') => Swal.fire({
  icon:'success',
  title: String(title || '').replace('✅','').trim(),
  timer:1200,
  showConfirmButton:false,
  background:'var(--card-bg)',
  color:'var(--text)',
  confirmButtonColor:'#7c3aed',
  width:'360px',
  customClass:{ popup:'pg-swal-center-clean', title:'pg-swal-title-clean' }
});

export default function CategoriasCrud() {
  const navigate = useNavigate();
  const [cats, setCats] = useState(() => obtenerCategoriasAdmin());
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ nombre:'', descripcion:'', icon:'📦', color:'#7c3aed' });
  const [loading, setLoading] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  const recalcularConteos = (lista) => calcularConteosCategorias(lista);


  useEffect(() => {
    const cargar = () => {
      apiFetch('/categorias').then(d => {
        const lista = Array.isArray(d) ? d : (d.categorias || []);
        if (lista.length > 0) {
          const fusion = guardarCategoriasAdmin([...obtenerCategoriasAdmin(), ...lista.map((c,i) => ({ ...c, icon: c.icon || ICONS[i%ICONS.length], color: c.color || COLORS[i%COLORS.length] }))]);
          setCats(fusion);
        } else {
          setCats(obtenerCategoriasAdmin());
        }
      }).catch(() => setCats(obtenerCategoriasAdmin()));
    };
    const sync = () => setCats(obtenerCategoriasAdmin());
    cargar();
    window.addEventListener('partgo_catalogo_changed', sync);
    window.addEventListener('partgo_categorias_changed', sync);
    return () => {
      window.removeEventListener('partgo_catalogo_changed', sync);
      window.removeEventListener('partgo_categorias_changed', sync);
    };
  }, []);

  const abrirCrear = () => { setForm({ nombre:'', descripcion:'', icon:'📦', color:'#7c3aed' }); setEditId(null); setModal(true); };
  const abrirEditar = (c) => { setForm({ nombre:c.nombre||'', descripcion:c.descripcion||'', icon:c.icon||'📦', color:c.color||'#7c3aed' }); setEditId(c.id); setModal(true); };

  const guardar = async () => {
    if (!form.nombre) { Swal.fire({ icon:'warning', title:'Nombre requerido', confirmButtonColor:'#7c3aed', background:'var(--card-bg)', color:'var(--text)' }); return; }
    setLoading(true);
    const anterior = editId ? cats.find(c => Number(c.id) === Number(editId))?.nombre || '' : '';
    const payloadApi = { nombre: form.nombre, descripcion: form.descripcion || '', estado: 1 };
    try {
      let idFinal = editId;
      if (editId) {
        await apiFetch(`/categorias/${editId}`, { method:'PUT', body:JSON.stringify(payloadApi) });
      } else {
        const nueva = await apiFetch('/categorias', { method:'POST', body:JSON.stringify(payloadApi) }).catch(() => null);
        idFinal = nueva?.id || Date.now();
      }
      const lista = guardarCategoriaAdmin({ ...form, id:idFinal }, anterior);
      setCats(lista);
      toastOk(editId ? 'Categoría actualizada' : 'Categoría creada');
      setModal(false);
    } catch {
      const idFinal = editId || Date.now();
      const lista = guardarCategoriaAdmin({ ...form, id:idFinal }, anterior);
      setCats(lista);
      setModal(false);
      toastOk(editId ? 'Categoría actualizada' : 'Categoría creada');
    } finally { setLoading(false); }
  };

  const eliminar = async (c) => {
    const r = await Swal.fire({ title:`¿Eliminar "${c.nombre}"?`, icon:'warning', showCancelButton:true, confirmButtonText:'Eliminar', confirmButtonColor:'#ef4444', background:'var(--card-bg)', color:'var(--text)' });
    if (!r.isConfirmed) return;
    try { await apiFetch(`/categorias/${c.id}`, { method:'DELETE' }); } catch {}
    setCats(eliminarCategoriaAdmin(c.id));
  };

  const filtradas = cats.filter(c => c.nombre?.toLowerCase().includes(busqueda.toLowerCase()));

  return (
    <div style={{fontFamily:'Inter,sans-serif', color:'var(--text)', animation:'fadeIn 0.3s ease'}}>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}} @keyframes slideIn{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}} .cat-card-hover:hover{transform:translateY(-4px)!important;border-color:#7c3aed!important;box-shadow:0 12px 28px rgba(124,58,237,0.2)!important;}`}</style>

      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'24px'}}>
        <div>
          <h1 style={{fontSize:'24px', fontWeight:'800', margin:'0 0 4px', letterSpacing:'-0.3px'}}>Categorías de repuestos</h1>
          <p style={{color:'#6b7280', fontSize:'14px', margin:0}}>Organiza los productos de tu tienda por categorías.</p>
        </div>
        <button onClick={abrirCrear} style={{background:'#7c3aed', color:'var(--text)', border:'none', borderRadius:'8px', padding:'10px 18px', fontSize:'13px', fontWeight:'600', cursor:'pointer', display:'flex', alignItems:'center', gap:'6px', boxShadow:'0 4px 12px rgba(124,58,237,0.4)'}}>
          + Nueva Categoría
        </button>
      </div>

      {/* BÚSQUEDA */}
      <div style={{display:'flex', alignItems:'center', background:'var(--card-bg)', border:'1px solid var(--border)', borderRadius:'10px', padding:'10px 16px', gap:'10px', marginBottom:'20px'}}>
        <span style={{color:'#6b7280'}}>🔍</span>
        <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar categoría..." style={{background:'transparent', border:'none', color:'var(--text)', outline:'none', fontSize:'14px', flex:1}} />
      </div>

      {/* GRID DE CATEGORÍAS */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'14px', marginBottom:'24px'}}>
        {filtradas.map((cat, i) => (
          <div key={cat.id} className="cat-card-hover" onClick={() => navigate(`/productos?categoria=${encodeURIComponent(cat.nombre || '')}`)} title="Ver productos de esta categoría" style={{background:'var(--card-bg)', border:'1px solid var(--border)', borderRadius:'14px', padding:'20px', cursor:'pointer', transition:'all 0.2s', position:'relative', overflow:'hidden', animation:`fadeIn 0.2s ease ${i*0.04}s both`}}>
            <div style={{position:'absolute', top:'-15px', right:'-15px', fontSize:'60px', opacity:0.06}}>{cat.icon}</div>
            <div style={{width:'48px', height:'48px', borderRadius:'12px', background:(cat.color||'#7c3aed')+'18', border:`1px solid ${cat.color||'#7c3aed'}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', marginBottom:'12px'}}>{cat.icon}</div>
            <div style={{color:'var(--text)', fontWeight:'700', fontSize:'14px', marginBottom:'4px'}}>{cat.nombre}</div>
            <div style={{color:'#6b7280', fontSize:'11px', marginBottom:'12px', lineHeight:1.4}}>{cat.descripcion}</div>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <span style={{background:(cat.color||'#7c3aed')+'18', color:cat.color||'#7c3aed', padding:'3px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:'600'}}>{cat.productos || 0} prods</span>
              <div style={{display:'flex', gap:'4px'}}>
                <button onClick={e => { e.stopPropagation(); abrirEditar(cat); }} style={{background:'rgba(124,58,237,0.15)', border:'none', borderRadius:'6px', width:'28px', height:'28px', cursor:'pointer', fontSize:'12px', display:'flex', alignItems:'center', justifyContent:'center', color:'#a78bfa', transition:'all 0.15s'}}
                  onMouseOver={e => { e.currentTarget.style.background='#7c3aed'; e.currentTarget.style.color='white'; }}
                  onMouseOut={e => { e.currentTarget.style.background='rgba(124,58,237,0.15)'; e.currentTarget.style.color='#a78bfa'; }}>✏️</button>
                <button onClick={e => { e.stopPropagation(); eliminar(cat); }} style={{background:'rgba(239,68,68,0.12)', border:'none', borderRadius:'6px', width:'28px', height:'28px', cursor:'pointer', fontSize:'12px', display:'flex', alignItems:'center', justifyContent:'center', color:'#ef4444', transition:'all 0.15s'}}
                  onMouseOver={e => { e.currentTarget.style.background='#ef4444'; e.currentTarget.style.color='white'; }}
                  onMouseOut={e => { e.currentTarget.style.background='rgba(239,68,68,0.12)'; e.currentTarget.style.color='#ef4444'; }}>🗑️</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL */}
      {modal && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px', backdropFilter:'blur(8px)'}}
          onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div style={{background:'var(--card-bg)', border:'1px solid var(--border2)', borderRadius:'18px', padding:'28px', width:'100%', maxWidth:'440px', animation:'slideIn 0.2s ease', boxShadow:'0 24px 60px rgba(0,0,0,0.5)'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px'}}>
              <h2 style={{margin:0, fontSize:'18px', fontWeight:'800'}}>{editId ? '✏️ Editar Categoría' : '🏷️ Nueva Categoría'}</h2>
              <button onClick={() => setModal(false)} style={{background:'var(--input-bg)', border:'1px solid var(--border2)', color:'#9ca3af', borderRadius:'8px', width:'34px', height:'34px', cursor:'pointer', fontSize:'16px', display:'flex', alignItems:'center', justifyContent:'center'}}>✕</button>
            </div>
            <div style={{display:'grid', gap:'14px'}}>
              <div><label style={{color:'#9ca3af', fontSize:'12px', fontWeight:'600', display:'block', marginBottom:'7px', textTransform:'uppercase', letterSpacing:'0.04em'}}>Nombre *</label><input value={form.nombre} onChange={e => setForm({...form, nombre:e.target.value})} placeholder="Ej: Frenos" style={{background:'var(--input-bg)', border:'1px solid var(--border)', borderRadius:'8px', padding:'10px 14px', color:'var(--text)', fontSize:'14px', width:'100%', outline:'none', boxSizing:'border-box'}} /></div>
              <div><label style={{color:'#9ca3af', fontSize:'12px', fontWeight:'600', display:'block', marginBottom:'7px', textTransform:'uppercase', letterSpacing:'0.04em'}}>Descripción</label><input value={form.descripcion} onChange={e => setForm({...form, descripcion:e.target.value})} placeholder="Ej: Pastillas, discos y más" style={{background:'var(--input-bg)', border:'1px solid var(--border)', borderRadius:'8px', padding:'10px 14px', color:'var(--text)', fontSize:'14px', width:'100%', outline:'none', boxSizing:'border-box'}} /></div>
              <div>
                <label style={{color:'#9ca3af', fontSize:'12px', fontWeight:'600', display:'block', marginBottom:'7px', textTransform:'uppercase', letterSpacing:'0.04em'}}>Ícono</label>
                <div style={{display:'flex', flexWrap:'wrap', gap:'6px'}}>
                  {ICONS.map(ic => (
                    <button key={ic} onClick={() => setForm({...form, icon:ic})} style={{width:'36px', height:'36px', background: form.icon===ic ? '#7c3aed' : '#1a1a2e', border:`1px solid ${form.icon===ic ? '#7c3aed' : '#1f2035'}`, borderRadius:'8px', cursor:'pointer', fontSize:'18px', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s'}}>{ic}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{color:'#9ca3af', fontSize:'12px', fontWeight:'600', display:'block', marginBottom:'7px', textTransform:'uppercase', letterSpacing:'0.04em'}}>Color</label>
                <div style={{display:'flex', flexWrap:'wrap', gap:'6px'}}>
                  {COLORS.map(col => (
                    <button key={col} onClick={() => setForm({...form, color:col})} style={{width:'30px', height:'30px', background:col, borderRadius:'50%', cursor:'pointer', border: form.color===col ? '3px solid white' : '3px solid transparent', transition:'all 0.15s'}} />
                  ))}
                </div>
              </div>
            </div>
            <div style={{display:'flex', gap:'10px', marginTop:'22px'}}>
              <button onClick={() => setModal(false)} style={{flex:1, padding:'11px', background:'transparent', border:'1px solid var(--border)', color:'#9ca3af', borderRadius:'8px', cursor:'pointer', fontSize:'13px'}}>Cancelar</button>
              <button onClick={guardar} disabled={loading} style={{flex:2, padding:'11px', background:'#7c3aed', border:'none', color:'var(--text)', borderRadius:'8px', cursor:'pointer', fontSize:'13px', fontWeight:'600', boxShadow:'0 4px 12px rgba(124,58,237,0.4)'}}>
                {loading ? '⏳...' : editId ? '✅ Actualizar' : '+ Crear Categoría'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
