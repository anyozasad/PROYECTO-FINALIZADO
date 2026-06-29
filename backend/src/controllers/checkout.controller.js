const { query, transaction } = require('../config/db');

function comprobanteNumero(id, tipo) {
  const serie = tipo === 'FACTURA' ? 'F001' : 'B001';
  return `${serie}-${String(id).padStart(8, '0')}`;
}

async function realizarCompra(req, res, next) {
  try {
    const usuarioId = req.user?.id;
    const { cliente, items, metodo_pago, tipo_comprobante, direccion_entrega } = req.body;

    if (!items || !items.length) return res.status(400).json({ error: 'El carrito está vacío.' });
    if (!cliente?.nombre || !cliente?.documento || !cliente?.telefono || !cliente?.direccion) {
      return res.status(400).json({ error: 'Completa los datos del cliente.' });
    }

    const resultado = await transaction(async (conn) => {
      const [clienteRows] = await conn.query(
        'SELECT * FROM clientes WHERE documento = ? OR usuario_id = ? LIMIT 1',
        [cliente.documento, usuarioId || 0]
      );

      let clienteId;
      if (clienteRows.length) {
        clienteId = clienteRows[0].id;
        await conn.query(
          `UPDATE clientes SET nombre=?, telefono=?, email=?, direccion=? WHERE id=?`,
          [cliente.nombre, cliente.telefono, cliente.email || '', cliente.direccion, clienteId]
        );
      } else {
        const [nuevoCliente] = await conn.query(
          `INSERT INTO clientes(usuario_id, nombre, documento, telefono, email, direccion, estado)
           VALUES (?, ?, ?, ?, ?, ?, 1)`,
          [usuarioId || null, cliente.nombre, cliente.documento, cliente.telefono, cliente.email || '', cliente.direccion]
        );
        clienteId = nuevoCliente.insertId;
      }

      let total = 0;
      const detallePreparado = [];

      for (const item of items) {
        const [productos] = await conn.query('SELECT * FROM productos WHERE id = ? AND estado = 1 FOR UPDATE', [item.producto_id]);
        if (!productos.length) throw new Error('Producto no encontrado.');

        const producto = productos[0];
        const cantidad = Number(item.cantidad || 1);
        if (cantidad <= 0) throw new Error('Cantidad inválida.');
        if (Number(producto.stock) < cantidad) throw new Error(`Stock insuficiente para ${producto.nombre}.`);

        const precio = Number(producto.en_oferta && producto.precio_oferta > 0 ? producto.precio_oferta : producto.precio);
        const subtotal = precio * cantidad;
        total += subtotal;

        await conn.query('UPDATE productos SET stock = stock - ? WHERE id = ?', [cantidad, producto.id]);
        await conn.query(
          `INSERT INTO historial_stock(producto_id, stock_anterior, stock_nuevo, movimiento, referencia)
           VALUES (?, ?, ?, 'VENTA', ?)`,
          [producto.id, Number(producto.stock), Number(producto.stock) - cantidad, `Compra cliente ${cliente.nombre}`]
        );

        detallePreparado.push({
          producto_id: producto.id,
          producto_nombre: producto.nombre,
          producto_imagen: producto.imagen,
          cantidad,
          precio_unitario: precio,
          subtotal
        });
      }

      const [ventaResult] = await conn.query(
        `INSERT INTO ventas(cliente_id, usuario_id, total, estado, metodo_pago, tipo_comprobante, direccion_entrega)
         VALUES (?, ?, ?, 'PAGADO', ?, ?, ?)`,
        [clienteId, usuarioId || null, total, metodo_pago || 'EFECTIVO', tipo_comprobante || 'BOLETA', direccion_entrega || cliente.direccion]
      );

      const numero = comprobanteNumero(ventaResult.insertId, tipo_comprobante || 'BOLETA');
      await conn.query('UPDATE ventas SET numero_comprobante=? WHERE id=?', [numero, ventaResult.insertId]);

      for (const d of detallePreparado) {
        await conn.query(
          `INSERT INTO detalle_ventas(venta_id, producto_id, producto_nombre, producto_imagen, cantidad, precio_unitario, subtotal)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [ventaResult.insertId, d.producto_id, d.producto_nombre, d.producto_imagen, d.cantidad, d.precio_unitario, d.subtotal]
        );
      }

      const [pagoResult] = await conn.query(
        `INSERT INTO pagos(venta_id, metodo_pago, monto, estado, referencia)
         VALUES (?, ?, ?, 'CONFIRMADO', ?)`,
        [ventaResult.insertId, metodo_pago || 'EFECTIVO', total, `PAGO-${Date.now()}`]
      );

      await conn.query(
        `INSERT INTO comprobantes(venta_id, tipo, numero, cliente_nombre, cliente_documento, total, estado)
         VALUES (?, ?, ?, ?, ?, ?, 'EMITIDO')`,
        [ventaResult.insertId, tipo_comprobante || 'BOLETA', numero, cliente.nombre, cliente.documento, total]
      );

      await conn.query(
        `INSERT INTO notificaciones(tipo, titulo, mensaje, venta_id, leido)
         VALUES ('VENTA', 'Nuevo pedido recibido', ?, ?, 0)`,
        [`El cliente ${cliente.nombre} realizó una compra por S/ ${total.toFixed(2)}.`, ventaResult.insertId]
      );

      return { venta_id: ventaResult.insertId, pago_id: pagoResult.insertId, cliente_id: clienteId, numero, total, detalle: detallePreparado };
    });

    res.status(201).json({
      message: 'Compra registrada correctamente.',
      venta_id: resultado.venta_id,
      numero_comprobante: resultado.numero,
      total: resultado.total,
      detalle: resultado.detalle
    });
  } catch (error) {
    next(error);
  }
}

async function misCompras(req, res, next) {
  try {
    const rows = await query(
      `SELECT v.*, c.nombre AS cliente, c.documento
       FROM ventas v
       LEFT JOIN clientes c ON c.id = v.cliente_id
       WHERE v.usuario_id = ?
       ORDER BY v.id DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
}

async function detalleComprobante(req, res, next) {
  try {
    const ventas = await query(
      `SELECT v.*, c.nombre AS cliente, c.documento, c.direccion, c.telefono, c.email
       FROM ventas v
       LEFT JOIN clientes c ON c.id = v.cliente_id
       WHERE v.id = ?`,
      [req.params.id]
    );
    if (!ventas.length) return res.status(404).json({ error: 'Venta no encontrada.' });
    const detalle = await query('SELECT * FROM detalle_ventas WHERE venta_id = ?', [req.params.id]);
    res.json({ ...ventas[0], detalle });
  } catch (error) {
    next(error);
  }
}

module.exports = { realizarCompra, misCompras, detalleComprobante };
