const fs = require('fs');
const path = require('path');
const { query } = require('../config/db');

const IMAGENES_DIR = path.join(__dirname, '../../public/IMAGENES');

// GET - Listar todas las imágenes disponibles
exports.listarImagenes = async (req, res) => {
  try {
    if (!fs.existsSync(IMAGENES_DIR)) {
      fs.mkdirSync(IMAGENES_DIR, { recursive: true });
    }

    const archivos = fs.readdirSync(IMAGENES_DIR).filter(f => 
      /\.(jpg|jpeg|png|gif)$/i.test(f)
    );

    const imagenes = archivos.map(archivo => ({
      nombre: archivo,
      ruta: `/IMAGENES/${archivo}`,
      tamano: fs.statSync(path.join(IMAGENES_DIR, archivo)).size
    }));

    res.json(imagenes);
  } catch (err) {
    res.status(500).json({ error: 'Error al listar imágenes', detalle: err.message });
  }
};

// POST - Asignar imagen a producto
exports.asignarImagenProducto = async (req, res) => {
  try {
    const { producto_id, nombre_imagen } = req.body;

    if (!producto_id || !nombre_imagen) {
      return res.status(400).json({ error: 'Producto e imagen requeridos' });
    }

    // Verificar que la imagen existe
    const imagenPath = path.join(IMAGENES_DIR, nombre_imagen);
    if (!fs.existsSync(imagenPath)) {
      return res.status(404).json({ error: 'Imagen no encontrada' });
    }

    // Actualizar producto con la imagen
    const ruta = `/IMAGENES/${nombre_imagen}`;
    await query(
      'UPDATE productos SET imagen = ? WHERE id = ?',
      [ruta, producto_id]
    );

    res.json({ 
      success: true, 
      mensaje: 'Imagen asignada al producto',
      ruta: ruta 
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al asignar imagen', detalle: err.message });
  }
};

// DELETE - Eliminar imagen del archivo (admin solo)
exports.eliminarImagen = async (req, res) => {
  try {
    const { nombre_imagen } = req.params;

    const imagenPath = path.join(IMAGENES_DIR, nombre_imagen);
    if (!fs.existsSync(imagenPath)) {
      return res.status(404).json({ error: 'Imagen no encontrada' });
    }

    // Primero desasociar de productos
    await query('UPDATE productos SET imagen = NULL WHERE imagen LIKE ?', 
      [`%${nombre_imagen}%`]
    );

    // Eliminar archivo
    fs.unlinkSync(imagenPath);

    res.json({ success: true, mensaje: 'Imagen eliminada' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar imagen', detalle: err.message });
  }
};

// GET - Obtener imagen específica
exports.obtenerImagen = (req, res) => {
  try {
    const { nombre } = req.params;
    const imagenPath = path.join(IMAGENES_DIR, nombre);

    if (!fs.existsSync(imagenPath)) {
      return res.status(404).json({ error: 'Imagen no encontrada' });
    }

    res.sendFile(imagenPath);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener imagen', detalle: err.message });
  }
};
