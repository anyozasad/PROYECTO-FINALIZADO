import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { apiFetch } from '../services/api';
import { useTheme } from '../context/ThemeContext';

export default function RecuperarPassword() {
  const { tema } = useTheme();
  const [form, setForm] = useState({ email: '', nuevaPassword: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [adminLogoRecuperar, setAdminLogoRecuperar] = useState(() => localStorage.getItem('partgo_admin_logo') || '');

  useEffect(() => {
    const syncLogo = () => setAdminLogoRecuperar(localStorage.getItem('partgo_admin_logo') || '');
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

  const enviar = async (e) => {
    e.preventDefault();
    if (!form.email) return Swal.fire({ icon:'warning', title:'Correo obligatorio', text:'Ingresa tu correo registrado.', confirmButtonColor:'#7c3aed', background:swalBg, color:swalColor });

    try {
      setLoading(true);
      const data = await apiFetch('/auth/recuperar-password', {
        method: 'POST',
        body: JSON.stringify(form)
      });
      Swal.fire({ icon:'success', title:'Contraseña actualizada', text: data.password_temporal ? `Tu contraseña temporal es: ${data.password_temporal}` : 'Ya puedes iniciar sesión con tu nueva contraseña.', confirmButtonColor:'#7c3aed', background:swalBg, color:swalColor });
    } catch (error) {
      Swal.fire({ icon:'error', title:'No se pudo recuperar', text: error.message || 'Verifica tu correo.', confirmButtonColor:'#7c3aed', background:swalBg, color:swalColor });
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { width:'100%', padding:'13px 16px', background:'var(--rg-input-bg)', border:'1.5px solid var(--rg-input-border)', borderRadius:'10px', color:'var(--rg-heading)', fontSize:'14px', outline:'none', fontFamily:"'Inter',sans-serif", boxSizing:'border-box', transition:'border-color .2s,box-shadow .2s' };
  const labelStyle = { display:'block', color:'var(--rg-label)', fontSize:'12px', fontWeight:'600', marginBottom:'8px', textTransform:'uppercase', letterSpacing:'.06em' };

  return (
    <>
      <style>{`
        @keyframes regSlide { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:none} }
        @keyframes pgGradMove { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes pgSpin { to{transform:rotate(360deg)} }
        .rec-shell{
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
        html.light-mode .rec-shell{
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
        .rec-input:focus { border-color:#7c3aed!important; box-shadow:0 0 0 3px rgba(124,58,237,.2)!important; }
        .rec-btn { width:100%; padding:14px; background:linear-gradient(135deg,#7c3aed 0%,#9333ea 50%,#7c3aed 100%); background-size:200% 200%; animation:pgGradMove 3s ease infinite; color:white; border:none; border-radius:10px; font-size:15px; font-weight:700; cursor:pointer; font-family:'Inter',sans-serif; box-shadow:0 4px 20px rgba(124,58,237,.45); transition:transform .15s; }
        .rec-btn:hover:not(:disabled) { transform:translateY(-2px); }
        .rec-btn:disabled { opacity:.6; cursor:not-allowed; animation:none; }
      `}</style>

      <div className="rec-shell" style={{ display:'flex', minHeight:'100vh', fontFamily:"'Inter',sans-serif", alignItems:'center', justifyContent:'center', padding:'24px' }}>
        <div style={{ animation:'regSlide .65s cubic-bezier(.22,1,.36,1)', width:'100%', maxWidth:'460px', background:'var(--rg-card-bg)', border:'1px solid var(--rg-card-border)', borderRadius:'20px', padding:'44px 44px', boxShadow:'var(--rg-card-shadow)' }}>
          {/* Logo */}
          <Link to="/" style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'32px', textDecoration:'none' }}>
            <div style={{ width:'40px', height:'40px', background:'linear-gradient(135deg,#7c3aed,#4c1d95)', borderRadius:'11px', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:'20px', fontWeight:'900', boxShadow:'0 4px 14px rgba(124,58,237,.4)', overflow:'hidden' }}>
              {adminLogoRecuperar ? <img src={adminLogoRecuperar} alt="Logo Dorada Motor’s" style={{width:'100%',height:'100%',objectFit:'cover'}} /> : '⚡'}
            </div>
            <span style={{ color:'var(--rg-heading)', fontWeight:'800', fontSize:'22px', letterSpacing:'-0.4px' }}>Dorada Motor’s</span>
          </Link>

          <h2 style={{ color:'var(--rg-heading)', fontWeight:'800', fontSize:'26px', margin:'0 0 6px', letterSpacing:'-0.4px' }}>Recuperar contraseña</h2>
          <p style={{ color:'var(--rg-sub)', fontSize:'14px', margin:'0 0 30px', lineHeight:1.5 }}>Ingresa tu correo y una nueva contraseña. Si dejas la contraseña vacía, el sistema usará <strong style={{ color:'var(--rg-label)' }}>123456</strong> como temporal.</p>

          <form onSubmit={enviar}>
            <div style={{ marginBottom:'18px' }}>
              <label style={labelStyle}>Correo registrado</label>
              <input className="rec-input" style={inputStyle} type="email" placeholder="juan@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>

            <div style={{ marginBottom:'26px', position:'relative' }}>
              <label style={labelStyle}>Nueva contraseña</label>
              <input className="rec-input" style={{ ...inputStyle, paddingRight:'48px' }} type={showPass ? 'text' : 'password'} placeholder="Opcional · mín. 6 caracteres" value={form.nuevaPassword} onChange={(e) => setForm({ ...form, nuevaPassword: e.target.value })} />
              <button type="button" onClick={() => setShowPass(v => !v)} style={{ position:'absolute', right:'14px', top:'40px', background:'none', border:'none', color:'var(--rg-sub)', cursor:'pointer', fontSize:'16px' }}>{showPass ? '🙈' : '👁️'}</button>
            </div>

            <button type="submit" disabled={loading} className="rec-btn">
              {loading ? <span style={{ display:'flex', alignItems:'center', gap:'8px', justifyContent:'center' }}><span style={{ width:'16px', height:'16px', border:'2px solid rgba(255,255,255,.3)', borderTopColor:'white', borderRadius:'50%', display:'inline-block', animation:'pgSpin .7s linear infinite' }} /> Procesando...</span> : 'Actualizar contraseña'}
            </button>
          </form>

          <p style={{ textAlign:'center', color:'var(--rg-sub)', fontSize:'13px', marginTop:'20px' }}>
            <Link to="/login" style={{ color:'var(--rg-link)', fontWeight:'600' }}>← Volver al login</Link>
          </p>
        </div>
      </div>
    </>
  );
}
