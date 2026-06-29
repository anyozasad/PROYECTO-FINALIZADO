// Controlador modular de PartGo: pedido
// Este archivo separa responsabilidades para una arquitectura mantenible.
// Las rutas principales usan controladores específicos y CRUD genérico cuando corresponde.
const crud = require('./crud.controller');

module.exports = {
  list: crud.list('ventas'),
  getOne: crud.getOne('ventas'),
  create: crud.create('ventas'),
  update: crud.update('ventas'),
  remove: crud.remove('ventas')
};
