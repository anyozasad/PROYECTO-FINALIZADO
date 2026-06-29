
export default function PubCalidad(){
  const STATS=[
    {v:'99.98%',s:'Últimos 30 días',   l:'Disponibilidad del sistema', i:'📈', c:'#10b981'},
    {v:'245ms', s:'Promedio global',   l:'Tiempo de respuesta',        i:'⚡', c:'#7c3aed'},
    {v:'92%',   s:'Pruebas automáticas',l:'Cobertura de pruebas',      i:'🔬', c:'#3b82f6'},
    {v:'98%',   s:'En menos de 24h',   l:'Incidentes resueltos',       i:'✅', c:'#f59e0b'},
  ];
  const TESTS=[
    {l:'Pruebas automatizadas',n:'1,248 ejecutadas esta semana',pct:92,c:'#7c3aed'},
    {l:'Pruebas manuales',     n:'356 ejecutadas esta semana',  pct:88,c:'#10b981'},
  ];
  const SRVS=[
    {n:'Plataforma web',   s:'Operativo',c:'#10b981'},
    {n:'API de servicios', s:'Operativo',c:'#10b981'},
    {n:'Sistema de pagos', s:'Operativo',c:'#10b981'},
  ];
  const CATS=[
    {n:'Funcionalidad',pct:95},{n:'Usabilidad',pct:93},{n:'Rendimiento',pct:92},{n:'Seguridad',pct:96},
  ];
  const Bar=({pct,c='#7c3aed'})=>(
    <div style={{height:'6px',background:'var(--pg-input)',borderRadius:'3px',overflow:'hidden'}}>
      <div style={{height:'100%',width:`${pct}%`,background:`linear-gradient(90deg,${c},${c}bb)`,borderRadius:'3px',transition:'width 1s ease'}}/>
    </div>
  );
  return(
    <div style={{padding:'26px 28px',fontFamily:"'Inter',sans-serif",color:'var(--pg-text)',background:'var(--pg-bg)',minHeight:'100%'}}>
      <div style={{marginBottom:'24px'}}>
        <h1 style={{margin:'0 0 4px',fontSize:'22px',fontWeight:'800'}}>Calidad de Software</h1>
        <p style={{margin:0,color:'var(--pg-muted)',fontSize:'13px'}}>Comprometidos con la excelencia</p>
      </div>

      {/* Stats */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'14px',marginBottom:'20px'}}>
        {STATS.map(s=>(
          <div key={s.l} style={{background:'var(--pg-card)',border:'1px solid var(--pg-border)',borderRadius:'14px',padding:'18px',transition:'transform .2s,box-shadow .2s'}}
            onMouseOver={e=>{e.currentTarget.style.transform='translateY(-3px)';e.currentTarget.style.boxShadow='0 8px 20px rgba(124,58,237,.15)';}}
            onMouseOut={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='none';}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'10px'}}>
              <div style={{width:'38px',height:'38px',background:s.c+'22',borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px'}}>{s.i}</div>
              <div style={{width:'8px',height:'8px',borderRadius:'50%',background:'#10b981',marginTop:'4px'}}/>
            </div>
            <p style={{margin:'0 0 2px',fontSize:'24px',fontWeight:'900',color:s.c}}>{s.v}</p>
            <p style={{margin:'0 0 2px',fontSize:'12px',fontWeight:'600',color:'var(--pg-text)'}}>{s.l}</p>
            <p style={{margin:0,fontSize:'10px',color:'var(--pg-muted)'}}>{s.s}</p>
          </div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr auto',gap:'16px'}}>
        {/* Pruebas */}
        <div style={{background:'var(--pg-card)',border:'1px solid var(--pg-border)',borderRadius:'14px',padding:'18px'}}>
          <h3 style={{margin:'0 0 16px',fontSize:'14px',fontWeight:'700'}}>Pruebas y calidad</h3>
          {TESTS.map(t=>(
            <div key={t.l} style={{marginBottom:'16px'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'6px'}}>
                <div><p style={{margin:0,fontSize:'12px',fontWeight:'700',color:'var(--pg-text)'}}>{t.l}</p><p style={{margin:0,fontSize:'10px',color:'var(--pg-muted)'}}>{t.n}</p></div>
                <span style={{fontSize:'14px',fontWeight:'800',color:t.c}}>{t.pct}%</span>
              </div>
              <Bar pct={t.pct} c={t.c}/>
            </div>
          ))}
        </div>

        {/* Estado servicios */}
        <div style={{background:'var(--pg-card)',border:'1px solid var(--pg-border)',borderRadius:'14px',padding:'18px'}}>
          <h3 style={{margin:'0 0 16px',fontSize:'14px',fontWeight:'700'}}>Estado de servicios</h3>
          {SRVS.map(s=>(
            <div key={s.n} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:'1px solid #1a1a2e'}}>
              <span style={{fontSize:'12px',color:'var(--pg-muted2)'}}>{s.n}</span>
              <span style={{background:s.c+'22',color:s.c,padding:'3px 10px',borderRadius:'20px',fontSize:'10px',fontWeight:'700',display:'flex',alignItems:'center',gap:'5px'}}>
                <span style={{width:'5px',height:'5px',borderRadius:'50%',background:s.c,display:'inline-block'}}/>
                {s.s}
              </span>
            </div>
          ))}
        </div>

        {/* Calidad por categoría */}
        <div style={{background:'var(--pg-card)',border:'1px solid var(--pg-border)',borderRadius:'14px',padding:'18px'}}>
          <h3 style={{margin:'0 0 16px',fontSize:'14px',fontWeight:'700'}}>Calidad por categorías</h3>
          {CATS.map(c=>(
            <div key={c.n} style={{marginBottom:'14px'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:'5px'}}>
                <span style={{fontSize:'12px',color:'var(--pg-muted2)'}}>{c.n}</span>
                <span style={{fontSize:'12px',fontWeight:'700',color:'var(--pg-text)'}}>{c.pct}%</span>
              </div>
              <Bar pct={c.pct}/>
            </div>
          ))}
        </div>

        {/* Feedback */}
        <div style={{background:'linear-gradient(135deg,#13131f,#1a0835)',border:'1px solid rgba(124,58,237,.2)',borderRadius:'14px',padding:'20px',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',textAlign:'center',minWidth:'180px'}}>
          <div style={{width:'56px',height:'56px',background:'rgba(124,58,237,.2)',borderRadius:'16px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'26px',marginBottom:'14px'}}>🛡️</div>
          <h4 style={{margin:'0 0 8px',fontSize:'14px',fontWeight:'700'}}>Tu feedback nos ayuda</h4>
          <p style={{margin:'0 0 16px',fontSize:'11px',color:'var(--pg-muted2)',lineHeight:1.5}}>¿Encontraste algún problema? Ayúdanos a mejorar PartGo</p>
          <button style={{width:'100%',padding:'10px',background:'linear-gradient(135deg,#7c3aed,#9333ea)',border:'none',borderRadius:'9px',color:'var(--pg-text)',fontSize:'12px',fontWeight:'700',cursor:'pointer',fontFamily:"'Inter',sans-serif"}}>
            Enviar feedback
          </button>
          <button style={{width:'100%',marginTop:'8px',padding:'8px',background:'transparent',border:'1px solid var(--pg-border2)',borderRadius:'9px',color:'var(--pg-muted)',fontSize:'11px',cursor:'pointer',fontFamily:"'Inter',sans-serif"}}>
            Ver reportes de calidad →
          </button>
        </div>
      </div>
    </div>
  );
}
