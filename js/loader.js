window.SD = window.SD || {};
(function (SD) {
  var pending = {};

  function loadScript(src, key) {
    key = key || src;
    if (pending[key]) return pending[key];
    pending[key] = new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = function () { resolve(); };
      s.onerror = function () {
        delete pending[key];
        reject(new Error("脚本加载失败: " + src));
      };
      document.head.appendChild(s);
    });
    return pending[key];
  }

  function loadFirst(urls, key) {
    var i = 0;
    function next() {
      if (i >= urls.length) return Promise.reject(new Error("全部 CDN 加载失败: " + key));
      return loadScript(urls[i++], key).catch(next);
    }
    return next();
  }

  SD.ensureEcharts = function ensureEcharts() {
    if (window.echarts) return Promise.resolve();
    return loadFirst([
      "https://cdn.bootcdn.net/ajax/libs/echarts/5.5.1/echarts.min.js",
      "https://cdn.jsdelivr.net/npm/echarts@5.5.1/dist/echarts.min.js",
    ], "echarts");
  };

  SD.ensureXlsx = function ensureXlsx() {
    if (window.XLSX) return Promise.resolve();
    return loadFirst([
      "https://cdn.bootcdn.net/ajax/libs/xlsx/0.18.5/xlsx.full.min.js",
      "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js",
    ], "xlsx");
  };

  SD.ensureHtml2canvas = function ensureHtml2canvas() {
    if (window.html2canvas) return Promise.resolve();
    return loadFirst([
      "https://cdn.bootcdn.net/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
      "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js",
    ], "html2canvas");
  };

  SD.ensureJsPDF = function ensureJsPDF() {
    if (window.jspdf) return Promise.resolve();
    return loadFirst([
      "https://cdn.bootcdn.net/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
      "https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js",
    ], "jspdf");
  };

  SD.ensureLogoData = function ensureLogoData() {
    if (SD.COMPANY_LOGO_DATA) return Promise.resolve();
    return loadScript("./js/logo-data.js", "logo-data");
  };

  SD.ensureExportLibs = function ensureExportLibs() {
    return Promise.all([
      SD.ensureHtml2canvas(),
      SD.ensureJsPDF(),
      SD.ensureLogoData(),
    ]);
  };

  /** 后台预加载 ECharts，不阻塞页面进入 */
  SD.preloadEcharts = function preloadEcharts() {
    SD.ensureEcharts().catch(function () {});
  };

  SD.preloadEcharts();
})(SD);
