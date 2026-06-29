import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { obtenerCategoriasAdmin } from '../utils/categoriasStore';

const FALLBACK = {
  frenos:'/IMAGENES/ZAPATA FRENO ROJA.jpg',
  suspensión:'/IMAGENES/BARRA TELESCOPICA CARGUERO.jpg', suspension:'/IMAGENES/BARRA TELESCOPICA CARGUERO.jpg',
  motor:'/IMAGENES/ARRANCADOR DE MOTOR GN125.jpg',
  eléctricos:'/IMAGENES/BOBINA 12V.jpg', electricos:'/IMAGENES/BOBINA 12V.jpg',
  iluminación:'/IMAGENES/FARO DELANTERO REDONDO.jpg', iluminacion:'/IMAGENES/FARO DELANTERO REDONDO.jpg', luces:'/IMAGENES/FARO DELANTERO REDONDO.jpg',
  transmisión:'/IMAGENES/CADENA 428-114L.jpg', transmision:'/IMAGENES/CADENA 428-114L.jpg', cadenas:'/IMAGENES/CADENA 428-114L.jpg',
  llantas:'/IMAGENES/ARO CON LLANTA 5.00-12 (4H).jpg',
  aceites:'/IMAGENES/ACEITE LUBRICANTE 4T25W-50 1LT.jpg', lubricantes:'/IMAGENES/ACEITE LUBRICANTE 4T25W-50 1LT.jpg',
  accesorios:'/IMAGENES/ABRILLANTADOR DE NEUMATICOS 600ML.jpg',
  baterías:'/IMAGENES/BOBINA 12V.jpg', baterias:'/IMAGENES/BOBINA 12V.jpg',
  cascos:'/IMAGENES/CASCO ABATIBLE.jpg',
};
const imgCat = (cat) => cat.imagen || FALLBACK[String(cat.nombre || '').trim().toLowerCase()] || '/IMAGENES/ABRILLANTADOR DE NEUMATICOS 600ML.jpg';

export default function PubCategorias() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuth } = useAuth();
  const params = new URLSearchParams(location.search);
  const categoriaUrl = params.get('categoria');
  const buscarUrl = params.get('buscar') || '';
  const [sel, setSel] = useState(categoriaUrl || 'Todas las categorías');
  const [busq, setBusq] = useState(buscarUrl);
  const [cats, setCats] = useState(() => obtenerCategoriasAdmin());

  useEffect(() => {
    const sync = () => setCats(obtenerCategoriasAdmin());
    sync();
    window.addEventListener('partgo_categorias_changed', sync);
    window.addEventListener('partgo_catalogo_changed', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('partgo_categorias_changed', sync);
      window.removeEventListener('partgo_catalogo_changed', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  useEffect(() => {
    const p = new URLSearchParams(location.search);
    setSel(p.get('categoria') || 'Todas las categorías');
    setBusq(p.get('buscar') || '');
  }, [location.search]);

  const filtros = useMemo(() => ['Todas las categorías', ...cats.map(c => c.nombre)], [cats]);
  const filtradas = useMemo(() => cats.filter(c =>
    (sel === 'Todas las categorías' || c.nombre === sel) &&
    (!busq || `${c.nombre} ${c.descripcion}`.toLowerCase().includes(busq.toLowerCase()))
  ), [cats, sel, busq]);

  const irSoporte = () => {
    if (!isAuth) {
      localStorage.setItem('partgo_return_after_login','/s/mensajes');
      navigate('/login?return=/s/mensajes');
      return;
    }
    navigate('/s/mensajes');
  };
  const seleccionar = (f) => {
    setSel(f);
    navigate(f === 'Todas las categorías' ? '/s/categorias' : `/s/categorias?categoria=${encodeURIComponent(f)}`);
  };

  return (
    <div className="pub-categorias-page" style={{display:'flex',minHeight:'100%',fontFamily:"'Inter',sans-serif",color:'var(--pg-text)',background:'var(--pg-bg)'}}>
      <style>{`
        .pub-cat-card img{transition:transform .25s ease}.pub-cat-card:hover img{transform:scale(1.06)}
        @media(max-width:1100px){.pub-cat-grid{grid-template-columns:repeat(3,1fr)!important}.pub-cat-sidebar{width:190px!important}}
        @media(max-width:760px){
          .pub-categorias-page{display:block!important}.pub-cat-sidebar{width:auto!important;border-right:0!important;border-bottom:1px solid var(--pg-border)!important;padding:12px!important;position:sticky!important;top:120px!important;z-index:20!important}
          .pub-cat-filter-list{display:flex!important;gap:8px!important;overflow-x:auto!important;padding-bottom:4px!important}.pub-cat-filter-list button{min-width:max-content!important}
          .pub-cat-main{padding:16px 12px!important}.pub-cat-grid{grid-template-columns:repeat(2,1fr)!important;gap:12px!important}.pub-cat-img{height:105px!important}.pub-cat-footer{flex-direction:column!important;align-items:stretch!important;gap:10px!important}.pub-cat-footer button{width:100%!important}
        }
        @media(max-width:430px){.pub-cat-grid{grid-template-columns:1fr!important}.pub-cat-sidebar{top:132px!important}.pub-cat-main h1{font-size:20px!important}}
      `}</style>
      <aside className="pub-cat-sidebar" style={{width:'220px',background:'var(--pg-surface)',borderRight:'1px solid var(--pg-border)',padding:'22px 14px',flexShrink:0}}>
        <h3 style={{margin:'0 0 16px',fontSize:'14px',fontWeight:'800',color:'var(--pg-muted2)',textTransform:'uppercase',letterSpacing:'.06em'}}>Filtrar por</h3>
        <div style={{marginBottom:'8px',background:'var(--pg-card)',border:'1px solid var(--pg-border)',borderRadius:'8px',padding:'8px 12px',display:'flex',gap:'8px',alignItems:'center'}}>
          <span style={{color:'var(--pg-muted)',fontSize:'13px'}}>🔍</span>
          <input value={busq} onChange={e=>setBusq(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter') navigate(`/s/categorias?buscar=${encodeURIComponent(busq.trim())}`); }} placeholder="Buscar..." style={{background:'transparent',border:'none',color:'var(--pg-text)',outline:'none',fontSize:'12px',width:'100%',fontFamily:"'Inter',sans-serif"}}/>
        </div>
        <p style={{fontSize:'11px',fontWeight:'800',color:'var(--pg-muted)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:'8px'}}>Categorías</p>
        <div className="pub-cat-filter-list">
          {filtros.map(f=>{
            const active = sel === f;
            return (
              <button key={f} type="button" onClick={()=>seleccionar(f)} style={{width:'100%',display:'flex',alignItems:'center',gap:'8px',padding:'8px 10px',borderRadius:'7px',cursor:'pointer',marginBottom:'2px',background:active?'var(--pg-soft)':'transparent',border:`1px solid ${active?'rgba(124,58,237,.42)':'transparent'}`,transition:'all .15s',fontFamily:"'Inter',sans-serif",textAlign:'left'}}>
                <span style={{width:'8px',height:'8px',borderRadius:'50%',background:active?'#7c3aed':'var(--pg-border2)',flexShrink:0}}/>
                <span style={{fontSize:'12px',color:active?'#8b5cf6':'var(--pg-muted2)',fontWeight:active?'800':'500'}}>{f}</span>
              </button>
            );
          })}
        </div>
      </aside>

      <main className="pub-cat-main" style={{flex:1,padding:'26px'}}>
        <div style={{marginBottom:'22px'}}>
          <h1 style={{margin:'0 0 4px',fontSize:'22px',fontWeight:'900'}}>Todas las categorías</h1>
          <p style={{margin:0,color:'var(--pg-muted)',fontSize:'13px'}}>Elige una categoría y verás todos sus productos que el admin registró.</p>
        </div>
        <div className="pub-cat-grid" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'16px',marginBottom:'20px'}}>
          {filtradas.map(cat=>(
            <button className="pub-cat-card" key={cat.id || cat.nombre} type="button" onClick={()=>navigate(`/s/productos?categoria=${encodeURIComponent(cat.nombre)}`)} style={{background:'var(--pg-card)',border:'1px solid var(--pg-border)',borderRadius:'14px',overflow:'hidden',cursor:'pointer',transition:'transform .25s cubic-bezier(.34,1.56,.64,1),border-color .2s,box-shadow .2s',fontFamily:"'Inter',sans-serif",textAlign:'left',padding:0,boxShadow:'var(--pg-shadow)'}}
              onMouseOver={e=>{e.currentTarget.style.transform='translateY(-5px)';e.currentTarget.style.borderColor=cat.color || '#7c3aed';}}
              onMouseOut={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.borderColor='var(--pg-border)';}}>
              <div className="pub-cat-img" style={{height:'150px',background:'var(--pg-card2)',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden'}}>
                <img src={imgCat(cat)} alt={cat.nombre} style={{maxHeight:'134px',maxWidth:'90%',objectFit:'contain'}} onError={e=>e.currentTarget.style.display='none'}/>
              </div>
              <div style={{padding:'12px 14px'}}>
                <p style={{margin:'0 0 6px',fontSize:'14px',fontWeight:'800',color:'var(--pg-text)'}}>{cat.nombre}</p>
                <p style={{margin:'0 0 8px',fontSize:'11px',color:'var(--pg-muted)',minHeight:'16px'}}>{cat.descripcion}</p>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontSize:'11px',color:cat.color || '#8b5cf6',background:(cat.color || '#8b5cf6')+'18',borderRadius:'999px',padding:'4px 9px',fontWeight:'900'}}>{cat.productos} producto{cat.productos===1?'':'s'}</span>
                  <span style={{width:'26px',height:'26px',background:(cat.color || '#7c3aed')+'22',borderRadius:'7px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',color:cat.color || '#7c3aed'}}>→</span>
                </div>
              </div>
            </button>
          ))}
        </div>
        <div className="pub-cat-footer" style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 16px',background:'var(--pg-card)',border:'1px solid var(--pg-border)',borderRadius:'10px'}}>
          <p style={{margin:0,fontSize:'12px',color:'var(--pg-muted)'}}>Mostrando <strong style={{color:'var(--pg-text)'}}>{filtradas.length}</strong> de <strong style={{color:'var(--pg-text)'}}>{cats.length}</strong> categorías</p>
          <button onClick={irSoporte} style={{background:'linear-gradient(135deg,#7c3aed,#9333ea)',color:'white',border:'none',borderRadius:'8px',padding:'8px 16px',fontSize:'12px',fontWeight:'700',cursor:'pointer',fontFamily:"'Inter',sans-serif"}}>¿Necesitas ayuda? →</button>
        </div>
      </main>
    </div>
  );
}
