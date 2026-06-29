import { obtenerCatalogo, actualizarCategoriaEnCatalogo } from './catalogoStore';

const KEY_CATS = 'partgo_admin_categorias';

const CATS_DEFAULT = [
  { id:1, nombre:'Lubricantes', descripcion:'Aceites y lubricantes para motos', productos:0, icon:'🛢️', color:'#f59e0b' },
  { id:2, nombre:'Frenos', descripcion:'Pastillas, discos y accesorios de freno', productos:0, icon:'🛑', color:'#ef4444' },
  { id:3, nombre:'Llantas', descripcion:'Llantas para diferentes modelos de moto', productos:0, icon:'🛞', color:'#3b82f6' },
  { id:4, nombre:'Baterías', descripcion:'Baterías para motocicletas', productos:0, icon:'🔋', color:'#10b981' },
  { id:5, nombre:'Accesorios', descripcion:'Cascos, guantes y accesorios', productos:0, icon:'⛑️', color:'#8b5cf6' },
  { id:6, nombre:'Transmisión', descripcion:'Cadenas, piñones y coronas', productos:0, icon:'⛓️', color:'#6b7280' },
  { id:7, nombre:'Aceites', descripcion:'Categoría Aceites', productos:0, icon:'🧴', color:'#f97316' },
  { id:8, nombre:'Cadenas', descripcion:'Categoría Cadenas', productos:0, icon:'🔗', color:'#14b8a6' },
  { id:9, nombre:'Luces', descripcion:'Categoría Luces', productos:0, icon:'💡', color:'#eab308' },
  { id:10, nombre:'Motor', descripcion:'Categoría Motor', productos:0, icon:'🔧', color:'#7c3aed' },
  { id:11, nombre:'Suspensión', descripcion:'Categoría Suspensión', productos:0, icon:'⚙️', color:'#64748b' },
];

const ICONS = ['🛢️','🛑','🛞','🔋','⛑️','⛓️','🧴','🔗','💡','🔧','⚙️','⚡','🔩','🏍️','🎯','🔌'];
const COLORS = ['#7c3aed','#ef4444','#3b82f6','#10b981','#f59e0b','#8b5cf6','#f97316','#14b8a6','#eab308','#64748b','#a855f7','#ec4899'];

function safeJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
  catch { return fallback; }
}

function normalizar(c, i = 0) {
  const nombre = String(c?.nombre || c?.categoria || '').trim();
  return {
    id: c?.id || Date.now() + i,
    nombre,
    descripcion: c?.descripcion || (nombre ? `Categoría ${nombre}` : ''),
    icon: c?.icon || c?.icono || ICONS[i % ICONS.length],
    color: c?.color || COLORS[i % COLORS.length],
    productos: Number(c?.productos || 0),
  };
}

export function calcularConteosCategorias(listaCategorias = []) {
  const catalogo = obtenerCatalogo().filter(p => !p.eliminado);
  const conteos = {};
  catalogo.forEach(p => {
    const key = String(p.categoria || '').trim().toLowerCase();
    if (key) conteos[key] = (conteos[key] || 0) + 1;
  });

  const vistos = new Set();
  const base = [...listaCategorias, ...CATS_DEFAULT]
    .map(normalizar)
    .filter(c => {
      const key = String(c.nombre || '').trim().toLowerCase();
      if (!key || vistos.has(key)) return false;
      vistos.add(key);
      return true;
    })
    .map((c, i) => ({ ...c, icon: c.icon || ICONS[i % ICONS.length], color: c.color || COLORS[i % COLORS.length], productos: conteos[String(c.nombre || '').trim().toLowerCase()] || 0 }));

  let siguienteId = Math.max(0, ...base.map(c => Number(c.id) || 0)) + 1;
  Object.keys(conteos).forEach(key => {
    if (!vistos.has(key)) {
      const nombreOriginal = catalogo.find(p => String(p.categoria || '').trim().toLowerCase() === key)?.categoria || key;
      base.push({
        id: siguienteId++,
        nombre: nombreOriginal,
        descripcion: `Categoría ${nombreOriginal}`,
        productos: conteos[key],
        icon: ICONS[base.length % ICONS.length],
        color: COLORS[base.length % COLORS.length],
      });
      vistos.add(key);
    }
  });

  return base;
}

export function obtenerCategoriasAdmin() {
  const guardadas = safeJSON(KEY_CATS, []);
  return calcularConteosCategorias(Array.isArray(guardadas) && guardadas.length ? guardadas : CATS_DEFAULT);
}

export function guardarCategoriasAdmin(lista) {
  const limpia = calcularConteosCategorias(lista || []);
  localStorage.setItem(KEY_CATS, JSON.stringify(limpia));
  window.dispatchEvent(new Event('partgo_categorias_changed'));
  return limpia;
}

export function guardarCategoriaAdmin(categoria, anteriorNombre = '') {
  const actual = obtenerCategoriasAdmin();
  const id = categoria?.id || Date.now();
  const item = normalizar({ ...categoria, id }, actual.length);
  const existe = actual.some(c => Number(c.id) === Number(id));
  let next = existe
    ? actual.map(c => Number(c.id) === Number(id) ? { ...c, ...item } : c)
    : [...actual, item];
  if (anteriorNombre && anteriorNombre !== item.nombre) {
    actualizarCategoriaEnCatalogo(anteriorNombre, item.nombre);
  }
  return guardarCategoriasAdmin(next);
}

export function eliminarCategoriaAdmin(id) {
  const next = obtenerCategoriasAdmin().filter(c => Number(c.id) !== Number(id));
  return guardarCategoriasAdmin(next);
}

export function resolverCategoriaPorNombre(nombre) {
  const key = String(nombre || '').trim().toLowerCase();
  return obtenerCategoriasAdmin().find(c => String(c.nombre || '').trim().toLowerCase() === key) || null;
}

export function resolverNombreCategoria(valor) {
  const v = String(valor || '').trim();
  if (!v) return '';
  const porId = obtenerCategoriasAdmin().find(c => String(c.id) === v);
  if (porId) return porId.nombre;
  const porNombre = resolverCategoriaPorNombre(v);
  return porNombre?.nombre || v;
}
