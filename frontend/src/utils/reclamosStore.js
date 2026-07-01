import { crearNotificacion } from './notificacionesStore';

const KEY = 'partgo_reclamos';

const safeJSON = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
  catch { return fallback; }
};

export function obtenerReclamos() {
  return safeJSON(KEY, []);
}

export function guardarReclamos(lista) {
  localStorage.setItem(KEY, JSON.stringify(lista));
  window.dispatchEvent(new Event('partgo_reclamos_changed'));
  return lista;
}

export function crearReclamo({ tipo, pedido, breve, detallada, cliente, email, telefono }) {
  const reclamo = {
    id: Date.now(),
    tipo,
    pedido: pedido || '-',
    asunto: breve || (tipo ? `Reclamo: ${tipo}` : 'Reclamo de cliente'),
    descripcion: detallada,
    cliente: cliente || 'Cliente Dorada Motor’s',
    email: email || '',
    telefono: telefono || '',
    estado: 'PENDIENTE',
    fecha: new Date().toISOString(),
  };
  guardarReclamos([reclamo, ...obtenerReclamos()]);
  crearNotificacion({
    titulo: 'Reclamo recibido',
    mensaje: `${reclamo.cliente} envió un reclamo: ${reclamo.asunto}`,
    tipo: 'reclamo',
  });
  return reclamo;
}

export function actualizarEstadoReclamo(id, estado) {
  const lista = obtenerReclamos().map((r) => (Number(r.id) === Number(id) ? { ...r, estado } : r));
  return guardarReclamos(lista);
}

export function eliminarReclamo(id) {
  return guardarReclamos(obtenerReclamos().filter((r) => Number(r.id) !== Number(id)));
}
