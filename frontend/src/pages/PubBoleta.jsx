import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { buscarPedido, obtenerPedidos, generarCadenaQR, generarHashCPE, tipoDocumentoSunat } from '../utils/shopCore';

const money = (n) => Number(n || 0).toFixed(2);
const unidades = ['', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE', 'DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
const decenas = ['', '', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
const centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

function numTexto(n) {
  n = Math.floor(Number(n || 0));
  if (n === 0) return 'CERO';
  if (n === 100) return 'CIEN';
  if (n < 20) return unidades[n];
  if (n < 100) {
    const d = Math.floor(n / 10);
    const u = n % 10;
    if (n === 20) return 'VEINTE';
    if (n < 30) return `VEINTI${unidades[u].toLowerCase()}`.toUpperCase();
    return decenas[d] + (u ? ` Y ${unidades[u]}` : '');
  }
  if (n < 1000) {
    const c = Math.floor(n / 100);
    const r = n % 100;
    return centenas[c] + (r ? ` ${numTexto(r)}` : '');
  }
  if (n < 1000000) {
    const m = Math.floor(n / 1000);
    const r = n % 1000;
    return (m === 1 ? 'MIL' : `${numTexto(m)} MIL`) + (r ? ` ${numTexto(r)}` : '');
  }
  return String(n);
}

const solesEnLetras = (total) => {
  const valor = Number(total || 0);
  const soles = Math.floor(valor);
  const centimos = Math.round((valor - soles) * 100);
  return `${numTexto(soles)} CON ${String(centimos).padStart(2, '0')}/100 SOLES`;
};

function QRVisual({ value }) {
  const text = String(value || 'PARTGO');
  let seed = 0;
  for (let i = 0; i < text.length; i++) seed = (seed * 31 + text.charCodeAt(i)) >>> 0;
  const cells = [];
  for (let i = 0; i < 841; i++) {
    const x = i % 29;
    const y = Math.floor(i / 29);
    const tl = x < 7 && y < 7;
    const tr = x > 21 && y < 7;
    const bl = x < 7 && y > 21;
    const finder = tl || tr || bl;
    const border = finder && (
      (tl && (x === 0 || x === 6 || y === 0 || y === 6 || (x >= 2 && x <= 4 && y >= 2 && y <= 4))) ||
      (tr && (x === 22 || x === 28 || y === 0 || y === 6 || (x >= 24 && x <= 26 && y >= 2 && y <= 4))) ||
      (bl && (x === 0 || x === 6 || y === 22 || y === 28 || (x >= 2 && x <= 4 && y >= 24 && y <= 26)))
    );
    seed = (seed * 1664525 + 1013904223) >>> 0;
    cells.push(finder ? border : (seed % 11 < 5));
  }
  return <div className="cpe-qr" title={text}>{cells.map((on, i) => <i key={i} style={{ background: on ? '#111' : '#fff' }} />)}</div>;
}

function BarCode({ value }) {
  const text = String(value || 'PARTGO');
  let seed = 7;
  for (let i = 0; i < text.length; i++) seed = (seed * 33 + text.charCodeAt(i)) >>> 0;
  const bars = Array.from({ length: 58 }, () => {
    seed = (seed * 1103515245 + 12345) >>> 0;
    return 18 + (seed % 42);
  });
  return <div className="cpe-barcode" aria-label="Código de barras">{bars.map((h, i) => <i key={i} style={{ height: `${h}px`, width: `${i % 6 === 0 ? 3 : 2}px` }} />)}</div>;
}

export default function PubBoleta() {
  const { id } = useParams();
  const navigate = useNavigate();
  const pedido = useMemo(() => buscarPedido(id) || obtenerPedidos()[0], [id]);

  if (!pedido) {
    return (
      <div style={{ padding: 40, background: 'var(--pg-bg)', color: 'var(--pg-text)', minHeight: '100%' }}>
        <h1>No encontré la boleta</h1>
        <button onClick={() => navigate('/s/pedidos')} style={{ background: '#7c3aed', color: 'white', border: 0, borderRadius: 10, padding: '10px 16px', cursor: 'pointer' }}>Volver</button>
      </div>
    );
  }

  const fecha = new Date(pedido.fecha || Date.now());
  const fechaEmision = fecha.toLocaleDateString('es-PE');
  const horaEmision = fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const total = Number(pedido.resumen?.total || pedido.resumen?.importeTotal || 0);
  const opGravada = Number(pedido.resumen?.opGravada || total / 1.18);
  const igv = Number(pedido.resumen?.igv || total - opGravada);
  const descuento = Number(pedido.resumen?.descuento || 0);
  const envio = Number(pedido.resumen?.envio || 0);
  const empresa = pedido.empresa || {};
  const serie = pedido.serie || 'B001';
  const numero = pedido.numero || '00000001';
  const ruc = empresa.ruc || '20609999994';
  const hash = pedido.hash || generarHashCPE(`${ruc}|03|${serie}|${numero}|${pedido.cliente?.documento || '-'}`);
  const qr = pedido.qr || generarCadenaQR({ ...pedido, hash });
  const items = [...(pedido.items || [])];
  const tipoDoc = tipoDocumentoSunat(pedido.cliente?.tipoDoc);
  const direccionEntrega = pedido.entrega?.tipo === 'DELIVERY'
    ? pedido.entrega?.direccion
    : 'Recojo en tienda';

  if (envio > 0 && !items.some((it) => String(it.id) === 'ENVIO')) {
    items.push({ id: 'ENVIO', nombre: 'SERVICIO DE DELIVERY', cantidad: 1, precio: envio, unidad: 'ZZ' });
  }

  return (
    <div className="cpe-page" style={{ padding: '24px', background: 'var(--pg-bg)', color: 'var(--pg-text)', minHeight: '100%', fontFamily: "'Inter',sans-serif" }}>
      <style>{`
        .cpe-actions{width:min(410px,calc(100vw - 28px));margin:0 auto 14px;display:flex;justify-content:space-between;gap:10px}.cpe-actions button{border-radius:10px;padding:9px 13px;font-weight:900;cursor:pointer;font-family:'Inter',sans-serif;transition:transform .15s ease,filter .15s ease}.cpe-actions button:hover{transform:translateY(-2px);filter:brightness(1.06)}
        .cpe-ticket{width:76mm;max-width:calc(100vw - 24px);margin:0 auto;background:#fff;color:#111;border:2px solid #111;padding:9px 9px 13px;font-family:'Courier New',monospace;box-shadow:0 18px 45px rgba(0,0,0,.18);box-sizing:border-box;overflow:hidden}
        .cpe-center{text-align:center}.cpe-logo{font-family:Arial,sans-serif;font-size:21px;font-weight:900;letter-spacing:-.7px;margin-bottom:2px;color:#111}.cpe-title{font-size:11px;font-weight:900;margin:2px 0;text-transform:uppercase}.cpe-peru{font-size:12px;font-weight:900;letter-spacing:.12em;margin:1px 0 3px;text-transform:uppercase}.cpe-small{font-size:8.8px;margin:2px 0;line-height:1.2}.cpe-mini{font-size:7.8px;margin:1px 0;line-height:1.18}.cpe-strong{font-weight:900}.cpe-line{border-top:1px solid #111;margin:7px 0}.cpe-dashed{border-top:1px dashed #111;margin:7px 0}.cpe-row{display:flex;justify-content:space-between;gap:6px;font-size:8.8px;line-height:1.32}.cpe-row span:first-child{font-weight:700;white-space:nowrap}.cpe-row span:last-child{text-align:right;word-break:break-word}.cpe-table{width:100%;border-collapse:collapse;font-size:7.9px;margin-top:5px;table-layout:fixed}.cpe-table th{border-top:1px solid #111;border-bottom:1px solid #111;padding:3px 2px;text-align:left}.cpe-table td{border-bottom:1px dotted #aaa;padding:3px 2px;vertical-align:top;word-break:break-word}.cpe-table th:nth-child(1),.cpe-table td:nth-child(1){width:23px;text-align:center}.cpe-table th:nth-child(2),.cpe-table td:nth-child(2){width:auto}.cpe-table th:nth-child(3),.cpe-table td:nth-child(3){width:39px;text-align:right}.cpe-table th:nth-child(4),.cpe-table td:nth-child(4){width:47px;text-align:right}.cpe-total{font-size:18px;font-weight:900;text-align:right;margin:6px 0 2px}.cpe-box{border:1px solid #111;margin-top:7px;padding:5px;font-size:7.8px}.cpe-qr{width:116px;height:116px;margin:10px auto 4px;display:grid;grid-template-columns:repeat(29,1fr);gap:1px;background:#fff;padding:5px;border:1px solid #111}.cpe-qr i{display:block}.cpe-sign{height:26px;border-bottom:1px solid #111;margin:14px 42px 3px}.cpe-note{font-size:7.5px;line-height:1.18;text-align:center;margin:4px 0}.cpe-hash{word-break:break-all;font-size:7.3px;line-height:1.18;text-align:center;margin:4px 0}.cpe-footer{margin-top:7px;text-align:center;font-size:7.3px;line-height:1.18;font-weight:700}
        @media(max-width:480px){.cpe-page{padding:12px 5px 110px!important}.cpe-actions{flex-direction:column}.cpe-actions button{width:100%}.cpe-ticket{width:74mm;padding:8px 7px 12px}.cpe-total{font-size:16px}.cpe-table{font-size:7.4px}.cpe-table th:nth-child(3),.cpe-table td:nth-child(3){width:36px}.cpe-table th:nth-child(4),.cpe-table td:nth-child(4){width:44px}.cpe-qr{width:110px;height:110px}}
        @media print{body{background:#fff!important}.pg-public-scroll,.pg-public-header,.no-print{display:none!important}.pg-public-main{margin-left:0!important}.cpe-page{background:#fff!important;padding:0!important}.cpe-ticket{width:80mm!important;max-width:80mm!important;box-shadow:none!important;margin:0 auto!important;border:1.5px solid #111!important;page-break-inside:avoid!important}.cpe-actions{display:none!important}}
      `}</style>

      <div className="cpe-actions no-print">
        <button onClick={() => navigate('/s/pedidos')} style={{ background: 'transparent', border: '1px solid var(--pg-border2)', color: 'var(--pg-muted2)' }}>← Mis pedidos</button>
        <button onClick={() => window.print()} style={{ background: 'linear-gradient(135deg,#7c3aed,#9333ea)', border: 0, color: '#fff' }}>Imprimir / Guardar PDF</button>
      </div>

      <section className="cpe-ticket">
        <div className="cpe-center">
          <div className="cpe-logo">{(empresa.nombreComercial || 'PartGo').toUpperCase()}</div>
          <p className="cpe-small cpe-strong">{empresa.razonSocial || 'PARTGO REPUESTOS E.I.R.L.'}</p>
          <p className="cpe-small">RUC: {ruc}</p>
          <p className="cpe-small">{empresa.direccion || 'Av. Los Próceres 123, Lima - Perú'}</p>
          <p className="cpe-small">Tel: {empresa.telefono || '922 859 170'}</p>
          <p className="cpe-title">BOLETA DE VENTA ELECTRÓNICA</p>
          <p className="cpe-peru">PERÚ</p>
          <p className="cpe-title">N° {serie}-{numero}</p>
                  </div>

        <div className="cpe-line" />
        <div className="cpe-row"><span>Fecha:</span><span>{fechaEmision}</span></div>
        <div className="cpe-row"><span>Hora:</span><span>{horaEmision}</span></div>
        <div className="cpe-row"><span>Cliente:</span><span>{pedido.cliente?.nombre || 'Consumidor final'}</span></div>
        <div className="cpe-row"><span>{pedido.cliente?.tipoDoc || 'DNI'}:</span><span>{pedido.cliente?.documento || '-'}</span></div>
        <div className="cpe-row"><span>Forma de Pago:</span><span>{pedido.formaPago || 'Contado'}</span></div>
        <div className="cpe-row"><span>Medio de Pago:</span><span>{pedido.pago?.metodo || 'Efectivo'}</span></div>
        <div className="cpe-row"><span>Entrega:</span><span>{direccionEntrega || '-'}</span></div>
        <div className="cpe-row"><span>Vendedor:</span><span>PARTGO</span></div>

        <table className="cpe-table">
          <thead>
            <tr><th>Cant</th><th>Detalle</th><th>IGV</th><th>Total</th></tr>
          </thead>
          <tbody>
            {items.map((it, idx) => {
              const qty = Number(it.cantidad || 1);
              const precio = Number(it.precio || 0);
              const lineTotal = precio * qty;
              const lineIgv = lineTotal - lineTotal / 1.18;
              return (
                <tr key={`${it.id || idx}-${idx}`}>
                  <td>{qty}</td>
                  <td>{String(it.nombre || 'Producto').toUpperCase()}<br /><small>Unidad: {it.unidad || 'NIU'} - S/ {money(precio)} c/u</small></td>
                  <td>{money(lineIgv)}</td>
                  <td>{money(lineTotal)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="cpe-dashed" />
        <div className="cpe-row"><span>Op. gravada:</span><span>S/ {money(opGravada)}</span></div>
        {descuento > 0 && <div className="cpe-row"><span>Descuento:</span><span>- S/ {money(descuento)}</span></div>}
        <div className="cpe-row"><span>IGV 18%:</span><span>S/ {money(igv)}</span></div>
        <div className="cpe-row"><span>Total venta:</span><span>S/ {money(total)}</span></div>
        <div className="cpe-total">Total: S/ {money(total)}</div>
        <div className="cpe-row"><span>Cantidad ítems:</span><span>{items.length}</span></div>
        <p className="cpe-small"><b>SON:</b> {solesEnLetras(total)}</p>

        <div className="cpe-box">
          <div className="cpe-center cpe-strong">DETALLES DE IMPUESTOS</div>
          <div className="cpe-row"><span>Tributo:</span><span>IGV - 18%</span></div>
          <div className="cpe-row"><span>Tipo operación:</span><span>0101 - Venta interna</span></div>
          <div className="cpe-row"><span>Moneda:</span><span>PEN - Sol peruano</span></div>
          <div className="cpe-row"><span>Tipo CPE:</span><span>03 - Boleta electrónica</span></div>
          <div className="cpe-row"><span>Doc. receptor:</span><span>{tipoDoc}</span></div>
        </div>

        <p className="cpe-note cpe-strong">Autorizado mediante Resolución de Intendencia SUNAT</p>
        <p className="cpe-note">Representación impresa de la Boleta de Venta Electrónica Perú.</p>
        <div className="cpe-sign" />
        <p className="cpe-center cpe-small">Firma / conformidad</p>
        <QRVisual value={qr} />
        <p className="cpe-center cpe-small cpe-strong">Código Hash CPE:</p>
        <p className="cpe-hash">{hash}</p>
        <p className="cpe-mini"><b>Emisión:</b> {fechaEmision} {horaEmision}</p>
        <p className="cpe-mini"><b>Expedición:</b> {fechaEmision} {horaEmision}</p>
        <p className="cpe-mini"><b>Emisor:</b> {empresa.razonSocial || 'PARTGO REPUESTOS E.I.R.L.'} - RUC {ruc}</p>
        <p className="cpe-note">Consulte el comprobante con el RUC, tipo, serie, número, IGV, total y fecha de emisión.</p>
        <div className="cpe-footer">Software PartGo 2.0<br />www.partgo.pe<br />RUC: {ruc}</div>
      </section>
    </div>
  );
}
