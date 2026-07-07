import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { apiFetch } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Registro() {
  const navigate = useNavigate();
  const location = useLocation();
  const { tema } = useTheme();
  const rawReturnTo = new URLSearchParams(location.search).get('return') || sessionStorage.getItem('partgo_return_after_login') || localStorage.getItem('partgo_return_after_login') || '';
  const returnTo = (!rawReturnTo || rawReturnTo === '/' || rawReturnTo === '/login' || rawReturnTo === '/registro') ? '/inicio' : rawReturnTo;
  const { loginSocialLocal } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ nombre:'', email:'', password:'', documento:'', telefono:'', direccion:'' });
  const [adminLogoRegistro, setAdminLogoRegistro] = useState(() => localStorage.getItem('partgo_admin_logo') || '/logo-dorada-motors.png');
  const change = e => setForm({ ...form, [e.target.name]: e.target.value });

  useEffect(() => {
    const syncLogo = () => setAdminLogoRegistro(localStorage.getItem('partgo_admin_logo') || '/logo-dorada-motors.png');
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

  const swalBg = tema === 'claro' ? '#ffffff' : '#0e0e1a';
  const swalColor = tema === 'claro' ? '#0f172a' : 'white';

  const registrar = async e => {
    e.preventDefault();
    if (form.password.length < 6) return Swal.fire({ icon:'warning', title:'La contraseña debe tener al menos 6 caracteres.', confirmButtonColor:'#7c3aed', background:swalBg, color:swalColor });
    try {
      setLoading(true);
      try {
        await apiFetch('/auth/register', { method:'POST', body:JSON.stringify(form) });
      } catch {
        // Si el backend está apagado, igual creamos sesión local para que el frontend funcione en demo.
      }

      loginSocialLocal('Registro', {
        id: Date.now(),
        nombre: form.nombre,
        email: form.email,
        telefono: form.telefono,
        direccion: form.direccion,
        documento: form.documento,
        foto: ''
      });

      localStorage.removeItem('partgo_return_after_login');
      sessionStorage.removeItem('partgo_return_after_login');

      await Swal.fire({ icon:'success', title:'¡Cuenta creada! 🎉', text:'Bienvenido a Dorada Motor’s.', timer:1100, showConfirmButton:false, background:swalBg, color:swalColor });
      navigate(returnTo || '/inicio', { replace:true });
    } catch (err) {
      Swal.fire({ icon:'error', title:'Error al registrar', text:err.message, confirmButtonColor:'#7c3aed', background:swalBg, color:swalColor });
    } finally { setLoading(false); }
  };

  const inputStyle = { width:'100%', padding:'13px 16px', background:'var(--rg-input-bg)', border:'1.5px solid var(--rg-input-border)', borderRadius:'10px', color:'var(--rg-heading)', fontSize:'14px', outline:'none', fontFamily:"'Inter',sans-serif", boxSizing:'border-box', transition:'border-color .2s,box-shadow .2s' };
  const labelStyle = { display:'block', color:'var(--rg-label)', fontSize:'12px', fontWeight:'600', marginBottom:'8px', textTransform:'uppercase', letterSpacing:'.06em' };

  return (
    <>
      <style>{`
        @keyframes regSlide { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:none} }
        @keyframes pgGradMove { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes pgSpin { to{transform:rotate(360deg)} }
        .reg-shell{
          --rg-page-bg:linear-gradient(135deg,#0f0c29,#302b63,#24243e);
          --rg-card-bg:rgba(14,14,26,.96);
          --rg-card-border:rgba(124,58,237,.25);
          --rg-card-shadow:0 20px 60px rgba(124,58,237,.18);
          --rg-heading:#ffffff;
          --rg-sub:#6b7280;
          --rg-label:#9ca3af;
          --rg-input-bg:rgba(26,26,46,.9);
          --rg-input-border:#2d2d4e;
          --rg-link:#a78bfa;
          background:var(--rg-page-bg);
        }
        html.light-mode .reg-shell{
          --rg-page-bg:linear-gradient(135deg,#eef0ff,#f6f7ff,#ffffff);
          --rg-card-bg:#ffffff;
          --rg-card-border:rgba(124,58,237,.16);
          --rg-card-shadow:0 20px 50px rgba(99,77,189,.14);
          --rg-heading:#0f172a;
          --rg-sub:#64748b;
          --rg-label:#64748b;
          --rg-input-bg:#f6f7ff;
          --rg-input-border:#d8dcf2;
          --rg-link:#7c3aed;
        }
        .reg-input:focus { border-color:#7c3aed!important; box-shadow:0 0 0 3px rgba(124,58,237,.2)!important; }
        .reg-btn { width:100%; padding:14px; background:linear-gradient(135deg,#7c3aed 0%,#9333ea 50%,#7c3aed 100%); background-size:200% 200%; animation:pgGradMove 3s ease infinite; color:white; border:none; border-radius:10px; font-size:15px; font-weight:700; cursor:pointer; font-family:'Inter',sans-serif; box-shadow:0 4px 20px rgba(124,58,237,.45); transition:transform .15s; }
        .reg-btn:hover:not(:disabled) { transform:translateY(-2px); }
        .reg-btn:disabled { opacity:.6; cursor:not-allowed; animation:none; }
      `}</style>

      <div className="reg-shell" style={{ display:'flex', minHeight:'100vh', fontFamily:"'Inter',sans-serif", alignItems:'center', justifyContent:'center', padding:'24px' }}>
        <div style={{ animation:'regSlide .65s cubic-bezier(.22,1,.36,1)', width:'100%', maxWidth:'520px', background:'var(--rg-card-bg)', border:'1px solid var(--rg-card-border)', borderRadius:'20px', padding:'44px 44px', boxShadow:'var(--rg-card-shadow)' }}>
          {/* Logo */}
          <Link to="/" style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'32px', textDecoration:'none' }}>
            <div style={{ width:'40px', height:'40px', background:'linear-gradient(135deg,#7c3aed,#4c1d95)', borderRadius:'11px', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:'20px', fontWeight:'900', boxShadow:'0 4px 14px rgba(124,58,237,.4)', overflow:'hidden' }}>{adminLogoRegistro ? <img src={adminLogoRegistro} alt="Logo Dorada Motor’s" style={{width:'100%',height:'100%',objectFit:'cover'}} /> : '⚡'}</div>
            <span style={{ color:'var(--rg-heading)', fontWeight:'800', fontSize:'22px', letterSpacing:'-0.4px' }}>Dorada Motor’s</span>
          </Link>

          <h2 style={{ color:'var(--rg-heading)', fontWeight:'800', fontSize:'26px', margin:'0 0 6px', letterSpacing:'-0.4px' }}>Crea tu cuenta</h2>
          <p style={{ color:'var(--rg-sub)', fontSize:'14px', margin:'0 0 30px' }}>Regístrate gratis y empieza a comprar repuestos.</p>

          <form onSubmit={registrar}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
              {/* Nombre */}
              <div style={{ gridColumn:'1/-1' }}>
                <label style={labelStyle}>Nombre completo *</label>
                <input className="reg-input" style={inputStyle} name="nombre" placeholder="Juan Pérez" value={form.nombre} onChange={change} required/>
              </div>
              {/* Email */}
              <div>
                <label style={labelStyle}>Correo electrónico *</label>
                <input className="reg-input" style={inputStyle} name="email" type="email" placeholder="juan@email.com" value={form.email} onChange={change} required/>
              </div>
              {/* Password */}
              <div style={{ position:'relative' }}>
                <label style={labelStyle}>Contraseña *</label>
                <input className="reg-input" style={{ ...inputStyle, paddingRight:'48px' }} name="password" type={showPass?'text':'password'} placeholder="Mín. 6 caracteres" value={form.password} onChange={change} required/>
                <button type="button" onClick={()=>setShowPass(v=>!v)} style={{ position:'absolute', right:'14px', top:'40px', background:'none', border:'none', color:'var(--rg-sub)', cursor:'pointer', fontSize:'16px' }}>{showPass?'🙈':'👁️'}</button>
              </div>
              {/* DNI */}
              <div>
                <label style={labelStyle}>DNI / RUC</label>
                <input className="reg-input" style={inputStyle} name="documento" placeholder="12345678" value={form.documento} onChange={change}/>
              </div>
              {/* Teléfono */}
              <div>
                <label style={labelStyle}>Teléfono</label>
                <input className="reg-input" style={inputStyle} name="telefono" placeholder="987 654 321" value={form.telefono} onChange={change}/>
              </div>
              {/* Dirección */}
              <div style={{ gridColumn:'1/-1' }}>
                <label style={labelStyle}>Dirección</label>
                <input className="reg-input" style={inputStyle} name="direccion" placeholder="Av. Los Próceres 123, Lima" value={form.direccion} onChange={change}/>
              </div>
            </div>

            <div style={{ marginTop:'24px' }}>
              <button type="submit" disabled={loading} className="reg-btn">
                {loading ? <span style={{ display:'flex', alignItems:'center', gap:'8px', justifyContent:'center' }}><span style={{ width:'16px', height:'16px', border:'2px solid rgba(255,255,255,.3)', borderTopColor:'white', borderRadius:'50%', display:'inline-block', animation:'pgSpin .7s linear infinite' }}/> Creando cuenta...</span> : 'Crear cuenta gratis'}
              </button>
            </div>
          </form>

          <p style={{ textAlign:'center', color:'var(--rg-sub)', fontSize:'13px', marginTop:'20px' }}>
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" style={{ color:'var(--rg-link)', fontWeight:'600' }}>Inicia sesión →</Link>
          </p>
        </div>
      </div>
    </>
  );
}
