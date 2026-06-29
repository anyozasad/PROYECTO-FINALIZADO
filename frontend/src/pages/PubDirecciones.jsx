import { useState } from 'react';
import Swal from 'sweetalert2';

const inicial = [
  { id: 1, nombre: 'Casa', direccion: 'Av. Los Próceres 123', distrito: 'Callería', provincia: 'Coronel Portillo', principal: true },
  { id: 2, nombre: 'Trabajo', direccion: 'Jr. Comercio 456', distrito: 'Yarinacocha', provincia: 'Coronel Portillo', principal: false },
];

export default function PubDirecciones() {
  const [direcciones, setDirecciones] = useState(inicial);
  const [form, setForm] = useState({ nombre: '', direccion: '', distrito: '', provincia: '' });

  const guardar = () => {
    if (!form.nombre || !form.direccion || !form.distrito) {
      Swal.fire({ icon:'warning', title:'Completa la dirección', text:'Llena nombre, dirección y distrito antes de guardar.', confirmButtonColor:'#7c3aed', background:'var(--pg-surface)', color:'var(--pg-text)', width:'360px' });
      return;
    }

    setDirecciones([{ id: Date.now(), ...form, principal: direcciones.length === 0 }, ...direcciones]);
    setForm({ nombre: '', direccion: '', distrito: '', provincia: '' });
    Swal.fire({ icon:'success', title:'Dirección agregada', timer:1300, showConfirmButton:false, background:'var(--pg-surface)', color:'var(--pg-text)', width:'340px' });
  };

  const principal = (id) => {
    setDirecciones(direcciones.map(d => ({ ...d, principal: d.id === id })));
    Swal.fire({ icon:'success', title:'Dirección principal actualizada', timer:1200, showConfirmButton:false, background:'var(--pg-surface)', color:'var(--pg-text)', width:'340px' });
  };

  const eliminar = async (id) => {
    const r = await Swal.fire({ icon:'warning', title:'¿Eliminar dirección?', showCancelButton:true, confirmButtonText:'Eliminar', cancelButtonText:'Cancelar', confirmButtonColor:'#ef4444', background:'var(--pg-surface)', color:'var(--pg-text)', width:'360px' });
    if (r.isConfirmed) setDirecciones(direcciones.filter(d => d.id !== id));
  };

  const inp = {width:'100%',background:'var(--pg-input)',border:'1.5px solid var(--pg-border2)',borderRadius:'10px',padding:'11px 14px',color:'var(--pg-text)',outline:'none',fontFamily:"'Inter',sans-serif"};

  return (
    <div style={{padding:'26px 28px',fontFamily:"'Inter',sans-serif",color:'var(--pg-text)',background:'var(--pg-bg)',minHeight:'100%'}}>
      <div style={{marginBottom:'22px'}}>
        <h1 style={{margin:'0 0 4px',fontSize:'24px',fontWeight:'900'}}>Mis direcciones 📍</h1>
        <p style={{margin:0,color:'var(--pg-muted)',fontSize:'13px'}}>Guarda tus lugares de entrega para comprar más rápido.</p>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 360px',gap:'18px'}}>
        <div style={{display:'grid',gap:'12px'}}>
          {direcciones.map(d => (
            <div key={d.id} style={{background:'var(--pg-card)',border:`1px solid ${d.principal ? '#7c3aed' : 'var(--pg-border)'}`,borderRadius:'16px',padding:'18px',display:'flex',justifyContent:'space-between',gap:'12px'}}>
              <div>
                <h3 style={{margin:'0 0 6px',fontSize:'16px'}}>{d.nombre} {d.principal && <span style={{fontSize:'11px',background:'rgba(124,58,237,.22)',color:'#c4b5fd',padding:'3px 8px',borderRadius:'999px'}}>Principal</span>}</h3>
                <p style={{margin:'0 0 4px',color:'var(--pg-text2)'}}>{d.direccion}</p>
                <p style={{margin:0,color:'var(--pg-muted)',fontSize:'13px'}}>{d.distrito}, {d.provincia}</p>
              </div>
              <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
                <button className="pg-anim-btn" onClick={() => principal(d.id)} disabled={d.principal} style={{background:d.principal?'var(--pg-input)':'#7c3aed',border:`1px solid ${d.principal?'var(--pg-border2)':'#7c3aed'}`,borderRadius:'9px',padding:'8px 12px',color:d.principal?'var(--pg-muted)':'#ffffff',fontWeight:'800',cursor:d.principal?'default':'pointer'}}>{d.principal?'En uso':'Usar'}</button>
                <button className="pg-anim-btn" onClick={() => eliminar(d.id)} style={{background:'rgba(239,68,68,.12)',border:'1px solid rgba(239,68,68,.35)',borderRadius:'9px',padding:'8px 10px',color:'#ef4444',fontWeight:'800',cursor:'pointer'}}>Eliminar</button>
              </div>
            </div>
          ))}
        </div>

        <aside style={{background:'var(--pg-card)',border:'1px solid var(--pg-border)',borderRadius:'18px',padding:'20px',height:'fit-content'}}>
          <h2 style={{margin:'0 0 16px',fontSize:'18px'}}>Agregar dirección</h2>
          {[
            ['nombre', 'Nombre: Casa, Trabajo...'],
            ['direccion', 'Dirección completa'],
            ['distrito', 'Distrito'],
            ['provincia', 'Provincia'],
          ].map(([k, ph]) => (
            <input key={k} value={form[k]} onChange={e => setForm({...form, [k]: e.target.value})} placeholder={ph} style={{...inp, marginBottom:'10px'}} />
          ))}
          <button className="pg-anim-btn" onClick={guardar} style={{width:'100%',background:'linear-gradient(135deg,#7c3aed,#9333ea)',border:'none',borderRadius:'11px',padding:'12px',color:'#ffffff',fontWeight:'900',cursor:'pointer'}}>
            Guardar dirección
          </button>
        </aside>
      </div>
    </div>
  );
}
