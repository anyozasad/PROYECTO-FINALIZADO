const { query, transaction } = require('../config/db');

const MP_API = 'https://api.mercadopago.com';
const RESERVA_MINUTOS = 45;
let tablaLista = false;
let limpiezaIniciada = false;

function envObligatoria(nombre) {
  const valor = String(process.env[nombre] || '').trim();
  if (!valor) throw new Error(`Falta configurar ${nombre} en Render.`);
  return valor.replace(/\/$/, '');
}

function texto(valor, max = 220) {
  return String(valor ?? '').trim().slice(0, max);
}

function numeroComprobante(id, tipo = 'BOLETA') {
  const serie = String(tipo).toUpperCase() === 'FACTURA' ? 'F001' : 'B001';
  return `${serie}-${String(id).padStart(8, '0')}`;
}

function cuponValido(cupon = '') {
  const normalizado = String(cupon)
    .trim()
    .toUpperCase()
    .replace(/[â€™â€˜`Â´]/g, "'")
    .replace(/\s+/g, ' ');
  return normalizado === "DORADA MOTOR'S10" || normalizado === 'DORADA MOTORS10';
}

async function asegurarTabla() {
  if (tablaLista) return;
  await query(`
    CREATE TABLE IF NOT EXISTS mercadopago_pagos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      venta_id INT NOT NULL UNIQUE,
      preference_id VARCHAR(150) NULL,
      payment_id VARCHAR(150) NULL,
      estado_mp VARCHAR(50) DEFAULT 'pending',
      detalle_mp VARCHAR(150) NULL,
      stock_liberado TINYINT DEFAULT 0,
      creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_mp_payment_id (payment_id),
      CONSTRAINT fk_mp_venta FOREIGN KEY (venta_id)
        REFERENCES ventas(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  tablaLista = true;
}

async function prepararVenta({ cliente, entrega, items, metodoPago, tipoComprobante, operacion, cupon }) {
  if (!Array.isArray(items) || items.length === 0) {
    throw Object.assign(new Error('El carrito estÃ¡ vacÃ­o.'), { statusCode: 400 });
  }
  if (items.length > 50) {
    throw Object.assign(new Error('El carrito supera el mÃ¡ximo permitido.'), { statusCode: 400 });
  }

  const nombre = texto(cliente?.nombre, 150);
  const documento = texto(cliente?.documento, 20);
  const telefono = texto(cliente?.telefono, 20);
  const email = texto(cliente?.email, 120);
  const tipoEntrega = texto(entrega?.tipo || 'DELIVERY', 20).toUpperCase();
  const direccion = tipoEntrega === 'RECOJO'
    ? 'Recojo en tienda Dorada Motorâ€™s'
    : texto(entrega?.direccion, 220);

  if (!nombre || !documento || !telefono) {
    throw Object.assign(new Error('Completa nombre, documento y telÃ©fono.'), { statusCode: 400 });
  }
  if (tipoEntrega === 'DELIVERY' && !direccion) {
    throw Object.assign(new Error('Ingresa la direcciÃ³n de entrega.'), { statusCode: 400 });
  }

  return transaction(async (conn) => {
    const [clientes] = await conn.query(
      'SELECT id FROM clientes WHERE documento = ? LIMIT 1 FOR UPDATE',
      [documento]
    );

    let clienteId;
    if (clientes.length) {
      clienteId = clientes[0].id;
      await conn.query(
        'UPDATE clientes SET nombre=?, telefono=?, email=?, direccion=? WHERE id=?',
        [nombre, telefono, email, direccion, clienteId]
      );
    } else {
      const [nuevo] = await conn.query(
        `INSERT INTO clientes(usuario_id, nombre, documento, telefono, email, direccion, estado)
         VALUES (NULL, ?, ?, ?, ?, ?, 1)`,
        [nombre, documento, telefono, email, direccion]
      );
      clienteId = nuevo.insertId;
    }

    let subtotal = 0;
    const detalle = [];

    for (const item of items) {
      const productoId = Number(item.producto_id ?? item.id);
      const cantidad = Math.max(1, Number(item.cantidad || 1));
      if (!Number.isInteger(productoId) || productoId <= 0 || !Number.isInteger(cantidad)) {
        throw Object.assign(new Error('Hay un producto invÃ¡lido en el carrito.'), { statusCode: 400 });
      }

      const [productos] = await conn.query(
        `SELECT id, nombre, imagen, precio, precio_oferta, en_oferta, stock
         FROM productos WHERE id = ? AND estado = 1 LIMIT 1 FOR UPDATE`,
        [productoId]
      );
      if (!productos.length) {
        throw Object.assign(new Error(`Producto ${productoId} no disponible.`), { statusCode: 409 });
      }

      const producto = productos[0];
      if (Number(producto.stock) < cantidad) {
        throw Object.assign(new Error(`Stock insuficiente para ${producto.nombre}.`), { statusCode: 409 });
      }

      const precio = Number(producto.en_oferta && Number(producto.precio_oferta) > 0
        ? producto.precio_oferta
        : producto.precio);
      const linea = Number((precio * cantidad).toFixed(2));
      subtotal += linea;

      await conn.query('UPDATE productos SET stock = stock - ? WHERE id = ?', [cantidad, productoId]);
      await conn.query(
        `INSERT INTO historial_stock(producto_id, stock_anterior, stock_nuevo, movimiento, referencia)
         VALUES (?, ?, ?, 'RESERVA_VENTA', ?)`,
        [productoId, Number(producto.stock), Number(producto.stock) - cantidad, `Reserva de pago ${nombre}`]
      );

      detalle.push({
        producto_id: productoId,
        producto_nombre: producto.nombre,
        producto_imagen: producto.imagen,
        cantidad,
        precio_unitario: precio,
        subtotal: linea,
      });
    }

    subtotal = Number(subtotal.toFixed(2));
    const descuento = cuponValido(cupon) ? Number((subtotal * 0.10).toFixed(2)) : 0;
    const envio = tipoEntrega === 'DELIVERY' && subtotal - descuento < 250 ? 10 : 0;
    const total = Number(Math.max(0, subtotal - descuento + envio).toFixed(2));

    const metodo = texto(metodoPago || 'MERCADO_PAGO', 30).toUpperCase();
    const tipo = texto(tipoComprobante || 'BOLETA', 30).toUpperCase();
    const estadoVenta = metodo === 'EFECTIVO'
      ? 'PENDIENTE_ENTREGA'
      : metodo === 'PLIN'
        ? 'PENDIENTE_VERIFICACION'
        : 'PENDIENTE_PAGO';

    const [venta] = await conn.query(
      `INSERT INTO ventas(cliente_id, usuario_id, total, estado, metodo_pago, tipo_comprobante, direccion_entrega)
       VALUES (?, NULL, ?, ?, ?, ?, ?)`,
      [clienteId, total, estadoVenta, metodo, tipo, direccion]
    );

    const numero = numeroComprobante(venta.insertId, tipo);
    await conn.query('UPDATE ventas SET numero_comprobante=? WHERE id=?', [numero, venta.insertId]);

    for (const d of detalle) {
      await conn.query(
        `INSERT INTO detalle_ventas
         (venta_id, producto_id, producto_nombre, producto_imagen, cantidad, precio_unitario, subtotal)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [venta.insertId, d.producto_id, d.producto_nombre, d.producto_imagen, d.cantidad, d.precio_unitario, d.subtotal]
      );
    }

    await conn.query(
      `INSERT INTO pagos(venta_id, metodo_pago, monto, estado, referencia)
       VALUES (?, ?, ?, 'PENDIENTE', ?)`,
      [venta.insertId, metodo, total, texto(operacion || `${metodo}-${Date.now()}`, 100)]
    );

    await conn.query(
      `INSERT INTO notificaciones(tipo, titulo, mensaje, venta_id, leido)
       VALUES ('VENTA', 'Pedido pendiente de pago', ?, ?, 0)`,
      [`${nombre} creÃ³ el pedido ${numero} por S/ ${total.toFixed(2)}.`, venta.insertId]
    );

    return {
      venta_id: venta.insertId,
      numero_comprobante: numero,
      estado: estadoVenta,
      subtotal,
      descuento,
      envio,
      total,
      cliente: { nombre, documento, telefono, email },
      entrega: { ...entrega, tipo: tipoEntrega, direccion },
      detalle,
    };
  });
}

async function liberarStock(ventaId, motivo = 'LIBERACION_RESERVA') {
  await transaction(async (conn) => {
    const [mpRows] = await conn.query(
      'SELECT stock_liberado FROM mercadopago_pagos WHERE venta_id=? FOR UPDATE',
      [ventaId]
    );
    if (mpRows.length && Number(mpRows[0].stock_liberado) === 1) return;

    const [detalles] = await conn.query(
      'SELECT producto_id, cantidad FROM detalle_ventas WHERE venta_id=?',
      [ventaId]
    );
    for (const d of detalles) {
      const [productos] = await conn.query('SELECT stock FROM productos WHERE id=? FOR UPDATE', [d.producto_id]);
      if (!productos.length) continue;
      const anterior = Number(productos[0].stock);
      const nuevo = anterior + Number(d.cantidad);
      await conn.query('UPDATE productos SET stock=? WHERE id=?', [nuevo, d.producto_id]);
      await conn.query(
        `INSERT INTO historial_stock(producto_id, stock_anterior, stock_nuevo, movimiento, referencia)
         VALUES (?, ?, ?, ?, ?)`,
        [d.producto_id, anterior, nuevo, motivo, `Venta ${ventaId}`]
      );
    }
    await conn.query('UPDATE mercadopago_pagos SET stock_liberado=1 WHERE venta_id=?', [ventaId]);
  });
}

async function volverAReservarStock(conn, ventaId) {
  const [detalles] = await conn.query(
    'SELECT producto_id, cantidad, producto_nombre FROM detalle_ventas WHERE venta_id=?',
    [ventaId]
  );
  for (const d of detalles) {
    const [productos] = await conn.query('SELECT stock FROM productos WHERE id=? FOR UPDATE', [d.producto_id]);
    if (!productos.length || Number(productos[0].stock) < Number(d.cantidad)) {
      throw new Error(`Pago aprobado, pero no hay stock suficiente para ${d.producto_nombre}.`);
    }
    const anterior = Number(productos[0].stock);
    const nuevo = anterior - Number(d.cantidad);
    await conn.query('UPDATE productos SET stock=? WHERE id=?', [nuevo, d.producto_id]);
    await conn.query(
      `INSERT INTO historial_stock(producto_id, stock_anterior, stock_nuevo, movimiento, referencia)
       VALUES (?, ?, ?, 'REACTIVAR_RESERVA', ?)`,
      [d.producto_id, anterior, nuevo, `Pago aprobado venta ${ventaId}`]
    );
  }
}

async function crearPreferencia(req, res, next) {
  try {
    await asegurarTabla();
    const token = envObligatoria('MP_ACCESS_TOKEN');
    const frontendUrl = envObligatoria('FRONTEND_URL');
    const backendUrl = envObligatoria('BACKEND_URL');

    const venta = await prepararVenta({
      ...req.body,
      metodoPago: 'MERCADO_PAGO',
      tipoComprobante: req.body.tipo_comprobante,
    });

    await query(
      `INSERT INTO mercadopago_pagos(venta_id, estado_mp, stock_liberado)
       VALUES (?, 'pending', 0)
       ON DUPLICATE KEY UPDATE estado_mp='pending', stock_liberado=0`,
      [venta.venta_id]
    );

    const ahora = new Date();
    const vence = new Date(ahora.getTime() + 30 * 60 * 1000);
    const isoUtc = (date) => date.toISOString();

    const preferencia = {
      items: [{
        id: String(venta.venta_id),
        title: `Pedido Dorada Motor's ${venta.numero_comprobante}`,
        description: `${venta.detalle.length} producto(s) - Total con envÃ­o y descuento`,
        quantity: 1,
        currency_id: 'PEN',
        unit_price: venta.total,
      }],
      payer: {
        name: venta.cliente.nombre,
        email: venta.cliente.email || undefined,
      },
      external_reference: String(venta.venta_id),
      metadata: { venta_id: venta.venta_id, numero: venta.numero_comprobante },
      back_urls: {
        success: "https://proyecto-finalizado-zeta.vercel.app/s/checkout?modo=invitado&mp=success",
        failure: "https://proyecto-finalizado-zeta.vercel.app/s/checkout?modo=invitado&mp=failure",
        pending: "https://proyecto-finalizado-zeta.vercel.app/s/checkout?modo=invitado&mp=pending",
      },
      auto_return: 'approved',
      notification_url: `${backendUrl}/api/v1/pagos/mercadopago/webhook`,
      statement_descriptor: 'DORADA MOTORS',
      expires: true,
      expiration_date_from: isoUtc(ahora),
      expiration_date_to: isoUtc(vence),
    };

    const respuesta = await fetch(`${MP_API}/checkout/preferences`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': `dorada-venta-${venta.venta_id}`,
      },
      body: JSON.stringify(preferencia),
    });
    const data = await respuesta.json().catch(() => ({}));

    if (!respuesta.ok || !data.id || !data.init_point) {
      await liberarStock(venta.venta_id, 'ERROR_PREFERENCIA_MP');
      await query("UPDATE ventas SET estado='ERROR_PAGO' WHERE id=?", [venta.venta_id]);
      throw new Error(data.message || data.error || 'Mercado Pago no pudo crear la preferencia.');
    }

    await query(
      `UPDATE mercadopago_pagos SET preference_id=?, estado_mp='pending' WHERE venta_id=?`,
      [data.id, venta.venta_id]
    );

    res.status(201).json({
      venta_id: venta.venta_id,
      numero_comprobante: venta.numero_comprobante,
      total: venta.total,
      preference_id: data.id,
      init_point: data.init_point,
      sandbox_init_point: data.sandbox_init_point,
    });
  } catch (error) {
    error.statusCode = error.statusCode || 500;
    next(error);
  }
}

async function crearPedidoManual(req, res, next) {
  try {
    const metodo = texto(req.body.metodo_pago, 30).toUpperCase();

    if (metodo !== 'PLIN') {
      return res.status(400).json({
        error: 'El único pago manual permitido es Plin.',
      });
    }

    const operacion = texto(req.body.operacion, 100);

    if (!/^\d{6,20}$/.test(operacion)) {
      return res.status(400).json({
        error: 'Ingresa un número de operación Plin válido de 6 a 20 dígitos.',
      });
    }

    const operacionesRepetidas = await query(
      `SELECT id
       FROM pagos
       WHERE metodo_pago = 'PLIN'
         AND referencia = ?
       LIMIT 1`,
      [operacion]
    );

    if (operacionesRepetidas.length) {
      return res.status(409).json({
        error: 'Ese número de operación Plin ya fue registrado anteriormente.',
      });
    }

    const venta = await prepararVenta({
      ...req.body,
      operacion,
      metodoPago: 'PLIN',
      tipoComprobante: req.body.tipo_comprobante,
    });

    await query(
      `INSERT INTO notificaciones
       (tipo, titulo, mensaje, venta_id, leido)
       VALUES ('PAGO', 'Pago Plin por verificar', ?, ?, 0)`,
      [
        `Pedido ${venta.numero_comprobante} por S/ ${Number(
          venta.total
        ).toFixed(2)}. Operación declarada: ${operacion}. Revisa tu cuenta Plin antes de aprobar.`,
        venta.venta_id,
      ]
    );

    return res.status(201).json({
      ...venta,
      estado: 'PENDIENTE_VERIFICACION',
      estado_pago: 'PENDIENTE_VERIFICACION',
      confirmado: false,
      message:
        'Pedido registrado. El pago Plin todavía no está confirmado y será revisado por la empresa.',
    });
  } catch (error) {
    error.statusCode = error.statusCode || 500;
    next(error);
  }
}

async function consultarPagoMP(paymentId) {
  const token = envObligatoria('MP_ACCESS_TOKEN');
  const respuesta = await fetch(`${MP_API}/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok || !data.id) {
    throw new Error(data.message || 'No se pudo consultar el pago en Mercado Pago.');
  }
  return data;
}

async function aplicarPago(payment) {
  await asegurarTabla();
  const ventaId = Number(payment.external_reference || payment.metadata?.venta_id);
  if (!Number.isInteger(ventaId) || ventaId <= 0) return null;

  return transaction(async (conn) => {
    const [ventas] = await conn.query('SELECT * FROM ventas WHERE id=? FOR UPDATE', [ventaId]);
    if (!ventas.length) return null;
    const venta = ventas[0];

    const [mpRows] = await conn.query(
      'SELECT * FROM mercadopago_pagos WHERE venta_id=? FOR UPDATE',
      [ventaId]
    );
    const stockLiberado = mpRows.length
      ? Number(mpRows[0].stock_liberado)
      : 0;

    // DORADA_VALIDACION_PAGO_REAL
    const montoEsperado = Number(venta.total || 0);
    const montoRecibido = Number(payment.transaction_amount || 0);
    const monedaRecibida = String(payment.currency_id || '').toUpperCase();
    const referenciaRecibida = Number(
      payment.external_reference || payment.metadata?.venta_id
    );

    const pagoAprobadoValido =
      payment.status === 'approved' &&
      referenciaRecibida === ventaId &&
      monedaRecibida === 'PEN' &&
      Number.isFinite(montoRecibido) &&
      Math.abs(montoRecibido - montoEsperado) < 0.01;

    await conn.query(
      `INSERT INTO mercadopago_pagos
       (venta_id, preference_id, payment_id, estado_mp, detalle_mp, stock_liberado)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE payment_id=VALUES(payment_id), estado_mp=VALUES(estado_mp), detalle_mp=VALUES(detalle_mp)`,
      [
        ventaId,
        texto(payment.order?.id || payment.preference_id || '', 150) || null,
        String(payment.id),
        texto(payment.status, 50),
        texto(payment.status_detail, 150),
        stockLiberado,
      ]
    );

    if (payment.status === 'approved' && !pagoAprobadoValido) {
      await conn.query(
        "UPDATE ventas SET estado='PAGO_REVISAR' WHERE id=?",
        [ventaId]
      );

      await conn.query(
        "UPDATE pagos SET estado='REVISAR', referencia=? WHERE venta_id=?",
        [String(payment.id), ventaId]
      );

      await conn.query(
        `INSERT INTO notificaciones
         (tipo, titulo, mensaje, venta_id, leido)
         VALUES ('ALERTA', 'Pago recibido con datos diferentes', ?, ?, 0)`,
        [
          `Mercado Pago informó un pago aprobado, pero el monto, la moneda o la referencia no coincide. Esperado: S/ ${montoEsperado.toFixed(
            2
          )}. Recibido: ${monedaRecibida} ${montoRecibido.toFixed(2)}.`,
          ventaId,
        ]
      );

      return {
        venta_id: ventaId,
        estado: 'PAGO_REVISAR',
      };
    }

    if (pagoAprobadoValido) {
      if (stockLiberado === 1) {
        try {
          await volverAReservarStock(conn, ventaId);
          await conn.query('UPDATE mercadopago_pagos SET stock_liberado=0 WHERE venta_id=?', [ventaId]);
        } catch (stockError) {
          await conn.query(
            "UPDATE ventas SET estado='PAGO_APROBADO_REVISAR_STOCK', metodo_pago='MERCADO_PAGO' WHERE id=?",
            [ventaId]
          );
          await conn.query(
            "UPDATE pagos SET estado='CONFIRMADO', referencia=? WHERE venta_id=?",
            [String(payment.id), ventaId]
          );
          await conn.query(
            `INSERT INTO notificaciones(tipo, titulo, mensaje, venta_id, leido)
             VALUES ('ALERTA', 'Pago aprobado sin stock reservado', ?, ?, 0)`,
            [stockError.message, ventaId]
          );
          return { venta_id: ventaId, estado: 'PAGO_APROBADO_REVISAR_STOCK' };
        }
      }

      if (venta.estado !== 'PAGADO') {
        await conn.query(
          "UPDATE ventas SET estado='PAGADO', metodo_pago='MERCADO_PAGO' WHERE id=?",
          [ventaId]
        );
        await conn.query(
          "UPDATE pagos SET estado='CONFIRMADO', referencia=? WHERE venta_id=?",
          [String(payment.id), ventaId]
        );
        await conn.query(
          `INSERT INTO comprobantes(venta_id, tipo, numero, cliente_nombre, cliente_documento, total, estado)
           SELECT v.id, v.tipo_comprobante, v.numero_comprobante, c.nombre, c.documento, v.total, 'EMITIDO'
           FROM ventas v LEFT JOIN clientes c ON c.id=v.cliente_id
           WHERE v.id=? AND NOT EXISTS (SELECT 1 FROM comprobantes co WHERE co.venta_id=v.id)`,
          [ventaId]
        );
        await conn.query(
          `INSERT INTO notificaciones(tipo, titulo, mensaje, venta_id, leido)
           VALUES ('PAGO', 'Pago aprobado por Mercado Pago', ?, ?, 0)`,
          [`Pago ${payment.id} aprobado por S/ ${Number(payment.transaction_amount || venta.total).toFixed(2)}.`, ventaId]
        );
      }
    } else if (['rejected', 'cancelled'].includes(payment.status) && venta.estado !== 'PAGADO') {
      if (stockLiberado === 0) {
        const [detalles] = await conn.query('SELECT producto_id, cantidad FROM detalle_ventas WHERE venta_id=?', [ventaId]);
        for (const d of detalles) {
          const [productos] = await conn.query('SELECT stock FROM productos WHERE id=? FOR UPDATE', [d.producto_id]);
          if (!productos.length) continue;
          const anterior = Number(productos[0].stock);
          const nuevo = anterior + Number(d.cantidad);
          await conn.query('UPDATE productos SET stock=? WHERE id=?', [nuevo, d.producto_id]);
          await conn.query(
            `INSERT INTO historial_stock(producto_id, stock_anterior, stock_nuevo, movimiento, referencia)
             VALUES (?, ?, ?, 'PAGO_NO_APROBADO', ?)`,
            [d.producto_id, anterior, nuevo, `Venta ${ventaId}`]
          );
        }
        await conn.query('UPDATE mercadopago_pagos SET stock_liberado=1 WHERE venta_id=?', [ventaId]);
      }
      await conn.query("UPDATE ventas SET estado='PAGO_RECHAZADO' WHERE id=?", [ventaId]);
      await conn.query("UPDATE pagos SET estado='RECHAZADO', referencia=? WHERE venta_id=?", [String(payment.id), ventaId]);
    } else if (payment.status === 'refunded') {
      await conn.query("UPDATE ventas SET estado='REEMBOLSADO' WHERE id=?", [ventaId]);
      await conn.query("UPDATE pagos SET estado='REEMBOLSADO', referencia=? WHERE venta_id=?", [String(payment.id), ventaId]);
    } else {
      await conn.query("UPDATE pagos SET estado='PENDIENTE', referencia=? WHERE venta_id=?", [String(payment.id), ventaId]);
    }

    const [actualizadas] = await conn.query(
      `SELECT v.id AS venta_id, v.estado, v.numero_comprobante, v.total,
              p.estado AS estado_pago, mp.estado_mp, mp.payment_id
       FROM ventas v
       LEFT JOIN pagos p ON p.venta_id=v.id
       LEFT JOIN mercadopago_pagos mp ON mp.venta_id=v.id
       WHERE v.id=? LIMIT 1`,
      [ventaId]
    );
    return actualizadas[0] || null;
  });
}

async function validarFirmaWebhook(req) {
  const secret = String(process.env.MP_WEBHOOK_SECRET || '').trim();
  if (!secret) return true;
  const xSignature = req.headers['x-signature'];
  const xRequestId = req.headers['x-request-id'];
  const dataId = req.query['data.id'] || req.body?.data?.id;
  if (!xSignature || !xRequestId || !dataId) return false;
  const { WebhookSignatureValidator } = await import('mercadopago');
  WebhookSignatureValidator.validate({ xSignature, xRequestId, dataId: String(dataId), secret });
  return true;
}

async function webhook(req, res) {
  try {
    const firmaValida = await validarFirmaWebhook(req);
    if (!firmaValida) return res.sendStatus(401);

    const tipo = req.body?.type || req.query.type;
    const paymentId = req.body?.data?.id || req.query['data.id'] || req.query.id;
    if (tipo && tipo !== 'payment') return res.sendStatus(200);
    if (!paymentId) return res.sendStatus(200);

    const payment = await consultarPagoMP(paymentId);
    await aplicarPago(payment);
    return res.sendStatus(200);
  } catch (error) {
    console.error('Webhook Mercado Pago:', error.message);
    return res.sendStatus(error.name === 'InvalidWebhookSignatureError' ? 401 : 500);
  }
}

async function estadoPago(req, res, next) {
  try {
    await asegurarTabla();
    const ventaId = Number(req.params.ventaId);
    const paymentId = texto(req.query.payment_id, 150);
    if (!Number.isInteger(ventaId) || ventaId <= 0) {
      return res.status(400).json({ error: 'Venta invÃ¡lida.' });
    }

    if (paymentId) {
      const payment = await consultarPagoMP(paymentId);
      const externalReference = Number(payment.external_reference || payment.metadata?.venta_id);
      if (externalReference === ventaId) await aplicarPago(payment);
    }

    const rows = await query(
      `SELECT v.id AS venta_id, v.estado, v.numero_comprobante, v.total,
              v.metodo_pago, p.estado AS estado_pago,
              mp.estado_mp, mp.detalle_mp, mp.payment_id
       FROM ventas v
       LEFT JOIN pagos p ON p.venta_id=v.id
       LEFT JOIN mercadopago_pagos mp ON mp.venta_id=v.id
       WHERE v.id=? LIMIT 1`,
      [ventaId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Pedido no encontrado.' });
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
}

async function limpiarReservasVencidas() {
  try {
    await asegurarTabla();
    const vencidas = await query(
      `SELECT mp.venta_id
       FROM mercadopago_pagos mp
       INNER JOIN ventas v ON v.id=mp.venta_id
       WHERE v.estado='PENDIENTE_PAGO'
         AND mp.stock_liberado=0
         AND mp.creado_en < DATE_SUB(NOW(), INTERVAL 45 MINUTE)`,
      []
    );
    for (const row of vencidas) {
      await liberarStock(row.venta_id, 'RESERVA_VENCIDA');
      await query("UPDATE ventas SET estado='PAGO_VENCIDO' WHERE id=? AND estado='PENDIENTE_PAGO'", [row.venta_id]);
      await query("UPDATE pagos SET estado='VENCIDO' WHERE venta_id=? AND estado='PENDIENTE'", [row.venta_id]);
    }
  } catch (error) {
    console.error('Limpieza de reservas Mercado Pago:', error.message);
  }
}

function iniciarLimpiezaReservas() {
  if (limpiezaIniciada) return;
  limpiezaIniciada = true;
  setTimeout(limpiarReservasVencidas, 15000);
  const timer = setInterval(limpiarReservasVencidas, 5 * 60 * 1000);
  if (typeof timer.unref === 'function') timer.unref();
}

iniciarLimpiezaReservas();

module.exports = {
  crearPreferencia,
  crearPedidoManual,
  webhook,
  estadoPago,
};
