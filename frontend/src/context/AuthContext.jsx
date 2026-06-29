import { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { apiFetch } from '../services/api';
import { crearNotificacion } from '../utils/notificacionesStore';

const AuthContext = createContext(null);

function normalizarUsuario(usuario = {}) {
  return {
    ...usuario,
    id: usuario.id || usuario.sub || Date.now(),
    nombre: usuario.nombre || usuario.name || usuario.displayName || usuario.email?.split('@')?.[0] || 'Cliente PartGo',
    email: usuario.email || usuario.correo || '',
    foto: usuario.foto || usuario.picture || usuario.avatar || '',
    telefono: usuario.telefono || usuario.phone || '',
    direccion: usuario.direccion || usuario.address || '',
    documento: usuario.documento || usuario.dni || usuario.ruc || '',
    rol_id: Number(usuario.rol_id || usuario.rolId || 3),
    rol: usuario.rol || 'Cliente',
  };
}

function leerClientesRegistrados() {
  try {
    const raw = JSON.parse(localStorage.getItem('partgo_clientes_registrados') || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function leerUsuariosRegistrados() {
  try {
    const raw = JSON.parse(localStorage.getItem('partgo_usuarios_registrados') || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function registrarUsuarioParaAdmin(usuario = {}) {
  const limpio = normalizarUsuario(usuario);

  const item = {
    id: limpio.id || Date.now(),
    nombre: limpio.nombre || 'Cliente PartGo',
    email: limpio.email || '',
    rol: limpio.rol || 'Cliente',
    rol_id: limpio.rol_id,
    estado: 1,
    proveedor: limpio.proveedor || 'Registro',
    fecha_registro: new Date().toISOString(),
  };

  const actuales = leerUsuariosRegistrados();
  const key = String(item.email || item.id).toLowerCase();
  const sinDuplicado = actuales.filter(u => String(u.email || u.id).toLowerCase() !== key);
  const guardados = [item, ...sinDuplicado].slice(0, 500);

  localStorage.setItem('partgo_usuarios_registrados', JSON.stringify(guardados));
  window.dispatchEvent(new Event('partgo_usuarios_changed'));
}

function registrarClienteParaAdmin(usuario = {}) {
  const limpio = normalizarUsuario(usuario);
  if ([1, 2].includes(Number(limpio.rol_id))) return;

  const ahora = new Date().toISOString();
  const cliente = {
    id: limpio.id || Date.now(),
    nombre: limpio.nombre || 'Cliente PartGo',
    email: limpio.email || '',
    telefono: limpio.telefono || '',
    dni: limpio.documento || limpio.dni || limpio.ruc || '',
    documento: limpio.documento || limpio.dni || limpio.ruc || '',
    foto: limpio.foto || '',
    proveedor: limpio.proveedor || 'Registro',
    ordenes: Number(limpio.ordenes || 0),
    total: Number(limpio.total || 0),
    ultimo_acceso: ahora,
    estado: 'Activo'
  };

  const actuales = leerClientesRegistrados();
  const key = String(cliente.email || cliente.id).toLowerCase();
  const esNuevo = !actuales.some(c => String(c.email || c.id).toLowerCase() === key);
  const sinDuplicado = actuales.filter(c => String(c.email || c.id).toLowerCase() !== key);
  const guardados = [cliente, ...sinDuplicado].slice(0, 250);

  localStorage.setItem('partgo_clientes_registrados', JSON.stringify(guardados));
  window.dispatchEvent(new Event('partgo_clientes_changed'));

  if (esNuevo) {
    crearNotificacion({
      titulo: 'Nuevo cliente registrado',
      mensaje: `${cliente.nombre} se registró como nuevo cliente${cliente.proveedor && cliente.proveedor !== 'Registro' ? ` vía ${cliente.proveedor}` : ''}`,
      tipo: 'cliente',
    });
  }
}


export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);

  const persistirSesion = (usuarioData, token = '') => {
    const limpio = normalizarUsuario(usuarioData);

    localStorage.setItem('partgo_token', token || localStorage.getItem('partgo_token') || 'partgo_cliente_token');
    localStorage.setItem('partgo_usuario', JSON.stringify(limpio));

    if (limpio.foto) {
      localStorage.setItem('partgo_public_foto', limpio.foto);
    } else {
      localStorage.removeItem('partgo_public_foto');
    }

    registrarClienteParaAdmin(limpio);
    registrarUsuarioParaAdmin(limpio);

    window.dispatchEvent(new Event('partgo_auth_changed'));
    window.dispatchEvent(new Event('partgo_public_profile_changed'));

    setUsuario(limpio);
    return limpio;
  };

  useEffect(() => {
    const saved = localStorage.getItem('partgo_usuario');
    if (saved) {
      try { setUsuario(normalizarUsuario(JSON.parse(saved))); } catch(e) {}
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      const limpio = persistirSesion(data.usuario, data.token);
      return { ...data, usuario: limpio };
    } catch (error) {
      const usuariosDemo = [
        { id: 1, nombre: 'Administrador', email: 'admin@gmail.com', password: '123456', rol_id: 1, rol: 'Administrador' },
        { id: 2, nombre: 'Vendedor', email: 'vendedor@gmail.com', password: '123456', rol_id: 2, rol: 'Vendedor' },
        { id: 3, nombre: 'Cliente PartGo', email: 'cliente@gmail.com', password: '123456', rol_id: 3, rol: 'Cliente', telefono:'+51 987 654 321' }
      ];
      const demo = usuariosDemo.find((u) => u.email === email && u.password === password);
      if (!demo) throw error;
      const usuarioSeguro = { ...demo };
      delete usuarioSeguro.password;
      const limpio = persistirSesion(usuarioSeguro, 'partgo_demo_token');
      return { token: 'partgo_demo_token', usuario: limpio };
    }
  };

  const loginSocial = async (endpoint, payload) => {
    const data = await apiFetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    const limpio = persistirSesion(data.usuario, data.token);
    return { ...data, usuario: limpio };
  };

  const loginSocialLocal = (provider, payload = {}) => {
    const usuarioSocial = normalizarUsuario({
      id: payload.id || payload.sub || Date.now(),
      nombre: payload.nombre || payload.name || `Cliente ${provider}`,
      email: payload.email || `cliente.${String(provider).toLowerCase()}@partgo.com`,
      foto: payload.foto || payload.picture || '',
      telefono: payload.telefono || '',
      direccion: payload.direccion || '',
      documento: payload.documento || payload.dni || '',
      rol_id: 3,
      rol: 'Cliente',
      proveedor: provider
    });

    const token = payload.accessToken || `partgo_${String(provider).toLowerCase()}_token`;
    const limpio = persistirSesion(usuarioSocial, token);
    return { token, usuario: limpio };
  };

  const updateUsuario = (patch = {}) => {
    const actual = usuario || (() => {
      try { return JSON.parse(localStorage.getItem('partgo_usuario') || '{}'); } catch { return {}; }
    })();

    const limpio = persistirSesion({ ...actual, ...patch }, localStorage.getItem('partgo_token') || 'partgo_cliente_token');
    return limpio;
  };

  const logout = () => {
    localStorage.removeItem('partgo_token');
    localStorage.removeItem('partgo_usuario');
    localStorage.removeItem('partgo_public_foto');
    window.dispatchEvent(new Event('partgo_auth_changed'));
    window.dispatchEvent(new Event('partgo_public_profile_changed'));
    setUsuario(null);
  };

  const value = useMemo(
    () => ({ usuario, login, loginSocial, loginSocialLocal, updateUsuario, logout, isAuth: !!usuario, loading }),
    [usuario, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
