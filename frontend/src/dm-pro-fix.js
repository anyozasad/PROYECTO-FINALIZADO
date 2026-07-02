(function () {
  const SIDEBAR_SELECTOR = ".pg-public-scroll, .pg-app-sidebar";
  const ROOT_SELECTOR = ".pg-public-root, .pg-app-root";
  const MAIN_SELECTOR = ".pg-public-main, .pg-app-main, main";

  function rgbToArr(rgb) {
    const m = String(rgb || "").match(/\d+/g);
    return m && m.length >= 3 ? [parseInt(m[0]), parseInt(m[1]), parseInt(m[2])] : null;
  }

  function getLum(rgb) {
    if (!rgb) return 255;
    return (rgb[0] * 0.299) + (rgb[1] * 0.587) + (rgb[2] * 0.114);
  }

  function detectTheme() {
    const classes = `${document.documentElement.className} ${document.body.className}`.toLowerCase();
    const storageTheme = (
      localStorage.getItem("theme") ||
      localStorage.getItem("tema") ||
      localStorage.getItem("modo") ||
      localStorage.getItem("preferenciaTema") ||
      ""
    ).toLowerCase();

    let dark =
      classes.includes("dark") ||
      classes.includes("oscuro") ||
      storageTheme.includes("dark") ||
      storageTheme.includes("oscuro");

    if (!dark) {
      const samples = [
        document.querySelector(".pg-public-main"),
        document.querySelector(".pg-app-main"),
        document.querySelector("main"),
        document.body
      ].filter(Boolean);

      for (const el of samples) {
        const bg = getComputedStyle(el).backgroundColor;
        if (!bg || bg === "transparent" || bg.includes("rgba(0, 0, 0, 0)")) continue;
        const rgb = rgbToArr(bg);
        if (!rgb) continue;
        dark = getLum(rgb) < 140;
        break;
      }
    }

    document.body.classList.toggle("dm-theme-dark", dark);
    document.body.classList.toggle("dm-theme-light", !dark);
  }

  function cleanBrokenNodes(sidebar) {
    // elimina botones/resizers viejos
    sidebar.querySelectorAll(
      ".pg-sidebar-toggle-btn, .pg-sidebar-toggle, .pg-sidebar-edge, .pg-sidebar-resizer, .pg-sidebar-hitbox, .pg-sidebar-handle, .dm-sidebar-toggle, .dm-sidebar-toggle-old"
    ).forEach(el => el.remove());

    // limpia nodos de texto basura directos
    [...sidebar.childNodes].forEach(node => {
      if (node.nodeType === 3 && node.textContent.trim()) {
        node.textContent = "";
      }
    });
  }

  function applyCollapse(sidebar, collapsed) {
    const root = sidebar.closest(ROOT_SELECTOR);
    const main = root ? root.querySelector(MAIN_SELECTOR) : null;

    sidebar.classList.toggle("dm-pro-collapsed", collapsed);
    root && root.classList.toggle("dm-pro-sidebar-collapsed", collapsed);
    main && main.classList.toggle("dm-pro-main-expanded", collapsed);
    document.body.classList.toggle("dm-pro-sidebar-collapsed", collapsed);
  }

  function buildToggle(sidebar) {
    if (sidebar.querySelector(".dm-pro-toggle")) return;

    cleanBrokenNodes(sidebar);

    const isAdmin = sidebar.classList.contains("pg-app-sidebar");
    const storageKey = isAdmin
      ? "dm_admin_sidebar_collapsed"
      : "dm_user_sidebar_collapsed";

    const root = sidebar.closest(ROOT_SELECTOR);
    root && root.classList.add("dm-pro-root-ready");
    sidebar.classList.add("dm-pro-sidebar-ready");

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "dm-pro-toggle";
    btn.setAttribute("aria-label", "Minimizar menú");
    btn.innerHTML = '<span class="dm-pro-toggle-icon">❮</span>';

    const saved = localStorage.getItem(storageKey) === "1";
    applyCollapse(sidebar, saved);
    btn.title = saved ? "Expandir menú" : "Minimizar menú";
    btn.classList.toggle("is-collapsed", saved);

    btn.addEventListener("click", () => {
      const collapsed = !sidebar.classList.contains("dm-pro-collapsed");
      applyCollapse(sidebar, collapsed);
      btn.classList.toggle("is-collapsed", collapsed);
      btn.title = collapsed ? "Expandir menú" : "Minimizar menú";
      btn.innerHTML = `<span class="dm-pro-toggle-icon">${collapsed ? "❯" : "❮"}</span>`;
      localStorage.setItem(storageKey, collapsed ? "1" : "0");
    });

    if (saved) {
      btn.innerHTML = '<span class="dm-pro-toggle-icon">❯</span>';
    }

    sidebar.appendChild(btn);
  }

  function initSidebarFix() {
    detectTheme();
    document.querySelectorAll(SIDEBAR_SELECTOR).forEach(buildToggle);
  }

  window.addEventListener("DOMContentLoaded", initSidebarFix);
  window.addEventListener("load", initSidebarFix);
  window.addEventListener("resize", detectTheme);

  setTimeout(initSidebarFix, 250);
  setTimeout(initSidebarFix, 800);
  setTimeout(initSidebarFix, 1500);

  new MutationObserver(() => {
    initSidebarFix();
  }).observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class", "style", "data-theme"]
  });
})();
