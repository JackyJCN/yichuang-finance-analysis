window.SD = window.SD || {};
SD.renderAi = function renderAi(root) {
  var months = SD.listMonths(SD.loadRecords());
  var saved = SD.loadUiState().ai || {};
  var monthSelect = null;

  root.innerHTML =
    '<h1 class="page-title">AI 分析</h1>' +
    '<section class="card"><h2 class="card-title">智能解读</h2>' +
    '<div class="filters ai-month-filter">' +
    '<label>分析月份（可多选，留空则默认最近 3 个月）</label>' +
    '<div id="ai-months-wrap"></div></div>' +
    '<div class="toolbar"><button type="button" class="btn primary" id="ai-interpret">生成本期经营解读</button></div>' +
    '<label>提问</label><textarea id="ai-question" rows="3" placeholder="例如：本月毛利变化主要原因是什么？"></textarea>' +
    '<button type="button" class="btn" id="ai-ask">发送提问</button>' +
    '<div id="ai-output" class="ai-output"></div></section>';

  function saveUi() {
    SD.patchUiState("ai", {
      months: monthSelect ? monthSelect.getValue() : [],
      question: root.querySelector("#ai-question").value,
      output: output.textContent,
    });
  }

  monthSelect = SD.createMultiSelect({
    placeholder: "留空则默认最近 3 个月",
    width: 280,
    value: saved.months || [],
    options: months,
    maxVisibleTags: 1,
    onChange: function () { saveUi(); },
  });
  root.querySelector("#ai-months-wrap").appendChild(monthSelect.el);

  var output = root.querySelector("#ai-output");
  var questionEl = root.querySelector("#ai-question");
  if (saved.question) questionEl.value = saved.question;
  if (saved.output) output.textContent = saved.output;
  questionEl.addEventListener("input", saveUi);

  function getFilters() {
    var selected = monthSelect.getValue();
    return selected.length ? { months: selected } : { months: months.slice(-3) };
  }

  function chatCompletion(cfg, messages) {
    var base = (cfg.baseUrl || "").replace(/\/$/, "");
    return fetch(base + "/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + cfg.apiKey },
      body: JSON.stringify({ model: cfg.model, messages: messages, temperature: 0.3 }),
    }).then(function (res) {
      if (!res.ok) {
        return res.text().then(function (text) {
          throw new Error("API " + res.status + ": " + text.slice(0, 200));
        });
      }
      return res.json();
    }).then(function (data) {
      return (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || "(无回复)";
    });
  }

  function run(kind) {
    var cfg = SD.loadAiConfig();
    if (!cfg.aiEnabled) { output.textContent = "AI 功能已关闭，请在设置中启用。"; saveUi(); return; }
    if (!cfg.apiKey) { output.textContent = "请先在设置中填写 API Key。"; saveUi(); return; }

    var rows = SD.loadRecords();
    if (!rows.length) { output.textContent = "暂无数据，请先上传 Excel。"; saveUi(); return; }

    var filters = getFilters();
    var context = SD.buildAiContext(rows, filters);
    var question = kind === "interpret"
      ? "请根据以下销售经营数据，用简洁的中文给出本期经营解读（收入、成本、毛利、客户结构、需关注点）。"
      : root.querySelector("#ai-question").value.trim();

    if (!question) { output.textContent = "请输入问题。"; saveUi(); return; }

    output.textContent = "思考中…";
    saveUi();

    chatCompletion(cfg, [
      { role: "system", content: "你是销售部门经营分析顾问，回答要简洁、可执行。" },
      { role: "user", content: question + "\n\n【数据摘要】\n" + context },
    ]).then(function (answer) {
      output.textContent = answer;
      saveUi();
    }).catch(function (e) {
      output.textContent = e.message + "\n\n若提示跨域错误，说明该 API 不支持浏览器直接调用，请改用本地安装版。";
      saveUi();
    });
  }

  root.querySelector("#ai-interpret").onclick = function () { run("interpret"); };
  root.querySelector("#ai-ask").onclick = function () { run("ask"); };
};
