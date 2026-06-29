function publicUser(usuario, db) {
  const rol = db.roles.find(r => Number(r.id) === Number(usuario.rol_id));
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    rol_id: usuario.rol_id,
    rol: rol?.nombre || 'Sin rol',
    estado: usuario.estado
  };
}

function productView(producto, db) {
  const categoria = db.categorias.find(c => Number(c.id) === Number(producto.categoria_id));
  return {
    ...producto,
    precio: Number(producto.precio),
    stock: Number(producto.stock),
    categoria: categoria?.nombre || 'Sin categoría'
  };
}

function saleView(venta, db) {
  const cliente = db.clientes.find(c => Number(c.id) === Number(venta.cliente_id));
  const usuario = db.usuarios.find(u => Number(u.id) === Number(venta.usuario_id));
  return {
    ...venta,
    cliente: cliente?.nombre || 'Cliente eliminado',
    usuario: usuario?.nombre || 'Usuario eliminado',
    total: Number(venta.total).toFixed(2)
  };
}

module.exports = { publicUser, productView, saleView };
