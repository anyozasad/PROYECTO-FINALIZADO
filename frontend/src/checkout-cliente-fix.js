(function () {
  function limpiarTexto(el) {
    return String(el && el.textContent ? el.textContent : '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  function buscarTexto(valor) {
    return Array.from(document.querySelectorAll('h1,h2,h3,h4,strong,b,span,p'))
      .find(function (el) {
        return limpiarTexto(el).includes(valor);
      });
  }

  function buscarTarjetaDesdeTitulo(titulo) {
    if (!titulo) return null;

    var actual = titulo.parentElement;

    while (actual && actual !== document.body) {
      var inputs = actual.querySelectorAll('input, select, textarea').length;
      var botones = actual.querySelectorAll('button').length;

      if (inputs >= 2 || botones >= 2) {
        return actual;
      }

      actual = actual.parentElement;
    }

    return null;
  }

  function contenedorComun(a, b) {
    if (!a || !b) return null;

    var candidatos = Array.from(document.querySelectorAll('main,section,article,div'))
      .filter(function (el) {
        return el.contains(a) && el.contains(b);
      });

    candidatos.sort(function (x, y) {
      return x.querySelectorAll('*').length - y.querySelectorAll('*').length;
    });

    return candidatos[0] || null;
  }

  function aplicar() {
    if (!location.pathname.includes('/s/checkout')) return;

    var tituloDatos = buscarTexto('datos del cliente');
    var tituloEntrega = buscarTexto('entrega');
    var tituloPago = buscarTexto('pago y comprobante');
    var tituloResumen = buscarTexto('resumen');

    var tarjeta =
      buscarTarjetaDesdeTitulo(tituloDatos) ||
      buscarTarjetaDesdeTitulo(tituloEntrega) ||
      buscarTarjetaDesdeTitulo(tituloPago);

    var resumen = buscarTarjetaDesdeTitulo(tituloResumen);

    if (!tarjeta || !resumen) return;

    var layout = contenedorComun(tarjeta, resumen);

    if (!layout) return;

    layout.classList.add('dm-checkout-layout-fix');
    tarjeta.classList.add('dm-checkout-card-fix');
    resumen.classList.add('dm-checkout-summary-fix');

    var controles = Array.from(tarjeta.querySelectorAll('input, select, textarea'));

    controles.forEach(function (control) {
      control.classList.add('dm-checkout-control-fix');

      if (control.parentElement) {
        control.parentElement.classList.add('dm-checkout-field-fix');
      }
    });

    var formCandidato = Array.from(tarjeta.querySelectorAll('div'))
      .filter(function (div) {
        return controles.length >= 2 && controles.every(function (control) {
          return div.contains(control);
        });
      });

    formCandidato.sort(function (a, b) {
      return a.querySelectorAll('*').length - b.querySelectorAll('*').length;
    });

    if (formCandidato[0]) {
      formCandidato[0].classList.add('dm-checkout-form-fix');
    }
  }

  function iniciar() {
    aplicar();
    setTimeout(aplicar, 300);
    setTimeout(aplicar, 800);
    setTimeout(aplicar, 1500);

    new MutationObserver(aplicar).observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
