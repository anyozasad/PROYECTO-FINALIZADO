import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { Trash2 } from 'lucide-react';
import { apiFetch } from '../services/api';
import { useAuth } from '../context/AuthContext';
import '../cliente.css';
import { productosArchivo, categoriasArchivo } from '../data/productosArchivo';
import { abrirDetalleProducto } from '../utils/productoDetalleStore';

const UBIGEO_PERU = {
  Amazonas: { Chachapoyas: ['Chachapoyas', 'Asunción', 'Balsas'], Bagua: ['Bagua', 'Aramango', 'Copallín'], Utcubamba: ['Bagua Grande', 'Cajaruro', 'Jamalca'] },
  Áncash: { Huaraz: ['Huaraz', 'Independencia'], Santa: ['Chimbote', 'Nuevo Chimbote'], Casma: ['Casma', 'Buena Vista Alta'] },
  Apurímac: { Abancay: ['Abancay', 'Tamburco'], Andahuaylas: ['Andahuaylas', 'Talavera'], Chincheros: ['Chincheros', 'Anco Huallo'] },
  Arequipa: { Arequipa: ['Cercado', 'Cayma', 'Yanahuara', 'Miraflores'], Camaná: ['Camaná', 'Samuel Pastor'], Islay: ['Mollendo', 'Mejía'] },
  Ayacucho: { Huamanga: ['Ayacucho', 'San Juan Bautista', 'Carmen Alto'], Huanta: ['Huanta', 'Luricocha'], LaMar: ['San Miguel', 'Tambo'] },
  Cajamarca: { Cajamarca: ['Cajamarca', 'Baños del Inca'], Jaén: ['Jaén', 'Bellavista'], Chota: ['Chota', 'Lajas'] },
  Callao: { Callao: ['Callao', 'Bellavista', 'La Perla', 'Ventanilla'] },
  Cusco: { Cusco: ['Cusco', 'Wanchaq', 'Santiago', 'San Sebastián'], Urubamba: ['Urubamba', 'Ollantaytambo'], LaConvención: ['Santa Ana', 'Echarate'] },
  Huancavelica: { Huancavelica: ['Huancavelica', 'Ascensión'], Tayacaja: ['Pampas', 'Daniel Hernández'], Acobamba: ['Acobamba', 'Andabamba'] },
  Huánuco: { Huánuco: ['Huánuco', 'Amarilis', 'Pillco Marca'], LeoncioPrado: ['Rupa-Rupa', 'Castillo Grande'], Ambo: ['Ambo', 'Tomaykichwa'] },
  Ica: { Ica: ['Ica', 'Parcona', 'La Tinguiña', 'Subtanjalla'], Chincha: ['Chincha Alta', 'Sunampe'], Pisco: ['Pisco', 'San Andrés'] },
  Junín: { Huancayo: ['Huancayo', 'El Tambo', 'Chilca'], Tarma: ['Tarma', 'Acobamba'], Chanchamayo: ['La Merced', 'Pichanaqui'] },
  LaLibertad: { Trujillo: ['Trujillo', 'La Esperanza', 'El Porvenir'], Pacasmayo: ['San Pedro de Lloc', 'Pacasmayo'], Chepén: ['Chepén', 'Pacanga'] },
  Lambayeque: { Chiclayo: ['Chiclayo', 'José Leonardo Ortiz', 'La Victoria'], Lambayeque: ['Lambayeque', 'Motupe'], Ferreñafe: ['Ferreñafe', 'Pítipo'] },
  Lima: { Lima: ['Lima', 'Ate', 'San Juan de Lurigancho', 'Comas', 'Los Olivos', 'Miraflores', 'Surco', 'San Isidro'], Huaral: ['Huaral', 'Chancay'], Cañete: ['San Vicente de Cañete', 'Imperial'] },
  Loreto: { Maynas: ['Iquitos', 'Punchana', 'Belén', 'San Juan Bautista'], AltoAmazonas: ['Yurimaguas', 'Balsapuerto'], Requena: ['Requena', 'Saquena'] },
  MadreDeDios: { Tambopata: ['Puerto Maldonado', 'Inambari'], Manu: ['Manu', 'Fitzcarrald'], Tahuamanu: ['Iñapari', 'Iberia'] },
  Moquegua: { MariscalNieto: ['Moquegua', 'Samegua'], Ilo: ['Ilo', 'Pacocha'], SánchezCerro: ['Omate', 'Puquina'] },
  Pasco: { Pasco: ['Chaupimarca', 'Yanacancha'], Oxapampa: ['Oxapampa', 'Villa Rica'], DanielCarrión: ['Yanahuanca', 'Chacayán'] },
  Piura: { Piura: ['Piura', 'Castilla', 'Veintiséis de Octubre'], Sullana: ['Sullana', 'Bellavista'], Talara: ['Pariñas', 'Máncora'] },
  Puno: { Puno: ['Puno', 'Acora'], SanRomán: ['Juliaca', 'Caracoto'], Azángaro: ['Azángaro', 'Asillo'] },
  SanMartín: { Moyobamba: ['Moyobamba', 'Soritor'], SanMartín: ['Tarapoto', 'Morales', 'La Banda de Shilcayo'], Rioja: ['Rioja', 'Nueva Cajamarca'] },
  Tacna: { Tacna: ['Tacna', 'Alto de la Alianza', 'Ciudad Nueva'], JorgeBasadre: ['Locumba', 'Ite'], Tarata: ['Tarata', 'Estique'] },
  Tumbes: { Tumbes: ['Tumbes', 'Corrales'], Zarumilla: ['Zarumilla', 'Aguas Verdes'], ContralmiranteVillar: ['Zorritos', 'Canoas de Punta Sal'] },
  Ucayali: { CoronelPortillo: ['Callería', 'Yarinacocha', 'Manantay'], PadreAbad: ['Aguaytía', 'Irazola'], Atalaya: ['Raymondi', 'Sepahua'] }
};

const DEPARTAMENTOS_PERU = Object.keys(UBIGEO_PERU);
const nombreUbigeo = (texto) => String(texto).replace(/([a-záéíóúñ])([A-ZÁÉÍÓÚÑ])/g, '$1 $2');


export default function Cliente() {
  const navigate = useNavigate();
  const location = useLocation();
  const vistaCarrito = location.hash === '#carrito';
  const esCheckout = location.hash === '#checkout';
  const { usuario, logout } = useAuth();

  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [categoria, setCategoria] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [marcaFiltro, setMarcaFiltro] = useState('');
  const [precioMax, setPrecioMax] = useState('');
  const [soloStock, setSoloStock] = useState(false);
  const [vistaCatalogo, setVistaCatalogo] = useState('todos');
  const [carrito, setCarrito] = useState([]);
  const [mostrarPago, setMostrarPago] = useState(false);
  const [comprobante, setComprobante] = useState(null);
  const [compras, setCompras] = useState([]);

  const [cliente, setCliente] = useState({
    nombre: usuario?.nombre || '',
    documento: '',
    telefono: '',
    email: usuario?.email || '',
    direccion: ''
  });

  const [perfil, setPerfil] = useState({
    nombre: usuario?.nombre || '',
    email: usuario?.email || '',
    telefono: usuario?.telefono || '',
    direccion: usuario?.direccion || ''
  });

  const [pago, setPago] = useState({ metodo_pago: 'YAPE', tipo_comprobante: 'BOLETA' });
  const [departamento, setDepartamento] = useState('');
  const [provincia, setProvincia] = useState('');
  const [distrito, setDistrito] = useState('');

  const cargar = async () => {
    // Mantiene la interfaz original, pero ahora también muestra productos creados
    // desde el panel administrador. Si el backend no responde, usa el catálogo local.
    try {
      const [productosApi, categoriasApi] = await Promise.all([
        apiFetch('/productos').catch(() => []),
        apiFetch('/categorias').catch(() => [])
      ]);

      const mapaProductos = new Map();
      [...productosArchivo, ...(Array.isArray(productosApi) ? productosApi : [])]
        .map(productoNormalizado)
        .forEach((producto) => mapaProductos.set(String(producto.id), producto));

      setProductos(Array.from(mapaProductos.values()));
      setCategorias(Array.isArray(categoriasApi) && categoriasApi.length ? categoriasApi : categoriasArchivo);
    } catch (error) {
      setProductos(productosArchivo.map(productoNormalizado));
      setCategorias(categoriasArchivo);
    }

    apiFetch('/mis-compras').then(setCompras).catch(() => setCompras([]));
  };

  useEffect(() => {
    cargar().catch(() => { setProductos(productosArchivo.map(productoNormalizado)); setCategorias(categoriasArchivo); });

    const guardado = JSON.parse(localStorage.getItem('partgo_carrito') || '[]');
    if (guardado.length) {
      setCarrito(guardado.map((item) => ({
        ...item,
        imagen: imagenProducto(item),
        precio_final: Number(item.precio_final || item.precio_oferta || item.precio || 0),
        cantidad: Number(item.cantidad || 1)
      })));
      setMostrarPago(false);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('partgo_carrito', JSON.stringify(carrito));
  }, [carrito]);

  const marcasDisponibles = useMemo(() => {
    return [...new Set(productos.map((p) => p.marca).filter(Boolean))].sort();
  }, [productos]);

  const productosFiltrados = useMemo(() => {
    return productos.filter((p) => {
      const categoriaSeleccionada = categorias.find((c) => String(c.id) === String(categoria));
      const matchCategoria = categoria ? Number(p.categoria_id) === Number(categoria) || p.categoria === categoriaSeleccionada?.nombre : true;
      const matchMarca = marcaFiltro ? String(p.marca || '').toLowerCase() === marcaFiltro.toLowerCase() : true;
      const matchPrecio = precioMax ? Number(p.precio || p.precio_final || 0) <= Number(precioMax) : true;
      const matchStock = soloStock ? Number(p.stock || 0) > 0 : true;
      const texto = `${p.nombre || ''} ${p.marca || ''} ${p.categoria || ''} ${p.descripcion || ''}`.toLowerCase();
      return matchCategoria && matchMarca && matchPrecio && matchStock && texto.includes(busqueda.toLowerCase());
    });
  }, [productos, categoria, busqueda, marcaFiltro, precioMax, soloStock]);

  const ofertasTodas = productosFiltrados.filter((p) => Number(p.en_oferta) === 1);
  const nuevosTodos = productosFiltrados.filter((p) => Number(p.es_nuevo) === 1);
  const destacadosTodos = productosFiltrados.filter((p) => Number(p.destacado) === 1);
  const agotadosTodos = productosFiltrados.filter((p) => Number(p.stock) <= 0);
  const ofertas = ofertasTodas.slice(0, 4);
  const nuevos = nuevosTodos.slice(0, 4);

  const precioProducto = (producto) => Number(producto.en_oferta && producto.precio_oferta > 0 ? producto.precio_oferta : producto.precio);

  const textoNormal = (valor = '') => String(valor).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

  const buscarProductoArchivo = (producto = {}) => {
    const nombreActual = textoNormal(producto.nombre);
    const palabrasActuales = nombreActual.split(' ').filter((w) => w.length > 2);

    return productosArchivo.find((base) => Number(base.id) === Number(producto.id))
      || productosArchivo.find((base) => textoNormal(base.nombre) === nombreActual)
      || productosArchivo.find((base) => {
        const nombreBase = textoNormal(base.nombre);
        return nombreBase.includes(nombreActual) || nombreActual.includes(nombreBase);
      })
      || productosArchivo.find((base) => {
        const nombreBase = textoNormal(base.nombre);
        return palabrasActuales.length >= 2 && palabrasActuales.filter((w) => nombreBase.includes(w)).length >= Math.min(2, palabrasActuales.length);
      });
  };

  const imagenProducto = (producto = {}) => {
    const base = buscarProductoArchivo(producto);
    if (base?.imagen) return base.imagen;
    if (producto.imagen && String(producto.imagen).startsWith('/IMAGENES/')) return producto.imagen;
    if (producto.imagen && String(producto.imagen).startsWith('IMAGENES/')) return `/${producto.imagen}`;
    if (producto.imagen && String(producto.imagen).startsWith('/')) return producto.imagen;
    if (producto.imagen && !String(producto.imagen).startsWith('http')) return `/IMAGENES/${producto.imagen}`;
    return producto.imagen || '';
  };

  const productoNormalizado = (producto) => ({
    ...producto,
    imagen: imagenProducto(producto)
  });

  const irInicioCliente = () => {
    navigate('/cliente');
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 80);
  };

  const irSeccion = (id) => {
    navigate('/cliente');
    setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
  };

  const subtotal = carrito.reduce((sum, item) => {
    const precio = Number(item.precio_final || item.precio || 0);
    return sum + precio * Number(item.cantidad || 1);
  }, 0);

  const envio = carrito.length ? 10 : 0;
  const total = subtotal + envio;

  const agregar = (producto) => {
    const precio = precioProducto(producto);
    const existe = carrito.find((i) => Number(i.id) === Number(producto.id));

    if (existe) {
      setCarrito(carrito.map((i) => Number(i.id) === Number(producto.id) ? { ...i, cantidad: i.cantidad + 1 } : i));
    } else {
      setCarrito([...carrito, { ...producto, imagen: imagenProducto(producto), precio_final: precio, cantidad: 1 }]);
    }

    Swal.fire({ icon: 'success', title: 'Agregado al carrito', timer: 900, showConfirmButton: false });
  };

  const quitar = async (id) => {
    const resp = await Swal.fire({
      title: '¿Estás seguro de eliminar?',
      text: 'El producto se quitará del carrito.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí',
      cancelButtonText: 'No',
      confirmButtonColor: '#facc15',
      cancelButtonColor: '#111827'
    });

    if (resp.isConfirmed) {
      setCarrito(carrito.filter((i) => Number(i.id) !== Number(id)));
      Swal.fire({ icon: 'success', title: 'Producto eliminado', timer: 900, showConfirmButton: false });
    }
  };

  const limpiarCarrito = async () => {
    if (!carrito.length) return;

    const resp = await Swal.fire({
      title: '¿Estás seguro de vaciar el carrito?',
      text: 'Se eliminarán todos los productos seleccionados.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí',
      cancelButtonText: 'No',
      confirmButtonColor: '#facc15',
      cancelButtonColor: '#111827'
    });

    if (resp.isConfirmed) {
      setCarrito([]);
      Swal.fire({ icon: 'success', title: 'Carrito limpiado', timer: 900, showConfirmButton: false });
    }
  };

  const cambiarCantidad = (id, tipo) => {
    setCarrito(carrito.map((item) => {
      if (Number(item.id) !== Number(id)) return item;
      const nueva = tipo === 'sumar' ? item.cantidad + 1 : item.cantidad - 1;
      return { ...item, cantidad: Math.max(1, nueva) };
    }));
  };

  const abrirPago = () => {
    if (!carrito.length) {
      Swal.fire('Carrito vacío', 'Agrega productos antes de comprar.', 'warning');
      return;
    }
    setMostrarPago(true);
    navigate('/cliente#carrito');
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
  };

  const comprar = async () => {
    if (!carrito.length) return Swal.fire('Carrito vacío', 'Agrega productos antes de pagar.', 'warning');
    if (!cliente.nombre || !cliente.documento || !cliente.telefono || !cliente.direccion) {
      return Swal.fire('Datos incompletos', 'Completa tus datos de entrega.', 'warning');
    }

    try {
      const data = await apiFetch('/checkout', {
        method: 'POST',
        body: JSON.stringify({
          cliente,
          metodo_pago: pago.metodo_pago,
          tipo_comprobante: pago.tipo_comprobante,
          direccion_entrega: `${cliente.direccion}${distrito ? ', ' + distrito : ''}${provincia ? ', ' + nombreUbigeo(provincia) : ''}${departamento ? ', ' + nombreUbigeo(departamento) : ''}`,
          items: carrito.map((i) => ({ producto_id: i.id, cantidad: i.cantidad }))
        })
      });

      const nuevoComprobante = {
        numero: data.numero_comprobante,
        tipo: pago.tipo_comprobante,
        cliente: cliente.nombre,
        documento: cliente.documento,
        telefono: cliente.telefono,
        email: cliente.email,
        direccion: cliente.direccion,
        metodo_pago: pago.metodo_pago,
        subtotal,
        envio,
        total: data.total + envio,
        detalle: data.detalle.map((d) => ({
          ...d,
          precio: Number(d.precio_unitario || d.precio || 0),
          nombre: d.producto_nombre,
          imagen: d.producto_imagen
        }))
      };

      setComprobante(nuevoComprobante);
      setCarrito([]);
      localStorage.removeItem('partgo_carrito');
      setMostrarPago(false);
      cargar();
      Swal.fire('Compra finalizada', 'Tu pedido fue registrado. El envío está en camino.', 'success');
      setTimeout(() => generarBoletaTicket(nuevoComprobante), 450);
    } catch (error) {
      Swal.fire('Error', error.message || 'No se pudo registrar la compra.', 'error');
    }
  };

  const generarBoletaTicket = (boleta) => {
    const fechaActual = new Date();
    const fecha = fechaActual.toLocaleDateString('es-PE');
    const hora = fechaActual.toLocaleTimeString('es-PE');

    const limpiar = (valor) => String(valor ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');

    const subtotal = Number(boleta.subtotal || 0);
    const envio = Number(boleta.envio || 0);
    const total = Number(boleta.total || subtotal + envio);
    const opGravada = total / 1.18;
    const igv = total - opGravada;

    const numero = limpiar(boleta.numero || 'B001-00000001');
    const tipo = limpiar(boleta.tipo || 'BOLETA');
    const clienteNombre = limpiar(boleta.cliente || 'Cliente');
    const documento = limpiar(boleta.documento || '-');
    const telefono = limpiar(boleta.telefono || '-');
    const email = limpiar(boleta.email || '-');
    const direccion = limpiar(boleta.direccion || '-');
    const pagoTexto = limpiar(boleta.metodo_pago || '-');

    const productosHTML = (boleta.detalle || []).map((item) => {
      const nombre = limpiar(item.nombre || item.producto_nombre || 'Producto');
      const categoria = limpiar(item.categoria || 'Repuesto');
      const cantidad = Number(item.cantidad || 1);
      const precio = Number(item.precio || item.precio_unitario || 0);
      const sub = Number(item.subtotal || precio * cantidad);

      return `
        <tr>
          <td class="producto"><b>${nombre}</b><span>${categoria}</span></td>
          <td>${cantidad}</td>
          <td>S/ ${precio.toFixed(2)}</td>
          <td>S/ ${sub.toFixed(2)}</td>
        </tr>
      `;
    }).join('');

    const qrTexto = encodeURIComponent(`DORADA MOTOR’S|${tipo}|${numero}|${documento}|${total.toFixed(2)}`);
    const qr = `https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${qrTexto}`;

    const ticket = window.open('', '_blank', 'width=540,height=820');
    if (!ticket) return;

    ticket.document.open();
    ticket.document.write(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <title>${tipo} ${numero} - Dorada Motor’s</title>
        <style>
          *{box-sizing:border-box}
          body{margin:0;padding:24px;background:#e5e7eb;font-family:Arial,Helvetica,sans-serif;color:#111827}
          .boleta{width:430px;margin:0 auto;background:#fff;border-radius:18px;padding:24px;box-shadow:0 18px 55px rgba(15,23,42,.18)}
          .empresa{text-align:center;border-bottom:2px dashed #cbd5e1;padding-bottom:16px;margin-bottom:16px}
          .logo{width:66px;height:66px;margin:0 auto 10px;border-radius:18px;background:#facc15;color:#020617;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:24px}
          .empresa h1{margin:0;font-size:38px;line-height:1;font-weight:900;color:#0f172a}
          .empresa p{margin:5px 0;color:#64748b;font-size:13px}.ruc{color:#111827!important;font-weight:800}
          .badge{display:inline-block;margin-top:10px;padding:8px 18px;border-radius:999px;background:#0f172a;color:white;font-size:13px;font-weight:900;letter-spacing:.4px}.numero{margin-top:10px;font-size:14px;font-weight:900;color:#0f172a}
          .datos{display:grid;gap:7px;font-size:13.5px;line-height:1.35;margin:16px 0}.datos div{display:grid;grid-template-columns:92px 1fr;gap:8px}.datos strong{color:#020617}.datos span{color:#1f2937}
          .estado{background:#dcfce7;color:#166534;text-align:center;border-radius:12px;padding:10px;font-weight:900;margin:14px 0;letter-spacing:.3px}
          table{width:100%;border-collapse:collapse;margin-top:14px;font-size:12.5px}th{text-align:left;color:#0f172a;border-bottom:1px solid #cbd5e1;padding:8px 4px;font-weight:900}td{padding:10px 4px;border-bottom:1px solid #e5e7eb;vertical-align:top}.producto b{display:block;font-size:12.5px;color:#020617}.producto span{display:block;color:#64748b;font-size:11.5px;margin-top:2px}th:nth-child(n+2),td:nth-child(n+2){text-align:right;white-space:nowrap}
          .totales{margin-top:16px;padding-top:14px;border-top:2px dashed #cbd5e1}.fila{display:flex;justify-content:space-between;margin-bottom:8px;font-size:13.5px}.fila strong{color:#0f172a}.final{display:flex;justify-content:space-between;align-items:baseline;margin-top:12px;font-size:28px;font-weight:900;color:#0f172a}
          .qr{text-align:center;margin-top:18px}.qr img{width:112px;height:112px}.qr p{margin:6px 0 0;color:#64748b;font-size:11px}.gracias{text-align:center;margin-top:18px}.gracias h2{margin:0 0 6px;font-size:22px;color:#0f172a}.gracias p{margin:0;color:#64748b;font-size:12px}.legal{margin-top:14px;text-align:center;color:#94a3b8;font-size:10.5px;line-height:1.35}
          .acciones{display:flex;gap:12px;margin-top:20px}.acciones button{flex:1;border:none;border-radius:12px;padding:13px 14px;cursor:pointer;font-size:15px;font-weight:900}.pdf{background:#facc15;color:#020617}.cerrar{background:#0f172a;color:white}
          @media print{body{background:white;padding:0}.boleta{width:80mm;box-shadow:none;border-radius:0;margin:0 auto}.acciones{display:none}}
        </style>
      </head>
      <body>
        <main class="boleta">
          <section class="empresa">
            <div class="logo">PG</div><h1>Dorada Motor’s</h1><p>Repuestos de Moto</p><p class="ruc">RUC: 20601234567</p><span class="badge">${tipo} ELECTRÓNICA</span><div class="numero">${numero}</div>
          </section>
          <section class="datos">
            <div><strong>Cliente:</strong><span>${clienteNombre}</span></div><div><strong>DNI/RUC:</strong><span>${documento}</span></div><div><strong>Teléfono:</strong><span>${telefono}</span></div><div><strong>Correo:</strong><span>${email}</span></div><div><strong>Dirección:</strong><span>${direccion}</span></div><div><strong>Fecha:</strong><span>${fecha}</span></div><div><strong>Hora:</strong><span>${hora}</span></div><div><strong>Pago:</strong><span>${pagoTexto}</span></div>
          </section>
          <div class="estado">COMPROBANTE EMITIDO</div>
          <table><thead><tr><th>Producto</th><th>Cant.</th><th>P.U.</th><th>Importe</th></tr></thead><tbody>${productosHTML}</tbody></table>
          <section class="totales"><div class="fila"><span>Op. gravada</span><strong>S/ ${opGravada.toFixed(2)}</strong></div><div class="fila"><span>IGV 18%</span><strong>S/ ${igv.toFixed(2)}</strong></div><div class="fila"><span>Envío</span><strong>S/ ${envio.toFixed(2)}</strong></div><div class="final"><span>Total</span><span>S/ ${total.toFixed(2)}</span></div></section>
          <section class="qr"><img src="${qr}" alt="QR comprobante" /><p>Consulta referencial del comprobante electrónico</p></section>
          <section class="gracias"><h2>Gracias por su compra</h2><p>Dorada Motor’s - Pedido registrado correctamente.</p></section>
          <p class="legal">Representación impresa de la ${tipo} electrónica.<br/>Este comprobante fue generado por el sistema Dorada Motor’s.</p>
          <section class="acciones"><button class="pdf" onclick="window.print()">Guardar PDF</button><button class="cerrar" onclick="window.close()">Cerrar</button></section>
        </main>
      </body>
      </html>
    `);
    ticket.document.close();
  };

  const guardarPerfil = async () => {
    if (!perfil.nombre || !perfil.email) {
      return Swal.fire('Datos incompletos', 'Nombre y correo son obligatorios.', 'warning');
    }

    try {
      await apiFetch('/auth/perfil', {
        method: 'PUT',
        body: JSON.stringify(perfil)
      });
      const actualizado = { ...(usuario || {}), ...perfil };
      localStorage.setItem('partgo_usuario', JSON.stringify(actualizado));
      Swal.fire('Perfil actualizado', 'Tus datos se guardaron correctamente.', 'success');
    } catch (error) {
      localStorage.setItem('partgo_perfil_local', JSON.stringify(perfil));
      Swal.fire('Perfil guardado localmente', 'Se guardó en el navegador porque el backend no respondió.', 'info');
    }
  };

  const estadoClasePedido = (estado = '') => {
    const e = String(estado).toUpperCase();
    if (e.includes('ENTREGADO')) return 'estado-entregado';
    if (e.includes('ENVIADO')) return 'estado-enviado';
    if (e.includes('CANCELADO')) return 'estado-cancelado';
    if (e.includes('PAGADO')) return 'estado-pagado';
    return 'estado-pendiente';
  };

  const salir = async () => {
    const resp = await Swal.fire({
      title: '¿Deseas salir de tu cuenta?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí',
      cancelButtonText: 'No',
      confirmButtonColor: '#facc15',
      cancelButtonColor: '#111827'
    });

    if (resp.isConfirmed) {
      logout();
      window.location.href = '/login';
    }
  };

  return (
    <div className="shop-page">
      <header className="shop-header">
        <button type="button" className="shop-brand shop-brand-button" onClick={irInicioCliente}>
          <span>PG</span>
          <div><h1>Dorada Motor’s</h1><p>Repuestos de Moto</p></div>
        </button>
        <nav className="shop-nav">
          <a href="#" onClick={(e) => { e.preventDefault(); irInicioCliente(); }}>Inicio</a>
          <a className={vistaCatalogo === 'todos' ? 'activo' : ''} href="#productos" onClick={(e) => { e.preventDefault(); setVistaCatalogo('todos'); irSeccion('productos'); }}>Productos</a>
          <a href="#" onClick={(e) => { e.preventDefault(); setVistaCatalogo('todos'); }}>Categorías</a>
          <a className={vistaCatalogo === 'ofertas' ? 'activo' : ''} href="#productos" onClick={(e) => { e.preventDefault(); setVistaCatalogo('ofertas'); irSeccion('productos'); }}>Ofertas</a>
          <a href="#perfil" onClick={(e) => { e.preventDefault(); irSeccion('perfil'); }}>Favoritos</a>
          <a href="#historial" onClick={(e) => { e.preventDefault(); irSeccion('historial'); }}>Mis pedidos</a>
          <a href="#perfil" onClick={(e) => { e.preventDefault(); irSeccion('perfil'); }}>Mi perfil</a>
          <button className="cart-nav-btn" onClick={() => { navigate('/cliente#carrito'); setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 80); }}>🛒 Carrito ({carrito.length})</button>
        </nav>
      </header>

      {!vistaCarrito && !esCheckout ? (
        <main className="shop-main shop-main-products-only">
          <section className="shop-content">
            <div className="shop-toolbar shop-toolbar-advanced">
              <input placeholder="Buscar producto, marca o categoría..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
              <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                <option value="">Todas las categorías</option>
                {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
              <select value={marcaFiltro} onChange={(e) => setMarcaFiltro(e.target.value)}>
                <option value="">Todas las marcas</option>
                {marcasDisponibles.map((marca) => <option key={marca} value={marca}>{marca}</option>)}
              </select>
              <input type="number" min="0" placeholder="Precio máximo" value={precioMax} onChange={(e) => setPrecioMax(e.target.value)} />
              <label className="stock-filter"><input type="checkbox" checked={soloStock} onChange={(e) => setSoloStock(e.target.checked)} /> Solo con stock</label>
              <button type="button" className="clear-filters-btn" onClick={() => { setBusqueda(''); setCategoria(''); setMarcaFiltro(''); setPrecioMax(''); setSoloStock(false); }}>Limpiar filtros</button>
            </div>

            {vistaCatalogo === 'todos' && (
              <>
                <section id="ofertas" className="shop-section">
                  <h3>Ofertas destacadas</h3>
                  <div className="product-grid compact-grid">
                    {(ofertas.length ? ofertas : productosFiltrados.slice(0, 4)).map((p) => <ProductoCard key={p.id} producto={p} agregar={agregar} verDetalle={() => abrirDetalleProducto(navigate, p)} />)}
                  </div>
                </section>

                <section id="nuevos" className="shop-section">
                  <h3>Productos nuevos</h3>
                  <div className="product-grid compact-grid">
                    {(nuevos.length ? nuevos : productosFiltrados.slice(4, 8)).map((p) => <ProductoCard key={p.id} producto={p} agregar={agregar} verDetalle={() => abrirDetalleProducto(navigate, p)} />)}
                  </div>
                </section>
              </>
            )}

            <section id="perfil" className="shop-section perfil-cliente-card">
              <h3>Mi perfil</h3>
              <p className="muted">Edita tus datos para que el checkout y los pedidos se completen más rápido.</p>
              <div className="perfil-grid">
                <input placeholder="Nombre" value={perfil.nombre} onChange={(e) => setPerfil({ ...perfil, nombre: e.target.value })} />
                <input placeholder="Correo" value={perfil.email} onChange={(e) => setPerfil({ ...perfil, email: e.target.value })} />
                <input placeholder="Teléfono" value={perfil.telefono} onChange={(e) => setPerfil({ ...perfil, telefono: e.target.value })} />
                <input placeholder="Dirección" value={perfil.direccion} onChange={(e) => setPerfil({ ...perfil, direccion: e.target.value })} />
              </div>
              <button type="button" className="save-profile-btn" onClick={guardarPerfil}>Guardar perfil</button>
            </section>

            <section id="historial" className="shop-section historial-pedidos-card">
              <h3>Historial de pedidos</h3>
              <p className="muted">Seguimiento básico de tus compras y estados del pedido.</p>
              {compras.length ? compras.map((pedido) => (
                <div className="pedido-timeline-card" key={pedido.id}>
                  <div>
                    <strong>{pedido.numero_comprobante || `Pedido #${pedido.id}`}</strong>
                    <small>{pedido.fecha ? new Date(pedido.fecha).toLocaleString() : 'Fecha pendiente'}</small>
                  </div>
                  <span className={`estado-pedido ${estadoClasePedido(pedido.estado)}`}>{pedido.estado || 'PENDIENTE'}</span>
                  <b>S/ {Number(pedido.total || 0).toFixed(2)}</b>
                </div>
              )) : <p className="store-empty">Aún no tienes pedidos registrados.</p>}
            </section>

            <section id="productos" className="shop-section">
              <h3>{vistaCatalogo === 'ofertas' ? 'Productos en oferta' : vistaCatalogo === 'nuevos' ? 'Productos nuevos' : vistaCatalogo === 'destacados' ? 'Productos destacados' : vistaCatalogo === 'agotados' ? 'Productos agotados' : 'Todas las fotos y variedades de productos'}</h3>
              <div className="product-grid">
                {(vistaCatalogo === 'ofertas' ? ofertasTodas : vistaCatalogo === 'nuevos' ? nuevosTodos : vistaCatalogo === 'destacados' ? destacadosTodos : vistaCatalogo === 'agotados' ? agotadosTodos : productosFiltrados).map((p) => <ProductoCard key={p.id} producto={p} agregar={agregar} verDetalle={() => abrirDetalleProducto(navigate, p)} />)}
              </div>
            </section>
          </section>
        </main>
      ) : vistaCarrito ? (
        <main className="cart-page-reference">
          <section className="cart-table-card">
            <button className="back-products-btn" onClick={irInicioCliente}>← Seguir comprando</button>

            {carrito.length ? (
              <>
                <div className="cart-table-head">
                  <span>Producto</span>
                  <span>Precio</span>
                  <span>Cantidad</span>
                  <span>Subtotal</span>
                  <span>Acción</span>
                </div>

                {carrito.map((item) => {
                  const precio = Number(item.precio_final || item.precio || 0);
                  return (
                    <div className="cart-table-row" key={item.id}>
                      <div className="cart-product-info">
                        <img src={imagenProducto(item)} alt={item.nombre} />
                        <strong>{item.nombre}</strong>
                      </div>
                      <strong className="price-blue">S/ {precio.toFixed(2)}</strong>
                      <div className="cart-counter-reference">
                        <button onClick={() => cambiarCantidad(item.id, 'restar')}>-</button>
                        <span>{item.cantidad}</span>
                        <button onClick={() => cambiarCantidad(item.id, 'sumar')}>+</button>
                      </div>
                      <strong className="price-blue">S/ {(precio * item.cantidad).toFixed(2)}</strong>
                      <button className="cart-remove-x cart-remove-trash" title="Eliminar producto" onClick={() => quitar(item.id)}><Trash2 size={18} /></button>
                    </div>
                  );
                })}

                <div className="cart-actions-reference">
                  <button onClick={limpiarCarrito}>LIMPIAR CARRITO</button>
                </div>
              </>
            ) : (
              <div className="empty-cart-reference">
                <h2>Tu carrito está vacío</h2>
                <p>Agrega productos para continuar con la compra.</p>
              </div>
            )}
          </section>

          <aside className="cart-totals-reference">
            <h2>Totales del carrito</h2>
            <div><span>Subtotal</span><strong>S/ {subtotal.toFixed(2)}</strong></div>
            <div><span>Envío</span><strong>S/ {envio.toFixed(2)}</strong></div>
            <div><span>Total</span><strong>S/ {total.toFixed(2)}</strong></div>
            <button onClick={() => {
              if (!carrito.length) return Swal.fire('Carrito vacío', 'Agrega productos antes de finalizar.', 'warning');
              navigate('/cliente#checkout');
              setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
            }}>FINALIZAR COMPRA</button>
          </aside>
        </main>
      ) : (
        <main className="checkout-page-final">
          <section className="billing-panel-final">
            <button className="back-products-btn" onClick={() => navigate('/cliente#carrito')}>← Volver al carrito</button>
            <h2>Detalles de facturación</h2>
            <div className="billing-grid-final">
              <label>Nombre *</label>
              <label>Apellidos *</label>
              <input placeholder="Nombre" value={cliente.nombre} onChange={(e) => setCliente({ ...cliente, nombre: e.target.value })} />
              <input placeholder="Apellidos" />
            </div>
            <label>Teléfono *</label>
            <input className="full-input-final" placeholder="Teléfono" value={cliente.telefono} onChange={(e) => setCliente({ ...cliente, telefono: e.target.value })} />
            <label>Dirección de correo electrónico *</label>
            <input className="full-input-final" placeholder="Correo electrónico" value={cliente.email} onChange={(e) => setCliente({ ...cliente, email: e.target.value })} />
            <label>País / Región *</label>
            <div className="country-final">Perú</div>
            <label>Departamento *</label>
            <select className="full-input-final" value={departamento} onChange={(e) => { setDepartamento(e.target.value); setProvincia(''); setDistrito(''); }}>
              <option value="">Seleccionar Departamento</option>
              {DEPARTAMENTOS_PERU.map((dep) => <option key={dep} value={dep}>{nombreUbigeo(dep)}</option>)}
            </select>
            <label>Provincia *</label>
            <select className="full-input-final" value={provincia} onChange={(e) => { setProvincia(e.target.value); setDistrito(''); }} disabled={!departamento}>
              <option value="">Seleccionar Provincia</option>
              {departamento && Object.keys(UBIGEO_PERU[departamento] || {}).map((prov) => <option key={prov} value={prov}>{nombreUbigeo(prov)}</option>)}
            </select>
            <label>Distrito *</label>
            <select className="full-input-final" value={distrito} onChange={(e) => setDistrito(e.target.value)} disabled={!provincia}>
              <option value="">Seleccionar Distrito</option>
              {departamento && provincia && (UBIGEO_PERU[departamento]?.[provincia] || []).map((dis) => <option key={dis} value={dis}>{dis}</option>)}
            </select>
            <label>Dirección de la calle *</label>
            <input className="full-input-final" placeholder="Nombre de la calle y número de la casa" value={cliente.direccion} onChange={(e) => setCliente({ ...cliente, direccion: e.target.value })} />
            <input className="full-input-final" placeholder="Apartamento, habitación, etc. (opcional)" />
            <label>DNI o RUC *</label>
            <input className="full-input-final" placeholder="DNI o RUC" value={cliente.documento} onChange={(e) => setCliente({ ...cliente, documento: e.target.value })} />
          </section>

          <aside id="carrito" className="order-panel-final">
            <h3>Tu pedido</h3>
            {!carrito.length && <p className="muted">Todavía no agregaste productos.</p>}
            <div className="order-head-final"><span>Producto</span><span>Subtotal</span></div>
            {carrito.map((item) => (
              <div className="order-product-final" key={item.id}>
                <span>{item.nombre} × {item.cantidad}</span>
                <strong>S/ {(Number(item.precio_final || item.precio) * item.cantidad).toFixed(2)}</strong>
              </div>
            ))}
            <div className="order-line-final"><span>Subtotal</span><strong>S/ {subtotal.toFixed(2)}</strong></div>
            <div className="order-line-final"><span>Envío</span><strong>S/ {envio.toFixed(2)}</strong></div>
            <div className="order-line-final total"><span>Total</span><strong>S/ {total.toFixed(2)}</strong></div>

            <div className="payment-box-final">
              <label><input type="radio" checked={pago.metodo_pago === 'TRANSFERENCIA'} onChange={() => setPago({ ...pago, metodo_pago: 'TRANSFERENCIA' })} /> Depósito y/o Transferencia Bancaria</label>
              <div className="payment-note-final">Realice su pago directamente en nuestra cuenta bancaria. Su pedido no se enviará hasta que los fondos se hayan liquidado.</div>
              <label><input type="radio" checked={pago.metodo_pago === 'TARJETA'} onChange={() => setPago({ ...pago, metodo_pago: 'TARJETA' })} /> Pago con tarjeta de crédito VISA / Mastercard</label>
              <label><input type="checkbox" /> Me gustaría recibir correos electrónicos exclusivos con descuentos e información de productos</label>
              <select value={pago.tipo_comprobante} onChange={(e) => setPago({ ...pago, tipo_comprobante: e.target.value })}>
                <option value="BOLETA">Boleta</option>
                <option value="FACTURA">Factura</option>
              </select>
            </div>

            <button className="realizar-pedido-btn" onClick={comprar}>REALIZAR EL PEDIDO</button>
            {comprobante && <Boleta comprobante={comprobante} imprimir={() => generarBoletaTicket(comprobante)} />}
          </aside>
        </main>
      )}
    </div>
  );
}

function ProductoCard({ producto, agregar, verDetalle }) {
  const oferta = Number(producto.en_oferta) === 1 && Number(producto.precio_oferta) > 0;
  const precio = oferta ? Number(producto.precio_oferta) : Number(producto.precio);

  return (
    <article className="product-card" onClick={verDetalle}>
      <div className="product-image">
        {producto.imagen ? <img src={producto.imagen} alt={producto.nombre} /> : <span>Sin imagen</span>}
        {oferta && <b className="badge-offer">Oferta</b>}
        {Number(producto.es_nuevo) === 1 && <b className="badge-new">Nuevo</b>}
        {Number(producto.destacado) === 1 && <b className="badge-featured">Destacado</b>}
        {Number(producto.stock) <= 0 && <b className="badge-soldout">Agotado</b>}
      </div>
      <h4>{producto.nombre}</h4>
      <p>{producto.descripcion}</p>
      <div className="product-meta"><span>{producto.categoria}</span></div>
      <div className="product-price">
        <strong>S/ {precio.toFixed(2)}</strong>
        {oferta && <small>S/ {Number(producto.precio).toFixed(2)}</small>}
      </div>
      <button disabled={Number(producto.stock) <= 0} onClick={(e) => { e.stopPropagation(); agregar(producto); }}>
        {Number(producto.stock) <= 0 ? 'Sin stock' : 'Agregar al carrito'}
      </button>
    </article>
  );
}

function Boleta({ comprobante, imprimir }) {
  return (
    <div className="receipt-box receipt-box-ticket">
      <h3>{comprobante.tipo}</h3>
      <p><b>N°:</b> {comprobante.numero}</p>
      <p><b>Cliente:</b> {comprobante.cliente}</p>
      <p><b>Documento:</b> {comprobante.documento}</p>
      <p><b>Pago:</b> {comprobante.metodo_pago}</p>
      <hr />
      {comprobante.detalle.map((d, idx) => (
        <div className="receipt-item" key={idx}>
          <span>{d.nombre || d.producto_nombre} x {d.cantidad}</span><strong>S/ {Number(d.subtotal).toFixed(2)}</strong>
        </div>
      ))}
      <hr />
      <div className="receipt-total"><span>Total pagado</span><strong>S/ {Number(comprobante.total).toFixed(2)}</strong></div>
      <button className="pay-button" onClick={imprimir}>Guardar boleta PDF</button>
    </div>
  );
}
