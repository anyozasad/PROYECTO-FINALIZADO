import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Swal from 'sweetalert2';
import { agregarAlCarrito } from '../utils/shopCore';
import { obtenerCatalogo } from '../utils/catalogoStore';
import { obtenerCategoriasAdmin } from '../utils/categoriasStore';

const SLIDES = [
  { tag:'CALIDAD QUE TE MUEVE',  titulo:'Repuestos de calidad', sub:'para tu vehículo',  desc:'Las mejores marcas, al mejor precio.',       img:'/IMAGENES/banner/banner-pub-1.png', aspect:450/252 },
  { tag:'ENVÍOS RÁPIDOS',         titulo:'Recibe en casa',       sub:'en 24-72 horas',   desc:'Despacho inmediato, garantía incluida.',      img:'/IMAGENES/banner/banner-pub-2.png', aspect:450/252 },
  { tag:'GARANTÍA ASEGURADA',     titulo:'Productos 100%',       sub:'originales',       desc:'Si no estás satisfecho, te devolvemos.',     img:'/IMAGENES/banner/banner-pub-3.png', aspect:738/345 },
  { tag:'FRENOS PREMIUM',         titulo:'Seguridad primero',    sub:'para tu moto',     desc:'La mejor selección de frenos del mercado.',  img:'/IMAGENES/banner/banner-aceites.png', aspect:599/350 },
];

/* Imágenes de respaldo solo para cuando una categoría/producto no trae foto propia */
const IMG_CATEGORIA_FALLBACK = {
  frenos:'/IMAGENES/ZAPATA FRENO ROJA.jpg', suspensión:'/IMAGENES/BARRA TELESCOPICA CARGUERO.jpg',
  suspension:'/IMAGENES/BARRA TELESCOPICA CARGUERO.jpg', motor:'/IMAGENES/ARRANCADOR DE MOTOR GN125.jpg',
  eléctricos:'/IMAGENES/BOBINA 12V.jpg', electricos:'/IMAGENES/BOBINA 12V.jpg',
  iluminación:'/IMAGENES/FARO DELANTERO REDONDO.jpg', iluminacion:'/IMAGENES/FARO DELANTERO REDONDO.jpg',
  llantas:'/IMAGENES/ARO CON LLANTA 5.00-12 (4H).jpg', cadenas:'/IMAGENES/CADENA 428-114L.jpg',
  transmisión:'/IMAGENES/CADENA 428-114L.jpg', transmision:'/IMAGENES/CADENA 428-114L.jpg',
  aceites:'/IMAGENES/ACEITE LUBRICANTE 4T25W-50 1LT.jpg', lubricantes:'/IMAGENES/ACEITE LUBRICANTE 4T25W-50 1LT.jpg',
  accesorios:'/IMAGENES/ABRILLANTADOR DE NEUMATICOS 600ML.jpg', baterías:'/IMAGENES/BOBINA 12V.jpg', baterias:'/IMAGENES/BOBINA 12V.jpg',
};
const imgCategoria = (nombre, imgPropia) => imgPropia || IMG_CATEGORIA_FALLBACK[String(nombre||'').trim().toLowerCase()] || '/IMAGENES/ABRILLANTADOR DE NEUMATICOS 600ML.jpg';
const money = (n) => Number(n||0).toFixed(2);

/* Catálogo del admin tal cual, sin que normalizarProducto pise el precio original con el de oferta */
function mapearCatalogo() {
  return obtenerCatalogo().filter(p => !p.eliminado).map((p) => ({
    id: p.id,
    nombre: p.nombre,
    categoria: p.categoria,
    precio: Number(p.precio || 0),
    precioOferta: Number(p.precio_oferta || 0),
    enOferta: !!p.en_oferta,
    esNuevo: !!p.es_nuevo,
    imagen: p.imagen,
    img: p.imagen,
    stock: Number(p.stock || 0),
  }));
}
const TARGET = Date.now() + (2*86400+14*3600+37*60+9)*1000;
function Cd() {
  const c=()=>{ const d=Math.max(0,TARGET-Date.now()); return {d:Math.floor(d/86400000),h:Math.floor(d%86400000/3600000),m:Math.floor(d%3600000/60000),s:Math.floor(d%60000/1000)}; };
  const [t,setT]=useState(c);
  useEffect(()=>{ const id=setInterval(()=>setT(c()),1000); return()=>clearInterval(id); },[]);
  return <div style={{display:'flex',gap:'8px'}}>{[{v:t.d,l:'DÍAS'},{v:t.h,l:'HORAS'},{v:t.m,l:'MIN'},{v:t.s,l:'SEG'}].map(({v,l})=>(
    <div key={l} style={{textAlign:'center'}}>
      <div style={{background:'var(--pg-input)',border:'1px solid var(--pg-border2)',borderRadius:'8px',padding:'8px 12px',minWidth:'52px',fontSize:'26px',fontWeight:'900',color:'var(--pg-text)'}}>{String(v).padStart(2,'0')}</div>
      <p style={{margin:'4px 0 0',fontSize:'9px',color:'var(--pg-muted)',fontWeight:'700',textTransform:'uppercase',letterSpacing:'.05em'}}>{l}</p>
    </div>
  ))}</div>;
}

export default function Landing() {
  const { isAuth, usuario } = useAuth();
  const { tema } = useTheme();
  const navigate = useNavigate();
  const [slide,setSlide]=useState(0);
  const [comoFunciona,setComoFunciona]=useState(false);
  const esAdmin=[1,2].includes(Number(usuario?.rol_id));
  useEffect(()=>{ const t=setInterval(()=>setSlide(s=>(s+1)%SLIDES.length),5000); return()=>clearInterval(t); },[]);
  const cur=SLIDES[slide];
  const isLight = tema === 'claro';

  /* Categorías reales (las que crea/edita el admin), con su conteo de productos en vivo */
  const [categoriasAdmin,setCategoriasAdmin] = useState(() => obtenerCategoriasAdmin());
  useEffect(() => {
    const sync = () => setCategoriasAdmin(obtenerCategoriasAdmin());
    sync();
    window.addEventListener('partgo_categorias_changed', sync);
    window.addEventListener('partgo_catalogo_changed', sync);
    return () => {
      window.removeEventListener('partgo_categorias_changed', sync);
      window.removeEventListener('partgo_catalogo_changed', sync);
    };
  }, []);
  const catsDestacadas = useMemo(() => (
    [...categoriasAdmin].sort((a,b)=>b.productos-a.productos).slice(0,5)
  ), [categoriasAdmin]);

  /* Catálogo real (productos creados/editados por el admin: precios, ofertas, nuevos) */
  const [catalogo,setCatalogo] = useState(() => mapearCatalogo());
  useEffect(() => {
    const sync = () => setCatalogo(mapearCatalogo());
    sync();
    window.addEventListener('partgo_catalogo_changed', sync);
    return () => window.removeEventListener('partgo_catalogo_changed', sync);
  }, []);
  /* Destacados: primero los nuevos/en oferta que mande el admin, luego se completa con el resto */
  const prodsDestacados = useMemo(() => {
    const conPrioridad = [...catalogo].sort((a,b) => (Number(b.esNuevo||b.enOferta||0) - Number(a.esNuevo||a.enOferta||0)));
    return conPrioridad.slice(0,4);
  }, [catalogo]);

  const irProductos = () => navigate('/s/productos?mostrar=todos');
  const irComoFunciona = () => setComoFunciona(true);
  const irCuenta = () => isAuth ? navigate(esAdmin?'/dashboard':'/inicio') : navigate('/login?return=/s/ofertas');
  const addCart = (p, e) => {
    e.stopPropagation();
    const tieneOferta = p.enOferta && p.precioOferta>0 && p.precioOferta<p.precio;
    agregarAlCarrito({ id:p.id, nombre:p.nombre, precio:tieneOferta?p.precioOferta:p.precio, img:p.imagen, imagen:p.imagen, categoria:p.categoria || 'Repuestos', stock:p.stock||10 }, 1);
    Swal.fire({icon:'success',title:'Agregado al carrito',text:p.nombre,timer:1100,showConfirmButton:false,background:'var(--pg-surface)',color:'var(--pg-text)'});
  };

  const bp={background:'linear-gradient(135deg,#7c3aed,#9333ea)',color:'white',border:'none',borderRadius:'10px',padding:'12px 24px',fontSize:'14px',fontWeight:'700',cursor:'pointer',fontFamily:"'Inter',sans-serif",boxShadow:'0 4px 16px rgba(124,58,237,.35)',transition:'transform .18s,box-shadow .18s'};

  return (
    <div style={{fontFamily:"'Inter',sans-serif",color:'var(--pg-text)',background:'var(--pg-bg)',minHeight:'100%'}}>
      <style>{`
        @keyframes lHI{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
        @keyframes lSF{from{opacity:0;transform:scale(.97)}to{opacity:1;transform:none}}
        @keyframes lCI{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
        @keyframes lFl{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}
        @keyframes lPulsePlay{0%,100%{transform:scale(1);box-shadow:0 0 0 0 rgba(124,58,237,.45)}50%{transform:scale(1.06);box-shadow:0 0 0 12px rgba(124,58,237,0)}}
        .landing-click{transition:transform .18s ease, filter .18s ease, box-shadow .18s ease}.landing-click:hover{transform:translateY(-2px);filter:brightness(1.07)}.landing-click:active{transform:scale(.96)}
        .landing-demo-screen{min-height:230px;border-radius:16px;background:linear-gradient(135deg,#070710,#22104a 55%,#7c3aed);border:1px solid rgba(167,139,250,.35);position:relative;overflow:hidden;box-shadow:0 18px 45px rgba(0,0,0,.28)}
        .landing-demo-screen::before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 70% 30%,rgba(255,255,255,.18),transparent 23%),radial-gradient(circle at 22% 76%,rgba(124,58,237,.42),transparent 28%)}
        .landing-demo-play{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:70px;height:70px;border-radius:999px;background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.38);display:grid;place-items:center;color:white;font-size:28px;animation:lPulsePlay 2.4s ease-in-out infinite;backdrop-filter:blur(10px)}
        .landing-demo-pill{position:absolute;left:24px;bottom:22px;right:24px;display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.landing-demo-pill span{background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.18);border-radius:12px;color:#fff;padding:10px;font-size:11px;font-weight:800;text-align:center}
        @media(max-width:1120px){.landing-cat-grid{grid-template-columns:repeat(3,1fr)!important}.landing-product-grid{grid-template-columns:repeat(3,1fr)!important}.landing-benefits{grid-template-columns:repeat(2,1fr)!important}.landing-offer-strip{flex-wrap:wrap!important}}
        @media(max-width:760px){.landing-hero{min-height:auto!important;padding:32px 18px 70px!important}.landing-hero h1{font-size:32px!important}.landing-hero p{font-size:13px!important}.landing-hero-actions{width:100%!important}.landing-hero-actions button{flex:1!important;min-width:0!important;padding:12px 10px!important;font-size:12px!important}.landing-benefits{grid-template-columns:1fr!important;padding:14px 12px!important}.landing-content{padding:18px 12px!important}.landing-cat-grid,.landing-product-grid{grid-template-columns:repeat(2,1fr)!important;gap:12px!important}.landing-cat-img,.landing-product-img{height:112px!important}.landing-offer-strip{margin:0 12px 18px!important;padding:20px!important;display:block!important}.landing-offer-strip .landing-offer-count{margin:16px 0!important}.landing-offer-products{justify-content:center!important}.landing-demo-pill{grid-template-columns:1fr!important}.landing-demo-screen{min-height:260px!important}}
        @media(max-width:430px){.landing-cat-grid,.landing-product-grid{grid-template-columns:1fr!important}.landing-hero-actions{flex-direction:column!important}.landing-hero-actions button{width:100%!important}.landing-section-head{align-items:flex-start!important;gap:8px!important;flex-direction:column!important}.landing-section-head button{padding:0!important}}
      `}</style>

      <div key={slide} className="landing-hero" style={{position:'relative',overflow:'hidden',padding:'46px 40px 40px',minHeight:'440px',display:'flex',alignItems:'center',borderBottom:'1px solid var(--pg-border)',animation:'lSF .4s ease'}}>
        <img src={cur.img} alt="" style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover'}} onError={e=>e.target.style.display='none'}/>
        <div style={{position:'absolute',inset:0,background:'linear-gradient(90deg, rgba(7,7,16,.96) 0%, rgba(7,7,16,.88) 30%, rgba(7,7,16,.5) 55%, rgba(7,7,16,.18) 78%, rgba(7,7,16,.38) 100%)'}}/>
        <div style={{position:'absolute',inset:0,background:'linear-gradient(180deg, rgba(7,7,16,.22) 0%, transparent 25%, transparent 75%, rgba(7,7,16,.32) 100%)'}}/>
        <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at 15% 50%,rgba(124,58,237,.32) 0%,transparent 55%)',pointerEvents:'none'}}/>
        <div style={{position:'relative',zIndex:1,flex:'0 1 520px',maxWidth:'560px',animation:'lHI .6s ease'}}>
          <span style={{display:'inline-block',marginBottom:'16px',background:'rgba(245,158,11,.2)',border:'1px solid rgba(245,158,11,.5)',borderRadius:'20px',padding:'4px 14px',fontSize:'11px',fontWeight:'800',color:'#fbbf24',textTransform:'uppercase',letterSpacing:'.08em',backdropFilter:'blur(6px)'}}>{cur.tag}</span>
          <h1 style={{fontSize:'40px',fontWeight:'900',lineHeight:'1.07',marginBottom:'12px',letterSpacing:'-0.8px',color:'white',textShadow:'0 4px 24px rgba(0,0,0,.45)'}}>
            {cur.titulo}<br/>
            <span style={{background:'linear-gradient(135deg,#c4b5fd,#a78bfa,#7c3aed)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>{cur.sub}</span>
          </h1>
          <p style={{color:'#dcd6f5',fontSize:'15px',marginBottom:'16px',textShadow:'0 2px 10px rgba(0,0,0,.5)'}}>{cur.desc}</p>
          <div style={{display:'flex',gap:'14px',marginBottom:'22px',flexWrap:'wrap'}}>
            {['🛡️ 100% Originales','🏷️ Garantía asegurada','🚚 Envíos rápidos'].map(f=><span key={f} style={{color:'#e9e4ff',fontSize:'12px',fontWeight:'600',textShadow:'0 2px 8px rgba(0,0,0,.5)'}}>{f}</span>)}
          </div>
          <div className="landing-hero-actions" style={{display:'flex',gap:'10px',flexWrap:'wrap'}}>
            <button className="landing-click" style={bp} onClick={irProductos} onMouseOver={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 8px 26px rgba(124,58,237,.55)';}} onMouseOut={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='0 4px 16px rgba(124,58,237,.35)';}}>Explorar repuestos →</button>
            <button className="landing-click" style={{display:'inline-flex',alignItems:'center',gap:'8px',background:'rgba(255,255,255,.14)',color:'white',padding:'12px 18px',borderRadius:'10px',fontSize:'14px',fontWeight:'700',border:'1px solid rgba(255,255,255,.28)',cursor:'pointer',fontFamily:"'Inter',sans-serif",backdropFilter:'blur(6px)'}} onClick={irComoFunciona}>▶ Ver cómo funciona</button>
          </div>
        </div>
        <div style={{position:'absolute',bottom:'14px',left:'50%',transform:'translateX(-50%)',zIndex:1,display:'flex',gap:'7px'}}>
          {SLIDES.map((_,i)=><button key={i} onClick={()=>setSlide(i)} style={{width:slide===i?'26px':'8px',height:'8px',borderRadius:'4px',border:'none',cursor:'pointer',background:slide===i?'#7c3aed':'rgba(255,255,255,.4)',transition:'all .3s',padding:0}}/>)}
        </div>
      </div>

      <div id="beneficios" className="landing-benefits" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'12px',padding:'18px 28px',background:'var(--pg-panel)',borderBottom:'1px solid var(--pg-border)',scrollMarginTop:'76px'}}>
        {[{i:'🚚',c:'#7c3aed',t:'Envíos rápidos',d:'A todo el país en 24-72h'},{i:'🔄',c:'#3b82f6',t:'Devoluciones fáciles',d:'Hasta 30 días'},{i:'🎧',c:'#10b981',t:'Soporte 24/7',d:'Siempre estamos aquí'},{i:'🔒',c:'#f59e0b',t:'Pagos seguros',d:'Protegemos tu compra'}].map(b=>(
          <button key={b.t} onClick={()=>b.t==='Soporte 24/7'?navigate('/login?return=/s/mensajes'):null} style={{background:'var(--pg-card)',border:'1px solid var(--pg-border)',borderRadius:'12px',padding:'14px 16px',display:'flex',alignItems:'center',gap:'12px',transition:'border-color .2s,transform .2s',cursor:b.t==='Soporte 24/7'?'pointer':'default',fontFamily:"'Inter',sans-serif",textAlign:'left'}} onMouseOver={e=>{e.currentTarget.style.borderColor='#7c3aed';e.currentTarget.style.transform='translateY(-2px)';}} onMouseOut={e=>{e.currentTarget.style.borderColor='var(--pg-border)';e.currentTarget.style.transform='none';}}>
            <div style={{width:'40px',height:'40px',background:b.c+'22',borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px',flexShrink:0}}>{b.i}</div>
            <div><p style={{margin:'0 0 2px',fontSize:'12px',fontWeight:'800',color:'var(--pg-text)'}}>{b.t}</p><p style={{margin:0,fontSize:'10px',color:'var(--pg-muted)'}}>{b.d}</p></div>
          </button>
        ))}
      </div>

      <div className="landing-content" style={{padding:'24px 28px',background:'var(--pg-bg)'}}>
        <div className="landing-section-head" style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'18px'}}>
          <h2 style={{margin:0,fontSize:'20px',fontWeight:'800',color:'var(--pg-text)'}}>Categorías populares</h2>
          <button onClick={()=>navigate('/s/categorias')} style={{background:'none',border:'none',color:'#8b5cf6',fontSize:'13px',fontWeight:'700',cursor:'pointer',fontFamily:"'Inter',sans-serif"}}>Ver todas las categorías →</button>
        </div>
        <div className="landing-cat-grid" style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'12px',marginBottom:'24px'}}>
          {catsDestacadas.map((cat,i)=>(
            <div key={cat.id||cat.nombre} onClick={()=>navigate(`/s/productos?categoria=${encodeURIComponent(cat.nombre)}`)} style={{background:'var(--pg-card)',border:'1px solid var(--pg-border)',borderRadius:'14px',overflow:'hidden',cursor:'pointer',transition:'transform .25s,border-color .2s,box-shadow .2s',animation:`lCI .5s ease ${i*.07}s both`,boxShadow:isLight?'0 10px 24px rgba(39,46,90,.05)':'none'}}
              onMouseOver={e=>{e.currentTarget.style.transform='translateY(-6px)';e.currentTarget.style.borderColor='#7c3aed';e.currentTarget.style.boxShadow='0 14px 30px rgba(124,58,237,.18)';}}
              onMouseOut={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.borderColor='var(--pg-border)';e.currentTarget.style.boxShadow=isLight?'0 10px 24px rgba(39,46,90,.05)':'none';}}>
              <div className="landing-cat-img" style={{height:'120px',background:'var(--pg-card2)',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden'}}>
                <img src={imgCategoria(cat.nombre, cat.imagen)} alt={cat.nombre} style={{maxHeight:'108px',maxWidth:'88%',objectFit:'contain'}} onError={e=>e.target.style.display='none'}/>
              </div>
              <div style={{padding:'10px 12px',background:'var(--pg-card)'}}>
                <p style={{margin:'0 0 4px',fontSize:'13px',fontWeight:'800',color:'var(--pg-text)'}}>{cat.nombre}</p>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <p style={{margin:0,fontSize:'11px',color:'var(--pg-muted)'}}>{cat.productos} producto{cat.productos===1?'':'s'}</p>
                  <span style={{color:'#7c3aed',fontSize:'14px',fontWeight:'900'}}>→</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="landing-section-head" style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
          <h2 style={{margin:0,fontSize:'20px',fontWeight:'800',color:'var(--pg-text)'}}>Productos destacados</h2>
          <button onClick={irProductos} style={{background:'none',border:'none',color:'#8b5cf6',fontSize:'13px',fontWeight:'700',cursor:'pointer',fontFamily:"'Inter',sans-serif"}}>Ver todos los productos →</button>
        </div>
        <div className="landing-product-grid" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'14px',marginBottom:'28px'}}>
          {prodsDestacados.map(p=>{
            const tieneOferta = p.enOferta && p.precioOferta>0 && p.precioOferta<p.precio;
            const precioMostrar = tieneOferta ? p.precioOferta : p.precio;
            return (
            <div key={p.id} onClick={()=>navigate(`/producto/${p.id}`)} style={{background:'var(--pg-card)',border:'1px solid var(--pg-border)',borderRadius:'14px',overflow:'hidden',cursor:'pointer',transition:'transform .25s,border-color .2s,box-shadow .2s',boxShadow:isLight?'0 10px 24px rgba(39,46,90,.05)':'none',position:'relative'}}
              onMouseOver={e=>{e.currentTarget.style.transform='translateY(-5px)';e.currentTarget.style.borderColor='#7c3aed';e.currentTarget.style.boxShadow='0 12px 28px rgba(124,58,237,.18)';}}
              onMouseOut={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.borderColor='var(--pg-border)';e.currentTarget.style.boxShadow=isLight?'0 10px 24px rgba(39,46,90,.05)':'none';}}>
              <div className="landing-product-img" style={{height:'150px',background:'var(--pg-card2)',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',position:'relative'}}>
                <img src={p.imagen||p.img} alt={p.nombre} style={{maxHeight:'136px',maxWidth:'88%',objectFit:'contain'}} onError={e=>e.target.style.display='none'}/>
                <div style={{position:'absolute',top:'8px',left:'8px',display:'flex',flexDirection:'column',gap:'4px'}}>
                  {tieneOferta && <span style={{background:'#ef4444',color:'white',fontSize:'9px',fontWeight:'800',padding:'2px 6px',borderRadius:'4px'}}>OFERTA</span>}
                  {!!p.esNuevo && <span style={{background:'#3b82f6',color:'white',fontSize:'9px',fontWeight:'800',padding:'2px 6px',borderRadius:'4px'}}>NUEVO</span>}
                </div>
              </div>
              <div style={{padding:'12px'}}>
                <p style={{margin:'0 0 6px',fontSize:'12px',fontWeight:'800',color:'var(--pg-text)',lineHeight:1.3,height:'30px',overflow:'hidden'}}>{p.nombre}</p>
                <div style={{display:'flex',marginBottom:'8px'}}>
                  {Array(5).fill(0).map((_,j)=><span key={j} style={{color:j<4?'#f59e0b':'#cbd5e1',fontSize:'11px'}}>★</span>)}
                  <span style={{color:'var(--pg-muted)',fontSize:'10px',marginLeft:'3px'}}>({30+((p.id||0)*3)%70})</span>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div style={{display:'flex',flexDirection:'column'}}>
                    <span style={{color:'#8b5cf6',fontSize:'16px',fontWeight:'900'}}>S/ {money(precioMostrar)}</span>
                    {tieneOferta && <span style={{color:'var(--pg-muted)',fontSize:'10px',textDecoration:'line-through'}}>S/ {money(p.precio)}</span>}
                  </div>
                  <button onClick={e=>addCart(p,e)} style={{background:'#7c3aed',border:'none',borderRadius:'8px',width:'32px',height:'32px',color:'white',cursor:'pointer',fontSize:'14px',display:'flex',alignItems:'center',justifyContent:'center'}}>🛒</button>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      </div>

      <div className="landing-offer-strip" style={{margin:'0 28px 28px',background:isLight?'linear-gradient(135deg,#ffffff,#f1edff)':'linear-gradient(135deg,#0d0d20,#1a0533)',border:'1px solid var(--pg-border2)',borderRadius:'18px',padding:'26px 32px',display:'flex',alignItems:'center',gap:'32px',position:'relative',overflow:'hidden',boxShadow:isLight?'0 18px 40px rgba(39,46,90,.08)':'none'}}>
        <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at 25% 50%,rgba(124,58,237,.18) 0%,transparent 60%)',pointerEvents:'none'}}/>
        <div style={{position:'relative',zIndex:1,flex:1}}>
          <p style={{margin:'0 0 6px',color:'#8b5cf6',fontSize:'11px',fontWeight:'800',textTransform:'uppercase',letterSpacing:'.08em'}}>✨ OFERTAS ESPECIALES</p>
          <h2 style={{margin:'0 0 4px',fontSize:'22px',fontWeight:'900',color:'var(--pg-text)'}}>Descuentos que aceleran tu compra</h2>
          <p style={{margin:'0 0 16px',color:'var(--pg-muted2)',fontSize:'13px'}}>Aprovecha nuestras ofertas por tiempo limitado.</p>
          <button style={bp} onClick={()=>navigate('/s/ofertas')} onMouseOver={e=>{e.currentTarget.style.transform='translateY(-2px)';}} onMouseOut={e=>{e.currentTarget.style.transform='none';}}>Ver ofertas →</button>
        </div>
        <div className="landing-offer-count" style={{position:'relative',zIndex:1,flexShrink:0}}><Cd/></div>
        <div className="landing-offer-products" style={{position:'relative',zIndex:1,display:'flex',gap:'10px',flexShrink:0}}>
          {[{img:'/IMAGENES/ZAPATA FRENO ROJA.jpg',off:'15%'},{img:'/IMAGENES/ACEITE LUBRICANTE 4T25W-60 1LT.jpg',off:'20%'}].map((o,i)=>(
            <button key={i} onClick={()=>navigate('/s/ofertas')} style={{width:'110px',height:'110px',background:'var(--pg-card2)',borderRadius:'12px',display:'flex',alignItems:'center',justifyContent:'center',position:'relative',overflow:'hidden',cursor:'pointer',border:'2px solid var(--pg-border2)',transition:'border-color .2s'}} onMouseOver={e=>e.currentTarget.style.borderColor='#7c3aed'} onMouseOut={e=>e.currentTarget.style.borderColor='var(--pg-border2)'}>
              <img src={o.img} alt="" style={{maxWidth:'96px',maxHeight:'96px',objectFit:'contain'}} onError={e=>e.target.style.display='none'}/>
              <span style={{position:'absolute',top:'6px',right:'6px',background:'#7c3aed',color:'white',fontSize:'9px',fontWeight:'800',padding:'2px 6px',borderRadius:'5px'}}>{o.off} OFF</span>
            </button>
          ))}
        </div>
      </div>

      {comoFunciona && (
        <div onClick={()=>setComoFunciona(false)} style={{position:'fixed',inset:0,background:'rgba(7,7,16,.72)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:999,padding:'20px',animation:'lSF .25s ease'}}>
          <div onClick={e=>e.stopPropagation()} style={{background:'var(--pg-card)',border:'1px solid var(--pg-border)',borderRadius:'18px',maxWidth:'620px',width:'100%',maxHeight:'88vh',overflowY:'auto',padding:'28px',position:'relative',boxShadow:'0 30px 70px rgba(0,0,0,.4)'}}>
            <button onClick={()=>setComoFunciona(false)} style={{position:'absolute',top:'16px',right:'16px',width:'30px',height:'30px',borderRadius:'50%',border:'1px solid var(--pg-border2)',background:'var(--pg-card2)',color:'var(--pg-muted2)',cursor:'pointer',fontSize:'15px',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
            <p style={{margin:'0 0 6px',color:'#8b5cf6',fontSize:'11px',fontWeight:'800',textTransform:'uppercase',letterSpacing:'.08em'}}>🎬 Video demo</p>
            <h2 style={{margin:'0 0 14px',fontSize:'22px',fontWeight:'900',color:'var(--pg-text)'}}>Así funciona comprar en PartGo</h2>
            <div className="landing-demo-screen" style={{marginBottom:'18px'}}>
              <div className="landing-demo-play">▶</div>
              <div style={{position:'absolute',left:'22px',top:'22px',color:'white'}}>
                <p style={{margin:0,fontSize:'11px',fontWeight:'900',color:'#c4b5fd',letterSpacing:'.08em'}}>PARTGO DEMO</p>
                <h3 style={{margin:'8px 0 0',fontSize:'26px',lineHeight:1.05}}>Busca, compra<br/>y recibe rápido</h3>
              </div>
              <div className="landing-demo-pill"><span>1. Repuesto</span><span>2. Checkout</span><span>3. Boleta</span></div>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
              {[
                {n:'1',i:'🔍',t:'Busca tu repuesto',d:'Explora por categoría o usa el buscador para encontrar el repuesto exacto que necesita tu moto.'},
                {n:'2',i:'🛒',t:'Agrégalo al carrito',d:'Elige la cantidad y agrégalo al carrito. Puedes seguir comprando otros repuestos sin perder tu progreso.'},
                {n:'3',i:'📍',t:'Ingresa tus datos de entrega',d:'Indica tu dirección y el método de pago. Aceptamos tarjeta, transferencia y pago contra entrega.'},
                {n:'4',i:'📦',t:'Recibe en 24-72 horas',d:'Te enviamos tu pedido a todo el país y puedes seguir su estado desde "Mis pedidos".'},
                {n:'5',i:'🧾',t:'Descarga tu boleta',d:'Apenas se confirma tu compra, tu boleta electrónica queda disponible para verla o descargarla.'},
              ].map(s=>(
                <div key={s.n} style={{display:'flex',gap:'14px',alignItems:'flex-start'}}>
                  <div style={{width:'42px',height:'42px',borderRadius:'12px',background:'linear-gradient(135deg,#7c3aed,#9333ea)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'19px',flexShrink:0,boxShadow:'0 6px 16px rgba(124,58,237,.35)'}}>{s.i}</div>
                  <div>
                    <p style={{margin:'0 0 3px',fontSize:'13px',fontWeight:'800',color:'var(--pg-text)'}}>Paso {s.n} · {s.t}</p>
                    <p style={{margin:0,fontSize:'12px',color:'var(--pg-muted2)',lineHeight:1.5}}>{s.d}</p>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={()=>{setComoFunciona(false);irProductos();}} style={{...bp,width:'100%',marginTop:'22px',textAlign:'center',display:'block'}}>Empezar a comprar →</button>
          </div>
        </div>
      )}
    </div>
  );
}
