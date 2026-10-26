/* Header behaviour and the mobile menu. */
(function () {
  "use strict";
  var I2F = window.I2F;

  I2F.ready(function () {
    var header = I2F.$("[data-header]");
    var toggle = I2F.$("[data-menu-toggle]");
    var menu = I2F.$("[data-menu]");
    var label = I2F.$("[data-menu-label]");
    var main = I2F.$("main");
    var footer = I2F.$(".site-footer");

    /* ---- header: always fixed to the top; it only gains its solid
       background (and a hairline) once the page has moved, so on the home
       page it floats clear over the hero until then */
    if (header) {
      var ticking = false;
      var update = function () {
        ticking = false;
        header.classList.toggle("is-stuck", window.scrollY > 8);
      };
      window.addEventListener(
        "scroll",
        function () {
          if (!ticking) {
            ticking = true;
            requestAnimationFrame(update);
          }
        },
        { passive: true }
      );
      update();
    }

    /* ---- mobile menu */
    if (!toggle || !menu) return;

    var lastFocus = null;
    var closeTimer;

    var setInert = function (on) {
      [main, footer].forEach(function (el) {
        if (!el) return;
        if (on) el.setAttribute("inert", "");
        else el.removeAttribute("inert");
      });
    };

    var open = function () {
      clearTimeout(closeTimer);
      lastFocus = document.activeElement;
      menu.hidden = false;
      if (header) menu.style.setProperty("--menu-top", Math.max(0, Math.round(header.getBoundingClientRect().bottom)) + "px");
      // next frame so the transition runs from the hidden state
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          menu.classList.add("is-open");
        });
      });
      toggle.setAttribute("aria-expanded", "true");
      if (label) label.textContent = "Close";
      document.body.classList.add("menu-open");
      setInert(true);

      var first = I2F.$(".site-menu__link", menu);
      if (first) setTimeout(function () { first.focus({ preventScroll: true }); }, 60);
    };

    var close = function (restoreFocus) {
      menu.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      if (label) label.textContent = "Menu";
      document.body.classList.remove("menu-open");
      setInert(false);
      closeTimer = setTimeout(function () {
        menu.hidden = true;
      }, I2F.reducedMotion() ? 0 : 400);
      if (restoreFocus !== false) (lastFocus && lastFocus.focus ? lastFocus : toggle).focus({ preventScroll: true });
    };

    toggle.addEventListener("click", function () {
      if (toggle.getAttribute("aria-expanded") === "true") close();
      else open();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        e.preventDefault();
        close();
      }
    });

    /* keep Tab inside the header + menu while the menu is open */
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Tab" || toggle.getAttribute("aria-expanded") !== "true") return;
      var focusable = I2F.$$("a[href], button:not([disabled])", header).concat(I2F.$$("a[href], button:not([disabled])", menu)).filter(function (el) {
        return el.offsetParent !== null;
      });
      if (!focusable.length) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });

    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) close(false);
    });

    /* desktop layout has no menu: tidy up if the viewport grows while open */
    var wide = window.matchMedia("(min-width: 1140px)");
    var onWide = function () {
      if (wide.matches && toggle.getAttribute("aria-expanded") === "true") close(false);
    };
    if (wide.addEventListener) wide.addEventListener("change", onWide);
  });
})();
