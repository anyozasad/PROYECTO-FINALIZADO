import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../services/api';
import Swal from 'sweetalert2';

const tabs = [
  { id:'tienda', label:'Información de la tienda', icon:'🏪' },
  { id:'admin', label:'Perfil del administrador', icon:'👤' },
  { id:'usuarios', label:'Usuarios y permisos', icon:'👥' },
  { id:'pagos', label:'Métodos de pago', icon:'💳' },
  { id:'envios', label:'Envíos y entregas', icon:'🚚' },
  { id:'seguridad', label:'Seguridad', icon:'🔒' },
  { id:'copia', label:'Copia de seguridad', icon:'💾' },
];

const DEFAULT_EMPRESA = {
  nombre:'PartGo Repuestos',
  email:'hola@partgo.com',
  telefono:'987 654 321',
  direccion:'Av. Los Próceres 123, San Miguel, Lima - Perú',
  moneda:'PEN - Sol Peruano',
  zona:'(GMT-05:00) Lima',
  descripcion:'Los mejores repuestos para tu moto, al mejor precio.',
  ruc:'20609999994',
  razonSocial:'PARTGO REPUESTOS E.I.R.L.'
};

const DEFAULT_ADMIN = {
  nombres:'Admin',
  apellidos:'PartGo',
  correo:'admin@gmail.com',
  telefono:'999 888 777',
  password:'',
  password2:''
};

const DEFAULT_ENVIOS = {
  delivery:true,
  recojo:true,
  costo:'10.00',
  gratisDesde:'250.00',
  tiempo:'24 - 48 horas'
};

const DEFAULT_SEGURIDAD = {
  dobleFactor:false,
  alertas:true,
  sesiones:true
};

const DEFAULT_METODOS = {
  Yape:true,
  Plin:true,
  Tarjeta:true,
  'Efectivo contra entrega':true
};

function leerJSON(key, fallback = {}) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const data = JSON.parse(raw);
    return data && typeof data === 'object' ? data : fallback;
  } catch (error) {
    console.warn(`No se pudo leer ${key}:`, error);
    return fallback;
  }
}

function guardarJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

const inputStyle = {
  background:'var(--input-bg)',
  border:'1px solid var(--border)',
  borderRadius:'10px',
  padding:'11px 14px',
  color:'var(--text)',
  fontSize:'14px',
  width:'100%',
  outline:'none',
  boxSizing:'border-box',
  transition:'border-color .18s ease, box-shadow .18s ease, transform .18s ease',
};

const labelStyle = {
  color:'var(--muted2)',
  fontSize:'12px',
  fontWeight:'700',
  display:'block',
  marginBottom:'7px',
  textTransform:'uppercase',
  letterSpacing:'0.04em',
};

const cardStyle = {
  background:'var(--card-bg)',
  border:'1px solid var(--border)',
  borderRadius:'16px',
  padding:'26px',
  boxShadow:'0 16px 36px rgba(0,0,0,.18)',
  animation:'pgConfigCardIn .28s ease both',
};

function toastBase() {
  return {
    background:'var(--card-bg)',
    color:'var(--text)',
    confirmButtonColor:'#7c3aed'
  };
}

function ActionButton({ children, onClick, danger = false, outline = false, disabled = false, title = '' }) {
  return (
    <button
      type="button"
      title={title}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`pg-config-btn ${outline ? 'pg-config-btn-outline' : ''} ${danger ? 'pg-config-btn-danger' : ''}`}
      style={{
        background: danger
          ? 'rgba(239,68,68,.14)'
          : outline
            ? 'transparent'
            : 'linear-gradient(135deg,#7c3aed,#9333ea)',
        color: danger ? '#fca5a5' : outline ? 'var(--purple-light)' : 'white',
        border: danger ? '1px solid rgba(239,68,68,.35)' : outline ? '1px solid var(--border2)' : 'none',
        borderRadius:'10px',
        padding:'10px 18px',
        fontSize:'13px',
        fontWeight:'800',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? .65 : 1,
        boxShadow: outline || danger ? 'none' : '0 8px 22px rgba(124,58,237,.28)',
        fontFamily:'Inter,sans-serif'
      }}
    >
      <span className="pg-btn-content">{children}</span>
    </button>
  );
}

function Field({ label, children }) {
  return (
    <div className="pg-field-anim">
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

export default function Empresa() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('tienda');
  const [form, setForm] = useState(() => ({
    ...DEFAULT_EMPRESA,
    ...leerJSON('partgo_empresa_config', {})
  }));
  const [admin, setAdmin] = useState(() => ({
    ...DEFAULT_ADMIN,
    ...leerJSON('partgo_admin_profile', {})
  }));
  const [envios, setEnvios] = useState(() => ({
    ...DEFAULT_ENVIOS,
    ...leerJSON('partgo_envios_config', {})
  }));
  const [seguridad, setSeguridad] = useState(() => ({
    ...DEFAULT_SEGURIDAD,
    ...leerJSON('partgo_seguridad_config', {})
  }));
  const [metodos, setMetodos] = useState(() => ({
    ...DEFAULT_METODOS,
    ...leerJSON('partgo_metodos_pago_config', {})
  }));
  const [historial, setHistorial] = useState(() => {
    const data = leerJSON('partgo_backup_historial', []);
    return Array.isArray(data) ? data : [];
  });
  const [saving, setSaving] = useState(false);
  const logoInputRef = useRef(null);
  const fotoInputRef = useRef(null);
  const backupInputRef = useRef(null);
  const [logoPreview, setLogoPreview] = useState(() => localStorage.getItem('partgo_admin_logo') || '');
  const [fotoPreview, setFotoPreview] = useState(() => localStorage.getItem('partgo_admin_foto') || '');

  const ok = (title, text = '') => Swal.fire({
    icon:'success',
    title: String(title || '').replace('✅','').trim(),
    text,
    timer:1300,
    showConfirmButton:false,
    width:'360px',
    customClass:{ popup:'pg-swal-center-clean', title:'pg-swal-title-clean' },
    ...toastBase()
  });

  const info = (title, text = '') => Swal.fire({
    icon:'info',
    title,
    text,
    ...toastBase()
  });

  const warn = (title, text = '') => Swal.fire({
    icon:'warning',
    title,
    text,
    ...toastBase()
  });

  const dispararCambiosEmpresa = () => {
    window.dispatchEvent(new Event('partgo_empresa_changed'));
    window.dispatchEvent(new Event('partgo_admin_profile_changed'));
  };

  const guardar = async () => {
    setSaving(true);
    guardarJSON('partgo_empresa_config', form);
    dispararCambiosEmpresa();
    try {
      await apiFetch('/empresa', { method:'PUT', body:JSON.stringify(form) });
    } catch {}
    setTimeout(() => {
      setSaving(false);
      ok('✅ Guardado', 'Configuración actualizada correctamente.');
    }, 650);
  };

  const leerImagen = (file, onReady) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      warn('Archivo inválido', 'Selecciona una imagen PNG, JPG o SVG.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      warn('Imagen muy pesada', 'Máximo 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onReady(reader.result);
    reader.readAsDataURL(file);
  };

  const cambiarLogo = () => logoInputRef.current?.click();

  const onLogoSeleccionado = (e) => {
    const file = e.target.files?.[0];
    leerImagen(file, (img) => {
      setLogoPreview(img);
      localStorage.setItem('partgo_admin_logo', img);
      dispararCambiosEmpresa();
      ok('Logo actualizado', 'El logo se actualizó en el panel y en el login.');
    });
    e.target.value = '';
  };

  const cambiarFotoAdmin = () => fotoInputRef.current?.click();

  const onFotoSeleccionada = (e) => {
    const file = e.target.files?.[0];
    leerImagen(file, (img) => {
      setFotoPreview(img);
      localStorage.setItem('partgo_admin_foto', img);
      dispararCambiosEmpresa();
      ok('Foto actualizada', 'La foto del administrador fue cargada correctamente.');
    });
    e.target.value = '';
  };

  const guardarAdmin = () => {
    if (!admin.nombres || !admin.correo) {
      return warn('Completa nombre y correo');
    }

    const adminSeguro = { ...admin, password:'', password2:'' };
    guardarJSON('partgo_admin_profile', adminSeguro);

    try {
      const usuario = leerJSON('partgo_usuario', {});
      if ([1,2].includes(Number(usuario?.rol_id))) {
        guardarJSON('partgo_usuario', {
          ...usuario,
          nombre: `${admin.nombres} ${admin.apellidos}`.trim(),
          email: admin.correo,
          telefono: admin.telefono,
          foto: fotoPreview || usuario.foto || ''
        });
      }
    } catch {}

    window.dispatchEvent(new Event('partgo_auth_changed'));
    dispararCambiosEmpresa();
    ok('Perfil actualizado', 'Los datos del administrador fueron guardados.');
  };

  const actualizarPassword = () => {
    if (!admin.password || admin.password.length < 6) {
      return warn('Contraseña muy corta', 'Usa mínimo 6 caracteres.');
    }
    if (admin.password !== admin.password2) {
      return Swal.fire({ icon:'error', title:'No coincide', text:'Confirma la misma contraseña.', ...toastBase() });
    }
    localStorage.setItem('partgo_admin_password_updated_at', new Date().toISOString());
    setAdmin(a => ({...a, password:'', password2:''}));
    ok('Contraseña actualizada', 'La nueva contraseña fue guardada.');
  };

  const cambiarMetodo = (metodo) => {
    setMetodos(prev => {
      const next = { ...prev, [metodo]: !prev[metodo] };
      guardarJSON('partgo_metodos_pago_config', next);
      window.dispatchEvent(new Event('partgo_payment_changed'));
      setTimeout(() => ok(`${metodo} ${next[metodo] ? 'activado' : 'desactivado'}`, 'El cambio quedó guardado.'), 80);
      return next;
    });
  };

  const guardarEnvios = () => {
    guardarJSON('partgo_envios_config', envios);
    window.dispatchEvent(new Event('partgo_envios_changed'));
    ok('Envíos actualizados', 'Las reglas de entrega fueron guardadas.');
  };

  const guardarSeguridad = () => {
    guardarJSON('partgo_seguridad_config', seguridad);
    window.dispatchEvent(new Event('partgo_seguridad_changed'));
    ok('Seguridad actualizada', 'La configuración de seguridad fue aplicada.');
  };

  const descargarBackup = () => {
    const backup = {
      empresa: form,
      admin: { ...admin, password:'', password2:'' },
      envios,
      seguridad,
      metodos,
      logo: localStorage.getItem('partgo_admin_logo') || '',
      fotoAdmin: localStorage.getItem('partgo_admin_foto') || '',
      generado: new Date().toISOString(),
      version:'PartGo Admin Config 1.0'
    };
    const contenido = JSON.stringify(backup, null, 2);
    const blob = new Blob([contenido], { type:'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `partgo-backup-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    const nuevo = [
      { fecha:new Date().toLocaleString('es-PE'), archivo:a.download, items:Object.keys(backup).length },
      ...historial
    ].slice(0, 8);
    setHistorial(nuevo);
    guardarJSON('partgo_backup_historial', nuevo);
    ok('Backup generado', 'Se descargó una copia de seguridad JSON.');
  };

  const restaurarBackup = () => {
    Swal.fire({
      icon:'question',
      title:'Restaurar copia',
      text:'Selecciona un archivo JSON de respaldo de PartGo.',
      showCancelButton:true,
      confirmButtonText:'Seleccionar archivo',
      cancelButtonText:'Cancelar',
      ...toastBase()
    }).then(r => {
      if (r.isConfirmed) backupInputRef.current?.click();
    });
  };

  const onBackupSeleccionado = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result || '{}'));
        if (data.empresa) {
          setForm({ ...DEFAULT_EMPRESA, ...data.empresa });
          guardarJSON('partgo_empresa_config', { ...DEFAULT_EMPRESA, ...data.empresa });
        }
        if (data.admin) {
          setAdmin({ ...DEFAULT_ADMIN, ...data.admin, password:'', password2:'' });
          guardarJSON('partgo_admin_profile', { ...DEFAULT_ADMIN, ...data.admin, password:'', password2:'' });
        }
        if (data.envios) {
          setEnvios({ ...DEFAULT_ENVIOS, ...data.envios });
          guardarJSON('partgo_envios_config', { ...DEFAULT_ENVIOS, ...data.envios });
        }
        if (data.seguridad) {
          setSeguridad({ ...DEFAULT_SEGURIDAD, ...data.seguridad });
          guardarJSON('partgo_seguridad_config', { ...DEFAULT_SEGURIDAD, ...data.seguridad });
        }
        if (data.metodos) {
          setMetodos({ ...DEFAULT_METODOS, ...data.metodos });
          guardarJSON('partgo_metodos_pago_config', { ...DEFAULT_METODOS, ...data.metodos });
        }
        if (data.logo) {
          setLogoPreview(data.logo);
          localStorage.setItem('partgo_admin_logo', data.logo);
        }
        if (data.fotoAdmin) {
          setFotoPreview(data.fotoAdmin);
          localStorage.setItem('partgo_admin_foto', data.fotoAdmin);
        }
        dispararCambiosEmpresa();
        ok('Copia restaurada', 'El respaldo se cargó correctamente.');
      } catch {
        Swal.fire({ icon:'error', title:'Archivo inválido', text:'El JSON no pertenece a un backup válido.', ...toastBase() });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const verHistorial = () => {
    const rows = historial.length
      ? historial.map((h, i) => `<tr><td style="padding:10px;border-bottom:1px solid rgba(148,163,184,.2)">${i+1}</td><td style="padding:10px;border-bottom:1px solid rgba(148,163,184,.2)">${h.fecha}</td><td style="padding:10px;border-bottom:1px solid rgba(148,163,184,.2)">${h.archivo}</td></tr>`).join('')
      : '<tr><td colspan="3" style="padding:16px;text-align:center;color:#94a3b8">Aún no hay respaldos generados.</td></tr>';

    Swal.fire({
      title:'Historial de respaldos',
      html:`<div style="text-align:left;overflow:auto"><table style="width:100%;border-collapse:collapse;font-size:13px"><thead><tr><th style="padding:10px;text-align:left">#</th><th style="padding:10px;text-align:left">Fecha</th><th style="padding:10px;text-align:left">Archivo</th></tr></thead><tbody>${rows}</tbody></table></div>`,
      width:720,
      ...toastBase()
    });
  };

  const toggle = (objSetter, key) => objSetter(prev => ({...prev, [key]: !prev[key]}));

  const tabActivo = tabs.find(t => t.id === tab);

  return (
    <div style={{fontFamily:'Inter,sans-serif', color:'var(--text)', animation:'pgPageIn .3s ease both'}}>
      <style>{`
        @keyframes pgPageIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pgConfigCardIn{from{opacity:0;transform:translateY(10px) scale(.992)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes pgPulseSoft{0%,100%{box-shadow:0 8px 22px rgba(124,58,237,.25)}50%{box-shadow:0 12px 30px rgba(124,58,237,.42)}}
        @keyframes pgIconPop{0%{transform:scale(.9) rotate(-4deg)}50%{transform:scale(1.08) rotate(3deg)}100%{transform:scale(1) rotate(0)}}
        .pg-config-btn{position:relative;overflow:hidden;transition:transform .18s ease,filter .18s ease,box-shadow .18s ease,border-color .18s ease!important;will-change:transform;}
        .pg-config-btn::after{content:"";position:absolute;inset:0;transform:translateX(-110%);background:linear-gradient(90deg,transparent,rgba(255,255,255,.22),transparent);transition:transform .45s ease;}
        .pg-config-btn:hover{transform:translateY(-2px);filter:brightness(1.06);box-shadow:0 12px 28px rgba(124,58,237,.32)!important;}
        .pg-config-btn:hover::after{transform:translateX(110%);}
        .pg-config-btn:active{transform:translateY(0) scale(.98);}
        .pg-config-btn-outline:hover{border-color:#7c3aed!important;background:rgba(124,58,237,.08)!important;}
        .pg-config-btn-danger:hover{box-shadow:0 10px 24px rgba(239,68,68,.18)!important;}
        .pg-btn-content{position:relative;z-index:1;display:inline-flex;align-items:center;gap:6px;justify-content:center;}
        .pg-tab-btn{transition:transform .18s ease,background .18s ease,color .18s ease,box-shadow .18s ease!important;position:relative;overflow:hidden;}
        .pg-tab-btn:hover{transform:translateX(4px);background:rgba(124,58,237,.10)!important;color:var(--text)!important;}
        .pg-tab-btn-active{animation:pgPulseSoft 2.8s ease infinite;}
        .pg-tab-btn:hover .pg-tab-icon{animation:pgIconPop .35s ease;}
        .admin-config-card{transition:transform .18s ease,border-color .18s ease,box-shadow .18s ease!important;}
        .admin-config-card:hover{transform:translateY(-3px);border-color:#7c3aed!important;box-shadow:0 14px 34px rgba(124,58,237,.18)!important;}
        .pg-field-anim{transition:transform .18s ease;}
        .pg-field-anim:focus-within{transform:translateY(-1px);}
        .pg-field-anim:focus-within input,.pg-field-anim:focus-within textarea,.pg-field-anim:focus-within select{border-color:#7c3aed!important;box-shadow:0 0 0 3px rgba(124,58,237,.13)!important;}
        .pg-status-row{transition:transform .18s ease,border-color .18s ease,background .18s ease;}
        .pg-status-row:hover{transform:translateY(-2px);border-color:#7c3aed!important;}
        .pg-logo-box{transition:transform .2s ease,box-shadow .2s ease,filter .2s ease;}
        .pg-logo-box:hover{transform:translateY(-3px) scale(1.02);filter:brightness(1.05);box-shadow:0 16px 35px rgba(124,58,237,.38)!important;}
      `}</style>

      <input ref={logoInputRef} type="file" accept="image/*" onChange={onLogoSeleccionado} style={{display:'none'}} />
      <input ref={fotoInputRef} type="file" accept="image/*" onChange={onFotoSeleccionada} style={{display:'none'}} />
      <input ref={backupInputRef} type="file" accept="application/json,.json" onChange={onBackupSeleccionado} style={{display:'none'}} />

      <div style={{marginBottom:'24px'}}>
        <h1 style={{fontSize:'24px', fontWeight:'900', margin:'0 0 4px', letterSpacing:'-0.3px', color:'var(--text)'}}>Configuración</h1>
        <p style={{color:'var(--muted2)', fontSize:'14px', margin:0}}>Gestiona los ajustes generales de tu tienda. Todos los botones tienen acción.</p>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'240px 1fr', gap:'24px', minHeight:'500px'}}>
        <div style={{background:'var(--card-bg)', border:'1px solid var(--border)', borderRadius:'16px', padding:'12px 10px', height:'fit-content'}}>
          {tabs.map(t => (
            <button key={t.id} type="button" onClick={() => setTab(t.id)} className={`pg-tab-btn ${tab===t.id ? 'pg-tab-btn-active' : ''}`} style={{
              display:'flex', alignItems:'center', gap:'10px', width:'100%',
              padding:'12px 14px', borderRadius:'10px', border:'none', cursor:'pointer',
              marginBottom:'4px', fontSize:'13px', textAlign:'left',
              background: tab===t.id ? 'linear-gradient(135deg,#7c3aed,#9333ea)' : 'transparent',
              color: tab===t.id ? 'white' : 'var(--muted2)', fontWeight: tab===t.id ? '800' : '500',
              boxShadow: tab===t.id ? '0 10px 24px rgba(124,58,237,.25)' : 'none'
            }}>
              <span className="pg-tab-icon" style={{fontSize:'16px', width:'22px', textAlign:'center'}}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        <div>
          {tab === 'tienda' && (
            <div style={cardStyle}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'26px'}}>
                <div>
                  <h2 style={{fontSize:'18px', fontWeight:'900', margin:'0 0 4px'}}>Información de la tienda</h2>
                  <p style={{color:'var(--muted)', fontSize:'13px', margin:0}}>Datos básicos del negocio</p>
                </div>
                <ActionButton onClick={guardar} disabled={saving}>{saving ? '⏳ Guardando...' : '💾 Guardar cambios'}</ActionButton>
              </div>

              <div style={{display:'grid', gridTemplateColumns:'200px 1fr', gap:'32px', alignItems:'flex-start'}}>
                <div style={{textAlign:'center'}}>
                  <div style={{color:'var(--muted2)', fontSize:'12px', fontWeight:'700', marginBottom:'10px', textTransform:'uppercase'}}>Logo de la tienda</div>
                  <div className="pg-logo-box" onClick={cambiarLogo} style={{background:'linear-gradient(135deg,#7c3aed,#4c1d95)', borderRadius:'18px', width:'110px', height:'110px', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px', boxShadow:'0 10px 26px rgba(124,58,237,0.35)', cursor:'pointer', overflow:'hidden'}}>
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo PartGo" style={{width:'100%', height:'100%', objectFit:'cover'}} />
                    ) : (
                      <span style={{fontSize:'44px', fontWeight:'900', color:'white'}}>⚡</span>
                    )}
                  </div>
                  <ActionButton onClick={cambiarLogo} outline>📁 Cambiar logo</ActionButton>
                  <p style={{color:'var(--muted)', fontSize:'10px', marginTop:'8px'}}>PNG, JPG o SVG. Máx. 2MB</p>
                </div>

                <div style={{display:'grid', gap:'16px'}}>
                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px'}}>
                    <Field label="Nombre de la tienda"><input value={form.nombre} onChange={e => setForm({...form, nombre:e.target.value})} style={inputStyle}/></Field>
                    <Field label="RUC"><input value={form.ruc} onChange={e => setForm({...form, ruc:e.target.value})} style={inputStyle}/></Field>
                  </div>
                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px'}}>
                    <Field label="Correo electrónico"><input value={form.email} onChange={e => setForm({...form, email:e.target.value})} style={inputStyle}/></Field>
                    <Field label="Teléfono"><input value={form.telefono} onChange={e => setForm({...form, telefono:e.target.value})} style={inputStyle}/></Field>
                  </div>
                  <Field label="Dirección"><input value={form.direccion} onChange={e => setForm({...form, direccion:e.target.value})} style={inputStyle}/></Field>
                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px'}}>
                    <Field label="Moneda"><select value={form.moneda} onChange={e => setForm({...form, moneda:e.target.value})} style={inputStyle}><option>PEN - Sol Peruano</option><option>USD - Dólar</option></select></Field>
                    <Field label="Zona horaria"><select value={form.zona} onChange={e => setForm({...form, zona:e.target.value})} style={inputStyle}><option>(GMT-05:00) Lima</option><option>(GMT-04:00) La Paz</option></select></Field>
                  </div>
                  <Field label="Descripción de la tienda"><textarea value={form.descripcion} onChange={e => setForm({...form, descripcion:e.target.value})} style={{...inputStyle, minHeight:'86px', resize:'vertical'}}/></Field>
                </div>
              </div>
            </div>
          )}

          {tab === 'admin' && (
            <div style={cardStyle}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px'}}>
                <div>
                  <h2 style={{fontSize:'18px', fontWeight:'900', margin:'0 0 4px'}}>Perfil del administrador</h2>
                  <p style={{color:'var(--muted)', fontSize:'13px', margin:0}}>Edita tu información y contraseña.</p>
                </div>
                <ActionButton onClick={guardarAdmin}>💾 Guardar perfil</ActionButton>
              </div>

              <div style={{display:'grid', gridTemplateColumns:'180px 1fr', gap:'30px'}}>
                <div style={{textAlign:'center'}}>
                  <div className="pg-logo-box" style={{width:'96px', height:'96px', borderRadius:'50%', background:'linear-gradient(135deg,#7c3aed,#4c1d95)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:'34px', fontWeight:'900', margin:'0 auto 12px', overflow:'hidden', cursor:'pointer'}} onClick={cambiarFotoAdmin}>
                    {fotoPreview ? (
                      <img src={fotoPreview} alt="Foto administrador" style={{width:'100%', height:'100%', objectFit:'cover'}} />
                    ) : 'A'}
                  </div>
                  <ActionButton onClick={cambiarFotoAdmin} outline>📷 Cambiar foto</ActionButton>
                </div>

                <div style={{display:'grid', gap:'16px'}}>
                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px'}}>
                    <Field label="Nombres"><input value={admin.nombres} onChange={e => setAdmin({...admin, nombres:e.target.value})} style={inputStyle}/></Field>
                    <Field label="Apellidos"><input value={admin.apellidos} onChange={e => setAdmin({...admin, apellidos:e.target.value})} style={inputStyle}/></Field>
                  </div>
                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px'}}>
                    <Field label="Correo"><input value={admin.correo} onChange={e => setAdmin({...admin, correo:e.target.value})} style={inputStyle}/></Field>
                    <Field label="Teléfono"><input value={admin.telefono} onChange={e => setAdmin({...admin, telefono:e.target.value})} style={inputStyle}/></Field>
                  </div>
                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr auto', gap:'14px', alignItems:'end'}}>
                    <Field label="Nueva contraseña"><input type="password" value={admin.password} onChange={e => setAdmin({...admin, password:e.target.value})} style={inputStyle}/></Field>
                    <Field label="Confirmar contraseña"><input type="password" value={admin.password2} onChange={e => setAdmin({...admin, password2:e.target.value})} style={inputStyle}/></Field>
                    <ActionButton onClick={actualizarPassword}>🔐 Actualizar</ActionButton>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'usuarios' && (
            <div style={cardStyle}>
              <h2 style={{fontSize:'18px', fontWeight:'900', margin:'0 0 6px'}}>Usuarios y permisos</h2>
              <p style={{color:'var(--muted)', margin:'0 0 20px'}}>Gestiona cuentas, roles y accesos del panel.</p>
              <div style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'16px'}}>
                <div className="admin-config-card" style={{background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'14px', padding:'18px'}}>
                  <h3 style={{margin:'0 0 8px'}}>👥 Usuarios</h3>
                  <p style={{color:'var(--muted)', fontSize:'13px'}}>Crear, editar o eliminar usuarios.</p>
                  <ActionButton onClick={() => navigate('/usuarios')}>Ir a Usuarios</ActionButton>
                </div>
                <div className="admin-config-card" style={{background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'14px', padding:'18px'}}>
                  <h3 style={{margin:'0 0 8px'}}>🔐 Roles</h3>
                  <p style={{color:'var(--muted)', fontSize:'13px'}}>Administra permisos del sistema.</p>
                  <ActionButton onClick={() => navigate('/roles')}>Ir a Roles</ActionButton>
                </div>
              </div>
            </div>
          )}

          {tab === 'pagos' && (
            <div style={cardStyle}>
              <h2 style={{fontSize:'18px', fontWeight:'900', margin:'0 0 6px'}}>Métodos de pago</h2>
              <p style={{color:'var(--muted)', margin:'0 0 20px'}}>Configura pagos por Yape, Plin, tarjeta o efectivo.</p>
              <div style={{display:'grid', gap:'14px'}}>
                {Object.keys(DEFAULT_METODOS).map(m => (
                  <div key={m} className="pg-status-row" style={{display:'flex', justifyContent:'space-between', alignItems:'center', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'12px', padding:'14px'}}>
                    <div>
                      <b>{m}</b>
                      <p style={{margin:'4px 0 0', color:'var(--muted)', fontSize:'12px'}}>{metodos[m] ? 'Disponible para clientes' : 'Oculto temporalmente'}</p>
                    </div>
                    <ActionButton onClick={() => cambiarMetodo(m)} outline={!metodos[m]}>{metodos[m] ? '✅ Activo' : 'Activar'}</ActionButton>
                  </div>
                ))}
              </div>
              <div style={{marginTop:'18px'}}><ActionButton onClick={() => navigate('/metodos-pago')}>Gestionar métodos avanzados</ActionButton></div>
            </div>
          )}

          {tab === 'envios' && (
            <div style={cardStyle}>
              <h2 style={{fontSize:'18px', fontWeight:'900', margin:'0 0 6px'}}>Envíos y entregas</h2>
              <p style={{color:'var(--muted)', margin:'0 0 20px'}}>Configura delivery, recojo y costos.</p>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px'}}>
                <Field label="Costo delivery"><input value={envios.costo} onChange={e => setEnvios({...envios,costo:e.target.value})} style={inputStyle}/></Field>
                <Field label="Gratis desde"><input value={envios.gratisDesde} onChange={e => setEnvios({...envios,gratisDesde:e.target.value})} style={inputStyle}/></Field>
                <Field label="Tiempo de entrega"><input value={envios.tiempo} onChange={e => setEnvios({...envios,tiempo:e.target.value})} style={inputStyle}/></Field>
                <div style={{display:'flex', gap:'10px', alignItems:'end'}}>
                  <ActionButton onClick={() => setEnvios({...envios,delivery:!envios.delivery})}>{envios.delivery ? '✅ Delivery activo' : '🚫 Delivery inactivo'}</ActionButton>
                  <ActionButton onClick={() => setEnvios({...envios,recojo:!envios.recojo})} outline>{envios.recojo ? '✅ Recojo activo' : '🚫 Recojo inactivo'}</ActionButton>
                </div>
              </div>
              <div style={{marginTop:'18px'}}><ActionButton onClick={guardarEnvios}>Guardar reglas de envío</ActionButton></div>
            </div>
          )}

          {tab === 'seguridad' && (
            <div style={cardStyle}>
              <h2 style={{fontSize:'18px', fontWeight:'900', margin:'0 0 6px'}}>Seguridad</h2>
              <p style={{color:'var(--muted)', margin:'0 0 20px'}}>Protege el acceso al panel administrador.</p>
              {[
                ['dobleFactor','Doble factor de autenticación'],
                ['alertas','Alertas por inicio de sesión'],
                ['sesiones','Control de sesiones activas']
              ].map(([k,l]) => (
                <div key={k} className="pg-status-row" style={{display:'flex', justifyContent:'space-between', alignItems:'center', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'12px', padding:'14px', marginBottom:'10px'}}>
                  <b>{l}</b>
                  <ActionButton onClick={() => toggle(setSeguridad,k)} outline={!seguridad[k]}>{seguridad[k] ? 'Activo' : 'Inactivo'}</ActionButton>
                </div>
              ))}
              <ActionButton onClick={guardarSeguridad}>Guardar seguridad</ActionButton>
            </div>
          )}

          {tab === 'copia' && (
            <div style={cardStyle}>
              <h2 style={{fontSize:'18px', fontWeight:'900', margin:'0 0 6px'}}>Copia de seguridad</h2>
              <p style={{color:'var(--muted)', margin:'0 0 20px'}}>Exporta o restaura configuración del sistema.</p>
              <div style={{display:'flex', gap:'12px', flexWrap:'wrap'}}>
                <ActionButton onClick={descargarBackup}>⬇️ Descargar respaldo</ActionButton>
                <ActionButton onClick={restaurarBackup} outline>🔁 Restaurar copia</ActionButton>
                <ActionButton onClick={verHistorial} outline>📋 Ver historial</ActionButton>
              </div>
              <p style={{margin:'16px 0 0', color:'var(--muted)', fontSize:'12px'}}>Se respaldan empresa, logo, foto de admin, envíos, pagos y seguridad.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
