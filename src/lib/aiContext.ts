import type {
  Project,
  Signal,
  Conversion,
  Lesson,
  DecisionLog,
  Mode,
} from "./types";
import {
  listSignals,
  listConversions,
  listLessons,
  listDecisions,
} from "./db";

const MAX_SIGNALS = 15;
const MAX_CONVERSIONS = 10;
const MAX_LESSONS = 20;
const MAX_DECISIONS = 10;
const MAX_TOTAL_CHARS = 4000;

const MODE_LABEL: Record<Mode, string> = {
  validate_first: "A（有想法，先验证）",
  build_first: "B（有产品，找渠道）",
  portfolio: "C（多产品组合）",
};

const STATUS_LABEL: Record<string, string> = {
  planning: "规划中",
  building: "开发中",
  launched: "已上线",
  converting: "转化中",
  archived: "已归档",
  frozen: "已冻结",
  active: "进行中",
};

const LESSON_TYPE_LABEL: Record<string, string> = {
  validated: "验证成立",
  invalidated: "被推翻",
  discovered: "新发现",
};

const OUTCOME_LABEL: Record<string, string> = {
  pending: "待验证",
  confirmed: "已确认",
  reversed: "已反转",
};

export async function buildProjectContext(project: Project): Promise<string> {
  const [signals, conversions, lessons, decisions] = await Promise.all([
    listSignals(project.id),
    listConversions(project.id),
    listLessons(project.id),
    listDecisions(project.id),
  ]);

  const sections: string[] = [];
  sections.push(renderHeader(project));

  if (signals.length > 0) sections.push(renderSignals(signals));
  if (conversions.length > 0) sections.push(renderConversions(conversions));
  if (lessons.length > 0) sections.push(renderLessons(lessons));
  if (decisions.length > 0) sections.push(renderDecisions(decisions));

  if (sections.length === 1) {
    sections.push(
      "（该项目暂未记录任何信号、转化、学习或决策，请基于用户本轮提问作答。）"
    );
  }

  let text = sections.join("\n\n");
  if (text.length > MAX_TOTAL_CHARS) {
    text = text.slice(0, MAX_TOTAL_CHARS) + "\n…（上下文过长，已截断）";
  }
  return text;
}

/* ---------------- 各段渲染 ---------------- */

function renderHeader(p: Project): string {
  const lines: string[] = ["## 当前项目"];
  lines.push(`- 名称：${p.name}`);
  lines.push(`- 模式：${MODE_LABEL[p.mode] ?? p.mode}`);
  lines.push(`- 状态：${STATUS_LABEL[p.status] ?? p.status}`);
  if (p.project_type) lines.push(`- 类型：${p.project_type}`);
  if (p.description?.trim())
    lines.push(`- 描述：${truncate(p.description, 200)}`);
  if (p.completion_criteria?.trim())
    lines.push(`- 完成标准：${truncate(p.completion_criteria, 200)}`);
  if (p.sunset_conditions?.trim())
    lines.push(`- 日落条款：${truncate(p.sunset_conditions, 200)}`);
  return lines.join("\n");
}

function renderSignals(signals: Signal[]): string {
  const shown = signals.slice(0, MAX_SIGNALS);
  const lines: string[] = [
    `## 信号（共 ${signals.length} 条，展示最新 ${shown.length} 条）`,
  ];
  for (const s of shown) {
    const summary = summarizeSignalData(s.data);
    const verif = s.source_verifiability ?? "medium";
    const conf = s.developer_confidence ?? s.suggested_confidence ?? "?";
    const src = s.source ? ` @${s.source}` : "";
    const flags = parseStringArray(s.anomaly_flags);
    const flagsStr = flags.length > 0 ? ` ⚠${flags.join(",")}` : "";
    const summaryStr = summary ? ` — ${summary}` : "";
    lines.push(
      `- [${s.signal_type}${src}] 可信度 ${conf}（来源 ${verif}）${flagsStr}${summaryStr}`
    );
  }
  if (signals.length > MAX_SIGNALS) {
    lines.push(`…还有 ${signals.length - MAX_SIGNALS} 条未展示`);
  }
  return lines.join("\n");
}

function renderConversions(conversions: Conversion[]): string {
  const shown = conversions.slice(0, MAX_CONVERSIONS);
  const lines: string[] = [`## 转化（共 ${conversions.length} 条）`];
  for (const c of shown) {
    const parts: string[] = [];
    if (c.user_segment) parts.push(c.user_segment);
    if (c.monetization_form) parts.push(c.monetization_form);
    if (c.amount != null)
      parts.push(`${c.currency} ${c.amount}${c.recurring ? "/期" : ""}`);
    if (c.notes) parts.push(truncate(c.notes, 80));
    lines.push(`- ${parts.length > 0 ? parts.join(" · ") : "（无字段）"}`);
  }
  if (conversions.length > MAX_CONVERSIONS) {
    lines.push(`…还有 ${conversions.length - MAX_CONVERSIONS} 条未展示`);
  }
  return lines.join("\n");
}

function renderLessons(lessons: Lesson[]): string {
  const shown = lessons.slice(0, MAX_LESSONS);
  const lines: string[] = [`## 学习信号（共 ${lessons.length} 条）`];
  for (const l of shown) {
    const type = LESSON_TYPE_LABEL[l.lesson_type] ?? l.lesson_type;
    const tags = parseStringArray(l.applicable_to);
    const tagStr = tags.length > 0 ? ` [${tags.join(",")}]` : "";
    lines.push(`- [${type}]${tagStr} ${truncate(l.description, 160)}`);
  }
  if (lessons.length > MAX_LESSONS) {
    lines.push(`…还有 ${lessons.length - MAX_LESSONS} 条未展示`);
  }
  return lines.join("\n");
}

function renderDecisions(decisions: DecisionLog[]): string {
  const shown = decisions.slice(0, MAX_DECISIONS);
  const lines: string[] = [`## 决策日志（共 ${decisions.length} 条）`];
  for (const d of shown) {
    const outcome = OUTCOME_LABEL[d.outcome] ?? d.outcome;
    const basis = d.basis ? `（依据：${truncate(d.basis, 80)}）` : "";
    lines.push(`- ${truncate(d.decision, 120)} ${basis} → ${outcome}`);
  }
  if (decisions.length > MAX_DECISIONS) {
    lines.push(`…还有 ${decisions.length - MAX_DECISIONS} 条未展示`);
  }
  return lines.join("\n");
}

/* ---------------- 工具 ---------------- */

function truncate(s: string, max: number): string {
  const t = s.trim().replace(/\s+/g, " ");
  if (t.length <= max) return t;
  return t.slice(0, max - 1) + "…";
}

function safeParse(json: string): Record<string, unknown> {
  try {
    const v = JSON.parse(json);
    if (v && typeof v === "object" && !Array.isArray(v)) {
      return v as Record<string, unknown>;
    }
    return {};
  } catch {
    return {};
  }
}

function parseStringArray(json: string): string[] {
  try {
    const v = JSON.parse(json);
    if (Array.isArray(v)) {
      return v.filter((x): x is string => typeof x === "string");
    }
    return [];
  } catch {
    return [];
  }
}

function summarizeSignalData(json: string): string {
  const data = safeParse(json);
  const preferredKeys = [
    "title",
    "name",
    "text",
    "notes",
    "summary",
    "content",
    "value",
    "amount",
  ];
  for (const k of preferredKeys) {
    const v = data[k];
    if (typeof v === "string" && v.trim()) return truncate(v, 80);
    if (typeof v === "number") return String(v);
  }
  const keys = Object.keys(data);
  if (keys.length === 0) return "";
  const s = JSON.stringify(data);
  return truncate(s, 80);
}