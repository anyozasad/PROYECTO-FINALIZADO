import { createContext, useContext, useState, useEffect, useMemo } from 'react';

const PreferenciasContext = createContext(null);

export const TASAS_CAMBIO = {
  'Soles ($)': { simbolo: 'S/', tasa: 1 },
  'Dólares (USD)': { simbolo: '$', tasa: 0.27 },
  'Euros (€)': { simbolo: '€', tasa: 0.25 },
};

export const TEXTOS = {
  Español: {
    inicio: 'Inicio', misPedidos: 'Mis pedidos', favoritos: 'Favoritos', ofertas: 'Ofertas',
    mensajes: 'Mensajes', miCarrito: 'Mi carrito', direcciones: 'Direcciones', configuracion: 'Configuración',
    buscar: 'Buscar repuestos, marcas...', cambiosGuardados: 'Cambios guardados', idiomaAplicado: 'Idioma aplicado',
    monedaAplicada: 'Moneda aplicada',
  },
  English: {
    inicio: 'Home', misPedidos: 'My orders', favoritos: 'Favorites', ofertas: 'Deals',
    mensajes: 'Messages', miCarrito: 'My cart', direcciones: 'Addresses', configuracion: 'Settings',
    buscar: 'Search parts, brands...', cambiosGuardados: 'Changes saved', idiomaAplicado: 'Language applied',
    monedaAplicada: 'Currency applied',
  },
  Português: {
    inicio: 'Início', misPedidos: 'Meus pedidos', favoritos: 'Favoritos', ofertas: 'Ofertas',
    mensajes: 'Mensagens', miCarrito: 'Meu carrinho', direcciones: 'Endereços', configuracion: 'Configurações',
    buscar: 'Buscar peças, marcas...', cambiosGuardados: 'Alterações salvas', idiomaAplicado: 'Idioma aplicado',
    monedaAplicada: 'Moeda aplicada',
  },
};

export function PreferenciasProvider({ children }) {
  const [idioma, setIdiomaState] = useState(() => localStorage.getItem('partgo_idioma') || 'Español');
  const [moneda, setMonedaState] = useState(() => localStorage.getItem('partgo_moneda') || 'Soles ($)');

  useEffect(() => { localStorage.setItem('partgo_idioma', idioma); }, [idioma]);
  useEffect(() => { localStorage.setItem('partgo_moneda', moneda); }, [moneda]);

  const setIdioma = (v) => { setIdiomaState(v); window.dispatchEvent(new Event('partgo_pref_changed')); };
  const setMoneda = (v) => { setMonedaState(v); window.dispatchEvent(new Event('partgo_pref_changed')); };

  const formatPrecio = (soles) => {
    const cfg = TASAS_CAMBIO[moneda] || TASAS_CAMBIO['Soles ($)'];
    const valor = Number(soles || 0) * cfg.tasa;
    return `${cfg.simbolo} ${valor.toFixed(2)}`;
  };

  const t = useMemo(() => TEXTOS[idioma] || TEXTOS.Español, [idioma]);

  const value = useMemo(
    () => ({ idioma, setIdioma, moneda, setMoneda, formatPrecio, t }),
    [idioma, moneda, t]
  );

  return <PreferenciasContext.Provider value={value}>{children}</PreferenciasContext.Provider>;
}

export function usePreferencias() {
  return useContext(PreferenciasContext);
}
