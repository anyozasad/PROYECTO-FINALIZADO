import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { apiFetch } from '../services/api';
import Swal from 'sweetalert2';
import { obtenerCatalogo, guardarProductoAdmin, eliminarProductoAdmin, siguienteIdProducto } from '../utils/catalogoStore';
import { obtenerCategoriasAdmin, resolverCategoriaPorNombre } from '../utils/categoriasStore';

// Función para obtener URL de imagen con fallback
const getImgSrc = (imagen) => {
  if (!imagen) return null;
  if (imagen.startsWith('http')) return imagen;
  return `http://localhost:3000${imagen}`;
};

const ImgProduct = ({ imagen, nombre, size = 52 }) => {
  const [src, setSrc] = useState(getImgSrc(imagen));
  const [error, setError] = useState(false);

  const handleError = () => {
    if (!error) {
      setError(true);
      // Fallback: intentar con ruta directa desde el frontend
      setSrc(imagen); // /IMAGENES/... servido desde frontend public/
    }
  };

  if (!imagen || (error && !src)) return (
    <div style={{width:`${size}px`, height:`${size}px`, background:'var(--input-bg)', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:`${size*0.4}px`, opacity:0.4}}>📦</div>
  );

  return (
    <img src={src} alt={nombre} onError={handleError}
      style={{width:`${size}px`, height:`${size}px`, objectFit:'contain', borderRadius:'6px'}} />
  );
};


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

const normalizarProductoAdmin = (p, categorias = []) => {
  const catPorId = categorias.find(c => String(c.id) === String(p.categoria_id));
  return {
    ...p,
    categoria: p.categoria || p.categoria_nombre || p.nombre_categoria || p.category || catPorId?.nombre || '',
    precio: Number(p.precio || 0),
    precio_oferta: Number(p.precio_oferta || 0),
    stock: Number(p.stock || 0),
    en_oferta: !!Number(p.en_oferta || 0),
    es_nuevo: !!Number(p.es_nuevo || 0),
  };
};

export default function ProductosCrud() {
  const location = useLocation();
  const [categorias, setCategorias] = useState(() => obtenerCategoriasAdmin());
  const [productos, setProductos] = useState(() => obtenerCatalogo().filter(p => !p.eliminado).map(p => normalizarProductoAdmin(p, obtenerCategoriasAdmin())));
  const [busqueda, setBusqueda] = useState(() => new URLSearchParams(location.search).get('categoria') || new URLSearchParams(location.search).get('buscar') || '');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ nombre:'', categoria:'', precio:'', stock:'', imagen:'', en_oferta:false, precio_oferta:'', es_nuevo:false });
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cats = obtenerCategoriasAdmin();
    setCategorias(cats);
    setCargando(true);
    apiFetch('/productos').then(d => {
      const lista = Array.isArray(d) ? d : (d.productos || []);
      if (lista.length > 0) setProductos(lista.map(item => normalizarProductoAdmin(item, cats)));
      else setProductos(obtenerCatalogo().filter(p => !p.eliminado).map(item => normalizarProductoAdmin(item, cats)));
    }).catch(() => {
      setProductos(obtenerCatalogo().filter(p => !p.eliminado).map(item => normalizarProductoAdmin(item, cats)));
    }).finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    const sync = () => {
      const cats = obtenerCategoriasAdmin();
      setCategorias(cats);
      setProductos(obtenerCatalogo().filter(p => !p.eliminado).map(item => normalizarProductoAdmin(item, cats)));
    };
    window.addEventListener('partgo_catalogo_changed', sync);
    window.addEventListener('partgo_categorias_changed', sync);
    return () => {
      window.removeEventListener('partgo_catalogo_changed', sync);
      window.removeEventListener('partgo_categorias_changed', sync);
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('categoria') || params.get('buscar') || '';
    setBusqueda(q);
  }, [location.search]);

  const filtrados = productos.filter(p =>
    p.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.categoria?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const abrirCrear = () => { setForm({ nombre:'', categoria:'', precio:'', stock:'', imagen:'', en_oferta:false, precio_oferta:'', es_nuevo:false }); setEditId(null); setModal(true); };
  const abrirEditar = (p) => { setForm({ nombre:p.nombre||'', categoria:p.categoria||'', precio:p.precio||'', stock:p.stock||'', imagen:p.imagen||'', en_oferta:!!p.en_oferta, precio_oferta:p.precio_oferta||'', es_nuevo:!!p.es_nuevo }); setEditId(p.id); setModal(true); };

  const guardar = async () => {
    if (!form.nombre || !form.precio || !form.categoria) { Swal.fire({ icon:'warning', title:'Nombre, categoría y precio requeridos', confirmButtonColor:'#7c3aed', background:'var(--card-bg)', color:'var(--text)' }); return; }
    setLoading(true);
    const categoriaObj = resolverCategoriaPorNombre(form.categoria);
    const categoriaNombre = categoriaObj?.nombre || form.categoria;
    const datos = {
      nombre: form.nombre,
      categoria: categoriaNombre,
      categoria_id: categoriaObj?.id || null,
      precio: Number(form.precio) || 0,
      stock: Number(form.stock) || 0,
      imagen: form.imagen,
      en_oferta: !!form.en_oferta,
      precio_oferta: form.en_oferta ? (Number(form.precio_oferta) || 0) : 0,
      es_nuevo: !!form.es_nuevo,
    };
    try {
      if (editId) {
        await apiFetch(`/productos/${editId}`, { method:'PUT', body:JSON.stringify(datos) });
        guardarProductoAdmin({ id: editId, ...datos });
        setProductos(obtenerCatalogo().filter(p => !p.eliminado).map(item => normalizarProductoAdmin(item, categorias)));
      } else {
        const n = await apiFetch('/productos', { method:'POST', body:JSON.stringify(datos) });
        const nuevoId = n?.id || siguienteIdProducto();
        guardarProductoAdmin({ id: nuevoId, ...datos });
        setProductos(obtenerCatalogo().filter(p => !p.eliminado).map(item => normalizarProductoAdmin(item, categorias)));
      }
      toastOk(editId ? 'Actualizado' : 'Creado');
      setModal(false);
    } catch {
      const id = editId || siguienteIdProducto();
      guardarProductoAdmin({ id, ...datos });
      setProductos(obtenerCatalogo().filter(p => !p.eliminado).map(item => normalizarProductoAdmin(item, categorias)));
      setModal(false);
      toastOk(editId ? 'Actualizado' : 'Creado');
    } finally { setLoading(false); }
  };

  const eliminar = async (p) => {
    const r = await Swal.fire({ title:`¿Eliminar "${p.nombre}"?`, icon:'warning', showCancelButton:true, confirmButtonText:'Sí, eliminar', cancelButtonText:'Cancelar', confirmButtonColor:'#ef4444', background:'var(--card-bg)', color:'var(--text)' });
    if (!r.isConfirmed) return;
    try { await apiFetch(`/productos/${p.id}`, { method:'DELETE' }); } catch {}
    eliminarProductoAdmin(p.id);
    setProductos(obtenerCatalogo().filter(x => !x.eliminado));
  };

  const stockColor = (s) => s <= 5 ? '#ef4444' : s <= 10 ? '#f59e0b' : '#10b981';

  return (
    <div style={{fontFamily:'Inter,sans-serif', color:'var(--text)', animation:'fadeIn 0.3s ease'}}>
      <style>{`
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideIn{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}
        .pg-row:hover{background:var(--bg4)!important;}
        .pg-row:hover .pg-actions{opacity:1!important;}
        .pg-actions{opacity:1!important;transition:opacity 0.2s;}
      `}</style>

      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'20px'}}>
        <div>
          <h1 style={{fontSize:'24px', fontWeight:'800', margin:'0 0 4px', letterSpacing:'-0.3px'}}>Productos / Repuestos</h1>
          <p style={{color:'#6b7280', fontSize:'14px', margin:0}}>Administra stock, imágenes, ofertas y productos nuevos.</p>
        </div>
        <button onClick={abrirCrear} style={{background:'#7c3aed', color:'var(--text)', border:'none', borderRadius:'8px', padding:'10px 18px', fontSize:'13px', fontWeight:'600', cursor:'pointer', display:'flex', alignItems:'center', gap:'6px', boxShadow:'0 4px 12px rgba(124,58,237,0.4)'}}>
          + Nuevo Producto
        </button>
      </div>

      {/* STATS */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:'12px', marginBottom:'20px'}}>
        {[
          {l:'Total', v:productos.length, i:'📦', c:'#7c3aed'},
          {l:'Stock bajo', v:productos.filter(p=>Number(p.stock)<=10 && Number(p.stock)>0).length, i:'⚠️', c:'#f59e0b'},
          {l:'Agotado', v:productos.filter(p=>Number(p.stock)===0).length, i:'❌', c:'#ef4444'},
          {l:'Activos', v:productos.filter(p=>Number(p.stock)>0).length, i:'✅', c:'#10b981'},
          {l:'En oferta', v:productos.filter(p=>!!p.en_oferta).length, i:'🏷️', c:'#ef4444'},
          {l:'Nuevos', v:productos.filter(p=>!!p.es_nuevo).length, i:'✨', c:'#3b82f6'},
        ].map(s => (
          <div key={s.l} style={{background:'var(--card-bg)', border:'1px solid var(--border)', borderRadius:'12px', padding:'14px 16px', display:'flex', alignItems:'center', gap:'12px'}}>
            <div style={{width:'38px', height:'38px', borderRadius:'10px', background:s.c+'18', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', flexShrink:0}}>{s.i}</div>
            <div><div style={{fontSize:'20px', fontWeight:'800', color:'var(--text)'}}>{s.v}</div><div style={{fontSize:'11px', color:'#6b7280', marginTop:'1px'}}>{s.l}</div></div>
          </div>
        ))}
      </div>

      {/* BÚSQUEDA */}
      <div style={{display:'flex', alignItems:'center', background:'var(--card-bg)', border:'1px solid var(--border)', borderRadius:'10px', padding:'10px 16px', gap:'10px', marginBottom:'16px'}}
        onFocusCapture={e => e.currentTarget.style.borderColor='#7c3aed'}
        onBlurCapture={e => e.currentTarget.style.borderColor='#1f2035'}>
        <span style={{color:'#6b7280', fontSize:'16px'}}>🔍</span>
        <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar producto por nombre o categoría..." style={{background:'transparent', border:'none', color:'var(--text)', outline:'none', fontSize:'14px', flex:1}} />
        <span style={{color:'#6b7280', fontSize:'12px', fontWeight:'600', background:'var(--input-bg)', padding:'2px 10px', borderRadius:'20px', whiteSpace:'nowrap'}}>📋 {filtrados.length}</span>
      </div>

      {/* TABLA */}
      <div style={{background:'var(--card-bg)', border:'1px solid var(--border)', borderRadius:'16px', overflow:'hidden'}}>
        <table style={{width:'100%', borderCollapse:'collapse'}}>
          <thead>
            <tr style={{background:'var(--bg3)', borderBottom:'1px solid #1f2035'}}>
              {['Imagen','Código','Producto','Categoría','Precio','Stock','Estado','Acciones'].map(h => (
                <th key={h} style={{padding:'12px 16px', textAlign:'left', color:'#6b7280', fontSize:'11px', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.05em', whiteSpace:'nowrap'}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan={8} style={{textAlign:'center', padding:'60px', color:'#6b7280'}}>
                <div style={{fontSize:'32px', marginBottom:'8px'}}>⏳</div>Cargando productos...
              </td></tr>
            ) : filtrados.length === 0 ? (
              <tr><td colSpan={8} style={{textAlign:'center', padding:'60px', color:'#6b7280'}}>
                <div style={{fontSize:'40px', opacity:0.2, marginBottom:'8px'}}>📦</div>No hay productos
              </td></tr>
            ) : filtrados.map((p, i) => (
              <tr key={p.id} className="pg-row" style={{borderBottom:'1px solid #1f203530', transition:'background 0.15s', animation:`fadeIn 0.2s ease ${i*0.02}s both`}}>
                <td style={{padding:'12px 16px'}}>
                  <div style={{width:'52px', height:'52px', background:'var(--input-bg)', border:'1px solid var(--border2)', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden'}}>
                    <ImgProduct imagen={p.imagen} nombre={p.nombre} size={48} />
                  </div>
                </td>
                <td style={{padding:'12px 16px', color:'#6b7280', fontSize:'12px', fontWeight:'600'}}>PRD{String(p.id).padStart(3,'0')}</td>
                <td style={{padding:'12px 16px'}}>
                  <div style={{color:'var(--text)', fontWeight:'600', fontSize:'13px', maxWidth:'240px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{p.nombre}</div>
                  <div style={{display:'flex', gap:'5px', marginTop:'3px'}}>
                    <span style={{color:'#6b7280', fontSize:'11px'}}>PartGo</span>
                    {!!p.en_oferta && <span style={{background:'#ef444418', color:'#ef4444', padding:'1px 7px', borderRadius:'10px', fontSize:'9px', fontWeight:'800'}}>OFERTA</span>}
                    {!!p.es_nuevo && <span style={{background:'#3b82f618', color:'#3b82f6', padding:'1px 7px', borderRadius:'10px', fontSize:'9px', fontWeight:'800'}}>NUEVO</span>}
                  </div>
                </td>
                <td style={{padding:'12px 16px'}}>
                  <span style={{background:'rgba(124,58,237,0.12)', color:'#a78bfa', padding:'3px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:'600'}}>{p.categoria || 'Sin categoría'}</span>
                </td>
                <td style={{padding:'12px 16px', color:'var(--text)', fontWeight:'700', fontSize:'14px'}}>
                  {!!p.en_oferta && Number(p.precio_oferta) > 0 ? (
                    <div>
                      <div>S/ {Number(p.precio_oferta).toFixed(2)}</div>
                      <div style={{color:'#6b7280', fontSize:'11px', textDecoration:'line-through', fontWeight:'500'}}>S/ {Number(p.precio||0).toFixed(2)}</div>
                    </div>
                  ) : (
                    <>S/ {Number(p.precio||0).toFixed(2)}</>
                  )}
                </td>
                <td style={{padding:'12px 16px'}}>
                  <span style={{background:stockColor(p.stock)+'18', color:stockColor(p.stock), padding:'4px 12px', borderRadius:'20px', fontSize:'12px', fontWeight:'700'}}>{p.stock} un</span>
                </td>
                <td style={{padding:'12px 16px'}}>
                  <span style={{background:Number(p.stock)>0?'#10b98118':'#ef444418', color:Number(p.stock)>0?'#10b981':'#ef4444', padding:'4px 12px', borderRadius:'20px', fontSize:'11px', fontWeight:'700'}}>
                    {Number(p.stock)>0?'● Activo':'● Agotado'}
                  </span>
                </td>
                <td style={{padding:'12px 16px'}}>
                  <div className="pg-actions" style={{display:'flex', gap:'6px'}}>
                    <button onClick={() => abrirEditar(p)} style={{background:'rgba(124,58,237,0.15)', border:'1px solid rgba(124,58,237,0.3)', color:'#a78bfa', borderRadius:'7px', padding:'6px 12px', cursor:'pointer', fontSize:'12px', fontWeight:'600', transition:'all 0.15s'}}
                      onMouseOver={e => { e.currentTarget.style.background='#7c3aed'; e.currentTarget.style.color='white'; }}
                      onMouseOut={e => { e.currentTarget.style.background='rgba(124,58,237,0.15)'; e.currentTarget.style.color='#a78bfa'; }}>
                      ✏️ Editar
                    </button>
                    <button onClick={() => eliminar(p)} style={{background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.25)', color:'#ef4444', borderRadius:'7px', padding:'6px 8px', cursor:'pointer', fontSize:'12px', transition:'all 0.15s'}}
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
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px', backdropFilter:'blur(8px)'}}
          onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div style={{background:'var(--card-bg)', border:'1px solid var(--border2)', borderRadius:'20px', padding:'28px', width:'100%', maxWidth:'500px', animation:'slideIn 0.2s ease', boxShadow:'0 24px 60px rgba(0,0,0,0.5)'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px'}}>
              <div>
                <h2 style={{margin:0, fontSize:'18px', fontWeight:'800'}}>{editId?'✏️ Editar Producto':'➕ Nuevo Producto'}</h2>
                <p style={{margin:'4px 0 0', color:'#6b7280', fontSize:'13px'}}>{editId?'Modifica los datos del producto':'Agrega un nuevo producto al catálogo'}</p>
              </div>
              <button onClick={() => setModal(false)} style={{background:'var(--input-bg)', border:'1px solid var(--border2)', color:'#9ca3af', borderRadius:'8px', width:'34px', height:'34px', cursor:'pointer', fontSize:'16px', display:'flex', alignItems:'center', justifyContent:'center'}}>✕</button>
            </div>

            {/* PREVIEW */}
            {form.imagen && (
              <div style={{background:'var(--input-bg)', border:'1px solid var(--border2)', borderRadius:'10px', padding:'14px', marginBottom:'18px', display:'flex', alignItems:'center', gap:'12px'}}>
                <ImgProduct imagen={form.imagen} nombre={form.nombre} size={56} />
                <div>
                  <div style={{color:'#a78bfa', fontSize:'10px', fontWeight:'600', marginBottom:'2px'}}>VISTA PREVIA</div>
                  <div style={{color:'var(--text)', fontSize:'13px', fontWeight:'600'}}>{form.nombre || 'Sin nombre'}</div>
                </div>
              </div>
            )}

            <div style={{display:'grid', gap:'14px'}}>
              <div>
                <label style={{color:'#9ca3af', fontSize:'12px', fontWeight:'600', display:'block', marginBottom:'7px', textTransform:'uppercase', letterSpacing:'0.04em'}}>Nombre del Producto *</label>
                <input value={form.nombre} onChange={e => setForm({...form, nombre:e.target.value})} placeholder="Ej: ACEITE LUBRICANTE 4T SAE" style={{background:'var(--input-bg)', border:'1px solid var(--border)', borderRadius:'8px', padding:'10px 14px', color:'var(--text)', fontSize:'13px', width:'100%', outline:'none', boxSizing:'border-box', transition:'border 0.15s'}} onFocus={e => e.target.style.borderColor='#7c3aed'} onBlur={e => e.target.style.borderColor='#1f2035'} />
              </div>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px'}}>
                <div>
                  <label style={{color:'#9ca3af', fontSize:'12px', fontWeight:'600', display:'block', marginBottom:'7px', textTransform:'uppercase', letterSpacing:'0.04em'}}>Categoría</label>
                  <select value={form.categoria} onChange={e => setForm({...form, categoria:e.target.value})} style={{background:'var(--input-bg)', border:'1px solid var(--border)', borderRadius:'8px', padding:'10px 14px', color:'var(--text)', fontSize:'13px', width:'100%', outline:'none'}}>
                    <option value="">Seleccionar...</option>
                    {categorias.map(c => <option key={c.id || c.nombre} value={c.nombre}>{c.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{color:'#9ca3af', fontSize:'12px', fontWeight:'600', display:'block', marginBottom:'7px', textTransform:'uppercase', letterSpacing:'0.04em'}}>Precio (S/) *</label>
                  <input type="number" value={form.precio} onChange={e => setForm({...form, precio:e.target.value})} placeholder="0.00" style={{background:'var(--input-bg)', border:'1px solid var(--border)', borderRadius:'8px', padding:'10px 14px', color:'var(--text)', fontSize:'13px', width:'100%', outline:'none', boxSizing:'border-box'}} />
                </div>
              </div>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px'}}>
                <div>
                  <label style={{color:'#9ca3af', fontSize:'12px', fontWeight:'600', display:'block', marginBottom:'7px', textTransform:'uppercase', letterSpacing:'0.04em'}}>Stock</label>
                  <input type="number" value={form.stock} onChange={e => setForm({...form, stock:e.target.value})} placeholder="0" style={{background:'var(--input-bg)', border:'1px solid var(--border)', borderRadius:'8px', padding:'10px 14px', color:'var(--text)', fontSize:'13px', width:'100%', outline:'none', boxSizing:'border-box'}} />
                  {Number(form.stock) === 0 && form.stock !== '' && (
                    <p style={{margin:'6px 0 0', color:'#ef4444', fontSize:'11px', fontWeight:'700'}}>● Se mostrará como Agotado</p>
                  )}
                </div>
                <div>
                  <label style={{color:'#9ca3af', fontSize:'12px', fontWeight:'600', display:'block', marginBottom:'7px', textTransform:'uppercase', letterSpacing:'0.04em'}}>Imagen</label>
                  <input value={form.imagen} onChange={e => setForm({...form, imagen:e.target.value})} placeholder="/IMAGENES/nombre.jpg" style={{background:'var(--input-bg)', border:'1px solid var(--border)', borderRadius:'8px', padding:'10px 14px', color:'var(--text)', fontSize:'12px', width:'100%', outline:'none', boxSizing:'border-box'}} />
                </div>
              </div>

              <div style={{display:'grid', gridTemplateColumns: form.en_oferta ? '1fr 1fr' : '1fr 1fr', gap:'12px', background:'var(--input-bg)', border:'1px solid var(--border)', borderRadius:'10px', padding:'14px'}}>
                <label style={{display:'flex', alignItems:'center', gap:'9px', cursor:'pointer'}}>
                  <input type="checkbox" checked={!!form.en_oferta} onChange={e => setForm({...form, en_oferta:e.target.checked})} style={{width:'17px', height:'17px', accentColor:'#ef4444', cursor:'pointer'}} />
                  <span style={{fontSize:'13px', fontWeight:'700', color:'var(--text)'}}>🏷️ En oferta</span>
                </label>
                <label style={{display:'flex', alignItems:'center', gap:'9px', cursor:'pointer'}}>
                  <input type="checkbox" checked={!!form.es_nuevo} onChange={e => setForm({...form, es_nuevo:e.target.checked})} style={{width:'17px', height:'17px', accentColor:'#3b82f6', cursor:'pointer'}} />
                  <span style={{fontSize:'13px', fontWeight:'700', color:'var(--text)'}}>✨ Es nuevo</span>
                </label>
              </div>

              {form.en_oferta && (
                <div>
                  <label style={{color:'#9ca3af', fontSize:'12px', fontWeight:'600', display:'block', marginBottom:'7px', textTransform:'uppercase', letterSpacing:'0.04em'}}>Precio de oferta (S/)</label>
                  <input type="number" value={form.precio_oferta} onChange={e => setForm({...form, precio_oferta:e.target.value})} placeholder="0.00" style={{background:'var(--input-bg)', border:'1px solid #ef4444', borderRadius:'8px', padding:'10px 14px', color:'var(--text)', fontSize:'13px', width:'100%', outline:'none', boxSizing:'border-box'}} />
                  <p style={{margin:'6px 0 0', color:'#6b7280', fontSize:'11px'}}>Debe ser menor al precio regular para mostrar el descuento en la tienda.</p>
                </div>
              )}
            </div>

            <div style={{display:'flex', gap:'10px', marginTop:'22px'}}>
              <button onClick={() => setModal(false)} style={{flex:1, padding:'12px', background:'transparent', border:'1px solid var(--border)', color:'#9ca3af', borderRadius:'8px', cursor:'pointer', fontSize:'13px'}}>Cancelar</button>
              <button onClick={guardar} disabled={loading} style={{flex:2, padding:'12px', background:'#7c3aed', border:'none', color:'var(--text)', borderRadius:'8px', cursor:'pointer', fontSize:'13px', fontWeight:'700', boxShadow:'0 4px 12px rgba(124,58,237,0.4)'}}>
                {loading ? '⏳ Guardando...' : editId ? '✅ Actualizar' : '➕ Crear Producto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
