window.SD = window.SD || {};
SD.renderUpload = function renderUpload(root) {
  const stats = SD.getStorageStats();
  root.innerHTML =
    '<h1 class="page-title">数据上传</h1>' +
    '<section class="card"><h2 class="card-title">导入 Excel</h2>' +
    '<p class="muted">支持 .xlsx / .xls，需包含「销售日期、销售人员、销售收入、销售成本」等标准列。</p>' +
    '<div class="upload-zone" id="drop-zone"><input type="file" id="file-input" accept=".xlsx,.xls" hidden />' +
    '<p>拖拽 Excel 到此处，或 <button type="button" class="link-btn" id="pick-file">点击选择文件</button></p></div>' +
    '<div id="upload-msg" class="msg"></div>' +
    '<div class="toolbar"><button type="button" class="btn danger" id="clear-data">清空本地数据</button>' +
    '<span class="muted">当前 ' + stats.rowCount + " 行 · " + stats.sizeKb + " KB</span></div></section>";

  const msg = root.querySelector("#upload-msg");
  const input = root.querySelector("#file-input");
  const zone = root.querySelector("#drop-zone");

  root.querySelector("#pick-file").onclick = function () { input.click(); };
  root.querySelector("#clear-data").onclick = function () {
    if (confirm("确定清空浏览器中保存的全部销售数据？")) {
      SD.clearRecords();
      msg.textContent = "已清空本地数据。";
      msg.className = "msg ok";
    }
  };

  function handleFile(file) {
    if (!file) return;
    msg.textContent = "正在解析…";
    msg.className = "msg";
    var parse = function () {
      file.arrayBuffer().then(function (buffer) {
        return SD.parseSalesExcel(buffer);
      }).then(function (result) {
        SD.saveRecords(result.rows);
        msg.innerHTML = "导入成功：<strong>" + result.rowCount + "</strong> 行";
        if (result.monthMin) msg.innerHTML += "，月份 " + result.monthMin + " ~ " + result.monthMax;
        if (result.warnings.length) msg.innerHTML += '<br><span class="muted">' + result.warnings.join(" ") + "</span>";
        msg.className = "msg ok";
      }).catch(function (e) {
        msg.textContent = e.message || String(e);
        msg.className = "msg err";
      });
    };
    if (SD.ensureXlsx) SD.ensureXlsx().then(parse).catch(function (e) {
      msg.textContent = e.message || "Excel 库加载失败，请检查网络";
      msg.className = "msg err";
    });
    else parse();
  }

  input.onchange = function () { handleFile(input.files && input.files[0]); };
  zone.addEventListener("dragover", function (e) { e.preventDefault(); zone.classList.add("drag"); });
  zone.addEventListener("dragleave", function () { zone.classList.remove("drag"); });
  zone.addEventListener("drop", function (e) {
    e.preventDefault();
    zone.classList.remove("drag");
    handleFile(e.dataTransfer.files && e.dataTransfer.files[0]);
  });
};
