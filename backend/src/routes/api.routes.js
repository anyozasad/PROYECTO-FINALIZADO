const router = require('express').Router();
const auth = require('../controllers/auth.controller');
const productos = require('../controllers/productos.controller');
const checkout = require('../controllers/checkout.controller');
const mercadopago = require('../controllers/mercadopago.controller');
const admin = require('../controllers/admin.controller');
const crud = require('../controllers/crud.controller');
const imagenes = require('../controllers/imagenes.controller');
const { verifyToken, requireRole } = require('../middlewares/auth');

router.post('/auth/login', auth.login);
router.post('/login', auth.login);
router.post('/auth/register', auth.register);
router.post('/auth/google', auth.googleAuth);
router.post('/auth/facebook', auth.facebookAuth);
router.post('/auth/google-callback', auth.googleCallback);
router.post('/auth/facebook-callback', auth.facebookCallback);
router.post('/auth/recuperar-password', auth.recuperarPassword);
router.put('/auth/perfil', verifyToken, auth.actualizarPerfil);
router.get('/auth/me', verifyToken, auth.me);

// Catálogo público para cliente
router.get('/productos', productos.listar);
router.get('/productos/:id', productos.obtener);
router.get('/categorias', productos.categorias);

// Administrador categorías
router.post('/categorias', verifyToken, requireRole(1), crud.create('categorias'));
router.put('/categorias/:id', verifyToken, requireRole(1), crud.update('categorias'));
router.patch('/categorias/:id', verifyToken, requireRole(1), crud.update('categorias'));
router.delete('/categorias/:id', verifyToken, requireRole(1), crud.remove('categorias'));

// Administrador productos
router.post('/productos', verifyToken, requireRole(1), productos.crear);
router.put('/productos/:id', verifyToken, requireRole(1), productos.actualizar);
router.patch('/productos/:id', verifyToken, requireRole(1), productos.actualizar);
router.delete('/productos/:id', verifyToken, requireRole(1), productos.eliminar);

// Pagos reales y pedidos de invitados
router.post('/pagos/mercadopago/preferencia', mercadopago.crearPreferencia);
router.post('/pagos/mercadopago/webhook', mercadopago.webhook);
router.get('/pagos/mercadopago/estado/:ventaId', mercadopago.estadoPago);

// Compra del cliente
router.post('/checkout', verifyToken, requireRole(3), checkout.realizarCompra);
router.get('/mis-compras', verifyToken, requireRole(3), checkout.misCompras);
router.get('/comprobantes/:id', verifyToken, checkout.detalleComprobante);

// Admin
router.get('/dashboard', verifyToken, requireRole(1, 2), admin.dashboard);
router.get('/admin/pedidos', verifyToken, requireRole(1, 2), admin.pedidos);
router.get('/ventas', verifyToken, requireRole(1, 2), admin.pedidos);
router.get('/admin/pedidos/:id', verifyToken, requireRole(1, 2), admin.detallePedido);
router.patch('/admin/pedidos/:id/estado', verifyToken, requireRole(1), admin.cambiarEstadoPedido);
router.get('/admin/notificaciones', verifyToken, requireRole(1, 2), admin.notificaciones);
router.patch('/admin/notificaciones/:id', verifyToken, requireRole(1, 2), admin.marcarNotificacion);
router.get('/admin/reportes', verifyToken, requireRole(1, 2), admin.reportes);

// Gestión de imágenes (Admin)
router.get('/imagenes', verifyToken, requireRole(1), imagenes.listarImagenes);
router.post('/imagenes/asignar', verifyToken, requireRole(1), imagenes.asignarImagenProducto);
router.delete('/imagenes/:nombre_imagen', verifyToken, requireRole(1), imagenes.eliminarImagen);
router.get('/imagen/:nombre', imagenes.obtenerImagen);

// CRUD administrativo general
['roles', 'usuarios', 'clientes', 'empresa', 'proveedores', 'compras', 'promociones', 'marcas', 'ofertas', 'metodos_pago', 'estados_pedido', 'comentarios', 'favoritos', 'reclamos', 'historial_stock', 'auditoria', 'banners', 'direcciones_cliente'].forEach(resource => {
  router.get(`/${resource}`, verifyToken, requireRole(1, 2), crud.list(resource));
  router.get(`/${resource}/:id`, verifyToken, requireRole(1, 2), crud.getOne(resource));
  router.post(`/${resource}`, verifyToken, requireRole(1), crud.create(resource));
  router.put(`/${resource}/:id`, verifyToken, requireRole(1), crud.update(resource));
  router.patch(`/${resource}/:id`, verifyToken, requireRole(1), crud.update(resource));
  router.delete(`/${resource}/:id`, verifyToken, requireRole(1), crud.remove(resource));
});

module.exports = router;
