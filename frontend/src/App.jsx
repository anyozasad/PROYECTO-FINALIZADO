import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import PublicLayout from './components/PublicLayout';
import ProtectedRoute from './components/ProtectedRoute';

/* Páginas públicas (10 secciones) */
import Landing      from './pages/Landing';
import PubCategorias from './pages/PubCategorias';
import PubOfertas    from './pages/PubOfertas';
import PubProductos  from './pages/PubProductos';
import PubFavoritos  from './pages/PubFavoritos';
import PubPedidos    from './pages/PubPedidos';
import PubMensajes   from './pages/PubMensajes';
import PubPerfil     from './pages/PubPerfil';
import PubAjustes    from './pages/PubAjustes';
import PubReclamos   from './pages/PubReclamos';
import PubCalidad    from './pages/PubCalidad';
import PubCarrito    from './pages/PubCarrito';
import PubDirecciones from './pages/PubDirecciones';
import PubCheckout   from './pages/PubCheckout';
import PubBoleta     from './pages/PubBoleta';

/* Auth */
import Login             from './pages/Login';
import Registro          from './pages/Registro';
import RecuperarPassword from './pages/RecuperarPassword';
import ProductoDetalle   from './pages/ProductoDetalle';

/* Usuario autenticado */
import Home          from './pages/Home';
import Notificaciones from './pages/Notificaciones';
import Empresa        from './pages/Empresa';
import PedidosAdmin   from './pages/PedidosAdmin';
import Ofertas        from './pages/Ofertas';

/* Admin */
import Dashboard     from './pages/Dashboard';
import ProductosCrud from './pages/ProductosCrud';
import CategoriasCrud from './pages/CategoriasCrud';
import ClientesCrud  from './pages/ClientesCrud';
import Ventas        from './pages/Ventas';
import UsuariosCrud  from './pages/UsuariosCrud';
import RolesCrud     from './pages/RolesCrud';
import Marcas        from './pages/Marcas';
import Proveedores   from './pages/Proveedores';
import MetodosPago   from './pages/MetodosPago';
import Reclamos      from './pages/Reclamos';
import StockBajo     from './pages/StockBajo';
import MasVendidos   from './pages/MasVendidos';
import HistorialStock from './pages/HistorialStock';
import Auditoria     from './pages/Auditoria';
import GestionImagenes from './pages/GestionImagenes';

function AdminRoute({ children }) {
  const { usuario } = useAuth();
  const esAdmin = [1, 2].includes(Number(usuario?.rol_id));
  if (!esAdmin) return <Navigate to="/inicio" replace />;
  return children;
}

function ConfiguracionRoute() {
  const { usuario } = useAuth();
  const esAdmin = [1, 2].includes(Number(usuario?.rol_id));
  return esAdmin ? <Empresa /> : <PubAjustes />;
}

function PublicUserRoute({ children }) {
  const { isAuth } = useAuth();

  if (!isAuth) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function RootRoute() {
  const { isAuth, usuario, loading } = useAuth();
  const esAdmin = [1, 2].includes(Number(usuario?.rol_id));

  if (loading) {
    return null;
  }

  if (isAuth) {
    return <Navigate to={esAdmin ? '/dashboard' : '/inicio'} replace />;
  }

  return <Landing />;
}

export default function App() {
  return (
    <Routes>

      {/* ══ SITIO PÚBLICO (10 páginas con PublicLayout) ══ */}
      <Route element={<PublicLayout />}>
        <Route path="/"                  element={<RootRoute />} />
        <Route path="/s/categorias"      element={<PubCategorias />} />
        <Route path="/s/ofertas"         element={<PubOfertas />} />
        <Route path="/s/productos"       element={<PubProductos />} />
        <Route path="/s/favoritos"       element={<PublicUserRoute><PubFavoritos /></PublicUserRoute>} />
        <Route path="/s/pedidos"         element={<PublicUserRoute><PubPedidos /></PublicUserRoute>} />
        <Route path="/s/mensajes"        element={<PublicUserRoute><PubMensajes /></PublicUserRoute>} />
        <Route path="/s/perfil"          element={<PublicUserRoute><PubPerfil /></PublicUserRoute>} />
        <Route path="/s/ajustes"         element={<PublicUserRoute><PubAjustes /></PublicUserRoute>} />
        <Route path="/s/reclamaciones"   element={<PubReclamos />} />
        <Route path="/s/calidad"         element={<PubCalidad />} />
        <Route path="/s/carrito"         element={<PubCarrito />} />
        <Route path="/s/checkout"        element={<PubCheckout />} />
        <Route path="/s/boleta/:id"      element={<PubBoleta />} />
        <Route path="/producto/:id"       element={<ProductoDetalle />} />
      </Route>

      {/* ══ AUTH ══ */}
      <Route path="/login"              element={<Login />} />
      <Route path="/registro"           element={<Registro />} />
      <Route path="/recuperar-password" element={<RecuperarPassword />} />
      {/* ══ USUARIO AUTENTICADO ══ */}
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/inicio"           element={<Home />} />
        <Route path="/ofertas"          element={<PubOfertas />} />
        <Route path="/notificaciones"   element={<Notificaciones />} />
        <Route path="/configuracion"    element={<ConfiguracionRoute />} />
        <Route path="/mis-pedidos"      element={<PubPedidos />} />
        <Route path="/favoritos"        element={<PubFavoritos />} />
        <Route path="/perfil"           element={<PubPerfil />} />
        <Route path="/direcciones"      element={<PubDirecciones />} />
        <Route path="/carrito"          element={<PubCarrito />} />
        <Route path="/mensajes"         element={<PubMensajes />} />
        <Route path="/reclamaciones"    element={<PubReclamos />} />

        {/* ══ SOLO ADMIN ══ */}
        <Route path="/dashboard"        element={<AdminRoute><Dashboard /></AdminRoute>} />
        <Route path="/productos"        element={<AdminRoute><ProductosCrud /></AdminRoute>} />
        <Route path="/gestion-imagenes" element={<AdminRoute><GestionImagenes /></AdminRoute>} />
        <Route path="/categorias"       element={<AdminRoute><CategoriasCrud /></AdminRoute>} />
        <Route path="/clientes"         element={<AdminRoute><ClientesCrud /></AdminRoute>} />
        <Route path="/ventas"           element={<AdminRoute><Ventas /></AdminRoute>} />
        <Route path="/pedidos"          element={<AdminRoute><PedidosAdmin /></AdminRoute>} />
        <Route path="/reportes"         element={<AdminRoute><MasVendidos /></AdminRoute>} />
        <Route path="/usuarios"         element={<AdminRoute><UsuariosCrud /></AdminRoute>} />
        <Route path="/roles"            element={<AdminRoute><RolesCrud /></AdminRoute>} />
        <Route path="/empresa"          element={<AdminRoute><Empresa /></AdminRoute>} />
        <Route path="/marcas"           element={<AdminRoute><Marcas /></AdminRoute>} />
        <Route path="/proveedores"      element={<AdminRoute><Proveedores /></AdminRoute>} />
        <Route path="/metodos-pago"     element={<AdminRoute><MetodosPago /></AdminRoute>} />
        <Route path="/historial-stock"  element={<AdminRoute><HistorialStock /></AdminRoute>} />
        <Route path="/reclamos"         element={<AdminRoute><Reclamos /></AdminRoute>} />
        <Route path="/stock-bajo"       element={<AdminRoute><StockBajo /></AdminRoute>} />
        <Route path="/auditoria"        element={<AdminRoute><Auditoria /></AdminRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
