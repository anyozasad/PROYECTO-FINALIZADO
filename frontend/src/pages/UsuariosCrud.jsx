import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { apiFetch } from '../services/api';

const safeJSON = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
  catch { return fallback; }
};
const obtenerUsuariosRegistradosLocal = () => safeJSON('partgo_usuarios_registrados', []);

const TH = { color:'var(--muted)', fontSize:'11px', fontWeight:'700', padding:'10px 14px', textAlign:'left', textTransform:'uppercase', letterSpacing:'.05em', borderBottom:'1px solid var(--border)' };
const TD = { padding:'12px 14px', fontSize:'13px', color:'var(--text)', borderBottom:'1px solid var(--border)' };
const INPUT = { background:'var(--bg4)', border:'1px solid var(--border2)', borderRadius:'8px', padding:'10px 12px', color:'var(--text)', fontSize:'13px', width:'100%', outline:'none', fontFamily:"'Inter',sans-serif", transition:'border-color .2s' };
const LABEL = { display:'block', fontSize:'11px', fontWeight:'700', color:'var(--muted2)', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'.05em' };

export default function UsuariosCrud() {
  const empty = { nombre:'', email:'', password:'', rol_id:'', estado:1 };
  const [usuarios, setUsuarios] = useState([]);
  const [roles,    setRoles]    = useState([]);
  const [form,     setForm]     = useState(empty);
  const [editId,   setEditId]   = useState(null);
  const [editEsLocal, setEditEsLocal] = useState(false);
  const [modal,    setModal]    = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [busq,     setBusq]     = useState('');

  const cargar = async () => {
    const localesNormalizados = obtenerUsuariosRegistradosLocal().map((u) => ({
      id: u.id,
      nombre: u.nombre,
      email: u.email,
      rol: u.rol,
      estado: u.estado ?? 1,
      esLocal: true,
    }));
    try {
      const [u, r] = await Promise.all([apiFetch('/usuarios'), apiFetch('/roles')]);
      const remotos = Array.isArray(u) ? u : [];
      const emailsRemotos = new Set(remotos.map(x => String(x.email||'').toLowerCase()));
      const localesSinDuplicar = localesNormalizados.filter(x => !emailsRemotos.has(String(x.email||'').toLowerCase()));
      setUsuarios([...localesSinDuplicar, ...remotos]);
      setRoles(Array.isArray(r)?r:[]);
    } catch {
      setUsuarios(localesNormalizados);
    }
  };
  useEffect(() => {
    cargar();
    window.addEventListener('partgo_usuarios_changed', cargar);
    return () => window.removeEventListener('partgo_usuarios_changed', cargar);
  }, []);

  const abrir = (u = null) => {
    if (u) {
      const rol = roles.find(r => r.nombre === u.rol);
      setForm({ nombre:u.nombre, email:u.email, password:'', rol_id:rol?.id||'', estado:u.estado });
      setEditId(u.id);
      setEditEsLocal(!!u.esLocal);
    } else { setForm(empty); setEditId(null); setEditEsLocal(false); }
    setModal(true);
  };

  const guardar = async e => {
    e.preventDefault(); setLoading(true);
    try {
      if (editId && editEsLocal) {
        const rolNombre = roles.find(r => String(r.id) === String(form.rol_id))?.nombre || 'Cliente';
        const locales = obtenerUsuariosRegistradosLocal();
        localStorage.setItem('partgo_usuarios_registrados', JSON.stringify(
          locales.map(u => u.id === editId ? { ...u, nombre:form.nombre, email:form.email, rol:rolNombre, estado:Number(form.estado) } : u)
        ));
        window.dispatchEvent(new Event('partgo_usuarios_changed'));
      } else {
        const body = editId ? { nombre:form.nombre, email:form.email, rol_id:form.rol_id, estado:form.estado } : form;
        await apiFetch(editId ? `/usuarios/${editId}` : '/usuarios', { method:editId?'PUT':'POST', body:JSON.stringify(body) });
      }
      Swal.fire({ icon:'success', title:editId?'Actualizado':'Creado', timer:1500, showConfirmButton:false, background:'var(--card-bg)', color:'var(--text)' });
      setModal(false); cargar();
    } catch (err) { Swal.fire({ icon:'error', title:'Error', text:err.message, background:'var(--card-bg)', color:'var(--text)' }); }
    finally { setLoading(false); }
  };

  const eliminar = async u => {
    const r = await Swal.fire({ title:`¿Eliminar a ${u.nombre}?`, icon:'warning', showCancelButton:true, confirmButtonText:'Eliminar', confirmButtonColor:'#ef4444', background:'var(--card-bg)', color:'var(--text)' });
    if (!r.isConfirmed) return;
    if (u.esLocal) {
      const locales = obtenerUsuariosRegistradosLocal().filter(x => x.id !== u.id);
      localStorage.setItem('partgo_usuarios_registrados', JSON.stringify(locales));
      window.dispatchEvent(new Event('partgo_usuarios_changed'));
      cargar();
      return;
    }
    try { await apiFetch(`/usuarios/${u.id}`, { method:'DELETE' }); cargar(); } catch {}
  };

  const filtrados = usuarios.filter(u => !busq || u.nombre?.toLowerCase().includes(busq.toLowerCase()) || u.email?.toLowerCase().includes(busq.toLowerCase()));

  const nombreRol = (u) => {
    if (u.rol) return u.rol;
    const r = roles.find(r => Number(r.id) === Number(u.rol_id));
    return r?.nombre || '—';
  };

  return (
    <div style={{ fontFamily:"'Inter',sans-serif", color:'var(--text)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px' }}>
        <div>
          <h1 style={{ margin:'0 0 4px', fontSize:'22px', fontWeight:'800' }}>👤 Usuarios del sistema</h1>
          <p style={{ margin:0, color:'var(--muted)', fontSize:'13px' }}>{usuarios.length} usuarios registrados</p>
        </div>
        <div style={{ display:'flex', gap:'10px' }}>
          <div style={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'8px', padding:'8px 14px', display:'flex', alignItems:'center', gap:'8px' }}>
            <span style={{ color:'var(--muted)' }}>🔍</span>
            <input value={busq} onChange={e=>setBusq(e.target.value)} placeholder="Buscar usuario..." style={{ background:'transparent', border:'none', color:'var(--text)', outline:'none', fontSize:'13px', width:'180px', fontFamily:"'Inter',sans-serif" }}/>
          </div>
          <button onClick={() => abrir()} style={{ background:'linear-gradient(135deg,#7c3aed,#9333ea)', color:'var(--text)', border:'none', borderRadius:'9px', padding:'10px 20px', fontSize:'13px', fontWeight:'700', cursor:'pointer', fontFamily:"'Inter',sans-serif", boxShadow:'0 3px 12px rgba(124,58,237,.4)' }}>
            + Nuevo usuario
          </button>
        </div>
      </div>

      <div style={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'14px', overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead><tr style={{ background:'var(--bg4)' }}>
            <th style={TH}>#</th><th style={TH}>Nombre</th><th style={TH}>Email</th><th style={TH}>Rol</th><th style={TH}>Estado</th><th style={{ ...TH, textAlign:'right' }}>Acciones</th>
          </tr></thead>
          <tbody>
            {filtrados.map((u, i) => (
              <tr key={u.id} onMouseOver={e=>e.currentTarget.style.background='var(--bg4)'} onMouseOut={e=>e.currentTarget.style.background='transparent'} style={{ transition:'background .15s' }}>
                <td style={{ ...TD, color:'var(--muted)', fontSize:'12px' }}>{i+1}</td>
                <td style={TD}><div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                  <div style={{ width:'32px', height:'32px', borderRadius:'50%', background:'linear-gradient(135deg,#7c3aed,#4c1d95)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text)', fontSize:'13px', fontWeight:'700', flexShrink:0 }}>{u.nombre?.[0]?.toUpperCase()}</div>
                  <span style={{ fontWeight:'600' }}>{u.nombre}</span>
                </div></td>
                <td style={{ ...TD, color:'var(--muted)' }}>{u.email}</td>
                <td style={TD}><span style={{ background:'rgba(124,58,237,.15)', color:'#a78bfa', padding:'3px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:'700' }}>{nombreRol(u)}</span></td>
                <td style={TD}><span style={{ background:u.estado?'rgba(16,185,129,.15)':'rgba(239,68,68,.15)', color:u.estado?'#10b981':'#ef4444', padding:'3px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:'700' }}>{u.estado?'Activo':'Inactivo'}</span></td>
                <td style={{ ...TD, textAlign:'right' }}>
                  <button onClick={()=>abrir(u)} style={{ background:'rgba(245,158,11,.15)', color:'#f59e0b', border:'1px solid rgba(245,158,11,.3)', borderRadius:'7px', padding:'5px 12px', fontSize:'12px', fontWeight:'600', cursor:'pointer', marginRight:'6px', fontFamily:"'Inter',sans-serif" }}>✏️ Editar</button>
                  <button onClick={()=>eliminar(u)} style={{ background:'rgba(239,68,68,.15)', color:'#ef4444', border:'1px solid rgba(239,68,68,.3)', borderRadius:'7px', padding:'5px 12px', fontSize:'12px', fontWeight:'600', cursor:'pointer', fontFamily:"'Inter',sans-serif" }}>🗑️ Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtrados.length===0 && <div style={{ textAlign:'center', padding:'40px', color:'var(--muted)' }}>Sin usuarios</div>}
      </div>

      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.75)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px', backdropFilter:'blur(4px)' }} onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div style={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'16px', padding:'28px', width:'100%', maxWidth:'480px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'22px' }}>
              <h3 style={{ margin:0, fontSize:'18px', fontWeight:'700' }}>{editId?'Editar usuario':'Nuevo usuario'}</h3>
              <button onClick={()=>setModal(false)} style={{ background:'var(--bg4)', border:'none', color:'var(--muted)', cursor:'pointer', borderRadius:'8px', padding:'6px 10px', fontSize:'16px' }}>✕</button>
            </div>
            <form onSubmit={guardar}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px', marginBottom:'20px' }}>
                <div><label style={LABEL}>Nombre *</label><input style={INPUT} value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value})} required placeholder="Nombre completo" onFocus={e=>e.target.style.borderColor='#7c3aed'} onBlur={e=>e.target.style.borderColor='var(--border2)'}/></div>
                <div><label style={LABEL}>Email *</label><input style={INPUT} type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required placeholder="correo@email.com" onFocus={e=>e.target.style.borderColor='#7c3aed'} onBlur={e=>e.target.style.borderColor='var(--border2)'}/></div>
                {!editId && <div><label style={LABEL}>Contraseña *</label><input style={INPUT} type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required placeholder="••••••••" onFocus={e=>e.target.style.borderColor='#7c3aed'} onBlur={e=>e.target.style.borderColor='var(--border2)'}/></div>}
                <div><label style={LABEL}>Rol *</label><select style={{ ...INPUT, cursor:'pointer' }} value={form.rol_id} onChange={e=>setForm({...form,rol_id:e.target.value})} required>
                  <option value="">Seleccionar rol</option>
                  {roles.map(r=><option key={r.id} value={r.id}>{r.nombre}</option>)}
                </select></div>
                <div><label style={LABEL}>Estado</label><select style={{ ...INPUT, cursor:'pointer' }} value={form.estado} onChange={e=>setForm({...form,estado:e.target.value})}>
                  <option value={1}>Activo</option><option value={0}>Inactivo</option>
                </select></div>
              </div>
              <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end' }}>
                <button type="button" onClick={()=>setModal(false)} style={{ background:'var(--bg4)', border:'1px solid var(--border)', color:'var(--muted2)', borderRadius:'8px', padding:'10px 20px', fontSize:'13px', cursor:'pointer', fontFamily:"'Inter',sans-serif" }}>Cancelar</button>
                <button type="submit" disabled={loading} style={{ background:'linear-gradient(135deg,#7c3aed,#9333ea)', color:'var(--text)', border:'none', borderRadius:'9px', padding:'10px 22px', fontSize:'13px', fontWeight:'700', cursor:'pointer', fontFamily:"'Inter',sans-serif", opacity:loading?.7:1 }}>{loading?'Guardando...':(editId?'Actualizar':'Crear usuario')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
