import { useState, useEffect } from 'react';
import { apiFetch } from '../services/api';
import Swal from 'sweetalert2';

export default function GestionImagenes() {
  const [imagenes, setImagenes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    cargarImagenes();
    cargarProductos();
  }, []);

  const cargarImagenes = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/imagenes');
      setImagenes(data);
    } catch (err) {
      Swal.fire('Error', 'No se pudieron cargar las imágenes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const cargarProductos = async () => {
    try {
      const data = await apiFetch('/productos');
      setProductos(data);
    } catch (err) {
      console.error('Error al cargar productos:', err);
    }
  };

  const asignarImagen = async () => {
    if (!selectedImage || !selectedProduct) {
      Swal.fire('Error', 'Selecciona imagen y producto', 'error');
      return;
    }

    try {
      await apiFetch('/imagenes/asignar', {
        method: 'POST',
        body: JSON.stringify({
          producto_id: selectedProduct,
          nombre_imagen: selectedImage.nombre
        })
      });

      Swal.fire('Éxito', 'Imagen asignada al producto', 'success');
      setSelectedImage(null);
      setSelectedProduct(null);
      cargarProductos();
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    }
  };

  const eliminarImagen = async (nombre) => {
    if (!confirm('¿Eliminar esta imagen?')) return;

    try {
      await apiFetch(`/imagenes/${nombre}`, { method: 'DELETE' });
      Swal.fire('Éxito', 'Imagen eliminada', 'success');
      cargarImagenes();
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    }
  };

  return (
    <div className="container mt-5">
      <h2>📸 Gestión de Imágenes de Productos</h2>

      <div className="row mt-4">
        {/* Panel de Imágenes */}
        <div className="col-md-6">
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h5>Imágenes Disponibles</h5>
            </div>
            <div className="card-body" style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {loading ? (
                <p>Cargando...</p>
              ) : imagenes.length === 0 ? (
                <p>No hay imágenes disponibles</p>
              ) : (
                <div className="row g-2">
                  {imagenes.map((img) => (
                    <div key={img.nombre} className="col-6">
                      <div
                        className={`card cursor-pointer ${
                          selectedImage?.nombre === img.nombre ? 'border-success' : 'border-light'
                        }`}
                        onClick={() => setSelectedImage(img)}
                        style={{ cursor: 'pointer' }}
                      >
                        <img
                          src={img.ruta}
                          alt={img.nombre}
                          style={{
                            height: '120px',
                            objectFit: 'cover',
                            borderRadius: '4px'
                          }}
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/120';
                          }}
                        />
                        <div className="card-body p-2">
                          <small className="text-truncate" title={img.nombre}>
                            {img.nombre.substring(0, 20)}...
                          </small>
                          <br />
                          <small className="text-muted">{(img.tamano / 1024).toFixed(1)} KB</small>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Panel de Asignación */}
        <div className="col-md-6">
          <div className="card">
            <div className="card-header bg-info text-white">
              <h5>Asignar a Producto</h5>
            </div>
            <div className="card-body">
              {selectedImage && (
                <div className="mb-3">
                  <label className="form-label">Imagen seleccionada:</label>
                  <img
                    src={selectedImage.ruta}
                    alt="seleccionada"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '200px',
                      borderRadius: '8px'
                    }}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/200';
                    }}
                  />
                  <p className="mt-2 text-muted small">{selectedImage.nombre}</p>
                </div>
              )}

              <div className="mb-3">
                <label className="form-label">Selecciona un producto:</label>
                <select
                  className="form-select"
                  value={selectedProduct || ''}
                  onChange={(e) => setSelectedProduct(parseInt(e.target.value))}
                >
                  <option value="">-- Elige un producto --</option>
                  {productos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} (ID: {p.id})
                    </option>
                  ))}
                </select>
              </div>

              <button
                className="btn btn-success w-100 mb-2"
                onClick={asignarImagen}
                disabled={!selectedImage || !selectedProduct}
              >
                ✅ Asignar Imagen
              </button>

              {selectedImage && (
                <button
                  className="btn btn-danger w-100"
                  onClick={() => eliminarImagen(selectedImage.nombre)}
                >
                  🗑️ Eliminar Imagen
                </button>
              )}
            </div>
          </div>

          {/* Preview de asignación */}
          <div className="card mt-3">
            <div className="card-header bg-secondary text-white">
              <h5>Vista Previa</h5>
            </div>
            <div className="card-body">
              {selectedImage && selectedProduct ? (
                (() => {
                  const producto = productos.find((p) => p.id === selectedProduct);
                  return (
                    <div className="row">
                      <div className="col-md-4">
                        <img
                          src={selectedImage.ruta}
                          alt="preview"
                          style={{
                            maxWidth: '100%',
                            maxHeight: '120px',
                            borderRadius: '8px'
                          }}
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/120';
                          }}
                        />
                      </div>
                      <div className="col-md-8">
                        <p>
                          <strong>{producto?.nombre}</strong>
                        </p>
                        <p className="text-muted small">{producto?.descripcion}</p>
                        <p>
                          <strong>Precio:</strong> ${producto?.precio}
                        </p>
                        <p>
                          <strong>Stock:</strong> {producto?.stock} unidades
                        </p>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <p className="text-muted">Selecciona imagen y producto para ver vista previa</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de asignaciones actuales */}
      <div className="card mt-4">
        <div className="card-header bg-warning text-dark">
          <h5>Productos con Imágenes Asignadas</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-sm table-hover">
              <thead className="table-light">
                <tr>
                  <th>ID</th>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th>Imagen Actual</th>
                  <th>Preview</th>
                </tr>
              </thead>
              <tbody>
                {productos
                  .filter((p) => p.imagen)
                  .slice(0, 10)
                  .map((p) => (
                    <tr key={p.id}>
                      <td>{p.id}</td>
                      <td>{p.nombre.substring(0, 30)}...</td>
                      <td>
                        <span className="badge bg-info">{p.categoria}</span>
                      </td>
                      <td className="text-muted small">{p.imagen.substring(0, 40)}...</td>
                      <td>
                        <img
                          src={p.imagen}
                          alt={p.nombre}
                          style={{
                            height: '40px',
                            borderRadius: '4px'
                          }}
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/40';
                          }}
                        />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
