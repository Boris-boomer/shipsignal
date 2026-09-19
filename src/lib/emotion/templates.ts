import raw from "./templates.json";
import type { EmotionScene, EmotionOutput, TemplateContext } from "./types";

interface RawTemplate {
  id: string;
  title: string;
  body: string;
}

interface RawTemplates {
  [key: string]: RawTemplate[];
}

const templates = raw as RawTemplates;

/**
 * 插值规则：
 * - {var} 会被替换成 ctx[var]
 * - 如果一行里有 {var}，但 var 为空（null/undefined/空字符串），
 *   整行会被删除，不会留下空行
 * - 没有变量的行原样保留
 */
function interpolate(tpl: string, ctx: TemplateContext): string {
  const c = ctx as Record<string, unknown>;
  return tpl
    .split("\n")
    .map((line) => {
      const vars = [...line.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
      if (vars.length === 0) return line;
      const hasEmpty = vars.some((v) => c[v] == null || c[v] === "");
      if (hasEmpty) return null;
      return line.replace(/\{(\w+)\}/g, (_, k) => String(c[k]));
    })
    .filter((l): l is string => l !== null)
    .join("\n");
}

export function renderTemplate(
  scene: EmotionScene,
  ctx: TemplateContext
): EmotionOutput {
  const list = templates[scene];
  if (!list || list.length === 0) return { title: "", body: "" };
  const tpl = list[Math.floor(Math.random() * list.length)];
  return {
    title: interpolate(tpl.title, ctx),
    body: interpolate(tpl.body, ctx),
  };
}