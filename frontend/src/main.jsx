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
import './tipografia-tesis.css';

// ===============================
// Toggle sidebar Dorada Motor’s
// Usuario + Admin
// ===============================
function setupPartGoSidebarToggle() {
  const SIDEBAR_SELECTOR = ".pg-public-scroll, .pg-app-sidebar";

  const addToggle = () => {
    document.querySelectorAll(SIDEBAR_SELECTOR).forEach((sidebar) => {
      if (sidebar.querySelector(".pg-sidebar-toggle-btn")) return;

      const root = sidebar.closest(".pg-public-root, .pg-app-root");

      sidebar.classList.add("pg-sidebar-with-toggle");

      const isAdmin = sidebar.classList.contains("pg-app-sidebar");
      const storageKey = isAdmin
        ? "partgo_admin_sidebar_min"
        : "partgo_user_sidebar_min";

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "pg-sidebar-toggle-btn";

      const saved = localStorage.getItem(storageKey) === "1";

      if (saved) {
        sidebar.classList.add("pg-sidebar-minimized");
        root?.classList.add("pg-sidebar-is-collapsed");
        btn.innerHTML = "›";
        btn.title = "Expandir menú";
      } else {
        btn.innerHTML = "‹";
        btn.title = "Minimizar menú";
      }

      btn.addEventListener("click", () => {
        const minimized = sidebar.classList.toggle("pg-sidebar-minimized");

        root?.classList.toggle("pg-sidebar-is-collapsed", minimized);

        btn.innerHTML = minimized ? "›" : "‹";
        btn.title = minimized ? "Expandir menú" : "Minimizar menú";

        localStorage.setItem(storageKey, minimized ? "1" : "0");
      });

      sidebar.appendChild(btn);
    });
  };

  addToggle();
  setTimeout(addToggle, 300);
  setTimeout(addToggle, 1000);

  const observer = new MutationObserver(addToggle);

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", setupPartGoSidebarToggle);
  } else {
    setupPartGoSidebarToggle();
  }
}

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

