// Controlador modular de PartGo: notificacion
// Este archivo separa responsabilidades para una arquitectura mantenible.
// Las rutas principales usan controladores específicos y CRUD genérico cuando corresponde.
const crud = require('./crud.controller');

module.exports = {
  list: crud.list('notificaciones'),
  getOne: crud.getOne('notificaciones'),
  create: crud.create('notificaciones'),
  update: crud.update('notificaciones'),
  remove: crud.remove('notificaciones')
};
