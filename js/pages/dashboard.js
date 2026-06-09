window.SD = window.SD || {};
SD.renderDashboard = function renderDashboard(root) {
  var allRows = SD.loadRecords();
  var monthOptions = SD.listMonths(allRows);
  var filterState = {
    months: [],
    salespersons: [],
    customer_types: [],
    customers: [],
    product_codes: [],
  };
  var donutMetric = "revenue";
  var lastView = null;
  var selects = {};

  function fmt(n) {
    return Number(n || 0).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function filterActive() {
    return filterState.months.length > 0 || filterState.salespersons.length > 0 ||
      filterState.customer_types.length > 0 || filterState.customers.length > 0 || filterState.product_codes.length > 0;
  }

  function readFilters() {
    return {
      months: filterState.months.length ? filterState.months : undefined,
      salespersons: filterState.salespersons.length ? filterState.salespersons : undefined,
      customer_types: filterState.customer_types.length ? filterState.customer_types : undefined,
      customers: filterState.customers.length ? filterState.customers : undefined,
      product_codes: filterState.product_codes.length ? filterState.product_codes : undefined,
    };
  }

  root.innerHTML =
    '<div class="page-head">' +
    '<h1 class="page-title">经营看板</h1>' +
    '<button type="button" class="btn primary" id="btn-export" disabled>导出 PDF</button>' +
    "</div>" +
    '<section class="card cyber-panel filter-bar">' +
    '<div class="filter-row">' +
    '<div class="filter-item"><span class="filter-label">月份</span><div id="f-months"></div></div>' +
    '<div class="filter-item"><span class="filter-label">销售人员</span><div id="f-sales"></div></div>' +
    '<div class="filter-item"><span class="filter-label">客户类别</span><div id="f-ctype"></div></div>' +
    '<div class="filter-item"><span class="filter-label">客户</span><div id="f-customer"></div></div>' +
    '<div class="filter-item"><span class="filter-label">商品编码</span><div id="f-product"></div></div>' +
    "</div>" +
    '<p class="filter-hint muted" id="filter-hint"></p></section>' +
    '<div id="dash-body"></div>';

  var body = root.querySelector("#dash-body");
  var hint = root.querySelector("#filter-hint");
  var exportBtn = root.querySelector("#btn-export");

  selects.months = SD.createMultiSelect({
    placeholder: "请选择月份(可多选)", width: 220, value: filterState.months, options: monthOptions,
    onChange: function (v) { filterState.months = v; paint(); },
  });
  root.querySelector("#f-months").appendChild(selects.months.el);

  selects.sales = SD.createMultiSelect({
    placeholder: "搜索销售人员", width: 200, value: [],
    searchFn: function (q) { return SD.searchFilterOptions(allRows, "salesperson", q); },
    onChange: function (v) { filterState.salespersons = v; paint(); },
  });
  root.querySelector("#f-sales").appendChild(selects.sales.el);

  selects.ctype = SD.createMultiSelect({
    placeholder: "经销商/终端客户", width: 180, value: [],
    searchFn: function (q) { return SD.searchFilterOptions(allRows, "customer_type", q); },
    onChange: function (v) { filterState.customer_types = v; paint(); },
  });
  root.querySelector("#f-ctype").appendChild(selects.ctype.el);

  selects.customer = SD.createMultiSelect({
    placeholder: "输入客户关键字", width: 240, value: [],
    searchFn: function (q) { return SD.searchFilterOptions(allRows, "customer", q); },
    onChange: function (v) { filterState.customers = v; paint(); },
  });
  root.querySelector("#f-customer").appendChild(selects.customer.el);

  selects.product = SD.createMultiSelect({
    placeholder: "输入编码/名称关键字", width: 240, value: [],
    searchFn: function (q) { return SD.searchFilterOptions(allRows, "product_code", q); },
    onChange: function (v) { filterState.product_codes = v; paint(); },
  });
  root.querySelector("#f-product").appendChild(selects.product.el);

  function paintCharts(area, forExport) {
    if (!lastView || !area) return;
    var draw = function () {
      var v = lastView;
      if (v.trend.length) {
        SD.renderMetricBar(area.querySelector("#chart-revenue"), v.trend, "revenue", "销售收入", forExport, v.yoy_trend);
        SD.renderMetricBar(area.querySelector("#chart-cost"), v.trend, "cost", "销售成本", forExport, v.yoy_trend);
        SD.renderMetricBar(area.querySelector("#chart-profit"), v.trend, "gross_profit", "销售毛利", forExport, v.yoy_trend);
      }
      SD.renderSalespersonPie(area.querySelector("#chart-sales"), v.by_salesperson, forExport);
      SD.renderDonut(area.querySelector("#chart-type"), v.by_customer_type, donutMetric, forExport);
      SD.renderPareto(area.querySelector("#chart-pareto"), v.customer_pareto, forExport);
      requestAnimationFrame(function () { SD.resizeCharts(area); });
    };
    if (SD.whenEcharts) SD.whenEcharts(draw);
    else draw();
  }

  exportBtn.onclick = function () {
    var area = body.querySelector("#report-area");
    if (!area || !lastView) return;

    var oldText = exportBtn.textContent;
    exportBtn.disabled = true;
    exportBtn.textContent = "导出中…";

    var dateEl = area.querySelector(".export-date");
    var toggle = area.querySelector("#metric-toggle");
    var metricHint = area.querySelector(".export-metric-hint");

    if (dateEl) {
      dateEl.textContent = "导出时间：" + new Date().toLocaleString("zh-CN");
      dateEl.style.display = "block";
    }
    if (toggle) toggle.style.display = "none";
    if (metricHint) {
      metricHint.textContent = donutMetric === "revenue" ? "按收入" : "按毛利";
      metricHint.style.display = "inline";
    }
    area.classList.add("report-export-zone");

    SD.disposeCharts(area);
    paintCharts(area, true);
    SD.resizeCharts(area);

    SD.exportElementToPdf(area, SD.buildExportFileName(filterState.months)).then(function (ok) {
      if (ok) alert("PDF 已导出。若无法覆盖同名文件，请先关闭已打开的 PDF 再保存。");
    }).catch(function (e) {
      alert("PDF 导出失败：" + (e.message || e));
    }).finally(function () {
      area.classList.remove("report-export-zone");
      if (dateEl) dateEl.style.display = "none";
      if (toggle) toggle.style.display = "";
      if (metricHint) metricHint.style.display = "none";
      SD.disposeCharts(area);
      paintCharts(area, false);
      exportBtn.disabled = false;
      exportBtn.textContent = oldText;
    });
  };

  function paint() {
    SD.disposeCharts(body);
    var active = filterActive();
    var hasUploaded = monthOptions.length > 0;

    hint.textContent = !active && hasUploaded ? "请至少选择一项筛选条件，图表与指标才会加载数据" : "";
    hint.style.display = !active && hasUploaded ? "block" : "none";

    if (!hasUploaded) {
      body.innerHTML = '<section class="card empty">暂无数据，请先到「数据上传」导入销售明细</section>';
      exportBtn.disabled = true;
      lastView = null;
      return;
    }

    if (!active) {
      body.innerHTML = "";
      exportBtn.disabled = true;
      lastView = null;
      return;
    }

    var filters = readFilters();
    var view = SD.getOverview(allRows, filters);
    var s = view.summary;
    var hasResult = s.order_lines > 0;
    exportBtn.disabled = !hasResult;
    lastView = view;

    if (!hasResult) {
      body.innerHTML = '<section class="card empty">当前筛选条件下暂无数据</section>';
      return;
    }

    body.innerHTML =
      '<div class="dashboard-report" id="report-area">' +
      '<div class="pdf-section">' +
      '<div class="report-header">' +
      '<div class="company-brand company-brand--report">' +
      '<img src="' + SD.getLogoSrc() + '" class="company-brand__logo" alt="logo" onerror="this.style.display=\'none\'" />' +
      '<div class="company-brand__text">' +
      '<div class="company-brand__subtitle">' + SD.REPORT_TITLE + "</div>" +
      '<div class="company-brand__meta export-date" style="display:none"></div></div></div></div>' +
      '<section class="grid-4 export-grid-4">' +
      '<div class="card metric-card"><div class="label">销售收入(元)</div><div class="value">' + fmt(s.revenue) + "</div></div>" +
      '<div class="card metric-card"><div class="label">销售成本(元)</div><div class="value">' + fmt(s.cost) + "</div></div>" +
      '<div class="card metric-card accent-green"><div class="label">销售毛利(元)</div><div class="value">' + fmt(s.gross_profit) + "</div></div>" +
      '<div class="card metric-card accent-pink"><div class="label">毛利率</div><div class="value">' + (s.gross_margin * 100).toFixed(2) + "%</div></div></section></div>" +
      '<div class="pdf-section"><section class="card chart-card"><div class="chart" data-chart id="chart-revenue"></div></section></div>' +
      '<div class="pdf-section"><section class="card chart-card"><div class="chart" data-chart id="chart-cost"></div></section></div>' +
      '<div class="pdf-section"><section class="card chart-card"><div class="chart" data-chart id="chart-profit"></div></section></div>' +
      '<div class="pdf-section"><section class="grid-2 export-grid-2">' +
      '<div class="card chart-card"><h3 class="card-title">销售人员销售额占比</h3><div class="chart chart-pie" data-chart id="chart-sales"></div></div>' +
      '<div class="card chart-card"><div class="card-head-row"><h3 class="card-title">客户类别构成</h3>' +
      '<span class="export-metric-hint muted small" style="display:none"></span>' +
      '<div class="seg-toggle" id="metric-toggle">' +
      '<button type="button" class="seg active" data-m="revenue">按收入</button>' +
      '<button type="button" class="seg" data-m="gross_profit">按毛利</button></div></div>' +
      '<div class="chart chart-pie" data-chart id="chart-type"></div></div></section></div>' +
      '<div class="pdf-section"><section class="card chart-card">' +
      '<h3 class="card-title center">客户帕累托图分析' +
      '<span class="muted small">（以下 ' + view.pareto_80_count + " 家客户贡献约 80% 收入）</span></h3>" +
      '<div class="chart pareto" data-chart id="chart-pareto"></div></section></div></div>';

    body.querySelectorAll("#metric-toggle .seg").forEach(function (btn) {
      btn.onclick = function () {
        donutMetric = btn.getAttribute("data-m");
        body.querySelectorAll("#metric-toggle .seg").forEach(function (b) { b.classList.toggle("active", b === btn); });
        SD.renderDonut(body.querySelector("#chart-type"), lastView.by_customer_type, donutMetric, false);
        SD.resizeCharts(body.querySelector("#report-area"));
      };
    });

    paintCharts(body.querySelector("#report-area"), false);
  }

  paint();
};
