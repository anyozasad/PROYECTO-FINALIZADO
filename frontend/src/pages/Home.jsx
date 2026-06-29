import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { apiFetch } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { usePreferencias } from '../context/PreferenciasContext';
import Swal from 'sweetalert2';
import { agregarAlCarrito } from '../utils/partgoStorage';
import { obtenerCatalogo } from '../utils/catalogoStore';

/* ══ DATOS ══ */
const CATS = [
  { n:'Frenos',     img:'/IMAGENES/ZAPATA FRENO ROJA.jpg',                 c:45, color:'#ef4444' },
  { n:'Suspensión', img:'/IMAGENES/BARRA TELESCOPICA CARGUERO.jpg',        c:38, color:'#8b5cf6' },
  { n:'Motor',      img:'/IMAGENES/ARRANCADOR DE MOTOR GN125.jpg',         c:56, color:'#f97316' },
  { n:'Eléctricos', img:'/IMAGENES/BOBINA 12V.jpg',                        c:39, color:'#3b82f6' },
  { n:'Lubricantes',img:'/IMAGENES/ACEITE LUBRICANTE 4T25W-50 1LT.jpg',   c:34, color:'#10b981' },
  { n:'Llantas',    img:'/IMAGENES/LLANTA 2.75-17 TT 8PR.jpg',            c:24, color:'#f59e0b' },
];

const PRODS_DEMO = [
  { id:1, nombre:'Bujía Iridium CR8EIX',    marca:'NGK',    precio:28.00,  imagen:'/IMAGENES/CAPUCHON DE BUJIA.jpg',                oferta:false, rating:4, rev:77  },
  { id:2, nombre:'Aro con Llanta 5.00-12',  marca:'PartGo', precio:150.00, imagen:'/IMAGENES/ARO CON LLANTA 5.00-12 (4H).jpg',     oferta:true,  rating:5, rev:84  },
  { id:3, nombre:'Alternador 4P CG 125',    marca:'PartGo', precio:120.00, imagen:'/IMAGENES/ALTERNADOR 4P CGL.jpg',                oferta:false, rating:4, rev:89  },
  { id:4, nombre:'Faro delantero redondo',  marca:'PartGo', precio:65.00,  imagen:'/IMAGENES/FARO DELANTERO REDONDO.jpg',          oferta:true,  rating:5, rev:92  },
  { id:5, nombre:'Cadena 428-114L',         marca:'DID',    precio:45.00,  imagen:'/IMAGENES/CADENA 428-114L.jpg',                  oferta:false, rating:4, rev:63  },
  { id:6, nombre:'Aceite 4T 25W-50 1L',    marca:'Motul',  precio:32.00,  imagen:'/IMAGENES/ACEITE LUBRICANTE 4T25W-50 1LT.jpg',  oferta:false, rating:5, rev:51  },
  { id:7, nombre:'Zapata freno roja',       marca:'EBC',    precio:38.00,  imagen:'/IMAGENES/ZAPATA FRENO ROJA.jpg',               oferta:true,  rating:4, rev:44  },
  { id:8, nombre:'Barra telescópica',       marca:'YSS',    precio:220.00, imagen:'/IMAGENES/BARRA TELESCOPICA CARGUERO.jpg',       oferta:false, rating:5, rev:38  },
];

/* Catálogo completo (productos base + creados por el admin) usado cuando el backend no responde,
   para que "Ver todos / Explorar repuestos / Mostrando todos" muestren todo el catálogo real,
   y para reflejar en vivo lo que el admin marque como oferta, nuevo o agotado. */
function construirCatalogoCompleto() {
  return obtenerCatalogo().filter(p => !p.eliminado).map((p) => ({
    id: p.id,
    nombre: p.nombre,
    marca: p.marca || 'PartGo',
    categoria: p.categoria,
    precio: Number(p.precio || 0),
    precioOferta: Number(p.precio_oferta || 0),
    imagen: p.imagen,
    oferta: !!p.en_oferta && Number(p.precio_oferta) > 0,
    esNuevo: !!p.es_nuevo,
    stock: Number(p.stock || 0),
    rating: 4 + (p.id % 2 === 0 ? 1 : 0),
    rev: 30 + (p.id * 3) % 70,
  }));
}

const PEDIDOS_DEMO = [
  { id:'PG001245', fecha:'10/06/2024', total:'S/ 150.90', estado:'Entregado',  c:'#10b981' },
  { id:'PG001243', fecha:'05/06/2024', total:'S/ 89.50',  estado:'En camino',  c:'#3b82f6' },
  { id:'PG001241', fecha:'02/06/2024', total:'S/ 120.00', estado:'Preparando', c:'#f59e0b' },
];

const SLIDES = [
  { titulo:'Frenos de alto rendimiento', sub:'Máxima seguridad para tu moto', img:'/IMAGENES/banner/banner-frenos.png', color:'#ef4444', aspect:1305/787 },
  { titulo:'Suspensiones premium YSS',   sub:'Comodidad y control total',     img:'/IMAGENES/banner/banner-suspension.png', color:'#8b5cf6', aspect:525/350 },
  { titulo:'Aceites Motul 4T',           sub:'Protege y prolonga tu motor',    img:'/IMAGENES/banner/banner-aceites.png', color:'#10b981', aspect:599/350 },
  { titulo:'Llantas y aros',             sub:'Agarre garantizado siempre',     img:'/IMAGENES/banner/banner-llantas.png', color:'#f59e0b', aspect:450/207 },
];

const imgUrl = img => img?.startsWith('http') ? img : `http://localhost:3000${img}`;

export default function Home() {
  const { usuario } = useAuth();
  const { formatPrecio } = usePreferencias();
  const navigate = useNavigate();
  const location = useLocation();

  const irAProductos = () => {
    setMostrarTodos(true);
    setTimeout(() => {
      const seccion = document.getElementById('productos-destacados');
      if (seccion) seccion.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };
  const [prods, setProds]       = useState([]);
  const [slide, setSlide]       = useState(0);
  const [liked, setLiked]       = useState(() => {
    try {
      const favs = JSON.parse(localStorage.getItem('partgo_favoritos') || '[]');
      return favs.reduce((acc, p) => ({ ...acc, [p.id]: true }), {});
    } catch {
      return {};
    }
  });
  const [loading, setLoading]   = useState(true);
  const [mostrarTodos, setMostrarTodos] = useState(false);

  const [usandoCatalogoLocal, setUsandoCatalogoLocal] = useState(true);

  useEffect(() => {
    apiFetch('/productos')
      .then(d => {
        const lista = Array.isArray(d) ? d : (d?.productos || []);
        if (lista.length > 0) {
          setProds(lista);
          setUsandoCatalogoLocal(false);
        } else {
          setProds(construirCatalogoCompleto());
        }
      })
      .catch(() => setProds(construirCatalogoCompleto()))
      .finally(() => setLoading(false));

    const t = setInterval(() => setSlide(s => (s + 1) % SLIDES.length), 4500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (usandoCatalogoLocal) {
      const sync = () => setProds(construirCatalogoCompleto());
      window.addEventListener('partgo_catalogo_changed', sync);
      return () => window.removeEventListener('partgo_catalogo_changed', sync);
    }
  }, [usandoCatalogoLocal]);

  const queryBusqueda = new URLSearchParams(location.search).get('buscar') || '';

  useEffect(() => {
    if (queryBusqueda) irAProductos();
  }, [queryBusqueda]);

  const agregarCarrito = (p, e) => {
    e.stopPropagation();
    if (Number(p.stock ?? 1) === 0) return;
    const tieneOferta = p.oferta && Number(p.precioOferta) > 0 && Number(p.precioOferta) < Number(p.precio);
    agregarAlCarrito({
      id: p.id,
      nombre: p.nombre,
      marca: p.marca || 'PartGo',
      categoria: p.categoria || p.categoria_nombre || 'Repuestos',
      precio: tieneOferta ? p.precioOferta : p.precio,
      img: p.imagen || p.img,
      imagen: p.imagen || p.img,
      stock: p.stock ?? 10,
    }, 1);
    Swal.fire({icon:'success',title:'Agregado al carrito',text:p.nombre,timer:1200,showConfirmButton:false,background:'var(--pg-surface)',color:'var(--pg-text)'});
  };

  const toggleFavorito = (p, e) => {
    e.stopPropagation();
    const id = p.id;
    const item = {
      id,
      n: p.nombre,
      nombre: p.nombre,
      p: Number(p.precio || 0),
      precio: Number(p.precio || 0),
      img: p.imagen || p.img,
      imagen: p.imagen || p.img,
      marca: p.marca || 'PartGo',
      categoria: p.categoria || p.categoria_nombre || 'Repuestos',
    };

    let favs = [];
    try { favs = JSON.parse(localStorage.getItem('partgo_favoritos') || '[]'); } catch {}

    const existe = favs.some(x => Number(x.id) === Number(id));
    favs = existe ? favs.filter(x => Number(x.id) !== Number(id)) : [item, ...favs];

    localStorage.setItem('partgo_favoritos', JSON.stringify(favs));
    window.dispatchEvent(new Event('partgo_favoritos_changed'));
    setLiked(l => ({ ...l, [id]: !existe }));

    Swal.fire({
      icon: existe ? 'info' : 'success',
      title: existe ? 'Quitado de favoritos' : 'Agregado a favoritos',
      text: p.nombre,
      timer: 950,
      showConfirmButton: false,
      background: 'var(--bg2)',
      color: 'var(--text)'
    });
  };

  const baseProds = prods.length > 0 ? prods : construirCatalogoCompleto();
  const listaProds = queryBusqueda
    ? baseProds.filter(p => `${p.nombre || ''} ${p.marca || ''} ${p.categoria || p.categoria_nombre || ''}`.toLowerCase().includes(queryBusqueda.toLowerCase()))
    : baseProds;
  const productosVisibles = mostrarTodos ? listaProds : listaProds.slice(0, 8);
  const sl = SLIDES[slide];

  return (
    <div style={{ margin:'-24px', paddingBottom:'120px', fontFamily:"'Inter',sans-serif", color:'var(--text)', minHeight:'100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        @keyframes fadeUp   { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:none} }
        @keyframes slideIn  { from{opacity:0;transform:scale(.96)}       to{opacity:1;transform:none} }
        @keyframes popIn    { from{opacity:0;transform:scale(.8)}         to{opacity:1;transform:none} }
        @keyframes floatY   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes pulse    { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }

        .h-cat { animation:fadeUp .5s ease both }
        .h-cat:nth-child(1){animation-delay:.05s} .h-cat:nth-child(2){animation-delay:.1s}
        .h-cat:nth-child(3){animation-delay:.15s} .h-cat:nth-child(4){animation-delay:.2s}
        .h-cat:nth-child(5){animation-delay:.25s} .h-cat:nth-child(6){animation-delay:.3s}

        .h-prod { animation:fadeUp .5s ease both }
        .h-prod:nth-child(1){animation-delay:.08s} .h-prod:nth-child(2){animation-delay:.14s}
        .h-prod:nth-child(3){animation-delay:.20s} .h-prod:nth-child(4){animation-delay:.26s}
        .h-prod:nth-child(5){animation-delay:.32s} .h-prod:nth-child(6){animation-delay:.38s}
        .h-prod:nth-child(7){animation-delay:.44s} .h-prod:nth-child(8){animation-delay:.50s}

        /* Tarjeta categoría */
        .cat-card {
          background:var(--bg3); border:1px solid var(--border); border-radius:16px;
          overflow:hidden; cursor:pointer; text-decoration:none; display:block; color:var(--text);
          transition:transform .25s cubic-bezier(.34,1.56,.64,1), border-color .2s, box-shadow .2s;
        }
        .cat-card:hover {
          transform:translateY(-7px);
          border-color:#7c3aed;
          box-shadow:0 16px 36px rgba(124,58,237,.22);
        }
        .cat-img { transition:transform .35s ease }
        .cat-card:hover .cat-img { transform:scale(1.07) }

        /* Tarjeta producto */
        .prod-card {
          background:var(--bg3); border:1px solid var(--border); border-radius:14px;
          overflow:hidden; cursor:pointer;
          transition:transform .25s cubic-bezier(.34,1.56,.64,1), border-color .2s, box-shadow .2s;
          display:flex; flex-direction:column;
        }
        .prod-card:hover {
          transform:translateY(-6px);
          border-color:#7c3aed;
          box-shadow:0 14px 32px rgba(124,58,237,.2);
        }
        .prod-card:hover .prod-img-wrap { background:rgba(124,58,237,.06) !important }
        .prod-card:hover .prod-add-btn  { background:#6d28d9 !important; transform:scale(1.08) }

        /* Botón agregar */
        .prod-add-btn {
          width:36px; height:36px; background:#7c3aed; border:none; border-radius:9px;
          color:white; cursor:pointer; font-size:16px; display:flex; align-items:center;
          justify-content:center; transition:background .15s, transform .15s; flex-shrink:0;
          box-shadow:0 2px 8px rgba(124,58,237,.4);
        }

        /* Like btn */
        .like-btn {
          width:30px; height:30px; background:rgba(0,0,0,.45); border:none; border-radius:50%;
          cursor:pointer; font-size:13px; display:flex; align-items:center; justify-content:center;
          transition:all .18s;
        }
        .like-btn:hover { background:rgba(239,68,68,.4); transform:scale(1.12) }

        /* Slider dot */
        .sl-dot { height:6px; border:none; border-radius:3px; cursor:pointer; transition:all .3s; padding:0 }

        /* Beneficio */
        .benefit-card {
          background:var(--bg3); border:1px solid var(--border); border-radius:12px;
          padding:16px; display:flex; align-items:center; gap:12px;
          transition:border-color .2s, transform .2s;
        }
        .benefit-card:hover { border-color:#7c3aed; transform:translateY(-2px) }

        /* Pedido row */
        .ped-row {
          display:flex; align-items:center; gap:10px; padding:10px 12px;
          background:var(--bg4); border-radius:10px; margin-bottom:8px;
          cursor:pointer; border:1px solid transparent;
          transition:border-color .18s, transform .18s;
        }
        .ped-row:hover { border-color:#7c3aed; transform:translateX(3px) }

        /* Skeleton */
        .skel { background:linear-gradient(90deg,var(--bg4) 25%,var(--bg3) 50%,var(--bg4) 75%); background-size:400% 100%; animation:shimmer 1.4s ease infinite; border-radius:8px }
        @keyframes shimmer { 0%{background-position:100% 0} 100%{background-position:-100% 0} }
      `}</style>

      {/* ══ HERO SLIDER ══ */}
      <div key={slide} style={{
        position:'relative', overflow:'hidden', padding:'34px 36px 34px',
        borderBottom:'1px solid var(--border)', minHeight:'380px',
        display:'flex', alignItems:'center',
        animation:'slideIn .45s ease',
      }}>
        {/* Foto de fondo completa */}
        <img src={sl.img} alt="" style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover'}}
          onError={e=>e.target.style.display='none'}/>
        {/* Capa oscura para que el texto se lea bien */}
        <div style={{position:'absolute',inset:0,background:'linear-gradient(90deg, rgba(8,8,15,.96) 0%, rgba(8,8,15,.88) 30%, rgba(8,8,15,.55) 55%, rgba(8,8,15,.22) 78%, rgba(8,8,15,.4) 100%)'}}/>
        <div style={{position:'absolute',inset:0,background:'linear-gradient(180deg, rgba(8,8,15,.25) 0%, transparent 25%, transparent 75%, rgba(8,8,15,.35) 100%)'}}/>
        {/* Glow decorativo */}
        <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at 15% 50%,rgba(124,58,237,.35) 0%,transparent 55%)',pointerEvents:'none'}}/>

        {/* TEXTO */}
        <div style={{position:'relative',zIndex:1,flex:'0 1 520px',maxWidth:'560px',animation:'fadeUp .6s ease'}}>
          <span style={{
            display:'inline-flex',alignItems:'center',gap:'6px',marginBottom:'18px',
            background:'rgba(124,58,237,.25)',border:'1px solid rgba(124,58,237,.45)',
            borderRadius:'20px',padding:'5px 14px',fontSize:'11px',fontWeight:'700',
            color:'#c4b5fd',textTransform:'uppercase',letterSpacing:'.07em',
            backdropFilter:'blur(6px)',
          }}>🛡️ Calidad Garantizada</span>

          <h1 style={{fontSize:'34px',fontWeight:'900',lineHeight:'1.08',marginBottom:'12px',letterSpacing:'-0.8px',color:'white',textShadow:'0 4px 24px rgba(0,0,0,.45)'}}>
            {sl.titulo}<br/>
            <span style={{background:'linear-gradient(135deg,#c4b5fd,#a78bfa,#7c3aed)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>
              {sl.sub}
            </span>
          </h1>

          <div style={{display:'flex',gap:'14px',marginBottom:'24px',flexWrap:'wrap'}}>
            {['🛡️ 100% Originales','🏷️ Garantía asegurada','🚚 Envíos rápidos'].map(f=>(
              <span key={f} style={{color:'#e9e4ff',fontSize:'13px',fontWeight:'600',textShadow:'0 2px 8px rgba(0,0,0,.5)'}}>{f}</span>
            ))}
          </div>

          <div style={{display:'flex',gap:'12px',flexWrap:'wrap'}}>
            <button onClick={irAProductos} style={{
              display:'inline-flex',alignItems:'center',gap:'8px',
              background:'#7c3aed',color:'white',padding:'12px 26px',borderRadius:'10px',
              fontSize:'14px',fontWeight:'700',border:'none',cursor:'pointer',
              boxShadow:'0 4px 18px rgba(124,58,237,.5)',fontFamily:"'Inter',sans-serif",
              transition:'all .18s',
            }}
              onMouseOver={e=>{e.currentTarget.style.background='#6d28d9';e.currentTarget.style.transform='translateY(-2px)';}}
              onMouseOut={e=>{e.currentTarget.style.background='#7c3aed';e.currentTarget.style.transform='none';}}>
              Explorar repuestos →
            </button>
            <button onClick={()=>navigate('/favoritos')} style={{
              display:'inline-flex',alignItems:'center',gap:'8px',
              background:'rgba(255,255,255,.12)',color:'white',padding:'12px 20px',borderRadius:'10px',
              fontSize:'14px',fontWeight:'600',border:'1px solid rgba(255,255,255,.25)',
              cursor:'pointer',fontFamily:"'Inter',sans-serif",transition:'all .18s',
              backdropFilter:'blur(6px)',
            }}
              onMouseOver={e=>e.currentTarget.style.background='rgba(255,255,255,.2)'}
              onMouseOut={e=>e.currentTarget.style.background='rgba(255,255,255,.12)'}>
              ❤️ Mis favoritos
            </button>
          </div>
        </div>

        {/* Dots */}
        <div style={{position:'absolute',bottom:'14px',left:'50%',transform:'translateX(-50%)',zIndex:1,display:'flex',gap:'6px'}}>
          {SLIDES.map((_,i)=>(
            <button key={i} className="sl-dot" onClick={()=>setSlide(i)}
              style={{width:slide===i?'24px':'6px',background:slide===i?'#7c3aed':'rgba(255,255,255,.4)'}}/>
          ))}
        </div>
      </div>

      {/* ══ BENEFICIOS ══ */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'12px',padding:'14px 24px',borderBottom:'1px solid var(--border)',background:'var(--bg2)'}}>
        {[
          {icon:'🚚',c:'#7c3aed',t:'Envíos rápidos',    d:'A todo el país en 24-72h'},
          {icon:'🔄',c:'#3b82f6',t:'Devoluciones fáciles',d:'Hasta 30 días'},
          {icon:'🎧',c:'#10b981',t:'Soporte 24/7',       d:'Siempre estamos aquí'},
          {icon:'🔒',c:'#f59e0b',t:'Pagos seguros',      d:'Protegemos tu compra'},
        ].map(b=>(
          <div key={b.t} className="benefit-card">
            <div style={{width:'40px',height:'40px',background:b.c+'22',borderRadius:'11px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'19px',flexShrink:0}}>{b.icon}</div>
            <div>
              <p style={{margin:'0 0 2px',fontSize:'13px',fontWeight:'700',color:'var(--text)'}}>{b.t}</p>
              <p style={{margin:0,fontSize:'11px',color:'var(--muted)'}}>{b.d}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ══ CONTENIDO PRINCIPAL ══ */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 288px',gap:0}}>

        {/* COLUMNA IZQUIERDA */}
        <div style={{padding:'24px 24px'}}>

          {/* CATEGORÍAS */}
          <div style={{marginBottom:'32px'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'18px'}}>
              <h2 style={{margin:0,fontSize:'19px',fontWeight:'800',letterSpacing:'-0.3px'}}>Categorías populares</h2>
              <Link to="/s/categorias" style={{color:'#a78bfa',fontSize:'13px',fontWeight:'600',textDecoration:'none',display:'flex',alignItems:'center',gap:'4px',transition:'color .15s'}}
                onMouseOver={e=>e.currentTarget.style.color='#7c3aed'}
                onMouseOut={e=>e.currentTarget.style.color='#a78bfa'}>
                Ver todas →
              </Link>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:'14px'}}>
              {CATS.map((cat,i)=>(
                <Link key={cat.n} to={`/s/categorias?categoria=${encodeURIComponent(cat.n)}`} className="cat-card h-cat">
                  {/* Área imagen - fondo claro para destacar */}
                  <div style={{height:'120px',background:'#f5f5fc',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden'}}>
                    <img src={cat.img} alt={cat.n} className="cat-img" style={{maxHeight:'108px',maxWidth:'88%',objectFit:'contain'}}
                      onError={e=>e.target.style.display='none'}/>
                  </div>
                  {/* Texto */}
                  <div style={{padding:'10px 12px',background:'var(--bg3)'}}>
                    <p style={{margin:'0 0 4px',fontSize:'13px',fontWeight:'700',color:'var(--text)'}}>{cat.n}</p>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <p style={{margin:0,fontSize:'11px',color:'var(--muted)'}}>{cat.c} productos</p>
                      <span style={{color:'#7c3aed',fontSize:'14px',fontWeight:'700'}}>→</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* PRODUCTOS DESTACADOS */}
          <div id="productos-destacados">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'18px'}}>
              <h2 style={{margin:0,fontSize:'19px',fontWeight:'800',letterSpacing:'-0.3px'}}>Productos destacados</h2>
              <button onClick={irAProductos} style={{background:'none',border:'none',color:'#a78bfa',fontSize:'13px',fontWeight:'600',cursor:'pointer',fontFamily:"'Inter',sans-serif",transition:'color .15s'}}
                onMouseOver={e=>e.target.style.color='#7c3aed'}
                onMouseOut={e=>e.target.style.color='#a78bfa'}>
                {mostrarTodos ? 'Mostrando todos' : 'Ver todos →'}
              </button>
            </div>

            {loading ? (
              /* Skeleton */
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'14px'}}>
                {Array(4).fill(0).map((_,i)=>(
                  <div key={i} style={{background:'var(--bg3)',borderRadius:'14px',overflow:'hidden',border:'1px solid var(--border)'}}>
                    <div className="skel" style={{height:'160px'}}/>
                    <div style={{padding:'14px',display:'flex',flexDirection:'column',gap:'8px'}}>
                      <div className="skel" style={{height:'10px',width:'60%'}}/>
                      <div className="skel" style={{height:'14px'}}/>
                      <div className="skel" style={{height:'10px',width:'80%'}}/>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'14px'}}>
                {productosVisibles.map((p,i)=>{
                  const agotado = Number(p.stock ?? 1) === 0;
                  const tieneOferta = p.oferta && Number(p.precioOferta) > 0 && Number(p.precioOferta) < Number(p.precio);
                  const precioMostrar = tieneOferta ? p.precioOferta : p.precio;
                  const descuentoPct = tieneOferta ? Math.round((1 - p.precioOferta / p.precio) * 100) : 0;
                  return (
                  <div key={p.id||i} className="prod-card h-prod" onClick={()=>navigate(`/producto/${p.id}`)} style={{opacity:agotado?.65:1}}>
                    {/* Imagen */}
                    <div className="prod-img-wrap" style={{background:'#f5f5fc',height:'158px',display:'flex',alignItems:'center',justifyContent:'center',position:'relative',overflow:'hidden',transition:'background .2s'}}>
                      <img src={imgUrl(p.imagen||'')} alt={p.nombre}
                        style={{maxHeight:'142px',maxWidth:'88%',objectFit:'contain',filter:agotado?'grayscale(.4)':'none'}}
                        onError={e=>{e.target.style.display='none';}}/>
                      {/* Badges */}
                      <div style={{position:'absolute',top:'8px',left:'8px',display:'flex',flexDirection:'column',gap:'4px',alignItems:'flex-start'}}>
                        {tieneOferta&&<span style={{background:'#ef4444',color:'white',fontSize:'9px',fontWeight:'800',padding:'2px 6px',borderRadius:'4px',letterSpacing:'.03em'}}>-{descuentoPct}%</span>}
                        {p.esNuevo&&<span style={{background:'#3b82f6',color:'white',fontSize:'9px',fontWeight:'800',padding:'2px 6px',borderRadius:'4px',letterSpacing:'.03em'}}>NUEVO</span>}
                      </div>
                      {agotado&&<span style={{position:'absolute',bottom:'8px',left:'8px',background:'rgba(0,0,0,.72)',color:'white',fontSize:'10px',fontWeight:'800',padding:'3px 9px',borderRadius:'5px',letterSpacing:'.03em'}}>AGOTADO</span>}
                      <button className="like-btn" onClick={e=>toggleFavorito(p,e)}
                        style={{position:'absolute',top:'8px',right:'8px'}}>
                        {liked[p.id||i]?'❤️':'🤍'}
                      </button>
                    </div>
                    {/* Info */}
                    <div style={{padding:'12px',flex:1,display:'flex',flexDirection:'column',gap:'4px'}}>
                      <p style={{margin:0,fontSize:'10px',color:'var(--muted)',fontWeight:'700',textTransform:'uppercase',letterSpacing:'.05em'}}>{p.marca||'PartGo'}</p>
                      <p style={{margin:0,fontSize:'12px',fontWeight:'700',lineHeight:1.3,color:'var(--text)',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{p.nombre}</p>
                      <div style={{display:'flex',gap:'1px',alignItems:'center'}}>
                        {Array(5).fill(0).map((_,j)=>(
                          <span key={j} style={{color:j<(p.rating||4)?'#fbbf24':'var(--bg5)',fontSize:'11px'}}>★</span>
                        ))}
                        <span style={{color:'var(--muted)',fontSize:'10px',marginLeft:'3px'}}>({p.rev||48})</span>
                      </div>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:'auto',paddingTop:'6px'}}>
                        <div style={{display:'flex',flexDirection:'column'}}>
                          <span style={{color:'#a78bfa',fontSize:'17px',fontWeight:'800',letterSpacing:'-0.3px'}}>{formatPrecio(precioMostrar)}</span>
                          {tieneOferta&&<span style={{color:'var(--muted)',fontSize:'11px',textDecoration:'line-through'}}>{formatPrecio(p.precio)}</span>}
                        </div>
                        <button className="prod-add-btn" onClick={e=>agregarCarrito(p,e)} disabled={agotado} title={agotado?'Agotado':'Agregar al carrito'} style={agotado?{background:'var(--bg5)',cursor:'not-allowed',boxShadow:'none'}:undefined}>🛒</button>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ══ COLUMNA DERECHA ══ */}
        <div style={{background:'var(--bg2)',borderLeft:'1px solid var(--border)',padding:'20px 16px',display:'flex',flexDirection:'column',gap:'14px',position:'sticky',top:'58px',maxHeight:'calc(100dvh - 150px)',overflowY:'auto',paddingBottom:'90px'}}>

          {/* Saludo personalizado */}
          <div style={{background:'linear-gradient(135deg,#4c1d95,#7c3aed)',borderRadius:'12px',padding:'14px 16px',display:'flex',alignItems:'center',gap:'12px'}}>
            <div style={{width:'38px',height:'38px',borderRadius:'50%',background:'rgba(255,255,255,.2)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:'800',fontSize:'16px',flexShrink:0}}>
              {usuario?.nombre?.[0]?.toUpperCase()||'C'}
            </div>
            <div>
              <p style={{margin:'0 0 2px',fontSize:'13px',fontWeight:'700',color:'white'}}>Hola, {usuario?.nombre?.split(' ')[0]||'Cliente'} 👋</p>
              <p style={{margin:0,fontSize:'11px',color:'rgba(255,255,255,.7)'}}>Bienvenido a PartGo</p>
            </div>
          </div>

          {/* Mis pedidos */}
          <div style={{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:'12px',overflow:'hidden'}}>
            <div style={{padding:'12px 14px',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <h3 style={{margin:0,fontSize:'14px',fontWeight:'700'}}>📋 Mis pedidos</h3>
              <Link to="/mis-pedidos" style={{color:'#a78bfa',fontSize:'11px',fontWeight:'600',textDecoration:'none'}}>Ver todos →</Link>
            </div>
            <div style={{padding:'10px 12px'}}>
              {PEDIDOS_DEMO.map((p,i)=>(
                <div key={i} className="ped-row" onClick={()=>navigate('/mis-pedidos')}>
                  <div style={{width:'30px',height:'30px',background:'rgba(124,58,237,.12)',borderRadius:'7px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'14px',flexShrink:0}}>📦</div>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{margin:0,fontSize:'11px',fontWeight:'700',color:'var(--text)'}}>{p.id}</p>
                    <p style={{margin:0,fontSize:'10px',color:'var(--muted)'}}>{p.fecha} · {p.total}</p>
                  </div>
                  <span style={{background:p.c+'22',color:p.c,padding:'2px 7px',borderRadius:'20px',fontSize:'10px',fontWeight:'700',whiteSpace:'nowrap',flexShrink:0}}>{p.estado}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Ofertas especiales */}
          <div style={{background:'linear-gradient(135deg,#4c1d95,#7c3aed)',borderRadius:'14px',padding:'18px 14px',textAlign:'center',position:'relative',overflow:'hidden',boxShadow:'0 6px 20px rgba(124,58,237,.4)'}}>
            <div style={{position:'absolute',top:'-15px',right:'-12px',fontSize:'55px',opacity:.1}}>🎁</div>
            <p style={{margin:'0 0 0',fontSize:'34px',fontWeight:'900',color:'white',lineHeight:1}}>10%</p>
            <p style={{margin:'0 0 4px',fontSize:'12px',fontWeight:'700',color:'#c4b5fd'}}>DE DESCUENTO</p>
            <p style={{margin:'0 0 6px',fontSize:'10px',color:'#e9d5ff'}}>En tu primera compra. Código:</p>
            <div style={{background:'rgba(0,0,0,.25)',borderRadius:'6px',padding:'5px 10px',display:'inline-block',marginBottom:'12px'}}>
              <span style={{color:'white',fontWeight:'900',fontSize:'14px',letterSpacing:'.1em'}}>PARTGO10</span>
            </div>
            <button onClick={()=>navigate('/ofertas')} style={{display:'block',width:'100%',padding:'9px',background:'white',color:'#7c3aed',border:'none',borderRadius:'8px',fontWeight:'800',fontSize:'13px',cursor:'pointer',fontFamily:"'Inter',sans-serif",transition:'transform .15s'}}
              onMouseOver={e=>e.currentTarget.style.transform='translateY(-1px)'}
              onMouseOut={e=>e.currentTarget.style.transform='none'}>
              Ver ofertas →
            </button>
          </div>

          {/* Productos vistos recientemente */}
          <div style={{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:'12px',padding:'12px 14px'}}>
            <h3 style={{margin:'0 0 12px',fontSize:'14px',fontWeight:'700'}}>⚡ Más vendidos</h3>
            {PRODS_DEMO.slice(0,3).map((p,i)=>(
              <div key={i} style={{display:'flex',gap:'10px',alignItems:'center',marginBottom:i<2?'10px':0,cursor:'pointer',padding:'6px',borderRadius:'8px',transition:'background .15s'}}
                onClick={()=>navigate(`/producto/${p.id}`)}
                onMouseOver={e=>e.currentTarget.style.background='var(--bg4)'}
                onMouseOut={e=>e.currentTarget.style.background='transparent'}>
                <div style={{width:'38px',height:'38px',background:'var(--bg4)',borderRadius:'8px',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden'}}>
                  <img src={p.imagen} alt="" style={{maxWidth:'34px',maxHeight:'34px',objectFit:'contain'}} onError={e=>e.target.style.display='none'}/>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{margin:'0 0 2px',fontSize:'11px',fontWeight:'600',color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.nombre}</p>
                  <p style={{margin:0,fontSize:'12px',color:'#a78bfa',fontWeight:'700'}}>{formatPrecio(p.precio)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
