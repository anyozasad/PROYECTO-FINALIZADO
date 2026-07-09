(function () {
  function texto(el) {
    return String(el && el.textContent ? el.textContent : '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  function buscarTexto(valor) {
    return Array.from(document.querySelectorAll('h1,h2,h3,h4,strong,b,span,p,label'))
      .find(function (el) {
        return texto(el).includes(valor);
      });
  }

  function buscarCheckoutCard() {
    var titulo =
      buscarTexto('datos del cliente') ||
      buscarTexto('entrega') ||
      buscarTexto('pago y comprobante');

    if (!titulo) return null;

    var actual = titulo.parentElement;

    while (actual && actual !== document.body) {
      var controles = actual.querySelectorAll('input,select,textarea').length;
      var botones = actual.querySelectorAll('button').length;
      var rect = actual.getBoundingClientRect();

      if (
        rect.width > 320 &&
        rect.height > 150 &&
        (controles >= 2 || botones >= 2)
      ) {
        return actual;
      }

      actual = actual.parentElement;
    }

    return null;
  }

  function buscarResumenCard() {
    var titulo = buscarTexto('resumen');

    if (!titulo) return null;

    var actual = titulo.parentElement;

    while (actual && actual !== document.body) {
      var t = texto(actual);
      var rect = actual.getBoundingClientRect();

      if (
        rect.width > 230 &&
        rect.height > 150 &&
        t.includes('subtotal') &&
        t.includes('total')
      ) {
        return actual;
      }

      actual = actual.parentElement;
    }

    return null;
  }

  function buscarLayout(a, b) {
    if (!a || !b) return null;

    var actual = a.parentElement;

    while (actual && actual !== document.body) {
      if (actual.contains(b)) {
        return actual;
      }

      actual = actual.parentElement;
    }

    return null;
  }

  function marcarFormulario(card) {
    var controles = Array.from(card.querySelectorAll('input,select,textarea'));

    controles.forEach(function (control, index) {
      control.classList.add('dm-control-ok');

      if (control.parentElement) {
        control.parentElement.classList.add('dm-field-ok');
        control.parentElement.setAttribute('data-dm-field', String(index + 1));
      }
    });

    var grids = Array.from(card.querySelectorAll('div'))
      .filter(function (div) {
        if (controles.length < 2) return false;

        return controles.every(function (control) {
          return div.contains(control);
        });
      })
      .sort(function (a, b) {
        return a.querySelectorAll('*').length - b.querySelectorAll('*').length;
      });

    if (grids[0]) {
      grids[0].classList.add('dm-form-ok');
    }
  }

  function aplicar() {
    if (!location.pathname.includes('/s/checkout')) return;

    var card = buscarCheckoutCard();
    var resumen = buscarResumenCard();

    if (!card || !resumen) return;

    var layout = buscarLayout(card, resumen);

    if (!layout) return;

    layout.classList.add('dm-layout-ok');
    card.classList.add('dm-card-ok');
    resumen.classList.add('dm-summary-ok');

    var main = card.closest('main') || layout.closest('main');

    if (main) {
      main.classList.add('dm-page-ok');
    }

    marcarFormulario(card);
  }

  function iniciar() {
    aplicar();
    setTimeout(aplicar, 250);
    setTimeout(aplicar, 700);
    setTimeout(aplicar, 1200);
    setTimeout(aplicar, 2000);

    new MutationObserver(aplicar).observe(document.body, {
      childList: true,
      subtree: true
    });

    window.addEventListener('resize', aplicar);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
