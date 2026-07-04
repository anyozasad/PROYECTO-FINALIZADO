const { query, transaction } = require('../config/db');

async function dashboard(_req, res, next) {
  try {
    const [totales] = await query(`
      SELECT
        (SELECT COUNT(*) FROM productos WHERE estado = 1) AS total_productos,
        (SELECT COUNT(*) FROM clientes WHERE estado = 1) AS total_clientes,
        (SELECT COUNT(*) FROM ventas) AS total_ventas,
        (SELECT COALESCE(SUM(total),0) FROM ventas WHERE estado IN ('PAGADO','REGISTRADA')) AS ingresos,
        (SELECT COUNT(*) FROM productos WHERE estado = 1 AND stock <= stock_minimo) AS stock_bajo,
        (SELECT COUNT(*) FROM notificaciones WHERE leido = 0) AS notificaciones
    `);
    const ultimasVentas = await query(`
      SELECT v.id, v.numero_comprobante, v.total, v.estado, v.metodo_pago, v.fecha,
             c.nombre AS cliente, c.documento
      FROM ventas v LEFT JOIN clientes c ON c.id = v.cliente_id
      ORDER BY v.id DESC LIMIT 6
    `);
    const stockBajo = await query(`
      SELECT p.id, p.nombre, p.stock, p.stock_minimo, p.imagen, c.nombre AS categoria
      FROM productos p LEFT JOIN categorias c ON c.id = p.categoria_id
      WHERE p.estado = 1 AND p.stock <= p.stock_minimo
      ORDER BY p.stock ASC LIMIT 8
    `);
    const productosVendidos = await query(`
      SELECT producto_nombre AS nombre, SUM(cantidad) AS cantidad_vendida, SUM(subtotal) AS total_generado
      FROM detalle_ventas GROUP BY producto_nombre
      ORDER BY cantidad_vendida DESC LIMIT 6
    `);
    res.json({ ...totales, ultimasVentas, stockBajo, productosVendidos });
  } catch (error) {
    next(error);
  }
}

async function pedidos(_req, res, next) {
  try {
    const rows = await query(`
      SELECT v.*, c.nombre AS cliente, c.documento, c.telefono, c.email, c.direccion
      FROM ventas v LEFT JOIN clientes c ON c.id = v.cliente_id
      ORDER BY v.id DESC
    `);
    res.json(rows);
  } catch (error) {
    next(error);
  }
}

async function detallePedido(req, res, next) {
  try {
    const pedido = await query(`
      SELECT v.*, c.nombre AS cliente, c.documento, c.telefono, c.email, c.direccion
      FROM ventas v LEFT JOIN clientes c ON c.id = v.cliente_id
      WHERE v.id = ?
    `, [req.params.id]);
    if (!pedido.length) return res.status(404).json({ error: 'Pedido no encontrado.' });
    const detalle = await query('SELECT * FROM detalle_ventas WHERE venta_id = ?', [req.params.id]);
    const pagos = await query('SELECT * FROM pagos WHERE venta_id = ?', [req.params.id]);
    const comprobantes = await query('SELECT * FROM comprobantes WHERE venta_id = ?', [req.params.id]);
    res.json({ ...pedido[0], detalle, pagos, comprobantes });
  } catch (error) {
    next(error);
  }
}

async function cambiarEstadoPedido(req, res, next) {
  try {
    const estado = String(req.body.estado || '').trim().toUpperCase();
    const permitidos = [
      'PENDIENTE', 'PENDIENTE_PAGO', 'PENDIENTE_VERIFICACION', 'PENDIENTE_ENTREGA',
      'PAGADO', 'PREPARANDO', 'ENVIADO', 'ENTREGADO', 'ANULADO', 'CANCELADO',
      'PAGO_RECHAZADO', 'PAGO_VENCIDO', 'REEMBOLSADO'
    ];
    if (!permitidos.includes(estado)) {
      return res.status(400).json({ error: 'Estado de pedido invÃ¡lido.' });
    }

    await transaction(async (conn) => {
      const [ventas] = await conn.query(
        `SELECT v.*, c.nombre AS cliente_nombre, c.documento AS cliente_documento
         FROM ventas v LEFT JOIN clientes c ON c.id=v.cliente_id
         WHERE v.id=? FOR UPDATE`,
        [req.params.id]
      );
      if (!ventas.length) throw Object.assign(new Error('Pedido no encontrado.'), { statusCode: 404 });
      const venta = ventas[0];

      if (['ANULADO', 'CANCELADO'].includes(estado) && venta.estado !== 'PAGADO') {
        const [yaLiberado] = await conn.query(
          `SELECT id FROM auditoria
           WHERE tabla_afectada='ventas' AND registro_id=? AND accion='LIBERAR_STOCK_PEDIDO'
           LIMIT 1`,
          [req.params.id]
        );
        if (!yaLiberado.length) {
          const [detalles] = await conn.query(
            'SELECT producto_id, cantidad FROM detalle_ventas WHERE venta_id=?',
            [req.params.id]
          );
          for (const d of detalles) {
            const [productos] = await conn.query('SELECT stock FROM productos WHERE id=? FOR UPDATE', [d.producto_id]);
            if (!productos.length) continue;
            const anterior = Number(productos[0].stock);
            const nuevo = anterior + Number(d.cantidad);
            await conn.query('UPDATE productos SET stock=? WHERE id=?', [nuevo, d.producto_id]);
            await conn.query(
              `INSERT INTO historial_stock(producto_id, stock_anterior, stock_nuevo, movimiento, referencia)
               VALUES (?, ?, ?, 'LIBERACION_PEDIDO', ?)`,
              [d.producto_id, anterior, nuevo, `Pedido ${req.params.id} ${estado}`]
            );
          }
          await conn.query(
            `INSERT INTO auditoria(usuario_id, accion, tabla_afectada, registro_id, descripcion)
             VALUES (?, 'LIBERAR_STOCK_PEDIDO', 'ventas', ?, ?)`,
            [req.user.id, req.params.id, `Stock liberado por pedido ${estado}`]
          );
        }
        await conn.query("UPDATE pagos SET estado='CANCELADO' WHERE venta_id=? AND estado='PENDIENTE'", [req.params.id]);
      }

      await conn.query('UPDATE ventas SET estado = ? WHERE id = ?', [estado, req.params.id]);

      if (estado === 'PAGADO') {
        await conn.query(
          "UPDATE pagos SET estado='CONFIRMADO' WHERE venta_id=? AND estado<>'CONFIRMADO'",
          [req.params.id]
        );
        await conn.query(
          `INSERT INTO comprobantes(venta_id, tipo, numero, cliente_nombre, cliente_documento, total, estado)
           SELECT v.id, v.tipo_comprobante, v.numero_comprobante, c.nombre, c.documento, v.total, 'EMITIDO'
           FROM ventas v LEFT JOIN clientes c ON c.id=v.cliente_id
           WHERE v.id=? AND NOT EXISTS (SELECT 1 FROM comprobantes co WHERE co.venta_id=v.id)`,
          [req.params.id]
        );
        await conn.query(
          `INSERT INTO notificaciones(tipo, titulo, mensaje, venta_id, leido)
           VALUES ('PAGO', 'Pago manual verificado', ?, ?, 0)`,
          [`El pedido ${venta.numero_comprobante} fue marcado como pagado.`, req.params.id]
        );
      }

      await conn.query(
        `INSERT INTO auditoria(usuario_id, accion, tabla_afectada, registro_id, descripcion)
         VALUES (?, 'CAMBIO_ESTADO_PEDIDO', 'ventas', ?, ?)`,
        [req.user.id, req.params.id, `Pedido actualizado a ${estado}`]
      );
    });

    res.json({ ok: true, estado });
  } catch (error) {
    next(error);
  }
}

async function notificaciones(_req, res, next) {
  try {
    const rows = await query('SELECT * FROM notificaciones ORDER BY id DESC LIMIT 50');
    res.json(rows);
  } catch (error) {
    next(error);
  }
}

async function marcarNotificacion(req, res, next) {
  try {
    await query('UPDATE notificaciones SET leido = 1 WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
}

async function reportes(_req, res, next) {
  try {
    const ventasPorMetodo = await query(`
      SELECT metodo_pago, COUNT(*) AS cantidad, SUM(total) AS total
      FROM ventas GROUP BY metodo_pago
    `);
    const ventasPorDia = await query(`
      SELECT DATE(fecha) AS fecha, COUNT(*) AS cantidad, SUM(total) AS total
      FROM ventas GROUP BY DATE(fecha) ORDER BY DATE(fecha) DESC LIMIT 10
    `);
    const clientesTop = await query(`
      SELECT c.nombre, COUNT(v.id) AS compras, SUM(v.total) AS total
      FROM ventas v INNER JOIN clientes c ON c.id = v.cliente_id
      GROUP BY c.id, c.nombre ORDER BY total DESC LIMIT 5
    `);
    res.json({ ventasPorMetodo, ventasPorDia, clientesTop });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  dashboard,
  pedidos,
  detallePedido,
  cambiarEstadoPedido,
  notificaciones,
  marcarNotificacion,
  reportes,
};