window.SD = window.SD || {};
(function (SD) {
  const STORAGE_KEY = "sales_dashboard_records_v1";
  const AI_CONFIG_KEY = "sales_dashboard_ai_v1";
  const UI_STATE_KEY = "sales_dashboard_ui_v1";

  SD.loadRecords = function loadRecords() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  SD.saveRecords = function saveRecords(rows) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  };

  SD.clearRecords = function clearRecords() {
    localStorage.removeItem(STORAGE_KEY);
  };

  SD.loadAiConfig = function loadAiConfig() {
    try {
      const raw = localStorage.getItem(AI_CONFIG_KEY);
      return raw ? JSON.parse(raw) : { provider: "qwen", apiKey: "", baseUrl: "", model: "", aiEnabled: true };
    } catch {
      return { provider: "qwen", apiKey: "", baseUrl: "", model: "", aiEnabled: true };
    }
  };

  SD.saveAiConfig = function saveAiConfig(cfg) {
    localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(cfg));
  };

  SD.getStorageStats = function getStorageStats() {
    const rows = SD.loadRecords();
    return { rowCount: rows.length, sizeKb: Math.round((localStorage.getItem(STORAGE_KEY)?.length || 0) / 1024) };
  };

  SD.loadUiState = function loadUiState() {
    try {
      const raw = sessionStorage.getItem(UI_STATE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  };

  SD.saveUiState = function saveUiState(state) {
    try {
      sessionStorage.setItem(UI_STATE_KEY, JSON.stringify(state || {}));
    } catch { /* ignore quota errors */ }
  };

  SD.patchUiState = function patchUiState(page, patch) {
    var all = SD.loadUiState();
    all[page] = Object.assign({}, all[page] || {}, patch);
    SD.saveUiState(all);
    return all[page];
  };
})(SD);
