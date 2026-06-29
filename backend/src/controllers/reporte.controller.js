// Controlador modular de PartGo: reporte
// Este archivo separa responsabilidades para una arquitectura mantenible.
// Las rutas principales usan controladores específicos y CRUD genérico cuando corresponde.
const crud = require('./crud.controller');

module.exports = {
  list: crud.list('reportes'),
  getOne: crud.getOne('reportes'),
  create: crud.create('reportes'),
  update: crud.update('reportes'),
  remove: crud.remove('reportes')
};
