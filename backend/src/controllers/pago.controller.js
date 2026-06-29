// Controlador modular de PartGo: pago
// Este archivo separa responsabilidades para una arquitectura mantenible.
// Las rutas principales usan controladores específicos y CRUD genérico cuando corresponde.
const crud = require('./crud.controller');

module.exports = {
  list: crud.list('pagos'),
  getOne: crud.getOne('pagos'),
  create: crud.create('pagos'),
  update: crud.update('pagos'),
  remove: crud.remove('pagos')
};
