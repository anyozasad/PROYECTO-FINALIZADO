// Controlador modular de PartGo: carrito
// Este archivo separa responsabilidades para una arquitectura mantenible.
// Las rutas principales usan controladores específicos y CRUD genérico cuando corresponde.
const crud = require('./crud.controller');

module.exports = {
  list: crud.list('carrito'),
  getOne: crud.getOne('carrito'),
  create: crud.create('carrito'),
  update: crud.update('carrito'),
  remove: crud.remove('carrito')
};
