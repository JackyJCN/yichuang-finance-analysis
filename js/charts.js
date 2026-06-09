window.SD = window.SD || {};
(function (SD) {
  var PIE_COLORS = ["#00e5ff", "#ff00aa", "#39ff14", "#7b2fff", "#ff9f1a", "#66eeff"];
  var PIE_COLORS_EXPORT = ["#0284c7", "#db2777", "#16a34a", "#7c3aed", "#d97706", "#0891b2"];
  var BAR_COLORS = { revenue: "#00e5ff", cost: "#ff9f1a", gross_profit: "#39ff14" };
  var BAR_COLORS_EXPORT = { revenue: "#0284c7", cost: "#d97706", gross_profit: "#16a34a" };

  function theme(forExport) {
    return {
      text: forExport ? "#333333" : "#8ba4b8",
      title: forExport ? "#1a1a1a" : "#e0f7ff",
      axisLine: forExport ? "#cccccc" : "rgba(0, 229, 255, 0.28)",
      barLabel: forExport
        ? { show: true, position: "top", distance: 8, fontSize: 13, fontWeight: 600, color: "#1a1a1a",
            backgroundColor: "#f0f0f0", padding: [4, 7], borderRadius: 3, borderColor: "#cccccc", borderWidth: 1 }
        : { show: true, position: "top", distance: 8, fontSize: 12, fontWeight: 600, color: "#e8f4ff",
            backgroundColor: "rgba(6, 10, 18, 0.88)", padding: [3, 6], borderRadius: 3,
            borderColor: "rgba(0, 229, 255, 0.25)", borderWidth: 1 },
      pieLabel: forExport
        ? { show: true, color: "#1a1a1a", fontSize: 13, fontWeight: 600, backgroundColor: "#f5f5f5",
            padding: [5, 8], borderRadius: 3, borderColor: "#cccccc", borderWidth: 1, lineHeight: 16 }
        : { show: true, color: "#e8f4ff", fontSize: 12, fontWeight: 600, backgroundColor: "rgba(6, 10, 18, 0.88)",
            padding: [4, 7], borderRadius: 3, borderColor: "rgba(0, 229, 255, 0.25)", borderWidth: 1, lineHeight: 16 },
    };
  }

  function toWan(v) {
    return Math.round((v / 10000) * 10) / 10;
  }

  function fmtYuan(v) {
    return Number(v || 0).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " 元";
  }

  SD.disposeCharts = function disposeCharts(root) {
    if (typeof echarts === "undefined") return;
    var scope = root || document;
    scope.querySelectorAll("[data-chart]").forEach(function (el) {
      var inst = echarts.getInstanceByDom(el);
      if (inst) inst.dispose();
    });
  };

  SD.renderChartEmpty = function renderChartEmpty(el, filterActive, hasData, height) {
    height = height || 280;
    el.innerHTML = '<div class="chart-empty" style="height:' + height + 'px">' +
      (hasData ? "当前筛选条件下暂无数据" : "请选择筛选条件后查看") + "</div>";
  };

  /** 饼图/圆环图容器保持 1:1，避免被拉成椭圆 */
  SD.fitPieContainer = function fitPieContainer(el) {
    if (!el) return 0;
    el.classList.add("chart-pie");
    el.style.height = "";
    return el.clientWidth || el.offsetWidth || 0;
  };

  function initPieChart(el, option) {
    SD.fitPieContainer(el);
    var chart = echarts.init(el);
    chart.setOption(option);
    SD.fitPieContainer(el);
    chart.resize();
    return chart;
  }

  SD.whenEcharts = function whenEcharts(run) {
    if (window.echarts) {
      run();
      return;
    }
    if (SD.ensureEcharts) {
      SD.ensureEcharts().then(run).catch(function () {});
    }
  };

  SD.renderMetricBar = function renderMetricBar(el, data, metricKey, title, forExport, yoyTrend) {
    if (!data || !data.length) {
      SD.renderChartEmpty(el, true, false, 280);
      return null;
    }
    var t = theme(!!forExport);
    var chart = echarts.init(el);
    var color = (forExport ? BAR_COLORS_EXPORT : BAR_COLORS)[metricKey] || "#00e5ff";
    var many = data.length > 6;
    var yoyMap = {};
    (yoyTrend || []).forEach(function (y) { yoyMap[y.month] = y; });

    function yoyTooltipLines(monthKey) {
      var y = yoyMap[monthKey];
      if (!y) {
        var parts = String(monthKey).split("-");
        if (parts.length === 2) {
          var prevM = (parseInt(parts[0], 10) - 1) + "-" + parts[1];
          return ['<span style="color:#888">同比 vs ' + prevM + "：暂无去年同期数据</span>"];
        }
        return [];
      }
      var cfg = metricKey === "revenue"
        ? { change: y.revenue_yoy_change, rate: y.revenue_yoy_rate, vs: y.compare_month }
        : metricKey === "cost"
          ? { change: y.cost_yoy_change, rate: y.cost_yoy_rate, vs: y.compare_month }
          : { change: y.gross_profit_yoy_change, rate: y.gross_profit_yoy_rate, vs: y.compare_month };
      var sign = cfg.change >= 0 ? "+" : "";
      var rateStr = cfg.rate == null ? "—" : (cfg.rate >= 0 ? "+" : "") + cfg.rate.toFixed(2) + "%";
      return [
        '<span style="color:#888">同比 vs ' + cfg.vs + "</span>",
        "同比增减：" + sign + fmtYuan(cfg.change),
        "同比增减率：" + rateStr,
      ];
    }

    chart.setOption({
      animation: !forExport,
      backgroundColor: forExport ? "#ffffff" : "transparent",
      title: { text: title + "(万元)", left: "center", textStyle: { fontSize: forExport ? 16 : 15, color: t.title, fontWeight: 700 } },
      tooltip: forExport ? { show: false } : {
        trigger: "axis", axisPointer: { type: "shadow" },
        formatter: function (params) {
          var row = data[params[0].dataIndex];
          if (!row) return "";
          return [
            row.month,
            "销售收入：" + fmtYuan(row.revenue),
            "成本：" + fmtYuan(row.cost),
            "毛利额：" + fmtYuan(row.gross_profit),
            "毛利率：" + (row.gross_margin * 100).toFixed(2) + "%",
          ].concat(yoyTooltipLines(row.month)).join("<br/>");
        },
      },
      grid: { left: 48, right: 16, top: forExport ? 56 : 48, bottom: many ? 52 : 28, borderWidth: 0 },
      xAxis: {
        type: "category", data: data.map(function (d) { return d.month; }),
        axisLabel: { interval: 0, fontSize: forExport ? 13 : 12, rotate: many ? 35 : 0, color: t.text },
        axisLine: { show: !forExport, lineStyle: { color: t.axisLine } },
        axisTick: { show: !forExport }, splitLine: { show: false },
      },
      yAxis: {
        type: "value", min: 0,
        axisLine: { show: false }, axisTick: { show: false }, splitLine: { show: false },
        axisLabel: { color: t.text, fontSize: forExport ? 13 : 12,
          formatter: function (v) { return Number.isInteger(v) ? String(v) : v.toFixed(1); } },
      },
      series: [{
        name: title, type: "bar", barMaxWidth: 46,
        data: data.map(function (d) { return toWan(d[metricKey]); }),
        itemStyle: { color: color, borderRadius: [4, 4, 0, 0] },
        label: Object.assign({}, t.barLabel, { formatter: function (p) { return String(p.value); } }),
      }],
    });
    return chart;
  };

  SD.renderSalespersonPie = function renderSalespersonPie(el, data, forExport) {
    var total = data.reduce(function (s, d) { return s + d.revenue; }, 0);
    if (!data.length || !total) {
      SD.renderChartEmpty(el, true, false, 360);
      return null;
    }
    var t = theme(!!forExport);
    return initPieChart(el, {
      animation: !forExport,
      backgroundColor: forExport ? "#ffffff" : "transparent",
      tooltip: forExport ? { show: false } : { trigger: "item", formatter: function (p) {
        return p.name + "<br/>销售收入: " + Number(p.value).toLocaleString() + " 元<br/>占比: " + p.percent + "%";
      }},
      legend: { orient: "horizontal", top: 0, left: "center", textStyle: { color: t.text, fontSize: forExport ? 12 : 11 } },
      color: forExport ? PIE_COLORS_EXPORT : PIE_COLORS,
      series: [{
        name: "销售收入占比", type: "pie",
        radius: forExport ? ["0%", "36%"] : ["0%", "40%"],
        center: ["50%", forExport ? "50%" : "52%"], minShowLabelAngle: 8,
        data: data.map(function (d) { return { name: d.name, value: d.revenue }; }),
        label: Object.assign({}, t.pieLabel, {
          formatter: function (p) { return p.percent < 4 ? "" : (p.value / 10000).toFixed(1) + "万\n" + p.percent + "%"; },
        }),
        labelLine: { show: data.length <= 6, length: forExport ? 10 : 14, length2: forExport ? 8 : 12,
          lineStyle: { color: forExport ? "#999999" : "rgba(0, 229, 255, 0.45)" } },
      }],
      graphic: { type: "text", left: "center", bottom: forExport ? 4 : 8,
        style: { text: "总销售额：" + (total / 10000).toFixed(1) + " 万元", fontSize: forExport ? 13 : 12, fill: t.text } },
    });
  };

  SD.renderDonut = function renderDonut(el, data, metric, forExport) {
    metric = metric || "revenue";
    var labels = { revenue: "收入", gross_profit: "毛利" };
    var total = data.reduce(function (s, d) { return s + d[metric]; }, 0);
    if (!data.length || !total) {
      SD.renderChartEmpty(el, true, false, 360);
      return null;
    }
    var t = theme(!!forExport);
    return initPieChart(el, {
      animation: !forExport,
      backgroundColor: forExport ? "#ffffff" : "transparent",
      tooltip: forExport ? { show: false } : { trigger: "item", formatter: function (p) {
        return p.name + "<br/>" + labels[metric] + ": " + Number(p.value).toLocaleString() + "<br/>占比: " + p.percent + "%";
      }},
      legend: { orient: "horizontal", top: 0, left: "center", textStyle: { color: t.text, fontSize: forExport ? 12 : 11 } },
      color: forExport ? PIE_COLORS_EXPORT : PIE_COLORS,
      series: [{
        name: labels[metric], type: "pie",
        radius: forExport ? ["32%", "46%"] : ["36%", "50%"],
        center: ["50%", forExport ? "50%" : "52%"], minShowLabelAngle: 5,
        itemStyle: { borderRadius: 6, borderColor: forExport ? "#ffffff" : "rgba(10, 16, 30, 0.9)", borderWidth: 2 },
        data: data.map(function (d) { return { name: d.name, value: d[metric] }; }),
        label: Object.assign({}, t.pieLabel, {
          formatter: function (p) { return (p.value / 10000).toFixed(1) + "万\n" + p.percent + "%"; },
        }),
        labelLine: { length: forExport ? 10 : 14, length2: forExport ? 8 : 12,
          lineStyle: { color: forExport ? "#999999" : "rgba(0, 229, 255, 0.45)" } },
      }],
    });
  };

  SD.renderPareto = function renderPareto(el, data, forExport) {
    if (!data.length) {
      SD.renderChartEmpty(el, true, false, forExport ? 400 : 520);
      return null;
    }
    var t = theme(!!forExport);
    var chart = echarts.init(el);
    var labelRotate = data.length > 20 ? 45 : 30;
    var bottom = data.length > 20 ? 120 : 90;
    chart.setOption({
      animation: !forExport,
      backgroundColor: forExport ? "#ffffff" : "transparent",
      tooltip: forExport ? { show: false } : {
        trigger: "axis", axisPointer: { type: "shadow" },
        formatter: function (params) {
          var item = data[params[0].dataIndex];
          return item.name + "<br/>收入: " + item.revenue.toLocaleString() +
            "<br/>毛利率: " + (item.gross_margin * 100).toFixed(1) + "%<br/>累计占比: " + item.cumulative_pct + "%";
        },
      },
      legend: { data: ["销售收入", "累计占比"], top: 28, textStyle: { color: t.text, fontSize: forExport ? 13 : 12 } },
      grid: { left: 70, right: 60, top: 40, bottom: bottom },
      xAxis: {
        type: "category", boundaryGap: true, data: data.map(function (d) { return d.name; }),
        axisLabel: { interval: 0, rotate: labelRotate, fontSize: forExport ? 11 : 10, color: t.text,
          formatter: function (v) { return v.length > 10 ? v.slice(0, 10) + "…" : v; } },
        axisLine: { show: !forExport, lineStyle: { color: t.axisLine } },
        axisTick: { show: !forExport },
      },
      yAxis: [
        { type: "value", name: "收入(元)", min: 0, nameTextStyle: { color: t.text, fontSize: forExport ? 13 : 12 },
          axisLine: { show: false }, axisTick: { show: false }, splitLine: { show: false },
          axisLabel: { color: t.text, fontSize: forExport ? 12 : 11 } },
        { type: "value", name: "累计%", min: 0, max: 100, interval: 20,
          nameTextStyle: { color: t.text, fontSize: forExport ? 13 : 12 },
          axisLabel: { formatter: function (v) { return v + "%"; }, color: t.text, fontSize: forExport ? 12 : 11 },
          axisLine: { show: false }, axisTick: { show: false }, splitLine: { show: false } },
      ],
      series: [
        { name: "销售收入", type: "bar", data: data.map(function (d) { return d.revenue; }),
          itemStyle: { color: forExport ? "#0284c7" : "#00e5ff" } },
        { name: "累计占比", type: "line", yAxisIndex: 1, smooth: false,
          symbol: data.length <= 40 ? "circle" : "none", symbolSize: 5,
          data: data.map(function (d) { return d.cumulative_pct; }),
          itemStyle: { color: forExport ? "#db2777" : "#ff00aa" },
          lineStyle: { width: 2, color: forExport ? "#db2777" : "#ff00aa" } },
      ],
    });
    return chart;
  };

  SD.resizeCharts = function resizeCharts(root) {
    if (typeof echarts === "undefined") return;
    var scope = root || document;
    scope.querySelectorAll("[data-chart].chart-pie").forEach(function (el) {
      SD.fitPieContainer(el);
    });
    scope.querySelectorAll("[data-chart]").forEach(function (el) {
      var inst = echarts.getInstanceByDom(el);
      if (inst) inst.resize();
    });
  };
})(SD);
