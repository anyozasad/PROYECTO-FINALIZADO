// Controlador modular de PartGo: detalleVenta
// Este archivo separa responsabilidades para una arquitectura mantenible.
// Las rutas principales usan controladores específicos y CRUD genérico cuando corresponde.
const crud = require('./crud.controller');

module.exports = {
  list: crud.list('detalle_ventas'),
  getOne: crud.getOne('detalle_ventas'),
  create: crud.create('detalle_ventas'),
  update: crud.update('detalle_ventas'),
  remove: crud.remove('detalle_ventas')
};
