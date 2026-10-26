/* Contact and response forms: accessible validation and honest states.
   With no endpoint configured (the preview build) nothing is sent — the form
   says so. Set data-endpoint (from content/site.json › forms) to POST
   FormData to a real handler; the response must be 2xx to count as sent. */
(function () {
  "use strict";
  var I2F = window.I2F;

  var MESSAGES = {
    name: { missing: "Please enter your name." },
    email: { missing: "Please enter your email address.", invalid: "Enter an email address like name@example.com." },
    subject: { missing: "Please add a subject — or pick one of the suggestions." },
    message: { missing: "Please write a message.", short: "Please write a little more — at least {min} characters ({n} so far)." },
  };

  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  var checkIcon =
    '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="15" fill="#193046"/><path class="check-path" pathLength="1" d="m9.5 16.5 4.5 4.5 8.5-9" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var infoIcon =
    '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="15" fill="#FFD900"/><path d="M16 14v8M16 10h.01" stroke="#193046" stroke-width="2.4" stroke-linecap="round"/></svg>';

  function validate(field) {
    var v = field.value.trim();
    var m = MESSAGES[field.name] || {};
    if (field.required && !v) return m.missing || "This field is required.";
    if (field.type === "email" && v && !EMAIL.test(v)) return m.invalid || "Enter a valid email address.";
    if (field.minLength > 0 && v && v.length < field.minLength)
      return (m.short || "Please enter at least {min} characters.").replace("{min}", field.minLength).replace("{n}", v.length);
    if (field.maxLength > 0 && v.length > field.maxLength) return "Please keep this under " + field.maxLength + " characters.";
    return "";
  }

  function setup(form) {
    form.setAttribute("novalidate", "");
    var kind = form.getAttribute("data-form");
    var summary = I2F.$("[data-error-summary]", form);
    var result = I2F.$("[data-result]", form);
    var submit = I2F.$("[data-submit]", form);
    var submitLabel = I2F.$("[data-submit-label]", form);
    var idleLabel = submitLabel ? submitLabel.textContent : "";
    var honeypot = form.querySelector("[name=website]");
    var fields = I2F.$$("input:not([type=hidden]):not([name=website]), textarea", form);
    var touched = {};
    var startedAt = Date.now();

    var show = function (field, msg) {
      var err = document.getElementById(field.id + "-err");
      if (err) err.textContent = msg;
      field.setAttribute("aria-invalid", msg ? "true" : "false");
      var wrap = field.closest("[data-field]");
      if (wrap) wrap.classList.toggle("is-valid", !msg && !!field.value.trim() && field.required);
    };

    fields.forEach(function (field) {
      field.addEventListener("blur", function () {
        if (!field.value.trim() && !touched[field.name]) return;
        touched[field.name] = true;
        show(field, validate(field));
      });
      field.addEventListener("input", function () {
        if (field.getAttribute("aria-invalid") === "true") show(field, validate(field));
      });
    });

    /* character counter */
    I2F.$$("[data-count]", form).forEach(function (area) {
      var out = document.getElementById(area.id + "-count");
      if (!out) return;
      var max = area.maxLength;
      var update = function () {
        var n = area.value.length;
        out.textContent = n ? n + " / " + max : "";
        out.classList.toggle("is-near", n > max * 0.9);
      };
      area.addEventListener("input", update);
      update();
    });

    /* subject suggestions */
    var chips = I2F.$("[data-subject-chips]", form);
    var subject = form.querySelector("[name=subject]");
    if (chips && subject) {
      chips.hidden = false;
      var chipButtons = I2F.$$("[data-subject]", chips);
      // the "What brings you here?" rows beside the form pick a subject too
      var picks = I2F.$$("[data-pick-subject]");
      var syncChips = function () {
        chipButtons.forEach(function (b) {
          b.setAttribute("aria-pressed", String(b.getAttribute("data-subject") === subject.value));
        });
        picks.forEach(function (a) {
          a.classList.toggle("is-picked", a.getAttribute("data-pick-subject") === subject.value);
        });
      };
      chipButtons.forEach(function (b) {
        b.addEventListener("click", function () {
          subject.value = b.getAttribute("data-subject");
          syncChips();
          show(subject, "");
          var msg = form.querySelector("[name=message]");
          if (msg) msg.focus();
        });
      });
      picks.forEach(function (a) {
        a.addEventListener("click", function (e) {
          e.preventDefault();
          subject.value = a.getAttribute("data-pick-subject");
          syncChips();
          show(subject, "");
          var msg = form.querySelector("[name=message]");
          if (!msg) return;
          msg.scrollIntoView({ behavior: I2F.reducedMotion() ? "auto" : "smooth", block: "center" });
          msg.focus({ preventScroll: true });
        });
      });
      subject.addEventListener("input", syncChips);

      /* arriving from an article: /contact/?about=<slug> */
      var about = new URLSearchParams(location.search).get("about");
      if (about && /^[a-z0-9-]{1,140}$/.test(about) && !subject.value) {
        var fallback = about.replace(/-/g, " ");
        subject.value = "Re: " + fallback.charAt(0).toUpperCase() + fallback.slice(1);
        I2F.search
          .load()
          .then(function (index) {
            var hit = index.filter(function (i) {
              return i.url.replace(/\/$/, "").split("/").pop() === about;
            })[0];
            if (hit && subject.value.indexOf("Re: ") === 0) subject.value = "Re: " + hit.title;
          })
          .catch(function () {});
      }
    }

    var setBusy = function (busy) {
      submit.disabled = busy;
      submit.setAttribute("aria-busy", String(busy));
      if (submitLabel) submitLabel.textContent = busy ? "Sending…" : idleLabel;
    };

    var announce = function (state, html) {
      result.className = "form__result form__result--" + state;
      result.innerHTML = html;
      result.hidden = false;
      result.focus();
      document.dispatchEvent(new CustomEvent("i2f:form", { detail: { form: kind, status: state } }));
    };

    var finish = function (state, title, lines, icon) {
      form.classList.toggle("is-sent", state !== "error");
      announce(
        state,
        '<p class="form__result-title">' + icon + "<span>" + title + "</span></p>" +
          lines.map(function (l) { return "<p>" + l + "</p>"; }).join("") +
          (state !== "error" ? '<p><button type="button" class="btn btn--outline btn--sm" data-again>' + (kind === "contact" ? "Write another message" : "Write another response") + "</button></p>" : "")
      );
      var again = I2F.$("[data-again]", result);
      if (again) {
        again.addEventListener("click", function () {
          form.reset();
          form.classList.remove("is-sent");
          result.hidden = true;
          fields.forEach(function (f) {
            show(f, "");
            f.removeAttribute("aria-invalid");
          });
          touched = {};
          startedAt = Date.now();
          fields[0].focus();
        });
      }
    };

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var problems = [];
      fields.forEach(function (f) {
        touched[f.name] = true;
        var msg = validate(f);
        show(f, msg);
        if (msg) problems.push({ field: f, msg: msg });
      });

      if (problems.length) {
        summary.innerHTML =
          "<p>" + (problems.length === 1 ? "There is 1 problem with your message:" : "There are " + problems.length + " problems with your message:") + "</p><ul>" +
          problems.map(function (p) { return '<li><a href="#' + p.field.id + '">' + I2F.escapeHTML(p.msg) + "</a></li>"; }).join("") +
          "</ul>";
        summary.hidden = false;
        summary.focus();
        I2F.$$("a", summary).forEach(function (a) {
          a.addEventListener("click", function (ev) {
            ev.preventDefault();
            var target = document.getElementById(a.getAttribute("href").slice(1));
            if (target) target.focus();
          });
        });
        return;
      }
      summary.hidden = true;

      var isBot = honeypot && honeypot.value;
      var endpoint = form.getAttribute("data-endpoint") || "";

      if (!endpoint) {
        // Preview build: be explicit that nothing left the browser.
        var lines =
          kind === "contact"
            ? [
                "Everything checks out. This design preview is not connected to email yet, so <strong>your message was not sent or stored</strong>.",
                "In the live site it will be emailed to Sanzid and kept securely, with spam protection.",
              ]
            : [
                "Your response passed every check. In the live site it would now be <strong>held for moderation</strong> before appearing publicly.",
                "This preview stores nothing — no response was saved.",
              ];
        finish("preview", kind === "contact" ? "Ready to send — preview only" : "Ready for moderation — preview only", lines, infoIcon);
        return;
      }

      if (isBot) {
        finish("success", "Thank you", ["Your message has been received."], checkIcon);
        return;
      }

      setBusy(true);
      var data = new FormData(form);
      data.append("elapsed_ms", String(Date.now() - startedAt));
      data.append("page", location.pathname);
      var controller = "AbortController" in window ? new AbortController() : null;
      var timer = setTimeout(function () {
        if (controller) controller.abort();
      }, 15000);

      fetch(endpoint, { method: "POST", body: data, headers: { Accept: "application/json" }, signal: controller ? controller.signal : undefined })
        .then(function (res) {
          clearTimeout(timer);
          setBusy(false);
          if (!res.ok) throw new Error(String(res.status));
          if (kind === "contact") {
            finish("success", "Thank you — your message has been sent", ["Any reply will go to the email address you provided."], checkIcon);
          } else {
            finish("success", "Thank you — your response is awaiting moderation", ["It will appear on this page once approved."], checkIcon);
          }
        })
        .catch(function () {
          clearTimeout(timer);
          setBusy(false);
          finish("error", "Sorry — that didn’t go through", ["Your message is still here. Please check your connection and try again in a moment."], infoIcon);
        });
    });
  }

  I2F.ready(function () {
    I2F.$$("[data-form]").forEach(setup);
  });
})();
