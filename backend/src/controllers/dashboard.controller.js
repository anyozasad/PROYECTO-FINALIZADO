// Controlador modular de PartGo: dashboard
// Este archivo separa responsabilidades para una arquitectura mantenible.
// Las rutas principales usan controladores específicos y CRUD genérico cuando corresponde.
const crud = require('./crud.controller');

module.exports = {
  list: crud.list('dashboard'),
  getOne: crud.getOne('dashboard'),
  create: crud.create('dashboard'),
  update: crud.update('dashboard'),
  remove: crud.remove('dashboard')
};
