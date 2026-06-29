import { useState } from 'react';
import Swal from 'sweetalert2';

export default function Productos() {
  const [tab, setTab] = useState('listado');
  const [form, setForm] = useState({
    nombre: '',
    categoria_id: '',
    precio: '',
    stock: '',
    imagen_url: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleGuardar = async () => {
    if (!form.nombre || !form.categoria_id || !form.precio || !form.stock || !form.imagen_url) {
      Swal.fire('Error', 'Todos los campos son requeridos', 'error');
      return;
    }
    Swal.fire('Éxito', 'Producto agregado correctamente', 'success');
    setForm({ nombre: '', categoria_id: '', precio: '', stock: '', imagen_url: '' });
    setTab('listado');
  };

  return (
    <div className="container-fluid p-4">
      <div className="row mb-4">
        <div className="col-md-8">
          <h1>Productos / Repuestos</h1>
          <p className="text-muted">Administra stock, imágenes, ofertas y productos nuevos para la tienda del cliente.</p>
        </div>
        <div className="col-md-4 text-end">
          <input type="text" className="form-control" placeholder="Buscar repuesto..." />
        </div>
      </div>

      <div className="mb-3">
        <button
          className={`btn ${tab === 'listado' ? 'btn-dark' : 'btn-outline-dark'} me-2`}
          onClick={() => setTab('listado')}
        >
          📋 Listado
        </button>
        <button
          className={`btn ${tab === 'agregar' ? 'btn-dark' : 'btn-outline-dark'}`}
          onClick={() => setTab('agregar')}
        >
          ➕ Agregar
        </button>
      </div>

      {tab === 'listado' && (
        <div className="card">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>Imagen</th>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th>Precio</th>
                  <th>Stock</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan="6" className="text-center text-muted py-4">
                    No hay productos
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'agregar' && (
        <div className="card" style={{ maxWidth: '600px' }}>
          <div className="card-body">
            <h5 className="mb-4">Agregar Producto</h5>

            <div className="mb-3">
              <label className="form-label fw-bold">Nombre del Producto *</label>
              <input
                type="text"
                className="form-control"
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                placeholder="ej: Filtro de aire"
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-bold">Categoría *</label>
              <select
                className="form-control"
                name="categoria_id"
                value={form.categoria_id}
                onChange={handleChange}
              >
                <option value="">Selecciona</option>
                <option value="1">Motor</option>
                <option value="2">Llantas</option>
                <option value="3">Accesorios</option>
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label fw-bold">Precio *</label>
              <input
                type="number"
                className="form-control"
                name="precio"
                value={form.precio}
                onChange={handleChange}
                placeholder="0.00"
                step="0.01"
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-bold">Stock *</label>
              <input
                type="number"
                className="form-control"
                name="stock"
                value={form.stock}
                onChange={handleChange}
                placeholder="0"
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-bold">URL Imagen *</label>
              <input
                type="text"
                className="form-control"
                name="imagen_url"
                value={form.imagen_url}
                onChange={handleChange}
                placeholder="https://ejemplo.com/imagen.jpg"
              />
              {form.imagen_url && (
                <img src={form.imagen_url} alt="preview" style={{ maxWidth: '150px', marginTop: '10px', borderRadius: '4px' }} />
              )}
            </div>

            <div className="d-flex gap-2">
              <button className="btn btn-outline-dark flex-grow-1" onClick={() => setTab('listado')}>
                Cancelar
              </button>
              <button className="btn btn-dark flex-grow-1" onClick={handleGuardar}>
                ✓ Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
