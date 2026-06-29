// Controlador modular de PartGo: stock
// Este archivo separa responsabilidades para una arquitectura mantenible.
// Las rutas principales usan controladores específicos y CRUD genérico cuando corresponde.
const crud = require('./crud.controller');

module.exports = {
  list: crud.list('historial_stock'),
  getOne: crud.getOne('historial_stock'),
  create: crud.create('historial_stock'),
  update: crud.update('historial_stock'),
  remove: crud.remove('historial_stock')
};
