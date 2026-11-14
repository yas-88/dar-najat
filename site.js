/* Dar Najat shared behavior: reveal on scroll, number count-up, top bar shadow.
   Everything here is optional polish. Pages read fine without it. */
(function () {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Reveal: items that arrive together come in one after another.
  var items = document.querySelectorAll(".reveal");
  if (reduce || !("IntersectionObserver" in window)) {
    items.forEach(function (el) { el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      var n = 0;
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.style.setProperty("--d", (n++ * 80) + "ms");
        e.target.classList.add("in");
        io.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    items.forEach(function (el) { io.observe(el); });
  }

  // Count a number up to its value. Falls back to setting it at once.
  window.darCount = function (el, to) {
    var from = parseInt(String(el.textContent).replace(/[^0-9]/g, ""), 10) || 0;
    if (reduce || from === to || !window.requestAnimationFrame) { el.textContent = to.toLocaleString("en-US"); return; }
    var t0 = null, dur = 1100;
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(from + (to - from) * e).toLocaleString("en-US");
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  };

  // Light and dark. Follows the phone until someone taps the switch; the choice
  // is then kept on this device only.
  var root = document.documentElement, tb = document.getElementById("theme-btn");
  function label() { if (tb) tb.setAttribute("aria-label", root.getAttribute("data-theme") === "dark" ? "Switch to light mode" : "Switch to dark mode"); }
  if (tb) tb.addEventListener("click", function () {
    var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("dn_theme", next); } catch (e) {}
    label();
  });
  label();
  if (window.matchMedia) {
    var mq = window.matchMedia("(prefers-color-scheme: dark)");
    var follow = function (e) {
      var saved = null; try { saved = localStorage.getItem("dn_theme"); } catch (x) {}
      if (saved !== "light" && saved !== "dark") { root.setAttribute("data-theme", e.matches ? "dark" : "light"); label(); }
    };
    if (mq.addEventListener) mq.addEventListener("change", follow); else if (mq.addListener) mq.addListener(follow);
  }

  var bar = document.querySelector(".topbar");
  if (bar) {
    var onScroll = function () { bar.classList.toggle("scrolled", window.scrollY > 8); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }
})();
