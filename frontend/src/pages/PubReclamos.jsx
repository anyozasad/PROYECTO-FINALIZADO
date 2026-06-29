import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { crearReclamo } from '../utils/reclamosStore';
import { useAuth } from '../context/AuthContext';

export default function PubReclamos(){
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [form,setForm]=useState({tipo:'',pedido:'',breve:'',detallada:'',cliente:'',email:'',telefono:''});
  const [sending,setSending]=useState(false);

  useEffect(()=>{
    setForm(f=>({
      ...f,
      cliente: f.cliente || usuario?.nombre || '',
      email: f.email || usuario?.email || '',
      telefono: f.telefono || usuario?.telefono || ''
    }));
  },[usuario?.nombre,usuario?.email,usuario?.telefono]);

  const change=e=>setForm(f=>({...f,[e.target.name]:e.target.value}));
  const inp={width:'100%',background:'var(--pg-input)',border:'1.5px solid var(--pg-border2)',borderRadius:'9px',padding:'11px 14px',color:'var(--pg-text)',fontSize:'13px',outline:'none',fontFamily:"'Inter',sans-serif",boxSizing:'border-box',transition:'border-color .2s'};
  const lbl={display:'block',fontSize:'11px',fontWeight:'700',color:'var(--pg-muted)',marginBottom:'7px',textTransform:'uppercase',letterSpacing:'.05em'};
  const enviar=async e=>{
    e.preventDefault();
    if(!form.cliente || !form.email || !form.tipo || !form.detallada) return Swal.fire({icon:'warning',title:'Completa nombre, correo, tipo y detalle',confirmButtonColor:'#7c3aed',background:'var(--pg-surface)',color:'var(--pg-text)'});
    setSending(true);
    await new Promise(r=>setTimeout(r,650));
    crearReclamo({ ...form, cliente: form.cliente || usuario?.nombre, email: form.email || usuario?.email, telefono: form.telefono || usuario?.telefono });
    setSending(false);
    setForm({tipo:'',pedido:'',breve:'',detallada:'',cliente: usuario?.nombre || '',email: usuario?.email || '',telefono: usuario?.telefono || ''});
    Swal.fire({icon:'success',title:'Reclamo registrado',text:'El administrador ya puede verlo en Reclamos y soporte.',confirmButtonColor:'#7c3aed',background:'var(--pg-surface)',color:'var(--pg-text)'});
  };
  return(
    <div className="pub-reclamos-page" style={{padding:'22px 24px',paddingBottom:'120px',fontFamily:"'Inter',sans-serif",color:'var(--pg-text)',background:'var(--pg-bg)',minHeight:'100%'}}>
      <div style={{marginBottom:'22px'}}>
        <h1 style={{margin:'0 0 4px',fontSize:'22px',fontWeight:'800'}}>Libro de reclamaciones</h1>
        <p style={{margin:0,color:'var(--pg-muted)',fontSize:'13px'}}>Registra tu queja o reclamo. El administrador lo verá automáticamente.</p>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 280px',gap:'18px'}}>
        <div style={{background:'var(--pg-card)',border:'1px solid var(--pg-border)',borderRadius:'14px',padding:'24px'}}>
          <form onSubmit={enviar}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px',marginBottom:'16px'}}>
              <div><label style={lbl}>Nombre completo *</label><input name="cliente" value={form.cliente} onChange={change} placeholder="Tu nombre" style={inp}/></div>
              <div><label style={lbl}>Correo electrónico *</label><input name="email" type="email" value={form.email} onChange={change} placeholder="cliente@correo.com" style={inp}/></div>
              <div><label style={lbl}>Teléfono</label><input name="telefono" value={form.telefono} onChange={change} placeholder="987654321" style={inp}/></div>
              <div><label style={lbl}>Número de pedido (opcional)</label><input name="pedido" value={form.pedido} onChange={change} placeholder="Ej: #PGO-2026-00123" style={inp}/></div>
            </div>
            <div style={{marginBottom:'16px'}}>
              <label style={lbl}>Tipo de reclamación *</label>
              <select name="tipo" value={form.tipo} onChange={change} required style={{...inp,cursor:'pointer'}}>
                <option value="">Selecciona el tipo</option>
                <option value="producto">Producto defectuoso</option>
                <option value="entrega">Problema con la entrega</option>
                <option value="pago">Error en el cobro</option>
                <option value="atencion">Mala atención</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div style={{marginBottom:'16px'}}>
              <label style={lbl}>Descripción breve</label>
              <input name="breve" value={form.breve} onChange={change} placeholder="Resume tu problema en una línea..." style={inp}/>
            </div>
            <div style={{marginBottom:'22px'}}>
              <label style={lbl}>Descripción detallada *</label>
              <textarea name="detallada" value={form.detallada} onChange={change} required rows={5} placeholder="Cuéntanos más sobre tu experiencia..." style={{...inp,resize:'vertical',lineHeight:1.5}}/>
            </div>
            <button type="submit" disabled={sending} style={{width:'100%',padding:'13px',background:'linear-gradient(135deg,#7c3aed,#9333ea)',border:'none',borderRadius:'10px',color:'white',fontSize:'14px',fontWeight:'700',cursor:sending?'wait':'pointer',fontFamily:"'Inter',sans-serif",boxShadow:'0 4px 14px rgba(124,58,237,.4)',transition:'transform .15s',opacity:sending?.7:1}}>
              {sending?'Enviando...':'📤 Enviar reclamación'}
            </button>
          </form>
        </div>

        <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>
          <div style={{background:'var(--pg-card)',border:'1px solid var(--pg-border)',borderRadius:'14px',padding:'20px'}}>
            <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'14px'}}>
              <div style={{width:'36px',height:'36px',background:'rgba(59,130,246,.2)',borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px'}}>ℹ️</div>
              <h3 style={{margin:0,fontSize:'15px',fontWeight:'700'}}>Información importante</h3>
            </div>
            <p style={{margin:'0 0 14px',fontSize:'12px',color:'var(--pg-muted2)',lineHeight:1.6}}>Tu reclamo queda registrado en el panel del administrador para seguimiento.</p>
            {[{i:'✅',t:'Registro inmediato'},{i:'✅',t:'Seguimiento del caso'},{i:'✅',t:'Confidencialidad garantizada'}].map(x=>(
              <div key={x.t} style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'10px'}}><span style={{fontSize:'14px'}}>{x.i}</span><span style={{fontSize:'12px',color:'var(--pg-muted2)'}}>{x.t}</span></div>
            ))}
          </div>
          <div style={{background:'rgba(124,58,237,.08)',border:'1px solid rgba(124,58,237,.2)',borderRadius:'12px',padding:'16px'}}>
            <p style={{margin:'0 0 6px',fontSize:'13px',fontWeight:'700',color:'#a78bfa'}}>🎧 ¿Prefieres hablar con la IA?</p>
            <p style={{margin:'0 0 12px',fontSize:'11px',color:'var(--pg-muted)'}}>El centro de mensajes te atiende 24/7.</p>
            <button onClick={()=>navigate('/s/mensajes')} style={{width:'100%',padding:'9px',background:'linear-gradient(135deg,#7c3aed,#9333ea)',border:'none',borderRadius:'8px',color:'white',fontSize:'12px',fontWeight:'700',cursor:'pointer',fontFamily:"'Inter',sans-serif"}}>Ir a mensajes →</button>
          </div>
        </div>
      </div>
    </div>
  );
}
