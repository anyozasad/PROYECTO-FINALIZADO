const { query } = require('../config/db');

async function resolverCategoriaId(body = {}) {
  if (body.categoria_id) return body.categoria_id;
  const nombreCategoria = String(body.categoria || body.categoria_nombre || '').trim();
  if (!nombreCategoria) return null;
  const existente = await query('SELECT id FROM categorias WHERE LOWER(nombre)=LOWER(?) LIMIT 1', [nombreCategoria]);
  if (existente.length) return existente[0].id;
  const creado = await query('INSERT INTO categorias(nombre, descripcion, estado) VALUES (?, ?, 1)', [nombreCategoria, `Categoría ${nombreCategoria}`]);
  return creado.insertId;
}

async function productoConCategoria(id) {
  const rows = await query(
    `SELECT p.*, c.nombre AS categoria
     FROM productos p
     LEFT JOIN categorias c ON c.id = p.categoria_id
     WHERE p.id = ?`,
    [id]
  );
  return rows[0];
}

async function listar(req, res, next) {
  try {
    const { categoria, q, oferta, nuevo, marca, precioMax, stock } = req.query;
    const params = [];
    let where = 'WHERE p.estado = 1';

    if (categoria) {
      where += ' AND p.categoria_id = ?';
      params.push(categoria);
    }

    if (q) {
      where += ' AND (p.nombre LIKE ? OR p.marca LIKE ? OR p.descripcion LIKE ?)';
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }

    if (oferta === '1') where += ' AND p.en_oferta = 1';
    if (nuevo === '1') where += ' AND p.es_nuevo = 1';
    if (marca) { where += ' AND p.marca = ?'; params.push(marca); }
    if (precioMax) { where += ' AND p.precio <= ?'; params.push(Number(precioMax)); }
    if (stock === '1') where += ' AND p.stock > 0';

    const productos = await query(
      `SELECT p.*, c.nombre AS categoria
       FROM productos p
       LEFT JOIN categorias c ON c.id = p.categoria_id
       ${where}
       ORDER BY p.id DESC`,
      params
    );

    res.json(productos);
  } catch (error) {
    next(error);
  }
}

async function obtener(req, res, next) {
  try {
    const rows = await query(
      `SELECT p.*, c.nombre AS categoria
       FROM productos p
       LEFT JOIN categorias c ON c.id = p.categoria_id
       WHERE p.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Producto no encontrado.' });
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
}

async function crear(req, res, next) {
  try {
    const b = req.body;
    const categoriaId = await resolverCategoriaId(b);
    const result = await query(
      `INSERT INTO productos(nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, imagen, en_oferta, es_nuevo, destacado, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        b.nombre,
        b.descripcion || '',
        categoriaId,
        b.marca || '',
        b.modelo || '',
        Number(b.precio || 0),
        Number(b.precio_oferta || 0),
        Number(b.stock || 0),
        b.imagen || '',
        Number(b.en_oferta || 0),
        Number(b.es_nuevo || 0),
        Number(b.destacado || 0)
      ]
    );
    const creado = await productoConCategoria(result.insertId);
    res.status(201).json(creado);
  } catch (error) {
    next(error);
  }
}

async function actualizar(req, res, next) {
  try {
    const b = req.body;
    const categoriaId = await resolverCategoriaId(b);
    await query(
      `UPDATE productos SET
       nombre=?, descripcion=?, categoria_id=?, marca=?, modelo=?, precio=?, precio_oferta=?, stock=?, imagen=?, en_oferta=?, es_nuevo=?, destacado=?, estado=?
       WHERE id=?`,
      [
        b.nombre,
        b.descripcion || '',
        categoriaId,
        b.marca || '',
        b.modelo || '',
        Number(b.precio || 0),
        Number(b.precio_oferta || 0),
        Number(b.stock || 0),
        b.imagen || '',
        Number(b.en_oferta || 0),
        Number(b.es_nuevo || 0),
        Number(b.destacado || 0),
        Number(b.estado ?? 1),
        req.params.id
      ]
    );
    const actualizado = await productoConCategoria(req.params.id);
    res.json(actualizado);
  } catch (error) {
    next(error);
  }
}

async function eliminar(req, res, next) {
  try {
    await query('UPDATE productos SET estado = 0 WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
}

async function categorias(_req, res, next) {
  try {
    const rows = await query('SELECT * FROM categorias WHERE estado = 1 ORDER BY nombre');
    res.json(rows);
  } catch (error) {
    next(error);
  }
}

module.exports = { listar, obtener, crear, actualizar, eliminar, categorias };
