/* Site search: a tiny client-side engine over /search-index.json, used by
   the header dialog, the /search/ page and the archive filters.
   In WordPress this becomes the native ?s= search (or a plugin such as
   Relevanssi); the UI and result markup can stay the same. */
(function () {
  "use strict";
  var I2F = window.I2F;

  var TYPE_LABEL = { article: "Article", "book-review": "Book review", "research-review": "Research review" };
  var CAT_SLUG = { "Work & Leadership": "work-leadership", "Career & Life": "career-life", Flourishing: "flourishing" };

  var index = null;
  var loading = null;

  var prep = function (item) {
    item._title = I2F.normalise(item.title);
    item._tags = I2F.normalise(item.tags.join(" "));
    item._cat = I2F.normalise(item.category);
    item._by = I2F.normalise(item.by || "");
    item._excerpt = I2F.normalise(item.excerpt);
    item._text = I2F.normalise(item.text || "");
    return item;
  };

  var termsOf = function (q) {
    return I2F.normalise(q)
      .split(" ")
      .filter(function (t) {
        return t.length > 1 || /\d/.test(t);
      });
  };

  var countOf = function (hay, term) {
    var n = 0;
    var i = hay.indexOf(term);
    while (i !== -1 && n < 6) {
      n++;
      i = hay.indexOf(term, i + term.length);
    }
    return n;
  };

  var wordStart = function (hay, term) {
    return (" " + hay).indexOf(" " + term) !== -1;
  };

  function query(q, opts) {
    opts = opts || {};
    var terms = termsOf(q);
    if (!index || !terms.length) return [];
    var out = [];
    index.forEach(function (item) {
      if (opts.type && opts.type !== "all" && item.type !== opts.type) return;
      var score = 0;
      for (var i = 0; i < terms.length; i++) {
        var t = terms[i];
        var s = 0;
        if (item._title.indexOf(t) !== -1) s += wordStart(item._title, t) ? 14 : 8;
        if (item._tags.indexOf(t) !== -1) s += 7;
        if (item._cat.indexOf(t) !== -1) s += 5;
        if (item._by.indexOf(t) !== -1) s += 6;
        if (item._excerpt.indexOf(t) !== -1) s += 4;
        s += Math.min(countOf(item._text, t), 5);
        if (!s) return; // every term must match somewhere
        score += s;
      }
      out.push({ item: item, score: score });
    });
    out.sort(function (a, b) {
      return b.score - a.score || String(b.item.date || "").localeCompare(String(a.item.date || ""));
    });
    return out;
  }

  /** Escaped HTML with the query terms wrapped in <mark>. */
  function highlight(text, terms) {
    var safe = I2F.escapeHTML(text);
    if (!terms.length) return safe;
    var re = new RegExp("(" + terms.map(function (t) { return t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }).join("|") + ")", "gi");
    return safe.replace(re, "<mark>$1</mark>");
  }

  /** A short passage around the first match, falling back to the excerpt. */
  function snippet(item, terms) {
    var sources = [item.excerpt, item.text || ""];
    for (var s = 0; s < sources.length; s++) {
      var src = sources[s];
      var lower = src.toLowerCase();
      for (var i = 0; i < terms.length; i++) {
        var at = lower.indexOf(terms[i]);
        if (at === -1) continue;
        if (s === 0) return highlight(src, terms);
        var start = Math.max(0, lower.lastIndexOf(" ", Math.max(0, at - 70)));
        var end = Math.min(src.length, at + 150);
        return (start > 0 ? "…" : "") + highlight(src.slice(start, end).trim(), terms) + (end < src.length ? "…" : "");
      }
    }
    return I2F.escapeHTML(item.excerpt);
  }

  function resultHTML(r, terms, i) {
    var item = r.item;
    var slug = CAT_SLUG[item.category] || "";
    var label = TYPE_LABEL[item.type] + (item.type === "article" ? " · " + item.category : item.by ? " · " + item.by : "");
    return (
      '<li><a class="search-result" href="' + I2F.escapeHTML(item.url) + '" style="--i:' + i + '">' +
      '<span class="search-result__type"><span class="topic-dot topic-dot--' + slug + '" aria-hidden="true"></span>' + I2F.escapeHTML(label) +
      (item.preview ? ' <span class="chip chip--preview">Layout preview</span>' : "") + "</span>" +
      '<span class="search-result__title">' + highlight(item.title, terms) + "</span>" +
      '<span class="search-result__snippet">' + snippet(item, terms) + "</span>" +
      "</a></li>"
    );
  }

  I2F.search = {
    load: function () {
      if (index) return Promise.resolve(index);
      if (!loading) {
        loading = fetch(I2F.base + "/search-index.json", { credentials: "same-origin" })
          .then(function (res) {
            if (!res.ok) throw new Error("search index " + res.status);
            return res.json();
          })
          .then(function (data) {
            index = data.map(prep);
            return index;
          })
          .catch(function (err) {
            loading = null;
            throw err;
          });
      }
      return loading;
    },
    query: query,
    terms: termsOf,
    resultHTML: resultHTML,
  };

  /* ------------------------------------------------------------- dialog */
  I2F.ready(function () {
    var dialog = I2F.$("[data-search-dialog]");
    if (!dialog || typeof dialog.showModal !== "function") return; // links fall back to /search/

    var input = I2F.$("[data-search-input]", dialog);
    var list = I2F.$("[data-search-results]", dialog);
    var status = I2F.$("[data-search-status]", dialog);
    var suggest = I2F.$("[data-search-suggest]", dialog);
    var more = I2F.$("[data-search-more]", dialog);
    var moreLink = I2F.$("[data-search-all]", dialog);
    var closeBtn = I2F.$("[data-search-close]", dialog);
    var opener = null;
    var LIMIT = 7;

    var render = function () {
      var q = input.value.trim();
      var terms = termsOf(q);
      if (!terms.length) {
        list.innerHTML = "";
        status.textContent = "";
        suggest.hidden = false;
        more.hidden = true;
        return;
      }
      suggest.hidden = true;
      if (!index) {
        status.textContent = "Loading…";
        return;
      }
      var results = query(q);
      list.innerHTML = results.slice(0, LIMIT).map(function (r, i) { return resultHTML(r, terms, i); }).join("");
      status.textContent = results.length
        ? results.length + (results.length === 1 ? " result" : " results") + " for “" + q + "”"
        : "No results for “" + q + "”. Try a broader word, or browse a theme below.";
      if (!results.length) suggest.hidden = false;
      more.hidden = results.length <= LIMIT;
      moreLink.href = I2F.base + "/search/?q=" + encodeURIComponent(q);
      moreLink.firstChild.textContent = "See all " + results.length + " results";
    };

    var open = function (trigger) {
      opener = trigger || document.activeElement;
      dialog.showModal();
      input.focus();
      input.select();
      I2F.search
        .load()
        .then(render)
        .catch(function () {
          status.textContent = "Search is unavailable right now. Press Enter to try the search page.";
        });
      render();
    };

    var close = function () {
      if (dialog.open) dialog.close();
    };

    dialog.addEventListener("close", function () {
      if (opener && opener.focus) opener.focus({ preventScroll: true });
    });

    I2F.$$("[data-search-open]").forEach(function (el) {
      el.addEventListener("click", function (e) {
        e.preventDefault();
        open(el);
      });
    });

    closeBtn.addEventListener("click", close);
    dialog.addEventListener("click", function (e) {
      if (e.target === dialog) close(); // backdrop
    });

    input.addEventListener("input", I2F.debounce(render, 70));

    // ↓ from the input into the results, ↑/↓ between results
    dialog.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      var links = I2F.$$(".search-result", list);
      if (!links.length) return;
      var at = links.indexOf(document.activeElement);
      e.preventDefault();
      if (e.key === "ArrowDown") (links[at + 1] || links[0]).focus();
      else if (at <= 0) input.focus();
      else links[at - 1].focus();
    });

    document.addEventListener("keydown", function (e) {
      if (dialog.open) return;
      var t = e.target;
      var typing = t && (t.isContentEditable || /^(input|textarea|select)$/i.test(t.tagName));
      if ((e.key === "/" && !typing) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")) {
        e.preventDefault();
        open(null);
      }
    });
  });

  /* -------------------------------------------------------- search page */
  I2F.ready(function () {
    var form = I2F.$("[data-search-page]");
    if (!form) return;
    var input = I2F.$("input[name=q]", form);
    var list = I2F.$("[data-search-page-results]");
    var status = I2F.$("[data-search-page-status]");
    var suggest = I2F.$("[data-search-page-suggest]");
    var filters = I2F.$("[data-search-filters]");
    var buttons = I2F.$$("[data-type]", filters);
    var type = "all";

    var readURL = function () {
      var params = new URLSearchParams(location.search);
      input.value = params.get("q") || "";
      type = params.get("type") || "all";
    };

    var writeURL = function (push) {
      var params = new URLSearchParams();
      if (input.value.trim()) params.set("q", input.value.trim());
      if (type !== "all") params.set("type", type);
      var url = location.pathname + (params.toString() ? "?" + params : "");
      if (push) history.pushState(null, "", url);
      else history.replaceState(null, "", url);
    };

    var render = function () {
      var q = input.value.trim();
      var terms = termsOf(q);
      buttons.forEach(function (b) {
        b.setAttribute("aria-pressed", String(b.getAttribute("data-type") === type));
      });
      if (!terms.length) {
        list.innerHTML = "";
        status.textContent = "";
        filters.hidden = true;
        suggest.hidden = false;
        document.title = "Search — Ignite2Flourish";
        return;
      }
      var all = query(q);
      var counts = { all: all.length };
      all.forEach(function (r) {
        counts[r.item.type] = (counts[r.item.type] || 0) + 1;
      });
      I2F.$$("[data-type-count]", filters).forEach(function (el) {
        el.textContent = String(counts[el.getAttribute("data-type-count")] || 0);
      });
      var results = type === "all" ? all : all.filter(function (r) { return r.item.type === type; });
      filters.hidden = !all.length;
      suggest.hidden = !!results.length;
      list.innerHTML = results.map(function (r, i) { return resultHTML(r, terms, Math.min(i, 8)); }).join("");
      status.textContent = results.length
        ? results.length + (results.length === 1 ? " result" : " results") + " for “" + q + "”"
        : all.length
        ? "No " + TYPE_LABEL[type].toLowerCase() + "s match “" + q + "”."
        : "No results for “" + q + "”. Check the spelling, try a broader word, or browse below.";
      document.title = "Search: " + q + " — Ignite2Flourish";
    };

    var run = function () {
      if (!termsOf(input.value).length) return render();
      status.textContent = "Searching…";
      I2F.search
        .load()
        .then(render)
        .catch(function () {
          status.textContent = "Search is unavailable right now. Please try again shortly.";
        });
    };

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      writeURL(true);
      run();
    });
    input.addEventListener(
      "input",
      I2F.debounce(function () {
        writeURL(false);
        run();
      }, 160)
    );
    buttons.forEach(function (b) {
      b.addEventListener("click", function () {
        type = b.getAttribute("data-type");
        writeURL(false);
        render();
      });
    });
    window.addEventListener("popstate", function () {
      readURL();
      run();
    });

    readURL();
    run();
    if (!input.value) input.focus();
  });
})();
