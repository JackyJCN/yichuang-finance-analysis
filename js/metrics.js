window.SD = window.SD || {};
(function (SD) {
  function margin(revenue, grossProfit) {
    return revenue ? Math.round((grossProfit / revenue) * 10000) / 10000 : 0;
  }

  function applyFilters(rows, f) {
    f = f || {};
    return rows.filter((r) => {
      if (f.months?.length && !f.months.includes(r.month)) return false;
      if (f.salespersons?.length && !f.salespersons.includes(r.salesperson)) return false;
      if (f.customers?.length && !f.customers.includes(r.customer_name)) return false;
      if (f.customer_types?.length && !f.customer_types.includes(r.customer_type)) return false;
      if (f.product_codes?.length && !f.product_codes.includes(r.product_code)) return false;
      return true;
    });
  }

  SD.listMonths = function listMonths(allRows) {
    return [...new Set(allRows.map((r) => r.month).filter(Boolean))].sort();
  };

  SD.getSummary = function getSummary(rows) {
    let revenue = 0, cost = 0, grossProfit = 0, quantity = 0;
    for (const r of rows) {
      revenue += r.revenue || 0;
      cost += r.cost || 0;
      grossProfit += r.gross_profit || 0;
      quantity += r.quantity || 0;
    }
    return {
      revenue: Math.round(revenue * 100) / 100,
      cost: Math.round(cost * 100) / 100,
      gross_profit: Math.round(grossProfit * 100) / 100,
      gross_margin: margin(revenue, grossProfit),
      quantity: Math.round(quantity * 100) / 100,
      order_lines: rows.length,
    };
  };

  function getMonthlyTrend(rows) {
    const map = new Map();
    for (const r of rows) {
      if (!r.month) continue;
      const cur = map.get(r.month) || { revenue: 0, cost: 0, gross_profit: 0 };
      cur.revenue += r.revenue || 0;
      cur.cost += r.cost || 0;
      cur.gross_profit += r.gross_profit || 0;
      map.set(r.month, cur);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([month, v]) => ({
      month, revenue: Math.round(v.revenue * 100) / 100, cost: Math.round(v.cost * 100) / 100,
      gross_profit: Math.round(v.gross_profit * 100) / 100, gross_margin: margin(v.revenue, v.gross_profit),
    }));
  }

  function breakdown(rows, field, limit) {
    limit = limit || 50;
    const map = new Map();
    for (const r of rows) {
      const name = r[field] || "(未填写)";
      const cur = map.get(name) || { revenue: 0, cost: 0, gross_profit: 0 };
      cur.revenue += r.revenue || 0;
      cur.cost += r.cost || 0;
      cur.gross_profit += r.gross_profit || 0;
      map.set(name, cur);
    }
    return [...map.entries()].map(([name, v]) => ({
      name, revenue: Math.round(v.revenue * 100) / 100, cost: Math.round(v.cost * 100) / 100,
      gross_profit: Math.round(v.gross_profit * 100) / 100, gross_margin: margin(v.revenue, v.gross_profit),
    })).sort((a, b) => b.revenue - a.revenue).slice(0, limit);
  }

  SD.pareto80Count = function pareto80Count(customerRows, total) {
    if (!customerRows.length || !total) return 0;
    let cumulative = 0;
    for (let i = 0; i < customerRows.length; i++) {
      cumulative += customerRows[i].revenue;
      if ((cumulative / total) * 100 >= 80) return i + 1;
    }
    return customerRows.length;
  };

  SD.getCustomerPareto = function getCustomerPareto(rows) {
    const all = breakdown(rows, "customer_name", 10000);
    const total = all.reduce((s, r) => s + r.revenue, 0) || 0;
    if (!all.length || !total) return [];
    const out = [];
    let cumulative = 0;
    for (const r of all) {
      cumulative += r.revenue;
      const pct = Math.round((cumulative / total) * 10000) / 100;
      out.push(Object.assign({}, r, { cumulative_pct: pct }));
      if (pct >= 80) break;
    }
    return out;
  };

  SD.getOverview = function getOverview(allRows, filters) {
    filters = filters || {};
    const filtered = applyFilters(allRows, filters);
    const customerAll = breakdown(allRows, "customer_name", 10000);
    const totalRev = customerAll.reduce((s, r) => s + r.revenue, 0);
    return {
      months: SD.listMonths(allRows),
      summary: SD.getSummary(filtered),
      trend: getMonthlyTrend(filtered),
      by_salesperson: breakdown(filtered, "salesperson", 50),
      customer_pareto: SD.getCustomerPareto(filtered),
      customer_count: customerAll.length,
      pareto_80_count: SD.pareto80Count(customerAll, totalRev),
      by_customer_type: breakdown(filtered, "customer_type", 10),
    };
  };

  SD.buildAiContext = function buildAiContext(allRows, filters) {
    const data = SD.getOverview(allRows, filters);
    const s = data.summary;
    const fmt = (n) => n.toLocaleString("zh-CN", { maximumFractionDigits: 2 });
    const lines = [
      `销售收入 ${fmt(s.revenue)} 元，成本 ${fmt(s.cost)} 元，毛利 ${fmt(s.gross_profit)} 元，毛利率 ${(s.gross_margin * 100).toFixed(2)}%`,
      `明细行数 ${s.order_lines}`,
    ];
    if (data.by_salesperson[0]) lines.push(`收入最高销售：${data.by_salesperson[0].name}（${fmt(data.by_salesperson[0].revenue)} 元）`);
    if (data.customer_pareto[0]) lines.push(`Top1 客户：${data.customer_pareto[0].name}，约 ${data.pareto_80_count} 家客户贡献 80% 收入`);
    return lines.join("\n");
  };
})(SD);
