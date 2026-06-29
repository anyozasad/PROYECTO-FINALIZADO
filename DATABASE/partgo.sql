

-- ==============================
-- ARCHIVO: BASE DE DATOS CORREGIDA - PartGo
-- Correccion: notificaciones.usuario_id para registro de clientes
-- ==============================

CREATE DATABASE IF NOT EXISTS repuestos_partgo CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE repuestos_partgo;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS auditoria;
DROP TABLE IF EXISTS notificaciones;
DROP TABLE IF EXISTS comprobantes;
DROP TABLE IF EXISTS pagos;
DROP TABLE IF EXISTS detalle_ventas;
DROP TABLE IF EXISTS ventas;
DROP TABLE IF EXISTS detalle_carrito;
DROP TABLE IF EXISTS carrito;
DROP TABLE IF EXISTS detalle_compras;
DROP TABLE IF EXISTS compras;
DROP TABLE IF EXISTS proveedores;
DROP TABLE IF EXISTS promociones;
DROP TABLE IF EXISTS productos;
DROP TABLE IF EXISTS categorias;
DROP TABLE IF EXISTS clientes;
DROP TABLE IF EXISTS empresa;
DROP TABLE IF EXISTS usuarios;
DROP TABLE IF EXISTS roles;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE,
  descripcion VARCHAR(150),
  estado TINYINT DEFAULT 1,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  rol_id INT NOT NULL,
  estado TINYINT DEFAULT 1,
  provider VARCHAR(50) DEFAULT NULL,
  provider_id VARCHAR(255) DEFAULT NULL,
  picture_url VARCHAR(500) DEFAULT NULL,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (rol_id) REFERENCES roles(id),
  UNIQUE KEY unique_provider (provider, provider_id)
);

CREATE TABLE clientes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NULL,
  nombre VARCHAR(150) NOT NULL,
  documento VARCHAR(20),
  telefono VARCHAR(20),
  email VARCHAR(120),
  direccion VARCHAR(220),
  estado TINYINT DEFAULT 1,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE categorias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  descripcion VARCHAR(220),
  imagen VARCHAR(500),
  estado TINYINT DEFAULT 1,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE productos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  descripcion TEXT,
  categoria_id INT,
  marca VARCHAR(100),
  modelo VARCHAR(100),
  precio DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  precio_oferta DECIMAL(10,2) DEFAULT 0.00,
  stock INT NOT NULL DEFAULT 0,
  stock_minimo INT DEFAULT 5,
  imagen VARCHAR(500),
  en_oferta TINYINT DEFAULT 0,
  es_nuevo TINYINT DEFAULT 0,
  destacado TINYINT DEFAULT 0,
  estado TINYINT DEFAULT 1,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (categoria_id) REFERENCES categorias(id)
);

CREATE TABLE proveedores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  ruc VARCHAR(20),
  telefono VARCHAR(20),
  email VARCHAR(120),
  direccion VARCHAR(220),
  estado TINYINT DEFAULT 1,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE compras (
  id INT AUTO_INCREMENT PRIMARY KEY,
  proveedor_id INT NOT NULL,
  usuario_id INT NOT NULL,
  total DECIMAL(10,2) DEFAULT 0,
  estado VARCHAR(30) DEFAULT 'REGISTRADA',
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (proveedor_id) REFERENCES proveedores(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE detalle_compras (
  id INT AUTO_INCREMENT PRIMARY KEY,
  compra_id INT NOT NULL,
  producto_id INT NOT NULL,
  cantidad INT NOT NULL,
  costo_unitario DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (compra_id) REFERENCES compras(id) ON DELETE CASCADE,
  FOREIGN KEY (producto_id) REFERENCES productos(id)
);

CREATE TABLE carrito (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  estado VARCHAR(20) DEFAULT 'ACTIVO',
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE detalle_carrito (
  id INT AUTO_INCREMENT PRIMARY KEY,
  carrito_id INT NOT NULL,
  producto_id INT NOT NULL,
  cantidad INT NOT NULL DEFAULT 1,
  precio_unitario DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (carrito_id) REFERENCES carrito(id) ON DELETE CASCADE,
  FOREIGN KEY (producto_id) REFERENCES productos(id)
);

CREATE TABLE ventas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT,
  usuario_id INT,
  total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  estado VARCHAR(30) DEFAULT 'PAGADO',
  metodo_pago VARCHAR(30) DEFAULT 'EFECTIVO',
  tipo_comprobante VARCHAR(30) DEFAULT 'BOLETA',
  numero_comprobante VARCHAR(30),
  direccion_entrega VARCHAR(220),
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE detalle_ventas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  venta_id INT NOT NULL,
  producto_id INT NOT NULL,
  producto_nombre VARCHAR(150),
  producto_imagen VARCHAR(500),
  cantidad INT NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
  FOREIGN KEY (producto_id) REFERENCES productos(id)
);

CREATE TABLE pagos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  venta_id INT NOT NULL,
  metodo_pago VARCHAR(30) NOT NULL,
  monto DECIMAL(10,2) NOT NULL,
  estado VARCHAR(30) DEFAULT 'CONFIRMADO',
  referencia VARCHAR(100),
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE
);

CREATE TABLE comprobantes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  venta_id INT NOT NULL,
  tipo VARCHAR(30) NOT NULL,
  numero VARCHAR(30) NOT NULL,
  cliente_nombre VARCHAR(150),
  cliente_documento VARCHAR(20),
  total DECIMAL(10,2),
  estado VARCHAR(30) DEFAULT 'EMITIDO',
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE
);

CREATE TABLE notificaciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tipo VARCHAR(50),
  titulo VARCHAR(150),
  mensaje TEXT,
  usuario_id INT NULL,
  venta_id INT NULL,
  leido TINYINT DEFAULT 0,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE SET NULL
);

CREATE TABLE promociones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  descripcion TEXT,
  porcentaje_descuento DECIMAL(5,2) DEFAULT 0,
  fecha_inicio DATE,
  fecha_fin DATE,
  estado TINYINT DEFAULT 1
);

CREATE TABLE empresa (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  ruc VARCHAR(20),
  telefono VARCHAR(20),
  email VARCHAR(120),
  direccion VARCHAR(220),
  logo VARCHAR(500),
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE auditoria (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT,
  accion VARCHAR(100),
  tabla_afectada VARCHAR(80),
  registro_id INT,
  descripcion TEXT,
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

INSERT INTO roles (id, nombre, descripcion) VALUES
(1, 'ADMINISTRADOR', 'Control total del sistema'),
(2, 'ANALISTA', 'Reportes, estadísticas y revisión de pedidos'),
(3, 'CLIENTE', 'Usuario comprador de la tienda');

INSERT INTO usuarios (id, nombre, email, password, rol_id) VALUES
(1, 'Administrador PartGo', 'admin@gmail.com', '123456', 1),
(2, 'Analista PartGo', 'analista@gmail.com', '123456', 2),
(3, 'Usuario Cliente', 'usuario@gmail.com', '123456', 3);

INSERT INTO clientes (usuario_id, nombre, documento, telefono, email, direccion) VALUES
(3, 'Usuario Cliente', '74581236', '987654321', 'usuario@gmail.com', 'Av. Principal 123'),
(NULL, 'Cliente General', '00000000', '999999999', 'cliente@partgo.com', 'Tarma');

INSERT INTO categorias (nombre, descripcion, imagen) VALUES
('Lubricantes', 'Aceites y lubricantes para motos', 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=500'),
('Frenos', 'Pastillas, discos y accesorios de freno', 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=500'),
('Llantas', 'Llantas para diferentes modelos de moto', 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=500'),
('Baterías', 'Baterías para motocicletas', 'https://images.unsplash.com/photo-1581092921461-39b9d08a9b21?w=500'),
('Accesorios', 'Cascos, guantes y accesorios', 'https://images.unsplash.com/photo-1558980394-0c7c9299fe96?w=500'),
('Transmisión', 'Cadenas, piñones y coronas', 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=500');

INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado) VALUES
('Aceite Motul 5100 4T', 'Aceite semisintético para motor de moto.', 1, 'Motul', '5100 4T', 45.00, 39.90, 20, 5, 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=500', 1, 1, 1),
('Pastillas de freno delanteras', 'Pastillas resistentes para uso urbano.', 2, 'Honda', 'Universal', 38.00, 0.00, 15, 5, 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=500', 0, 1, 1),
('Llanta Michelin Pilot Street', 'Llanta para moto urbana.', 3, 'Michelin', 'Pilot Street', 180.00, 165.00, 8, 5, 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=500', 1, 0, 1),
('Batería Bosch Moto', 'Batería sellada para motocicleta.', 4, 'Bosch', 'BTX7A', 120.00, 0.00, 10, 4, 'https://images.unsplash.com/photo-1581092921461-39b9d08a9b21?w=500', 0, 1, 0),
('Casco integral negro', 'Casco de seguridad para motociclista.', 5, 'LS2', 'Integral', 250.00, 229.00, 5, 5, 'https://images.unsplash.com/photo-1558980394-0c7c9299fe96?w=500', 1, 0, 1),
('Cadena reforzada 428', 'Cadena reforzada para transmisión.', 6, 'DID', '428', 95.00, 0.00, 12, 5, 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=500', 0, 1, 0);

INSERT INTO proveedores (nombre, ruc, telefono, email, direccion) VALUES
('Moto Repuestos Perú', '20601234567', '999111222', 'ventas@motorepuestos.pe', 'Av. Industrial 123'),
('Importadora Racing SAC', '20599887766', '988777666', 'contacto@racing.pe', 'Jr. Comercio 456');

INSERT INTO empresa (nombre, ruc, telefono, email, direccion, logo) VALUES
('PartGo Repuestos de Moto', '20600000001', '999888777', 'contacto@partgo.com', 'Tarma - Perú', '');

INSERT INTO promociones (nombre, descripcion, porcentaje_descuento, fecha_inicio, fecha_fin) VALUES
('Semana del motociclista', 'Descuentos en lubricantes y accesorios', 10, '2026-05-01', '2026-05-31');


-- =========================================================
-- TABLAS EMPRESARIALES ADICIONALES PARA PARTGO
-- =========================================================
CREATE TABLE IF NOT EXISTS marcas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  descripcion VARCHAR(220),
  estado TINYINT DEFAULT 1,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS metodos_pago (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(80) NOT NULL UNIQUE,
  descripcion VARCHAR(220),
  estado TINYINT DEFAULT 1,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS estados_pedido (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(80) NOT NULL UNIQUE,
  descripcion VARCHAR(220),
  estado TINYINT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS ofertas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  producto_id INT NOT NULL,
  nombre VARCHAR(150),
  descuento DECIMAL(5,2) DEFAULT 0,
  fecha_inicio DATE,
  fecha_fin DATE,
  estado TINYINT DEFAULT 1,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (producto_id) REFERENCES productos(id)
);

CREATE TABLE IF NOT EXISTS historial_stock (
  id INT AUTO_INCREMENT PRIMARY KEY,
  producto_id INT NOT NULL,
  stock_anterior INT NOT NULL,
  stock_nuevo INT NOT NULL,
  movimiento VARCHAR(50) NOT NULL,
  referencia VARCHAR(200),
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (producto_id) REFERENCES productos(id)
);

CREATE TABLE IF NOT EXISTS comentarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT NOT NULL,
  producto_id INT NOT NULL,
  comentario TEXT,
  calificacion INT DEFAULT 5,
  estado TINYINT DEFAULT 1,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id),
  FOREIGN KEY (producto_id) REFERENCES productos(id)
);

CREATE TABLE IF NOT EXISTS favoritos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT NOT NULL,
  producto_id INT NOT NULL,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id),
  FOREIGN KEY (producto_id) REFERENCES productos(id)
);

CREATE TABLE IF NOT EXISTS reclamos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT,
  asunto VARCHAR(150),
  descripcion TEXT,
  estado VARCHAR(30) DEFAULT 'PENDIENTE',
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id)
);

CREATE TABLE IF NOT EXISTS banners (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(150),
  subtitulo VARCHAR(220),
  imagen VARCHAR(500),
  enlace VARCHAR(220),
  estado TINYINT DEFAULT 1,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS direcciones_cliente (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT NOT NULL,
  direccion VARCHAR(220) NOT NULL,
  referencia VARCHAR(220),
  distrito VARCHAR(100),
  estado TINYINT DEFAULT 1,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id)
);

INSERT IGNORE INTO marcas(nombre, descripcion) VALUES
('Motul','Lubricantes para motos'),('Honda','Repuestos compatibles Honda'),('Yamaha','Repuestos compatibles Yamaha'),('Michelin','Llantas'),('Bosch','Baterías y eléctricos'),('DID','Transmisión');

INSERT IGNORE INTO metodos_pago(nombre, descripcion) VALUES
('YAPE','Pago por billetera Yape'),('PLIN','Pago por billetera Plin'),('TARJETA','Pago con tarjeta'),('EFECTIVO','Pago contra entrega');

INSERT IGNORE INTO estados_pedido(nombre, descripcion) VALUES
('PENDIENTE','Pedido creado'),('PAGADO','Pago confirmado'),('PREPARANDO','Preparando productos'),('ENTREGADO','Pedido entregado'),('ANULADO','Pedido anulado');

INSERT IGNORE INTO ofertas(producto_id, nombre, descuento, fecha_inicio, fecha_fin) VALUES
(1,'Oferta en aceite Motul',12.00,'2026-05-01','2026-05-31'),
(3,'Descuento en llanta Michelin',8.00,'2026-05-01','2026-05-31'),
(5,'Promoción casco integral',10.00,'2026-05-01','2026-06-15');

INSERT IGNORE INTO banners(titulo, subtitulo, imagen, enlace) VALUES
('Repuestos para tu moto','Compra rápido, seguro y con boleta','https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=1200','#productos');


-- ==============================
-- ARCHIVO: CARGAR_TODOS_PRODUCTOS_IMAGENES(1).sql
-- ==============================

USE repuestos_partgo;

INSERT IGNORE INTO categorias (nombre, descripcion, estado) VALUES
('Accesorios','Categoría Accesorios',1),
('Aceites','Categoría Aceites',1),
('Cadenas','Categoría Cadenas',1),
('Frenos','Categoría Frenos',1),
('Llantas','Categoría Llantas',1),
('Luces','Categoría Luces',1),
('Motor','Categoría Motor',1),
('Suspensión','Categoría Suspensión',1);

-- Carga todos los productos con las imágenes del archivo IMAGENES.
INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Abrillantador De Neumaticos 600Ml', 'Abrillantador De Neumaticos 600Ml para motocicleta.', c.id, 'PartGo', 'Universal', 25.9, 0, 7, 5, '/IMAGENES/ABRILLANTADOR DE NEUMATICOS 600ML.jpg', 0, 0, 1, 1 FROM categorias c WHERE c.nombre='Llantas' LIMIT 1;
INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Aceite Lubricante 4T Sae 20W50 1.5L. X12Bot', 'Aceite Lubricante 4T Sae 20W50 1.5L. X12Bot para motocicleta.', c.id, 'PartGo', 'Universal', 33.8, 0, 10, 5, '/IMAGENES/ACEITE LUBRICANTE 4T SAE 20W50 1.5L. X12BOT.jpg', 0, 0, 1, 1 FROM categorias c WHERE c.nombre='Aceites' LIMIT 1;
INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Aceite Lubricante 4T25W-50 1Lt', 'Aceite Lubricante 4T25W-50 1Lt para motocicleta.', c.id, 'PartGo', 'Universal', 39.0, 0, 13, 5, '/IMAGENES/ACEITE LUBRICANTE 4T25W-50 1LT.jpg', 0, 1, 1, 1 FROM categorias c WHERE c.nombre='Aceites' LIMIT 1;
INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Aceite Lubricante 4T25W-60 1L. Efficiency', 'Aceite Lubricante 4T25W-60 1L. Efficiency para motocicleta.', c.id, 'PartGo', 'Universal', 46.9, 0, 16, 5, '/IMAGENES/ACEITE LUBRICANTE 4T25W-60 1L. EFFICIENCY.jpg', 0, 0, 1, 1 FROM categorias c WHERE c.nombre='Aceites' LIMIT 1;
INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Aceite Lubricante 4T25W-60 1Lt', 'Aceite Lubricante 4T25W-60 1Lt para motocicleta.', c.id, 'PartGo', 'Universal', 54.8, 49.32, 19, 5, '/IMAGENES/ACEITE LUBRICANTE 4T25W-60 1LT.jpg', 1, 0, 1, 1 FROM categorias c WHERE c.nombre='Aceites' LIMIT 1;
INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Aceite Lubricante. 4T Sae 25W60 1.5L.', 'Aceite Lubricante. 4T Sae 25W60 1.5L. para motocicleta.', c.id, 'PartGo', 'Universal', 60.0, 0, 22, 5, '/IMAGENES/ACEITE LUBRICANTE. 4T SAE 25W60 1.5L..jpg', 0, 1, 1, 1 FROM categorias c WHERE c.nombre='Aceites' LIMIT 1;
INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Alternador 4P Cgl', 'Alternador 4P Cgl para motocicleta.', c.id, 'PartGo', 'Universal', 67.9, 0, 25, 5, '/IMAGENES/ALTERNADOR 4P CGL.jpg', 0, 0, 1, 1 FROM categorias c WHERE c.nombre='Motor' LIMIT 1;
INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Alternador C100C110 Wxve (6 Pol)', 'Alternador C100C110 Wxve (6 Pol) para motocicleta.', c.id, 'PartGo', 'Universal', 75.8, 0, 6, 5, '/IMAGENES/ALTERNADOR C100C110 WXVE (6 POL).jpg', 0, 0, 1, 1 FROM categorias c WHERE c.nombre='Motor' LIMIT 1;
INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Alternador New Power Cxgwanx150', 'Alternador New Power Cxgwanx150 para motocicleta.', c.id, 'PartGo', 'Universal', 81.0, 0, 9, 5, '/IMAGENES/ALTERNADOR NEW POWER CXGWANX150.jpg', 0, 1, 1, 1 FROM categorias c WHERE c.nombre='Motor' LIMIT 1;
INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Aro Cllanta 6.00-13(5H)', 'Aro Cllanta 6.00-13(5H) para motocicleta.', c.id, 'PartGo', 'Universal', 88.9, 80.01, 12, 5, '/IMAGENES/ARO CLLANTA 6.00-13(5H).jpg', 1, 0, 1, 1 FROM categorias c WHERE c.nombre='Llantas' LIMIT 1;
INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Aro Con Llanta 5.00-12 (4H)', 'Aro Con Llanta 5.00-12 (4H) para motocicleta.', c.id, 'PartGo', 'Universal', 96.8, 0, 15, 5, '/IMAGENES/ARO CON LLANTA 5.00-12 (4H).jpg', 0, 0, 1, 1 FROM categorias c WHERE c.nombre='Llantas' LIMIT 1;
INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Arrancador 11T Ckit Piñon + Relay Enc.', 'Arrancador 11T Ckit Piñon + Relay Enc. para motocicleta.', c.id, 'PartGo', 'Universal', 102.0, 0, 18, 5, '/IMAGENES/ARRANCADOR 11T CKIT PIÑON + RELAY ENC..jpg', 0, 1, 1, 1 FROM categorias c WHERE c.nombre='Motor' LIMIT 1;
INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Arrancador De Motor Cg250 (11T)', 'Arrancador De Motor Cg250 (11T) para motocicleta.', c.id, 'PartGo', 'Universal', 109.9, 0, 21, 5, '/IMAGENES/ARRANCADOR DE MOTOR CG250 (11T).jpg', 0, 0, 0, 1 FROM categorias c WHERE c.nombre='Motor' LIMIT 1;
INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Arrancador De Motor Gn 125', 'Arrancador De Motor Gn 125 para motocicleta.', c.id, 'PartGo', 'Universal', 117.8, 0, 24, 5, '/IMAGENES/ARRANCADOR DE MOTOR GN 125.jpg', 0, 0, 0, 1 FROM categorias c WHERE c.nombre='Motor' LIMIT 1;
INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Arrancador De Motor Gn125', 'Arrancador De Motor Gn125 para motocicleta.', c.id, 'PartGo', 'Universal', 123.0, 110.7, 5, 5, '/IMAGENES/ARRANCADOR DE MOTOR GN125.jpg', 1, 1, 0, 1 FROM categorias c WHERE c.nombre='Motor' LIMIT 1;
INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Balancines Cpines', 'Balancines Cpines para motocicleta.', c.id, 'PartGo', 'Universal', 130.9, 0, 8, 5, '/IMAGENES/BALANCINES CPINES.jpg', 0, 0, 0, 1 FROM categorias c WHERE c.nombre='Motor' LIMIT 1;
INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Balancines De Cadenilla 383 2Pcsset', 'Balancines De Cadenilla 383 2Pcsset para motocicleta.', c.id, 'PartGo', 'Universal', 138.8, 0, 11, 5, '/IMAGENES/BALANCINES DE CADENILLA 383 2PCSSET.jpg', 0, 0, 0, 1 FROM categorias c WHERE c.nombre='Motor' LIMIT 1;
INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Banda Ska (Ska031)', 'Banda Ska (Ska031) para motocicleta.', c.id, 'PartGo', 'Universal', 144.0, 0, 14, 5, '/IMAGENES/BANDA SKA (SKA031).jpg', 0, 1, 0, 1 FROM categorias c WHERE c.nombre='Motor' LIMIT 1;
INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Barra Telescopica Carguero', 'Barra Telescopica Carguero para motocicleta.', c.id, 'PartGo', 'Universal', 151.9, 0, 17, 5, '/IMAGENES/BARRA TELESCOPICA CARGUERO.jpg', 0, 0, 0, 1 FROM categorias c WHERE c.nombre='Suspensión' LIMIT 1;
INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Bobina 12V', 'Bobina 12V para motocicleta.', c.id, 'PartGo', 'Universal', 159.8, 143.82, 20, 5, '/IMAGENES/BOBINA 12V.jpg', 1, 0, 0, 1 FROM categorias c WHERE c.nombre='Motor' LIMIT 1;
INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Bocamaza Del. C/Tapa Comp.', 'Bocamaza Del. C/Tapa Comp. para motocicleta.', c.id, 'PartGo', 'Universal', 165.0, 0, 23, 5, '/IMAGENES/BOCAMAZA DEL. CTAPA COMP..jpg', 0, 1, 0, 1 FROM categorias c WHERE c.nombre='Accesorios' LIMIT 1;
INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Bocamaza Delantera Furgon 4P', 'Bocamaza Delantera Furgon 4P para motocicleta.', c.id, 'PartGo', 'Universal', 172.9, 0, 4, 5, '/IMAGENES/BOCAMAZA DELANTERA FURGON 4P.jpg', 0, 0, 0, 1 FROM categorias c WHERE c.nombre='Motor' LIMIT 1;
INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Bocamaza Post. C/Tapa Completa', 'Bocamaza Post. C/Tapa Completa para motocicleta.', c.id, 'PartGo', 'Universal', 180.8, 0, 7, 5, '/IMAGENES/BOCAMAZA POST. CTAPA COMPLETA.jpg', 0, 0, 0, 1 FROM categorias c WHERE c.nombre='Accesorios' LIMIT 1;
INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Buje De Trapecio Cxg125', 'Buje De Trapecio Cxg125 para motocicleta.', c.id, 'PartGo', 'Universal', 186.0, 0, 10, 5, '/IMAGENES/BUJE DE TRAPECIO CXG125.jpg', 0, 1, 0, 1 FROM categorias c WHERE c.nombre='Motor' LIMIT 1;
INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Buje Soporte De Motor Furgon', 'Buje Soporte De Motor Furgon para motocicleta.', c.id, 'PartGo', 'Universal', 193.9, 174.51, 13, 5, '/IMAGENES/BUJE SOPORTE DE MOTOR FURGON.jpg', 1, 0, 0, 1 FROM categorias c WHERE c.nombre='Motor' LIMIT 1;
INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Cabezal Completo Cxg200 S Levas', 'Cabezal Completo Cxg200 S Levas para motocicleta.', c.id, 'PartGo', 'Universal', 21.8, 0, 16, 5, '/IMAGENES/CABEZAL COMPLETO CXG200 S LEVAS.jpg', 0, 0, 0, 1 FROM categorias c WHERE c.nombre='Motor' LIMIT 1;
INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Cabezal Completo S/Levas E/Aire', 'Cabezal Completo S/Levas E/Aire para motocicleta.', c.id, 'PartGo', 'Universal', 27.0, 0, 19, 5, '/IMAGENES/CABEZAL COMPLETO SLEVAS EAIRE.jpg', 0, 1, 0, 1 FROM categorias c WHERE c.nombre='Motor' LIMIT 1;
INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Cadena 428-114L', 'Cadena 428-114L para motocicleta.', c.id, 'PartGo', 'Universal', 34.9, 0, 22, 5, '/IMAGENES/CADENA 428-114L.jpg', 0, 0, 0, 1 FROM categorias c WHERE c.nombre='Cadenas' LIMIT 1;
INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Camara 4.50-12 Butyl', 'Camara 4.50-12 Butyl para motocicleta.', c.id, 'PartGo', 'Universal', 42.8, 0, 25, 5, '/IMAGENES/CAMARA 4.50-12 BUTYL.jpg', 0, 0, 0, 1 FROM categorias c WHERE c.nombre='Llantas' LIMIT 1;
INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Camara 4.50-17 Butyl', 'Camara 4.50-17 Butyl para motocicleta.', c.id, 'PartGo', 'Universal', 48.0, 43.2, 6, 5, '/IMAGENES/CAMARA 4.50-17 BUTYL.jpg', 1, 1, 0, 1 FROM categorias c WHERE c.nombre='Llantas' LIMIT 1;
INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Capuchon De Bujia', 'Capuchon De Bujia para motocicleta.', c.id, 'PartGo', 'Universal', 55.9, 0, 9, 5, '/IMAGENES/CAPUCHON DE BUJIA.jpg', 0, 0, 0, 1 FROM categorias c WHERE c.nombre='Accesorios' LIMIT 1;
INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Cdi 6 Plugs (2)', 'Cdi 6 Plugs (2) para motocicleta.', c.id, 'PartGo', 'Universal', 63.8, 0, 12, 5, '/IMAGENES/CDI 6 PLUGS (2).jpg', 0, 0, 0, 1 FROM categorias c WHERE c.nombre='Motor' LIMIT 1;
INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Cdi 6 Plugs', 'Cdi 6 Plugs para motocicleta.', c.id, 'PartGo', 'Universal', 69.0, 0, 15, 5, '/IMAGENES/CDI 6 PLUGS.jpg', 0, 1, 0, 1 FROM categorias c WHERE c.nombre='Motor' LIMIT 1;
INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Chapa Contacto Yxbr125 (4 Cables)', 'Chapa Contacto Yxbr125 (4 Cables) para motocicleta.', c.id, 'PartGo', 'Universal', 76.9, 0, 18, 5, '/IMAGENES/CHAPA CONTACTO YXBR125 (4 CABLES).jpg', 0, 0, 0, 1 FROM categorias c WHERE c.nombre='Accesorios' LIMIT 1;
INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Cigueñal Con Levas Ref. (15Mm)', 'Cigueñal Con Levas Ref. (15Mm) para motocicleta.', c.id, 'PartGo', 'Universal', 84.8, 76.32, 21, 5, '/IMAGENES/CIGUEÑAL CON LEVAS REF. (15MM).jpg', 1, 0, 0, 1 FROM categorias c WHERE c.nombre='Motor' LIMIT 1;
INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Cigueñal Cx110 Oem Solo', 'Cigueñal Cx110 Oem Solo para motocicleta.', c.id, 'PartGo', 'Universal', 90.0, 0, 24, 5, '/IMAGENES/CIGUEÑAL CX110 OEM SOLO.jpg', 0, 1, 0, 1 FROM categorias c WHERE c.nombre='Motor' LIMIT 1;
INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Cilindro Completo Cxg250', 'Cilindro Completo Cxg250 para motocicleta.', c.id, 'PartGo', 'Universal', 97.9, 0, 5, 5, '/IMAGENES/CILINDRO COMPLETO CXG250.jpg', 0, 0, 0, 1 FROM categorias c WHERE c.nombre='Motor' LIMIT 1;
INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Comando Switch De Luz Izquierdo C/Sop.', 'Comando Switch De Luz Izquierdo C/Sop. para motocicleta.', c.id, 'PartGo', 'Universal', 105.8, 0, 8, 5, '/IMAGENES/COMANDO SWITCH DE LUZ IZQUIERDO CSOP..jpg', 0, 0, 0, 1 FROM categorias c WHERE c.nombre='Luces' LIMIT 1;
INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Espejo Carbonnegro (Hilo Der. 10Mm)', 'Espejo Carbonnegro (Hilo Der. 10Mm) para motocicleta.', c.id, 'PartGo', 'Universal', 111.0, 0, 11, 5, '/IMAGENES/ESPEJO CARBONNEGRO (HILO DER. 10MM).jpg', 0, 1, 0, 1 FROM categorias c WHERE c.nombre='Accesorios' LIMIT 1;
INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Espejo Compa', 'Espejo Compa para motocicleta.', c.id, 'PartGo', 'Universal', 118.9, 107.01, 14, 5, '/IMAGENES/ESPEJO COMPA.jpg', 1, 0, 0, 1 FROM categorias c WHERE c.nombre='Accesorios' LIMIT 1;
INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Espejo Universal Fantasma Duke Azul - Azul', 'Espejo Universal Fantasma Duke Azul - Azul para motocicleta.', c.id, 'PartGo', 'Universal', 126.8, 0, 17, 5, '/IMAGENES/ESPEJO UNIVERSAL FANTASMA DUKE AZUL - AZUL.jpg', 0, 0, 0, 1 FROM categorias c WHERE c.nombre='Accesorios' LIMIT 1;
INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Espejo Universal Fantasma Duke Rojo - Rojo', 'Espejo Universal Fantasma Duke Rojo - Rojo para motocicleta.', c.id, 'PartGo', 'Universal', 132.0, 0, 20, 5, '/IMAGENES/ESPEJO UNIVERSAL FANTASMA DUKE ROJO - ROJO.jpg', 0, 1, 0, 1 FROM categorias c WHERE c.nombre='Accesorios' LIMIT 1;
INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Faro Delantero Mtk-Azul', 'Faro Delantero Mtk-Azul para motocicleta.', c.id, 'PartGo', 'Universal', 139.9, 0, 23, 5, '/IMAGENES/FARO DELANTERO MTK-AZUL.jpg', 0, 0, 0, 1 FROM categorias c WHERE c.nombre='Llantas' LIMIT 1;
INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Faro Delantero Oem', 'Faro Delantero Oem para motocicleta.', c.id, 'PartGo', 'Universal', 147.8, 0, 4, 5, '/IMAGENES/FARO DELANTERO OEM.jpg', 0, 0, 0, 1 FROM categorias c WHERE c.nombre='Llantas' LIMIT 1;
INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Faro Delantero Redondo', 'Faro Delantero Redondo para motocicleta.', c.id, 'PartGo', 'Universal', 153.0, 137.7, 7, 5, '/IMAGENES/FARO DELANTERO REDONDO.jpg', 1, 1, 0, 1 FROM categorias c WHERE c.nombre='Llantas' LIMIT 1;
INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Faro Direccional (Mc-119) 2Pcset', 'Faro Direccional (Mc-119) 2Pcset para motocicleta.', c.id, 'PartGo', 'Universal', 160.9, 0, 10, 5, '/IMAGENES/FARO DIRECCIONAL (MC-119) 2PCSET.jpg', 0, 0, 0, 1 FROM categorias c WHERE c.nombre='Llantas' LIMIT 1;
INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Faro Direccional Mica Trasparente', 'Faro Direccional Mica Trasparente para motocicleta.', c.id, 'PartGo', 'Universal', 168.8, 0, 13, 5, '/IMAGENES/FARO DIRECCIONAL MICA TRASPARENTE.jpg', 0, 0, 0, 1 FROM categorias c WHERE c.nombre='Llantas' LIMIT 1;
INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Faro Direccional Sbrazo Ambar', 'Faro Direccional Sbrazo Ambar para motocicleta.', c.id, 'PartGo', 'Universal', 174.0, 0, 16, 5, '/IMAGENES/FARO DIRECCIONAL SBRAZO AMBAR.jpg', 0, 1, 0, 1 FROM categorias c WHERE c.nombre='Llantas' LIMIT 1;
INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Faro Direccional X 4 Comp', 'Faro Direccional X 4 Comp para motocicleta.', c.id, 'PartGo', 'Universal', 181.9, 0, 19, 5, '/IMAGENES/FARO DIRECCIONAL X 4 COMP.jpg', 0, 0, 0, 1 FROM categorias c WHERE c.nombre='Llantas' LIMIT 1;
INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Faro Direcional', 'Faro Direcional para motocicleta.', c.id, 'PartGo', 'Universal', 189.8, 170.82, 22, 5, '/IMAGENES/FARO DIRECIONAL.jpg', 1, 0, 0, 1 FROM categorias c WHERE c.nombre='Llantas' LIMIT 1;
INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Faro Led Tipo Buho 3 Led', 'Faro Led Tipo Buho 3 Led para motocicleta.', c.id, 'PartGo', 'Universal', 195.0, 0, 25, 5, '/IMAGENES/FARO LED TIPO BUHO 3 LED.jpg', 0, 1, 0, 1 FROM categorias c WHERE c.nombre='Llantas' LIMIT 1;
INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Faro Posterior Carguero', 'Faro Posterior Carguero para motocicleta.', c.id, 'PartGo', 'Universal', 22.9, 0, 6, 5, '/IMAGENES/FARO POSTERIOR CARGUERO.jpg', 0, 0, 0, 1 FROM categorias c WHERE c.nombre='Llantas' LIMIT 1;
INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Faro Posterior Vx Hh-F18-0008', 'Faro Posterior Vx Hh-F18-0008 para motocicleta.', c.id, 'PartGo', 'Universal', 30.8, 0, 9, 5, '/IMAGENES/FARO POSTERIOR VX HH-F18-0008.jpg', 0, 0, 0, 1 FROM categorias c WHERE c.nombre='Llantas' LIMIT 1;
INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Faro Posterior', 'Faro Posterior para motocicleta.', c.id, 'PartGo', 'Universal', 36.0, 0, 12, 5, '/IMAGENES/FARO POSTERIOR.jpg', 0, 1, 0, 1 FROM categorias c WHERE c.nombre='Llantas' LIMIT 1;
INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Flasher 12V C/Sonido', 'Flasher 12V C/Sonido para motocicleta.', c.id, 'PartGo', 'Universal', 43.9, 39.51, 15, 5, '/IMAGENES/FLASHER 12V CSONIDO.jpg', 1, 0, 0, 1 FROM categorias c WHERE c.nombre='Luces' LIMIT 1;
INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Flasher 12V Sin Sonido', 'Flasher 12V Sin Sonido para motocicleta.', c.id, 'PartGo', 'Universal', 51.8, 0, 18, 5, '/IMAGENES/FLASHER 12V SIN SONIDO.jpg', 0, 0, 0, 1 FROM categorias c WHERE c.nombre='Luces' LIMIT 1;
INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Llanta 13060-13 Tl 8Pr Mixt', 'Llanta 13060-13 Tl 8Pr Mixt para motocicleta.', c.id, 'PartGo', 'Universal', 57.0, 0, 21, 5, '/IMAGENES/LLANTA 13060-13 TL 8PR MIXT.jpg', 0, 1, 0, 1 FROM categorias c WHERE c.nombre='Llantas' LIMIT 1;
INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Llanta 2.75-17 Tt 8Pr', 'Llanta 2.75-17 Tt 8Pr para motocicleta.', c.id, 'PartGo', 'Universal', 64.9, 0, 24, 5, '/IMAGENES/LLANTA 2.75-17 TT 8PR.jpg', 0, 0, 0, 1 FROM categorias c WHERE c.nombre='Llantas' LIMIT 1;
INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Llanta 2.75-18 Tt Delant. 8Pr', 'Llanta 2.75-18 Tt Delant. 8Pr para motocicleta.', c.id, 'PartGo', 'Universal', 72.8, 0, 5, 5, '/IMAGENES/LLANTA 2.75-18 TT DELANT. 8PR.jpg', 0, 0, 0, 1 FROM categorias c WHERE c.nombre='Llantas' LIMIT 1;
INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Llanta 3.00-18 Thoja', 'Llanta 3.00-18 Thoja para motocicleta.', c.id, 'PartGo', 'Universal', 78.0, 70.2, 8, 5, '/IMAGENES/LLANTA 3.00-18 THOJA.jpg', 1, 1, 0, 1 FROM categorias c WHERE c.nombre='Llantas' LIMIT 1;
INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Mica De Faro Direccional Ambar', 'Mica De Faro Direccional Ambar para motocicleta.', c.id, 'PartGo', 'Universal', 85.9, 0, 11, 5, '/IMAGENES/MICA DE FARO DIRECCIONAL AMBAR.jpg', 0, 0, 0, 1 FROM categorias c WHERE c.nombre='Llantas' LIMIT 1;
INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Mica Posterior Vx', 'Mica Posterior Vx para motocicleta.', c.id, 'PartGo', 'Universal', 93.8, 0, 14, 5, '/IMAGENES/MICA POSTERIOR VX.jpg', 0, 0, 0, 1 FROM categorias c WHERE c.nombre='Luces' LIMIT 1;
INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Motor Ae 162 Fmj', 'Motor Ae 162 Fmj para motocicleta.', c.id, 'PartGo', 'Universal', 99.0, 0, 17, 5, '/IMAGENES/MOTOR AE 162 FMJ.jpg', 0, 1, 0, 1 FROM categorias c WHERE c.nombre='Motor' LIMIT 1;
INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Motor Aelect 163Fml', 'Motor Aelect 163Fml para motocicleta.', c.id, 'PartGo', 'Universal', 106.9, 0, 20, 5, '/IMAGENES/MOTOR AELECT 163FML.jpg', 0, 0, 0, 1 FROM categorias c WHERE c.nombre='Motor' LIMIT 1;
INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Motor Aelect 167Fmm Plus', 'Motor Aelect 167Fmm Plus para motocicleta.', c.id, 'PartGo', 'Universal', 114.8, 103.32, 23, 5, '/IMAGENES/MOTOR AELECT 167FMM PLUS.jpg', 1, 0, 0, 1 FROM categorias c WHERE c.nombre='Motor' LIMIT 1;
INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Ramal Carguero Zs', 'Ramal Carguero Zs para motocicleta.', c.id, 'PartGo', 'Universal', 120.0, 0, 4, 5, '/IMAGENES/RAMAL CARGUERO ZS.jpg', 0, 1, 0, 1 FROM categorias c WHERE c.nombre='Motor' LIMIT 1;
INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Ramal Electrico De Furgon', 'Ramal Electrico De Furgon para motocicleta.', c.id, 'PartGo', 'Universal', 127.9, 0, 7, 5, '/IMAGENES/RAMAL ELECTRICO DE FURGON.jpg', 0, 0, 0, 1 FROM categorias c WHERE c.nombre='Motor' LIMIT 1;
INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Selenio Reg. Voltage', 'Selenio Reg. Voltage para motocicleta.', c.id, 'PartGo', 'Universal', 135.8, 0, 10, 5, '/IMAGENES/SELENIO REG. VOLTAGE.jpg', 0, 0, 0, 1 FROM categorias c WHERE c.nombre='Motor' LIMIT 1;
INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Selenio Regulador De Voltage', 'Selenio Regulador De Voltage para motocicleta.', c.id, 'PartGo', 'Universal', 141.0, 0, 13, 5, '/IMAGENES/SELENIO REGULADOR DE VOLTAGE.jpg', 0, 1, 0, 1 FROM categorias c WHERE c.nombre='Motor' LIMIT 1;
INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Set De Chapa C/Tapa Y Seguro Redondo', 'Set De Chapa C/Tapa Y Seguro Redondo para motocicleta.', c.id, 'PartGo', 'Universal', 148.9, 134.01, 16, 5, '/IMAGENES/SET DE CHAPA CTAPA Y SEGURO REDONDO.jpg', 1, 0, 0, 1 FROM categorias c WHERE c.nombre='Accesorios' LIMIT 1;
INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Set De Chapatapa (2)', 'Set De Chapatapa (2) para motocicleta.', c.id, 'PartGo', 'Universal', 156.8, 0, 19, 5, '/IMAGENES/SET DE CHAPATAPA (2).jpg', 0, 0, 0, 1 FROM categorias c WHERE c.nombre='Accesorios' LIMIT 1;
INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Set De Chapatapa', 'Set De Chapatapa para motocicleta.', c.id, 'PartGo', 'Universal', 162.0, 0, 22, 5, '/IMAGENES/SET DE CHAPATAPA.jpg', 0, 1, 0, 1 FROM categorias c WHERE c.nombre='Accesorios' LIMIT 1;
INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Tablero Tacometro + Velocimetro (2)', 'Tablero Tacometro + Velocimetro (2) para motocicleta.', c.id, 'PartGo', 'Universal', 169.9, 0, 25, 5, '/IMAGENES/TABLERO TACOMETRO + VELOCIMETRO (2).jpg', 0, 0, 0, 1 FROM categorias c WHERE c.nombre='Accesorios' LIMIT 1;
INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Tablero Tacometro + Velocimetro', 'Tablero Tacometro + Velocimetro para motocicleta.', c.id, 'PartGo', 'Universal', 177.8, 0, 6, 5, '/IMAGENES/TABLERO TACOMETRO + VELOCIMETRO.jpg', 0, 0, 0, 1 FROM categorias c WHERE c.nombre='Accesorios' LIMIT 1;
INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Tablero Wy125 (Tacom+Veloc) Electronic', 'Tablero Wy125 (Tacom+Veloc) Electronic para motocicleta.', c.id, 'PartGo', 'Universal', 183.0, 164.7, 9, 5, '/IMAGENES/TABLERO WY125 (TACOM+VELOC) ELECTRONIC.jpg', 1, 1, 0, 1 FROM categorias c WHERE c.nombre='Accesorios' LIMIT 1;
INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Tapa De Aceite Cromo', 'Tapa De Aceite Cromo para motocicleta.', c.id, 'PartGo', 'Universal', 190.9, 0, 12, 5, '/IMAGENES/TAPA DE ACEITE CROMO.jpg', 0, 0, 0, 1 FROM categorias c WHERE c.nombre='Aceites' LIMIT 1;
INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Zapata De Freno Crpton', 'Zapata De Freno Crpton para motocicleta.', c.id, 'PartGo', 'Universal', 198.8, 0, 15, 5, '/IMAGENES/ZAPATA DE FRENO CRPTON.jpg', 0, 0, 0, 1 FROM categorias c WHERE c.nombre='Frenos' LIMIT 1;
INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Zapata Freno Roja', 'Zapata Freno Roja para motocicleta.', c.id, 'PartGo', 'Universal', 24.0, 0, 18, 5, '/IMAGENES/ZAPATA FRENO ROJA.jpg', 0, 1, 0, 1 FROM categorias c WHERE c.nombre='Frenos' LIMIT 1;


-- ==============================
-- ARCHIVO: ACTUALIZAR_IMAGENES(1).sql
-- ==============================

USE repuestos_partgo;

UPDATE productos SET imagen='/IMAGENES/ACEITE LUBRICANTE 4T SAE 20W50 1.5L. X12BOT.jpg' WHERE id=1;
UPDATE productos SET imagen='/IMAGENES/ALTERNADOR 4P CGL.jpg' WHERE id=2;
UPDATE productos SET imagen='/IMAGENES/ARO CLLANTA 6.00-13(5H).jpg' WHERE id=3;
UPDATE productos SET imagen='/IMAGENES/BOBINA 12V.jpg' WHERE id=4;
UPDATE productos SET imagen='/IMAGENES/CABEZAL COMPLETO CXG200 S LEVAS.jpg' WHERE id=5;
UPDATE productos SET imagen='/IMAGENES/CAPUCHON DE BUJIA.jpg' WHERE id=6;
UPDATE productos SET imagen='/IMAGENES/ESPEJO UNIVERSAL FANTASMA DUKE AZUL - AZUL.jpg' WHERE id=7;
UPDATE productos SET imagen='/IMAGENES/FARO LED TIPO BUHO 3 LED.jpg' WHERE id=8;


-- ==============================
-- ARCHIVO: ACTUALIZAR_IMAGENES_Y_CHECKOUT_FINAL(1).sql
-- ==============================

USE repuestos_partgo;

-- Categorías necesarias
INSERT IGNORE INTO categorias (nombre, descripcion, estado)
VALUES
('Aceites','Aceites y lubricantes para motocicleta',1),
('Llantas','Llantas, aros y cámaras',1),
('Cascos','Cascos y seguridad',1),
('Frenos','Sistema de frenos',1),
('Baterías','Baterías y sistema eléctrico',1),
('Luces','Faros, focos y luces',1),
('Cadenas','Cadenas y transmisión',1),
('Motor','Motor y repuestos internos',1),
('Suspensión','Amortiguadores y barras',1),
('Accesorios','Accesorios generales',1);

-- Columnas necesarias para ecommerce y fotos reales
ALTER TABLE productos ADD COLUMN IF NOT EXISTS precio_oferta DECIMAL(10,2) DEFAULT 0;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS en_oferta TINYINT DEFAULT 0;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS es_nuevo TINYINT DEFAULT 0;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS destacado TINYINT DEFAULT 0;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS modelo VARCHAR(120) DEFAULT 'Universal';
ALTER TABLE productos ADD COLUMN IF NOT EXISTS marca VARCHAR(120) DEFAULT 'PartGo';
ALTER TABLE productos ADD COLUMN IF NOT EXISTS imagen VARCHAR(500) DEFAULT '';

ALTER TABLE ventas ADD COLUMN IF NOT EXISTS numero_comprobante VARCHAR(30) NULL;
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS metodo_pago VARCHAR(40) DEFAULT 'YAPE';
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS tipo_comprobante VARCHAR(30) DEFAULT 'BOLETA';
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS direccion_entrega VARCHAR(200) NULL;

ALTER TABLE detalle_ventas ADD COLUMN IF NOT EXISTS producto_nombre VARCHAR(150) NULL;
ALTER TABLE detalle_ventas ADD COLUMN IF NOT EXISTS producto_imagen VARCHAR(500) NULL;

-- Productos con imágenes reales. Usa subconsultas de categoría para evitar error de llave foránea.
INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Aceite Lubricante 4T25W-50 1Lt','Aceite lubricante para motocicleta de alto rendimiento.', c.id, 'Motul', 'Universal', 95.00, 0, 15, 5, '/IMAGENES/ACEITE LUBRICANTE 4T25W-50 1LT.jpg', 0, 1, 1, 1 FROM categorias c WHERE c.nombre='Aceites' LIMIT 1;

INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Amortiguador Negro WX150','Amortiguador de suspensión para motocicleta.', c.id, 'D’TIEX', 'WX150', 59.60, 0, 10, 3, '/IMAGENES/BARRA TELESCOPICA CARGUERO.jpg', 0, 1, 1, 1 FROM categorias c WHERE c.nombre='Suspensión' LIMIT 1;

INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Pastillas de freno delanteras','Repuesto de freno resistente para motocicleta.', c.id, 'Bajaj', 'Universal', 45.00, 0, 15, 5, '/IMAGENES/ZAPATA FRENO ROJA.jpg', 0, 1, 1, 1 FROM categorias c WHERE c.nombre='Frenos' LIMIT 1;

INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Cadena 428-114L','Cadena reforzada para transmisión.', c.id, 'Honda', '428', 80.00, 0, 12, 4, '/IMAGENES/CADENA 428-114L.jpg', 0, 1, 1, 1 FROM categorias c WHERE c.nombre='Cadenas' LIMIT 1;

INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Faro delantero redondo','Faro delantero para motocicleta.', c.id, 'PartGo', 'Redondo', 65.00, 0, 9, 3, '/IMAGENES/FARO DELANTERO REDONDO.jpg', 0, 1, 1, 1 FROM categorias c WHERE c.nombre='Luces' LIMIT 1;

INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Alternador 4P CGL','Alternador para sistema eléctrico de moto.', c.id, 'PartGo', 'CGL', 120.00, 0, 9, 3, '/IMAGENES/ALTERNADOR 4P CGL.jpg', 0, 1, 1, 1 FROM categorias c WHERE c.nombre='Motor' LIMIT 1;

INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Aro con Llanta 5.00-12','Aro con llanta para moto carguera.', c.id, 'PartGo', '5.00-12', 150.00, 0, 7, 3, '/IMAGENES/ARO CON LLANTA 5.00-12 (4H).jpg', 0, 1, 1, 1 FROM categorias c WHERE c.nombre='Llantas' LIMIT 1;

INSERT INTO productos (nombre, descripcion, categoria_id, marca, modelo, precio, precio_oferta, stock, stock_minimo, imagen, en_oferta, es_nuevo, destacado, estado)
SELECT 'Capuchón de bujía','Capuchón de bujía para motocicleta.', c.id, 'NGK', 'Universal', 28.00, 0, 18, 4, '/IMAGENES/CAPUCHON DE BUJIA.jpg', 0, 1, 1, 1 FROM categorias c WHERE c.nombre='Luces' LIMIT 1;

-- Corrige las imágenes de los primeros productos existentes para que no salgan emojis.
UPDATE productos SET imagen='/IMAGENES/ACEITE LUBRICANTE 4T25W-50 1LT.jpg', marca='Motul', modelo='Universal' WHERE id=1;
UPDATE productos SET imagen='/IMAGENES/BARRA TELESCOPICA CARGUERO.jpg', marca='D’TIEX', modelo='WX150' WHERE id=2;
UPDATE productos SET imagen='/IMAGENES/ZAPATA FRENO ROJA.jpg', marca='Bajaj', modelo='Universal' WHERE id=3;
UPDATE productos SET imagen='/IMAGENES/CADENA 428-114L.jpg', marca='Honda', modelo='428' WHERE id=4;
UPDATE productos SET imagen='/IMAGENES/FARO DELANTERO REDONDO.jpg', marca='PartGo', modelo='Redondo' WHERE id=5;
UPDATE productos SET imagen='/IMAGENES/ALTERNADOR 4P CGL.jpg', marca='PartGo', modelo='CGL' WHERE id=6;
UPDATE productos SET imagen='/IMAGENES/ARO CON LLANTA 5.00-12 (4H).jpg', marca='PartGo', modelo='5.00-12' WHERE id=7;
UPDATE productos SET imagen='/IMAGENES/CAPUCHON DE BUJIA.jpg', marca='NGK', modelo='Universal' WHERE id=8;

-- ACTUALIZAR TODAS LAS IMÁGENES
UPDATE productos SET imagen = '/IMAGENES/ABRILLANTADOR DE NEUMATICOS 600ML.jpg' WHERE nombre LIKE '%ABRILLANTADOR%';
UPDATE productos SET imagen = '/IMAGENES/ACEITE LUBRICANTE 4T SAE 20W50 1.5L. X12BOT.jpg' WHERE nombre LIKE '%20W50%' AND nombre LIKE '%1.5L%';
UPDATE productos SET imagen = '/IMAGENES/ACEITE LUBRICANTE 4T25W-50 1LT.jpg' WHERE nombre LIKE '%4T25W-50%';
UPDATE productos SET imagen = '/IMAGENES/ACEITE LUBRICANTE 4T25W-60 1L. EFFICIENCY.jpg' WHERE nombre LIKE '%EFFICIENCY%';
UPDATE productos SET imagen = '/IMAGENES/ACEITE LUBRICANTE. 4T SAE 25W60 1.5L..jpg' WHERE nombre LIKE '%25W60%';
UPDATE productos SET imagen = '/IMAGENES/ALTERNADOR 4P CGL.jpg' WHERE nombre LIKE '%ALTERNADOR 4P%';
UPDATE productos SET imagen = '/IMAGENES/ALTERNADOR C100C110 WXVE (6 POL).jpg' WHERE nombre LIKE '%C100C110%';
UPDATE productos SET imagen = '/IMAGENES/ALTERNADOR NEW POWER CXGWANX150.jpg' WHERE nombre LIKE '%NEW POWER%';
UPDATE productos SET imagen = '/IMAGENES/ARO CLLANTA 6.00-13(5H).jpg' WHERE nombre LIKE '%6.00-13%';
UPDATE productos SET imagen = CONCAT('/IMAGENES/', nombre, '.jpg') WHERE imagen IS NULL OR imagen = '' OR imagen LIKE '%placeholder%' OR imagen LIKE '%via%';
