// Controlador modular de PartGo: reclamo
// Este archivo separa responsabilidades para una arquitectura mantenible.
// Las rutas principales usan controladores específicos y CRUD genérico cuando corresponde.
const crud = require('./crud.controller');

module.exports = {
  list: crud.list('reclamos'),
  getOne: crud.getOne('reclamos'),
  create: crud.create('reclamos'),
  update: crud.update('reclamos'),
  remove: crud.remove('reclamos')
};
