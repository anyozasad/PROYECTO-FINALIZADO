// Controlador modular de PartGo: cliente
// Este archivo separa responsabilidades para una arquitectura mantenible.
// Las rutas principales usan controladores específicos y CRUD genérico cuando corresponde.
const crud = require('./crud.controller');

module.exports = {
  list: crud.list('clientes'),
  getOne: crud.getOne('clientes'),
  create: crud.create('clientes'),
  update: crud.update('clientes'),
  remove: crud.remove('clientes')
};
