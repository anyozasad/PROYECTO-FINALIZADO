// Controlador modular de PartGo: proveedor
// Este archivo separa responsabilidades para una arquitectura mantenible.
// Las rutas principales usan controladores específicos y CRUD genérico cuando corresponde.
const crud = require('./crud.controller');

module.exports = {
  list: crud.list('proveedores'),
  getOne: crud.getOne('proveedores'),
  create: crud.create('proveedores'),
  update: crud.update('proveedores'),
  remove: crud.remove('proveedores')
};
