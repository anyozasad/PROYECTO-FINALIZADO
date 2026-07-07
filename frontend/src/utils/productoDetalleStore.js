const KEY =
  'partgo_producto_detalle_seleccionado';

function obtenerIdProducto(producto) {
  return (
    producto?.id ??
    producto?.producto_id ??
    producto?.id_producto ??
    null
  );
}

export function abrirDetalleProducto(
  navigate,
  producto
) {
  const id = obtenerIdProducto(producto);

  if (
    id === null ||
    id === undefined ||
    id === ''
  ) {
    return;
  }

  const seleccionado = {
    ...producto,
    id,
  };

  try {
    sessionStorage.setItem(
      KEY,
      JSON.stringify(seleccionado)
    );
  } catch {
    // React Router conserva igualmente el producto.
  }

  navigate(`/producto/${id}`, {
    state: {
      producto: seleccionado,
    },
  });
}

export function obtenerProductoDetalleGuardado(
  id,
  productoState
) {
  const coincide = (producto) => {
    const productoId =
      obtenerIdProducto(producto);

    return (
      producto &&
      String(productoId) === String(id)
    );
  };

  if (coincide(productoState)) {
    return productoState;
  }

  try {
    const guardado = JSON.parse(
      sessionStorage.getItem(KEY) ||
      'null'
    );

    if (coincide(guardado)) {
      return guardado;
    }
  } catch {
    // Contin?a con la consulta normal.
  }

  return null;
}
