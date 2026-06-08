window.SD = window.SD || {};
(function (SD) {
  var routes = {
    "/": SD.renderDashboard,
    "/dashboard": SD.renderDashboard,
    "/upload": SD.renderUpload,
    "/ai": SD.renderAi,
    "/settings": SD.renderSettings,
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

  function render() {
    if (SD.disposeCharts) SD.disposeCharts();
    var path = parseRoute();
    var root = document.getElementById("app");
    var renderPage = routes[path] || SD.renderDashboard;
    renderPage(root);
    setActiveNav(path);
    document.title = SD.APP_TITLE + " - " + SD.COMPANY_NAME;
  }

  window.addEventListener("hashchange", render);
  window.addEventListener("resize", function () {
    if (SD.resizeCharts) SD.resizeCharts();
  });

  var logo = document.getElementById("brand-logo");
  var subtitle = document.getElementById("brand-subtitle");
  if (logo) {
    logo.src = SD.getLogoSrc();
    logo.decoding = "async";
  }
  if (subtitle) subtitle.textContent = SD.APP_TITLE;

  if (!location.hash || location.hash === "#/" || location.hash === "#") {
    location.replace("#/dashboard");
  }
  render();
})(SD);
