const { query } = require('../config/db');

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
      FROM ventas v
      LEFT JOIN clientes c ON c.id = v.cliente_id
      ORDER BY v.id DESC
      LIMIT 6
    `);

    const stockBajo = await query(`
      SELECT p.id, p.nombre, p.stock, p.stock_minimo, p.imagen, c.nombre AS categoria
      FROM productos p
      LEFT JOIN categorias c ON c.id = p.categoria_id
      WHERE p.estado = 1 AND p.stock <= p.stock_minimo
      ORDER BY p.stock ASC
      LIMIT 8
    `);

    const productosVendidos = await query(`
      SELECT producto_nombre AS nombre, SUM(cantidad) AS cantidad_vendida, SUM(subtotal) AS total_generado
      FROM detalle_ventas
      GROUP BY producto_nombre
      ORDER BY cantidad_vendida DESC
      LIMIT 6
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
      FROM ventas v
      LEFT JOIN clientes c ON c.id = v.cliente_id
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
      FROM ventas v
      LEFT JOIN clientes c ON c.id = v.cliente_id
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
    const { estado } = req.body;
    await query('UPDATE ventas SET estado = ? WHERE id = ?', [estado, req.params.id]);
    await query(
      `INSERT INTO auditoria(usuario_id, accion, tabla_afectada, registro_id, descripcion)
       VALUES (?, 'CAMBIO_ESTADO_PEDIDO', 'ventas', ?, ?)`,
      [req.user.id, req.params.id, `Pedido actualizado a ${estado}`]
    );
    res.json({ ok: true });
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
      FROM ventas GROUP BY DATE(fecha) ORDER BY fecha DESC LIMIT 10
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

module.exports = { dashboard, pedidos, detallePedido, cambiarEstadoPedido, notificaciones, marcarNotificacion, reportes };
