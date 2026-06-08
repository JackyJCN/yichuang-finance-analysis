window.SD = window.SD || {};
(function (SD) {
  var PAGE_MARGIN_MM = 8;
  var SECTION_GAP_MM = 4;
  var MIN_TAIL_MM = 3;
  var RENDER_SCALE = 2;

  SD.buildExportFileName = function buildExportFileName(months) {
    months = months || [];
    if (!months.length) return "销售经营分析_全部月份.pdf";
    var sorted = months.slice().sort();
    if (sorted.length === 1) return "销售经营分析_" + sorted[0] + ".pdf";
    if (sorted.length === 2) return "销售经营分析_" + sorted.join("_") + ".pdf";
    return "销售经营分析_" + sorted[0] + "至" + sorted[sorted.length - 1] + "_" + sorted.length + "月.pdf";
  };

  function waitForPaint() {
    return new Promise(function (resolve) {
      requestAnimationFrame(function () {
        requestAnimationFrame(resolve);
      });
    });
  }

  function waitForImg(img) {
    return new Promise(function (resolve) {
      if (img.complete) { resolve(); return; }
      img.onload = img.onerror = resolve;
    });
  }

  /** 导出前：ECharts 转 PNG（保持原始宽高比），Logo 用内嵌 base64 */
  function prepareSectionForCapture(section) {
    var restores = [];
    var loads = [];

    section.querySelectorAll("[data-chart]").forEach(function (el) {
      var inst = typeof echarts !== "undefined" ? echarts.getInstanceByDom(el) : null;
      if (!inst) return;
      if (el.classList.contains("chart-pie") && SD.fitPieContainer) {
        SD.fitPieContainer(el);
        inst.resize();
      }
      var w = inst.getWidth();
      var h = inst.getHeight();
      var size = el.classList.contains("chart-pie") ? Math.min(w, h) : null;
      var parentW = el.parentElement ? el.parentElement.clientWidth : size;
      var dataUrl = inst.getDataURL({ type: "png", pixelRatio: 2, backgroundColor: "#ffffff" });
      var wrap = document.createElement("div");
      wrap.className = "chart-export-wrap";
      wrap.style.cssText = "display:flex;justify-content:center;align-items:center;width:100%;overflow:visible;";
      var img = document.createElement("img");
      img.className = "chart-export-img";
      img.src = dataUrl;
      if (size) {
        var fitW = parentW > 0 ? Math.min(size, parentW) : size;
        img.style.cssText = "display:block;width:" + fitW + "px;height:" + fitW + "px;max-width:100%;margin:0 auto;";
      } else {
        img.style.cssText = "display:block;width:" + w + "px;height:" + h + "px;max-width:100%;object-fit:contain;margin:0 auto;";
      }
      wrap.appendChild(img);
      el.style.display = "none";
      el.parentNode.insertBefore(wrap, el.nextSibling);
      loads.push(waitForImg(img));
      restores.push(function () {
        wrap.remove();
        el.style.display = "";
      });
    });

    section.querySelectorAll("img.company-brand__logo").forEach(function (img) {
      if (SD.COMPANY_LOGO_DATA) {
        var orig = img.getAttribute("src");
        img.src = SD.COMPANY_LOGO_DATA;
        loads.push(waitForImg(img));
        restores.push(function () { img.setAttribute("src", orig); });
      }
    });

    section.querySelectorAll("canvas").forEach(function (canvas) {
      var prev = canvas.style.display;
      canvas.style.display = "none";
      restores.push(function () { canvas.style.display = prev; });
    });

    return Promise.all(loads).then(function () {
      return function restore() {
        restores.forEach(function (fn) { fn(); });
      };
    });
  }

  function captureSection(el) {
    return prepareSectionForCapture(el).then(function (restore) {
      return html2canvas(el, {
        scale: RENDER_SCALE,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        logging: false,
        imageTimeout: 15000,
        scrollX: 0,
        scrollY: 0,
        windowWidth: el.scrollWidth,
        windowHeight: el.scrollHeight,
        ignoreElements: function (node) {
          return node.tagName === "CANVAS";
        },
      }).then(function (canvas) {
        restore();
        return canvas;
      }, function (err) {
        restore();
        throw err;
      });
    });
  }

  function sliceCanvas(source, top, height) {
    var slice = document.createElement("canvas");
    slice.width = source.width;
    slice.height = height;
    var ctx = slice.getContext("2d");
    if (!ctx) return source;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, slice.width, slice.height);
    ctx.drawImage(source, 0, top, source.width, height, 0, 0, source.width, height);
    return slice;
  }

  function appendCanvasToPdf(pdf, canvas, cursor, pageHeight, contentWidth, maxPageHeight) {
    var imgWidth = contentWidth;
    var imgHeight = (canvas.height * imgWidth) / canvas.width;
    var pageCanvasHeight = Math.max(1, Math.floor((canvas.width * maxPageHeight) / imgWidth));
    var dataUrl = canvas.toDataURL("image/png");

    if (imgHeight <= maxPageHeight) {
      if (cursor.y + imgHeight > pageHeight - PAGE_MARGIN_MM) {
        pdf.addPage();
        cursor.y = PAGE_MARGIN_MM;
      }
      pdf.addImage(dataUrl, "PNG", PAGE_MARGIN_MM, cursor.y, imgWidth, imgHeight);
      cursor.y += imgHeight + SECTION_GAP_MM;
      return;
    }

    var offset = 0;
    while (offset < canvas.height) {
      var sliceHeight = Math.min(pageCanvasHeight, canvas.height - offset);
      var sliceMmHeight = (sliceHeight * imgWidth) / canvas.width;
      if (sliceMmHeight < MIN_TAIL_MM && offset > 0) break;

      if (cursor.y + sliceMmHeight > pageHeight - PAGE_MARGIN_MM) {
        pdf.addPage();
        cursor.y = PAGE_MARGIN_MM;
      }

      var slice = sliceCanvas(canvas, offset, sliceHeight);
      pdf.addImage(slice.toDataURL("image/png"), "PNG", PAGE_MARGIN_MM, cursor.y, imgWidth, sliceMmHeight);
      cursor.y += sliceMmHeight;
      offset += sliceHeight;
    }
    cursor.y += SECTION_GAP_MM;
  }

  function savePdfBlob(blob, fileName) {
    var picker = window.showSaveFilePicker;
    if (picker) {
      return picker.call(window, {
        suggestedName: fileName,
        types: [{ description: "PDF", accept: { "application/pdf": [".pdf"] } }],
      }).then(function (handle) {
        return handle.createWritable().then(function (writable) {
          return writable.write(blob).then(function () {
            return writable.close();
          });
        });
      }).then(function () { return true; }).catch(function (e) {
        if (e && e.name === "AbortError") return false;
        return fallbackDownload(blob, fileName);
      });
    }
    return fallbackDownload(blob, fileName);
  }

  function fallbackDownload(blob, fileName) {
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
    return Promise.resolve(true);
  }

  SD.exportElementToPdf = function exportElementToPdf(element, fileName) {
    return (SD.ensureExportLibs ? SD.ensureExportLibs() : Promise.resolve()).then(function () {
    if (!window.html2canvas || !window.jspdf) {
      return Promise.reject(new Error("PDF 库未加载，请检查网络连接"));
    }
    var jsPDF = window.jspdf.jsPDF;

    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();

    return waitForPaint().then(function () {
      return new Promise(function (r) { setTimeout(r, 400); });
    }).then(function () {
      return waitForPaint();
    }).then(function () {
      var pdf = new jsPDF("p", "mm", "a4");
      var pageWidth = pdf.internal.pageSize.getWidth();
      var pageHeight = pdf.internal.pageSize.getHeight();
      var contentWidth = pageWidth - PAGE_MARGIN_MM * 2;
      var maxPageHeight = pageHeight - PAGE_MARGIN_MM * 2;
      var cursor = { y: PAGE_MARGIN_MM };

      var sections = element.querySelectorAll(".pdf-section");
      var targets = sections.length ? Array.from(sections) : [element];

      return targets.reduce(function (chain, section) {
        return chain.then(function () {
          return captureSection(section).then(function (canvas) {
            appendCanvasToPdf(pdf, canvas, cursor, pageHeight, contentWidth, maxPageHeight);
          });
        });
      }, Promise.resolve()).then(function () {
        return savePdfBlob(pdf.output("blob"), fileName);
      });
    });
    });
  };
})(SD);
