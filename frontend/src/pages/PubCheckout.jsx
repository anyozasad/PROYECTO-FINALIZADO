import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';
import {
  obtenerCarrito,
  resumenCarrito,
  vaciarCarrito,
  guardarPedidos,
  obtenerPedidos,
  calcularResumenSunat,
  leerEmpresaBoleta,
  generarHashCPE,
  generarCadenaQR,
  tipoDocumentoSunat,
} from '../utils/shopCore';

const CHECKOUT_KEY = 'dorada_checkout_pendiente';

const input = {
  width: '100%',
  background: 'var(--pg-input)',
  border: '1px solid var(--pg-border2)',
  borderRadius: '10px',
  padding: '10px 13px',
  color: 'var(--pg-text)',
  outline: 'none',
  fontFamily: "'Inter',sans-serif",
  boxSizing: 'border-box',
};

const label = {
  display: 'block',
  fontSize: '11px',
  fontWeight: '800',
  color: 'var(--pg-muted2)',
  marginBottom: '7px',
  textTransform: 'uppercase',
  letterSpacing: '.05em',
};

function leerContextoCheckout() {
  try {
    return JSON.parse(sessionStorage.getItem(CHECKOUT_KEY) || 'null');
  } catch {
    return null;
  }
}

function guardarPedidoServidor(data, contexto) {
  const numeroCompleto = String(data.numero_comprobante || `B001-${String(data.venta_id).padStart(8, '0')}`);
  const [serie = 'B001', numero = String(data.venta_id).padStart(8, '0')] = numeroCompleto.split('-');
  const resumen = calcularResumenSunat(contexto.items || [], contexto.resumen || {});
  const empresa = leerEmpresaBoleta();
  const pedido = {
    id: `VENTA-${data.venta_id}`,
    venta_id: data.venta_id,
    serie,
    numero,
    tipoComprobante: contexto.pago?.comprobante === 'Factura' ? '01' : '03',
    tipoComprobanteNombre: contexto.pago?.comprobante === 'Factura'
      ? 'FACTURA ELECTRÃ“NICA'
      : 'BOLETA DE VENTA ELECTRÃ“NICA',
    tipoOperacion: '0101',
    moneda: 'PEN',
    formaPago: 'Contado',
    fecha: new Date().toISOString(),
    estado: data.estado || 'PENDIENTE',
    cliente: contexto.cliente,
    entrega: contexto.entrega,
    pago: {
      ...contexto.pago,
      estado: data.estado_pago || data.estado,
      paymentId: data.payment_id || null,
    },
    items: contexto.items || [],
    resumen,
    empresa,
  };
  pedido.hash = generarHashCPE(
    `${empresa.ruc}|${pedido.tipoComprobante}|${serie}|${numero}|${Number(resumen.igv || 0).toFixed(2)}|${Number(resumen.total || 0).toFixed(2)}|${pedido.fecha.slice(0, 10)}|${tipoDocumentoSunat(contexto.cliente?.tipoDoc)}|${contexto.cliente?.documento || '-'}`
  );
  pedido.qr = generarCadenaQR(pedido);
  guardarPedidos([pedido, ...obtenerPedidos().filter((p) => p.id !== pedido.id)]);
  vaciarCarrito();
  return pedido;
}

export default function PubCheckout() {
  const navigate = useNavigate();
  const { isAuth, usuario } = useAuth();
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const contextoGuardado = useMemo(() => leerContextoCheckout(), []);
  const items = useMemo(() => {
    const carrito = obtenerCarrito();
    return carrito.length ? carrito : (contextoGuardado?.items || []);
  }, [contextoGuardado]);
  const r = useMemo(
    () => contextoGuardado?.resumen || resumenCarrito(items),
    [contextoGuardado, items]
  );
  const [step, setStep] = useState(params.get('mp') ? 3 : 1);
  const [cliente, setCliente] = useState(
    contextoGuardado?.cliente || {
      nombre: usuario?.nombre || '',
      documento: usuario?.documento || '',
      email: usuario?.email || '',
      telefono: usuario?.telefono || '',
      tipoDoc: 'DNI',
    }
  );
  const [entrega, setEntrega] = useState(
    contextoGuardado?.entrega || {
      tipo: 'DELIVERY',
      direccion: usuario?.direccion || '',
      referencia: '',
      distrito: '',
      ciudad: 'Pucallpa',
    }
  );
  const [pago, setPago] = useState(
    contextoGuardado?.pago || { metodo: 'Yape', operacion: '', comprobante: 'Boleta' }
  );
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    const retorno = params.get('mp');
    const ventaId = params.get('venta_id');
    if (!retorno || !ventaId) return undefined;

    let activo = true;
    const verificarPago = async () => {
      setProcesando(true);
      Swal.fire({
        title: 'Verificando pago',
        text: 'Estamos confirmando la operaciÃ³n con Mercado Pago...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
        background: 'var(--pg-surface)',
        color: 'var(--pg-text)',
      });

      try {
        const paymentId = params.get('payment_id') || '';
        const query = paymentId ? `?payment_id=${encodeURIComponent(paymentId)}` : '';
        const data = await apiFetch(`/pagos/mercadopago/estado/${ventaId}${query}`);
        if (!activo) return;

        if (data.estado === 'PAGADO') {
          const contexto = leerContextoCheckout();
          if (!contexto) throw new Error('No se encontrÃ³ la informaciÃ³n local del pedido.');
          const pedido = guardarPedidoServidor(data, contexto);
          sessionStorage.removeItem(CHECKOUT_KEY);
          await Swal.fire({
            icon: 'success',
            title: 'Pago aprobado',
            text: `Pedido ${data.numero_comprobante} confirmado correctamente.`,
            confirmButtonColor: '#7c3aed',
            background: 'var(--pg-surface)',
            color: 'var(--pg-text)',
          });
          navigate(`/s/boleta/${pedido.id}`, { replace: true });
          return;
        }

        if (retorno === 'pending' || data.estado === 'PENDIENTE_PAGO') {
          await Swal.fire({
            icon: 'info',
            title: 'Pago pendiente',
            text: 'Mercado Pago todavÃ­a estÃ¡ procesando la operaciÃ³n.',
            confirmButtonColor: '#7c3aed',
            background: 'var(--pg-surface)',
            color: 'var(--pg-text)',
          });
          navigate('/s/pedidos', { replace: true });
          return;
        }

        await Swal.fire({
          icon: 'error',
          title: 'Pago no aprobado',
          text: 'Puedes volver a intentarlo con otro medio de pago.',
          confirmButtonColor: '#7c3aed',
          background: 'var(--pg-surface)',
          color: 'var(--pg-text)',
        });
        navigate('/s/checkout', { replace: true });
      } catch (error) {
        if (!activo) return;
        await Swal.fire({
          icon: 'error',
          title: 'No pudimos verificar el pago',
          text: error.message,
          confirmButtonColor: '#7c3aed',
          background: 'var(--pg-surface)',
          color: 'var(--pg-text)',
        });
      } finally {
        if (activo) setProcesando(false);
      }
    };

    verificarPago();
    return () => {
      activo = false;
    };
  }, [navigate, params]);

  if (!items.length) {
    return (
      <div style={{ padding: '40px', background: 'var(--pg-bg)', color: 'var(--pg-text)', minHeight: '100%' }}>
        <h1>No hay productos en tu carrito</h1>
        <button
          className="pg-anim-btn"
          onClick={() => navigate('/s/ofertas')}
          style={{ background: '#7c3aed', color: 'white', border: 'none', borderRadius: '10px', padding: '12px 18px', fontWeight: '800' }}
        >
          Ver ofertas
        </button>
      </div>
    );
  }

  const validar = () => {
    if (step === 1 && (!cliente.nombre || !cliente.telefono || !cliente.documento)) {
      return 'Completa nombre, documento y telÃ©fono.';
    }
    if (step === 2 && entrega.tipo === 'DELIVERY' && !entrega.direccion) {
      return 'Ingresa tu direcciÃ³n para delivery.';
    }
    if (step === 3 && pago.metodo === 'Plin' && pago.operacion.trim().length < 4) {
      return 'Ingresa el nÃºmero de operaciÃ³n de Plin.';
    }
    return '';
  };

  const siguiente = () => {
    const error = validar();
    if (error) {
      return Swal.fire({
        icon: 'warning',
        title: error,
        confirmButtonColor: '#7c3aed',
        background: 'var(--pg-surface)',
        color: 'var(--pg-text)',
        width: '380px',
      });
    }
    setStep((s) => Math.min(3, s + 1));
  };

  const finalizar = async () => {
    const error = validar();
    if (error) {
      return Swal.fire({
        icon: 'warning',
        title: error,
        confirmButtonColor: '#7c3aed',
        background: 'var(--pg-surface)',
        color: 'var(--pg-text)',
        width: '380px',
      });
    }

    const contexto = { cliente, entrega, pago, items, resumen: r };
    const payload = {
      cliente,
      entrega,
      items: items.map((item) => ({
        producto_id: Number(item.id),
        cantidad: Number(item.cantidad || 1),
      })),
      metodo_pago: pago.metodo.toUpperCase(),
      tipo_comprobante: pago.comprobante.toUpperCase(),
      operacion: pago.operacion,
      cupon: r.cupon || '',
    };

    setProcesando(true);
    try {
      if (['Yape', 'Tarjeta'].includes(pago.metodo)) {
        sessionStorage.setItem(CHECKOUT_KEY, JSON.stringify(contexto));
        const data = await apiFetch('/pagos/mercadopago/preferencia', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (!data.init_point) throw new Error('Mercado Pago no devolviÃ³ la URL de pago.');
        window.location.assign(data.init_point);
        return;
      }

      const data = await apiFetch('/pagos/manual', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const pedido = guardarPedidoServidor(data, contexto);
      sessionStorage.removeItem(CHECKOUT_KEY);
      await Swal.fire({
        icon: 'success',
        title: pago.metodo === 'Plin' ? 'Pago enviado a verificaciÃ³n' : 'Pedido confirmado',
        text: data.message,
        confirmButtonColor: '#7c3aed',
        background: 'var(--pg-surface)',
        color: 'var(--pg-text)',
      });
      navigate('/s/pedidos');
    } catch (err) {
      await Swal.fire({
        icon: 'error',
        title: 'No se pudo procesar la compra',
        text: err.message,
        confirmButtonColor: '#7c3aed',
        background: 'var(--pg-surface)',
        color: 'var(--pg-text)',
      });
    } finally {
      setProcesando(false);
    }
  };

  const stepStyle = (n) => ({
    height: '32px',
    borderRadius: '999px',
    padding: '0 16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: '900',
    background: step >= n ? 'linear-gradient(135deg,#7c3aed,#9333ea)' : 'var(--pg-input)',
    border: '1px solid var(--pg-border2)',
    color: step >= n ? 'white' : 'var(--pg-muted2)',
  });

  const textoBoton = procesando
    ? 'Procesando...'
    : ['Yape', 'Tarjeta'].includes(pago.metodo)
      ? 'Continuar con Mercado Pago'
      : pago.metodo === 'Plin'
        ? 'Registrar pago Plin'
        : 'Confirmar pago contra entrega';

  return (
    <div
      className="pub-checkout-page"
      style={{ padding: '22px 24px', paddingBottom: '120px', fontFamily: "'Inter',sans-serif", background: 'var(--pg-bg)', color: 'var(--pg-text)', minHeight: '100%' }}
    >
      <style>{`@media(max-width:820px){.pub-checkout-page{padding:14px 10px 105px!important}.pub-checkout-head{flex-direction:column!important;align-items:flex-start!important}.pub-checkout-head button{width:100%!important}.pub-checkout-steps{overflow-x:auto!important}.pub-checkout-grid{grid-template-columns:1fr!important}.pub-checkout-form-grid,.pub-checkout-two-grid,.pub-checkout-pay-grid{grid-template-columns:1fr!important}.pub-checkout-form-grid>div{grid-column:auto!important}.pub-checkout-row-actions{gap:10px!important}.pub-checkout-row-actions button{flex:1!important}}`}</style>

      <div className="pub-checkout-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: '900' }}>Proceso de compra</h1>
          <p style={{ margin: 0, color: 'var(--pg-muted)' }}>
            {isAuth ? 'Compra con tu cuenta Dorada Motorâ€™s' : 'Puedes iniciar sesiÃ³n, registrarte o comprar como invitado.'}
          </p>
        </div>
        <button
          className="pg-anim-btn"
          onClick={() => navigate('/s/carrito')}
          style={{ background: 'transparent', border: '1px solid var(--pg-border2)', color: 'var(--pg-muted2)', borderRadius: '9px', padding: '9px 14px', cursor: 'pointer' }}
        >
          â† Volver al carrito
        </button>
      </div>

      <div className="pub-checkout-steps" style={{ display: 'flex', gap: '10px', marginBottom: '18px' }}>
        <div style={stepStyle(1)}>1 Datos</div>
        <div style={stepStyle(2)}>2 Entrega</div>
        <div style={stepStyle(3)}>3 Pago</div>
      </div>

      <div className="pub-checkout-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 310px', gap: '18px' }}>
        <section style={{ background: 'var(--pg-card)', border: '1px solid var(--pg-border)', borderRadius: '16px', padding: '20px', boxShadow: 'var(--pg-shadow)' }}>
          {step === 1 && (
            <div>
              <h2 style={{ margin: '0 0 14px', fontSize: '24px' }}>Datos del cliente</h2>
              <div className="pub-checkout-form-grid" style={{ display: 'grid', gridTemplateColumns: '160px 1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={label}>Documento</label>
                  <select value={cliente.tipoDoc} onChange={(e) => setCliente({ ...cliente, tipoDoc: e.target.value })} style={input}>
                    <option>DNI</option>
                    <option>RUC</option>
                  </select>
                </div>
                <div>
                  <label style={label}>Nro. documento</label>
                  <input value={cliente.documento} onChange={(e) => setCliente({ ...cliente, documento: e.target.value })} style={input} placeholder="12345678" />
                </div>
                <div>
                  <label style={label}>Nombre completo</label>
                  <input value={cliente.nombre} onChange={(e) => setCliente({ ...cliente, nombre: e.target.value })} style={input} placeholder="Juan PÃ©rez" />
                </div>
                <div>
                  <label style={label}>TelÃ©fono</label>
                  <input value={cliente.telefono} onChange={(e) => setCliente({ ...cliente, telefono: e.target.value })} style={input} placeholder="987654321" />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={label}>Correo</label>
                  <input value={cliente.email} onChange={(e) => setCliente({ ...cliente, email: e.target.value })} style={input} placeholder="cliente@gmail.com" />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 style={{ margin: '0 0 14px', fontSize: '24px' }}>Entrega</h2>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                {['DELIVERY', 'RECOJO'].map((x) => (
                  <button
                    key={x}
                    className="pg-anim-btn"
                    onClick={() => setEntrega({ ...entrega, tipo: x })}
                    style={{ flex: 1, background: entrega.tipo === x ? 'linear-gradient(135deg,#7c3aed,#9333ea)' : 'var(--pg-input)', color: entrega.tipo === x ? 'white' : 'var(--pg-text)', border: '1px solid var(--pg-border2)', borderRadius: '10px', padding: '12px', fontWeight: '900', cursor: 'pointer' }}
                  >
                    {x === 'DELIVERY' ? 'Delivery' : 'Recojo en tienda'}
                  </button>
                ))}
              </div>

              {entrega.tipo === 'DELIVERY' ? (
                <div style={{ display: 'grid', gap: '14px' }}>
                  <div>
                    <label style={label}>DirecciÃ³n</label>
                    <input value={entrega.direccion} onChange={(e) => setEntrega({ ...entrega, direccion: e.target.value })} style={input} placeholder="Av. / Jr. / Calle" />
                  </div>
                  <div className="pub-checkout-two-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={label}>Distrito</label>
                      <input value={entrega.distrito} onChange={(e) => setEntrega({ ...entrega, distrito: e.target.value })} style={input} />
                    </div>
                    <div>
                      <label style={label}>Ciudad</label>
                      <input value={entrega.ciudad} onChange={(e) => setEntrega({ ...entrega, ciudad: e.target.value })} style={input} />
                    </div>
                  </div>
                  <div>
                    <label style={label}>Referencia</label>
                    <input value={entrega.referencia} onChange={(e) => setEntrega({ ...entrega, referencia: e.target.value })} style={input} placeholder="Casa color..., frente a..." />
                  </div>
                </div>
              ) : (
                <div style={{ background: 'var(--pg-input)', border: '1px solid var(--pg-border2)', borderRadius: '12px', padding: '18px' }}>
                  <b>Recojo en tienda Dorada Motorâ€™s</b>
                  <p style={{ color: 'var(--pg-muted)', margin: '6px 0 0' }}>Av. Los PrÃ³ceres 123, Lima - PerÃº. AtenciÃ³n: Lunes a sÃ¡bado.</p>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 style={{ margin: '0 0 14px', fontSize: '24px' }}>Pago y comprobante</h2>
              <div className="pub-checkout-pay-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '16px' }}>
                {['Yape', 'Plin', 'Tarjeta', 'Efectivo'].map((x) => (
                  <button
                    key={x}
                    className="pg-anim-btn"
                    onClick={() => setPago({ ...pago, metodo: x })}
                    style={{ background: pago.metodo === x ? 'linear-gradient(135deg,#7c3aed,#9333ea)' : 'var(--pg-input)', color: pago.metodo === x ? 'white' : 'var(--pg-text)', border: '1px solid var(--pg-border2)', borderRadius: '10px', padding: '12px', fontWeight: '900', cursor: 'pointer' }}
                  >
                    {x}
                  </button>
                ))}
              </div>

              <div className="pub-checkout-two-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={label}>Nro. operaciÃ³n / referencia</label>
                  <input
                    value={pago.operacion}
                    onChange={(e) => setPago({ ...pago, operacion: e.target.value })}
                    style={input}
                    placeholder={pago.metodo === 'Plin' ? 'Obligatorio para Plin' : 'Opcional'}
                  />
                </div>
                <div>
                  <label style={label}>Comprobante</label>
                  <select value={pago.comprobante} onChange={(e) => setPago({ ...pago, comprobante: e.target.value })} style={input}>
                    <option>Boleta</option>
                    <option>Factura</option>
                  </select>
                </div>
              </div>

              <p style={{ color: 'var(--pg-muted)', fontSize: '12px', marginTop: '14px' }}>
                {['Yape', 'Tarjeta'].includes(pago.metodo)
                  ? 'SerÃ¡s redirigido al entorno seguro de Mercado Pago. La boleta se genera cuando el pago sea aprobado.'
                  : pago.metodo === 'Plin'
                    ? 'El pedido quedarÃ¡ pendiente hasta que la empresa verifique el nÃºmero de operaciÃ³n.'
                    : 'El pedido se registrarÃ¡ para pago en efectivo contra entrega.'}
              </p>
            </div>
          )}

          <div className="pub-checkout-row-actions" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '22px' }}>
            <button
              className="pg-anim-btn"
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1 || procesando}
              style={{ background: 'transparent', border: '1px solid var(--pg-border2)', color: 'var(--pg-muted2)', borderRadius: '10px', padding: '11px 18px', cursor: step === 1 ? 'not-allowed' : 'pointer' }}
            >
              AtrÃ¡s
            </button>

            {step < 3 ? (
              <button
                className="pg-anim-btn"
                onClick={siguiente}
                disabled={procesando}
                style={{ background: 'linear-gradient(135deg,#7c3aed,#9333ea)', border: 'none', borderRadius: '10px', padding: '11px 22px', color: 'white', fontWeight: '900', cursor: 'pointer' }}
              >
                Continuar
              </button>
            ) : (
              <button
                className="pg-anim-btn"
                onClick={finalizar}
                disabled={procesando}
                style={{ background: 'linear-gradient(135deg,#16a34a,#22c55e)', border: 'none', borderRadius: '10px', padding: '11px 22px', color: 'white', fontWeight: '900', cursor: procesando ? 'wait' : 'pointer', opacity: procesando ? 0.75 : 1 }}
              >
                {textoBoton}
              </button>
            )}
          </div>
        </section>

        <aside style={{ background: 'var(--pg-card)', border: '1px solid var(--pg-border)', borderRadius: '16px', padding: '18px', height: 'fit-content', boxShadow: 'var(--pg-shadow)' }}>
          <h2 style={{ margin: '0 0 14px' }}>Resumen</h2>
          {items.map((p) => (
            <div key={p.id} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <img src={p.img} alt={p.nombre} style={{ width: '52px', height: '52px', objectFit: 'contain', background: '#f5f5fc', borderRadius: '8px' }} />
              <div style={{ flex: 1 }}>
                <b style={{ fontSize: '12px' }}>{p.nombre}</b>
                <p style={{ margin: '3px 0 0', color: 'var(--pg-muted)', fontSize: '11px' }}>
                  x{p.cantidad} Â· S/ {Number(p.precio).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
          <div style={{ height: '1px', background: 'var(--pg-border)', margin: '12px 0' }} />
          <p style={{ display: 'flex', justifyContent: 'space-between' }}><span>Subtotal</span><b>S/ {r.subtotal.toFixed(2)}</b></p>
          <p style={{ display: 'flex', justifyContent: 'space-between' }}><span>Descuento</span><b style={{ color: '#10b981' }}>- S/ {r.descuento.toFixed(2)}</b></p>
          <p style={{ display: 'flex', justifyContent: 'space-between' }}><span>EnvÃ­o</span><b>S/ {r.envio.toFixed(2)}</b></p>
          <h2 style={{ display: 'flex', justifyContent: 'space-between' }}><span>Total</span><span style={{ color: '#a78bfa' }}>S/ {r.total.toFixed(2)}</span></h2>
        </aside>
      </div>
    </div>
  );
}