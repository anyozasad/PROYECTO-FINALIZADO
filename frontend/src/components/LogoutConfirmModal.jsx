import { useEffect } from 'react';

export default function LogoutConfirmModal({ open, onConfirm, onCancel }) {
  useEffect(() => {
    if (!open) return undefined;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onCancel?.();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="pg-logout-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pg-logout-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel?.();
      }}
    >
      <style>{`
        @keyframes pgLogoutFadeIn{from{opacity:0}to{opacity:1}}
        @keyframes pgLogoutPop{0%{opacity:0;transform:translateY(18px) scale(.92)}60%{opacity:1;transform:translateY(-2px) scale(1.02)}100%{opacity:1;transform:translateY(0) scale(1)}}
        .pg-logout-overlay{
          position:fixed!important;
          inset:0!important;
          z-index:2147483000!important;
          display:grid!important;
          place-items:center!important;
          width:100vw!important;
          height:100dvh!important;
          padding:18px!important;
          background:rgba(2,6,23,.74)!important;
          backdrop-filter:blur(8px)!important;
          animation:pgLogoutFadeIn .18s ease-out both!important;
          box-sizing:border-box!important;
        }
        .pg-logout-card{
          width:min(390px,calc(100vw - 28px))!important;
          max-height:calc(100dvh - 28px)!important;
          overflow:auto!important;
          background:var(--pg-card,var(--bg2,#0e0e1a))!important;
          color:var(--pg-text,var(--text,#fff))!important;
          border:1px solid var(--pg-border2,var(--border2,rgba(255,255,255,.14)))!important;
          border-radius:22px!important;
          padding:22px!important;
          box-shadow:0 28px 90px rgba(0,0,0,.48)!important;
          animation:pgLogoutPop .28s ease-out both!important;
          box-sizing:border-box!important;
        }
        .pg-logout-icon{
          width:58px;height:58px;margin:0 auto 12px;border-radius:18px;
          display:grid;place-items:center;font-size:28px;
          background:linear-gradient(135deg,rgba(239,68,68,.18),rgba(124,58,237,.18));
          border:1px solid rgba(239,68,68,.28);
        }
        .pg-logout-title{margin:0;text-align:center;font-size:20px;font-weight:900;letter-spacing:-.02em;color:var(--pg-text,var(--text,#fff))}
        .pg-logout-text{margin:8px auto 18px;text-align:center;font-size:14px;line-height:1.45;color:var(--pg-muted2,var(--muted2,#cbd5e1));max-width:290px}
        .pg-logout-actions{display:flex;gap:10px;justify-content:center}
        .pg-logout-actions button{
          flex:1;border:0;border-radius:13px;padding:12px 14px;font-weight:900;cursor:pointer;
          font-family:'Inter',system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
          transition:transform .14s ease,filter .14s ease,box-shadow .14s ease;
          min-height:44px;
        }
        .pg-logout-actions button:hover{transform:translateY(-2px);filter:brightness(1.07)}
        .pg-logout-actions button:active{transform:translateY(0) scale(.96)}
        .pg-logout-cancel{background:var(--pg-input,var(--bg4,#1f2937));color:var(--pg-text,var(--text,#fff));border:1px solid var(--pg-border2,var(--border2,rgba(255,255,255,.12)))!important}
        .pg-logout-confirm{background:linear-gradient(135deg,#ef4444,#dc2626);color:white;box-shadow:0 10px 25px rgba(239,68,68,.28)}
        @media(max-width:420px){
          .pg-logout-overlay{align-items:center!important;padding:14px!important}
          .pg-logout-card{width:100%!important;padding:19px!important;border-radius:19px!important}
          .pg-logout-actions{flex-direction:column-reverse!important}
          .pg-logout-actions button{width:100%!important}
        }
      `}</style>

      <section className="pg-logout-card" onMouseDown={(event) => event.stopPropagation()}>
        <div className="pg-logout-icon">🚪</div>
        <h2 id="pg-logout-title" className="pg-logout-title">¿Deseas salir de tu cuenta?</h2>
        <p className="pg-logout-text">Volverás a la pantalla principal de Dorada Motor’s.</p>
        <div className="pg-logout-actions">
          <button type="button" className="pg-logout-cancel" onClick={onCancel}>Cancelar</button>
          <button type="button" className="pg-logout-confirm" onClick={onConfirm}>Sí, salir</button>
        </div>
      </section>
    </div>
  );
}
