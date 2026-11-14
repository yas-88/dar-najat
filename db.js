/* Dar Najat: one small helper for reading and writing the public tables.
   Uses the public (anon) key, which is safe to ship only because setup.sql
   turns on Row Level Security and grants. No library needed. */
(function () {
  var URL_ = "https://nvacylouzxbahpnwqcrc.supabase.co";
  var KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52YWN5bG91enhiYWhwbndxY3JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5MDY1MzgsImV4cCI6MjA5NTQ4MjUzOH0.495k-Aj9Er6YbWRC2xdeFqbV9RsbsCGiI56y-UQcZ4Q";
  var H = { apikey: KEY, Authorization: "Bearer " + KEY };

  function today() { var d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }

  var DN = window.DN = {
    today: today,
    get: async function (path) {
      var r = await fetch(URL_ + "/rest/v1/" + path, { headers: H });
      if (!r.ok) throw new Error("read " + r.status);
      return r.json();
    },
    post: async function (table, rows) {
      var r = await fetch(URL_ + "/rest/v1/" + table, {
        method: "POST", body: JSON.stringify(rows),
        headers: { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json", Prefer: "return=minimal" }
      });
      if (!r.ok) { var m = ""; try { m = (await r.json()).message || ""; } catch (e) {} throw new Error(m || "save " + r.status); }
    },
    // Planned feedings from today on, soonest first.
    plans: function () {
      return DN.get("feeding_plans?select=plan_date,part_of_day,location_label,city,state,items&plan_date=gte." + today() + "&order=plan_date.asc,created_at.asc&limit=30");
    },
    // What people who need a meal asked for, last 30 days.
    tally: function () { return DN.get("feeding_needs_tally?select=item,asks"); },

    NEEDS: ["hot_meal", "water", "socks", "gloves_hat", "blanket", "hygiene", "poncho", "pet_food"],
    WORDS: {
      en: {
        needs: { hot_meal: "A hot meal", water: "Water", socks: "Socks", gloves_hat: "Gloves and a hat", blanket: "A blanket", hygiene: "A hygiene kit", poncho: "A rain poncho", pet_food: "Pet food" },
        parts: { morning: "morning", midday: "midday", afternoon: "afternoon", evening: "evening" },
        today: "Today", tomorrow: "Tomorrow", locale: "en-US"
      },
      es: {
        needs: { hot_meal: "Comida caliente", water: "Agua", socks: "Calcetines", gloves_hat: "Guantes y gorro", blanket: "Una cobija", hygiene: "Artículos de higiene", poncho: "Un poncho para la lluvia", pet_food: "Comida para mascotas" },
        parts: { morning: "por la mañana", midday: "al mediodía", afternoon: "por la tarde", evening: "al anochecer" },
        today: "Hoy", tomorrow: "Mañana", locale: "es-US"
      }
    },

    // "Today", "Tomorrow", or "Saturday, November 21"
    dayLabel: function (iso, lang) {
      var W = DN.WORDS[lang || "en"], p = String(iso).split("-"), d = new Date(+p[0], +p[1] - 1, +p[2]);
      var n = new Date(), t0 = new Date(n.getFullYear(), n.getMonth(), n.getDate()), diff = Math.round((d - t0) / 86400000);
      if (diff === 0) return W.today;
      if (diff === 1) return W.tomorrow;
      var s = d.toLocaleDateString(W.locale, { weekday: "long", month: "long", day: "numeric" });
      return s.charAt(0).toUpperCase() + s.slice(1);
    },

    // Draw planned feedings into a <ul class="plans">. All text goes in as text, never as markup.
    paintPlans: function (ul, rows, lang) {
      var W = DN.WORDS[lang || "en"];
      ul.innerHTML = "";
      rows.forEach(function (r, i) {
        var li = document.createElement("li"); li.style.setProperty("--i", Math.min(i, 8));
        var when = document.createElement("span"); when.className = "pl-when";
        var b = document.createElement("b"); b.textContent = DN.dayLabel(r.plan_date, lang);
        when.appendChild(b); when.appendChild(document.createTextNode(lang === "es" ? " " + (W.parts[r.part_of_day] || "") : ", " + (W.parts[r.part_of_day] || "")));
        var where = document.createElement("span"); where.className = "pl-where";
        where.textContent = [r.location_label, r.city, r.state].filter(Boolean).join(", ");
        li.appendChild(when); li.appendChild(where); ul.appendChild(li);
      });
    },

    // Draw the tally as bars into a container. Returns false when there is nothing to show.
    paintTally: function (box, rows, lang) {
      var W = DN.WORDS[lang || "en"];
      rows = (rows || []).filter(function (r) { return W.needs[r.item] && r.asks > 0; }).sort(function (a, b) { return b.asks - a.asks; });
      box.innerHTML = "";
      if (!rows.length) return false;
      var max = rows[0].asks;
      rows.forEach(function (r, i) {
        var row = document.createElement("div"); row.className = "tl-row";
        var t = document.createElement("span"); t.className = "tl-t"; t.textContent = W.needs[r.item];
        var bar = document.createElement("span"); bar.className = "tl-bar";
        var fill = document.createElement("i"); bar.appendChild(fill);
        var n = document.createElement("span"); n.className = "tl-n"; n.textContent = r.asks;
        row.appendChild(t); row.appendChild(bar); row.appendChild(n); box.appendChild(row);
        setTimeout(function () { fill.style.width = Math.max(6, Math.round(r.asks / max * 100)) + "%"; }, 60 + i * 70);
      });
      return true;
    }
  };
})();
