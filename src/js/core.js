/* Shared helpers. Every other script hangs off window.I2F. */
(function () {
  "use strict";

  var root = document.documentElement;
  var motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  var I2F = (window.I2F = window.I2F || {});

  I2F.base = root.getAttribute("data-base") || "";
  I2F.$ = function (sel, ctx) {
    return (ctx || document).querySelector(sel);
  };
  I2F.$$ = function (sel, ctx) {
    return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  };
  I2F.reducedMotion = function () {
    return motionQuery.matches;
  };

  I2F.escapeHTML = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };

  /** Lower-case, strip accents and curly quotes so "Pétanque’s" matches "petanques". */
  I2F.normalise = function (s) {
    return String(s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[’‘']/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  };

  I2F.debounce = function (fn, wait) {
    var t;
    return function () {
      var args = arguments;
      var self = this;
      clearTimeout(t);
      t = setTimeout(function () {
        fn.apply(self, args);
      }, wait);
    };
  };

  /**
   * Run a DOM update inside a same-document View Transition where the
   * browser supports it, otherwise just run it.
   */
  I2F.transition = function (update) {
    if (document.startViewTransition && !I2F.reducedMotion()) {
      try {
        return document.startViewTransition(update);
      } catch (e) {
        /* fall through */
      }
    }
    update();
    return null;
  };

  var toastTimer;
  I2F.toast = function (message) {
    var el = I2F.$("[data-toast]");
    if (!el) return;
    el.textContent = message;
    el.hidden = false;
    requestAnimationFrame(function () {
      el.classList.add("is-visible");
    });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      el.classList.remove("is-visible");
      setTimeout(function () {
        el.hidden = true;
      }, 300);
    }, 2400);
  };

  I2F.ready = function (fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  };

  /* Preview build: toggle the draft-copy annotations. */
  I2F.ready(function () {
    var toggle = I2F.$("[data-notes-toggle]");
    if (!toggle) return;
    var sync = function () {
      var on = root.classList.contains("show-notes");
      toggle.setAttribute("aria-pressed", String(on));
      toggle.textContent = on ? "Hide draft notes" : "Show draft notes";
    };
    sync();
    toggle.addEventListener("click", function () {
      var on = root.classList.toggle("show-notes");
      try {
        if (on) sessionStorage.setItem("i2f-notes", "1");
        else sessionStorage.removeItem("i2f-notes");
      } catch (e) {
        /* storage unavailable: the toggle still works for this page */
      }
      sync();
    });
  });
})();
