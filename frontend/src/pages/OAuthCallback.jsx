import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

export default function OAuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const procesarCallback = async () => {
      try {
        // Obtener código de la URL
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const error = params.get('error');

        if (error || !code) {
          setTimeout(() => navigate('/login'), 1000);
          return;
        }

        // Crear usuario OAuth
        const usuario = {
          id: Math.random(),
          nombre: 'Usuario OAuth',
          email: `oauth${Math.random()}@app.com`,
          rol_id: 3,
          provider: 'oauth'
        };

        const token = `token_${Math.random().toString(36).substr(2, 20)}`;

        // Guardar en localStorage
        localStorage.setItem('partgo_token', token);
        localStorage.setItem('partgo_usuario', JSON.stringify(usuario));

        // Esperar 1 segundo y redirigir a interfaz
        setTimeout(() => {
          if (Number(usuario.rol_id) === 3) {
            navigate('/cliente');
          } else {
            navigate('/dashboard');
          }
        }, 1000);

      } catch (error) {
        console.error('Error:', error);
        setTimeout(() => navigate('/login'), 2000);
      }
    };

    procesarCallback();
  }, [navigate]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontSize: '18px',
      color: '#333'
    }}>
      ✅ Iniciando sesión... Por favor espera...
    </div>
  );
}
