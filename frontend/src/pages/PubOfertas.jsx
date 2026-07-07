import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { agregarAlCarrito } from '../utils/partgoStorage';
import { useTheme } from '../context/ThemeContext';
import { abrirDetalleProducto } from '../utils/productoDetalleStore';

const PRODS = [
  { id:1, n:'Kit de arrastre DID 428H',    p:150,   pa:199,   desc:24, img:'/IMAGENES/CADENA 428-114L.jpg',                  stars:4.5, categoria:'Transmisión' },
  { id:2, n:'Pastillas de freno Brembo',   p:59.90, pa:74.90, desc:20, img:'/IMAGENES/ZAPATA FRENO ROJA.jpg',                stars:5,   categoria:'Frenos' },
  { id:3, n:'Amortiguador trasero YSS',    p:299.90,pa:430,   desc:30, img:'/IMAGENES/BARRA TELESCOPICA CARGUERO.jpg',       stars:4.5, categoria:'Suspensión' },
  { id:4, n:'Filtro de aceite Bosch',      p:25.90, pa:37.90, desc:32, img:'/IMAGENES/ACEITE LUBRICANTE 4T25W-50 1LT.jpg',  stars:4,   categoria:'Aceites' },
  { id:5, n:'Alternador 4P CGL',           p:120.00,pa:155,   desc:22, img:'/IMAGENES/ALTERNADOR 4P CGL.jpg',                stars:4.5, categoria:'Motor' },
  { id:6, n:'Aceite 10W-40 Motul',         p:49.90, pa:62.90, desc:21, img:'/IMAGENES/ACEITE LUBRICANTE 4T25W-60 1LT.jpg',  stars:5,   categoria:'Aceites' },
  { id:7, n:'Bujía NGK Iridium',           p:34.90, pa:44.90, desc:22, img:'/IMAGENES/CAPUCHON DE BUJIA.jpg',               stars:4.5, categoria:'Eléctricos' },
  { id:8, n:'Faro LED H4 Philips',         p:69.90, pa:83.90, desc:17, img:'/IMAGENES/FARO DELANTERO REDONDO.jpg',          stars:4,   categoria:'Iluminación' },
];
const TARGET = Date.now()+(2*86400+18*3600+45*60+32)*1000;
function Cd(){
  const calc=()=>{const d=Math.max(0,TARGET-Date.now());return{d:Math.floor(d/86400000),h:Math.floor(d%86400000/3600000),m:Math.floor(d%3600000/60000),s:Math.floor(d%60000/1000)};};
  const [t,setT]=useState(calc);
  useEffect(()=>{const id=setInterval(()=>setT(calc()),1000);return()=>clearInterval(id);},[]);
  return<div style={{display:'flex',gap:'6px',alignItems:'center'}}>
    {[{v:t.d,l:'Días'},{v:t.h,l:'Hrs'},{v:t.m,l:'Min'},{v:t.s,l:'Seg'}].map(({v,l},i)=>(
      <div key={l} style={{display:'flex',alignItems:'center',gap:'6px'}}>
        <div style={{textAlign:'center'}}>
          <div style={{background:'var(--pg-input)',border:'1px solid var(--pg-border2)',borderRadius:'7px',padding:'6px 10px',minWidth:'44px',fontSize:'22px',fontWeight:'900',color:'var(--pg-text)'}}>{String(v).padStart(2,'0')}</div>
          <p style={{margin:'3px 0 0',fontSize:'9px',color:'var(--pg-muted)',textTransform:'uppercase'}}>{l}</p>
        </div>
        {i<3&&<span style={{color:'#7c3aed',fontWeight:'900',fontSize:'20px',marginBottom:'14px'}}>:</span>}
      </div>
    ))}
  </div>;
}

export default function PubOfertas(){
  const navigate=useNavigate();
  const location=useLocation();
  const { tema } = useTheme();
  const [cart,setCart]=useState({});
  const categoria = new URLSearchParams(location.search).get('categoria') || '';
  const lista = categoria ? PRODS.filter(p => p.categoria.toLowerCase() === categoria.toLowerCase()) : PRODS;
  const add=(prod,e)=>{
    e?.stopPropagation?.();
    setCart(c=>({...c,[prod.id]:(c[prod.id]||0)+1}));
    agregarAlCarrito({...prod, nombre:prod.n, precio:prod.p, imagen:prod.img, stock:10});
    Swal.fire({icon:'success',title:'Agregado al carrito',text:prod?.n || 'Producto agregado',timer:1200,showConfirmButton:false,background:'var(--pg-surface)',color:'var(--pg-text)'});
  };
  const isLight = tema === 'claro';
  return(
    <div className="pub-ofertas-page" style={{padding:'22px 24px',paddingBottom:'120px',fontFamily:"'Inter',sans-serif",color:'var(--pg-text)',background:'var(--pg-bg)',minHeight:'100%'}}>
      <style>{`@media(max-width:1100px){.pub-ofertas-grid{grid-template-columns:repeat(3,1fr)!important}.pub-ofertas-benefits{grid-template-columns:repeat(2,1fr)!important}}@media(max-width:760px){.pub-ofertas-page{padding:14px 10px 105px!important}.pub-ofertas-grid{grid-template-columns:repeat(2,1fr)!important}.pub-ofertas-benefits{grid-template-columns:1fr!important}}@media(max-width:480px){.pub-ofertas-grid{grid-template-columns:1fr!important}}`}</style>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'22px',background:isLight?'linear-gradient(135deg,#ffffff,#f1edff)':'linear-gradient(135deg,#13131f,#1a0835)',border:'1px solid var(--pg-border2)',borderRadius:'14px',padding:'18px 22px',boxShadow:isLight?'0 14px 32px rgba(39,46,90,.07)':'none'}}>
        <div>
          <p style={{margin:'0 0 4px',color:'#8b5cf6',fontSize:'11px',fontWeight:'900',textTransform:'uppercase',letterSpacing:'.08em'}}>🏷️ OFERTA TERMINANDO</p>
          <h1 style={{margin:'0 0 4px',fontSize:'22px',fontWeight:'900',color:'var(--pg-text)'}}>Ofertas especiales{categoria ? ` · ${categoria}` : ''}</h1>
          <p style={{margin:0,color:'var(--pg-muted)',fontSize:'12px'}}>Aprovecha los mejores descuentos</p>
        </div>
        <Cd/>
      </div>

      <div className="pub-ofertas-grid" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'16px',marginBottom:'22px'}}>
        {lista.map(p=>(
          <div key={p.id} onClick={()=>abrirDetalleProducto(navigate, p)} style={{background:'var(--pg-card)',border:'1px solid var(--pg-border)',borderRadius:'14px',overflow:'hidden',transition:'transform .22s,border-color .2s,box-shadow .2s',cursor:'pointer',boxShadow:isLight?'0 10px 24px rgba(39,46,90,.05)':'none'}}
            onMouseOver={e=>{e.currentTarget.style.transform='translateY(-5px)';e.currentTarget.style.borderColor='#7c3aed';e.currentTarget.style.boxShadow='0 12px 24px rgba(124,58,237,.18)';}}
            onMouseOut={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.borderColor='var(--pg-border)';e.currentTarget.style.boxShadow=isLight?'0 10px 24px rgba(39,46,90,.05)':'none';}}>
            <div style={{background:'#f5f5fc',height:'155px',display:'flex',alignItems:'center',justifyContent:'center',position:'relative',overflow:'hidden'}}>
              <img src={p.img} alt={p.n} style={{maxHeight:'142px',maxWidth:'90%',objectFit:'contain'}} onError={e=>e.target.style.display='none'}/>
              <span style={{position:'absolute',top:'8px',left:'8px',background:'#ef4444',color:'white',fontSize:'10px',fontWeight:'900',padding:'3px 8px',borderRadius:'5px'}}>-{p.desc}%</span>
              {cart[p.id]>0&&<span style={{position:'absolute',top:'8px',right:'8px',background:'#7c3aed',color:'white',fontSize:'10px',fontWeight:'900',padding:'3px 7px',borderRadius:'5px'}}>×{cart[p.id]}</span>}
            </div>
            <div style={{padding:'12px 14px'}}>
              <p style={{margin:'0 0 4px',fontSize:'12px',fontWeight:'800',color:'var(--pg-text)',lineHeight:1.3,height:'32px',overflow:'hidden'}}>{p.n}</p>
              <div style={{display:'flex',alignItems:'baseline',gap:'8px',marginBottom:'10px'}}>
                <span style={{fontSize:'17px',fontWeight:'900',color:'#8b5cf6'}}>S/ {p.p.toFixed(2)}</span>
                <span style={{fontSize:'11px',color:'var(--pg-muted)',textDecoration:'line-through'}}>S/ {p.pa.toFixed(2)}</span>
              </div>
              <button onClick={(e)=>add(p,e)} style={{width:'100%',padding:'9px',background:'linear-gradient(135deg,#7c3aed,#9333ea)',border:'none',borderRadius:'8px',color:'white',fontSize:'12px',fontWeight:'800',cursor:'pointer',fontFamily:"'Inter',sans-serif",transition:'transform .15s'}} onMouseOver={e=>e.currentTarget.style.transform='scale(1.03)'} onMouseOut={e=>e.currentTarget.style.transform='none'}>
                Añadir al carrito
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="pub-ofertas-benefits" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'12px',marginBottom:'18px'}}>
        {[{i:'🏷️',t:'Descuentos reales',d:'Los mejores precios del mercado'},{i:'⚡',t:'Stock limitado',d:'No te quedes sin el tuyo'},{i:'✅',t:'Ofertas verificadas',d:'Productos 100% originales'},{i:'🔄',t:'Cambios fáciles',d:'30 días sin preguntas'}].map(b=>(
          <div key={b.t} style={{background:'var(--pg-card)',border:'1px solid var(--pg-border)',borderRadius:'10px',padding:'12px 14px',display:'flex',gap:'10px',alignItems:'center'}}>
            <span style={{fontSize:'20px'}}>{b.i}</span>
            <div><p style={{margin:0,fontSize:'12px',fontWeight:'800',color:'var(--pg-text)'}}>{b.t}</p><p style={{margin:0,fontSize:'10px',color:'var(--pg-muted)'}}>{b.d}</p></div>
          </div>
        ))}
      </div>

      <button onClick={()=>navigate('/s/ofertas')} style={{display:'flex',alignItems:'center',gap:'8px',background:'transparent',border:'1px solid #7c3aed',borderRadius:'9px',padding:'10px 22px',color:'#8b5cf6',fontSize:'13px',fontWeight:'800',cursor:'pointer',fontFamily:"'Inter',sans-serif",margin:'0 auto',transition:'all .15s'}} onMouseOver={e=>{e.currentTarget.style.background='#7c3aed';e.currentTarget.style.color='white';}} onMouseOut={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color='#8b5cf6';}}>
        Ver todas las ofertas →
      </button>
    </div>
  );
}
