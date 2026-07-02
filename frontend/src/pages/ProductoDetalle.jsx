import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from '../services/api';
import Swal from 'sweetalert2';
import { agregarAlCarrito, guardarCarrito as guardarCarritoCore, normalizarProducto } from '../utils/shopCore';
import { obtenerCatalogo } from '../utils/catalogoStore';
import '../productoDetalle.css';

const productosFallback = [
  { id: 1, nombre: 'Kit de arrastre DID 428H', marca: 'Dorada Motor’s', modelo: '428H', precio: 150, precio_oferta: 0, stock: 12, categoria: 'Transmisión', descripcion: 'Kit de arrastre reforzado para motocicleta.', imagen: '/IMAGENES/CADENA 428-114L.jpg' },
  { id: 2, nombre: 'Pastillas de freno Brembo', marca: 'Brembo', modelo: 'Universal', precio: 59.9, precio_oferta: 0, stock: 24, categoria: 'Frenos', descripcion: 'Pastillas de freno con excelente respuesta.', imagen: '/IMAGENES/ZAPATA FRENO ROJA.jpg' },
  { id: 3, nombre: 'Amortiguador trasero YSS', marca: 'YSS', modelo: 'Trasero', precio: 299.9, precio_oferta: 0, stock: 6, categoria: 'Suspensión', descripcion: 'Amortiguador para manejo suave y seguro.', imagen: '/IMAGENES/BARRA TELESCOPICA CARGUERO.jpg' },
  { id: 4, nombre: 'Batería 12V 7Ah Yuasa', marca: 'Yuasa', modelo: '12V', precio: 85.9, precio_oferta: 0, stock: 9, categoria: 'Eléctricos', descripcion: 'Batería sellada para motocicleta.', imagen: '/IMAGENES/BOBINA 12V.jpg' },
  { id: 5, nombre: 'Faro delantero LED', marca: 'Duno', modelo: 'LED', precio: 189.9, precio_oferta: 0, stock: 16, categoria: 'Iluminación', descripcion: 'Faro delantero LED de alta potencia.', imagen: '/IMAGENES/FARO DELANTERO REDONDO.jpg' },
  { id: 6, nombre: 'Disco de freno trasero', marca: 'Dorada Motor’s', modelo: 'Trasero', precio: 170, precio_oferta: 0, stock: 8, categoria: 'Frenos', descripcion: 'Disco de freno trasero resistente.', imagen: '/IMAGENES/ALTERNADOR 4P CGL.jpg' },
  { id: 7, nombre: 'Bujía NGK CR7HSA', marca: 'NGK', modelo: 'CR7HSA', precio: 15.9, precio_oferta: 0, stock: 18, categoria: 'Eléctricos', descripcion: 'Bujía original NGK.', imagen: '/IMAGENES/CAPUCHON DE BUJIA.jpg' },
  { id: 8, nombre: 'Filtro de aceite K&N', marca: 'K&N', modelo: 'Filtro', precio: 65, precio_oferta: 0, stock: 14, categoria: 'Filtros', descripcion: 'Filtro de aceite para protección del motor.', imagen: '/IMAGENES/ACEITE LUBRICANTE 4T25W-50 1LT.jpg' },
  { id: 91, nombre: 'Aro con Llanta 5.00-12', marca: 'Dorada Motor’s', modelo: '5.00-12', precio: 150, precio_oferta: 0, stock: 7, categoria: 'Llantas', descripcion: 'Aro con llanta para moto carguera.', imagen: '/IMAGENES/ARO CON LLANTA 5.00-12 (4H).jpg' },
];

function normalizarProductoDetalle(producto) {
  const precioBase = Number(producto.precio || producto.p || 0);
  const precioOferta = Number(producto.precio_oferta || 0);
  const tieneOferta = !!producto.en_oferta && precioOferta > 0 && precioOferta < precioBase;
  const precioFinal = tieneOferta ? precioOferta : (Number(producto.precio_final) || precioBase);
  return {
    ...producto,
    id: Number(producto.id || producto.producto_id || producto.id_producto || 1),
    nombre: producto.nombre || producto.n || 'Producto Dorada Motor’s',
    precio: precioFinal > 0 ? precioFinal : precioBase,
    precio_regular: precioBase,
    en_oferta: tieneOferta,
    es_nuevo: !!producto.es_nuevo,
    precio_final: precioFinal > 0 ? precioFinal : precioBase,
    imagen: producto.imagen || producto.img || '/IMAGENES/ACEITE LUBRICANTE 4T25W-50 1LT.jpg',
    categoria: producto.categoria || producto.categoria_nombre || 'Repuestos',
    stock: Number(producto.stock ?? 1),
  };
}

export default function ProductoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [producto, setProducto] = useState(null);
  const [cantidad, setCantidad] = useState(1);
  const [relacionados, setRelacionados] = useState([]);
  const [rotacion360, setRotacion360] = useState(0);
 const [arrastrando360, setArrastrando360] = useState(false);
 const [ultimoX360, setUltimoX360] = useState(0);

  useEffect(() => {
    async function cargar() {
      try {
        const data = await apiFetch(`/productos/${id}`);
        setProducto(normalizarProductoDetalle(data));
      } catch {
        const catalogo = obtenerCatalogo().filter(p => !p.eliminado);
        const fallback = catalogo.find((p) => String(p.id) === String(id)) || productosFallback.find((p) => String(p.id) === String(id)) || catalogo[0] || productosFallback[0];
        setProducto(normalizarProductoDetalle(fallback));
      }

      try {
        const lista = await apiFetch('/productos');
        setRelacionados(lista.slice(0, 4).map(normalizarProductoDetalle));
      } catch {
        const catalogo = obtenerCatalogo().filter(p => !p.eliminado);
        setRelacionados(catalogo.filter(p => String(p.id) !== String(id)).slice(0, 4).map(normalizarProductoDetalle));
      }
    }

    cargar();
  }, [id]);

  useEffect(() => {
    const sync = () => {
      const catalogo = obtenerCatalogo().filter(p => !p.eliminado);
      const actualizado = catalogo.find((p) => String(p.id) === String(id));
      if (actualizado) setProducto(normalizarProductoDetalle(actualizado));
    };
    window.addEventListener('partgo_catalogo_changed', sync);
    return () => window.removeEventListener('partgo_catalogo_changed', sync);
  }, [id]);

  if (!producto) {
    return <div className="detalle-loading">Cargando producto...</div>;
  }

  const agregarCarrito = () => {
    if (Number(producto.stock) === 0) return;
    agregarAlCarrito(producto, cantidad);
    Swal.fire({
      icon: 'success',
      title: 'Producto agregado al carrito',
      text: 'Puedes seguir comprando o revisar tu carrito.',
      showCancelButton: true,
      confirmButtonText: 'Ver carrito',
      cancelButtonText: 'Seguir viendo',
      confirmButtonColor: '#7c3aed',
      background: 'var(--pg-surface)',
      color: 'var(--pg-text)',
      backdrop: 'rgba(8,8,15,.7)',
      customClass: { popup: 'pg-cart-popup' },
      showClass: { popup: 'pg-cart-popup-show' },
    }).then((r) => { if (r.isConfirmed) navigate('/s/carrito'); });
  };

  const comprarAhora = async () => {
    if (Number(producto.stock) === 0) return;
    guardarCarritoCore([{ ...normalizarProducto(producto), cantidad }]);
    const usuario = localStorage.getItem('partgo_usuario');
    if (!usuario) {
      const r = await Swal.fire({
        icon: 'question',
        title: 'Para comprar, elige una opción',
        text: 'Puedes iniciar sesión, registrarte o continuar como invitado.',
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonText: 'Iniciar sesión',
        denyButtonText: 'Registrarme',
        cancelButtonText: 'Invitado',
        confirmButtonColor: '#7c3aed',
        denyButtonColor: '#9333ea',
        cancelButtonColor: '#111827',
        background: 'var(--pg-surface)',
        color: 'var(--pg-text)'
      });
      localStorage.setItem('partgo_return_after_login','/s/checkout');
      if (r.isConfirmed) navigate('/login?return=/s/checkout');
      else if (r.isDenied) navigate('/registro?return=/s/checkout');
      else if (r.dismiss === Swal.DismissReason.cancel) navigate('/s/checkout?modo=invitado');
      return;
    }
    navigate('/s/checkout');
  };

  const precio = Number(producto.precio_final || producto.precio || 0);
  const whatsappMensaje = encodeURIComponent(`Hola, quiero consultar por el producto ${producto.nombre} - cantidad ${cantidad}`);
  const whatsappUrl = `https://wa.me/51922859170?text=${whatsappMensaje}`;
const volver = () => {
    if (location.key && location.key !== 'default') navigate(-1);
    else navigate('/s/categorias');
  };

  return (
    <div className="detalle-public-page">
      <button className="detalle-back" onClick={volver}>← Atrás</button>

      <div className="detalle-public-grid">
        <section className="detalle-gallery-pro">
 <div
  className={`detalle-main-pro detalle-main-360 ${arrastrando360 ? 'is-dragging' : ''}`}
  role="button"
  tabIndex={0}
  aria-label="Vista interactiva 360 grados del producto"
  title="Arrastra horizontalmente para girar el producto"
  onPointerDown={(e) => {
   e.preventDefault();
   setArrastrando360(true);
   setUltimoX360(e.clientX);
   e.currentTarget.setPointerCapture?.(e.pointerId);
  }}
  onPointerMove={(e) => {
   if (!arrastrando360) return;

   const desplazamiento = e.clientX - ultimoX360;

   setRotacion360((rotacion) => rotacion + desplazamiento * 0.7);
   setUltimoX360(e.clientX);
  }}
  onPointerUp={(e) => {
   setArrastrando360(false);
   e.currentTarget.releasePointerCapture?.(e.pointerId);
  }}
  onPointerCancel={() => setArrastrando360(false)}
  onKeyDown={(e) => {
   if (e.key === 'ArrowLeft') {
    setRotacion360((rotacion) => rotacion - 20);
   }

   if (e.key === 'ArrowRight') {
    setRotacion360((rotacion) => rotacion + 20);
   }

   if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    setRotacion360((rotacion) => rotacion + 90);
   }
  }}
  onDoubleClick={() => setRotacion360(0)}
 >
  <span className="detalle-360-badge">
   <span>↻</span>
   Vista 360°
  </span>

  <img
   className="detalle-producto-360"
   src={producto.imagen}
   alt={producto.nombre}
   draggable="false"
   style={{
    transform: `perspective(900px) rotateY(${rotacion360}deg)`
   }}
  />

  <div className="detalle-360-ayuda">
   <span>↔</span>
   Arrastra para girar
  </div>
 </div>
 </section>

 <section className="detalle-info-pro">
          <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
            <span className="detalle-badge-pro">⭐ DESTACADO</span>
            {producto.es_nuevo&&<span className="detalle-badge-pro" style={{background:'rgba(59,130,246,.16)',color:'#3b82f6',borderColor:'rgba(59,130,246,.35)'}}>✨ NUEVO</span>}
            {producto.en_oferta&&<span className="detalle-badge-pro" style={{background:'rgba(239,68,68,.16)',color:'#ef4444',borderColor:'rgba(239,68,68,.35)'}}>🏷️ OFERTA</span>}
          </div>
          <h1>{producto.nombre}</h1>
          <div style={{display:'flex',alignItems:'baseline',gap:'10px'}}>
            <h2>S/ {precio.toFixed(2)}</h2>
            {producto.en_oferta&&<span style={{color:'var(--pg-muted)',fontSize:'18px',textDecoration:'line-through',fontWeight:'700'}}>S/ {Number(producto.precio_regular||0).toFixed(2)}</span>}
          </div>
          {producto.stock > 0
            ? <p className="stock-ok-pro">✓ En stock</p>
            : <p className="stock-ok-pro" style={{color:'#ef4444'}}>✕ Agotado</p>}

          <div className="detalle-specs">
            <div><b>⚙️ Modelo:</b><span>{producto.modelo || 'Universal'}</span></div>
            <div><b>🏷️ Categoría:</b><span>{producto.categoria || 'Repuesto'}</span></div>
            <div><b>📦 Presentación:</b><span>{producto.presentacion || 'Caja x 05'}</span></div>
            <div><b>✅ Stock disponible:</b><span>{producto.stock} unidades</span></div>
            <div><b>🏁 Marca:</b><span>{producto.marca || 'Dorada Motor’s'}</span></div>
            <div><b>🔗 SKU:</b><span>PG-{String(producto.id).padStart(5, '0')}</span></div>
          </div>

          <a className="detalle-whatsapp-pro" href={whatsappUrl} target="_blank" rel="noreferrer">
            <span>🟢</span>
            <div><small>Dorada Motor’s Online</small><strong>Consulta por WhatsApp</strong></div>
            <b>›</b>
          </a>

          <p className="detalle-desc-pro">{producto.descripcion || 'Producto de calidad para mantenimiento y reparación de motocicletas.'}</p>

          <h3>Cantidad</h3>
          <div className="detalle-cantidad-pro">
            <button onClick={() => setCantidad(Math.max(1, cantidad - 1))} disabled={producto.stock===0}>−</button>
            <span>{cantidad}</span>
            <button onClick={() => setCantidad(Math.min(producto.stock||1, cantidad + 1))} disabled={producto.stock===0}>+</button>
          </div>

          <div className="detalle-actions-pro">
            <button className="btn-add-pro" onClick={agregarCarrito} disabled={producto.stock===0} style={producto.stock===0?{opacity:.5,cursor:'not-allowed'}:undefined}>
              {producto.stock===0?'✕ AGOTADO':'🛒 AÑADIR AL CARRITO'}
            </button>
            <button className="btn-buy-pro" onClick={comprarAhora} disabled={producto.stock===0} style={producto.stock===0?{opacity:.5,cursor:'not-allowed'}:undefined}>⚡ COMPRAR YA</button>
          </div>

          <button className="detalle-deseos-pro" onClick={() => {
            localStorage.setItem('partgo_favorito_' + producto.id, JSON.stringify(producto));
            Swal.fire({icon:'success', title:'Agregado a favoritos', timer:1100, showConfirmButton:false, background:'var(--pg-surface)', color:'var(--pg-text)'});
          }}>♡ Añadir a la lista de deseos</button>

          <div className="detalle-tags-pro">
            <span>Etiquetas:</span>
            <b>{producto.categoria}</b>
            <b>{producto.modelo || 'Universal'}</b>
          </div>
        </section>
      </div>

      <section className="detalle-relacionados-pro">
        <h2>Productos relacionados</h2>
        <div className="detalle-rel-grid-pro">
          {relacionados.map((item) => (
            <article key={item.id} onClick={() => navigate(`/producto/${item.id}`)}>
              <img src={item.imagen} alt={item.nombre} />
              <div>
                <h3>{item.nombre}</h3>
                <p>{item.descripcion || 'Repuesto de calidad'}</p>
                <strong>S/ {Number(item.precio_final || item.precio || 0).toFixed(2)}</strong>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

