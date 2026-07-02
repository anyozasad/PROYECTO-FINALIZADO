function getRgbNumbers(value) {
  const match = String(value || "").match(/\d+(\.\d+)?/g);
  if (!match || match.length < 3) return null;
  return match.slice(0, 3).map(Number);
}

function luminance(rgb) {
  if (!rgb) return 255;
  return rgb[0] * 0.299 + rgb[1] * 0.587 + rgb[2] * 0.114;
}

function isTransparent(bg) {
  return !bg || bg === "transparent" || bg.includes("rgba(0, 0, 0, 0)");
}

function detectDoradaTheme() {
  const storedTheme =
    localStorage.getItem("theme") ||
    localStorage.getItem("tema") ||
    localStorage.getItem("modo") ||
    localStorage.getItem("preferenciaTema") ||
    "";

  const classText = `${document.documentElement.className} ${document.body.className}`.toLowerCase();

  let dark =
    storedTheme.toLowerCase().includes("dark") ||
    storedTheme.toLowerCase().includes("oscuro") ||
    classText.includes("dark") ||
    classText.includes("oscuro");

  if (!dark) {
    const targets = [
      document.querySelector(".pg-public-main"),
      document.querySelector(".pg-app-main"),
      document.querySelector(".pg-public-root"),
      document.querySelector(".pg-app-root"),
      document.querySelector("main"),
      document.body,
      document.documentElement
    ].filter(Boolean);

    for (const el of targets) {
      const bg = getComputedStyle(el).backgroundColor;
      if (isTransparent(bg)) continue;

      const rgb = getRgbNumbers(bg);
      if (!rgb) continue;

      dark = luminance(rgb) < 130;
      break;
    }
  }

  document.body.classList.toggle("dm-theme-dark", dark);
  document.body.classList.toggle("dm-theme-light", !dark);
}

function setupDoradaSidebar() {
  const sidebars = document.querySelectorAll(".pg-public-scroll, .pg-app-sidebar");

  sidebars.forEach((sidebar) => {
    sidebar.querySelectorAll(
      ".pg-sidebar-toggle-btn, .pg-sidebar-toggle, .pg-sidebar-edge, .pg-sidebar-resizer, .pg-sidebar-hitbox, .pg-sidebar-handle, .dm-sidebar-toggle-old"
    ).forEach((el) => el.remove());

    if (sidebar.querySelector(".dm-sidebar-toggle")) return;

    sidebar.classList.add("dm-sidebar-ready");

    const root =
      sidebar.closest(".pg-public-root, .pg-app-root") ||
      document.querySelector(".pg-public-root, .pg-app-root");

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "dm-sidebar-toggle";
    btn.innerHTML = "‹";
    btn.title = "Minimizar menú";

    const storageKey = sidebar.classList.contains("pg-app-sidebar")
      ? "dm_admin_sidebar_collapsed"
      : "dm_user_sidebar_collapsed";

    function applyState(collapsed) {
      sidebar.classList.toggle("dm-collapsed", collapsed);
      document.body.classList.toggle("dm-sidebar-is-collapsed", collapsed);
      root?.classList.toggle("dm-sidebar-is-collapsed", collapsed);

      btn.innerHTML = collapsed ? "›" : "‹";
      btn.title = collapsed ? "Expandir menú" : "Minimizar menú";
    }

    const saved = localStorage.getItem(storageKey) === "1";
    applyState(saved);

    btn.addEventListener("click", () => {
      const collapsed = !sidebar.classList.contains("dm-collapsed");
      applyState(collapsed);
      localStorage.setItem(storageKey, collapsed ? "1" : "0");
    });

    sidebar.appendChild(btn);
  });
}

function initDoradaFix() {
  detectDoradaTheme();
  setupDoradaSidebar();
}

window.addEventListener("DOMContentLoaded", initDoradaFix);
window.addEventListener("load", initDoradaFix);
window.addEventListener("resize", detectDoradaTheme);

setTimeout(initDoradaFix, 200);
setTimeout(initDoradaFix, 800);
setTimeout(initDoradaFix, 1500);

new MutationObserver(initDoradaFix).observe(document.body, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ["class", "data-theme", "style"]
});
