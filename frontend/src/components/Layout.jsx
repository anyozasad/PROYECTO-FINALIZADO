import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import LogoutConfirmModal from './LogoutConfirmModal';
import { guardarCupon, obtenerCarrito } from '../utils/partgoStorage';
import { contarNoLeidas } from '../utils/notificacionesStore';

const ADMIN_NAV = [
  { section: 'GESTIÓN', items: [
    { to:'/dashboard',       icon:'⊞',  label:'Panel Principal' },
    { to:'/productos',       icon:'📦',  label:'Productos'       },
    { to:'/categorias',      icon:'🏷️',  label:'Categorías'      },
    { to:'/pedidos',         icon:'📋',  label:'Pedidos'         },
    { to:'/clientes',        icon:'👥',  label:'Clientes'        },
    { to:'/proveedores',     icon:'🏭',  label:'Proveedores'     },
    { to:'/historial-stock', icon:'📦',  label:'Inventario'      },
  ]},
  { section: 'REPORTES', items: [
    { to:'/ventas',    icon:'📈', label:'Ventas'           },
    { to:'/reportes',  icon:'📊', label:'Más vendidos'     },
    { to:'/stock-bajo',icon:'⚠️', label:'Stock bajo'       },
  ]},
  { section: 'AJUSTES', items: [
    { to:'/usuarios',       icon:'👤', label:'Usuarios'         },
    { to:'/roles',          icon:'🔐', label:'Roles y permisos' },
    { to:'/configuracion',  icon:'⚙️', label:'Configuración'    },
    { to:'/metodos-pago',   icon:'💳', label:'Métodos de pago'  },
    { to:'/reclamos',       icon:'📢', label:'Reclamos y soporte' },
    { to:'/notificaciones', icon:'🔔', label:'Notificaciones'   },
  ]},
];

const USER_NAV = [
  { to:'/inicio',       icon:'🏠', label:'Inicio'          },
  { to:'/mis-pedidos',  icon:'📋', label:'Mis pedidos'     },
  { to:'/favoritos',    icon:'❤️', label:'Favoritos'       },
  { to:'/ofertas',      icon:'🏷️', label:'Ofertas'         },
  { to:'/mensajes',     icon:'💬', label:'Mensajes'        },
  { to:'/carrito',      icon:'🛒', label:'Mi carrito'      },
  { to:'/direcciones',  icon:'📍', label:'Direcciones'     },
  { to:'/configuracion',icon:'⚙️', label:'Configuración'   },
  { to:'/reclamaciones', icon:'📝', label:'Libro de reclamaciones' },
];

const PAGE_NAMES = {
  '/dashboard':'Panel Principal','/productos':'Productos','/categorias':'Categorías',
  '/pedidos':'Pedidos','/clientes':'Clientes','/proveedores':'Proveedores',
  '/historial-stock':'Inventario','/ventas':'Ventas','/reportes':'Más vendidos',
  '/reclamos':'Reclamos y soporte','/stock-bajo':'Stock bajo','/usuarios':'Usuarios','/roles':'Roles y permisos',
  '/configuracion':'Configuración','/metodos-pago':'Métodos de pago',
  '/notificaciones':'Notificaciones','/ofertas':'Ofertas',
  '/inicio':'Inicio','/mis-pedidos':'Mis pedidos','/favoritos':'Favoritos',
  '/perfil':'Mi perfil','/direcciones':'Mis direcciones','/carrito':'Mi carrito',
  '/mensajes':'Mensajes','/reclamaciones':'Libro de reclamaciones','/gestion-imagenes':'Gestión de imágenes',
};

export default function Layout() {
  const { usuario, logout } = useAuth();
  const { tema, setTema } = useTheme();
  const navigate = useNavigate();
  const loc = useLocation();
  const [busq, setBusq] = useState('');
  const [cartCount, setCartCount] = useState(() => obtenerCarrito().reduce((s, p) => s + Number(p.cantidad || 1), 0));
  const [adminFoto, setAdminFoto] = useState(() => localStorage.getItem('partgo_admin_foto') || '');
  const [adminLogo, setAdminLogo] = useState(() => localStorage.getItem('partgo_admin_logo') || '/logo-dorada-motors.png');
  const [publicFoto, setPublicFoto] = useState(() => localStorage.getItem('partgo_public_foto') || usuario?.foto || '');
  const [temaSpin, setTemaSpin] = useState(false);
  const [notifCount, setNotifCount] = useState(() => contarNoLeidas());
  const [logoutOpen, setLogoutOpen] = useState(false);
  const esAdmin = [1, 2].includes(Number(usuario?.rol_id));

  const userThemeVars = !esAdmin
    ? (tema === 'claro'
      ? {
          '--bg':'#f6f7ff', '--bg2':'#ffffff', '--bg3':'#ffffff', '--bg4':'#eef0ff', '--bg5':'#e8ebff',
          '--border':'#d8dcf2', '--border2':'#c7cbea', '--text':'#0f172a', '--text2':'#334155', '--muted':'#64748b', '--muted2':'#475569',
          '--card-bg':'#ffffff', '--input-bg':'#eef0ff', '--purple-light':'#7c3aed',
          '--pg-bg':'#f6f7ff', '--pg-surface':'#ffffff', '--pg-card':'#ffffff', '--pg-card2':'#eef0ff', '--pg-input':'#eef0ff',
          '--pg-border':'#d8dcf2', '--pg-border2':'#c7cbea', '--pg-text':'#0f172a', '--pg-text2':'#334155', '--pg-muted':'#64748b', '--pg-muted2':'#475569',
          '--pg-shadow':'0 18px 42px rgba(39,46,90,.10)', '--pg-soft':'rgba(124,58,237,.10)'
        }
      : {
          '--bg':'#08080f', '--bg2':'#0e0e1a', '--bg3':'#13131f', '--bg4':'#1a1a2e', '--bg5':'#1f1f35',
          '--border':'#1f2035', '--border2':'#2d2d4e', '--text':'#ffffff', '--text2':'#e5e7eb', '--muted':'#64748b', '--muted2':'#9ca3af',
          '--card-bg':'#0e0e1a', '--input-bg':'#1a1a2e', '--purple-light':'#a78bfa',
          '--pg-bg':'#09090f', '--pg-surface':'#0e0e1a', '--pg-card':'#13131f', '--pg-card2':'#17172a', '--pg-input':'#1a1a2e',
          '--pg-border':'#1f2035', '--pg-border2':'#2d2d4e', '--pg-text':'#ffffff', '--pg-text2':'#e5e7eb', '--pg-muted':'#64748b', '--pg-muted2':'#9ca3af',
          '--pg-shadow':'0 18px 42px rgba(0,0,0,.26)', '--pg-soft':'rgba(124,58,237,.18)'
        })
    : {};

  const adminThemeVars = esAdmin
    ? (tema === 'claro'
      ? {
          '--bg':'#f5f6ff',
          '--bg2':'#ffffff',
          '--bg3':'#ffffff',
          '--bg4':'#eef0ff',
          '--bg5':'#f4f5ff',
          '--border':'#d8dcf2',
          '--border2':'#c7cbea',
          '--text':'#0f172a',
          '--text2':'#334155',
          '--muted':'#64748b',
          '--muted2':'#475569',
          '--card-bg':'#ffffff',
          '--input-bg':'#eef0ff',
          '--purple-light':'#7c3aed',
          '--admin-row':'#f8f9ff',
          '--admin-row-hover':'#eef0ff'
        }
      : {
          '--bg':'#08080f',
          '--bg2':'#0e0e1a',
          '--bg3':'#13131f',
          '--bg4':'#1a1a2e',
          '--bg5':'#1f1f35',
          '--border':'#1f2035',
          '--border2':'#2d2d4e',
          '--text':'#ffffff',
          '--text2':'#e5e7eb',
          '--muted':'#64748b',
          '--muted2':'#9ca3af',
          '--card-bg':'#0e0e1a',
          '--input-bg':'#1a1a2e',
          '--purple-light':'#a78bfa',
          '--admin-row':'#0f0f1a',
          '--admin-row-hover':'#1a1a2e'
        })
    : {};

  useEffect(() => {
    const syncCart = () => setCartCount(obtenerCarrito().reduce((s, p) => s + Number(p.cantidad || 1), 0));
    window.addEventListener('partgo_cart_changed', syncCart);
    return () => window.removeEventListener('partgo_cart_changed', syncCart);
  }, []);

  useEffect(() => {
    const syncNotif = () => setNotifCount(contarNoLeidas());
    syncNotif();
    window.addEventListener('partgo_notificaciones_changed', syncNotif);
    return () => window.removeEventListener('partgo_notificaciones_changed', syncNotif);
  }, []);

  useEffect(() => {
    const syncPublicProfile = () => {
      const saved = localStorage.getItem('partgo_public_foto') || '';
      setPublicFoto(saved || usuario?.foto || '');
    };

    syncPublicProfile();
    window.addEventListener('storage', syncPublicProfile);
    window.addEventListener('partgo_auth_changed', syncPublicProfile);
    window.addEventListener('partgo_public_profile_changed', syncPublicProfile);

    return () => {
      window.removeEventListener('storage', syncPublicProfile);
      window.removeEventListener('partgo_auth_changed', syncPublicProfile);
      window.removeEventListener('partgo_public_profile_changed', syncPublicProfile);
    };
  }, [usuario?.foto]);

  useEffect(() => {
    const syncAdminImages = () => {
      setAdminFoto(localStorage.getItem('partgo_admin_foto') || '');
      setAdminLogo(localStorage.getItem('partgo_admin_logo') || '/logo-dorada-motors.png');
    };
    window.addEventListener('storage', syncAdminImages);
    window.addEventListener('partgo_admin_profile_changed', syncAdminImages);
    return () => {
      window.removeEventListener('storage', syncAdminImages);
      window.removeEventListener('partgo_admin_profile_changed', syncAdminImages);
    };
  }, []);

  const usarCupon = () => {
    guardarCupon('DORADA MOTOR’S10');
    Swal.fire({
      icon: 'success',
      title: 'Cupón aplicado',
      text: 'Se guardó el cupón DORADA MOTOR’S10 para tu compra.',
      timer: 1400,
      showConfirmButton: false,
      background: '#0e0e1a',
      color: 'white'
    });
    navigate('/carrito');
  };

  const contactarSoporte = () => {
    Swal.fire({
      icon: 'info',
      title: 'Soporte Dorada Motor’s',
      text: 'Te llevamos al centro de mensajes.',
      timer: 900,
      showConfirmButton: false,
      background: '#0e0e1a',
      color: 'white'
    });
    setTimeout(() => navigate('/mensajes'), 250);
  };

  const buscarProducto = () => {
    if (!busq.trim()) return;
    if (esAdmin) {
      Swal.fire({
        icon: 'info',
        title: 'Búsqueda en el panel',
        text: `Buscando: ${busq}`,
        timer: 1000,
        showConfirmButton: false,
        background: '#0e0e1a',
        color: 'white'
      });
      return;
    }
    navigate(`/inicio?buscar=${encodeURIComponent(busq.trim())}`);
    setBusq('');
  };

  const alternarTemaAdmin = () => {
    const nuevoTema = tema === 'oscuro' ? 'claro' : 'oscuro';
    setTema(nuevoTema);
    // Cambio silencioso: sin modal grande para no tapar el panel administrador.
  };

  const alternarTemaGeneral = () => {
    const nuevoTema = tema === 'oscuro' ? 'claro' : 'oscuro';
    setTema(nuevoTema);
    setTemaSpin(true);
    setTimeout(() => setTemaSpin(false), 450);
  };

  const currentPage = Object.entries(PAGE_NAMES).find(([k]) => loc.pathname === k || loc.pathname.startsWith(k + '/'))?.[1] || 'Dorada Motor’s';

  const salir = () => setLogoutOpen(true);

  const confirmarCerrarSesion = () => {
    setLogoutOpen(false);
    logout();
    navigate('/');
  };

  const isActive = (to) => loc.pathname === to || (to !== '/inicio' && to !== '/dashboard' && loc.pathname.startsWith(to));

  const SideLink = ({ to, icon, label, badge }) => {
    const active = isActive(to);
    return (
      <Link to={to} style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'8px 12px', borderRadius:'8px', textDecoration:'none',
        marginBottom:'1px', transition:'all .15s',
        background: active ? '#7c3aed' : 'transparent',
        color: active ? '#fff' : 'var(--muted2)',
        fontSize:'13px', fontWeight: active ? '600' : '400',
      }}
        onMouseOver={e => { if (!active) { e.currentTarget.style.background = 'var(--bg4)'; e.currentTarget.style.color = 'var(--text)'; }}}
        onMouseOut={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--muted2)'; }}}
      >
        <span style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <span style={{ fontSize:'14px', width:'18px', textAlign:'center', flexShrink:0 }}>{icon}</span>
          {label}
        </span>
        {badge != null && (
          <span style={{ background: active ? 'rgba(255,255,255,.25)' : 'rgba(124,58,237,.2)', color: active ? '#fff' : '#a78bfa', fontSize:'10px', fontWeight:'700', padding:'1px 7px', borderRadius:'20px' }}>
            {badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <div className="pg-theme-fade pg-app-root" style={{ display:'flex', minHeight:'100vh', background:'var(--bg)', fontFamily:"'Inter',sans-serif", color:'var(--text)', ...userThemeVars, ...adminThemeVars }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        *,*::before,*::after{box-sizing:border-box}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:#4c1d95;border-radius:2px}
        .pg-sect-label{font-size:10px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:.1em;padding:10px 12px 4px;display:block}
        .pg-theme-fade{transition:background .3s ease, border-color .3s ease, color .3s ease}
        @keyframes pgThemeSpin{0%{transform:rotate(0) scale(1)}50%{transform:rotate(160deg) scale(.7)}100%{transform:rotate(360deg) scale(1)}}
        .pg-theme-icon-spin{display:inline-flex;animation:pgThemeSpin .45s ease}
        .pg-topbar-icon-btn{background:var(--bg4);border:1px solid var(--border);cursor:pointer;padding:8px;border-radius:9px;transition:transform .15s ease, box-shadow .15s ease, filter .15s ease, background .15s ease;display:flex;align-items:center;justify-content:center;color:var(--text2);font-size:17px;position:relative;width:36px;height:36px}
        .pg-topbar-icon-btn:hover{background:var(--bg5);filter:brightness(1.05);transform:translateY(-2px)}
        .pg-topbar-icon-btn:active{transform:scale(.92)}
        .pg-topbar-badge{position:absolute;top:2px;right:2px;background:#7c3aed;color:white;border-radius:50%;width:16px;height:16px;font-size:9px;font-weight:800;display:flex;align-items:center;justify-content:center;border:2px solid var(--bg2)}
        .pg-sidebar-link-hover:hover{background:var(--bg4)!important;border-radius:8px!important}
        .pg-sidebar-nav-scroll{scrollbar-width:thin;scrollbar-color:#7c3aed transparent}
        .pg-sidebar-nav-scroll::-webkit-scrollbar{width:6px}
        .pg-sidebar-nav-scroll::-webkit-scrollbar-thumb{background:#7c3aed;border-radius:999px}

        /* Layout responsive + capa segura para modales */
        .swal2-container{z-index:2147483000!important}
        @media(max-width:900px){
          .pg-app-root{display:block!important}
          .pg-app-sidebar{position:sticky!important;top:0!important;bottom:auto!important;width:100%!important;height:auto!important;max-height:42dvh!important;z-index:500!important;border-right:0!important;border-bottom:1px solid var(--border)!important;display:block!important;overflow:auto!important}
          .pg-app-sidebar nav.pg-sidebar-nav-scroll{display:flex!important;gap:6px!important;overflow-x:auto!important;overflow-y:hidden!important;padding:8px!important;min-height:auto!important}
          .pg-app-sidebar nav.pg-sidebar-nav-scroll > div{display:flex!important;gap:6px!important;min-width:max-content!important}
          .pg-app-sidebar nav a{min-width:max-content!important;margin-bottom:0!important}
          .pg-app-sidebar .pg-sect-label{display:none!important}
          .pg-app-main{margin-left:0!important;min-height:auto!important}
          .pg-app-topbar{height:auto!important;min-height:58px!important;padding:10px!important;gap:8px!important;flex-wrap:wrap!important;align-items:center!important}
          .pg-app-search{order:3!important;flex-basis:100%!important;max-width:none!important}
          .pg-app-top-actions{margin-left:0!important;flex-wrap:wrap!important;justify-content:flex-start!important;width:auto!important}
          .pg-app-content{padding:16px!important}
          .pg-app-profile-chip{padding:5px 8px!important}
        }
        @media(max-width:520px){
          .pg-app-topbar h2{width:100%!important}
          .pg-app-top-actions{width:100%!important;display:grid!important;grid-template-columns:repeat(5,minmax(42px,1fr))!important;gap:7px!important}
          .pg-app-top-actions .pg-topbar-icon-btn{width:100%!important}
          .pg-app-profile-chip{grid-column:span 2!important;justify-content:center!important}
          .pg-app-profile-chip > div:nth-child(2),.pg-app-profile-chip > span{display:none!important}
        }
      `}</style>

      {/* ══ SIDEBAR ══ */}
      <aside className="pg-theme-fade pg-app-sidebar" style={{
        width:'228px', background:'var(--bg2)', borderRight:'1px solid var(--border)',
        display:'flex', flexDirection:'column',
        position:'fixed', top:0, left:0, bottom:0, height:'100dvh', zIndex:300, overflow:'hidden',
      }}>
        {/* LOGO */}
        <Link to={esAdmin ? '/dashboard' : '/inicio'} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'18px 16px 14px', textDecoration:'none', flexShrink:0 }}>
          <div style={{ width:'34px', height:'34px', background:'linear-gradient(135deg,#7c3aed,#4c1d95)', borderRadius:'9px', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:'17px', fontWeight:'900', boxShadow:'0 4px 12px rgba(124,58,237,.4)', flexShrink:0, overflow:'hidden' }}>
            {adminLogo ? <img src={adminLogo} alt="Logo" style={{width:'100%',height:'100%',objectFit:'cover'}} /> : '⚡'}
          </div>
          <span style={{ color:'var(--text)', fontWeight:'800', fontSize:'18px', letterSpacing:'-0.3px' }}>Dorada Motor’s</span>
        </Link>

        {/* ─ ADMIN ─ */}
        {esAdmin && <>
          {/* Perfil admin */}
          <div className="pg-sidebar-profile" style={{ margin:'0 10px 12px', padding:'10px 12px', background:'var(--bg4)', border:'1px solid var(--border)', borderRadius:'10px', display:'flex', alignItems:'center', gap:'10px' }}>
            <div style={{ width:'36px', height:'36px', borderRadius:'50%', background:'linear-gradient(135deg,#7c3aed,#4c1d95)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:'800', fontSize:'14px', flexShrink:0, overflow:'hidden' }}>
              {adminFoto ? <img src={adminFoto} alt="Admin" style={{width:'100%',height:'100%',objectFit:'cover'}} /> : (usuario?.nombre?.[0]?.toUpperCase() || 'A')}
            </div>
            <div style={{ minWidth:0 }}>
              <p style={{ margin:0, fontSize:'13px', fontWeight:'700', color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{usuario?.nombre || 'Admin Dorada Motor’s'}</p>
              <div style={{ display:'flex', alignItems:'center', gap:'4px', marginTop:'2px' }}>
                <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#10b981', display:'inline-block' }} />
                <span style={{ fontSize:'11px', color:'#10b981', fontWeight:'600' }}>Administrador</span>
              </div>
            </div>
          </div>

          {/* Menú admin */}
          <nav className="pg-sidebar-nav-scroll" style={{ flex:1, minHeight:0, overflowY:'auto', overflowX:'hidden', padding:'0 8px 8px' }}>
            {ADMIN_NAV.map(sec => (
              <div key={sec.section}>
                <span className="pg-sect-label">{sec.section}</span>
                {sec.items.map(it => <SideLink key={it.to} {...it} />)}
              </div>
            ))}
          </nav>

        </>}

        {/* ─ USUARIO ─ */}
        {!esAdmin && <>
          {/* Perfil usuario */}
          <div className="pg-sidebar-profile" style={{ margin:'0 10px 12px', padding:'10px 12px', background:'var(--bg4)', border:'1px solid var(--border)', borderRadius:'10px', display:'flex', alignItems:'center', gap:'10px', cursor:'pointer' }}
            onClick={() => navigate('/perfil')}>
            <div style={{ width:'36px', height:'36px', borderRadius:'50%', background:'linear-gradient(135deg,#7c3aed,#4c1d95)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:'800', fontSize:'14px', flexShrink:0, overflow:'hidden' }}>
              {publicFoto ? <img src={publicFoto} alt="Cliente" style={{width:'100%',height:'100%',objectFit:'cover'}} /> : (usuario?.nombre?.[0]?.toUpperCase() || 'C')}
            </div>
            <div style={{ minWidth:0 }}>
              <p style={{ margin:0, fontSize:'13px', fontWeight:'700', color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>Hola, {usuario?.nombre || 'Cliente'} 👋</p>
              <p style={{ margin:0, fontSize:'11px', color:'var(--muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{usuario?.email || 'Ver mi perfil'}</p>
            </div>
          </div>

          <nav className="pg-sidebar-nav-scroll" style={{ flex:1, minHeight:0, overflowY:'auto', overflowX:'hidden', padding:'0 8px 8px' }}>
            {USER_NAV.map(it => <SideLink key={it.to} {...it} />)}
          </nav>

          {/* Banner descuento */}
          <div className="pg-sidebar-promo" style={{ margin:'0 10px 10px', background:'linear-gradient(135deg,#4c1d95,#7c3aed)', borderRadius:'12px', padding:'16px 14px', textAlign:'center', position:'relative', overflow:'hidden', flexShrink:0 }}>
            <div style={{ position:'absolute', top:'-15px', right:'-15px', fontSize:'50px', opacity:.1 }}>🎁</div>
            <p style={{ margin:'0 0 2px', fontSize:'28px', fontWeight:'900', color:'white', lineHeight:1 }}>10%</p>
            <p style={{ margin:'0 0 8px', fontSize:'12px', color:'#c4b5fd', fontWeight:'600' }}>DE DESCUENTO</p>
            <button onClick={usarCupon} style={{ width:'100%', padding:'7px', background:'white', color:'#7c3aed', border:'none', borderRadius:'7px', fontWeight:'800', fontSize:'12px', cursor:'pointer', fontFamily:"'Inter',sans-serif" }}>
              Usar cupón DORADA MOTOR’S10
            </button>
          </div>

          {/* Soporte */}
          <div className="pg-sidebar-support" style={{ margin:'0 10px 10px', padding:'12px', background:'var(--bg4)', border:'1px solid var(--border)', borderRadius:'10px', textAlign:'center', flexShrink:0 }}>
            <p style={{ margin:'0 0 2px', fontSize:'22px' }}>🎧</p>
            <p style={{ margin:'0 0 6px', fontSize:'12px', fontWeight:'700', color:'var(--text)' }}>¿Necesitas ayuda?</p>
            <button onClick={contactarSoporte} style={{ width:'100%', padding:'7px', background:'linear-gradient(135deg,#7c3aed,#9333ea)', border:'none', borderRadius:'7px', color:'white', fontSize:'11px', fontWeight:'700', cursor:'pointer', fontFamily:"'Inter',sans-serif" }}>
              Contactar soporte
            </button>
          </div>

        </>}
      </aside>

      {/* ══ MAIN ══ */}
      <main className="pg-app-main" style={{ marginLeft:'228px', flex:1, display:'flex', flexDirection:'column', minHeight:'100vh' }}>

        {/* TOPBAR */}
        <header className="pg-theme-fade pg-app-topbar" style={{
          background:'var(--bg2)', borderBottom:'1px solid var(--border)',
          padding:'0 24px', height:'58px', display:'flex', alignItems:'center', gap:'16px',
          position:'sticky', top:0, zIndex:200,
        }}>
          {/* Página actual */}
          <h2 style={{ margin:0, fontSize:'16px', fontWeight:'700', color:'var(--text)', flexShrink:0 }}>
            {currentPage}
          </h2>

          {/* Búsqueda */}
          <div className="pg-app-search" style={{ flex:1, maxWidth: esAdmin ? '380px' : '480px', display:'flex', alignItems:'center', background:'var(--bg4)', border:'1px solid var(--border)', borderRadius:'8px', padding:'0 14px', gap:'8px', height:'36px' }}>
            <span style={{ color:'var(--muted)', fontSize:'14px', flexShrink:0 }}>🔍</span>
            <input value={busq} onChange={e => setBusq(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') buscarProducto(); }} type="text"
              placeholder={esAdmin ? 'Buscar en el panel...' : 'Buscar repuestos, marcas...'}
              style={{ background:'transparent', border:'none', color:'var(--text)', outline:'none', fontSize:'13px', width:'100%', fontFamily:"'Inter',sans-serif" }} />
          </div>

          <div className="pg-app-top-actions" style={{ display:'flex', alignItems:'center', gap:'4px', marginLeft:'auto' }}>
            {/* Cerrar sesión */}
            <button className="pg-logout-action-btn pg-app-logout-action-btn" onClick={salir} style={{ background:'rgba(239,68,68,.12)', border:'1px solid rgba(239,68,68,.55)', borderRadius:'8px', padding:'8px 12px', color:'#ef4444', fontSize:'12px', fontWeight:'800', cursor:'pointer', fontFamily:"'Inter',sans-serif", whiteSpace:'nowrap', display:'inline-flex', alignItems:'center', justifyContent:'center', gap:'6px', minHeight:'36px' }}>
              <span>🚪</span><span className="pg-logout-text">Cerrar sesión</span>
            </button>

            {/* Tema */}
            <button
              className="pg-topbar-icon-btn"
              title={esAdmin ? (tema === 'oscuro' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro') : (tema === 'oscuro' ? 'Modo claro' : 'Modo oscuro')}
              onClick={() => esAdmin ? alternarTemaAdmin() : alternarTemaGeneral()}
            >
              <span className={!esAdmin && temaSpin ? 'pg-theme-icon-spin' : ''}>{tema === 'oscuro' ? '☀️' : '🌙'}</span>
            </button>

            {/* Notificaciones */}
            <button className="pg-topbar-icon-btn" onClick={() => navigate('/notificaciones')}>
              🔔
              {notifCount > 0 && <span className="pg-topbar-badge">{notifCount > 9 ? '9+' : notifCount}</span>}
            </button>

            {/* Solo usuario: favoritos + carrito */}
            {!esAdmin && <>
              <button className="pg-topbar-icon-btn" onClick={() => navigate('/favoritos')}>❤️</button>
              <button className="pg-topbar-icon-btn" onClick={() => navigate('/carrito')}>
                🛒
                <span className="pg-topbar-badge">{cartCount || 0}</span>
              </button>
            </>}


            {/* Perfil */}
            <div className="pg-app-profile-chip" style={{ display:'flex', alignItems:'center', gap:'8px', background:'var(--bg4)', border:'1px solid var(--border)', borderRadius:'9px', padding:'5px 12px 5px 6px', cursor:'pointer', marginLeft:'4px', transition:'border-color .15s' }}
              onClick={() => navigate(esAdmin ? '/configuracion' : '/perfil')}
              onMouseOver={e => e.currentTarget.style.borderColor = '#7c3aed'}
              onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}>
              <div style={{ width:'26px', height:'26px', borderRadius:'50%', background:'linear-gradient(135deg,#7c3aed,#4c1d95)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:'11px', fontWeight:'800', overflow:'hidden' }}>
                {esAdmin && adminFoto ? <img src={adminFoto} alt="Admin" style={{width:'100%',height:'100%',objectFit:'cover'}} /> : (!esAdmin && publicFoto ? <img src={publicFoto} alt="Cliente" style={{width:'100%',height:'100%',objectFit:'cover'}} /> : (usuario?.nombre?.[0]?.toUpperCase() || (esAdmin ? 'A' : 'C')))}
              </div>
              <div>
                <p style={{ margin:0, fontSize:'12px', fontWeight:'600', color:'var(--text)', lineHeight:1.2 }}>
                  {usuario?.nombre?.split(' ')[0] || (esAdmin ? 'Admin' : 'Cliente')}
                </p>
                <p style={{ margin:0, fontSize:'10px', color:'var(--muted)', lineHeight:1 }}>
                  {esAdmin ? 'Administrador' : 'Mi cuenta'}
                </p>
              </div>
              <span style={{ color:'var(--muted)', fontSize:'10px' }}>▾</span>
            </div>
          </div>
        </header>

        {/* CONTENIDO */}
        <section className="pg-theme-fade pg-app-content" style={{ flex:1, padding:'24px', background:'var(--bg)' }}>
          <Outlet />
        </section>
      </main>
      <LogoutConfirmModal
        open={logoutOpen}
        onCancel={() => setLogoutOpen(false)}
        onConfirm={confirmarCerrarSesion}
      />
    </div>
  );
}
