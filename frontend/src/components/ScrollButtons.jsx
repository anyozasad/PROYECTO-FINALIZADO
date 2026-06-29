import { useEffect, useState } from 'react';

const getBestScrollTarget = () => {
  if (typeof document === 'undefined') return null;

  const candidates = [
    document.scrollingElement,
    document.documentElement,
    document.body,
    document.querySelector('.pg-app-main'),
    document.querySelector('.pg-public-main'),
    document.querySelector('.pg-app-content'),
    document.querySelector('.pg-public-page'),
    document.querySelector('.cpe-page'),
    document.querySelector('.detalle-public-page'),
  ].filter(Boolean);

  return candidates.find((el) => (el.scrollHeight || 0) - (el.clientHeight || 0) > 8) || document.scrollingElement || document.documentElement;
};

export default function ScrollButtons() {
  const [state, setState] = useState({ show: false, canUp: false, canDown: false });

  useEffect(() => {
    let raf = 0;

    const update = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = getBestScrollTarget();
        if (!el) return;

        const max = Math.max(0, (el.scrollHeight || 0) - (el.clientHeight || window.innerHeight || 0));
        const top = el === document.body ? window.scrollY : (el.scrollTop || 0);
        setState({
          show: max > 20,
          canUp: top > 10,
          canDown: top < max - 10,
        });
      });
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    document.addEventListener('scroll', update, true);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      document.removeEventListener('scroll', update, true);
    };
  }, []);

  const move = (direction) => {
    const el = getBestScrollTarget();
    if (!el) return;
    const amount = Math.max(280, Math.round((window.innerHeight || 720) * 0.78));
    const top = direction === 'down' ? amount : -amount;

    if (el === document.scrollingElement || el === document.documentElement || el === document.body) {
      window.scrollBy({ top, behavior: 'smooth' });
    } else {
      el.scrollBy({ top, behavior: 'smooth' });
    }
  };

  if (!state.show) return null;

  return (
    <div className="pg-scroll-controls" aria-label="Controles de desplazamiento">
      <button type="button" aria-label="Subir" title="Subir" onClick={() => move('up')} disabled={!state.canUp}>↑</button>
      <button type="button" aria-label="Bajar" title="Bajar" onClick={() => move('down')} disabled={!state.canDown}>↓</button>
    </div>
  );
}
