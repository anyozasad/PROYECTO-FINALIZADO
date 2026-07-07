import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const GOOGLE_CLIENT_ID = '586863272224-h50c2d5oae25r3u9rqnfoij46cvtoh66.apps.googleusercontent.com';
const FACEBOOK_APP_ID = '2510498582724125';

const FEATURES = [
  { icon:'🛡️', title:'Repuestos confiables', desc:'Calidad revisada antes de comprar' },
  { icon:'🚚', title:'Envíos rápidos', desc:'Atención para pedidos y entregas' },
  { icon:'✅', title:'Compra segura', desc:'Tus datos y pagos protegidos' },
];

function cargarScriptOAuth(id, src) {
  return new Promise((resolve, reject) => {
    if (document.getElementById(id)) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
    document.body.appendChild(script);
  });
}

const TRUST = [
  { icon:'🛡️', title:'Sitio 100% seguro', desc:'Tus datos están protegidos' },
  { icon:'🎧', title:'Soporte 24/7', desc:'Siempre estamos para ayudarte' },
  { icon:'🔒', title:'Pagos seguros', desc:'Compra con total tranquilidad' },
];

export default function Login() {
  const { login, loginSocialLocal, isAuth, usuario } = useAuth();
  const { tema } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email:'', password:'', recordar:false });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [socialLoading, setSocialLoading] = useState('');
  const [mounted, setMounted] = useState(false);
  const [adminLogoLogin, setAdminLogoLogin] = useState(() => localStorage.getItem('partgo_admin_logo') || '/logo-dorada-motors.png');
  const rawReturnTo = new URLSearchParams(location.search).get('return') || sessionStorage.getItem('partgo_return_after_login') || localStorage.getItem('partgo_return_after_login') || '';
  const normalizarRetorno = (ruta) => {
    if (!ruta || ruta === '/login' || ruta === '/registro') return '/inicio';
    if (ruta.startsWith('/s/')) return ruta;
    if (ruta === '/') return '/inicio';
    return ruta;
  };
  const returnTo = normalizarRetorno(rawReturnTo);

  useEffect(() => {
    const syncLogo = () => setAdminLogoLogin(localStorage.getItem('partgo_admin_logo') || '/logo-dorada-motors.png');
    syncLogo();
    window.addEventListener('storage', syncLogo);
    window.addEventListener('partgo_admin_profile_changed', syncLogo);
    window.addEventListener('partgo_empresa_changed', syncLogo);
    return () => {
      window.removeEventListener('storage', syncLogo);
      window.removeEventListener('partgo_admin_profile_changed', syncLogo);
      window.removeEventListener('partgo_empresa_changed', syncLogo);
    };
  }, []);

  useEffect(() => {
    setMounted(true);
    if (isAuth) {
      navigate([1,2].includes(Number(usuario?.rol_id)) ? '/dashboard' : (returnTo || '/inicio'), { replace:true });
    }
  }, [isAuth, usuario, navigate, returnTo]);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const d = await login(form.email, form.password);
      const destino = [1,2].includes(Number(d?.usuario?.rol_id)) ? '/dashboard' : (returnTo || '/inicio');
      localStorage.removeItem('partgo_return_after_login');
      sessionStorage.removeItem('partgo_return_after_login');
      navigate(destino, { replace:true });
    } catch (err) {
      Swal.fire({
        icon:'error',
        title:'Acceso denegado',
        text:err.message || 'Correo o contraseña incorrectos',
        confirmButtonColor:'#7c3aed',
        background: tema === 'claro' ? '#ffffff' : '#0e0e1a',
        color: tema === 'claro' ? '#0f172a' : '#fff'
      });
    } finally {
      setLoading(false);
    }
  };


  const finalizarLoginSocial = (provider, payload) => {
    const data = loginSocialLocal(provider, payload);
    window.dispatchEvent(new Event('partgo_auth_changed'));
    window.dispatchEvent(new Event('partgo_public_profile_changed'));
    localStorage.removeItem('partgo_return_after_login');
    sessionStorage.removeItem('partgo_return_after_login');
    navigate(returnTo || '/inicio', { replace:true });
    return data;
  };

  const loginGoogleOficial = async () => {
    setSocialLoading('Google');

    try {
      await cargarScriptOAuth('google-identity-services', 'https://accounts.google.com/gsi/client');

      if (!window.google?.accounts?.oauth2) {
        throw new Error('Google Identity Services no cargó correctamente.');
      }

      const tokenResponse = await new Promise((resolve, reject) => {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'openid email profile',
          prompt: 'select_account',
          callback: (response) => {
            if (response?.error) {
              reject(new Error(response.error_description || response.error));
              return;
            }
            resolve(response);
          },
          error_callback: (error) => {
            reject(new Error(error?.message || error?.type || 'Google canceló el inicio de sesión.'));
          }
        });

        client.requestAccessToken();
      });

      const perfil = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
      }).then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error_description || 'No se pudo leer el perfil de Google.');
        return data;
      });

      finalizarLoginSocial('Google', {
        id: perfil.sub,
        nombre: perfil.name || 'Cliente Google',
        email: perfil.email || 'cliente.google@partgo.com',
        foto: perfil.picture || '',
        accessToken: tokenResponse.access_token
      });
    } catch (error) {
      Swal.fire({
        icon:'error',
        title:'Google no permitió iniciar sesión',
        html:`<div style="text-align:left;line-height:1.55">
          <b>Detalle:</b> ${error.message || 'No se pudo completar el login.'}<br><br>
          Verifica en Google Cloud que este Client ID tenga agregado:
          <br>• <b>JavaScript origin:</b> http://localhost:5173
          <br>• También tu dominio cuando lo publiques.
        </div>`,
        confirmButtonColor:'#7c3aed',
        background: tema === 'claro' ? '#ffffff' : '#0e0e1a',
        color: tema === 'claro' ? '#0f172a' : 'white'
      });
    } finally {
      setSocialLoading('');
    }
  };

  const iniciarFacebookSDK = async () => {
    await cargarScriptOAuth('facebook-jssdk', 'https://connect.facebook.net/es_LA/sdk.js');

    await new Promise((resolve) => {
      const init = () => {
        if (window.FB) {
          window.FB.init({
            appId: FACEBOOK_APP_ID,
            cookie: true,
            xfbml: false,
            version: 'v20.0'
          });
          resolve();
        }
      };

      if (window.FB) {
        init();
      } else {
        window.fbAsyncInit = init;
      }
    });
  };

  const loginFacebookOficial = async () => {
    setSocialLoading('Facebook');

    try {
      await iniciarFacebookSDK();

      const authResponse = await new Promise((resolve, reject) => {
        window.FB.login((response) => {
          if (response?.authResponse) {
            resolve(response.authResponse);
          } else {
            reject(new Error('Facebook canceló el inicio de sesión o la app no tiene permisos.'));
          }
        }, { scope: 'public_profile,email', return_scopes: true });
      });

      const perfil = await new Promise((resolve, reject) => {
        window.FB.api('/me', { fields: 'id,name,email,picture.type(large)' }, (response) => {
          if (!response || response.error) {
            reject(new Error(response?.error?.message || 'No se pudo leer el perfil de Facebook.'));
            return;
          }
          resolve(response);
        });
      });

      finalizarLoginSocial('Facebook', {
        id: perfil.id,
        nombre: perfil.name || 'Cliente Facebook',
        email: perfil.email || `cliente.facebook.${perfil.id}@partgo.com`,
        foto: perfil.picture?.data?.url || '',
        accessToken: authResponse.accessToken
      });
    } catch (error) {
      Swal.fire({
        icon:'error',
        title:'Facebook no permitió iniciar sesión',
        html:`<div style="text-align:left;line-height:1.55">
          <b>Detalle:</b> ${error.message || 'No se pudo completar el login.'}<br><br>
          Verifica en Meta Developers:
          <br>• App ID correcto: <b>${FACEBOOK_APP_ID}</b>
          <br>• Producto <b>Facebook Login</b> activado
          <br>• Dominio permitido: <b>localhost</b> o tu dominio publicado
          <br>• Si la app está en modo desarrollo, tu cuenta debe ser tester/admin.
        </div>`,
        confirmButtonColor:'#7c3aed',
        background: tema === 'claro' ? '#ffffff' : '#0e0e1a',
        color: tema === 'claro' ? '#0f172a' : 'white'
      });
    } finally {
      setSocialLoading('');
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

        @keyframes lgFade { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:none} }
        @keyframes lgLeft { from{opacity:0;transform:translateX(-18px)} to{opacity:1;transform:none} }
        @keyframes lgRight { from{opacity:0;transform:scale(1.04)} to{opacity:1;transform:scale(1)} }
        @keyframes lgSpin { to{transform:rotate(360deg)} }
        @keyframes lgGlow { 0%,100%{box-shadow:0 0 18px rgba(124,58,237,.35)} 50%{box-shadow:0 0 34px rgba(124,58,237,.7)} }
        @keyframes lgShine { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }

        .login-shell{
          min-height:100vh;
          background:#060811;
          display:flex;
          align-items:stretch;
          justify-content:center;
          font-family:'Inter',sans-serif;
          overflow:hidden;
          color:white;
        }
        html.light-mode .login-shell{ background:#f6f7ff; }
        .login-panel{
          width:390px;
          min-width:390px;
          --lg-heading:#ffffff;
          --lg-sub:#7b8498;
          --lg-label:#a9b2c7;
          --lg-input-bg:#1a1a2e;
          --lg-input-border:#2d2d4e;
          --lg-input-focus-bg:#1e1e35;
          --lg-placeholder:#596174;
          --lg-divider:#2d2d4e;
          --lg-link:#a78bfa;
          --lg-muted2:#596174;
          background:linear-gradient(180deg,#141428 0%,#10101f 100%);
          border-right:1px solid rgba(255,255,255,.07);
          color:var(--lg-heading);
          padding:36px 42px;
          display:flex;
          flex-direction:column;
          justify-content:center;
          position:relative;
          z-index:2;
          animation:lgLeft .55s ease both;
        }
        html.light-mode .login-panel{
          --lg-heading:#0f172a;
          --lg-sub:#64748b;
          --lg-label:#475569;
          --lg-input-bg:#f6f7ff;
          --lg-input-border:#d8dcf2;
          --lg-input-focus-bg:#ffffff;
          --lg-placeholder:#94a3b8;
          --lg-divider:#dde1f5;
          --lg-link:#7c3aed;
          --lg-muted2:#7c869c;
          background:linear-gradient(180deg,#ffffff 0%,#f6f7ff 100%);
          border-right:1px solid rgba(15,23,42,.08);
        }
        .login-panel::before{
          content:'';
          position:absolute;
          inset:0;
          background:radial-gradient(circle at 50% 8%,rgba(124,58,237,.15),transparent 32%);
          pointer-events:none;
        }
        .login-hero{
          flex:1;
          min-width:0;
          position:relative;
          background-image:
            linear-gradient(90deg,rgba(6,8,17,.94) 0%,rgba(10,8,25,.70) 34%,rgba(21,8,52,.40) 66%,rgba(6,8,17,.18) 100%),
            linear-gradient(180deg,rgba(10,4,26,.45),rgba(10,4,26,.75)),
            url('/IMAGENES/login-fondo-repuestos.png');
          background-size:cover;
          background-position:center right;
          overflow:hidden;
          animation:lgRight .7s ease both;
        }
        .login-hero::before{
          content:'';
          position:absolute;
          inset:0;
          background:
            radial-gradient(circle at 70% 18%,rgba(124,58,237,.42),transparent 26%),
            radial-gradient(circle at 45% 62%,rgba(59,130,246,.20),transparent 34%),
            linear-gradient(135deg,rgba(124,58,237,.16),rgba(6,8,17,.30));
          pointer-events:none;
        }
        .login-hero::after{
          content:'';
          position:absolute;
          inset:0;
          background:linear-gradient(90deg,#060811 0%,transparent 18%,transparent 84%,rgba(6,8,17,.66) 100%);
          pointer-events:none;
        }
        .login-copy{
          position:relative;
          z-index:1;
          height:100%;
          display:flex;
          flex-direction:column;
          justify-content:center;
          padding:58px 68px;
          max-width:620px;
          animation:lgFade .65s ease .15s both;
        }
        .login-brand{
          display:flex;
          align-items:center;
          gap:10px;
          justify-content:center;
          margin-bottom:32px;
          position:relative;
          z-index:1;
        }
        .login-logo{
          width:38px;
          height:38px;
          background:linear-gradient(135deg,#8b5cf6,#4c1d95);
          border-radius:11px;
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:20px;
          font-weight:900;
          animation:lgGlow 3s ease-in-out infinite;
        }
        .login-input{
          width:100%;
          background:var(--lg-input-bg);
          border:1.5px solid var(--lg-input-border);
          border-radius:11px;
          color:var(--lg-heading);
          font-size:14px;
          outline:none;
          font-family:'Inter',sans-serif;
          transition:border-color .2s,box-shadow .2s,background .2s;
        }
        .login-input:focus{border-color:#8b5cf6!important;box-shadow:0 0 0 3px rgba(124,58,237,.2)!important;background:var(--lg-input-focus-bg)}
        .login-input::placeholder{color:var(--lg-placeholder)!important}
        .login-primary{
          width:100%;
          padding:14px 20px;
          border:none;
          border-radius:11px;
          color:white;
          background:linear-gradient(135deg,#7c3aed 0%,#a855f7 48%,#7c3aed 100%);
          background-size:200% 200%;
          animation:lgShine 3.2s ease infinite;
          font-size:15px;
          font-weight:800;
          font-family:'Inter',sans-serif;
          cursor:pointer;
          box-shadow:0 10px 28px rgba(124,58,237,.34);
          transition:transform .15s,box-shadow .15s,opacity .15s;
          display:flex;
          align-items:center;
          justify-content:center;
          gap:8px;
        }
        .login-primary:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 14px 36px rgba(124,58,237,.48)}
        .login-primary:disabled{opacity:.65;cursor:not-allowed;animation:none}
        .login-social{
          flex:1;
          display:flex;
          align-items:center;
          justify-content:center;
          gap:9px;
          background:white;
          color:#111827;
          border:1.5px solid #e5e7eb;
          border-radius:10px;
          padding:11px 14px;
          font-size:13px;
          font-weight:700;
          cursor:pointer;
          font-family:'Inter',sans-serif;
          transition:all .15s;
        }
        .login-social:hover{transform:translateY(-1px);background:#f8fafc;box-shadow:0 8px 18px rgba(0,0,0,.12)}
        .login-social:disabled{opacity:.72;cursor:not-allowed;transform:none}
        .login-back{
          position:fixed;top:18px;right:18px;z-index:20;
          display:inline-flex;align-items:center;gap:8px;
          padding:10px 14px;border-radius:12px;
          border:1px solid rgba(255,255,255,.14);
          background:rgba(15,15,29,.76);color:#e5e7eb;
          font-size:13px;font-weight:800;font-family:'Inter',sans-serif;
          cursor:pointer;backdrop-filter:blur(12px);
          box-shadow:0 10px 24px rgba(0,0,0,.25);
          transition:transform .16s,border-color .16s,background .16s;
        }
        .login-back:hover{transform:translateY(-1px);border-color:rgba(168,85,247,.55);background:rgba(124,58,237,.18)}
        .feature-card{
          display:flex;
          align-items:center;
          gap:12px;
          padding:12px 14px;
          border:1px solid rgba(255,255,255,.11);
          border-radius:14px;
          background:rgba(13,15,29,.58);
          backdrop-filter:blur(10px);
          box-shadow:0 14px 34px rgba(0,0,0,.18);
          transition:transform .18s,border-color .18s,background .18s;
        }
        .feature-card:hover{transform:translateX(4px);border-color:rgba(168,85,247,.45);background:rgba(124,58,237,.18)}
        .trust-strip{
          position:absolute;
          left:390px;
          right:0;
          bottom:0;
          z-index:3;
          min-height:58px;
          border-top:1px solid rgba(255,255,255,.08);
          background:rgba(7,9,18,.82);
          backdrop-filter:blur(12px);
          display:flex;
          align-items:center;
          justify-content:center;
          gap:48px;
          padding:12px 24px;
        }
        @media(max-width:960px){
          .login-shell{overflow:auto;display:block;background:#060811}
          html.light-mode .login-shell{background:#f6f7ff}
          .login-panel{width:100%;min-width:0;max-width:none;min-height:auto;padding:30px 22px}
          .login-hero{min-height:440px}
          .login-copy{padding:42px 24px;max-width:none}
          .trust-strip{position:relative;left:0;right:auto;bottom:auto;flex-wrap:wrap;gap:18px}
        }
      `}</style>

      <div className="login-shell" style={{ opacity:mounted ? 1 : 0, transition:'opacity .25s' }}>
        <button type="button" className="login-back" onClick={() => navigate('/')}>
          ← Volver al inicio
        </button>
        <section className="login-panel">
          <div className="login-brand">
            <div className="login-logo">{adminLogoLogin ? <img src={adminLogoLogin} alt="Logo Dorada Motor’s" style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'11px'}} /> : '⚡'}</div>
            <span style={{fontSize:'22px',fontWeight:'900',letterSpacing:'-.4px'}}>Dorada Motor’s</span>
          </div>

          <div style={{textAlign:'center',marginBottom:'28px',position:'relative',zIndex:1}}>
            <h1 style={{fontSize:'25px',fontWeight:'900',margin:'0 0 7px',letterSpacing:'-.45px'}}>Bienvenido de nuevo</h1>
            <p style={{fontSize:'13px',color:'var(--lg-sub)',margin:0}}>Inicia sesión para continuar</p>
          </div>

          <form onSubmit={submit} style={{position:'relative',zIndex:1}}>
            <div style={{marginBottom:'17px'}}>
              <label style={{display:'block',fontSize:'13px',fontWeight:'600',color:'var(--lg-label)',marginBottom:'7px'}}>Correo electrónico</label>
              <div style={{position:'relative'}}>
                <span style={{position:'absolute',left:'13px',top:'50%',transform:'translateY(-50%)',fontSize:'15px',zIndex:1}}>✉️</span>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm({...form,email:e.target.value})}
                  placeholder="ejemplo@correo.com"
                  className="login-input"
                  style={{padding:'12px 14px 12px 40px'}}
                />
              </div>
            </div>

            <div style={{marginBottom:'14px'}}>
              <label style={{display:'block',fontSize:'13px',fontWeight:'600',color:'var(--lg-label)',marginBottom:'7px'}}>Contraseña</label>
              <div style={{position:'relative'}}>
                <span style={{position:'absolute',left:'13px',top:'50%',transform:'translateY(-50%)',fontSize:'15px',zIndex:1}}>🔒</span>
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={e => setForm({...form,password:e.target.value})}
                  placeholder="Ingresa tu contraseña"
                  className="login-input"
                  style={{padding:'12px 42px 12px 40px'}}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  style={{position:'absolute',right:'13px',top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',fontSize:'16px',color:'var(--lg-sub)',padding:0,zIndex:1}}
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'22px',gap:'10px'}}>
              <label style={{display:'flex',alignItems:'center',gap:'8px',cursor:'pointer',userSelect:'none'}}>
                <input
                  type="checkbox"
                  checked={form.recordar}
                  onChange={e => setForm({...form,recordar:e.target.checked})}
                  style={{accentColor:'#7c3aed',width:'16px',height:'16px'}}
                />
                <span style={{color:'var(--lg-label)',fontSize:'13px'}}>Recordarme</span>
              </label>
              <Link to="/recuperar-password" style={{color:'var(--lg-link)',fontSize:'13px',fontWeight:'700',textDecoration:'none'}}>
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <button type="submit" disabled={loading} className="login-primary">
              {loading ? (
                <>
                  <span style={{width:'16px',height:'16px',border:'2px solid rgba(255,255,255,.35)',borderTopColor:'white',borderRadius:'50%',display:'inline-block',animation:'lgSpin .7s linear infinite'}} />
                  Iniciando...
                </>
              ) : 'Iniciar sesión →'}
            </button>
          </form>

          <div style={{display:'flex',alignItems:'center',gap:'12px',margin:'18px 0',color:'var(--lg-muted2)',fontSize:'12px',position:'relative',zIndex:1}}>
            <div style={{flex:1,height:'1px',background:'var(--lg-divider)'}} />
            O continúa con
            <div style={{flex:1,height:'1px',background:'var(--lg-divider)'}} />
          </div>

          <div style={{display:'flex',gap:'10px',marginBottom:'20px',position:'relative',zIndex:1}}>
            <button type="button" className="login-social" disabled={socialLoading === 'Google'} onClick={loginGoogleOficial}>
              <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/></svg>
              {socialLoading === 'Google' ? 'Abriendo Google...' : 'Google'}
            </button>
            <button type="button" className="login-social" disabled={socialLoading === 'Facebook'} onClick={loginFacebookOficial}>
              <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#1877F2" d="M18 9a9 9 0 1 0-10.406 8.896v-6.294H5.309V9h2.285V7.019c0-2.255 1.343-3.502 3.4-3.502.985 0 2.015.176 2.015.176v2.217h-1.135c-1.119 0-1.468.694-1.468 1.407V9h2.5l-.399 2.602H10.406v6.294A9.003 9.003 0 0 0 18 9z"/></svg>
              {socialLoading === 'Facebook' ? 'Abriendo Facebook...' : 'Facebook'}
            </button>
          </div>

          <p style={{textAlign:'center',color:'var(--lg-sub)',fontSize:'13px',marginBottom:'18px',position:'relative',zIndex:1}}>
            ¿No tienes cuenta?{' '}
            <Link to={`/registro${returnTo ? `?return=${encodeURIComponent(returnTo)}` : ''}`} style={{color:'var(--lg-link)',fontWeight:'800',textDecoration:'none'}}>Regístrate</Link>
          </p>
        </section>

        <section className="login-hero">
          <div className="login-copy">
            <span style={{display:'inline-flex',alignItems:'center',gap:'7px',width:'fit-content',background:'rgba(245,158,11,.14)',border:'1px solid rgba(245,158,11,.34)',color:'#fbbf24',borderRadius:'999px',padding:'7px 14px',fontSize:'12px',fontWeight:'900',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:'20px'}}>
              ⚙️ Calidad que se nota
            </span>
            <h2 style={{fontSize:'clamp(36px,5vw,68px)',lineHeight:'1.02',fontWeight:'900',letterSpacing:'-1.6px',margin:'0 0 18px',maxWidth:'620px'}}>
              Repuestos de calidad para tu{' '}
              <span style={{background:'linear-gradient(135deg,#ffffff,#c4b5fd,#8b5cf6)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>motocicleta</span>
            </h2>
            <p style={{color:'#cbd5e1',fontSize:'15px',lineHeight:1.7,maxWidth:'490px',margin:'0 0 26px'}}>
              Ingresa a Dorada Motor’s y gestiona tus compras, pedidos, favoritos y boletas con una experiencia rápida y segura.
            </p>

            <div style={{display:'grid',gap:'11px',maxWidth:'430px'}}>
              {FEATURES.map((f) => (
                <div className="feature-card" key={f.title}>
                  <div style={{width:'40px',height:'40px',borderRadius:'12px',display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(135deg,#7c3aed,#4c1d95)',fontSize:'18px',flexShrink:0}}>{f.icon}</div>
                  <div>
                    <p style={{margin:'0 0 2px',fontSize:'14px',fontWeight:'900'}}>{f.title}</p>
                    <p style={{margin:0,fontSize:'12px',color:'#aeb8cc'}}>{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="trust-strip">
          {TRUST.map((t) => (
            <div key={t.title} style={{display:'flex',alignItems:'center',gap:'10px'}}>
              <span style={{fontSize:'20px',opacity:.85}}>{t.icon}</span>
              <div>
                <p style={{margin:0,fontSize:'13px',fontWeight:'900',color:'#e5e7eb'}}>{t.title}</p>
                <p style={{margin:0,fontSize:'11px',color:'#7b8498'}}>{t.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
