/* =========================================================
   Transivo – Funktionen der Website
   (Sprache, Menü, Formular, Animationen)
   Hier muss normalerweise nichts geändert werden.
   ========================================================= */
(function () {
  "use strict";

  var TEXTS = window.MF_TEXTS || {};
  var WA_NUMBER = "41782093964"; // WhatsApp-Nummer ohne + und ohne Leerzeichen
  var LANGS = ["de", "fr", "en"];
  var current = "de";

  /* ---------- Sprache ---------- */
  function t(key) {
    return (TEXTS[current] && TEXTS[current][key]) || (TEXTS.de && TEXTS.de[key]) || "";
  }

  function store(lang) {
    try { localStorage.setItem("mf-lang", lang); } catch (e) { /* egal */ }
  }
  function saved() {
    try { return localStorage.getItem("mf-lang"); } catch (e) { return null; }
  }

  function applyLang(lang) {
    if (LANGS.indexOf(lang) === -1) lang = "de";
    current = lang;
    document.documentElement.lang = lang;

    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var v = t(el.getAttribute("data-i18n"));
      if (v) el.innerHTML = v;
    });
    document.querySelectorAll("[data-i18n-ph]").forEach(function (el) {
      var v = t(el.getAttribute("data-i18n-ph"));
      if (v) el.setAttribute("placeholder", v);
    });

    var title = t("meta.title");
    if (title) document.title = title;
    var desc = document.querySelector('meta[name="description"]');
    if (desc && t("meta.desc")) desc.setAttribute("content", t("meta.desc"));

    document.querySelectorAll(".lang button").forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-lang") === lang);
    });

    var msg = encodeURIComponent(t("wa.msg"));
    document.querySelectorAll(".js-wa").forEach(function (a) {
      a.href = "https://wa.me/" + WA_NUMBER + (msg ? "?text=" + msg : "");
    });

    var lf = document.getElementById("langField");
    if (lf) lf.value = lang;
  }

  function startLang() {
    var s = saved();
    if (s && LANGS.indexOf(s) !== -1) return s;
    var nav = (navigator.language || "de").slice(0, 2).toLowerCase();
    return LANGS.indexOf(nav) !== -1 ? nav : "de";
  }

  document.querySelectorAll(".lang button").forEach(function (b) {
    b.addEventListener("click", function () {
      var l = b.getAttribute("data-lang");
      store(l);
      applyLang(l);
    });
  });

  applyLang(startLang());

  /* ---------- Menü (Handy) ---------- */
  var burger = document.getElementById("burger");
  var nav = document.getElementById("nav");
  if (burger && nav) {
    burger.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      burger.classList.toggle("open", open);
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        nav.classList.remove("open");
        burger.classList.remove("open");
        burger.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------- Header-Schatten beim Scrollen ---------- */
  var header = document.getElementById("header");
  function onScroll() { if (header) header.classList.toggle("scrolled", window.scrollY > 10); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Einblenden beim Scrollen ---------- */
  var items = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- Klick auf "Anfragen"-Buttons füllt das Formular vor ---------- */
  var typeSel = document.getElementById("f-type");
  var peopleSel = document.getElementById("f-people");
  document.querySelectorAll("[data-type]").forEach(function (a) {
    a.addEventListener("click", function () {
      var idx = parseInt(a.getAttribute("data-type"), 10);
      if (typeSel && typeSel.options[idx]) typeSel.selectedIndex = idx;
      var p = a.getAttribute("data-people");
      if (peopleSel && p) peopleSel.selectedIndex = parseInt(p, 10);
      var x = a.getAttribute("data-extra");
      if (x) {
        var box = document.querySelector('#extraChecks input[data-key="' + x + '"]');
        if (box) box.checked = true;
      }
      if (a.getAttribute("data-b2b")) {
        var c = document.getElementById("f-company");
        if (c) setTimeout(function () { c.focus({ preventScroll: true }); }, 600);
      }
    });
  });

  /* ---------- Formular senden (Web3Forms) ---------- */
  var form = document.getElementById("offerForm");
  var msgBox = document.getElementById("formMsg");
  var btn = document.getElementById("submitBtn");

  function showMsg(type, text) {
    msgBox.className = "form-msg " + type;
    msgBox.textContent = text;
  }

  if (form) {
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      // Angekreuzte Zusatzleistungen in ein Feld schreiben
      var extras = [];
      form.querySelectorAll("#extraChecks input:checked").forEach(function (c) { extras.push(c.value); });
      document.getElementById("extraField").value = extras.join(", ") || "–";

      var key = form.querySelector('[name="access_key"]').value;
      if (!key || key.indexOf("HIER-") === 0) {
        showMsg("err", t("f.err"));
        console.warn("Transivo: Web3Forms access_key fehlt noch in index.html");
        return;
      }

      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = v; });
      if (data.Name) data.from_name = "Transivo Website – " + data.Name;
      if (data.Auftrag) data.subject = "Neue Anfrage: " + data.Auftrag + " – transivo.ch";

      var label = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = t("f.sending");

      fetch(form.action, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(data)
      })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (res && res.success) {
            form.reset();
            showMsg("ok", t("f.ok"));
          } else {
            showMsg("err", t("f.err"));
          }
        })
        .catch(function () { showMsg("err", t("f.err")); })
        .finally(function () {
          btn.disabled = false;
          btn.innerHTML = label;
          applyLang(current);
        });
    });
  }

  /* ---------- Datum: nur ab heute wählbar ---------- */
  var d = document.getElementById("f-date");
  if (d) { var n = new Date(); d.min = new Date(n.getTime() - n.getTimezoneOffset() * 60000).toISOString().slice(0, 10); }

  /* ---------- Jahr im Footer ---------- */
  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
})();
