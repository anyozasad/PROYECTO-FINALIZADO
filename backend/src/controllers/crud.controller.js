const { query } = require('../config/db');

const tables = {
  roles: 'roles', usuarios: 'usuarios', categorias: 'categorias', clientes: 'clientes',
  empresa: 'empresa', proveedores: 'proveedores', compras: 'compras', promociones: 'promociones',
  marcas: 'marcas', ofertas: 'ofertas', metodos_pago: 'metodos_pago', estados_pedido: 'estados_pedido',
  comentarios: 'comentarios', favoritos: 'favoritos', reclamos: 'reclamos', historial_stock: 'historial_stock',
  auditoria: 'auditoria', banners: 'banners', direcciones_cliente: 'direcciones_cliente', ventas: 'ventas', detalle_ventas: 'detalle_ventas', pagos: 'pagos', carrito: 'carrito', detalle_carrito: 'detalle_carrito'
};

function tableOrFail(resource) {
  const table = tables[resource];
  if (!table) throw new Error('Recurso no permitido.');
  return table;
}

function list(resource) {
  return async (_req, res, next) => {
    try {
      const table = tableOrFail(resource);
      const rows = await query(`SELECT * FROM ${table} ORDER BY id DESC`);
      res.json(rows);
    } catch (error) { next(error); }
  };
}

function getOne(resource) {
  return async (req, res, next) => {
    try {
      const table = tableOrFail(resource);
      const rows = await query(`SELECT * FROM ${table} WHERE id = ?`, [req.params.id]);
      if (!rows.length) return res.status(404).json({ error: 'Registro no encontrado.' });
      res.json(rows[0]);
    } catch (error) { next(error); }
  };
}

function create(resource) {
  return async (req, res, next) => {
    try {
      const table = tableOrFail(resource);
      const columns = Object.keys(req.body);
      const values = Object.values(req.body);
      const placeholders = columns.map(() => '?').join(',');
      const result = await query(`INSERT INTO ${table}(${columns.join(',')}) VALUES (${placeholders})`, values);
      const rows = await query(`SELECT * FROM ${table} WHERE id = ?`, [result.insertId]);
      res.status(201).json(rows[0]);
    } catch (error) { next(error); }
  };
}

function update(resource) {
  return async (req, res, next) => {
    try {
      const table = tableOrFail(resource);
      const columns = Object.keys(req.body);
      const values = Object.values(req.body);
      const set = columns.map(c => `${c}=?`).join(',');
      await query(`UPDATE ${table} SET ${set} WHERE id=?`, [...values, req.params.id]);
      const rows = await query(`SELECT * FROM ${table} WHERE id = ?`, [req.params.id]);
      res.json(rows[0]);
    } catch (error) { next(error); }
  };
}

function remove(resource) {
  return async (req, res, next) => {
    try {
      const table = tableOrFail(resource);
      await query(`DELETE FROM ${table} WHERE id=?`, [req.params.id]);
      res.json({ ok: true });
    } catch (error) { next(error); }
  };
}

module.exports = { list, getOne, create, update, remove };
