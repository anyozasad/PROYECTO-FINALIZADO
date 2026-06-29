import { descontarStockPorVenta } from './catalogoStore';
import { crearNotificacion } from './notificacionesStore';
import { apiFetch } from '../services/api';

export const IGV_RATE = 0.18;

export const PRODUCTOS_DEMO = [
  { id: 101, nombre: 'Kit de arrastre DID 428H', categoria: 'Transmisión', precio: 150.00, img: '/IMAGENES/CADENA 428-114L.jpg', stock: 12 },
  { id: 102, nombre: 'Pastillas de freno Brembo', categoria: 'Frenos', precio: 59.90, img: '/IMAGENES/ZAPATA FRENO ROJA.jpg', stock: 24 },
  { id: 103, nombre: 'Amortiguador trasero YSS', categoria: 'Suspensión', precio: 299.90, img: '/IMAGENES/BARRA TELESCOPICA CARGUERO.jpg', stock: 6 },
  { id: 104, nombre: 'Filtro de aceite Bosch', categoria: 'Filtros', precio: 25.90, img: '/IMAGENES/ACEITE LUBRICANTE 4T25W-50 1LT.jpg', stock: 40 },
  { id: 105, nombre: 'Alternador 4P CGL', categoria: 'Motor', precio: 120.00, img: '/IMAGENES/BOBINA 12V.jpg', stock: 9 },
  { id: 106, nombre: 'Aceite 10W-40 Motul', categoria: 'Aceites', precio: 49.90, img: '/IMAGENES/ACEITE LUBRICANTE 4T25W-50 1LT.jpg', stock: 25 },
  { id: 107, nombre: 'Bujía NGK Iridium', categoria: 'Eléctricos', precio: 34.90, img: '/IMAGENES/CAPUCHON DE BUJIA.jpg', stock: 18 },
  { id: 108, nombre: 'Faro LED H4 Philips', categoria: 'Iluminación', precio: 69.90, img: '/IMAGENES/FARO DELANTERO REDONDO.jpg', stock: 16 },
];

const safeJSON = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
  catch { return fallback; }
};

const money = (n) => Number(n || 0).toFixed(2);

export function leerEmpresaBoleta() {
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem('partgo_empresa_config') || '{}'); } catch { saved = {}; }
  return {
    razonSocial: saved.razonSocial || saved.nombreLegal || 'PARTGO REPUESTOS E.I.R.L.',
    nombreComercial: saved.nombre || 'PartGo Repuestos de Moto',
    ruc: String(saved.ruc || '20609999994').replace(/\D/g, '').padStart(11, '0').slice(0, 11),
    direccion: saved.direccion || 'Av. Los Próceres 123, San Miguel, Lima - Perú',
    telefono: saved.telefono || '922 859 170',
    email: saved.email || 'ventas@partgo.pe',
    ubigeo: saved.ubigeo || '150101',
    web: saved.web || 'www.partgo.pe',
  };
}

export function tipoDocumentoSunat(tipoDoc = '') {
  const t = String(tipoDoc || '').toUpperCase();
  if (t.includes('RUC')) return '6';
  if (t.includes('CE')) return '4';
  if (t.includes('PAS')) return '7';
  return '1';
}

export function calcularResumenSunat(items = [], resumenBase = {}) {
  const subtotalProductos = items.reduce((s, p) => s + Number(p.precio || 0) * Number(p.cantidad || 1), 0);
  const envio = Number(resumenBase.envio || 0);
  const descuento = Number(resumenBase.descuento || 0);
  const total = Math.max(0, subtotalProductos + envio - descuento);
  const opGravada = total / (1 + IGV_RATE);
  const igv = total - opGravada;
  return {
    ...resumenBase,
    subtotal: subtotalProductos,
    descuento,
    envio,
    total,
    opGravada,
    igv,
    opExonerada: 0,
    opInafecta: 0,
    opGratuita: 0,
    importeTotal: total,
  };
}

export function generarNumeroCPE() {
  return String(obtenerPedidos().length + 1).padStart(8, '0');
}


export function generarHashCPE(texto = '') {
  let h = 0;
  const raw = String(texto || '');
  for (let i = 0; i < raw.length; i++) {
    h = ((h << 5) - h) + raw.charCodeAt(i);
    h |= 0;
  }
  const limpio = Math.abs(h).toString(16).toUpperCase().padStart(8, '0');
  return `PG${limpio}${raw.length.toString(16).toUpperCase().padStart(4, '0')}`;
}

export function generarCadenaQR(pedido) {
  if (!pedido) return '';
  const ruc = pedido.empresa?.ruc || '';
  const tipo = '03';
  const serie = pedido.serie || 'B001';
  const numero = pedido.numero || '00000001';
  const igv = money(pedido.resumen?.igv || 0);
  const total = money(pedido.resumen?.total || 0);
  const fecha = String(pedido.fecha || '').slice(0, 10);
  const tipoDoc = tipoDocumentoSunat(pedido.cliente?.tipoDoc);
  const doc = pedido.cliente?.documento || '-';
  const hash = pedido.hash || generarHashCPE(`${ruc}|${tipo}|${serie}|${numero}|${igv}|${total}|${fecha}|${doc}`);
  return `${ruc}|${tipo}|${serie}|${numero}|${igv}|${total}|${fecha}|${tipoDoc}|${doc}|${hash}`;
}

export function normalizarProducto(producto = {}) {
  const precioRegular = Number(producto.precio_regular ?? producto.precio_base ?? producto.p ?? producto.precio ?? producto.total ?? 0);
  const precioOferta = Number(producto.precio_oferta ?? producto.precioOferta ?? 0);
  const enOferta = !!Number(producto.en_oferta ?? producto.enOferta ?? 0) && precioOferta > 0 && precioOferta < precioRegular;
  const precio = Number(producto.precio_final ?? (enOferta ? precioOferta : precioRegular));
  return {
    ...producto,
    id: Number(producto.id ?? producto.producto_id ?? producto.id_producto ?? Date.now()),
    nombre: producto.nombre ?? producto.n ?? producto.producto_nombre ?? 'Producto PartGo',
    marca: producto.marca ?? producto.brand ?? 'PartGo',
    categoria: producto.categoria ?? producto.categoria_nombre ?? 'Repuestos',
    precio,
    precio_regular: precioRegular,
    precio_oferta: precioOferta,
    en_oferta: enOferta,
    es_nuevo: !!Number(producto.es_nuevo ?? producto.esNuevo ?? 0),
    img: producto.img ?? producto.imagen ?? '/IMAGENES/ACEITE LUBRICANTE 4T25W-50 1LT.jpg',
    imagen: producto.imagen ?? producto.img ?? '/IMAGENES/ACEITE LUBRICANTE 4T25W-50 1LT.jpg',
    stock: Number(producto.stock ?? 1),
  };
}

export function obtenerCarrito() {
  return safeJSON('partgo_carrito', []).map((p) => ({ ...normalizarProducto(p), cantidad: Math.max(1, Number(p.cantidad || 1)) }));
}

export function guardarCarrito(items) {
  localStorage.setItem('partgo_carrito', JSON.stringify(items));
  window.dispatchEvent(new Event('partgo_cart_changed'));
  window.dispatchEvent(new CustomEvent('partgo-carrito-actualizado', { detail: items }));
  return items;
}

export function agregarAlCarrito(producto, cantidad = 1) {
  const p = normalizarProducto(producto);
  const qty = Math.max(1, Number(cantidad || 1));
  const items = obtenerCarrito();
  const existe = items.find((x) => Number(x.id) === Number(p.id));
  if (existe) existe.cantidad = Math.min(Number(existe.cantidad || 1) + qty, Number(existe.stock || 999));
  else items.push({ ...p, cantidad: qty });
  return guardarCarrito(items);
}

export function eliminarDelCarrito(id) {
  return guardarCarrito(obtenerCarrito().filter((p) => Number(p.id) !== Number(id)));
}

export function cambiarCantidadCarrito(id, delta) {
  return guardarCarrito(obtenerCarrito().map((p) => Number(p.id) === Number(id) ? { ...p, cantidad: Math.max(1, Number(p.cantidad || 1) + Number(delta || 0)) } : p));
}

export function vaciarCarrito() { return guardarCarrito([]); }

export function resumenCarrito(items = obtenerCarrito()) {
  const subtotal = items.reduce((s, p) => s + Number(p.precio || 0) * Number(p.cantidad || 1), 0);
  const cupon = localStorage.getItem('partgo_cupon') || '';
  const descuento = cupon === 'PARTGO10' ? subtotal * 0.10 : 0;
  const envio = subtotal - descuento >= 250 || subtotal === 0 ? 0 : 10;
  const total = Math.max(0, subtotal - descuento + envio);
  return { subtotal, descuento, envio, total, cupon };
}

export function guardarCupon(codigo = 'PARTGO10') {
  localStorage.setItem('partgo_cupon', codigo);
  window.dispatchEvent(new Event('partgo_coupon_changed'));
  return codigo;
}

export function obtenerPedidos() {
  return safeJSON('partgo_pedidos', []);
}

export function guardarPedidos(pedidos) {
  localStorage.setItem('partgo_pedidos', JSON.stringify(pedidos));
  window.dispatchEvent(new Event('partgo_orders_changed'));
  return pedidos;
}

export function crearPedido({ cliente, entrega, pago }) {
  const items = obtenerCarrito();
  const resumen = resumenCarrito(items);
  const id = `PGO-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
  const correlativo = generarNumeroCPE();
  const resumenSunat = calcularResumenSunat(items, resumen);
  const total = Number(resumenSunat.total || 0);
  const igv = Number(resumenSunat.igv || 0);

  const empresa = leerEmpresaBoleta();

  const pedido = {
    id,
    serie: 'B001',
    numero: correlativo,
    tipoComprobante: '03',
    tipoComprobanteNombre: 'BOLETA DE VENTA ELECTRÓNICA',
    tipoOperacion: '0101',
    moneda: 'PEN',
    formaPago: 'Contado',
    fecha: new Date().toISOString(),
    estado: 'Pendiente',
    cliente,
    entrega,
    pago,
    items,
    resumen: resumenSunat,
    empresa,
  };

  pedido.hash = generarHashCPE(`${empresa.ruc}|03|${pedido.serie}|${pedido.numero}|${money(igv)}|${money(total)}|${pedido.fecha.slice(0,10)}|${tipoDocumentoSunat(cliente?.tipoDoc)}|${cliente?.documento || '-'}`);
  pedido.qr = generarCadenaQR(pedido);

  guardarPedidos([pedido, ...obtenerPedidos()]);
  descontarStockPorVenta(items, pedido.id, cliente?.nombre || '');
  crearNotificacion({
    titulo: 'Nuevo pedido recibido',
    mensaje: `${cliente?.nombre || 'Un cliente'} realizó el pedido ${pedido.serie}-${pedido.numero} por S/ ${money(total)}`,
    tipo: 'pedido',
  });
  window.dispatchEvent(new CustomEvent('partgo_pedido_creado', { detail: pedido }));

  // Intento de notificar al backend si está disponible; si falla, el pedido ya quedó
  // guardado localmente y visible para el admin a través de los stores compartidos.
  apiFetch('/pedidos', { method: 'POST', body: JSON.stringify(pedido) }).catch(() => {});

  vaciarCarrito();
  return pedido;
}

export function buscarPedido(id) {
  return obtenerPedidos().find((p) => p.id === id || `${p.serie}-${p.numero}` === id);
}

export function textoBoleta(pedido) {
  if (!pedido) return '';
  return `Boleta de Venta Electrónica ${pedido.serie}-${pedido.numero}\nCliente: ${pedido.cliente?.nombre || 'Cliente'}\nTotal: S/ ${money(pedido.resumen?.total)}`;
}
