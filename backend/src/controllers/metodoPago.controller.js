// Controlador modular de PartGo: metodoPago
// Este archivo separa responsabilidades para una arquitectura mantenible.
// Las rutas principales usan controladores específicos y CRUD genérico cuando corresponde.
const crud = require('./crud.controller');

module.exports = {
  list: crud.list('metodos_pago'),
  getOne: crud.getOne('metodos_pago'),
  create: crud.create('metodos_pago'),
  update: crud.update('metodos_pago'),
  remove: crud.remove('metodos_pago')
};
