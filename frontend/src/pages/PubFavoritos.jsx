
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { agregarAlCarrito } from '../utils/partgoStorage';

const FAVS = [
  { id:1, n:'Kit de arrastre DID 428H',   p:150,    img:'/IMAGENES/CADENA 428-114L.jpg'                  },
  { id:2, n:'Pastillas de freno Brembo',  p:59.90,  img:'/IMAGENES/ZAPATA FRENO ROJA.jpg'                },
  { id:3, n:'Amortiguador trasero YSS',   p:299.90, img:'/IMAGENES/BARRA TELESCOPICA CARGUERO.jpg'       },
  { id:4, n:'Batería 12V 7Ah Yuasa',     p:85.90,  img:'/IMAGENES/BOBINA 12V.jpg'                       },
  { id:5, n:'Faro delantero LED',         p:189.90, img:'/IMAGENES/FARO DELANTERO REDONDO.jpg'           },
  { id:6, n:'Disco de freno trasero',     p:170.00, img:'/IMAGENES/ALTERNADOR 4P CGL.jpg'                },
  { id:7, n:'Bujía NGK CR7HSA',           p:15.90,  img:'/IMAGENES/CAPUCHON DE BUJIA.jpg'               },
  { id:8, n:'Filtro de aceite K&N',       p:65.00,  img:'/IMAGENES/ACEITE LUBRICANTE 4T25W-50 1LT.jpg'  },
];

function leerFavoritosGuardados(){
  try {
    const saved = JSON.parse(localStorage.getItem('partgo_favoritos') || '[]');
    if (Array.isArray(saved) && saved.length) {
      return saved.map(x => ({
        id: x.id,
        n: x.n || x.nombre || 'Producto Dorada Motor’s',
        p: Number(x.p ?? x.precio ?? 0),
        img: x.img || x.imagen || '/IMAGENES/ACEITE LUBRICANTE 4T25W-50 1LT.jpg',
        liked: true
      }));
    }
  } catch {}
  return FAVS.map(f => ({...f, liked:true}));
}

export default function PubFavoritos(){
  const navigate=useNavigate();
  const [favs,setFavs]=useState(leerFavoritosGuardados);
  const [cart,setCart]=useState({});

  useEffect(() => {
    const sync = () => setFavs(leerFavoritosGuardados());
    window.addEventListener('storage', sync);
    window.addEventListener('partgo_favoritos_changed', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('partgo_favoritos_changed', sync);
    };
  }, []);
  const toggle=id=>{
    setFavs(f=>{
      const next = f.map(x=>x.id===id?{...x,liked:!x.liked}:x);
      const activos = next.filter(x=>x.liked).map(x=>({id:x.id,n:x.n,nombre:x.n,p:x.p,precio:x.p,img:x.img,imagen:x.img}));
      localStorage.setItem('partgo_favoritos', JSON.stringify(activos));
      window.dispatchEvent(new Event('partgo_favoritos_changed'));
      return next;
    });
  };
  const add=(id)=>{
    const prod = favs.find(p => p.id === id);
    setCart(c=>({...c,[id]:(c[id]||0)+1}));
    agregarAlCarrito(prod);
    Swal.fire({icon:'success',title:'Agregado al carrito',text:prod?.n || 'Producto agregado',timer:1200,showConfirmButton:false,background:'var(--pg-surface)',color:'var(--pg-text)'});
  };
  const active=favs.filter(f=>f.liked);
  return(
    <div style={{padding:'26px 28px',fontFamily:"'Inter',sans-serif",color:'var(--pg-text)',background:'var(--pg-bg)',minHeight:'100%'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'22px'}}>
        <div>
          <h1 style={{margin:'0 0 2px',fontSize:'22px',fontWeight:'800'}}>Mis favoritos ❤️</h1>
          <p style={{margin:0,color:'var(--pg-muted)',fontSize:'13px'}}>Productos que guardaste para después</p>
        </div>
        <span style={{background:'rgba(124,58,237,.15)',color:'#a78bfa',padding:'6px 16px',borderRadius:'20px',fontSize:'13px',fontWeight:'700'}}>{active.length} productos</span>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'16px'}}>
        {favs.map(p=>(
          <div key={p.id} onClick={()=>p.liked && navigate(`/producto/${p.id}`)} style={{background:'var(--pg-card)',border:`1px solid ${p.liked?'var(--pg-border)':'rgba(239,68,68,.2)'}`,borderRadius:'14px',overflow:'hidden',transition:'transform .22s,border-color .2s,box-shadow .2s',opacity:p.liked?1:.5,cursor:p.liked?'pointer':'default'}}
            onMouseOver={e=>{if(p.liked){e.currentTarget.style.transform='translateY(-5px)';e.currentTarget.style.borderColor='#7c3aed';e.currentTarget.style.boxShadow='0 12px 24px rgba(124,58,237,.2)';}}}
            onMouseOut={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.borderColor=p.liked?'var(--pg-border)':'rgba(239,68,68,.2)';e.currentTarget.style.boxShadow='none';}}>
            <div style={{background:'#f5f5fc',height:'152px',display:'flex',alignItems:'center',justifyContent:'center',position:'relative',overflow:'hidden'}}>
              <img src={p.img} alt={p.n} style={{maxHeight:'138px',maxWidth:'90%',objectFit:'contain'}} onError={e=>e.target.style.display='none'}/>
              <button onClick={(e)=>{e.stopPropagation();toggle(p.id);}} style={{position:'absolute',top:'8px',right:'8px',background:p.liked?'rgba(239,68,68,.85)':'rgba(0,0,0,.5)',border:'none',borderRadius:'50%',width:'30px',height:'30px',cursor:'pointer',fontSize:'14px',display:'flex',alignItems:'center',justifyContent:'center',transition:'all .18s'}}>
                {p.liked?'❤️':'🤍'}
              </button>
            </div>
            <div style={{padding:'12px 14px'}}>
              <p style={{margin:'0 0 8px',fontSize:'12px',fontWeight:'700',color:'var(--pg-text)',lineHeight:1.3,height:'30px',overflow:'hidden'}}>{p.n}</p>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
                <span style={{fontSize:'16px',fontWeight:'800',color:'#a78bfa'}}>S/ {p.p.toFixed(2)}</span>
                {cart[p.id]>0&&<span style={{background:'rgba(124,58,237,.2)',color:'#a78bfa',padding:'2px 8px',borderRadius:'20px',fontSize:'11px',fontWeight:'700'}}>×{cart[p.id]}</span>}
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr auto',gap:'8px'}}>
                <button onClick={(e)=>{e.stopPropagation();add(p.id);}} disabled={!p.liked} style={{padding:'8px',background:p.liked?'linear-gradient(135deg,#7c3aed,#9333ea)':'#1a1a2e',border:'none',borderRadius:'8px',color:'var(--pg-text)',fontSize:'11px',fontWeight:'700',cursor:p.liked?'pointer':'not-allowed',fontFamily:"'Inter',sans-serif",transition:'transform .15s'}}
                  onMouseOver={e=>{if(p.liked)e.currentTarget.style.transform='scale(1.03)';}} onMouseOut={e=>e.currentTarget.style.transform='none'}>
                  Añadir al carrito
                </button>
                <button onClick={(e)=>{e.stopPropagation();navigate(`/producto/${p.id}`);}} style={{padding:'8px 10px',background:'rgba(124,58,237,.12)',border:'1px solid rgba(124,58,237,.25)',borderRadius:'8px',color:'#a78bfa',fontSize:'11px',cursor:'pointer',fontFamily:"'Inter',sans-serif",transition:'all .15s'}}
                  onMouseOver={e=>{e.currentTarget.style.background='rgba(124,58,237,.25)';}} onMouseOut={e=>e.currentTarget.style.background='rgba(124,58,237,.12)'}>
                  Ver
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
