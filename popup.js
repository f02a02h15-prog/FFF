// popup.js
const $ = (id) => document.getElementById(id);
const statusEl = $("status");

function setStatus(msg, color) {
  statusEl.textContent = msg;
  statusEl.style.color = color || "#2ba471";
}

// 渲染摘要
chrome.storage.local.get("resumeData", (res) => {
  const d = res.resumeData;
  if (!d) {
    $("summary").textContent = "未找到简历数据，请重新加载扩展。";
    return;
  }
  const edu = (d.education || [])[0] || {};
  $("summary").innerHTML =
    `<b>姓名：</b>${d.basic.name}（${d.basic.gender}）<br>` +
    `<b>手机：</b>${d.basic.phone}<br>` +
    `<b>邮箱：</b>${d.basic.email}<br>` +
    `<b>学历：</b>${edu.level || ""} ${edu.school || ""}<br>` +
    `<b>现状：</b>${d.education[0].status || ""} ｜ GPA ${edu.gpa || ""}`;
});

// 填充当前页面
$("fillBtn").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;
  setStatus("正在填充…", "#2b6cff");
  chrome.tabs.sendMessage(tab.id, { action: "fill" }, (resp) => {
    if (chrome.runtime.lastError) {
      setStatus("该页面暂不支持（或无表单）", "#e54545");
      return;
    }
    if (!resp || resp.reason === "no-data") {
      setStatus("未找到简历数据", "#e54545");
    } else {
      let s = `已填充 ${resp.filled} 项`;
      if (resp.skipped && resp.skipped.length)
        s += `，跳过 ${resp.skipped.length} 项敏感`;
      setStatus(s, "#2ba471");
    }
  });
});

// 导出数据
$("exportBtn").addEventListener("click", () => {
  chrome.storage.local.get("resumeData", (res) => {
    const blob = new Blob([JSON.stringify(res.resumeData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "resume_data.json";
    a.click();
    URL.revokeObjectURL(url);
    setStatus("已导出 resume_data.json");
  });
});

// 导入数据
$("importBtn").addEventListener("click", () => $("importFile").click());
$("importFile").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      chrome.storage.local.set({ resumeData: data }, () => {
        setStatus("导入成功，刷新页面后生效");
        chrome.runtime.reload();
      });
    } catch (err) {
      setStatus("JSON 解析失败", "#e54545");
    }
  };
  reader.readAsText(file);
});
