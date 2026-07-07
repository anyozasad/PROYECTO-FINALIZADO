import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { obtenerCatalogo } from '../utils/catalogoStore';
import { obtenerCategoriasAdmin } from '../utils/categoriasStore';
import { abrirDetalleProducto } from '../utils/productoDetalleStore';
import { agregarAlCarrito, normalizarProducto } from '../utils/shopCore';

const money = (n) => Number(n || 0).toFixed(2);

function productoPublico(p) {
  const n = normalizarProducto(p);
  return {
    ...n,
    precio_regular: Number(n.precio_regular || n.precio || 0),
    precio_oferta: Number(n.precio_oferta || 0),
    en_oferta: !!n.en_oferta,
    es_nuevo: !!n.es_nuevo,
  };
}

export default function PubProductos(){
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const categoriaUrl = params.get('categoria') || '';
  const buscarUrl = params.get('buscar') || '';
  const [categoria,setCategoria] = useState(categoriaUrl);
  const [buscar,setBuscar] = useState(buscarUrl);
  const [productos,setProductos] = useState(() => obtenerCatalogo().filter(p => !p.eliminado).map(productoPublico));

  useEffect(() => {
    const sync = () => setProductos(obtenerCatalogo().filter(p => !p.eliminado).map(productoPublico));
    sync();
    window.addEventListener('partgo_catalogo_changed', sync);
    window.addEventListener('partgo_categorias_changed', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('partgo_catalogo_changed', sync);
      window.removeEventListener('partgo_categorias_changed', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  useEffect(() => {
    const p = new URLSearchParams(location.search);
    setCategoria(p.get('categoria') || '');
    setBuscar(p.get('buscar') || '');
  }, [location.search]);

  const categorias = useMemo(() => {
    const admin = obtenerCategoriasAdmin().map(c => c.nombre).filter(Boolean);
    const delCatalogo = productos.map(p => p.categoria).filter(Boolean);
    return ['Todas', ...Array.from(new Set([...admin, ...delCatalogo])).sort((a,b)=>a.localeCompare(b,'es'))];
  }, [productos]);

  const lista = useMemo(() => productos.filter(p => {
    const okCat = !categoria || String(p.categoria).toLowerCase() === categoria.toLowerCase();
    const q = buscar.trim().toLowerCase();
    const okQ = !q || `${p.nombre} ${p.categoria} ${p.marca || ''}`.toLowerCase().includes(q);
    return okCat && okQ;
  }), [productos,categoria,buscar]);

  const verCategoria = (cat) => {
    if (!cat || cat === 'Todas') navigate('/s/productos');
    else navigate(`/s/productos?categoria=${encodeURIComponent(cat)}`);
  };

  const add = (p,e) => {
    e?.stopPropagation?.();
    agregarAlCarrito(p, 1);
    Swal.fire({icon:'success',title:'Agregado al carrito',text:p.nombre,timer:950,showConfirmButton:false,background:'var(--pg-surface)',color:'var(--pg-text)'});
  };

  return (
    <div className="pub-productos-page" style={{display:'flex',minHeight:'100%',fontFamily:"'Inter',sans-serif",color:'var(--pg-text)',background:'var(--pg-bg)'}}>
      <style>{`
        .pub-product-card img{transition:transform .25s ease}.pub-product-card:hover img{transform:scale(1.06)}
        .pub-product-add{transition:transform .15s ease, filter .15s ease}.pub-product-add:hover{transform:translateY(-2px);filter:brightness(1.08)}.pub-product-add:active{transform:scale(.94)}
        @media(max-width:1180px){.pub-product-grid{grid-template-columns:repeat(3,1fr)!important}.pub-product-sidebar{width:190px!important}}
        @media(max-width:820px){.pub-productos-page{display:block!important}.pub-product-sidebar{width:auto!important;border-right:0!important;border-bottom:1px solid var(--pg-border)!important;padding:12px!important;position:sticky!important;top:120px!important;z-index:20!important}.pub-product-filter-list{display:flex!important;gap:8px!important;overflow-x:auto!important;padding-bottom:4px!important}.pub-product-filter-list button{min-width:max-content!important}.pub-product-main{padding:16px 12px!important}.pub-product-grid{grid-template-columns:repeat(2,1fr)!important;gap:12px!important}.pub-product-img{height:126px!important}.pub-product-head{flex-direction:column!important;align-items:flex-start!important}.pub-product-head button{width:100%!important}}
        @media(max-width:460px){.pub-product-grid{grid-template-columns:1fr!important}.pub-product-sidebar{top:132px!important}.pub-product-main h1{font-size:20px!important}}
      `}</style>
      <aside className="pub-product-sidebar" style={{width:'220px',background:'var(--pg-surface)',borderRight:'1px solid var(--pg-border)',padding:'22px 14px',flexShrink:0}}>
        <h3 style={{margin:'0 0 16px',fontSize:'14px',fontWeight:'800',color:'var(--pg-muted2)',textTransform:'uppercase',letterSpacing:'.06em'}}>Filtrar por</h3>
        <div style={{marginBottom:'14px',background:'var(--pg-card)',border:'1px solid var(--pg-border)',borderRadius:'8px',padding:'8px 12px',display:'flex',gap:'8px',alignItems:'center'}}>
          <span style={{color:'var(--pg-muted)',fontSize:'13px'}}>🔍</span>
          <input value={buscar} onChange={e=>setBuscar(e.target.value)} onKeyDown={e=>{if(e.key==='Enter') navigate(`/s/productos?buscar=${encodeURIComponent(buscar.trim())}`)}} placeholder="Buscar..." style={{background:'transparent',border:'none',color:'var(--pg-text)',outline:'none',fontSize:'12px',width:'100%',fontFamily:"'Inter',sans-serif"}}/>
        </div>
        <p style={{fontSize:'11px',fontWeight:'800',color:'var(--pg-muted)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:'8px'}}>Categorías</p>
        <div className="pub-product-filter-list">
          {categorias.map(cat => {
            const active = (!categoria && cat==='Todas') || categoria === cat;
            return <button key={cat} onClick={()=>verCategoria(cat)} style={{width:'100%',display:'flex',alignItems:'center',gap:'8px',padding:'8px 10px',borderRadius:'7px',cursor:'pointer',marginBottom:'2px',background:active?'var(--pg-soft)':'transparent',border:`1px solid ${active?'rgba(124,58,237,.42)':'transparent'}`,fontFamily:"'Inter',sans-serif",textAlign:'left',transition:'all .15s'}}>
              <span style={{width:'8px',height:'8px',borderRadius:'50%',background:active?'#7c3aed':'var(--pg-border2)',flexShrink:0}}/>
              <span style={{fontSize:'12px',color:active?'#8b5cf6':'var(--pg-muted2)',fontWeight:active?'800':'500'}}>{cat}</span>
            </button>
          })}
        </div>
      </aside>

      <main className="pub-product-main" style={{flex:1,padding:'26px'}}>
        <div className="pub-product-head" style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'22px',gap:'16px'}}>
          <div>
            <h1 style={{margin:'0 0 4px',fontSize:'22px',fontWeight:'900'}}>{categoria ? `Productos de ${categoria}` : 'Todos los productos'}</h1>
            <p style={{margin:0,color:'var(--pg-muted)',fontSize:'13px'}}>Mostrando {lista.length} repuestos disponibles, incluyendo nuevos y ofertas del admin.</p>
          </div>
          {(categoria || buscar) && <button onClick={()=>navigate('/s/productos')} style={{background:'transparent',border:'1px solid var(--pg-border2)',borderRadius:'9px',padding:'9px 14px',color:'#8b5cf6',fontWeight:'800',cursor:'pointer',fontFamily:"'Inter',sans-serif"}}>Limpiar filtros</button>}
        </div>

        {lista.length === 0 ? (
          <div style={{background:'var(--pg-card)',border:'1px solid var(--pg-border)',borderRadius:'14px',padding:'50px',textAlign:'center',color:'var(--pg-muted)'}}>No encontré productos con ese filtro.</div>
        ) : (
          <div className="pub-product-grid" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'16px'}}>
            {lista.map(p => {
              const tieneOferta = !!p.en_oferta && Number(p.precio_oferta) > 0 && Number(p.precio_oferta) < Number(p.precio_regular || p.precio);
              const precioActual = tieneOferta ? Number(p.precio_oferta) : Number(p.precio);
              return (
              <article className="pub-product-card" key={p.id} onClick={()=>abrirDetalleProducto(navigate, p)} style={{background:'var(--pg-card)',border:'1px solid var(--pg-border)',borderRadius:'14px',overflow:'hidden',cursor:'pointer',transition:'transform .22s,border-color .2s,box-shadow .2s',boxShadow:'var(--pg-shadow)',position:'relative'}}
                onMouseOver={e=>{e.currentTarget.style.transform='translateY(-5px)';e.currentTarget.style.borderColor='#7c3aed';}}
                onMouseOut={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.borderColor='var(--pg-border)';}}>
                <div className="pub-product-img" style={{background:'var(--pg-card2)',height:'160px',display:'flex',alignItems:'center',justifyContent:'center',position:'relative',overflow:'hidden'}}>
                  <img src={p.imagen || p.img} alt={p.nombre} style={{maxHeight:'145px',maxWidth:'90%',objectFit:'contain'}} onError={e=>e.currentTarget.style.display='none'}/>
                  <span style={{position:'absolute',top:'8px',left:'8px',background:'rgba(124,58,237,.14)',color:'#8b5cf6',border:'1px solid rgba(124,58,237,.25)',borderRadius:'999px',padding:'3px 8px',fontSize:'10px',fontWeight:'900'}}>{p.categoria}</span>
                  <div style={{position:'absolute',top:'8px',right:'8px',display:'flex',gap:'4px',flexDirection:'column',alignItems:'flex-end'}}>
                    {tieneOferta && <span style={{background:'#ef4444',color:'white',borderRadius:'6px',padding:'3px 7px',fontSize:'10px',fontWeight:'900'}}>OFERTA</span>}
                    {p.es_nuevo && <span style={{background:'#3b82f6',color:'white',borderRadius:'6px',padding:'3px 7px',fontSize:'10px',fontWeight:'900'}}>NUEVO</span>}
                  </div>
                </div>
                <div style={{padding:'13px 14px'}}>
                  <h3 style={{margin:'0 0 7px',fontSize:'13px',fontWeight:'900',height:'34px',lineHeight:1.3,overflow:'hidden',color:'var(--pg-text)'}}>{p.nombre}</h3>
                  <p style={{margin:'0 0 10px',color:'var(--pg-muted)',fontSize:'11px'}}>Stock: {p.stock} unidades</p>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'10px'}}>
                    <div style={{display:'grid',gap:'2px'}}>
                      <strong style={{color:'#8b5cf6',fontSize:'17px'}}>S/ {money(precioActual)}</strong>
                      {tieneOferta && <span style={{fontSize:'10px',textDecoration:'line-through',color:'var(--pg-muted)'}}>S/ {money(p.precio_regular)}</span>}
                    </div>
                    <button className="pub-product-add" onClick={(e)=>add(p,e)} style={{background:'linear-gradient(135deg,#7c3aed,#9333ea)',border:'none',borderRadius:'8px',width:'34px',height:'34px',color:'white',cursor:'pointer',fontSize:'14px'}}>🛒</button>
                  </div>
                </div>
              </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
