/* The "Need a meal?" page, in English (help.html) and Spanish (ayuda.html).
   The page's <html lang> picks the words. */
(function () {
  var lang = document.documentElement.lang === "es" ? "es" : "en";
  var T = {
    en: {
      read: "Read this to me", stop: "Stop reading", copied: "Link copied", voice: "en-US",
      shareTitle: "Need a meal?", shareText: "Free food, shelter, and someone to talk to. Numbers that are free to call.",
      cold: "Cold tonight", hot: "Very hot today", today: "Today",
      wx: function (hi, lo, U, rain) { return "High " + hi + U + ", low " + lo + U + (rain != null ? ", " + rain + "% chance of rain" : "") + "."; },
      coldTip: " Ask the Housing Hotline or 2-1-1 about a warm place tonight.", hotTip: " Ask 2-1-1 about a cooling center, and drink water.",
      send: "Send", sending: "Sending…", thanks: "Thank you. People who bring food will see this.",
      again: "You told us today. You can tell us again tomorrow.", fail: "That did not send. Check your signal and try again.",
      tallyK: "Asked for most, last 30 days"
    },
    es: {
      read: "Léamelo", stop: "Dejar de leer", copied: "Enlace copiado", voice: "es-US",
      shareTitle: "¿Necesita comida?", shareText: "Comida gratis, refugio y alguien con quien hablar. Números gratis para llamar.",
      cold: "Noche fría", hot: "Mucho calor hoy", today: "Hoy",
      wx: function (hi, lo, U, rain) { return "Máxima " + hi + U + ", mínima " + lo + U + (rain != null ? ", " + rain + "% de probabilidad de lluvia" : "") + "."; },
      coldTip: " Pregunte a la Línea de Vivienda o al 2-1-1 por un lugar cálido para esta noche.", hotTip: " Pregunte al 2-1-1 por un centro de enfriamiento, y tome agua.",
      send: "Enviar", sending: "Enviando…", thanks: "Gracias. Quienes traen comida verán esto.",
      again: "Ya nos lo dijo hoy. Puede decírnoslo otra vez mañana.", fail: "No se envió. Revise su señal e intente de nuevo.",
      tallyK: "Lo más pedido, últimos 30 días"
    }
  }[lang];
  var $ = function (id) { return document.getElementById(id); };
  function load(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }

  // Bigger text, remembered on this phone only.
  var big = $("t-big");
  function syncBig() { big.setAttribute("aria-pressed", document.documentElement.classList.contains("big") ? "true" : "false"); }
  big.addEventListener("click", function () {
    var on = document.documentElement.classList.toggle("big");
    try { localStorage.setItem("dn_big", on ? "1" : "0"); } catch (e) {}
    syncBig();
  });
  syncBig();

  // Read the page aloud with the phone's own voice. Nothing leaves the device.
  var read = $("t-read");
  if ("speechSynthesis" in window && window.SpeechSynthesisUtterance) {
    read.hidden = false;
    var label = read.querySelector("span");
    var idle = function () { read.setAttribute("aria-pressed", "false"); label.textContent = T.read; };
    read.addEventListener("click", function () {
      if (read.getAttribute("aria-pressed") === "true") { window.speechSynthesis.cancel(); idle(); return; }
      var parts = [document.querySelector(".hero h1").textContent, document.querySelector(".hero .sub").textContent];
      document.querySelectorAll("#read .wx:not([hidden]) .v, #read section:not([hidden]) h2, #read section:not([hidden]) .lead, #read .pl-when, #read .pl-where, #read .big, #read .sm, #read .fine:not(:empty), #read .chip-btn, #read .promise li")
        .forEach(function (el) { parts.push(el.textContent); });
      var u = new SpeechSynthesisUtterance(parts.join(". ").replace(/2-1-1/g, "2 1 1").replace(/9-8-8/g, "9 8 8").replace(/9-1-1/g, "9 1 1").replace(/898211/g, "8 9 8, 2 1 1"));
      u.lang = T.voice; u.rate = 0.95; u.onend = u.onerror = idle;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
      read.setAttribute("aria-pressed", "true"); label.textContent = T.stop;
    });
    window.addEventListener("pagehide", function () { window.speechSynthesis.cancel(); });
  }

  // Pass the page to someone else.
  $("t-share").addEventListener("click", async function () {
    var lab = this.querySelector("span"), url = location.origin + location.pathname;
    if (navigator.share) { try { await navigator.share({ title: T.shareTitle, text: T.shareText, url: url }); return; } catch (e) { if (e && e.name === "AbortError") return; } }
    try { await navigator.clipboard.writeText(url); lab.textContent = T.copied; } catch (e) { lab.textContent = url; }
  });

  // Tonight's weather, so a cold or hot night is said plainly at the top.
  (async function () {
    var loc = load("dn_loc") || { lat: 45.6387, lon: -122.6615, name: "Vancouver, WA" };
    var region = (navigator.language || "en-US").split("-")[1] || "US";
    var useF = ["US", "LR", "MM"].indexOf(region.toUpperCase()) !== -1, U = useF ? "°F" : "°C";
    var key = "dn_wx_" + loc.lat.toFixed(2) + "_" + loc.lon.toFixed(2) + "_" + U, hit = load(key), data = null;
    try {
      if (hit && Date.now() - hit.at < 30 * 60000) data = hit.data;
      else {
        var r = await fetch("https://api.open-meteo.com/v1/forecast?latitude=" + loc.lat + "&longitude=" + loc.lon +
          "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=7" + (useF ? "&temperature_unit=fahrenheit" : ""));
        if (!r.ok) throw new Error(r.status);
        data = await r.json();
        try { localStorage.setItem(key, JSON.stringify({ at: Date.now(), data: data })); } catch (e) {}
      }
    } catch (e) { return; }   // no forecast, no banner; the numbers below still work
    var d = data.daily, hi = Math.round(d.temperature_2m_max[0]), lo = Math.round(d.temperature_2m_min[0]);
    var rain = d.precipitation_probability_max ? d.precipitation_probability_max[0] : null;
    var cold = lo <= (useF ? 32 : 0), hot = hi >= (useF ? 90 : 32), box = $("wx");
    box.hidden = false;
    box.className = "wx " + (cold || hot ? "on" : "off");
    box.querySelector(".k").textContent = (cold ? T.cold : hot ? T.hot : T.today) + " · " + (loc.name === "Near you" && lang === "es" ? "Cerca de usted" : loc.name);
    box.querySelector(".v").textContent = T.wx(hi, lo, U, rain) + (cold ? T.coldTip : hot ? T.hotTip : "");
  })();

  if (!window.DN) return;

  // Meals coming up: shown only when a neighbor has posted a plan.
  DN.plans().then(function (rows) {
    if (!rows.length) return;
    DN.paintPlans($("plans"), rows, lang);
    $("coming").hidden = false; $("coming").classList.add("in");
  }).catch(function () {});

  // What would help most: tap up to three, send, see the totals.
  (function () {
    var chips = $("chips"), send = $("ask-send"), status = $("ask-status"), picked = [];
    var last = +(load("dn_need_at") || 0), recent = Date.now() - last < 12 * 3600000;
    function showTally() {
      DN.tally().then(function (rows) {
        if (DN.paintTally($("tally"), rows, lang)) { $("tally").hidden = false; $("tally-k").hidden = false; $("tally-k").textContent = T.tallyK; }
      }).catch(function () {});
    }
    function sync() {
      chips.querySelectorAll("button").forEach(function (b) {
        var on = picked.indexOf(b.dataset.item) !== -1;
        b.setAttribute("aria-pressed", on ? "true" : "false");
        b.disabled = recent || (!on && picked.length >= 3);
      });
      send.disabled = recent || !picked.length;
    }
    DN.NEEDS.forEach(function (item) {
      var b = document.createElement("button"); b.type = "button"; b.className = "chip-btn"; b.dataset.item = item;
      b.textContent = DN.WORDS[lang].needs[item]; b.setAttribute("aria-pressed", "false");
      b.addEventListener("click", function () {
        var i = picked.indexOf(item);
        if (i !== -1) picked.splice(i, 1); else if (picked.length < 3) picked.push(item);
        sync();
      });
      chips.appendChild(b);
    });
    send.textContent = T.send;
    if (recent) { status.textContent = T.again; showTally(); }
    sync();
    send.addEventListener("click", async function () {
      if (!picked.length || recent) return;
      send.disabled = true; send.textContent = T.sending;
      try {
        await DN.post("feeding_needs", picked.map(function (i) { return { item: i }; }));
        try { localStorage.setItem("dn_need_at", String(Date.now())); } catch (e) {}
        recent = true; picked = []; status.textContent = T.thanks; send.textContent = T.send; sync(); showTally();
      } catch (e) {
        status.textContent = T.fail; send.textContent = T.send; send.disabled = false;
      }
    });
  })();
})();
