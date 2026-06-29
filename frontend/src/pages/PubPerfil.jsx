import { useEffect, useMemo, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import { useAuth } from '../context/AuthContext';

const perfilVacio = {
  nombre: 'Cliente PartGo',
  email: 'cliente@partgo.com',
  telefono: '',
  direccion: '',
  documento: ''
};

function formDesdeUsuario(usuario = {}) {
  return {
    nombre: usuario.nombre || usuario.name || perfilVacio.nombre,
    email: usuario.email || usuario.correo || perfilVacio.email,
    telefono: usuario.telefono || usuario.phone || '',
    direccion: usuario.direccion || usuario.address || '',
    documento: usuario.documento || usuario.dni || usuario.ruc || ''
  };
}

export default function PubPerfil(){
  const { usuario, updateUsuario } = useAuth();
  const [form,setForm]=useState(() => formDesdeUsuario(usuario));
  const [editing,setEditing]=useState(false);
  const [saving,setSaving]=useState(false);
  const fotoRef = useRef(null);
  const [foto,setFoto]=useState(() => localStorage.getItem('partgo_public_foto') || usuario?.foto || usuario?.picture || '');

  const iniciales = useMemo(() => {
    return (form.nombre || 'Cliente')
      .split(' ')
      .filter(Boolean)
      .map(n => n[0])
      .join('')
      .slice(0,2)
      .toUpperCase();
  }, [form.nombre]);

  useEffect(() => {
    setForm(formDesdeUsuario(usuario));
    setFoto(localStorage.getItem('partgo_public_foto') || usuario?.foto || usuario?.picture || '');
  }, [usuario]);

  const change=e=>setForm(f=>({...f,[e.target.name]:e.target.value}));

  const abrirFoto = () => fotoRef.current?.click();

  const cambiarFoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      Swal.fire({icon:'warning',title:'Selecciona una imagen válida',confirmButtonColor:'#7c3aed',background:'var(--pg-surface)',color:'var(--pg-text)'});
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      Swal.fire({icon:'warning',title:'Imagen muy pesada',text:'Máximo 2MB.',confirmButtonColor:'#7c3aed',background:'var(--pg-surface)',color:'var(--pg-text)'});
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const img = String(reader.result || '');
      setFoto(img);
      localStorage.setItem('partgo_public_foto', img);
      updateUsuario?.({ foto: img });
      window.dispatchEvent(new Event('partgo_public_profile_changed'));
      Swal.fire({icon:'success',title:'Foto actualizada',timer:1200,showConfirmButton:false,background:'var(--pg-surface)',color:'var(--pg-text)'});
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const guardar=async()=>{
    setSaving(true);
    await new Promise(r=>setTimeout(r,600));
    updateUsuario?.({ ...form, foto });
    setSaving(false);
    setEditing(false);
    Swal.fire({icon:'success',title:'Perfil actualizado',timer:1500,showConfirmButton:false,background:'var(--pg-surface)',color:'var(--pg-text)'});
  };

  const inp={width:'100%',background:'var(--pg-input)',border:'1.5px solid var(--pg-border2)',borderRadius:'9px',padding:'11px 14px',color:'var(--pg-text)',fontSize:'13px',outline:'none',fontFamily:"'Inter',sans-serif",boxSizing:'border-box',transition:'border-color .2s'};
  const lbl={display:'block',fontSize:'11px',fontWeight:'700',color:'var(--pg-muted)',marginBottom:'7px',textTransform:'uppercase',letterSpacing:'.05em'};

  return(
    <div style={{padding:'26px 28px',fontFamily:"'Inter',sans-serif",color:'var(--pg-text)',background:'var(--pg-bg)',minHeight:'100%'}}>
      <input ref={fotoRef} type="file" accept="image/*" onChange={cambiarFoto} style={{display:'none'}} />

      <div style={{marginBottom:'24px'}}>
        <h1 style={{margin:'0 0 4px',fontSize:'22px',fontWeight:'800'}}>Mi perfil</h1>
        <p style={{margin:0,color:'var(--pg-muted)',fontSize:'13px'}}>Administra tu información personal</p>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'240px 1fr',gap:'22px'}}>
        <div style={{background:'var(--pg-card)',border:'1px solid var(--pg-border)',borderRadius:'16px',padding:'24px',textAlign:'center',display:'flex',flexDirection:'column',alignItems:'center',gap:'14px'}}>
          <div style={{width:'90px',height:'90px',borderRadius:'50%',background:'linear-gradient(135deg,#7c3aed,#4c1d95)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'34px',fontWeight:'900',color:'white',border:'3px solid #7c3aed',boxShadow:'0 10px 26px rgba(124,58,237,.25)',overflow:'hidden'}}>
            {foto ? <img src={foto} alt="Foto de perfil" style={{width:'100%',height:'100%',objectFit:'cover'}} /> : iniciales}
          </div>

          <div>
            <h3 style={{margin:'0 0 4px',fontSize:'16px',fontWeight:'700'}}>{form.nombre}</h3>
            <p style={{margin:'0 0 2px',fontSize:'12px',color:'var(--pg-muted)'}}>{form.email}</p>
            <p style={{margin:0,fontSize:'12px',color:'var(--pg-muted)'}}>{form.telefono || 'Teléfono no registrado'}</p>
          </div>

          <button onClick={abrirFoto} style={{width:'100%',padding:'9px',background:'rgba(124,58,237,.15)',border:'1px solid rgba(124,58,237,.3)',borderRadius:'9px',color:'#a78bfa',fontSize:'12px',fontWeight:'600',cursor:'pointer',fontFamily:"'Inter',sans-serif",transition:'all .2s'}}
            onMouseOver={e=>{e.currentTarget.style.background='rgba(124,58,237,.3)';}} onMouseOut={e=>e.currentTarget.style.background='rgba(124,58,237,.15)'}>
            📷 Editar foto
          </button>

          <div style={{width:'100%',padding:'14px',background:'var(--pg-input)',borderRadius:'10px',border:'1px solid var(--pg-border2)',textAlign:'left'}}>
            <p style={{margin:'0 0 10px',fontSize:'11px',fontWeight:'700',color:'var(--pg-muted)',textTransform:'uppercase',letterSpacing:'.05em'}}>Resumen</p>
            {[{v:'12',l:'Pedidos'},{v:'S/ 1,234.50',l:'Gastado'},{v:'8',l:'Favoritos'},{v:'2',l:'Cupones'}].map(s=>(
              <div key={s.l} style={{display:'flex',justifyContent:'space-between',paddingBottom:'6px',marginBottom:'6px',borderBottom:'1px solid var(--pg-border2)'}}>
                <span style={{fontSize:'12px',color:'var(--pg-muted2)'}}>{s.l}</span>
                <span style={{fontSize:'12px',fontWeight:'700',color:'var(--pg-text)'}}>{s.v}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{background:'var(--pg-card)',border:'1px solid var(--pg-border)',borderRadius:'16px',padding:'24px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'22px'}}>
            <h3 style={{margin:0,fontSize:'16px',fontWeight:'700'}}>Información personal</h3>
            <button onClick={()=>setEditing(e=>!e)} style={{background:editing?'rgba(239,68,68,.12)':'rgba(124,58,237,.15)',color:editing?'#ef4444':'#a78bfa',border:`1px solid ${editing?'rgba(239,68,68,.3)':'rgba(124,58,237,.3)'}`,borderRadius:'9px',padding:'9px 13px',fontWeight:'700',cursor:'pointer',fontFamily:"'Inter',sans-serif"}}>
              {editing?'✕ Cancelar':'✏️ Editar'}
            </button>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px'}}>
            {[
              {n:'nombre',   l:'Nombre completo'},
              {n:'email',    l:'Correo electrónico'},
              {n:'telefono', l:'Teléfono'},
              {n:'documento',l:'DNI / Documento'},
            ].map(x=>(
              <div key={x.n}>
                <label style={lbl}>{x.l}</label>
                {editing?(
                  <input name={x.n} value={form[x.n]} onChange={change} style={inp} onFocus={e=>e.target.style.borderColor='#7c3aed'} onBlur={e=>e.target.style.borderColor='var(--pg-border2)'}/>
                ):(
                  <div style={{...inp,cursor:'default',background:'var(--pg-input)'}}>{form[x.n] || 'No registrado'}</div>
                )}
              </div>
            ))}

            <div style={{gridColumn:'1/-1'}}>
              <label style={lbl}>Dirección</label>
              {editing?(
                <input name="direccion" value={form.direccion} onChange={change} style={inp} onFocus={e=>e.target.style.borderColor='#7c3aed'} onBlur={e=>e.target.style.borderColor='var(--pg-border2)'}/>
              ):(
                <div style={{...inp,cursor:'default',background:'var(--pg-input)'}}>{form.direccion || 'No registrada'}</div>
              )}
            </div>
          </div>

          {editing&&(
            <button onClick={guardar} disabled={saving} style={{width:'100%',marginTop:'20px',padding:'13px',background:'linear-gradient(135deg,#7c3aed,#9333ea)',border:'none',borderRadius:'10px',color:'white',fontSize:'14px',fontWeight:'700',cursor:saving?'wait':'pointer',fontFamily:"'Inter',sans-serif",boxShadow:'0 8px 18px rgba(124,58,237,.28)',transition:'transform .2s'}}
              onMouseOver={e=>e.currentTarget.style.transform='translateY(-1px)'} onMouseOut={e=>e.currentTarget.style.transform='none'}>
              {saving?'Guardando...':'💾 Guardar cambios'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
