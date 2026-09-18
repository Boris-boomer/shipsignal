// 扫 zh.ts，找出 en.ts 缺失或值为 TODO: 的 key，调本地 Ollama 翻译后写入
// 用法：node scripts/sync-i18n.mjs
// 前提：Ollama 在跑（ollama list 能列出模型）

import { readFileSync, writeFileSync } from "node:fs";

const API_KEY = process.env.I18N_API_KEY || "ollama";
const API_BASE = process.env.I18N_API_BASE || "http://localhost:11434/v1";
const MODEL = process.env.I18N_MODEL || "qwen3:8b";

const ZH_PATH = "src/i18n/locales/zh.ts";
const EN_PATH = "src/i18n/locales/en.ts";

const zhSrc = readFileSync(ZH_PATH, "utf8");
const enSrc = readFileSync(EN_PATH, "utf8");

// 抓 zh.ts 里所有 key 和中文值（支持 "..." 和 `...`）
const keyRe = /^\s*"([^"]+)":\s*(?:"((?:[^"\\]|\\.)*)"|`([^`]*)`)/gm;
const zhMap = new Map();
for (const m of zhSrc.matchAll(keyRe)) {
  const val = m[2] !== undefined ? m[2] : m[3] ?? "";
  zhMap.set(m[1], val);
}

// 抓 en.ts 里所有 key→值，值为 "TODO: ..." 的视为缺失
const enRe = /^\s*"([^"]+)":\s*"((?:[^"\\]|\\.)*)"/gm;
const enMap = new Map();
for (const m of enSrc.matchAll(enRe)) {
  enMap.set(m[1], m[2]);
}

const missing = [...zhMap.keys()].filter((k) => {
  if (!enMap.has(k)) return true;
  return enMap.get(k).startsWith("TODO:");
});

if (missing.length === 0) {
  console.log("✅ en.ts 没有缺失的 key");
  process.exit(0);
}

console.log(`发现 ${missing.length} 个待翻译 key，调 ${MODEL} 翻译中…`);

const items = missing.map((k) => ({ key: k, zh: zhMap.get(k) }));
const prompt = `你是 UI 文案翻译。把下面 JSON 里的中文翻译成英文。

要求：
- 简短，符合软件界面用语习惯（不是文学翻译）
- 保留 {{n}} {{name}} {{time}} {{path}} {{reason}} 等占位符原样不动
- 保留 · 、→ 等符号
- 中文引号「」一律换成英文双引号 " "
- 常见对应词：学习→lessons，信号→signals，决策→decisions，转化→conversions，项目→projects
- 只返回 JSON 对象 {"key": "English"}，不要 markdown 代码块，不要解释

输入：
${JSON.stringify(items, null, 2)}`;

const res = await fetch(`${API_BASE}/chat/completions`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${API_KEY}`,
  },
  body: JSON.stringify({
    model: MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2,
    stream: false,
  }),
});

if (!res.ok) {
  console.error(`❌ API 失败：${res.status}`);
  console.error(await res.text());
  console.error("\n检查：Ollama 是否在跑？模型名是否正确？");
  process.exit(1);
}

const data = await res.json();
const text = data.choices?.[0]?.message?.content ?? "";

// 抠 JSON（防模型包了 ```json ... ```）
let jsonText = text.trim();
const fence = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
if (fence) jsonText = fence[1].trim();
const brace = jsonText.match(/\{[\s\S]*\}/);
if (brace) jsonText = brace[0];

let translated;
try {
  translated = JSON.parse(jsonText);
} catch (e) {
  console.error("❌ AI 返回的不是合法 JSON：", e.message);
  console.error("原始返回：\n", text);
  process.exit(1);
}

const missingInResult = missing.filter((k) => !translated[k]);
if (missingInResult.length > 0) {
  console.warn(`⚠️ ${missingInResult.length} 个 key 没翻出来：`);
  for (const k of missingInResult) console.warn(`   ${k}`);
  console.warn("这些会写成空字符串，请手动补。\n");
}

// 替换 en.ts 里已有的 TODO 行 + 追加新 key
let next = enSrc;
const toAppend = [];

for (const k of missing) {
  const en = String(translated[k] ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"');
  const keyEsc = k.replace(/\./g, "\\.");
  const todoRe = new RegExp(`("${keyEsc}":\\s*)"TODO:[^"]*"`);

  if (todoRe.test(next)) {
    next = next.replace(todoRe, `$1"${en}"`);
  } else {
    toAppend.push(`  "${k}": "${en}",`);
  }
}

if (toAppend.length > 0) {
  const insertBefore = next.lastIndexOf("};");
  if (insertBefore === -1) {
    console.error("❌ 找不到 en.ts 结尾的 };");
    process.exit(1);
  }
  next =
    next.slice(0, insertBefore) +
    toAppend.join("\n") +
    "\n" +
    next.slice(insertBefore);
}

writeFileSync(EN_PATH, next);

console.log(`✅ 写入 ${missing.length} 个 key 到 en.ts：\n`);
for (const k of missing) {
  console.log(`  ${k}`);
  console.log(`    zh → ${zhMap.get(k)}`);
  console.log(`    en → ${translated[k] ?? "(空)"}`);
  console.log("");
}
console.log("打开 en.ts 检查一遍，Ollama 偶尔会翻得别扭。");