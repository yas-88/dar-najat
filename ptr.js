/* Pull to refresh, shared by every page.
   A page can define window.darRefresh = async function () {...} to refresh its
   own data in place. Pages without one simply reload. */
(function () {
  var THRESHOLD = 72;   // px of pull needed to trigger
  var MAX = 110;        // px the indicator can travel
  var startY = 0, pull = 0, pulling = false, busy = false;

  var el = document.createElement("div");
  el.className = "ptr";
  el.setAttribute("aria-hidden", "true");
  el.innerHTML = '<img src="mark-on-navy.svg" alt="">';
  document.body.appendChild(el);

  var live = document.createElement("p");
  live.className = "sr-only";
  live.setAttribute("aria-live", "polite");
  document.body.appendChild(live);

  function setPos(px) {
    el.style.transform = "translate(-50%, " + (px - 56) + "px) rotate(" + (px * 2.2) + "deg)";
    el.style.opacity = Math.min(1, px / THRESHOLD);
  }

  function reset() {
    el.classList.remove("spin");
    el.style.transition = "transform .25s ease, opacity .25s ease";
    setPos(0);
    setTimeout(function () { el.style.transition = ""; }, 260);
  }

  async function run() {
    busy = true;
    el.classList.add("spin");
    el.style.transform = "translate(-50%, 18px)";
    el.style.opacity = 1;
    try {
      if (typeof window.darRefresh === "function") {
        await window.darRefresh();
        live.textContent = "Updated";
      } else {
        location.reload();
        return;
      }
    } catch (e) {}
    busy = false;
    reset();
  }

  window.addEventListener("touchstart", function (e) {
    if (busy || window.scrollY > 0 || e.touches.length !== 1) return;
    startY = e.touches[0].clientY;
    pulling = true;
    pull = 0;
  }, { passive: true });

  window.addEventListener("touchmove", function (e) {
    if (!pulling) return;
    var dy = e.touches[0].clientY - startY;
    if (dy <= 0 || window.scrollY > 0) { pull = 0; setPos(0); return; }
    pull = Math.min(MAX, dy * 0.5);
    setPos(pull);
  }, { passive: true });

  window.addEventListener("touchend", function () {
    if (!pulling) return;
    pulling = false;
    if (pull >= THRESHOLD * 0.5 + 20) run(); else reset();
  });
})();
