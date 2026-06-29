// Controlador modular de PartGo: comentario
// Este archivo separa responsabilidades para una arquitectura mantenible.
// Las rutas principales usan controladores específicos y CRUD genérico cuando corresponde.
const crud = require('./crud.controller');

module.exports = {
  list: crud.list('comentarios'),
  getOne: crud.getOne('comentarios'),
  create: crud.create('comentarios'),
  update: crud.update('comentarios'),
  remove: crud.remove('comentarios')
};
