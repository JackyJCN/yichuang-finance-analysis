window.SD = window.SD || {};
SD.renderHome = function renderHome(root) {
  const stats = SD.getStorageStats();
  root.innerHTML =
    '<section class="hero card">' +
    '<img src="' + SD.getLogoSrc() + '" alt="logo" class="logo" onerror="this.style.display=\'none\'" />' +
    "<h1>" + SD.COMPANY_NAME + "</h1>" +
    '<p class="subtitle">' + SD.APP_TITLE + "</p>" +
    '<p class="muted">纯前端版本 · 数据保存在浏览器本地 · 可部署到 Vercel</p>' +
    '<div class="hero-actions"><a class="btn primary" href="#/upload">上传 Excel 数据</a><a class="btn" href="#/dashboard">进入经营看板</a></div></section>' +
    '<section class="grid-3">' +
    '<div class="card metric-card"><div class="label">已导入行数</div><div class="value">' + stats.rowCount.toLocaleString() + "</div></div>" +
    '<div class="card metric-card"><div class="label">本地占用</div><div class="value">' + stats.sizeKb + " KB</div></div>" +
    '<div class="card metric-card"><div class="label">部署方式</div><div class="value small">HTML + JS 静态站点</div></div></section>' +
    '<section class="card"><h2>使用说明</h2><ol class="steps">' +
    "<li>在「数据上传」导入标准销售明细 Excel（33 列模板）</li>" +
    "<li>在「经营看板」查看收入、成本、毛利与帕累托分析</li>" +
    "<li>在「设置」配置 AI Key 后可使用智能解读</li></ol>" +
    '<p class="warn">数据仅存于本浏览器，清除缓存会丢失。</p></section>';
};
