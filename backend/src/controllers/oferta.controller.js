// Controlador modular de PartGo: oferta
// Este archivo separa responsabilidades para una arquitectura mantenible.
// Las rutas principales usan controladores específicos y CRUD genérico cuando corresponde.
const crud = require('./crud.controller');

module.exports = {
  list: crud.list('ofertas'),
  getOne: crud.getOne('ofertas'),
  create: crud.create('ofertas'),
  update: crud.update('ofertas'),
  remove: crud.remove('ofertas')
};
