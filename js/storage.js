window.SD = window.SD || {};
(function (SD) {
  const STORAGE_KEY = "sales_dashboard_records_v1";
  const AI_CONFIG_KEY = "sales_dashboard_ai_v1";

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
})(SD);
