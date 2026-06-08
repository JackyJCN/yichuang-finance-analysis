window.SD = window.SD || {};
SD.renderSettings = function renderSettings(root) {
  var cfg = SD.loadAiConfig();
  var preset = SD.AI_PRESETS[cfg.provider] || SD.AI_PRESETS.qwen;
  var providerOptions = Object.keys(SD.AI_PRESETS).map(function (k) {
    var v = SD.AI_PRESETS[k];
    return '<option value="' + k + '"' + (cfg.provider === k ? " selected" : "") + ">" + v.label + "</option>";
  }).join("");

  root.innerHTML =
    '<h1 class="page-title">设置</h1>' +
    '<section class="card"><h2 class="card-title">AI 设置</h2>' +
    '<p class="muted">API Key 仅保存在浏览器 localStorage，不会上传到服务器。</p>' +
    '<div class="form-grid">' +
    '<label>服务商<select id="ai-provider">' + providerOptions + "</select></label>" +
    '<label>API Key<input type="password" id="ai-key" placeholder="sk-..." value="' + (cfg.apiKey || "") + '" /></label>' +
    '<label>Base URL<input type="text" id="ai-base" value="' + (cfg.baseUrl || preset.baseUrl) + '" /></label>' +
    '<label>模型<input type="text" id="ai-model" value="' + (cfg.model || preset.model) + '" /></label></div>' +
    '<label class="checkbox"><input type="checkbox" id="ai-enabled"' + (cfg.aiEnabled !== false ? " checked" : "") + " /> 启用 AI 功能</label>" +
    '<div class="toolbar"><button type="button" class="btn primary" id="save-ai">保存设置</button></div>' +
    '<div id="settings-msg" class="msg"></div>' +
    '<p class="warn">纯前端部署时，部分 API 可能因浏览器跨域(CORS)限制无法直接调用。若失败请使用本地安装版。</p></section>';

  var providerSel = root.querySelector("#ai-provider");
  var msg = root.querySelector("#settings-msg");

  providerSel.onchange = function () {
    var p = SD.AI_PRESETS[providerSel.value];
    if (p && p.baseUrl) root.querySelector("#ai-base").value = p.baseUrl;
    if (p && p.model) root.querySelector("#ai-model").value = p.model;
  };

  root.querySelector("#save-ai").onclick = function () {
    SD.saveAiConfig({
      provider: providerSel.value,
      apiKey: root.querySelector("#ai-key").value.trim(),
      baseUrl: root.querySelector("#ai-base").value.trim(),
      model: root.querySelector("#ai-model").value.trim(),
      aiEnabled: root.querySelector("#ai-enabled").checked,
    });
    msg.textContent = "设置已保存。";
    msg.className = "msg ok";
  };
};
