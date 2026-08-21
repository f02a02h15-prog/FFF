const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');
const OUT_ZIP = path.join(ROOT, 'edge-resume-autofill.zip');

const ENTRIES = [
  'manifest.json',
  'background.js',
  'content.js',
  'fieldMap.js',
  'popup.html',
  'popup.js',
  'README.md',
];

function copyFile(from, to) {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
}

// clean
try { fs.rmSync(DIST, { recursive: true, force: true }); } catch (e) {}
fs.mkdirSync(DIST, { recursive: true });

// copy code
for (const f of ENTRIES) copyFile(path.join(ROOT, f), path.join(DIST, f));

// resume data
const dataPath = path.join(ROOT, 'resume_data.json');
const examplePath = path.join(ROOT, 'resume_data.example.json');
if (fs.existsSync(dataPath)) {
  copyFile(dataPath, path.join(DIST, 'resume_data.json'));
  console.log('✅ 已使用本地 resume_data.json');
} else if (fs.existsSync(examplePath)) {
  copyFile(examplePath, path.join(DIST, 'resume_data.json'));
  console.log('⚠️ 未找到 resume_data.json，已使用 resume_data.example.json 作为占位');
  console.log('   请复制 resume_data.example.json → resume_data.json 并填入你的真实信息');
} else {
  console.error('❌ 未找到 resume_data.json 或 resume_data.example.json');
  process.exit(1);
}

// zip via python (works on Windows & Linux CI)
const zipScript = `
import zipfile, os
src = r'${DIST}'
out = r'${OUT_ZIP}'
with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
    for root, dirs, files in os.walk(src):
        for f in files:
            p = os.path.join(root, f)
            z.write(p, os.path.relpath(p, src))
print('created', out)
`;
const tmpPy = path.join(ROOT, '.build-zip.py');
fs.writeFileSync(tmpPy, zipScript);
const pyCmds = [
  'python',
  'python3',
  process.platform === 'win32' ? 'C:\\Users\\XPENG_USER\\.workbuddy\\binaries\\python\\versions\\3.13.12\\python.exe' : ''
].filter(Boolean);
let ok = false;
for (const cmd of pyCmds) {
  try {
    execSync(`${cmd} "${tmpPy}"`, { cwd: ROOT, stdio: 'inherit' });
    ok = true;
    break;
  } catch (e) { /* try next */ }
}
try { fs.rmSync(tmpPy, { force: true }); } catch (e) {}
if (!ok) {
  console.error('❌ zip 打包失败，请确保系统可用 python / python3 命令');
  process.exit(1);
}

console.log(`\n🚀 产物：${OUT_ZIP}`);
console.log('提示：提交 Edge Add-ons 前，请确认 zip 内含你的真实 resume_data.json');
