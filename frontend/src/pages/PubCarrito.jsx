import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useAuth } from '../context/AuthContext';
import { obtenerCarrito, eliminarDelCarrito, cambiarCantidadCarrito, resumenCarrito, guardarCupon } from '../utils/shopCore';

export default function PubCarrito() {
  const navigate = useNavigate();
  const { isAuth } = useAuth();
  const [items, setItems] = useState(() => obtenerCarrito());

  useEffect(() => {
    const sync = () => setItems(obtenerCarrito());
    window.addEventListener('partgo_cart_changed', sync);
    return () => window.removeEventListener('partgo_cart_changed', sync);
  }, []);

  const resumen = useMemo(() => resumenCarrito(items), [items]);

  const quitar = async (id) => {
    const r = await Swal.fire({ icon:'question', iconHtml:'🗑️', title:'¿Quitar producto?', text:'Se eliminará de tu carrito.', showCancelButton:true, confirmButtonText:'Sí, quitar', cancelButtonText:'Cancelar', confirmButtonColor:'#ef4444', background:'var(--pg-surface)', color:'var(--pg-text)', width:'380px', customClass:{ icon:'pg-trash-icon' } });
    if (r.isConfirmed) setItems(eliminarDelCarrito(id));
  };

  const cambiar = (id, delta) => setItems(cambiarCantidadCarrito(id, delta));

  const irCheckout = async () => {
    if (!items.length) return Swal.fire({ icon:'info', title:'Carrito vacío', text:'Agrega productos para continuar.', confirmButtonColor:'#7c3aed', background:'var(--pg-surface)', color:'var(--pg-text)' });
    if (isAuth) return navigate('/s/checkout');

    const r = await Swal.fire({
      icon:'question',
      title:'¿Cómo deseas continuar?',
      text:'Para comprar puedes iniciar sesión, registrarte o continuar como invitado.',
      showDenyButton:true,
      showCancelButton:true,
      confirmButtonText:'Iniciar sesión',
      denyButtonText:'Registrarme',
      cancelButtonText:'Continuar invitado',
      confirmButtonColor:'#7c3aed',
      denyButtonColor:'#9333ea',
      cancelButtonColor:'#111827',
      background:'var(--pg-surface)',
      color:'var(--pg-text)'
    });
    localStorage.setItem('partgo_return_after_login','/s/checkout');
    if (r.isConfirmed) navigate('/login?return=/s/checkout');
    else if (r.isDenied) navigate('/registro?return=/s/checkout');
    else if (r.dismiss === Swal.DismissReason.cancel) navigate('/s/checkout?modo=invitado');
  };

  const aplicar = () => { guardarCupon('DORADA MOTOR’S10'); setItems(obtenerCarrito()); Swal.fire({icon:'success',title:'Cupón DORADA MOTOR’S10 aplicado',timer:1200,showConfirmButton:false,background:'var(--pg-surface)',color:'var(--pg-text)'}); };

  return (
    <>
    <style>{`@media(max-width:820px){.pub-carrito-page{padding:14px 10px 105px!important}.pub-carrito-grid{grid-template-columns:1fr!important}}`}</style>
    <div className="pub-carrito-page" style={{padding:'22px 24px',paddingBottom:'120px',fontFamily:"'Inter',sans-serif",color:'var(--pg-text)',background:'var(--pg-bg)',minHeight:'100%'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'22px'}}>
        <div><h1 style={{margin:'0 0 4px',fontSize:'24px',fontWeight:'900'}}>Mi carrito 🛒</h1><p style={{margin:0,color:'var(--pg-muted)',fontSize:'13px'}}>Revisa tus productos antes de comprar.</p></div>
        <button className="pg-anim-btn" onClick={() => navigate('/s/ofertas')} style={{background:'var(--pg-soft)',border:'1px solid rgba(124,58,237,.35)',borderRadius:'10px',padding:'10px 16px',color:'#a78bfa',fontWeight:'800',cursor:'pointer'}}>Seguir comprando</button>
      </div>

      {items.length === 0 ? (
        <div style={{background:'var(--pg-card)',border:'1px solid var(--pg-border)',borderRadius:'18px',padding:'44px',textAlign:'center',boxShadow:'var(--pg-shadow)'}}>
          <div style={{fontSize:'54px',opacity:.7,marginBottom:'12px'}}>🛒</div><h2 style={{margin:'0 0 8px'}}>Tu carrito está vacío</h2><p style={{color:'var(--pg-muted)',margin:'0 0 18px'}}>Agrega productos para iniciar tu compra.</p>
          <button className="pg-anim-btn" onClick={() => navigate('/s/ofertas')} style={{background:'linear-gradient(135deg,#7c3aed,#9333ea)',border:'none',borderRadius:'10px',padding:'12px 22px',color:'white',fontWeight:'900',cursor:'pointer'}}>Ver ofertas</button>
        </div>
      ) : (
        <div className="pub-carrito-grid" style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) 310px',gap:'18px'}}>
          <div style={{display:'grid',gap:'12px'}}>{items.map((p) => (
            <div key={p.id} style={{background:'var(--pg-card)',border:'1px solid var(--pg-border)',borderRadius:'16px',padding:'14px',display:'grid',gridTemplateColumns:'90px 1fr auto',gap:'14px',alignItems:'center',boxShadow:'var(--pg-shadow)'}}>
              <div style={{height:'86px',background:'#f5f5fc',borderRadius:'12px',display:'flex',alignItems:'center',justifyContent:'center'}}>{p.img ? <img src={p.img} alt={p.nombre} style={{maxWidth:'86px',maxHeight:'78px',objectFit:'contain'}} onError={e=>e.currentTarget.style.display='none'} /> : <span style={{fontSize:'34px'}}>📦</span>}</div>
              <div><h3 style={{margin:'0 0 6px',fontSize:'15px'}}>{p.nombre}</h3><p style={{margin:'0 0 10px',color:'#a78bfa',fontWeight:'900'}}>S/ {Number(p.precio || 0).toFixed(2)}</p><div style={{display:'flex',alignItems:'center',gap:'8px'}}><button className="pg-anim-btn" onClick={() => cambiar(p.id, -1)} style={{width:'30px',height:'30px',borderRadius:'8px',border:'1px solid var(--pg-border2)',background:'var(--pg-input)',color:'var(--pg-text)',cursor:'pointer'}}>−</button><b>{p.cantidad || 1}</b><button className="pg-anim-btn" onClick={() => cambiar(p.id, 1)} style={{width:'30px',height:'30px',borderRadius:'8px',border:'1px solid var(--pg-border2)',background:'var(--pg-input)',color:'var(--pg-text)',cursor:'pointer'}}>+</button></div></div>
              <button className="pg-anim-btn" onClick={() => quitar(p.id)} style={{background:'rgba(239,68,68,.12)',border:'1px solid rgba(239,68,68,.35)',borderRadius:'10px',padding:'9px 12px',color:'#fca5a5',fontWeight:'800',cursor:'pointer'}}>Quitar</button>
            </div>))}</div>

          <aside style={{background:'var(--pg-card)',border:'1px solid var(--pg-border)',borderRadius:'18px',padding:'20px',height:'fit-content',position:'sticky',top:'80px',boxShadow:'var(--pg-shadow)'}}>
            <h2 style={{margin:'0 0 16px',fontSize:'18px'}}>Resumen</h2>
            <p style={{display:'flex',justifyContent:'space-between',color:'var(--pg-muted2)'}}><span>Subtotal</span><b style={{color:'var(--pg-text)'}}>S/ {resumen.subtotal.toFixed(2)}</b></p>
            <p style={{display:'flex',justifyContent:'space-between',color:'var(--pg-muted2)'}}><span>Descuento</span><b style={{color:'#10b981'}}>- S/ {resumen.descuento.toFixed(2)}</b></p>
            <p style={{display:'flex',justifyContent:'space-between',color:'var(--pg-muted2)'}}><span>Envío</span><b style={{color:'var(--pg-text)'}}>S/ {resumen.envio.toFixed(2)}</b></p>
            <button className="pg-anim-btn" onClick={aplicar} style={{width:'100%',background:'transparent',border:'1px dashed #7c3aed',borderRadius:'10px',padding:'10px',color:'#a78bfa',fontWeight:'800',cursor:'pointer',marginTop:'6px'}}>Aplicar DORADA MOTOR’S10</button>
            <div style={{height:'1px',background:'var(--pg-border)',margin:'14px 0'}}/>
            <p style={{display:'flex',justifyContent:'space-between',fontSize:'20px',fontWeight:'900'}}><span>Total</span><span style={{color:'#a78bfa'}}>S/ {resumen.total.toFixed(2)}</span></p>
            <button className="pg-anim-btn" onClick={irCheckout} style={{width:'100%',background:'linear-gradient(135deg,#7c3aed,#9333ea)',border:'none',borderRadius:'11px',padding:'13px',color:'white',fontWeight:'900',cursor:'pointer',marginTop:'10px'}}>Comprar ahora</button>
          </aside>
        </div>
      )}
    </div>
    </>
  );
}
