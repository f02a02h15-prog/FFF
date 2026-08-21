// background.js — MV3 service worker
// 安装时把内置简历数据写入 storage.local，作为自动填表数据源。

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get("resumeData", (res) => {
    if (!res.resumeData) {
      fetch(chrome.runtime.getURL("resume_data.json"))
        .then((r) => r.json())
        .then((data) => {
          chrome.storage.local.set({ resumeData: data }, () => {
            console.log("[简历自动填充助手] 默认数据已初始化");
          });
        })
        .catch((e) => console.error("[简历自动填充助手] 初始化数据失败", e));
    }
  });
});
