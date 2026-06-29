import { productosArchivo } from '../data/productosArchivo';
import { crearNotificacion } from './notificacionesStore';

const KEY = 'partgo_catalogo_overrides';
const KEY_NUEVOS = 'partgo_catalogo_nuevos';

const safeJSON = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
  catch { return fallback; }
};

/* overrides: { [id]: { en_oferta, precio_oferta, es_nuevo, stock, nombre, categoria, precio, imagen } } */
function leerOverrides() {
  return safeJSON(KEY, {});
}

function guardarOverrides(overrides) {
  localStorage.setItem(KEY, JSON.stringify(overrides));
  window.dispatchEvent(new Event('partgo_catalogo_changed'));
}

/* productos creados desde el admin (no estaban en productosArchivo.js) */
function leerNuevos() {
  return safeJSON(KEY_NUEVOS, []);
}

function guardarNuevos(lista) {
  localStorage.setItem(KEY_NUEVOS, JSON.stringify(lista));
  window.dispatchEvent(new Event('partgo_catalogo_changed'));
}

/* Devuelve el catálogo completo (base + nuevos) ya combinado con los overrides del admin */
export function obtenerCatalogo() {
  const overrides = leerOverrides();
  const nuevos = leerNuevos();
  const base = [...productosArchivo, ...nuevos];

  return base.map((p) => {
    const o = overrides[p.id];
    return o ? { ...p, ...o } : p;
  });
}

/* Crea o actualiza un producto. Si el id existe en el catálogo base, se guarda como override.
   Si no existe (producto nuevo creado desde el admin), se guarda en la lista de nuevos. */
export function guardarProductoAdmin(producto) {
  const esBase = productosArchivo.some((p) => Number(p.id) === Number(producto.id));

  if (esBase) {
    const overrides = leerOverrides();
    overrides[producto.id] = { ...overrides[producto.id], ...producto };
    guardarOverrides(overrides);
    return producto;
  }

  const nuevos = leerNuevos();
  const existe = nuevos.some((p) => Number(p.id) === Number(producto.id));
  const actualizados = existe
    ? nuevos.map((p) => (Number(p.id) === Number(producto.id) ? { ...p, ...producto } : p))
    : [...nuevos, producto];
  guardarNuevos(actualizados);
  return producto;
}

export function eliminarProductoAdmin(id) {
  const nuevos = leerNuevos().filter((p) => Number(p.id) !== Number(id));
  guardarNuevos(nuevos);

  const overrides = leerOverrides();
  if (overrides[id]) {
    overrides[id] = { ...overrides[id], eliminado: true };
    guardarOverrides(overrides);
  }
}

export function siguienteIdProducto() {
  const todos = obtenerCatalogo();
  return todos.length ? Math.max(...todos.map((p) => Number(p.id) || 0)) + 1 : 1;
}

const KEY_HISTORIAL = 'partgo_historial_stock';

export function obtenerHistorialStockLocal() {
  return safeJSON(KEY_HISTORIAL, []);
}

function registrarMovimientoStock(mov) {
  const historial = obtenerHistorialStockLocal();
  localStorage.setItem(KEY_HISTORIAL, JSON.stringify([{ id: Date.now() + Math.random(), ...mov }, ...historial].slice(0, 300)));
}

/* Descuenta stock de cada producto vendido y registra el movimiento.
   items: [{ id, nombre, cantidad }]. referencia: ej. número de pedido. cliente: nombre del comprador. */
export function descontarStockPorVenta(items = [], referencia = '', cliente = '') {
  const overrides = leerOverrides();
  const catalogo = obtenerCatalogo();

  items.forEach((item) => {
    const producto = catalogo.find((p) => Number(p.id) === Number(item.id));
    if (!producto) return;
    const stockAnterior = Number(producto.stock || 0);
    const cantidad = Math.max(1, Number(item.cantidad || 1));
    const stockNuevo = Math.max(0, stockAnterior - cantidad);

    overrides[item.id] = { ...overrides[item.id], stock: stockNuevo };

    registrarMovimientoStock({
      producto_id: item.id,
      producto_nombre: producto.nombre || item.nombre,
      stock_anterior: stockAnterior,
      stock_nuevo: stockNuevo,
      movimiento: 'VENTA',
      referencia: referencia ? `Compra ${cliente ? 'cliente ' + cliente : ''} · ${referencia}`.trim() : (cliente ? `Compra cliente ${cliente}` : 'Compra cliente'),
      fecha: new Date().toISOString(),
    });

    if (stockNuevo <= 10 && stockAnterior > 10) {
      crearNotificacion({
        titulo: stockNuevo === 0 ? `Producto agotado: ${producto.nombre}` : `Stock bajo: ${producto.nombre}`,
        mensaje: stockNuevo === 0
          ? `El producto "${producto.nombre}" se quedó sin stock.`
          : `El producto "${producto.nombre}" tiene solo ${stockNuevo} unidades disponibles.`,
        tipo: 'stock',
      });
    }
  });

  localStorage.setItem(KEY, JSON.stringify(overrides));
  window.dispatchEvent(new Event('partgo_catalogo_changed'));
  window.dispatchEvent(new Event('partgo_historial_stock_changed'));
}

export function actualizarCategoriaEnCatalogo(nombreAnterior, nombreNuevo) {
  const anterior = String(nombreAnterior || '').trim();
  const nuevo = String(nombreNuevo || '').trim();
  if (!anterior || !nuevo || anterior.toLowerCase() === nuevo.toLowerCase()) return;

  const overrides = leerOverrides();
  productosArchivo.forEach((p) => {
    if (String(p.categoria || '').trim().toLowerCase() === anterior.toLowerCase()) {
      overrides[p.id] = { ...overrides[p.id], categoria: nuevo };
    }
  });
  guardarOverrides(overrides);

  const nuevos = leerNuevos().map((p) =>
    String(p.categoria || '').trim().toLowerCase() === anterior.toLowerCase()
      ? { ...p, categoria: nuevo }
      : p
  );
  guardarNuevos(nuevos);
  window.dispatchEvent(new Event('partgo_categorias_changed'));
}
