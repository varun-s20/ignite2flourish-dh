/* Archive pages: instant search within the list, load-more and the empty
   state. Filter tabs are ordinary links to real pages, so back/forward and
   sharing work without any client-side routing. */
(function () {
  "use strict";
  var I2F = window.I2F;

  I2F.ready(function () {
    var archive = I2F.$("[data-archive]");
    if (!archive) return;

    var list = I2F.$("[data-archive-list]", archive);
    var items = list ? I2F.$$("[data-item]", list) : [];
    var input = I2F.$("[data-archive-input]", archive);
    var clearBtn = I2F.$("[data-archive-clear]", archive);
    var form = I2F.$("[data-archive-search]", archive);
    var count = I2F.$("[data-archive-count]", archive);
    var empty = I2F.$("[data-empty]", archive);
    var emptyTitle = I2F.$("[data-empty-title]", archive);
    var more = I2F.$("[data-load-more]", archive);
    var moreBtn = more && I2F.$("[data-load-button]", more);
    var moreStatus = more && I2F.$("[data-load-status]", more);
    var tabs = I2F.$$(".tabs__tab", archive);
    var noun = archive.getAttribute("data-noun") || "items";
    var pageSize = more ? Number(more.getAttribute("data-page-size")) : Infinity;

    if (!items.length) return;

    var shown = pageSize;
    var query = "";
    var matchIds = null; // full-text matches once the search index has loaded
    var singular = noun.replace(/s$/, "");

    var matches = function (el) {
      if (!query) return true;
      if (matchIds) return matchIds[el.getAttribute("data-id")] === true;
      var hay = I2F.normalise(el.getAttribute("data-search"));
      return I2F.search.terms(query).every(function (t) {
        return hay.indexOf(t) !== -1;
      });
    };

    var apply = function (opts) {
      opts = opts || {};
      var visible = items.filter(matches);
      var firstNew = null;
      items.forEach(function (el) {
        var idx = visible.indexOf(el);
        var show = idx !== -1 && idx < shown;
        if (show && el.hidden) {
          el.classList.remove("is-entering");
          void el.offsetWidth; // restart the entrance animation
          el.style.setProperty("--i", String(Math.max(0, idx - (opts.from || 0)) % 8));
          el.classList.add("is-entering");
          if (opts.focusNew && !firstNew && idx >= (opts.from || 0)) firstNew = el;
        }
        el.hidden = !show;
      });

      var n = visible.length;
      count.textContent = query
        ? n + " " + (n === 1 ? singular : noun) + " matching “" + query + "”"
        : n + " " + (n === 1 ? singular : noun);
      empty.hidden = n !== 0;
      if (!n && emptyTitle) emptyTitle.textContent = "Nothing matches “" + query + "”.";

      if (more) {
        more.hidden = n <= shown;
        moreStatus.textContent = "Showing " + Math.min(shown, n) + " of " + n + " " + noun;
      }
      if (firstNew) {
        var link = I2F.$("a.card-link", firstNew);
        if (link) link.focus({ preventScroll: false });
      }
    };

    var syncURL = function () {
      var url = new URL(location.href);
      if (query) url.searchParams.set("q", query);
      else url.searchParams.delete("q");
      history.replaceState(null, "", url.pathname + url.search + url.hash);
      // carry the search across theme tabs
      tabs.forEach(function (tab) {
        var target = new URL(tab.href);
        if (query) target.searchParams.set("q", query);
        else target.searchParams.delete("q");
        tab.href = target.pathname + target.search;
      });
    };

    var runQuery = function () {
      query = input.value.trim();
      clearBtn.hidden = !query;
      shown = pageSize;
      matchIds = null;
      apply();
      syncURL();
      if (!query) return;
      var q = query;
      I2F.search
        .load()
        .then(function () {
          if (q !== query) return;
          matchIds = {};
          I2F.search.query(q).forEach(function (r) {
            matchIds[r.item.id] = true;
          });
          apply();
        })
        .catch(function () {
          /* keep the title/excerpt matching already shown */
        });
    };

    input.addEventListener("input", I2F.debounce(runQuery, 120));
    // fetch the full-text index as soon as someone reaches for the search box
    var prefetch = function () {
      I2F.search.load().catch(function () {});
    };
    input.addEventListener("focus", prefetch, { once: true });
    input.addEventListener("pointerenter", prefetch, { once: true });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      runQuery();
    });

    var reset = function () {
      input.value = "";
      runQuery();
      input.focus();
    };
    clearBtn.addEventListener("click", reset);
    I2F.$$("[data-archive-reset]", archive).forEach(function (b) {
      b.addEventListener("click", reset);
    });

    if (moreBtn) {
      moreBtn.addEventListener("click", function () {
        var from = shown;
        shown += pageSize;
        apply({ from: from, focusNew: true });
      });
    }

    // initial state, including ?q= from a shared link or a tab switch
    var initial = new URLSearchParams(location.search).get("q");
    if (initial) {
      input.value = initial;
      runQuery();
    } else {
      items.forEach(function (el, i) {
        el.hidden = i >= shown;
      });
      apply();
    }
  });
})();
