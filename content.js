// content.js — 简历自动填充核心逻辑
(function () {
  "use strict";

  const FIELDS = window.RESUME_FIELDS || [];
  const BLOCKS = window.RESUME_BLOCKS || [];

  function normalize(s) {
    if (!s) return "";
    return String(s)
      .toLowerCase()
      .replace(/[\s\u3000　,，。.、()（）:：\-_/]/g, "");
  }

  // 读取数据
  function getData() {
    return new Promise((resolve) => {
      chrome.storage.local.get("resumeData", (res) => resolve(res.resumeData || null));
    });
  }

  // 按路径取值
  function resolvePath(obj, path) {
    return path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
  }

  // 取表单元素的可见标签文本
  function getLabel(el) {
    const texts = [];
    try {
      if (el.id) {
        const lbl = document.querySelector(`label[for="${el.id}"]`);
        if (lbl) texts.push(lbl.textContent || "");
      }
    } catch (e) {}
    // 包裹的 label
    const parentLabel = el.closest("label");
    if (parentLabel) texts.push(parentLabel.textContent || "");
    // aria
    if (el.getAttribute("aria-label")) texts.push(el.getAttribute("aria-label"));
    if (el.getAttribute("placeholder")) texts.push(el.getAttribute("placeholder"));
    if (el.getAttribute("name")) texts.push(el.getAttribute("name"));
    if (el.id) texts.push(el.id);
    // 相邻文本：父容器里输入框前的文字
    const wrapper =
      el.closest(".form-item") ||
      el.closest(".el-form-item") ||
      el.closest(".ant-form-item") ||
      el.parentElement;
    if (wrapper) {
      const t = wrapper.textContent || "";
      if (t) texts.push(t);
    }
    // 前置兄弟文本节点
    let prev = el.previousSibling;
    while (prev && texts.length < 6) {
      if (prev.nodeType === 3 && prev.textContent.trim()) texts.push(prev.textContent);
      else if (prev.textContent && prev.textContent.trim()) texts.push(prev.textContent);
      prev = prev.previousSibling;
    }
    return texts.join(" | ");
  }

  // 匹配最优字段（取最长命中关键词，降低误填）
  function matchField(candidate, list) {
    const c = normalize(candidate);
    if (!c) return null;
    let best = null;
    for (const entry of list) {
      for (const kw of entry.keys) {
        const nk = normalize(kw);
        if (!nk) continue;
        if (c.includes(nk) || nk.includes(c)) {
          const score = nk.length;
          if (!best || score > best.score) best = { entry, score };
          break;
        }
      }
    }
    return best ? best.entry : null;
  }

  // 用原生 setter 写值，兼容 React/Vue 受控组件
  function setNativeValue(el, value) {
    const proto =
      el instanceof HTMLTextAreaElement
        ? HTMLTextAreaElement.prototype
        : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, "value").set;
    setter.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function fillText(el, value) {
    if (el.tagName === "SELECT") {
      let picked = null;
      for (const opt of el.options) {
        const on = normalize(opt.text);
        const ov = normalize(opt.value);
        const v = normalize(value);
        if (on.includes(v) || v.includes(on) || ov.includes(v) || v.includes(ov)) {
          picked = opt;
          break;
        }
      }
      if (picked) {
        el.value = picked.value;
        el.dispatchEvent(new Event("change", { bubbles: true }));
        return true;
      }
      return false;
    }
    if (el.type === "radio") {
      // 仅处理性别
      const v = normalize(value);
      const ov = normalize(el.value);
      if (v && (ov.includes(v) || v.includes(ov))) {
        el.checked = true;
        el.dispatchEvent(new Event("change", { bubbles: true }));
        return true;
      }
      return false;
    }
    setNativeValue(el, value);
    return true;
  }

  // 把经历格式化为整段文本
  function formatBlock(data, kind) {
    if (!data) return "";
    if (kind === "internships") {
      return (data.internships || [])
        .map((it) => {
          const head = `${it.company} | ${it.role}（${it.start} - ${it.end}）`;
          const body = (it.bullets || []).map((b) => "• " + b).join("\n");
          return head + "\n" + body;
        })
        .join("\n\n");
    }
    if (kind === "projects") {
      return (data.projects || [])
        .map((p) => {
          const head = `${p.name} | ${p.role || ""}（${p.start || ""} - ${p.end || ""}）`;
          const body = (p.bullets || []).map((b) => "• " + b).join("\n");
          return head + "\n" + body;
        })
        .join("\n\n");
    }
    if (kind === "publications") {
      return (data.publications || [])
        .map(
          (p) =>
            `${p.title}\n期刊：${p.journal}（${p.partition || ""}，IF ${p.impactFactor || ""}，${p.date || ""}）`
        )
        .join("\n\n");
    }
    if (kind === "awards") {
      return (data.awards || [])
        .map((a) => `${a.date}  ${a.name}${a.level ? "（" + a.level + "）" : ""}`)
        .join("\n");
    }
    if (kind === "skills") {
      const s = data.skills || {};
      return [
        s.language,
        s.data,
        s.tools,
        s.other,
      ]
        .filter(Boolean)
        .join("\n");
    }
    return "";
  }

  function isTextLike(el) {
    return (
      el.tagName === "INPUT" &&
      ["text", "email", "tel", "url", "number", "search", ""].includes(el.type || "")
    );
  }

  async function fillAll() {
    const data = await getData();
    if (!data) return { filled: 0, skipped: [], reason: "no-data" };

    const sensitive = data.sensitiveFields || [];
    const skipSet = new Set(sensitive);

    let filled = 0;
    const skipped = [];

    const elements = Array.from(
      document.querySelectorAll("input, textarea, select")
    ).filter((el) => !el.disabled && !el.readOnly);

    for (const el of elements) {
      const label = getLabel(el);
      const isArea = el.tagName === "TEXTAREA";

      // 1) 文本块（textarea 优先匹配 BLOCKS）
      if (isArea) {
        const blockEntry = matchField(label, BLOCKS);
        if (blockEntry) {
          const val = formatBlock(data, blockEntry.kind);
          if (val) {
            setNativeValue(el, val);
            filled++;
          }
          continue;
        }
      }

      // 2) 单值字段
      const fieldEntry = matchField(label, FIELDS);
      if (fieldEntry) {
        if (skipSet.has(fieldEntry.path)) {
          skipped.push(fieldEntry.path);
          continue;
        }
        const val = resolvePath(data, fieldEntry.path);
        if (val === undefined || val === null || val === "") continue;
        if (fillText(el, String(val))) filled++;
        continue;
      }

      // 3) 普通输入框也可尝试 BLOCKS（如 "实习经历" 用 input 承载）
      if (isTextLike(el)) {
        const blockEntry = matchField(label, BLOCKS);
        if (blockEntry) {
          const val = formatBlock(data, blockEntry.kind);
          if (val) {
            setNativeValue(el, val);
            filled++;
          }
        }
      }
    }
    return { filled, skipped, reason: "ok" };
  }

  // 浮动按钮（仅当页面表单字段较多时注入）
  function maybeInjectButton() {
    const count = document.querySelectorAll("input, textarea, select").length;
    if (count < 4) return;
    if (document.getElementById("resume-autofill-btn")) return;

    const btn = document.createElement("div");
    btn.id = "resume-autofill-btn";
    btn.textContent = "一键填表";
    btn.style.cssText =
      "position:fixed;right:16px;bottom:16px;z-index:2147483647;" +
      "background:#2b6cff;color:#fff;padding:10px 16px;border-radius:24px;" +
      "font-size:14px;cursor:pointer;box-shadow:0 2px 10px rgba(0,0,0,.3);" +
      "font-family:-apple-system,Segoe UI,Roboto,sans-serif;";
    btn.addEventListener("click", async () => {
      btn.textContent = "填充中…";
      const r = await fillAll();
      if (r.reason === "no-data") {
        btn.textContent = "未找到数据";
      } else {
        let txt = `已填 ${r.filled} 项`;
        if (r.skipped.length) txt += `（跳过 ${r.skipped.length} 项敏感）`;
        btn.textContent = txt;
      }
      setTimeout(() => (btn.textContent = "一键填表"), 2500);
    });
    document.body.appendChild(btn);
  }

  // 接收 popup 触发
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.action === "fill") {
      fillAll().then((r) => sendResponse(r));
      return true; // 异步
    }
  });

  // 暴露给控制台调试
  window.__resumeFill = fillAll;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", maybeInjectButton);
  } else {
    maybeInjectButton();
  }
})();
