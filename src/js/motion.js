/* Motion: the home hero's orbiting mark, entrance reveals, the scroll-
   coloured statement, the sticky "exploring now" swap, the pinned
   horizontal "start here" track, cursor-following card badges, accordions
   and the credentials line.
   Everything degrades to a complete, static page: without JavaScript, or with
   reduced motion, the layout falls back to plain stacked content. */
(function () {
  "use strict";
  var I2F = window.I2F;
  window.I2F_MOTION = true;

  var root = document.documentElement;
  var clamp = function (v, a, b) {
    return Math.min(b, Math.max(a, v));
  };
  var smooth = function (t) {
    return t * t * (3 - 2 * t);
  };
  var desktop = window.matchMedia("(min-width: 992px)");

  /* One rAF loop for every scroll-driven effect. */
  var tickers = [];
  var running = false;
  var last = 0;
  var loop = function (now) {
    var dt = Math.min(0.1, (now - (last || now)) / 1000);
    last = now;
    var busy = false;
    for (var i = 0; i < tickers.length; i++) if (tickers[i](dt)) busy = true;
    if (busy) requestAnimationFrame(loop);
    else {
      running = false;
      last = 0;
    }
  };
  var kick = function () {
    if (running) return;
    running = true;
    requestAnimationFrame(loop);
  };
  var follow = function (current, target, dt, seconds) {
    var k = 1 - Math.exp(-dt / (seconds / 4));
    var next = current + (target - current) * k;
    return Math.abs(target - next) < 0.0005 ? target : next;
  };

  /* ------------------------------------------------ gravity hero (home) */
  // The mark is a flame disc with a ring and a dot on tilted orbits around
  // it: they pass behind the disc and in front of it, spiral in on load,
  // lean towards the pointer and fly wide when the figure is clicked
  // ("ignite"). From 900px the hero is pinned and --gp (0-1) follows the
  // curtain rising over it; the stylesheet turns that into the figure
  // sinking, the words fading and the curtain's cap flattening.

  function initGravity(animate) {
    var hero = I2F.$("[data-gravity]");
    if (!hero || !animate) return; // at rest, exactly as the stylesheet places it
    var fig = I2F.$("[data-gravity-figure]", hero);
    var mark = I2F.$("[data-gravity-mark]", hero);
    var hint = I2F.$("[data-gravity-ignite]", hero);
    var curtain = I2F.$("[data-curtain]");
    var cap = curtain && I2F.$(".curtain__cap", curtain);
    var mass = I2F.$('[data-orb="mass"]', mark);
    var sats = [
      // r in hundredths of the figure's height; w in radians per second
      { el: I2F.$('[data-orb="ring"]', mark), r: 15.4, a: 2.2, w: 0.34, tilt: 0.36, rot: -0.3 },
      { el: I2F.$('[data-orb="dot"]', mark), r: 11.2, a: -2.5, w: -0.58, tilt: 0.5, rot: 0.66 },
    ];
    sats.forEach(function (s) {
      s.cos = Math.cos(s.rot);
      s.sin = Math.sin(s.rot);
      s.front = null;
    });

    var u = 8;
    var heroH = 1;
    var capH = 0;
    var pinned = false;
    var p = 0;
    var visible = true;
    var start = performance.now();
    var spin = 0; // extra angular speed from a click, decays
    var bump = 0; // orbit radius spring (0 at rest) and its velocity
    var bumpV = 0;
    var scale = 0; // mass scale spring; pops in from 0
    var scaleV = 0;
    var ox = 0; // mass offset towards the pointer, and its target
    var oy = 0;
    var tx = 0;
    var ty = 0;

    var onScroll = function () {
      var y = window.scrollY;
      var next = pinned ? clamp(y / heroH, 0, 1) : 0;
      if (next !== p) {
        p = next;
        hero.style.setProperty("--gp", p.toFixed(4));
      }
      // the cap is flat by the time its edge reaches the top of the window
      if (pinned && curtain) curtain.style.setProperty("--cap", (1 - clamp(y / (heroH + capH), 0, 1)).toFixed(4));
      if (visible && p < 1) kick();
    };
    var measure = function () {
      pinned = getComputedStyle(hero).position === "sticky";
      heroH = hero.offsetHeight || 1;
      capH = cap ? cap.offsetHeight : 0;
      if (curtain && !pinned) curtain.style.removeProperty("--cap");
      u = (fig.offsetHeight || 800) / 100;
      onScroll();
    };
    var markY = function () {
      return oy - p * 34 * u;
    };

    tickers.push(function (dt) {
      if (!visible || p >= 1) return false;
      var t = (performance.now() - start) / 1000;
      var settle = 1 - Math.pow(1 - clamp(t / 2.6, 0, 1), 3);
      var spread = 1 + 2.3 * (1 - settle) + bump + p * 1.4;
      var extra = 4.6 * (1 - settle) + spin;
      spin *= Math.exp(-dt / 1.1);
      // springs (semi-implicit Euler; stable at these rates)
      bumpV += (-46 * bump - 7.2 * bumpV) * dt;
      bump += bumpV * dt;
      scaleV += (-110 * (scale - (t > 0.35 ? 1 : 0)) - 12 * scaleV) * dt;
      scale += scaleV * dt;
      ox = follow(ox, tx, dt, 0.9);
      oy = follow(oy, ty, dt, 0.9);

      var mx = ox;
      var my = markY();
      var show = clamp((t - 0.25) / 0.7, 0, 1);
      mass.style.opacity = t > 0.35 ? "1" : "0";
      mass.style.transform = "translate3d(" + mx.toFixed(2) + "px," + my.toFixed(2) + "px,0) scale(" + Math.max(0, scale).toFixed(4) + ")";
      sats.forEach(function (s) {
        s.a += (s.w + (s.w > 0 ? extra : -extra)) * dt;
        var R = s.r * u * spread;
        var x0 = Math.cos(s.a) * R;
        var y0 = Math.sin(s.a) * R * s.tilt;
        var z = Math.sin(s.a); // > 0: the near half of the orbit
        var x = mx + x0 * s.cos - y0 * s.sin;
        var y = my + x0 * s.sin + y0 * s.cos;
        s.el.style.transform = "translate3d(" + x.toFixed(2) + "px," + y.toFixed(2) + "px,0) scale(" + (1 + 0.14 * z).toFixed(4) + ")";
        var front = z >= 0;
        if (front !== s.front) {
          s.front = front;
          s.el.style.zIndex = front ? "4" : "2";
        }
        s.el.style.opacity = (show * (front ? 1 : 0.82)).toFixed(3);
      });
      return true;
    });

    /* click the figure (or the hint button) to ignite */
    var lit;
    var burst = function (cls, x, y, vars) {
      var el = document.createElement("span");
      el.className = cls;
      el.style.setProperty("--x", x.toFixed(1) + "px");
      el.style.setProperty("--y", y.toFixed(1) + "px");
      for (var k in vars) el.style.setProperty(k, vars[k]);
      el.addEventListener("animationend", function () {
        el.remove();
      });
      mark.appendChild(el);
    };
    var ignite = function () {
      spin = 7.5;
      bumpV += 2.4;
      scaleV += 5;
      var x = ox;
      var y = markY();
      burst("gravity__wave", x, y);
      burst("gravity__wave is-late", x, y);
      for (var i = 0; i < 18; i++) {
        var ang = (i / 18) * Math.PI * 2 + Math.random() * 0.35;
        var dist = (14 + Math.random() * 20) * u;
        burst("gravity__spark" + (i % 3 === 1 ? " is-ember" : i % 5 === 0 ? " is-cream" : ""), x, y, {
          "--dx": (Math.cos(ang) * dist).toFixed(1) + "px",
          "--dy": (Math.sin(ang) * dist).toFixed(1) + "px",
          "--s": (0.6 + Math.random() * 0.9).toFixed(2),
        });
      }
      hero.classList.add("is-lit");
      clearTimeout(lit);
      lit = setTimeout(function () {
        hero.classList.remove("is-lit");
      }, 650);
      if (hint) hint.classList.add("is-used");
      kick();
    };
    fig.setAttribute("data-ignitable", "");
    hero.addEventListener("click", function (e) {
      var t = e.target;
      var viaHint = t.closest("[data-gravity-ignite]");
      if (!viaHint && (!t.closest("[data-gravity-figure]") || String(window.getSelection()))) return;
      ignite();
    });
    if (hint) {
      if (window.matchMedia("(pointer: coarse)").matches) hint.lastChild.textContent = "Tap to ignite";
      hint.hidden = false;
      setTimeout(function () {
        hint.classList.add("is-shown");
      }, 2800);
    }

    /* the mass leans a little towards the pointer */
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      hero.addEventListener(
        "pointermove",
        function (e) {
          var r = mark.getBoundingClientRect();
          var lim = 3.2 * u;
          tx = clamp((e.clientX - r.left) * 0.05, -lim, lim);
          ty = clamp((e.clientY - r.top) * 0.05, -lim, lim);
          kick();
        },
        { passive: true }
      );
      hero.addEventListener("pointerleave", function () {
        tx = ty = 0;
      });
    }

    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) kick();
    }).observe(hero);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", I2F.debounce(measure, 120));
    measure();
    kick();
  }

  /* ------------------------------------------- contact stage (arch) */
  // --cp (0-1) follows the stage scrolling away: the dome flattens, the
  // arch and the portrait drift up. The flame disc leans towards the
  // pointer and glides to the form.

  function initContactStage(animate) {
    var stage = I2F.$("[data-cstage]");
    if (!stage) return;
    var cta = I2F.$(".cstage__cta", stage);
    var target = I2F.$("#write");
    if (cta && target) {
      cta.addEventListener("click", function (e) {
        e.preventDefault();
        target.scrollIntoView({ behavior: animate ? "smooth" : "auto" });
        var first = I2F.$("#c-name");
        if (first) first.focus({ preventScroll: true });
      });
    }
    if (!animate) return;
    var ticking = false;
    var update = function () {
      ticking = false;
      var h = stage.offsetHeight || 1;
      stage.style.setProperty("--cp", clamp(window.scrollY / h, 0, 1).toFixed(4));
    };
    window.addEventListener(
      "scroll",
      function () {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(update);
      },
      { passive: true }
    );
    update();
    if (cta && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      cta.addEventListener("pointermove", function (e) {
        var r = cta.getBoundingClientRect();
        cta.style.setProperty("--mx", ((e.clientX - r.left - r.width / 2) * 0.22).toFixed(1) + "px");
        cta.style.setProperty("--my", ((e.clientY - r.top - r.height / 2) * 0.22).toFixed(1) + "px");
      });
      cta.addEventListener("pointerleave", function () {
        cta.style.removeProperty("--mx");
        cta.style.removeProperty("--my");
      });
    }
  }

  /* --------------------------------------------------------- entrances */

  function initEntrances(enabled) {
    var items = I2F.$$("[data-anim]");
    if (!enabled) {
      items.forEach(function (el) {
        el.classList.add("is-in", "is-done");
      });
      return;
    }
    var show = function (el) {
      if (el.classList.contains("is-in")) return;
      el.classList.add("is-in");
      var delay = parseFloat(el.getAttribute("data-delay") || (el.getAttribute("data-anim") === "slide-up" ? "300" : "0"));
      setTimeout(function () {
        el.classList.add("is-done");
      }, delay + 1100);
    };
    items.forEach(function (el) {
      var d = el.getAttribute("data-delay");
      if (d) el.style.setProperty("--delay", d + "ms");
    });
    var make = function (offset) {
      return new IntersectionObserver(
        function (entries, obs) {
          entries.forEach(function (e) {
            if (!e.isIntersecting) return;
            show(e.target);
            obs.unobserve(e.target);
          });
        },
        { rootMargin: "0px 0px -" + offset + "% 0px", threshold: 0 }
      );
    };
    var observers = {};
    items.forEach(function (el) {
      var off = el.getAttribute("data-anim") === "blur-in" ? "0" : "12";
      (observers[off] = observers[off] || make(Number(off))).observe(el);
    });
    var revealAll = function () {
      items.forEach(show);
    };
    window.addEventListener("beforeprint", revealAll);
    window.addEventListener("hashchange", revealAll);
  }

  /* ------------------------------------- scroll-coloured statement (chars) */

  function splitChars(el) {
    var text = el.textContent;
    var out = document.createElement("span");
    out.setAttribute("aria-hidden", "true");
    var chars = [];
    var walk = function (node, into) {
      node.childNodes.forEach(function (child) {
        if (child.nodeType === 3) {
          child.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) {
              into.appendChild(document.createTextNode(" "));
              return;
            }
            var word = document.createElement("span");
            word.className = "rc-word";
            for (var i = 0; i < part.length; i++) {
              var c = document.createElement("span");
              c.className = "rc-char";
              c.textContent = part[i];
              word.appendChild(c);
              chars.push(c);
            }
            into.appendChild(word);
          });
        } else if (child.nodeType === 1) {
          var copy = document.createElement(child.tagName);
          walk(child, copy);
          into.appendChild(copy);
        }
      });
    };
    walk(el, out);
    var label = document.createElement("span");
    label.className = "visually-hidden";
    label.textContent = text;
    el.textContent = "";
    el.appendChild(label);
    el.appendChild(out);
    return chars;
  }

  function initCharReveal() {
    I2F.$$("[data-reveal-chars]").forEach(function (el) {
      var chars = splitChars(el);
      var n = chars.length;
      if (!n) return;
      // 0.4s per letter, 0.04s stagger, scrubbed with a 0.8s lag
      var each = 0.04;
      var dur = 0.4;
      var total = dur + each * (n - 1);
      var shown = 0;
      var target = 0;
      var values = new Array(n).fill(-1);
      var measure = function () {
        var r = el.getBoundingClientRect();
        var vh = window.innerHeight;
        target = clamp((vh - r.top) / (vh * 0.85), 0, 1);
      };
      tickers.push(function (dt) {
        shown = follow(shown, target, dt, 0.8);
        var time = shown * total;
        for (var i = 0; i < n; i++) {
          var p = clamp((time - i * each) / dur, 0, 1);
          if (Math.abs(p - values[i]) > 0.004) {
            values[i] = p;
            chars[i].style.setProperty("--p", p.toFixed(3));
          }
        }
        return shown !== target;
      });
      var onMove = function () {
        measure();
        kick();
      };
      window.addEventListener("scroll", onMove, { passive: true });
      window.addEventListener("resize", onMove);
      measure();
      shown = target;
      kick();
    });
  }

  /* ---------------------------------------- exploring now (sticky swap) */

  function initExplore() {
    var sec = I2F.$("[data-explore]");
    if (!sec) return;
    var track = I2F.$("[data-explore-track]", sec);
    var blocks = I2F.$$("[data-explore-block]", sec);
    var cards = I2F.$$("[data-explore-card]", sec);
    if (!track || blocks.length < 2 || cards.length < 2) return;
    var H = 0;
    var current = 0;
    var target = 0;
    var active = false;

    var compute = function () {
      var vh = window.innerHeight;
      var t = 0;
      for (var i = 1; i < cards.length && i < blocks.length; i++) {
        var top = cards[i].getBoundingClientRect().top;
        t += smooth(clamp((vh * 0.66 - top) / (vh * 0.2), 0, 1));
      }
      target = t;
    };
    var apply = function () {
      track.style.transform = "translate3d(0," + (-current * H).toFixed(2) + "px,0)";
    };
    var measure = function () {
      if (!desktop.matches) {
        if (active) {
          sec.classList.remove("is-ready");
          track.style.transform = "";
          active = false;
        }
        return;
      }
      sec.classList.remove("is-ready");
      H = Math.ceil(
        blocks.reduce(function (m, b) {
          return Math.max(m, b.offsetHeight);
        }, 0)
      );
      sec.style.setProperty("--explore-h", H + "px");
      sec.classList.add("is-ready");
      active = true;
      compute();
      current = target;
      apply();
    };
    tickers.push(function (dt) {
      if (!active) return false;
      current = follow(current, target, dt, 0.55);
      apply();
      return current !== target;
    });
    window.addEventListener(
      "scroll",
      function () {
        if (!active) return;
        compute();
        kick();
      },
      { passive: true }
    );
    window.addEventListener("resize", I2F.debounce(measure, 150));
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    // keyboard users: focusing a link in a hidden block scrolls its card into place
    track.addEventListener("focusin", function (e) {
      if (!active) return;
      var i = blocks.indexOf(e.target.closest("[data-explore-block]"));
      var card = cards[i];
      if (!card) return;
      window.scrollBy({ top: card.getBoundingClientRect().top - window.innerHeight * 0.36, behavior: "auto" });
    });
    measure();
  }

  /* ------------------------------------- start here (pinned horizontal) */

  function initHScroll() {
    var sec = I2F.$("[data-hscroll]");
    if (!sec) return;
    var viewport = I2F.$("[data-hscroll-viewport]", sec);
    var track = I2F.$("[data-hscroll-track]", sec);
    if (!viewport || !track) return;
    var dist = 0;
    var current = 0;
    var target = 0;
    var active = false;

    var compute = function () {
      var r = sec.getBoundingClientRect();
      var span = sec.offsetHeight - window.innerHeight;
      var p = span > 0 ? clamp(-r.top / span, 0, 1) : 0;
      // hold briefly at both ends so the first and last cards can be read
      target = clamp((p - 0.08) / 0.84, 0, 1);
    };
    var apply = function () {
      track.style.transform = "translate3d(" + (-current * dist).toFixed(2) + "px,0,0)";
    };
    var measure = function () {
      if (!desktop.matches) {
        if (active) {
          sec.classList.remove("is-active");
          sec.style.removeProperty("--hscroll-h");
          track.style.transform = "";
          active = false;
        }
        return;
      }
      sec.classList.add("is-active");
      var styles = getComputedStyle(viewport);
      var inner = viewport.clientWidth - parseFloat(styles.paddingLeft) - parseFloat(styles.paddingRight);
      dist = Math.max(0, track.scrollWidth - inner);
      if (!dist) {
        sec.classList.remove("is-active");
        active = false;
        return;
      }
      sec.style.setProperty("--hscroll-h", Math.round(window.innerHeight + dist * 1.15) + "px");
      active = true;
      compute();
      current = target;
      apply();
    };
    tickers.push(function (dt) {
      if (!active) return false;
      current = follow(current, target, dt, 0.5);
      apply();
      return current !== target;
    });
    window.addEventListener(
      "scroll",
      function () {
        if (!active) return;
        compute();
        kick();
      },
      { passive: true }
    );
    window.addEventListener("resize", I2F.debounce(measure, 150));
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    track.addEventListener("focusin", function (e) {
      if (!active) return;
      var item = e.target.closest(".hscroll__item");
      if (!item) return;
      var p = clamp(item.offsetLeft / dist, 0, 1);
      var span = sec.offsetHeight - window.innerHeight;
      window.scrollTo({ top: sec.getBoundingClientRect().top + window.scrollY + (p * 0.84 + 0.08) * span, behavior: "auto" });
    });
    measure();
  }

  /* ----------------------------------------- cursor-following card badge */

  function initFollow() {
    if (!window.matchMedia("(hover: hover)").matches) return;
    I2F.$$("[data-follow]").forEach(function (card) {
      var thumb = I2F.$(".post-card__thumb", card);
      if (!thumb) return;
      thumb.addEventListener("pointermove", function (e) {
        var r = thumb.getBoundingClientRect();
        var x = clamp(((e.clientX - r.left) / r.width) * 300 - 150, -(r.width / 2 - 40), r.width / 2 - 40);
        var y = clamp(((e.clientY - r.top) / r.height) * 300 - 150, -(r.height / 2 - 40), r.height / 2 - 40);
        card.classList.add("is-tracking");
        card.style.setProperty("--mx", x.toFixed(1) + "px");
        card.style.setProperty("--my", y.toFixed(1) + "px");
      });
      thumb.addEventListener("pointerleave", function () {
        card.classList.remove("is-tracking");
        card.style.setProperty("--mx", "0px");
        card.style.setProperty("--my", "0px");
      });
    });
  }

  /* --------------------------------------------------------- accordions */

  function initFaq(animate) {
    I2F.$$("[data-faq]").forEach(function (group) {
      var items = I2F.$$(".faq__item", group);
      var anims = new Map();
      var setOpen = function (d, open) {
        var body = I2F.$(".faq__a", d);
        if (anims.get(d)) anims.get(d).cancel();
        if (!animate || !body.animate) {
          d.open = open;
          return;
        }
        if (open) {
          d.open = true;
          anims.set(d, body.animate([{ height: "0px", opacity: 0 }, { height: body.scrollHeight + "px", opacity: 1 }], { duration: 600, easing: "cubic-bezier(.25,.46,.45,.94)" }));
        } else {
          var a = body.animate([{ height: body.offsetHeight + "px", opacity: 1 }, { height: "0px", opacity: 0 }], { duration: 600, easing: "cubic-bezier(.215,.61,.355,1)" });
          anims.set(d, a);
          d.classList.add("is-closing");
          a.onfinish = function () {
            d.open = false;
            d.classList.remove("is-closing");
          };
        }
      };
      items.forEach(function (d) {
        I2F.$("summary", d).addEventListener("click", function (e) {
          e.preventDefault();
          var opening = !d.open || d.classList.contains("is-closing");
          if (opening) {
            items.forEach(function (o) {
              if (o !== d && o.open) setOpen(o, false);
            });
          }
          setOpen(d, opening);
        });
      });
    });
  }

  /* ---------------------------------------------- credentials timeline */

  function initJourney() {
    var sec = I2F.$("[data-journey]");
    if (!sec) return;
    var fill = I2F.$("[data-journey-fill]", sec);
    var items = I2F.$$("[data-journey-item]", sec);
    var wrap = items.length && items[0].parentElement.parentElement;
    if (!fill || !wrap) return;
    sec.classList.add("is-tracking");
    var update = function () {
      var line = window.innerHeight * 0.6;
      var r = wrap.getBoundingClientRect();
      fill.style.setProperty("--fill", (clamp((line - r.top) / r.height, 0, 1) * 100).toFixed(2) + "%");
      items.forEach(function (it) {
        it.classList.toggle("is-active", it.getBoundingClientRect().top < line);
      });
    };
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  I2F.ready(function () {
    var enabled = !I2F.reducedMotion() && "IntersectionObserver" in window;
    if (!enabled) root.classList.remove("motion");
    initGravity(enabled);
    initContactStage(enabled);
    initEntrances(enabled);
    initFaq(enabled);
    if (!enabled) return;
    initCharReveal();
    initExplore();
    initHScroll();
    initFollow();
    initJourney();
    if (desktop.addEventListener) {
      desktop.addEventListener("change", function () {
        window.dispatchEvent(new Event("resize"));
      });
    }
  });
})();
