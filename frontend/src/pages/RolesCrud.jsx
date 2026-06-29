import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { apiFetch } from '../services/api';

export default function RolesCrud() {
  const [roles,  setRoles]  = useState([]);
  const [nombre, setNombre] = useState('');
  const [editId, setEditId] = useState(null);
  const [modal,  setModal]  = useState(false);

  const cargar = () => apiFetch('/roles').then(d => setRoles((Array.isArray(d)?d:[]).filter(r=>String(r.nombre).toUpperCase()!=='ANALISTA'))).catch(()=>{});
  useEffect(() => { cargar(); }, []);

  const abrir = (r=null) => { setNombre(r?.nombre||''); setEditId(r?.id||null); setModal(true); };

  const guardar = async e => {
    e.preventDefault();
    if (nombre.trim().toUpperCase()==='ANALISTA') return Swal.fire({icon:'warning',title:'El rol ANALISTA no está permitido.',background:'var(--card-bg)',color:'var(--text)'});
    try {
      await apiFetch(editId?`/roles/${editId}`:'/roles', {method:editId?'PUT':'POST', body:JSON.stringify({nombre})});
      Swal.fire({icon:'success',title:editId?'Actualizado':'Creado',timer:1400,showConfirmButton:false,background:'var(--card-bg)',color:'var(--text)'});
      setModal(false); cargar();
    } catch(err){Swal.fire({icon:'error',title:'Error',text:err.message,background:'var(--card-bg)',color:'var(--text)'});}
  };

  const eliminar = async r => {
    const res = await Swal.fire({title:`¿Eliminar rol "${r.nombre}"?`,icon:'warning',showCancelButton:true,confirmButtonText:'Eliminar',confirmButtonColor:'#ef4444',background:'var(--card-bg)',color:'var(--text)'});
    if(!res.isConfirmed) return;
    try{await apiFetch(`/roles/${r.id}`,{method:'DELETE'}); cargar();}catch{}
  };

  const ROL_COLOR = {'Administrador':'#7c3aed','Vendedor':'#3b82f6','Cliente':'#10b981'};

  return (
    <div style={{ fontFamily:"'Inter',sans-serif", color:'var(--text)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px' }}>
        <div>
          <h1 style={{ margin:'0 0 4px', fontSize:'22px', fontWeight:'800' }}>🔐 Roles y permisos</h1>
          <p style={{ margin:0, color:'var(--muted)', fontSize:'13px' }}>Define los niveles de acceso del sistema.</p>
        </div>
        <button onClick={()=>abrir()} style={{ background:'linear-gradient(135deg,#7c3aed,#9333ea)', color:'var(--text)', border:'none', borderRadius:'9px', padding:'10px 20px', fontSize:'13px', fontWeight:'700', cursor:'pointer', fontFamily:"'Inter',sans-serif", boxShadow:'0 3px 12px rgba(124,58,237,.4)' }}>
          + Nuevo rol
        </button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:'14px' }}>
        {roles.map(r => {
          const col = ROL_COLOR[r.nombre] || '#6b7280';
          return (
            <div key={r.id} style={{ background:'var(--bg3)', border:`1px solid ${col}30`, borderRadius:'14px', padding:'20px', transition:'transform .2s,box-shadow .2s', cursor:'default' }}
              onMouseOver={e=>{e.currentTarget.style.transform='translateY(-3px)';e.currentTarget.style.boxShadow=`0 8px 24px ${col}25`;}}
              onMouseOut={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='none';}}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
                <div style={{ width:'44px', height:'44px', background:`${col}20`, borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px' }}>
                  {r.nombre==='Administrador'?'🛡️':r.nombre==='Vendedor'?'🏪':'👤'}
                </div>
                <div style={{ display:'flex', gap:'6px' }}>
                  <button onClick={()=>abrir(r)} style={{ background:'rgba(245,158,11,.15)', color:'#f59e0b', border:'1px solid rgba(245,158,11,.3)', borderRadius:'7px', padding:'4px 10px', fontSize:'11px', fontWeight:'600', cursor:'pointer', fontFamily:"'Inter',sans-serif" }}>✏️</button>
                  <button onClick={()=>eliminar(r)} style={{ background:'rgba(239,68,68,.15)', color:'#ef4444', border:'1px solid rgba(239,68,68,.3)', borderRadius:'7px', padding:'4px 10px', fontSize:'11px', fontWeight:'600', cursor:'pointer', fontFamily:"'Inter',sans-serif" }}>🗑️</button>
                </div>
              </div>
              <h3 style={{ margin:'0 0 4px', fontSize:'16px', fontWeight:'700', color:'var(--text)' }}>{r.nombre}</h3>
              <p style={{ margin:0, fontSize:'11px', color:'var(--muted)' }}>ID: {r.id}</p>
            </div>
          );
        })}
      </div>

      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.75)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(4px)' }} onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div style={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'16px', padding:'28px', width:'100%', maxWidth:'400px' }}>
            <h3 style={{ margin:'0 0 20px', fontSize:'18px', fontWeight:'700' }}>{editId?'Editar rol':'Nuevo rol'}</h3>
            <form onSubmit={guardar}>
              <label style={{ display:'block', fontSize:'12px', fontWeight:'700', color:'var(--muted2)', marginBottom:'8px', textTransform:'uppercase' }}>Nombre del rol *</label>
              <input value={nombre} onChange={e=>setNombre(e.target.value)} required placeholder="Ej: Supervisor"
                style={{ background:'var(--bg4)', border:'1px solid var(--border2)', borderRadius:'8px', padding:'11px 14px', color:'var(--text)', fontSize:'14px', width:'100%', outline:'none', fontFamily:"'Inter',sans-serif", marginBottom:'20px' }}
                onFocus={e=>e.target.style.borderColor='#7c3aed'} onBlur={e=>e.target.style.borderColor='var(--border2)'}/>
              <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end' }}>
                <button type="button" onClick={()=>setModal(false)} style={{ background:'var(--bg4)', border:'1px solid var(--border)', color:'var(--muted2)', borderRadius:'8px', padding:'10px 18px', fontSize:'13px', cursor:'pointer', fontFamily:"'Inter',sans-serif" }}>Cancelar</button>
                <button type="submit" style={{ background:'linear-gradient(135deg,#7c3aed,#9333ea)', color:'var(--text)', border:'none', borderRadius:'9px', padding:'10px 22px', fontSize:'13px', fontWeight:'700', cursor:'pointer', fontFamily:"'Inter',sans-serif" }}>{editId?'Actualizar':'Crear rol'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
