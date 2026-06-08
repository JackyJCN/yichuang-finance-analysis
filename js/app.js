window.SD = window.SD || {};
(function (SD) {
  var routes = {
    "/": "dashboard",
    "/dashboard": "dashboard",
    "/upload": "upload",
    "/ai": "ai",
    "/settings": "settings",
  };

  function parseRoute() {
    var hash = location.hash.replace(/^#/, "") || "/";
    var path = hash.split("?")[0];
    if (path === "/") return "/dashboard";
    return routes[path] ? path : "/dashboard";
  }

  function setActiveNav(path) {
    document.querySelectorAll(".nav-item").forEach(function (a) {
      a.classList.toggle("active", a.getAttribute("data-path") === path);
    });
  }

  function showLoading(root) {
    root.innerHTML = '<div class="app-boot-loading">正在加载模块…</div>';
  }

  function renderPage(path) {
    var root = document.getElementById("app");
    if (!root) return;
    if (SD.disposeCharts) SD.disposeCharts();
    showLoading(root);

    SD.loadPageDeps(path).then(function () {
      var fn = {
        "/dashboard": SD.renderDashboard,
        "/upload": SD.renderUpload,
        "/ai": SD.renderAi,
        "/settings": SD.renderSettings,
      }[path] || SD.renderDashboard;
      fn(root);
      setActiveNav(path);
      document.title = SD.APP_TITLE + " - " + SD.COMPANY_NAME;
    }).catch(function (e) {
      root.innerHTML =
        '<section class="card empty">模块加载失败，请检查网络后刷新页面<br>' +
        '<span class="muted small">' + (e && e.message ? e.message : e) + "</span></section>";
    });
  }

  window.addEventListener("hashchange", function () {
    renderPage(parseRoute());
  });
  window.addEventListener("resize", function () {
    if (SD.resizeCharts) SD.resizeCharts();
  });

  var logo = document.getElementById("brand-logo");
  var subtitle = document.getElementById("brand-subtitle");
  if (logo) {
    logo.src = SD.getLogoSrc();
    logo.loading = "lazy";
    logo.decoding = "async";
  }
  if (subtitle) subtitle.textContent = SD.APP_TITLE;

  if (!location.hash || location.hash === "#/" || location.hash === "#") {
    location.replace("#/dashboard");
  } else {
    renderPage(parseRoute());
  }
})(SD);
