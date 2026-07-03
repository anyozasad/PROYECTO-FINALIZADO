(function () {
  function normalizar(texto) {
    return String(texto || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  }

  function marcarPanelDerecho() {
    const candidatos = Array.from(
      document.querySelectorAll("aside, section, div")
    );

    const encontrados = candidatos.filter((elemento) => {
      const texto = normalizar(elemento.textContent);

      return (
        texto.includes("mis pedidos") &&
        texto.includes("mas vendidos") &&
        (
          texto.includes("bienvenido a dorada") ||
          texto.includes("hola,")
        )
      );
    });

    if (!encontrados.length) return;

    /*
      Se toma el contenedor más pequeño que contiene:
      saludo + pedidos + descuento + más vendidos.
    */
    encontrados.sort(
      (a, b) =>
        a.querySelectorAll("*").length -
        b.querySelectorAll("*").length
    );

    const panel = encontrados[0];

    panel.classList.add("dm-home-right-panel");

    if (panel.parentElement) {
      panel.parentElement.classList.add("dm-home-layout-parent");
    }
  }

  function iniciar() {
    marcarPanelDerecho();

    const observer = new MutationObserver(() => {
      marcarPanelDerecho();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }

  window.addEventListener("load", marcarPanelDerecho);
})();