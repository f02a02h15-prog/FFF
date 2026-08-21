# 简历自动填充助手（Edge 扩展 / Manifest V3）

读取本地简历数据，自动识别并填充各公司官网 / ATS 简历表单。敏感字段（身份证号、紧急联系人）默认不自动填充。

## 目录结构
```
edge-resume-autofill/
├─ manifest.json                  # MV3 配置
├─ background.js                  # service worker，安装时初始化数据到 storage
├─ content.js                     # 页面自动填表核心逻辑 + 浮动"一键填表"按钮
├─ fieldMap.js                    # 中文表单字段 → 数据路径 的映射字典
├─ popup.html / popup.js          # 弹出面板：填充 / 导出 / 导入数据
├─ resume_data.example.json       # 简历数据模板（脱敏，可提交 GitHub）
├─ build.js / package.json        # 本地打包脚本
├─ .github/workflows/build.yml    # GitHub Actions：校验 + 自动打包
├─ .gitignore                     # 排除真实简历数据和证件照
├─ README.md                      # 说明文档
└─ resume_data.json               # 你的真实简历数据（本地生成，不上传 GitHub）
```

## 一、本地加载（开发者模式，立即可用）
1. 打开 Edge，访问 `edge://extensions`
2. 打开左下角 **开发人员模式** 开关
3. 点击 **加载解压缩的扩展**，选择本文件夹 `edge-resume-autofill/`
4. 固定扩展到工具栏（扩展图标 → 固定）
5. 打开任意公司招聘官网的简历表单页 → 点工具栏图标 **填充当前页面**，或点页面右下角 **一键填表** 按钮

## 二、更新你的简历数据
- 方式 A：直接编辑 `resume_data.json`，然后在扩展管理页点 **重新加载**
- 方式 B：扩展弹出面板 → **导出数据** 得到 JSON，补全后 **导入数据**

> 缺失字段（如求职意向、技术栈、自我评价）留空即可，插件不会误填；补全后重新导入。

## 三、上传到 GitHub（代码托管 + 自动打包）
> ⚠️ **重要：不要把 `resume_data.json`（含真实姓名/电话/邮箱/学校等）和证件照提交到 GitHub。** 本仓库已配置 `.gitignore` 自动排除这些文件。

1. 在 GitHub 新建一个空仓库（例如 `edge-resume-autofill`），不要初始化 README
2. 本地初始化并推送：
   ```bash
   cd edge-resume-autofill/
   git init
   git add .
   git commit -m "init: resume autofill edge extension"
   git branch -M main
   git remote add origin https://github.com/你的用户名/edge-resume-autofill.git
   git push -u origin main
   ```
3. 推送后 GitHub Actions 会自动运行 `build.yml`，校验 JS/JSON 并打包成 `edge-resume-autofill.zip` artifact
4. 每次改代码或字段映射后 push，Actions 都会生成最新 zip，可在仓库 **Actions → 最新运行 → Artifacts** 下载

> 提示：下载的 artifact zip 里如果只有 `resume_data.example.json` 占位，说明你没在本地放真实 `resume_data.json`。提交 Edge Add-ons 前，用本地 `npm run build` 生成包含真实数据的 zip。

## 四、正式上架（部署上线）
Edge 扩展通过 **Microsoft Edge Add-ons 商店** 分发：
1. 注册 **Microsoft Partner Center** 开发人员账号（需付费认证，约 $19 个人或 $99 公司）
   https://partner.microsoft.com/dashboard/microsoftedge
2. 把本文件夹打包成 **.zip**（注意不要多套一层父目录）
   ```bash
   npm run build
   ```
   产物为 `edge-resume-autofill.zip`。
3. 在 Partner Center → **概述 → 新建产品 → 扩展**，按向导上传 zip、填写名称/描述/图标/隐私政策
4. 提交审核（通常 1–7 个工作日），通过后即上线，任何人可在 Edge Add-ons 搜索安装

> 注：本扩展用 `<all_urls>` 在所有页面运行 content script，上架时需如实说明权限用途（自动填表），可改为仅匹配招聘域名以降低审核风险。

## 五、字段匹配说明
- 单值字段（姓名/手机/邮箱/学校/专业/GPA…）按标签关键词匹配后填入 input / select
- 多行经历（实习/项目/论文/获奖/技能）整段填入 textarea
- 敏感字段在 `resume_data.json` 的 `sensitiveFields` 中列出，自动跳过
- 若某官网字段没被识别，可在 `fieldMap.js` 的 `keys` 里补充该站用词

## 六、已知限制
- 纯 React/Vue 受控表单已用原生 setter + input/change 事件兼容，极端定制表单可能需手动微调
- 证件照为本地文件，扩展不自动上传文件型 input（浏览器安全限制），需手动选择
- 不同官网字段命名差异大，首次使用建议人工核对后再提交
