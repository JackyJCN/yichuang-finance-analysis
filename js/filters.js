window.SD = window.SD || {};
(function (SD) {
  var FIELD_MAP = {
    salesperson: "salesperson",
    customer_type: "customer_type",
    customer: "customer_name",
    product_code: "product_code",
  };

  SD.searchFilterOptions = function searchFilterOptions(rows, field, query) {
    var key = FIELD_MAP[field] || field;
    var set = new Set();
    rows.forEach(function (r) {
      var v = r[key];
      if (v) set.add(String(v));
    });
    var list = Array.from(set).sort();
    if (query) {
      var q = query.toLowerCase();
      list = list.filter(function (v) { return v.toLowerCase().indexOf(q) >= 0; });
    }
    return list.slice(0, 80);
  };

  SD.createMultiSelect = function createMultiSelect(config) {
    var value = (config.value || []).slice();
    var options = config.options || [];
    var open = false;
    var timer = null;

    var wrap = document.createElement("div");
    wrap.className = "msel";
    if (config.width) wrap.style.width = config.width + "px";
    wrap.innerHTML =
      '<div class="msel-inner">' +
      '<div class="msel-tags"></div>' +
      '<input class="msel-input" type="text" autocomplete="off" />' +
      "</div>" +
      '<div class="msel-panel hidden"></div>' +
      '<button type="button" class="msel-clear" title="清空">&times;</button>';

    var tagsEl = wrap.querySelector(".msel-tags");
    var input = wrap.querySelector(".msel-input");
    var panel = wrap.querySelector(".msel-panel");
    var clearBtn = wrap.querySelector(".msel-clear");
    input.placeholder = config.placeholder || "请选择";

    function renderTags() {
      tagsEl.innerHTML = value.map(function (v) {
        return '<span class="msel-tag">' + SD.escapeHtml(v) + '<button type="button" data-v="' + SD.escapeHtml(v) + '">&times;</button></span>';
      }).join("");
      tagsEl.querySelectorAll("button").forEach(function (btn) {
        btn.onclick = function (e) {
          e.stopPropagation();
          value = value.filter(function (x) { return x !== btn.getAttribute("data-v"); });
          renderTags();
          config.onChange(value.slice());
        };
      });
      clearBtn.style.display = value.length ? "block" : "none";
    }

    function renderPanel(list) {
      if (!list.length) {
        panel.innerHTML = '<div class="msel-empty">无匹配项</div>';
        return;
      }
      panel.innerHTML = list.map(function (opt) {
        var checked = value.indexOf(opt) >= 0;
        return '<label class="msel-opt"><input type="checkbox" value="' + SD.escapeHtml(opt) + '"' + (checked ? " checked" : "") + " /> " + SD.escapeHtml(opt) + "</label>";
      }).join("");
      panel.querySelectorAll("input").forEach(function (cb) {
        cb.onchange = function () {
          var v = cb.value;
          if (cb.checked) {
            if (value.indexOf(v) < 0) value.push(v);
          } else {
            value = value.filter(function (x) { return x !== v; });
          }
          renderTags();
          config.onChange(value.slice());
        };
      });
    }

    function refreshOptions() {
      var q = input.value.trim();
      var list = config.searchFn ? config.searchFn(q) : options;
      if (!config.searchFn) {
        if (q) {
          var lower = q.toLowerCase();
          list = options.filter(function (o) { return o.toLowerCase().indexOf(lower) >= 0; });
        } else {
          list = options;
        }
      }
      renderPanel(list);
    }

    function showPanel() {
      open = true;
      panel.classList.remove("hidden");
      refreshOptions();
    }

    function hidePanel() {
      open = false;
      panel.classList.add("hidden");
      input.value = "";
    }

    input.onfocus = showPanel;
    input.oninput = function () {
      clearTimeout(timer);
      timer = setTimeout(refreshOptions, 200);
    };
    clearBtn.onclick = function (e) {
      e.stopPropagation();
      value = [];
      renderTags();
      config.onChange([]);
    };

    document.addEventListener("click", function onDoc(e) {
      if (!wrap.contains(e.target)) hidePanel();
    });

    renderTags();

    return {
      el: wrap,
      getValue: function () { return value.slice(); },
      setValue: function (v) { value = v.slice(); renderTags(); },
      setOptions: function (opts) { options = opts; if (open) refreshOptions(); },
      destroy: function () { wrap.remove(); },
    };
  };

  SD.escapeHtml = function escapeHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  };
})(SD);
