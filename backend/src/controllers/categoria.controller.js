// Controlador modular de PartGo: categoria
// Este archivo separa responsabilidades para una arquitectura mantenible.
// Las rutas principales usan controladores específicos y CRUD genérico cuando corresponde.
const crud = require('./crud.controller');

module.exports = {
  list: crud.list('categorias'),
  getOne: crud.getOne('categorias'),
  create: crud.create('categorias'),
  update: crud.update('categorias'),
  remove: crud.remove('categorias')
};
