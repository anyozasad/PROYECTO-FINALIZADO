const nodemailer = require('nodemailer');
const { query } = require('../config/db');

let tablaCreada = false;
let transporter = null;

function texto(valor, maximo = 500) {
  return String(valor ?? '').trim().slice(0, maximo);
}

function correoValido(valor) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    String(valor || '').trim()
  );
}

function escaparHtml(valor) {
  return String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function smtpConfigurado() {
  return Boolean(
    String(process.env.SMTP_USER || '').trim() &&
    String(process.env.SMTP_PASS || '')
      .replace(/\s+/g, '')
      .trim()
  );
}

function obtenerTransporter() {
  if (transporter) {
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: String(
      process.env.SMTP_HOST || 'smtp.gmail.com'
    ).trim(),

    port: Number(
      process.env.SMTP_PORT || 465
    ),

    secure:
      String(
        process.env.SMTP_SECURE ?? 'true'
      ).toLowerCase() !== 'false',

    auth: {
      user: String(
        process.env.SMTP_USER || ''
      ).trim(),

      pass: String(
        process.env.SMTP_PASS || ''
      )
        .replace(/\s+/g, '')
        .trim(),
    },
  });

  return transporter;
}

async function asegurarTabla() {
  if (tablaCreada) {
    return;
  }

  await query(`
    CREATE TABLE IF NOT EXISTS correos_pago (
      id INT AUTO_INCREMENT PRIMARY KEY,

      venta_id INT NOT NULL,

      tipo VARCHAR(20) NOT NULL,

      destinatario VARCHAR(190) NOT NULL,

      estado VARCHAR(20)
        NOT NULL
        DEFAULT 'PENDIENTE',

      ultimo_error TEXT NULL,

      enviado_en DATETIME NULL,

      creado_en TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,

      actualizado_en TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

      UNIQUE KEY uk_correo_pago
        (venta_id, tipo),

      CONSTRAINT fk_correo_pago_venta
        FOREIGN KEY (venta_id)
        REFERENCES ventas(id)
        ON DELETE CASCADE
    )
    ENGINE=InnoDB
    DEFAULT CHARSET=utf8mb4
  `);

  tablaCreada = true;
}

async function obtenerDatosVenta(ventaId) {
  const ventas = await query(
    `
      SELECT
        v.id,
        v.numero_comprobante,
        v.total,
        v.metodo_pago,
        v.tipo_comprobante,
        v.direccion_entrega,
        v.fecha,

        c.nombre
          AS cliente_nombre,

        c.documento
          AS cliente_documento,

        c.telefono
          AS cliente_telefono,

        c.email
          AS cliente_email,

        p.referencia
          AS payment_id

      FROM ventas v

      LEFT JOIN clientes c
        ON c.id = v.cliente_id

      LEFT JOIN pagos p
        ON p.venta_id = v.id

      WHERE v.id = ?

      LIMIT 1
    `,
    [ventaId]
  );

  if (!ventas.length) {
    return null;
  }

  const detalles = await query(
    `
      SELECT
        producto_nombre,
        cantidad,
        precio_unitario,
        subtotal

      FROM detalle_ventas

      WHERE venta_id = ?

      ORDER BY id ASC
    `,
    [ventaId]
  );

  return {
    ...ventas[0],
    detalles,
  };
}

function crearFilasProductos(detalles) {
  return detalles
    .map((producto) => {
      return `
        <tr>
          <td
            style="
              padding: 8px;
              border-bottom: 1px solid #e5e7eb;
            "
          >
            ${escaparHtml(producto.producto_nombre)}
          </td>

          <td
            style="
              padding: 8px;
              text-align: center;
              border-bottom: 1px solid #e5e7eb;
            "
          >
            ${Number(producto.cantidad || 0)}
          </td>

          <td
            style="
              padding: 8px;
              text-align: right;
              border-bottom: 1px solid #e5e7eb;
            "
          >
            S/ ${Number(producto.subtotal || 0).toFixed(2)}
          </td>
        </tr>
      `;
    })
    .join('');
}

function crearPlantilla(datos, esCliente) {
  const titulo = esCliente
    ? 'Tu pago fue confirmado'
    : "Nuevo pago confirmado en Dorada Motor's";

  const mensaje = esCliente
    ? `
      Hola ${escaparHtml(
        datos.cliente_nombre || 'cliente'
      )}, tu compra fue pagada correctamente.
    `
    : `
      Mercado Pago confirmó el pago real
      correspondiente al pedido
      ${escaparHtml(datos.numero_comprobante)}.
    `;

  return `
    <!doctype html>

    <html lang="es">
      <body
        style="
          margin: 0;
          background: #f5f3ff;
          font-family: Arial, sans-serif;
          color: #111827;
        "
      >
        <div
          style="
            max-width: 680px;
            margin: 24px auto;
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 16px;
            overflow: hidden;
          "
        >
          <div
            style="
              padding: 24px;
              color: white;
              background:
                linear-gradient(
                  135deg,
                  #6d28d9,
                  #9333ea
                );
            "
          >
            <h1
              style="
                margin: 0;
                font-size: 24px;
              "
            >
              ${titulo}
            </h1>
          </div>

          <div style="padding: 24px;">
            <p
              style="
                font-size: 16px;
                line-height: 1.6;
              "
            >
              ${mensaje}
            </p>

            <div
              style="
                padding: 16px;
                margin: 18px 0;
                background: #f9fafb;
                border-radius: 12px;
              "
            >
              <p>
                <strong>Pedido:</strong>

                ${escaparHtml(
                  datos.numero_comprobante || '-'
                )}
              </p>

              <p>
                <strong>Cliente:</strong>

                ${escaparHtml(
                  datos.cliente_nombre || '-'
                )}
              </p>

              <p>
                <strong>Documento:</strong>

                ${escaparHtml(
                  datos.cliente_documento || '-'
                )}
              </p>

              <p>
                <strong>Método:</strong>

                ${escaparHtml(
                  datos.metodo_pago ||
                  'MERCADO_PAGO'
                )}
              </p>

              <p>
                <strong>ID de pago:</strong>

                ${escaparHtml(
                  datos.payment_id || '-'
                )}
              </p>

              <p style="font-size: 20px;">
                <strong>Total pagado:</strong>

                S/ ${Number(
                  datos.total || 0
                ).toFixed(2)}
              </p>
            </div>

            <table
              style="
                width: 100%;
                border-collapse: collapse;
                margin-top: 16px;
              "
            >
              <thead>
                <tr style="background: #ede9fe;">
                  <th
                    style="
                      padding: 9px;
                      text-align: left;
                    "
                  >
                    Producto
                  </th>

                  <th
                    style="
                      padding: 9px;
                      text-align: center;
                    "
                  >
                    Cantidad
                  </th>

                  <th
                    style="
                      padding: 9px;
                      text-align: right;
                    "
                  >
                    Subtotal
                  </th>
                </tr>
              </thead>

              <tbody>
                ${crearFilasProductos(
                  datos.detalles || []
                )}
              </tbody>
            </table>

            <p
              style="
                margin-top: 22px;
                color: #4b5563;
              "
            >
              Estado:

              <strong style="color: #16a34a;">
                PAGADO
              </strong>

              El comprobante ya fue generado
              automáticamente por el sistema.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}

async function reservarCorreo(
  ventaId,
  tipo,
  destinatario
) {
  const resultado = await query(
    `
      INSERT IGNORE INTO correos_pago
      (
        venta_id,
        tipo,
        destinatario,
        estado
      )
      VALUES
      (
        ?,
        ?,
        ?,
        'ENVIANDO'
      )
    `,
    [
      ventaId,
      tipo,
      destinatario,
    ]
  );

  if (
    Number(
      resultado.affectedRows || 0
    ) === 1
  ) {
    return true;
  }

  const reintento = await query(
    `
      UPDATE correos_pago

      SET
        estado = 'ENVIANDO',
        destinatario = ?,
        ultimo_error = NULL

      WHERE venta_id = ?
        AND tipo = ?
        AND
        (
          estado = 'ERROR'

          OR
          (
            estado = 'ENVIANDO'

            AND actualizado_en <
              DATE_SUB(
                NOW(),
                INTERVAL 10 MINUTE
              )
          )
        )
    `,
    [
      destinatario,
      ventaId,
      tipo,
    ]
  );

  return (
    Number(
      reintento.affectedRows || 0
    ) === 1
  );
}

async function marcarEnviado(
  ventaId,
  tipo
) {
  await query(
    `
      UPDATE correos_pago

      SET
        estado = 'ENVIADO',
        enviado_en = NOW(),
        ultimo_error = NULL

      WHERE venta_id = ?
        AND tipo = ?
    `,
    [
      ventaId,
      tipo,
    ]
  );
}

async function marcarError(
  ventaId,
  tipo,
  error
) {
  await query(
    `
      UPDATE correos_pago

      SET
        estado = 'ERROR',
        ultimo_error = ?

      WHERE venta_id = ?
        AND tipo = ?
    `,
    [
      texto(
        error?.message || error,
        2000
      ),

      ventaId,
      tipo,
    ]
  );
}

async function enviarUno({
  ventaId,
  tipo,
  destinatario,
  asunto,
  html,
}) {
  const reservado = await reservarCorreo(
    ventaId,
    tipo,
    destinatario
  );

  if (!reservado) {
    return;
  }

  try {
    const usuario = String(
      process.env.SMTP_USER || ''
    ).trim();

    const nombre = texto(
      process.env.EMAIL_FROM_NAME ||
      "Dorada Motor's",
      100
    );

    await obtenerTransporter().sendMail({
      from:
        `"${nombre.replace(/"/g, '')}" ` +
        `<${usuario}>`,

      to: destinatario,

      subject: asunto,

      html,
    });

    await marcarEnviado(
      ventaId,
      tipo
    );
  } catch (error) {
    await marcarError(
      ventaId,
      tipo,
      error
    );

    throw error;
  }
}

async function enviarCorreoPagoConfirmado(
  ventaId
) {
  if (!smtpConfigurado()) {
    console.warn(
      'Pago confirmado, pero faltan ' +
      'SMTP_USER y SMTP_PASS.'
    );

    return;
  }

  await asegurarTabla();

  const datos =
    await obtenerDatosVenta(
      ventaId
    );

  if (!datos) {
    return;
  }

  const correoAdministrador =
    String(
      process.env.EMAIL_ADMIN ||
      process.env.SMTP_USER ||
      ''
    ).trim();

  const correoCliente =
    String(
      datos.cliente_email || ''
    ).trim();

  const tareas = [];

  if (
    correoValido(
      correoAdministrador
    )
  ) {
    tareas.push(
      enviarUno({
        ventaId,

        tipo: 'ADMIN',

        destinatario:
          correoAdministrador,

        asunto:
          `Pago confirmado ` +
          `${datos.numero_comprobante} - ` +
          `S/ ${Number(
            datos.total || 0
          ).toFixed(2)}`,

        html:
          crearPlantilla(
            datos,
            false
          ),
      })
    );
  }

  if (
    correoValido(correoCliente) &&
    correoCliente.toLowerCase() !==
      correoAdministrador.toLowerCase()
  ) {
    tareas.push(
      enviarUno({
        ventaId,

        tipo: 'CLIENTE',

        destinatario:
          correoCliente,

        asunto:
          `Tu pago fue confirmado - ` +
          `${datos.numero_comprobante}`,

        html:
          crearPlantilla(
            datos,
            true
          ),
      })
    );
  }

  const resultados =
    await Promise.allSettled(
      tareas
    );

  resultados.forEach(
    (resultado) => {
      if (
        resultado.status ===
        'rejected'
      ) {
        console.error(
          'Error enviando correo:',

          resultado.reason?.message ||
          resultado.reason
        );
      }
    }
  );
}

module.exports = {
  enviarCorreoPagoConfirmado,
};