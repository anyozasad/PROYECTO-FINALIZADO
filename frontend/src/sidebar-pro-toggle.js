function setupDoradaSidebarButton() {
  const sidebar =
    document.querySelector(".pg-public-scroll") ||
    document.querySelector(".pg-app-sidebar") ||
    document.querySelector(".sidebar") ||
    document.querySelector("aside");

  if (!sidebar) return;
  if (sidebar.querySelector(".dm-sidebar-toggle")) return;

  sidebar.classList.add("dm-sidebar-ready");

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "dm-sidebar-toggle";
  btn.setAttribute("aria-label", "Minimizar menú");
  btn.innerHTML = "‹";

  const saved = localStorage.getItem("dm_sidebar_collapsed") === "1";
  if (saved) {
    sidebar.classList.add("dm-sidebar-collapsed");
    document.body.classList.add("dm-sidebar-is-collapsed");
    btn.innerHTML = "›";
  }

  btn.addEventListener("click", function () {
    const collapsed = sidebar.classList.toggle("dm-sidebar-collapsed");
    document.body.classList.toggle("dm-sidebar-is-collapsed", collapsed);
    localStorage.setItem("dm_sidebar_collapsed", collapsed ? "1" : "0");
    btn.innerHTML = collapsed ? "›" : "‹";
    btn.setAttribute("aria-label", collapsed ? "Expandir menú" : "Minimizar menú");
  });

  sidebar.appendChild(btn);
}

window.addEventListener("DOMContentLoaded", setupDoradaSidebarButton);
window.addEventListener("load", setupDoradaSidebarButton);
setTimeout(setupDoradaSidebarButton, 300);
setTimeout(setupDoradaSidebarButton, 900);

new MutationObserver(setupDoradaSidebarButton).observe(document.body, {
  childList: true,
  subtree: true
});
