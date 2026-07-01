import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { PreferenciasProvider } from './context/PreferenciasContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import './styles.css';
import './presentacion-final.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthProvider>
      <ThemeProvider>
        <PreferenciasProvider>
          <App />
        </PreferenciasProvider>
      </ThemeProvider>
    </AuthProvider>
  </BrowserRouter>
);




