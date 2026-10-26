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

    /* ---- header: sits in the page at the top; once you have scrolled past
       it, it slides back in (fixed) whenever you scroll up */
    var shell = header && header.parentElement;
    if (header && shell) {
      var lastY = window.scrollY;
      var ticking = false;
      var update = function () {
        var y = window.scrollY;
        var menuOpen = toggle && toggle.getAttribute("aria-expanded") === "true";
        var limit = shell.offsetTop + shell.offsetHeight;
        if (y <= shell.offsetTop) {
          header.classList.remove("is-pinned", "is-shown");
        } else if (y > limit + 160) {
          header.classList.add("is-pinned");
          if (y < lastY - 4 || menuOpen || header.contains(document.activeElement)) header.classList.add("is-shown");
          else if (y > lastY + 4) header.classList.remove("is-shown");
        } else if (!header.classList.contains("is-shown")) {
          header.classList.remove("is-pinned");
        }
        lastY = y;
        ticking = false;
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
      header.addEventListener("focusin", function () {
        if (header.classList.contains("is-pinned")) header.classList.add("is-shown");
      });
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
