import { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import LogoutConfirmModal from './LogoutConfirmModal';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { guardarCupon, obtenerCarrito, resumenCarrito } from '../utils/shopCore';

const NAV = [
  { to:'/',                  icon:'🏠', label:'Inicio', publico:true },
  { to:'/s/categorias',      icon:'⊞',  label:'Categorías', publico:true },
  { to:'/s/ofertas',         icon:'🏷️', label:'Ofertas', publico:true },
  { to:'/s/favoritos',       icon:'❤️', label:'Favoritos' },
  { to:'/s/pedidos',         icon:'📋', label:'Pedidos' },
  { to:'/s/mensajes',        icon:'💬', label:'Mensajes' },
  { to:'/s/perfil',          icon:'👤', label:'Perfil' },
  { to:'/s/ajustes',         icon:'⚙️', label:'Ajustes' },
  { to:'/s/reclamaciones',   icon:'📝', label:'Libro de reclamaciones' },
];

export default function PublicLayout() {
  const { isAuth, usuario, logout } = useAuth();
  const { tema, setTema } = useTheme();
  const loc      = useLocation();
  const navigate = useNavigate();
  const esAdmin  = [1,2].includes(Number(usuario?.rol_id));
  const [buscar, setBuscar] = useState('');
  const [cart, setCart] = useState(() => obtenerCarrito());
  const [publicFoto, setPublicFoto] = useState(() => localStorage.getItem('partgo_public_foto') || usuario?.foto || '');
  const [adminLogoPublic, setAdminLogoPublic] = useState(() => localStorage.getItem('partgo_admin_logo') || '');
  const [logoutOpen, setLogoutOpen] = useState(false);

  useEffect(() => {
    const sync = () => setCart(obtenerCarrito());
    window.addEventListener('partgo_cart_changed', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('partgo_cart_changed', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  useEffect(() => {
    const syncProfile = () => {
      setPublicFoto(localStorage.getItem('partgo_public_foto') || usuario?.foto || '');
      setAdminLogoPublic(localStorage.getItem('partgo_admin_logo') || '');
    };
    syncProfile();
    window.addEventListener('storage', syncProfile);
    window.addEventListener('partgo_auth_changed', syncProfile);
    window.addEventListener('partgo_public_profile_changed', syncProfile);
    window.addEventListener('partgo_admin_profile_changed', syncProfile);
    return () => {
      window.removeEventListener('storage', syncProfile);
      window.removeEventListener('partgo_auth_changed', syncProfile);
      window.removeEventListener('partgo_public_profile_changed', syncProfile);
      window.removeEventListener('partgo_admin_profile_changed', syncProfile);
    };
  }, [usuario?.foto]);

  const themeVars = tema === 'claro'
    ? {
        '--pg-bg':'#f4f6ff', '--pg-surface':'#ffffff', '--pg-card':'#ffffff', '--pg-card2':'#eef1ff', '--pg-input':'#eef1ff', '--pg-border':'#d8ddf4', '--pg-border2':'#c8cfee', '--pg-text':'#0f172a', '--pg-text2':'#334155', '--pg-muted':'#64748b', '--pg-muted2':'#475569', '--pg-shadow':'0 18px 42px rgba(39,46,90,.11)', '--pg-soft':'rgba(124,58,237,.12)', '--pg-hover':'#f0edff', '--pg-panel':'#ffffff'
      }
    : {
        '--pg-bg':'#09090f', '--pg-surface':'#0e0e1a', '--pg-card':'#13131f', '--pg-card2':'#17172a', '--pg-input':'#1a1a2e', '--pg-border':'#1f2035', '--pg-border2':'#2d2d4e', '--pg-text':'#ffffff', '--pg-text2':'#e5e7eb', '--pg-muted':'#6b7280', '--pg-muted2':'#9ca3af', '--pg-shadow':'0 18px 42px rgba(0,0,0,.28)', '--pg-soft':'rgba(124,58,237,.18)', '--pg-hover':'#1a1a2e', '--pg-panel':'#09090f'
      };

  useEffect(() => {
    const root = document.documentElement;
    Object.entries(themeVars).forEach(([k, v]) => root.style.setProperty(k, v));
  }, [tema]);

  const isActive = (to) => to === '/' ? loc.pathname === '/' : loc.pathname.startsWith(to);
  const r = resumenCarrito(cart);
  const totalItems = cart.reduce((s,p)=>s+Number(p.cantidad||1),0);

  const rutaRequiereSesion = (ruta) => ['/s/favoritos','/s/pedidos','/s/mensajes','/s/perfil','/s/ajustes'].includes(ruta);

  const irRutaPublica = (ruta) => {
    if (!isAuth && rutaRequiereSesion(ruta)) {
      localStorage.setItem('partgo_return_after_login', ruta);
      sessionStorage.setItem('partgo_return_after_login', ruta);
      navigate(`/login?return=${encodeURIComponent(ruta)}`);
      return;
    }
    navigate(ruta);
  };

  const aplicarCupon = () => {
    guardarCupon('DORADA MOTOR’S10');
    Swal.fire({ icon:'success', title:'Cupón aplicado', text:'DORADA MOTOR’S10 quedó guardado para tu compra.', timer:1300, showConfirmButton:false, background:'var(--pg-surface)', color:'var(--pg-text)' });
    navigate('/s/carrito');
  };

  const buscarAhora = () => {
    const q = buscar.trim();
    if (!q) return;
    navigate(`/s/productos?buscar=${encodeURIComponent(q)}`);
  };

  const cerrarSesionPublica = () => setLogoutOpen(true);

  const confirmarCerrarSesion = () => {
    setLogoutOpen(false);
    logout();
    navigate('/');
  };

  const alternarTema = () => setTema(tema === 'oscuro' ? 'claro' : 'oscuro');

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        @keyframes plGlow { 0%,100%{box-shadow:0 0 16px rgba(124,58,237,.3)} 50%{box-shadow:0 0 32px rgba(124,58,237,.65)} }
        .pg-public-scroll::-webkit-scrollbar{width:8px;height:8px}.pg-public-scroll::-webkit-scrollbar-thumb{background:#7c3aed;border-radius:99px}
        .pg-public-nav-button:focus{outline:none;box-shadow:0 0 0 2px rgba(124,58,237,.45)}
        .pg-action:focus{outline:none;box-shadow:0 0 0 3px rgba(124,58,237,.22)}

        /* Capa segura para modales y cabecera responsive */
        .swal2-container{z-index:2147483000!important}
        .pg-public-mobile-text{}
        @media(max-width:900px){
          .pg-public-root{display:block!important}
          .pg-public-scroll{position:sticky!important;top:0!important;bottom:auto!important;width:100%!important;min-height:auto!important;max-height:none!important;display:block!important;z-index:500!important;border-right:0!important;border-bottom:1px solid var(--pg-border)!important}
          .pg-public-scroll>button{padding:10px 12px 4px!important}
          .pg-public-scroll nav{display:flex!important;gap:6px!important;overflow-x:auto!important;padding:8px 10px!important}
          .pg-public-scroll nav button{min-width:max-content!important;margin-bottom:0!important}
          .pg-public-scroll>div:last-child{display:none!important}
          .pg-public-main{margin-left:0!important;min-height:auto!important}
          .pg-public-header{height:auto!important;min-height:58px!important;padding:9px 10px!important;gap:8px!important;flex-wrap:wrap!important;align-items:center!important}
          .pg-public-header-search{order:3!important;flex-basis:100%!important;max-width:none!important}
          .pg-public-header-actions{gap:6px!important;flex-wrap:wrap!important}
          .pg-public-header-actions>span{display:none!important}
          .pg-public-account-btn,.pg-public-login-btn{padding:8px 10px!important;font-size:11px!important;min-height:36px!important;white-space:nowrap!important}
          .pg-public-cart-btn{padding:6px 9px!important;min-height:36px!important}
          .pg-public-cart-btn p:first-of-type{display:none!important}
        }
        @media(max-width:520px){
          .pg-public-logo-text{display:none!important}
          .pg-public-header-actions{width:100%!important;margin-left:0!important;display:grid!important;grid-template-columns:42px 1fr 1fr!important;align-items:stretch!important}
          .pg-public-theme-btn{width:42px!important;margin-left:0!important}
          .pg-public-cart-btn{justify-content:center!important;min-width:0!important}
          .pg-public-account-btn,.pg-public-login-btn{justify-content:center!important;min-width:0!important}
          .pg-public-account-btn{grid-column:1 / span 2!important}
        }
        @media(max-width:360px){
          .pg-public-header-actions{grid-template-columns:1fr 1fr!important}
          .pg-public-theme-btn{width:auto!important}
          .pg-public-cart-btn{grid-column:2!important}
          .pg-public-account-btn{grid-column:1!important}
        }
      `}</style>
      <div className="pg-public-root" style={{ ...themeVars, display:'flex', minHeight:'100vh', fontFamily:"'Inter',sans-serif", background:'var(--pg-bg)', color:'var(--pg-text)' }}>
        <aside className="pg-public-scroll" style={{ width:'208px', background:'var(--pg-surface)', borderRight:'1px solid var(--pg-border)', display:'flex', flexDirection:'column', position:'fixed', top:0, left:0, bottom:0, zIndex:300, overflowY:'auto' }}>
          <button type="button" onClick={()=>navigate('/')} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'20px 16px 14px', textDecoration:'none', flexShrink:0, background:'transparent', border:'none', cursor:'pointer', textAlign:'left', fontFamily:"'Inter',sans-serif" }}>
            <div style={{ width:'36px', height:'36px', background:'linear-gradient(135deg,#7c3aed,#4c1d95)', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:'18px', fontWeight:'900', boxShadow:'0 4px 14px rgba(124,58,237,.45)', animation:'plGlow 3s ease-in-out infinite', flexShrink:0, overflow:'hidden' }}>
              {adminLogoPublic ? <img src={adminLogoPublic} alt="Logo Dorada Motor’s" style={{width:'100%',height:'100%',objectFit:'cover'}} /> : '⚡'}
            </div>
            <span className="pg-public-logo-text" style={{ color:'var(--pg-text)', fontWeight:'800', fontSize:'18px', letterSpacing:'-0.4px' }}>Dorada Motor’s</span>
          </button>

          <nav style={{ flex:1, padding:'0 10px' }}>
            {NAV.map((it) => {
              const active = isActive(it.to);
              return (
                <button key={it.to} type="button" className="pg-public-nav-button" onClick={() => irRutaPublica(it.to)}
                  style={{ width:'100%', display:'flex', alignItems:'center', gap:'10px', padding:'8px 12px', borderRadius:'8px', border:'none', textDecoration:'none', marginBottom:'2px', transition:'all .15s', background:active?'#7c3aed':'transparent', color:active?'white':'var(--pg-muted2)', fontSize:'13px', fontWeight:active?'700':'500', cursor:'pointer', fontFamily:"'Inter',sans-serif", textAlign:'left' }}
                  onMouseOver={e=>{ if(!active){e.currentTarget.style.background='var(--pg-hover)'; e.currentTarget.style.color='var(--pg-text)'; }}}
                  onMouseOut={e=>{ if(!active){e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--pg-muted2)'; }}}>
                  <span style={{ fontSize:'13px', width:'18px', textAlign:'center', flexShrink:0 }}>{it.icon}</span>
                  <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{it.label}</span>
                </button>
              );
            })}
          </nav>

          <div style={{ padding:'0 12px 12px', flexShrink:0 }}>
            <div style={{ background:'linear-gradient(135deg,#4c1d95,#7c3aed)', borderRadius:'14px', padding:'16px 14px', position:'relative', overflow:'hidden', boxShadow:'0 6px 20px rgba(124,58,237,.32)' }}>
              <div style={{ position:'absolute', top:'-14px', right:'-10px', fontSize:'46px', opacity:.12 }}>✨</div>
              <p style={{ margin:'0 0 0', fontSize:'30px', fontWeight:'900', color:'white', lineHeight:1 }}>10%</p>
              <p style={{ margin:'0 0 2px', fontSize:'12px', fontWeight:'700', color:'#c4b5fd' }}>DE DESCUENTO</p>
              <p style={{ margin:'0 0 10px', fontSize:'10px', color:'#e9d5ff' }}>En tu primera compra</p>
              <button className="pg-action" onClick={aplicarCupon} style={{ width:'100%', padding:'7px', background:'white', color:'#7c3aed', border:'none', borderRadius:'7px', fontWeight:'800', fontSize:'12px', cursor:'pointer', fontFamily:"'Inter',sans-serif" }}>Usar cupón</button>
            </div>
          </div>
        </aside>

        <div className="pg-public-main" style={{ marginLeft:'208px', flex:1, display:'flex', flexDirection:'column', minHeight:'100vh' }}>
          <header className="pg-public-header" style={{ background:'var(--pg-surface)', borderBottom:'1px solid var(--pg-border)', padding:'0 24px', height:'64px', display:'flex', alignItems:'center', gap:'16px', position:'sticky', top:0, zIndex:200 }}>
            <button type="button" onClick={()=>navigate('/')} style={{ display:'flex', alignItems:'center', gap:'8px', textDecoration:'none', flexShrink:0, background:'transparent', border:'none', cursor:'pointer', fontFamily:"'Inter',sans-serif" }}>
              <span style={{ width:'22px', height:'22px', borderRadius:'7px', background:'linear-gradient(135deg,#7c3aed,#4c1d95)', color:'white', display:'inline-flex', alignItems:'center', justifyContent:'center', overflow:'hidden', fontSize:'14px' }}>
                {adminLogoPublic ? <img src={adminLogoPublic} alt="Logo Dorada Motor’s" style={{width:'100%',height:'100%',objectFit:'cover'}} /> : '⚡'}
              </span>
              <span style={{ fontWeight:'800', fontSize:'16px', color:'var(--pg-text)' }}>Dorada Motor’s</span>
            </button>
            <div className="pg-public-header-search" style={{ display:'flex', flex:1, maxWidth:'520px' }}>
              <input value={buscar} onChange={e=>setBuscar(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter') buscarAhora(); }} type="text" placeholder="Buscar repuestos, categorías, marcas..."
                style={{ flex:1, background:'var(--pg-input)', border:'1px solid var(--pg-border2)', borderRight:'none', borderRadius:'10px 0 0 10px', padding:'9px 16px', color:'var(--pg-text)', fontSize:'13px', outline:'none', fontFamily:"'Inter',sans-serif" }}
                onFocus={e=>e.target.style.borderColor='#7c3aed'} onBlur={e=>e.target.style.borderColor='var(--pg-border2)'}/>
              <button className="pg-action" onClick={buscarAhora} style={{ background:'#7c3aed', border:'none', borderRadius:'0 10px 10px 0', padding:'0 18px', color:'white', fontSize:'16px', cursor:'pointer' }}>🔍</button>
            </div>
            <div className="pg-public-header-actions" style={{ display:'flex', alignItems:'center', gap:'6px', marginLeft:'auto' }}>
              {[{i:'🚚',t:'Envíos a todo el país'},{i:'🔄',t:'Devoluciones sin complicaciones'}].map(b=>(
                <span key={b.t} style={{ display:'flex', alignItems:'center', gap:'5px', color:'var(--pg-muted)', fontSize:'10px' }}><span>{b.i}</span><span>{b.t}</span></span>
              ))}
              <button className="pg-action pg-public-theme-btn" onClick={alternarTema} title={tema === 'claro' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'} style={{ width:'34px', height:'34px', display:'inline-flex', alignItems:'center', justifyContent:'center', background:'var(--pg-input)', border:'1px solid var(--pg-border2)', borderRadius:'9px', cursor:'pointer', fontSize:'16px', marginLeft:'6px' }}>
                {tema === 'claro' ? '🌙' : '☀️'}
              </button>
              <button className="pg-action pg-public-cart-btn" onClick={()=>navigate('/s/carrito')} style={{ display:'flex', alignItems:'center', gap:'8px', background:'var(--pg-input)', border:'1px solid var(--pg-border2)', borderRadius:'9px', padding:'7px 12px', cursor:'pointer', transition:'border-color .15s' }} onMouseOver={e=>e.currentTarget.style.borderColor='#7c3aed'} onMouseOut={e=>e.currentTarget.style.borderColor='var(--pg-border2)'}>
                <div style={{ position:'relative' }}>
                  <span style={{ fontSize:'18px' }}>🛒</span>
                  <span style={{ position:'absolute', top:'-4px', right:'-4px', background:'#7c3aed', color:'white', borderRadius:'50%', width:'14px', height:'14px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'8px', fontWeight:'800' }}>{totalItems}</span>
                </div>
                <div style={{ lineHeight:1.2 }}>
                  <p style={{ margin:0, fontSize:'9px', color:'var(--pg-muted)' }}>Mi carrito</p>
                  <p style={{ margin:0, fontSize:'12px', fontWeight:'700', color:'var(--pg-text)' }}>S/ {r.total.toFixed(2)}</p>
                </div>
              </button>
              {isAuth ? (
                <>
                  <button className="pg-action pg-logout-action-btn" onClick={cerrarSesionPublica} style={{ background:'rgba(239,68,68,.12)', border:'1px solid rgba(239,68,68,.55)', borderRadius:'8px', padding:'8px 12px', color:'#ef4444', fontSize:'12px', fontWeight:'800', cursor:'pointer', fontFamily:"'Inter',sans-serif", whiteSpace:'nowrap', display:'inline-flex', alignItems:'center', justifyContent:'center', gap:'6px' }}>
                    <span>🚪</span><span className="pg-logout-text">Cerrar sesión</span>
                  </button>
                  <button className="pg-action pg-public-account-btn" onClick={()=>navigate(esAdmin?'/dashboard':'/s/perfil')} style={{ background:'linear-gradient(135deg,#7c3aed,#9333ea)', color:'white', border:'none', borderRadius:'8px', padding:'8px 14px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:"'Inter',sans-serif", display:'flex', alignItems:'center', gap:'8px' }}>
                    {publicFoto && (<span style={{width:'20px',height:'20px',borderRadius:'50%',overflow:'hidden',display:'inline-flex',alignItems:'center',justifyContent:'center',background:'rgba(255,255,255,.18)'}}><img src={publicFoto} alt="Perfil" style={{width:'100%',height:'100%',objectFit:'cover'}} /></span>)}
                    Mi cuenta →
                  </button>
                </>
              ) : (
                <button className="pg-action pg-public-login-btn" onClick={()=>{const destino = rutaRequiereSesion(loc.pathname) ? loc.pathname : '/inicio'; localStorage.setItem('partgo_return_after_login', destino); sessionStorage.setItem('partgo_return_after_login', destino); navigate(`/login?return=${encodeURIComponent(destino)}`);}} style={{ background:'transparent', border:'1px solid var(--pg-border2)', borderRadius:'8px', padding:'8px 14px', color:'var(--pg-muted2)', fontSize:'12px', cursor:'pointer', fontFamily:"'Inter',sans-serif", transition:'all .15s' }} onMouseOver={e=>{e.currentTarget.style.borderColor='#7c3aed';e.currentTarget.style.color='#a78bfa';}} onMouseOut={e=>{e.currentTarget.style.borderColor='var(--pg-border2)';e.currentTarget.style.color='var(--pg-muted2)';}}>👤 Ingresar</button>
              )}
            </div>
          </header>
          <div style={{ flex:1 }}><Outlet /></div>
        </div>
      </div>
      <LogoutConfirmModal
        open={logoutOpen}
        onCancel={() => setLogoutOpen(false)}
        onConfirm={confirmarCerrarSesion}
      />
    </>
  );
}
