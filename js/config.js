window.SD = window.SD || {};
SD.APP_VERSION = "20250608";
SD.COMPANY_NAME = "上海伊创刀具有限公司";
SD.APP_TITLE = "销售部门经营分析看板";
SD.REPORT_TITLE = "销售经营分析报告";
SD.COMPANY_LOGO = "./assets/company-logo.png";
SD.getLogoSrc = function getLogoSrc() {
  return SD.COMPANY_LOGO_DATA || SD.COMPANY_LOGO;
};
SD.AI_PRESETS = {
  openai: { label: "OpenAI", baseUrl: "https://api.openai.com/v1", model: "gpt-4o-mini" },
  deepseek: { label: "DeepSeek", baseUrl: "https://api.deepseek.com/v1", model: "deepseek-chat" },
  qwen: { label: "通义千问", baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1", model: "qwen-plus" },
  custom: { label: "自定义", baseUrl: "", model: "" },
};
