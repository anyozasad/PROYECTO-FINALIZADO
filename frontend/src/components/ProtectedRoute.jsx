import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isAuth, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#1a1a2e'}}>
        <div style={{color:'white', fontSize:'18px'}}>Cargando...</div>
      </div>
    );
  }
  
  return isAuth ? children : <Navigate to="/login" replace />;
}
