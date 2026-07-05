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

// DORADA_PLIN_CONFIG_INICIO
const PLIN_DATOS = {
  titular: "Dorada Motor's",
  numero: "922859170",
};
// DORADA_PLIN_CONFIG_FIN

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
      ? 'FACTURA ELECTRÓNICA'
      : 'BOLETA DE VENTA ELECTRÓNICA',
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
        text: 'Estamos confirmando la operación con Mercado Pago...',
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
          if (!contexto) throw new Error('No se encontró la información local del pedido.');
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
            text: 'Mercado Pago todavía está procesando la operación.',
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
      return 'Completa nombre, documento y teléfono.';
    }
    if (step === 2 && entrega.tipo === 'DELIVERY' && !entrega.direccion) {
      return 'Ingresa tu dirección para delivery.';
    }
    if (
      step === 3 &&
      pago.metodo === 'Plin' &&
      !/^\d{6,20}$/.test(pago.operacion.trim())
    ) {
      return 'Ingresa un número de operación Plin válido de 6 a 20 dígitos.';
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
        if (!data.init_point) throw new Error('Mercado Pago no devolvió la URL de pago.');
        window.location.assign(data.init_point);
        return;
      }

      const data = await apiFetch('/pagos/manual', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      guardarPedidoServidor(data, contexto);
      sessionStorage.removeItem(CHECKOUT_KEY);

      await Swal.fire({
        icon: 'info',
        title: 'Pago Plin pendiente de verificación',
        text:
          data.message ||
          'El pedido fue registrado, pero el pago todavía no está confirmado. La empresa debe verificar que el dinero haya ingresado.',
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
    : pago.metodo === 'Yape'
      ? 'Continuar con Yape'
      : pago.metodo === 'Tarjeta'
        ? 'Pagar con tarjeta'
        : 'Registrar pago Plin';

  return (
    <div
      className="pub-checkout-page"
      style={{ padding: '22px 24px', paddingBottom: '120px', fontFamily: "'Inter',sans-serif", background: 'var(--pg-bg)', color: 'var(--pg-text)', minHeight: '100%' }}
    >
            {/* DORADA_CHECKOUT_DATOS_LAYOUT_INICIO */}
      <style>{`
        .pub-checkout-form-grid {
          grid-template-columns:
            190px
            minmax(280px, 1fr)
            minmax(280px, 1fr) !important;
          column-gap: 14px !important;
          row-gap: 14px !important;
          align-items: end;
          width: 100%;
        }

        .pub-checkout-form-grid > div {
          min-width: 0;
        }

        .pub-checkout-form-grid input,
        .pub-checkout-form-grid select {
          width: 100% !important;
          min-width: 0;
          min-height: 49px;
          box-sizing: border-box;
        }

        @media (max-width: 1100px) {
          .pub-checkout-form-grid {
            grid-template-columns:
              175px
              minmax(0, 1fr)
              minmax(0, 1fr) !important;
          }
        }

        @media (max-width: 820px) {
          .pub-checkout-form-grid {
            grid-template-columns: 1fr !important;
          }

          .pub-checkout-form-grid > div {
            grid-column: auto !important;
          }
        }
      `}</style>
      {/* DORADA_CHECKOUT_DATOS_LAYOUT_FIN */}
<style>{`@media(max-width:820px){.pub-checkout-page{padding:14px 10px 105px!important}.pub-checkout-head{flex-direction:column!important;align-items:flex-start!important}.pub-checkout-head button{width:100%!important}.pub-checkout-steps{overflow-x:auto!important}.pub-checkout-grid{grid-template-columns:1fr!important}.pub-checkout-form-grid,.pub-checkout-two-grid,.pub-checkout-pay-grid{grid-template-columns:1fr!important}.pub-checkout-form-grid>div{grid-column:auto!important}.pub-checkout-row-actions{gap:10px!important}.pub-checkout-row-actions button{flex:1!important}}`}</style>

      <div className="pub-checkout-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: '900' }}>Proceso de compra</h1>
          <p style={{ margin: 0, color: 'var(--pg-muted)' }}>
            {isAuth ? 'Compra con tu cuenta Dorada Motor’s' : 'Puedes iniciar sesión, registrarte o comprar como invitado.'}
          </p>
        </div>
        <button
          className="pg-anim-btn"
          onClick={() => navigate('/s/carrito')}
          style={{ background: 'transparent', border: '1px solid var(--pg-border2)', color: 'var(--pg-muted2)', borderRadius: '9px', padding: '9px 14px', cursor: 'pointer' }}
        >
          ← Volver al carrito
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
                  <input value={cliente.documento} onChange={(e) => setCliente({ ...cliente, documento: e.target.value })} style={input} placeholder="Ingresa tu DNI" />
                </div>
                <div>
                  <label style={label}>Nombre completo</label>
                  <input value={cliente.nombre} onChange={(e) => setCliente({ ...cliente, nombre: e.target.value })} style={input} placeholder="Ingresa tu nombre completo" />
                </div>
                <div>
                  <label style={label}>Teléfono</label>
                  <input value={cliente.telefono} onChange={(e) => setCliente({ ...cliente, telefono: e.target.value })} style={input} placeholder="Ingresa tu número de celular" />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={label}>Correo</label>
                  <input value={cliente.email} onChange={(e) => setCliente({ ...cliente, email: e.target.value })} style={input} placeholder="Ingresa tu correo electrónico" />
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
                    <label style={label}>Dirección</label>
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
                  <b>Recojo en tienda Dorada Motor’s</b>
                  <p style={{ color: 'var(--pg-muted)', margin: '6px 0 0' }}>Jr. Malecón la Hoyada N.º 226, en el distrito de Callería, provincia de Coronel Portillo, región Ucayali.</p>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 style={{ margin: '0 0 14px', fontSize: '24px' }}>Pago y comprobante</h2>
              <div className="pub-checkout-pay-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
              {['Yape', 'Plin', 'Tarjeta'].map((x) => (
                <button
                  key={x}
                  type="button"
                  className="pg-anim-btn"
                  onClick={() =>
                    setPago({
                      ...pago,
                      metodo: x,
                      operacion: x === 'Plin' ? pago.operacion : '',
                    })
                  }
                  style={{
                    background:
                      pago.metodo === x
                        ? 'linear-gradient(135deg,#7c3aed,#9333ea)'
                        : 'var(--pg-input)',
                    color:
                      pago.metodo === x
                        ? 'white'
                        : 'var(--pg-text)',
                    border: '1px solid var(--pg-border2)',
                    borderRadius: '10px',
                    padding: '12px',
                    fontWeight: '900',
                    cursor: 'pointer',
                  }}
                >
                  {x}
                </button>
              ))}
            </div>

              {/* DORADA_PAGOS_CORREGIDOS_INICIO */}
              <div
                style={{
                  marginBottom: '16px',
                  padding: '18px',
                  borderRadius: '14px',
                  border: '1px solid var(--pg-border2)',
                  background: 'var(--pg-input)',
                }}
              >
                {pago.metodo === 'Yape' && (
                  <div>
                    <b
                      style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontSize: '18px',
                      }}
                    >
                      Pago seguro con Yape
                    </b>

                    <p
                      style={{
                        margin: 0,
                        color: 'var(--pg-muted)',
                        fontSize: '13px',
                        lineHeight: 1.45,
                      }}
                    >
                      Al continuar se abrirá Mercado Pago. El pedido solo se
                      confirmará cuando Mercado Pago informe que el dinero fue
                      aprobado correctamente.
                    </p>
                  </div>
                )}

                {pago.metodo === 'Plin' && (
                  <div>
                    <b
                      style={{
                        display: 'block',
                        marginBottom: '10px',
                        fontSize: '18px',
                      }}
                    >
                      Datos para pagar con Plin
                    </b>

                    <p
                      style={{
                        margin: '6px 0',
                        color: 'var(--pg-muted)',
                      }}
                    >
                      Titular:{' '}
                      <strong style={{ color: 'var(--pg-text)' }}>
                        Dorada Motor&apos;s
                      </strong>
                    </p>

                    <p
                      style={{
                        margin: '6px 0',
                        color: 'var(--pg-muted)',
                      }}
                    >
                      Número Plin:{' '}
                      <strong style={{ color: 'var(--pg-text)' }}>
                        922859170
                      </strong>
                    </p>

                    <p
                      style={{
                        margin: '10px 0 0',
                        color: 'var(--pg-muted)',
                        fontSize: '13px',
                        lineHeight: 1.45,
                      }}
                    >
                      Realiza el pago y escribe el número de operación para
                      que la empresa pueda verificarlo.
                    </p>
                  </div>
                )}

                {pago.metodo === 'Tarjeta' && (
                  <div>
                    <b
                      style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontSize: '18px',
                      }}
                    >
                      Pago seguro con tarjeta
                    </b>

                    <p
                      style={{
                        margin: 0,
                        color: 'var(--pg-muted)',
                        fontSize: '13px',
                        lineHeight: 1.45,
                      }}
                    >
                      Serás redirigido a Mercado Pago para ingresar una
                      tarjeta de crédito o débito de manera segura.
                    </p>
                  </div>
                )}
              </div>
              {/* DORADA_PAGOS_CORREGIDOS_FIN */}

<div
              className="pub-checkout-two-grid"
              style={{
                display: 'grid',
                gridTemplateColumns:
                  pago.metodo === 'Plin' ? '1fr 1fr' : '1fr',
                gap: '14px',
              }}
            >
              {pago.metodo === 'Plin' && (
                <div>
                  <label style={label}>
                    Nro. operación / referencia
                  </label>

                  <input
                    value={pago.operacion}
                    onChange={(e) =>
                      setPago({
                        ...pago,
                        operacion: e.target.value,
                      })
                    }
                    style={input}
                    placeholder="Número de operación Plin (6 a 20 dígitos)"
                  />
                </div>
              )}

              <div>
                <label style={label}>Comprobante</label>

                <select
                  value={pago.comprobante}
                  onChange={(e) =>
                    setPago({
                      ...pago,
                      comprobante: e.target.value,
                    })
                  }
                  style={input}
                >
                  <option>Boleta</option>
                  <option>Factura</option>
                </select>
              </div>
            </div>

            <p
              style={{
                color: 'var(--pg-muted)',
                fontSize: '12px',
                marginTop: '14px',
              }}
            >
              {pago.metodo === 'Yape'
                ? 'El pago quedará pendiente hasta que la empresa verifique la operación.'
                : pago.metodo === 'Tarjeta'
                  ? 'Serás redirigido a Mercado Pago para completar el pago con tarjeta.'
                  : pago.metodo === 'Plin'
                    ? 'El pedido quedará pendiente hasta que la empresa verifique el número de operación.'
                    : 'El pedido se registrará para pago en efectivo contra entrega.'}
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
              Atrás
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
                  x{p.cantidad} · S/ {Number(p.precio).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
          <div style={{ height: '1px', background: 'var(--pg-border)', margin: '12px 0' }} />
          <p style={{ display: 'flex', justifyContent: 'space-between' }}><span>Subtotal</span><b>S/ {r.subtotal.toFixed(2)}</b></p>
          <p style={{ display: 'flex', justifyContent: 'space-between' }}><span>Descuento</span><b style={{ color: '#10b981' }}>- S/ {r.descuento.toFixed(2)}</b></p>
          <p style={{ display: 'flex', justifyContent: 'space-between' }}><span>Envío</span><b>S/ {r.envio.toFixed(2)}</b></p>
          <h2 style={{ display: 'flex', justifyContent: 'space-between' }}><span>Total</span><span style={{ color: '#a78bfa' }}>S/ {r.total.toFixed(2)}</span></h2>
        </aside>
      </div>
    </div>
  );
}