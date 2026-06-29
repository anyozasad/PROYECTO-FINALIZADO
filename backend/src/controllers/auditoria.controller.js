// Controlador modular de PartGo: auditoria
// Este archivo separa responsabilidades para una arquitectura mantenible.
// Las rutas principales usan controladores específicos y CRUD genérico cuando corresponde.
const crud = require('./crud.controller');

module.exports = {
  list: crud.list('auditoria'),
  getOne: crud.getOne('auditoria'),
  create: crud.create('auditoria'),
  update: crud.update('auditoria'),
  remove: crud.remove('auditoria')
};
