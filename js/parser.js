window.SD = window.SD || {};
(function (SD) {
  const COLUMN_MAP = {
    销售日期: "sale_date", 销售单据号: "order_no", 业务类别: "business_type", 销售人员: "salesperson",
    客户类别: "customer_type", 客户编码: "customer_code", 客户名称: "customer_name", 商品类别: "product_category",
    商品编号: "product_code", 商品名称: "product_name", 规格型号: "spec", 品牌: "brand", 单位: "unit",
    仓库: "warehouse", 数量: "quantity", 销售收入: "revenue", 销售成本: "cost", 销售毛利: "gross_profit", 毛利率: "gross_margin",
  };
  const REQUIRED_COLUMNS = ["销售日期", "销售人员", "销售收入", "销售成本"];
  const NUMERIC_FIELDS = new Set(["quantity", "revenue", "cost", "gross_profit", "gross_margin"]);

  function toFloat(value) {
    if (value == null || value === "") return 0;
    if (typeof value === "number") return Number.isFinite(value) ? value : 0;
    const n = parseFloat(String(value).trim().replace(/,/g, "").replace(/%/g, ""));
    return Number.isFinite(n) ? n : 0;
  }

  function toStr(value) {
    if (value == null) return null;
    const s = String(value).trim();
    return s || null;
  }

  function toDate(value) {
    if (value == null || value === "") return null;
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
    if (typeof value === "number" && window.XLSX?.SSF) {
      const d = window.XLSX.SSF.parse_date_code(value);
      if (d) return new Date(d.y, d.m - 1, d.d);
    }
    const dt = new Date(value);
    return Number.isNaN(dt.getTime()) ? null : dt;
  }

  function monthKey(d) {
    if (!(d instanceof Date)) return null;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }

  SD.parseSalesExcel = async function parseSalesExcel(buffer) {
    const XLSX = window.XLSX;
    if (!XLSX) throw new Error("Excel 解析库未加载，请检查网络连接");

    const wb = XLSX.read(buffer, { type: "array", cellDates: true });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const table = XLSX.utils.sheet_to_json(sheet, { defval: null, raw: false });
    if (!table.length) throw new Error("Excel 中没有数据行");

    const columns = Object.keys(table[0]).map((c) => String(c).trim());
    const missing = REQUIRED_COLUMNS.filter((c) => !columns.includes(c));
    if (missing.length) throw new Error(`缺少必要列：${missing.join("、")}。请使用标准销售明细模板。`);

    const presentMap = Object.fromEntries(Object.entries(COLUMN_MAP).filter(([col]) => columns.includes(col)));
    const rows = [];
    const months = new Set();
    let skippedEmpty = 0;
    const warnings = [];

    for (const raw of table) {
      const record = {};
      for (const [col, field] of Object.entries(presentMap)) {
        const value = raw[col];
        if (NUMERIC_FIELDS.has(field)) record[field] = toFloat(value);
        else if (field === "sale_date") record[field] = toDate(value);
        else record[field] = toStr(value);
      }
      if (!record.sale_date && !record.revenue) { skippedEmpty += 1; continue; }
      const mk = monthKey(record.sale_date);
      record.month = mk;
      if (mk) months.add(mk);
      if (record.gross_profit == null || record.gross_profit === 0) {
        record.gross_profit = (record.revenue || 0) - (record.cost || 0);
      }
      if (!record.gross_margin && record.revenue) {
        record.gross_margin = record.gross_profit / record.revenue;
      }
      rows.push(record);
    }

    if (!rows.length) throw new Error("未解析到有效数据行");
    if (skippedEmpty) warnings.push(`已跳过 ${skippedEmpty} 行空数据。`);
    const monthList = [...months].sort();
    return { rows, rowCount: rows.length, monthMin: monthList[0] || null, monthMax: monthList.at(-1) || null, warnings };
  };
})(SD);
