const KEY = 'partgo_notificaciones';

const safeJSON = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
  catch { return fallback; }
};

export function obtenerNotificaciones() {
  return safeJSON(KEY, []);
}

export function guardarNotificaciones(lista) {
  localStorage.setItem(KEY, JSON.stringify(lista));
  window.dispatchEvent(new Event('partgo_notificaciones_changed'));
  return lista;
}

export function crearNotificacion({ titulo, mensaje, tipo = 'default' }) {
  const notif = {
    id: Date.now() + Math.random(),
    titulo,
    mensaje,
    tipo,
    leido: false,
    creado_en: new Date().toISOString(),
  };
  guardarNotificaciones([notif, ...obtenerNotificaciones()].slice(0, 200));
  return notif;
}

export function marcarNotificacionLeida(id) {
  return guardarNotificaciones(obtenerNotificaciones().map((n) => (n.id === id ? { ...n, leido: true } : n)));
}

export function marcarTodasLeidas() {
  return guardarNotificaciones(obtenerNotificaciones().map((n) => ({ ...n, leido: true })));
}

export function contarNoLeidas() {
  return obtenerNotificaciones().filter((n) => !n.leido).length;
}
