
import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { usePreferencias, TASAS_CAMBIO } from '../context/PreferenciasContext';
import Swal from 'sweetalert2';

function Toggle({on,onChange,disabled}){
  return(
    <div onClick={!disabled?onChange:undefined} style={{width:'46px',height:'26px',borderRadius:'13px',background:on?'#7c3aed':'var(--pg-border2)',cursor:disabled?'not-allowed':'pointer',transition:'background .2s',position:'relative',flexShrink:0,opacity:disabled?.5:1}}>
      <div style={{position:'absolute',top:'3px',left:on?'23px':'3px',width:'20px',height:'20px',borderRadius:'50%',background:'white',transition:'left .2s',boxShadow:'0 1px 4px rgba(0,0,0,.3)'}}/>
    </div>
  );
}

function Select({value,onChange,options}){
  return(
    <select value={value} onChange={e=>onChange(e.target.value)} style={{background:'var(--pg-input)',border:'1px solid var(--pg-border2)',borderRadius:'8px',padding:'9px 12px',color:'var(--pg-text)',fontSize:'13px',outline:'none',fontFamily:"'Inter',sans-serif",transition:'border-color .2s',cursor:'pointer',width:'100%'}
      } onFocus={e=>e.target.style.borderColor='#7c3aed'} onBlur={e=>e.target.style.borderColor='var(--pg-border2)'}>
      {options.map(o=><option key={o} value={o}>{o}</option>)}
    </select>
  );
}

export default function PubAjustes(){
  const {tema,setTema}=useTheme();
  const {idioma,setIdioma,moneda,setMoneda,t}=usePreferencias();
  const [notif,setNotif]=useState({ofertas:true,pedidos:true,mensajes:true,novedades:false});
  const [saving,setSaving]=useState(false);

  const cambiarIdioma = (v) => {
    setIdioma(v);
    Swal.fire({icon:'success',title:t.idiomaAplicado,text:v,timer:1100,showConfirmButton:false,background:'var(--pg-surface)',color:'var(--pg-text)',width:'320px'});
  };

  const cambiarMoneda = (v) => {
    setMoneda(v);
    const ejemplo = `${TASAS_CAMBIO[v].simbolo} ${(39.90*TASAS_CAMBIO[v].tasa).toFixed(2)}`;
    Swal.fire({icon:'success',title:t.monedaAplicada,text:`Ejemplo: ${ejemplo}`,timer:1300,showConfirmButton:false,background:'var(--pg-surface)',color:'var(--pg-text)',width:'320px'});
  };

  const guardar=async()=>{
    setSaving(true);
    await new Promise(r=>setTimeout(r,700));
    setSaving(false);
    Swal.fire({icon:'success',title:t.cambiosGuardados,timer:1500,showConfirmButton:false,background:'var(--pg-surface)',color:'var(--pg-text)'});
  };

  const S={
    card:{background:'var(--pg-card)',border:'1px solid var(--pg-border)',borderRadius:'14px',padding:'22px'},
    title:{margin:'0 0 18px',fontSize:'15px',fontWeight:'700',color:'var(--pg-text)'},
    row:{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 0',borderBottom:'1px solid var(--pg-border)'},
    lbl:{fontSize:'13px',fontWeight:'500',color:'var(--pg-text)'},
    sub:{fontSize:'11px',color:'var(--pg-muted)',marginTop:'2px'},
    seclbl:{display:'block',fontSize:'11px',fontWeight:'700',color:'var(--pg-muted)',marginBottom:'7px',textTransform:'uppercase',letterSpacing:'.05em'},
  };

  return(
    <div style={{padding:'26px 28px',fontFamily:"'Inter',sans-serif",color:'var(--pg-text)',background:'var(--pg-bg)',minHeight:'100%'}}>
      <div style={{marginBottom:'24px'}}>
        <h1 style={{margin:'0 0 4px',fontSize:'22px',fontWeight:'800'}}>Configuración de cuenta</h1>
        <p style={{margin:0,color:'var(--pg-muted)',fontSize:'13px'}}>Personaliza tu experiencia en Dorada Motor’s</p>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'18px'}}>
        {/* Preferencias generales */}
        <div style={S.card}>
          <h3 style={S.title}>Preferencias generales</h3>

          <div style={{marginBottom:'18px'}}>
            <label style={S.seclbl}>Tema de la aplicación</label>
            <div style={{display:'flex',gap:'8px'}}>
              {['Claro','Oscuro'].map(t=>(
                <button key={t} className="pg-anim-btn" onClick={()=>setTema(t==='Oscuro'?'oscuro':'claro')} style={{flex:1,padding:'9px',borderRadius:'9px',border:`1px solid ${(tema==='oscuro'?t==='Oscuro':t==='Claro')?'#7c3aed':'var(--pg-border2)'}`,background:(tema==='oscuro'?t==='Oscuro':t==='Claro')?'rgba(124,58,237,.2)':'transparent',color:(tema==='oscuro'?t==='Oscuro':t==='Claro')?'#a78bfa':'var(--pg-muted)',fontSize:'13px',fontWeight:'600',cursor:'pointer',fontFamily:"'Inter',sans-serif",transition:'all .15s'}}>
                  {t==='Claro'?'☀️':'🌙'} {t}
                </button>
              ))}
            </div>
          </div>

          <div style={{marginBottom:'18px'}}>
            <label style={S.seclbl}>Idioma</label>
            <Select value={idioma} onChange={cambiarIdioma} options={['Español','English','Português']}/>
          </div>

          <div style={{marginBottom:'18px'}}>
            <label style={S.seclbl}>Moneda</label>
            <Select value={moneda} onChange={cambiarMoneda} options={['Soles ($)','Dólares (USD)','Euros (€)']}/>
          </div>
        </div>

        {/* Notificaciones */}
        <div style={S.card}>
          <h3 style={S.title}>Notificaciones</h3>
          {[
            {k:'ofertas', l:'Ofertas y promociones',   s:'Descuentos y ofertas especiales'},
            {k:'pedidos', l:'Estado de pedidos',       s:'Actualizaciones de tus compras'},
            {k:'mensajes',l:'Mensajes y respuestas',   s:'Respuestas de soporte'},
            {k:'novedades',l:'Novedades de productos', s:'Nuevos lanzamientos'},
          ].map((x,i)=>(
            <div key={x.k} style={{...S.row,borderBottom:i<3?'1px solid #1a1a2e':'none'}}>
              <div>
                <p style={S.lbl}>{x.l}</p>
                <p style={S.sub}>{x.s}</p>
              </div>
              <Toggle on={notif[x.k]} onChange={()=>setNotif(n=>({...n,[x.k]:!n[x.k]}))}/>
            </div>
          ))}
        </div>
      </div>

      <button className="pg-anim-btn" onClick={guardar} disabled={saving} style={{width:'100%',marginTop:'18px',padding:'14px',background:'linear-gradient(135deg,#7c3aed,#9333ea)',border:'none',borderRadius:'10px',color:'white',fontSize:'14px',fontWeight:'700',cursor:'pointer',fontFamily:"'Inter',sans-serif",boxShadow:'0 4px 14px rgba(124,58,237,.4)',opacity:saving?.7:1}}>
        {saving?'Guardando...':'💾 Guardar cambios'}
      </button>
    </div>
  );
}
