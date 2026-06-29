import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { obtenerPedidos as obtenerPedidosLocales } from '../utils/shopCore';
import { obtenerCatalogo } from '../utils/catalogoStore';

/* ══ DATOS ══ */
const VENTAS_DATA = [
  {d:'09 Jun',v:2800},{d:'10 Jun',v:3400},{d:'11 Jun',v:4600},
  {d:'12 Jun',v:3200},{d:'13 Jun',v:5800},{d:'14 Jun',v:4200},{d:'15 Jun',v:6100},
];
const ESTADOS = [
  {label:'Entregado', v:65, pct:41.7, c:'#10b981'},
  {label:'En camino', v:45, pct:28.8, c:'#3b82f6'},
  {label:'Preparando',v:30, pct:19.2, c:'#f59e0b'},
  {label:'Cancelado', v:16, pct:10.3, c:'#ef4444'},
];
const ACTIVIDAD = [
  {icon:'🛒',bg:'rgba(124,58,237,.18)',text:'Nuevo pedido #PG001562 — Carlos Ramírez',t:'Hace 5 min'},
  {icon:'📦',bg:'rgba(16,185,129,.18)', text:'Producto actualizado: Faro delantero OEM',t:'Hace 25 min'},
  {icon:'👤',bg:'rgba(59,130,246,.18)', text:'Nuevo cliente registrado: María Torres',t:'Hace 1 h'},
  {icon:'✅',bg:'rgba(16,185,129,.18)', text:'Pedido #PG001561 — Entregado',t:'Hace 2 h'},
  {icon:'⚠️',bg:'rgba(245,158,11,.18)', text:'Stock bajo: Filtro de aceite (5 uds)',t:'Hace 3 h'},
];
const PEDIDOS = [
  {id:'#PG001562',cli:'Carlos Ramírez',  f:'15/06/2026 10:30',total:'S/ 150.90',e:'En camino', c:'#3b82f6'},
  {id:'#PG001561',cli:'María Fernanda',  f:'15/06/2026 09:15',total:'S/ 89.50', e:'Entregado', c:'#10b981'},
  {id:'#PG001560',cli:'Juan Diego',      f:'14/06/2026 16:22',total:'S/ 120.00',e:'Preparando',c:'#f59e0b'},
  {id:'#PG001559',cli:'Lucía Martínez',  f:'14/06/2026 14:10',total:'S/ 65.00', e:'Entregado', c:'#10b981'},
  {id:'#PG001558',cli:'Pedro Castillo',  f:'14/06/2026 11:45',total:'S/ 75.00', e:'Cancelado', c:'#ef4444'},
];
const STOCK_BAJO = [
  {n:'Filtro de aceite',   sku:'FIL-001',s:5,  img:'/IMAGENES/ACEITE LUBRICANTE 4T25W-50 1LT.jpg'},
  {n:'Pastillas de freno', sku:'PFR-002',s:7,  img:'/IMAGENES/ZAPATA FRENO ROJA.jpg'},
  {n:'Bujía Iridium CR8',  sku:'BUJ-003',s:8,  img:'/IMAGENES/CAPUCHON DE BUJIA.jpg'},
  {n:'Aceite 10W-40 1L',   sku:'ACE-004',s:10, img:'/IMAGENES/ACEITE LUBRICANTE 4T25W-60 1LT.jpg'},
  {n:'Filtro de aire',     sku:'AIR-005',s:12, img:'/IMAGENES/ABRILLANTADOR DE NEUMATICOS 600ML.jpg'},
];

/* ══ SVG LÍNEA ══ */
function LineChart({ data }) {
  const W=480,H=160,PL=44,PR=12,PT=10,PB=30;
  const cW=W-PL-PR, cH=H-PT-PB, maxV=7000;
  const pts=data.map((d,i)=>({x:PL+(i/(data.length-1))*cW, y:PT+(1-d.v/maxV)*cH, ...d}));
  const line=pts.map((p,i)=>{
    if(i===0)return`M${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    const pp=pts[i-1];
    return`C${(pp.x+(p.x-pp.x)*.38).toFixed(1)},${pp.y.toFixed(1)} ${(p.x-(p.x-pp.x)*.38).toFixed(1)},${p.y.toFixed(1)} ${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  }).join(' ');
  const area=`${line} L${pts[pts.length-1].x},${PT+cH} L${pts[0].x},${PT+cH} Z`;
  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="lg1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7c3aed" stopOpacity=".4"/>
          <stop offset="100%" stopColor="#7c3aed" stopOpacity=".02"/>
        </linearGradient>
      </defs>
      {[0,2000,4000,6000].map(g=>{
        const y=(PT+(1-g/maxV)*cH).toFixed(1);
        return <g key={g}>
          <line x1={PL} y1={y} x2={W-PR} y2={y} stroke="#1f2035" strokeWidth="1"/>
          <text x={PL-4} y={+y+4} textAnchor="end" fill="#4b5563" fontSize="10.5">{g===0?'S/0':`S/${g/1000}K`}</text>
        </g>;
      })}
      <path d={area} fill="url(#lg1)"/>
      <path d={line} fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      {pts.map((p,i)=><g key={i}>
        <circle cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r="4.5" fill="#7c3aed" stroke="var(--bg2)" strokeWidth="2"/>
        <text x={p.x.toFixed(1)} y={H-3} textAnchor="middle" fill="#4b5563" fontSize="10">{p.d}</text>
      </g>)}
    </svg>
  );
}

/* ══ SVG DONA ══ */
function DonutChart({ segs }) {
  const total=segs.reduce((a,b)=>a+b.v,0);
  let angle=-Math.PI/2;
  const paths=segs.map(s=>{
    const sl=(s.v/total)*2*Math.PI, sa=angle, ea=angle+sl; angle=ea;
    const R=72,r=46,cx=80,cy=80;
    const x1=cx+R*Math.cos(sa),y1=cy+R*Math.sin(sa);
    const x2=cx+R*Math.cos(ea),y2=cy+R*Math.sin(ea);
    const xi1=cx+r*Math.cos(sa),yi1=cy+r*Math.sin(sa);
    const xi2=cx+r*Math.cos(ea),yi2=cy+r*Math.sin(ea);
    const lg=sl>Math.PI?1:0;
    return{...s,d:`M${x1.toFixed(1)},${y1.toFixed(1)} A${R},${R} 0 ${lg},1 ${x2.toFixed(1)},${y2.toFixed(1)} L${xi2.toFixed(1)},${yi2.toFixed(1)} A${r},${r} 0 ${lg},0 ${xi1.toFixed(1)},${yi1.toFixed(1)} Z`};
  });
  return(
    <svg width="160" height="160" viewBox="0 0 160 160">
      {paths.map((s,i)=><path key={i} d={s.d} fill={s.c}/>)}
      <text x="80" y="75" textAnchor="middle" fill="white" fontSize="22" fontWeight="800">{total}</text>
      <text x="80" y="93" textAnchor="middle" fill="#6b7280" fontSize="11">pedidos</text>
    </svg>
  );
}

/* ══ STAT CARD ══ */
function Stat({label,val,icon,iconBg,trend,tUp=true}){
  return(
    <div style={{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:'14px',padding:'20px',cursor:'default',transition:'transform .2s,box-shadow .2s'}}
      onMouseOver={e=>{e.currentTarget.style.transform='translateY(-3px)';e.currentTarget.style.boxShadow='0 8px 24px rgba(124,58,237,.15)';}}
      onMouseOut={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='none';}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'14px'}}>
        <div>
          <p style={{margin:'0 0 6px',fontSize:'13px',color:'var(--muted)',fontWeight:'500'}}>{label}</p>
          <p style={{margin:0,fontSize:'26px',fontWeight:'800',color:'var(--text)',letterSpacing:'-0.5px'}}>{val}</p>
        </div>
        <div style={{width:'46px',height:'46px',borderRadius:'12px',background:iconBg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'20px',flexShrink:0}}>{icon}</div>
      </div>
      <p style={{margin:0,fontSize:'12px',color:tUp?'#10b981':'#ef4444'}}>
        {tUp?'↑':'↓'} <strong>{trend}</strong> <span style={{color:'var(--muted)',fontWeight:'400'}}>vs mes anterior</span>
      </p>
    </div>
  );
}

export default function Dashboard() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ ventas:'S/ 24,580', pedidos:156, clientes:2845, productos:245 });
  const [periodo, setPeriodo] = useState('7d');
  const [pedidosReales, setPedidosReales] = useState([]);
  const [stockBajoReal, setStockBajoReal] = useState([]);

  useEffect(() => {
    const calcularVentasLocales = () => obtenerPedidosLocales().reduce((s, p) => s + Number(p.resumen?.total || 0), 0);

    const cargar = () => {
      apiFetch('/dashboard').then(d => {
        const ingresosApi = Number(d?.ingresos || 0);
        const ventasFinal = ingresosApi > 0 ? ingresosApi : calcularVentasLocales();
        setStats({
          ventas: `S/ ${ventasFinal.toLocaleString('es-PE',{minimumFractionDigits:2})}`,
          pedidos: d?.total_ventas || 156,
          clientes: d?.total_clientes || 2845,
          productos: d?.total_productos || 245,
        });
      }).catch(() => {
        const ventasLocales = calcularVentasLocales();
        if (ventasLocales > 0) {
          setStats(prev => ({ ...prev, ventas: `S/ ${ventasLocales.toLocaleString('es-PE',{minimumFractionDigits:2})}` }));
        }
      });
    };

    cargar();
    window.addEventListener('partgo_pedido_creado', cargar);
    window.addEventListener('partgo_orders_changed', cargar);
    return () => {
      window.removeEventListener('partgo_pedido_creado', cargar);
      window.removeEventListener('partgo_orders_changed', cargar);
    };
  }, []);

  useEffect(() => {
    const ESTADO_COLOR_LOCAL = { Pendiente:'#f59e0b', Pagado:'#3b82f6', Preparando:'#f59e0b', 'En camino':'#3b82f6', Entregado:'#10b981', Cancelado:'#ef4444' };
    const sync = () => {
      const locales = obtenerPedidosLocales().slice(0, 5).map((p) => ({
        id: `${p.serie}-${p.numero}`,
        cli: p.cliente?.nombre || 'Cliente PartGo',
        f: new Date(p.fecha).toLocaleString('es-PE', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }),
        total: `S/ ${Number(p.resumen?.total||0).toFixed(2)}`,
        e: p.estado,
        c: ESTADO_COLOR_LOCAL[p.estado] || '#6b7280',
      }));
      setPedidosReales(locales);

      const catalogo = obtenerCatalogo().filter(p => !p.eliminado);
      const bajo = catalogo
        .filter(p => Number(p.stock) <= 10)
        .sort((a, b) => Number(a.stock) - Number(b.stock))
        .slice(0, 5)
        .map(p => ({ n: p.nombre, sku: `PG-${String(p.id).padStart(5,'0')}`, s: Number(p.stock), img: p.imagen }));
      setStockBajoReal(bajo);
    };
    sync();
    window.addEventListener('partgo_orders_changed', sync);
    window.addEventListener('partgo_pedido_creado', sync);
    window.addEventListener('partgo_catalogo_changed', sync);
    return () => {
      window.removeEventListener('partgo_orders_changed', sync);
      window.removeEventListener('partgo_pedido_creado', sync);
      window.removeEventListener('partgo_catalogo_changed', sync);
    };
  }, []);

  const filaPedidos = pedidosReales.length > 0 ? pedidosReales : PEDIDOS;
  const filaStockBajo = stockBajoReal.length > 0 ? stockBajoReal : STOCK_BAJO;

  const now = new Date().toLocaleDateString('es-PE',{day:'numeric',month:'long',year:'numeric'});

  return (
    <div style={{color:'var(--text)',fontFamily:"'Inter',sans-serif"}}>
      <style>{`
        @keyframes dashIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
        .dash-card{animation:dashIn .4s ease both}
        .dash-card:nth-child(1){animation-delay:.05s}.dash-card:nth-child(2){animation-delay:.1s}
        .dash-card:nth-child(3){animation-delay:.15s}.dash-card:nth-child(4){animation-delay:.2s}
        .ped-row:hover td{background:rgba(124,58,237,.05)!important}
        .act-row:hover{background:rgba(124,58,237,.06)!important;border-radius:10px}
      `}</style>

      {/* ENCABEZADO */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'24px'}}>
        <div>
          <h1 style={{margin:'0 0 4px',fontSize:'24px',fontWeight:'800',letterSpacing:'-0.4px'}}>
            Bienvenido, {usuario?.nombre?.split(' ')[0]||'Admin'} 👋
          </h1>
          <p style={{margin:0,color:'var(--muted)',fontSize:'13px'}}>Panel de administración · {now}</p>
        </div>
        <div style={{display:'flex',gap:'8px'}}>
          {['7d','30d','3m'].map(p=>(
            <button key={p} onClick={()=>setPeriodo(p)} style={{padding:'7px 14px',borderRadius:'8px',border:'1px solid var(--border)',fontSize:'12px',fontWeight:'600',cursor:'pointer',fontFamily:"'Inter',sans-serif",transition:'all .15s',
              background:periodo===p?'#7c3aed':'var(--bg3)',color:periodo===p?'white':'var(--muted2)'}}>
              {p==='7d'?'7 días':p==='30d'?'30 días':'3 meses'}
            </button>
          ))}
        </div>
      </div>

      {/* STATS */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'16px',marginBottom:'20px'}}>
        <div className="dash-card"><Stat label="Ventas totales"      val={stats.ventas}             icon="💵" iconBg="rgba(16,185,129,.15)"  trend="12.5%"/></div>
        <div className="dash-card"><Stat label="Pedidos totales"     val={String(stats.pedidos)}    icon="🛒" iconBg="rgba(59,130,246,.15)"  trend="8.2%"/></div>
        <div className="dash-card"><Stat label="Clientes activos"    val={stats.clientes.toLocaleString()} icon="👥" iconBg="rgba(124,58,237,.15)" trend="15.3%"/></div>
        <div className="dash-card"><Stat label="Productos activos"   val={String(stats.productos)}  icon="📦" iconBg="rgba(245,158,11,.15)"  trend="5.7%"/></div>
      </div>

      {/* GRID: izquierda (ancho) + derecha (columna) */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 296px',gap:'16px'}}>

        {/* COLUMNA IZQUIERDA */}
        <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>

          {/* Gráfico + Dona */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 240px',gap:'16px'}}>
            {/* Ventas */}
            <div style={{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:'14px',padding:'20px'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
                <h3 style={{margin:0,fontSize:'15px',fontWeight:'700'}}>Ventas</h3>
                <span style={{fontSize:'12px',color:'var(--muted)'}}>Últimos {periodo==='7d'?'7 días':periodo==='30d'?'30 días':'3 meses'}</span>
              </div>
              <LineChart data={VENTAS_DATA}/>
            </div>

            {/* Dona */}
            <div style={{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:'14px',padding:'20px'}}>
              <h3 style={{margin:'0 0 14px',fontSize:'15px',fontWeight:'700'}}>Pedidos por estado</h3>
              <div style={{display:'flex',justifyContent:'center',marginBottom:'14px'}}>
                <DonutChart segs={ESTADOS}/>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:'7px'}}>
                {ESTADOS.map(s=>(
                  <div key={s.label} style={{display:'flex',alignItems:'center',gap:'8px'}}>
                    <span style={{width:'8px',height:'8px',borderRadius:'50%',background:s.c,flexShrink:0}}/>
                    <span style={{color:'var(--text2)',fontSize:'12px',flex:1}}>{s.label}</span>
                    <span style={{color:'var(--text)',fontSize:'12px',fontWeight:'600'}}>{s.v}</span>
                    <span style={{color:'var(--muted)',fontSize:'11px'}}>({s.pct}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tabla pedidos */}
          <div style={{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:'14px',padding:'20px'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
              <h3 style={{margin:0,fontSize:'15px',fontWeight:'700'}}>Últimos pedidos</h3>
              <Link to="/pedidos" style={{color:'#a78bfa',fontSize:'13px',fontWeight:'600',textDecoration:'none',transition:'color .15s'}}
                onMouseOver={e=>e.target.style.color='#7c3aed'} onMouseOut={e=>e.target.style.color='#a78bfa'}>
                Ver todos →
              </Link>
            </div>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead>
                <tr style={{borderBottom:'1px solid var(--border)'}}>
                  {['Pedido','Cliente','Fecha','Total','Estado',''].map(h=>(
                    <th key={h} style={{color:'var(--muted)',fontSize:'11px',fontWeight:'600',padding:'8px 10px',textAlign:'left',textTransform:'uppercase',letterSpacing:'.04em',whiteSpace:'nowrap'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filaPedidos.map((p,i)=>(
                  <tr key={i} className="ped-row" style={{borderBottom:'1px solid var(--border)',cursor:'pointer'}} onClick={()=>navigate('/pedidos')}>
                    <td style={{padding:'12px 10px',color:'#a78bfa',fontWeight:'700',fontSize:'13px'}}>{p.id}</td>
                    <td style={{padding:'12px 10px',color:'var(--text)',fontSize:'13px'}}>{p.cli}</td>
                    <td style={{padding:'12px 10px',color:'var(--muted)',fontSize:'12px',whiteSpace:'nowrap'}}>{p.f}</td>
                    <td style={{padding:'12px 10px',color:'var(--text)',fontWeight:'700',fontSize:'13px'}}>{p.total}</td>
                    <td style={{padding:'12px 10px'}}>
                      <span style={{background:p.c+'22',color:p.c,padding:'4px 10px',borderRadius:'20px',fontSize:'11px',fontWeight:'700',whiteSpace:'nowrap'}}>{p.e}</span>
                    </td>
                    <td style={{padding:'12px 10px'}}>
                      <button style={{background:'var(--bg4)',border:'1px solid var(--border)',borderRadius:'6px',padding:'4px 10px',fontSize:'12px',color:'var(--muted2)',cursor:'pointer',fontFamily:"'Inter',sans-serif",transition:'all .15s'}}
                        onMouseOver={e=>{e.currentTarget.style.background='#7c3aed';e.currentTarget.style.color='white';e.currentTarget.style.borderColor='#7c3aed';}}
                        onMouseOut={e=>{e.currentTarget.style.background='var(--bg4)';e.currentTarget.style.color='var(--muted2)';e.currentTarget.style.borderColor='var(--border)';}}>
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* COLUMNA DERECHA */}
        <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>

          {/* Actividad reciente */}
          <div style={{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:'14px',padding:'18px'}}>
            <h3 style={{margin:'0 0 14px',fontSize:'15px',fontWeight:'700'}}>Actividad reciente</h3>
            <div style={{display:'flex',flexDirection:'column',gap:'2px'}}>
              {ACTIVIDAD.map((a,i)=>(
                <div key={i} className="act-row" style={{display:'flex',gap:'10px',alignItems:'flex-start',padding:'8px',transition:'background .15s',cursor:'default'}}>
                  <div style={{width:'32px',height:'32px',borderRadius:'9px',background:a.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'14px',flexShrink:0}}>{a.icon}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{margin:'0 0 2px',fontSize:'12px',color:'var(--text)',fontWeight:'500',lineHeight:1.3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.text}</p>
                    <p style={{margin:0,fontSize:'11px',color:'var(--muted)'}}>{a.t}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stock bajo */}
          <div style={{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:'14px',padding:'18px',flex:1}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'14px'}}>
              <h3 style={{margin:0,fontSize:'15px',fontWeight:'700'}}>Stock bajo</h3>
              <Link to="/stock-bajo" style={{color:'#a78bfa',fontSize:'12px',fontWeight:'600',textDecoration:'none'}}>Ver todos</Link>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
              {filaStockBajo.map((p,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:'10px',padding:'9px 10px',background:'var(--bg4)',borderRadius:'10px',border:'1px solid var(--border)',transition:'border-color .15s',cursor:'pointer'}}
                  onMouseOver={e=>e.currentTarget.style.borderColor='#7c3aed'}
                  onMouseOut={e=>e.currentTarget.style.borderColor='var(--border)'}>
                  <div style={{width:'38px',height:'38px',background:'var(--bg2)',borderRadius:'8px',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden'}}>
                    <img src={p.img} alt="" style={{maxWidth:'34px',maxHeight:'34px',objectFit:'contain'}} onError={e=>e.target.style.display='none'}/>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{margin:'0 0 2px',fontSize:'12px',fontWeight:'600',color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.n}</p>
                    <p style={{margin:0,fontSize:'10px',color:'var(--muted)'}}>SKU: {p.sku}</p>
                  </div>
                  <span style={{background:'rgba(239,68,68,.15)',color:'#ef4444',fontSize:'11px',fontWeight:'800',padding:'3px 8px',borderRadius:'6px',whiteSpace:'nowrap',flexShrink:0}}>
                    Stock: {p.s}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <p style={{textAlign:'center',color:'var(--muted)',fontSize:'12px',marginTop:'28px',paddingTop:'18px',borderTop:'1px solid var(--border)'}}>
        © 2026 <strong style={{color:'#7c3aed'}}>PartGo</strong> · Panel de administración
      </p>
    </div>
  );
}
