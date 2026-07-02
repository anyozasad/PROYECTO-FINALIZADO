function getRgbNumbers(value) {
  const match = String(value || "").match(/\d+(\.\d+)?/g);
  if (!match || match.length < 3) return null;
  return match.slice(0, 3).map(Number);
}

function luminance(rgb) {
  if (!rgb) return 255;
  return (rgb[0] * 0.299) + (rgb[1] * 0.587) + (rgb[2] * 0.114);
}

function detectDoradaTheme() {
  const targets = [
    document.querySelector(".pg-public-main"),
    document.querySelector(".pg-app-main"),
    document.querySelector(".pg-public-root"),
    document.querySelector(".pg-app-root"),
    document.querySelector("main"),
    document.body
  ].filter(Boolean);

  let lum = 255;

  for (const el of targets) {
    const bg = getComputedStyle(el).backgroundColor;
    const rgb = getRgbNumbers(bg);
    if (rgb && !(rgb[0] === 0 && rgb[1] === 0 && rgb[2] === 0 && bg.includes("0)"))) {
      lum = luminance(rgb);
      break;
    }
  }

  const isDark = lum < 95;

  document.body.classList.toggle("dm-auto-dark", isDark);
  document.body.classList.toggle("dm-auto-light", !isDark);
}

window.addEventListener("load", detectDoradaTheme);
window.addEventListener("DOMContentLoaded", detectDoradaTheme);
setTimeout(detectDoradaTheme, 100);
setTimeout(detectDoradaTheme, 600);
setTimeout(detectDoradaTheme, 1200);

new MutationObserver(detectDoradaTheme).observe(document.documentElement, {
  attributes: true,
  attributeFilter: ["class", "data-theme", "style"]
});

new MutationObserver(detectDoradaTheme).observe(document.body, {
  attributes: true,
  attributeFilter: ["class", "data-theme", "style"]
});
