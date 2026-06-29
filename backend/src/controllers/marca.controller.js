// Controlador modular de PartGo: marca
// Este archivo separa responsabilidades para una arquitectura mantenible.
// Las rutas principales usan controladores específicos y CRUD genérico cuando corresponde.
const crud = require('./crud.controller');

module.exports = {
  list: crud.list('marcas'),
  getOne: crud.getOne('marcas'),
  create: crud.create('marcas'),
  update: crud.update('marcas'),
  remove: crud.remove('marcas')
};
