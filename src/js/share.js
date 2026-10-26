/* "Copy link" buttons (hidden until this script can make them work). */
(function () {
  "use strict";
  var I2F = window.I2F;

  var fallbackCopy = function (text) {
    var area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    var ok = false;
    try {
      ok = document.execCommand("copy");
    } catch (e) {
      ok = false;
    }
    document.body.removeChild(area);
    return ok ? Promise.resolve() : Promise.reject(new Error("copy failed"));
  };

  I2F.ready(function () {
    I2F.$$("[data-copy-link]").forEach(function (btn) {
      btn.hidden = false;
      var label = I2F.$("[data-copy-label]", btn);
      var timer;
      btn.addEventListener("click", function () {
        var url = btn.getAttribute("data-copy-link");
        var copy = navigator.clipboard && window.isSecureContext ? navigator.clipboard.writeText(url) : fallbackCopy(url);
        copy
          .then(function () {
            btn.classList.add("is-done");
            if (label) label.textContent = "Copied";
            I2F.toast("Link copied to clipboard");
            clearTimeout(timer);
            timer = setTimeout(function () {
              btn.classList.remove("is-done");
              if (label) label.textContent = "Copy link";
            }, 2200);
          })
          .catch(function () {
            I2F.toast("Couldn’t copy — the link is " + url);
          });
      });
    });
  });
})();
