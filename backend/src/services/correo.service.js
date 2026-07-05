const nodemailer = require('nodemailer');
const { query } = require('../config/db');

let tablaLista = false;
let transportador = null;

function valor(nombre, defecto = '') {
  return String(process.env[nombre] || defecto).trim();
}

function escaparHtml(dato) {
  return String(dato ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function asegurarTabla() {
  if (tablaLista) return;

  await query(`
    CREATE TABLE IF NOT EXISTS correos_compra (
      id INT AUTO_INCREMENT PRIMARY KEY,
      venta_id INT NOT NULL,
      estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
      intentos INT NOT NULL DEFAULT 0,
      destinatario VARCHAR(160) NULL,
      error_ultimo VARCHAR(500) NULL,
      enviado_en TIMESTAMP NULL,
      creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      actualizado_en TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uk_correo_compra_venta (venta_id),
      CONSTRAINT fk_correo_compra_venta
        FOREIGN KEY (venta_id)
        REFERENCES ventas(id)
        ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  tablaLista = true;
}

function obtenerTransportador() {
  if (transportador) return transportador;

  const usuario = valor('SMTP_USER');
  const clave = valor('SMTP_PASS');

  if (!usuario || !clave) {
    throw new Error(
      'Falta configurar SMTP_USER y SMTP_PASS en Render.'
    );
  }

  transportador = nodemailer.createTransport({
    host: valor('SMTP_HOST', 'smtp.gmail.com'),
    port: Number(valor('SMTP_PORT', '465')),
    secure:
      valor('SMTP_SECURE', 'true').toLowerCase() ===
      'true',
    auth: {
      user: usuario,
      pass: clave,
    },
  });

  return transportador;
}

async function reservarEnvio(ventaId) {
  await asegurarTabla();

  await query(
    `INSERT INTO correos_compra
     (venta_id, estado, intentos)
     VALUES (?, 'PENDIENTE', 0)
     ON DUPLICATE KEY UPDATE
       venta_id=VALUES(venta_id)`,
    [ventaId]
  );

  const resultado = await query(
    `UPDATE correos_compra
     SET
       estado='ENVIANDO',
       intentos=intentos+1,
       error_ultimo=NULL
     WHERE venta_id=?
       AND (
         estado IN ('PENDIENTE', 'ERROR')
         OR (
           estado='ENVIANDO'
           AND actualizado_en <
             DATE_SUB(NOW(), INTERVAL 5 MINUTE)
         )
       )`,
    [ventaId]
  );

  return Number(resultado.affectedRows || 0) === 1;
}

async function cargarCompra(ventaId) {
  const ventas = await query(
    `SELECT
        v.id,
        v.numero_comprobante,
        v.total,
        c.nombre AS cliente_nombre,
        c.email AS cliente_email
     FROM ventas v
     INNER JOIN clientes c
       ON c.id=v.cliente_id
     WHERE v.id=?
       AND v.estado='PAGADO'
     LIMIT 1`,
    [ventaId]
  );

  if (!ventas.length) {
    throw new Error(
      'No se encontró la venta pagada.'
    );
  }

  const detalles = await query(
    `SELECT
        producto_nombre,
        cantidad,
        subtotal
     FROM detalle_ventas
     WHERE venta_id=?
     ORDER BY id ASC`,
    [ventaId]
  );

  return {
    venta: ventas[0],
    detalles,
  };
}

async function enviarCorreoCompra(ventaId) {
  const id = Number(ventaId);

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error(
      'Venta inválida para enviar el correo.'
    );
  }

  const reservado = await reservarEnvio(id);

  if (!reservado) {
    return {
      enviado: false,
      repetido: true,
    };
  }

  try {
    const { venta, detalles } =
      await cargarCompra(id);

    const destinatario = valor(
      venta.cliente_email
    );

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        destinatario
      )
    ) {
      throw new Error(
        'El cliente no tiene un correo válido.'
      );
    }

    const productos = detalles
      .map(
        (item) => `
          <tr>
            <td
              style="
                padding:8px;
                border-bottom:1px solid #e5e7eb;
              "
            >
              ${escaparHtml(item.producto_nombre)}
            </td>

            <td
              style="
                padding:8px;
                text-align:center;
                border-bottom:1px solid #e5e7eb;
              "
            >
              ${Number(item.cantidad)}
            </td>

            <td
              style="
                padding:8px;
                text-align:right;
                border-bottom:1px solid #e5e7eb;
              "
            >
              S/ ${Number(item.subtotal).toFixed(2)}
            </td>
          </tr>
        `
      )
      .join('');

    const nombreEmpresa = valor(
      'MAIL_FROM_NAME',
      "Dorada Motor's"
    );

    const correoRemitente = valor(
      'MAIL_FROM_EMAIL',
      valor('SMTP_USER')
    );

    const correoAdministrador = valor(
      'MAIL_ADMIN'
    );

    await obtenerTransportador().sendMail({
      from:
        `"${nombreEmpresa.replace(/"/g, '')}" ` +
        `<${correoRemitente}>`,

      to: destinatario,

      bcc:
        correoAdministrador ||
        undefined,

      subject:
        `Compra confirmada - ` +
        `${venta.numero_comprobante}`,

      html: `
        <div
          style="
            font-family:Arial,sans-serif;
            max-width:640px;
            margin:auto;
            color:#111827;
          "
        >
          <h2 style="color:#6d28d9;">
            ¡Compra confirmada!
          </h2>

          <p>
            Hola
            <strong>
              ${escaparHtml(venta.cliente_nombre)}
            </strong>,
          </p>

          <p>
            Mercado Pago confirmó correctamente
            tu pago.
          </p>

          <p>
            <strong>Pedido:</strong>
            ${escaparHtml(
              venta.numero_comprobante
            )}
          </p>

          <table
            style="
              width:100%;
              border-collapse:collapse;
              margin:18px 0;
            "
          >
            <thead>
              <tr>
                <th
                  style="
                    padding:8px;
                    text-align:left;
                    border-bottom:2px solid #d1d5db;
                  "
                >
                  Producto
                </th>

                <th
                  style="
                    padding:8px;
                    text-align:center;
                    border-bottom:2px solid #d1d5db;
                  "
                >
                  Cantidad
                </th>

                <th
                  style="
                    padding:8px;
                    text-align:right;
                    border-bottom:2px solid #d1d5db;
                  "
                >
                  Subtotal
                </th>
              </tr>
            </thead>

            <tbody>
              ${productos}
            </tbody>
          </table>

          <p style="font-size:20px;">
            <strong>
              Total pagado:
              S/ ${Number(venta.total).toFixed(2)}
            </strong>
          </p>

          <p>
            Estado:
            <strong>PAGADO</strong>
          </p>

          <p>
            Gracias por comprar en
            ${escaparHtml(nombreEmpresa)}.
          </p>
        </div>
      `,
    });

    await query(
      `UPDATE correos_compra
       SET
         estado='ENVIADO',
         destinatario=?,
         error_ultimo=NULL,
         enviado_en=NOW()
       WHERE venta_id=?`,
      [
        destinatario,
        id,
      ]
    );

    return {
      enviado: true,
      destinatario,
    };
  } catch (error) {
    await query(
      `UPDATE correos_compra
       SET
         estado='ERROR',
         error_ultimo=?
       WHERE venta_id=?`,
      [
        String(
          error.message || error
        ).slice(0, 500),
        id,
      ]
    ).catch(() => {});

    throw error;
  }
}

module.exports = {
  enviarCorreoCompra,
};