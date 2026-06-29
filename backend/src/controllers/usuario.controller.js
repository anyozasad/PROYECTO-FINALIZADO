// Controlador modular de PartGo: usuario
// Este archivo separa responsabilidades para una arquitectura mantenible.
// Las rutas principales usan controladores específicos y CRUD genérico cuando corresponde.
const crud = require('./crud.controller');

module.exports = {
  list: crud.list('usuarios'),
  getOne: crud.getOne('usuarios'),
  create: crud.create('usuarios'),
  update: crud.update('usuarios'),
  remove: crud.remove('usuarios')
};
