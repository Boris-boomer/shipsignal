import type {
  Project,
  Signal,
  Conversion,
  Lesson,
  DecisionLog,
  Mode,
  LessonType,
  DecisionOutcome,
} from "./types";

const MODE_LABEL: Record<Mode, string> = {
  validate_first: "A · 有想法，先验证",
  build_first: "B · 有产品，找渠道",
  portfolio: "C · 多产品组合",
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

const TYPE_LABEL: Record<string, string> = {
  learning: "学习型",
  validation: "验证型",
  asset: "资产型",
};

const LESSON_TYPE_LABEL: Record<LessonType, string> = {
  validated: "✅ 验证成立",
  invalidated: "❌ 被推翻",
  discovered: "💡 新发现",
};

const OUTCOME_LABEL: Record<DecisionOutcome, string> = {
  pending: "待验证",
  confirmed: "已确认",
  reversed: "已反转",
};

export interface ProjectBundle {
  project: Project;
  signals: Signal[];
  conversions: Conversion[];
  lessons: Lesson[];
  decisions: DecisionLog[];
}

export function buildProjectMarkdown(bundle: ProjectBundle): string {
  const { project: p, signals, conversions, lessons, decisions } = bundle;

  const lines: string[] = [];

  lines.push(`# ${p.name}`);
  lines.push("");
  lines.push(`> 由 ShipSignal 导出 · ${formatTime(new Date().toISOString())}`);
  lines.push("");

  lines.push("## 项目基本信息");
  lines.push("");
  lines.push(`- **模式**：${MODE_LABEL[p.mode] ?? p.mode}`);
  lines.push(`- **状态**：${STATUS_LABEL[p.status] ?? p.status}`);
  if (p.project_type)
    lines.push(`- **类型**：${TYPE_LABEL[p.project_type] ?? p.project_type}`);
  if (p.description?.trim()) lines.push(`- **描述**：${p.description.trim()}`);
  if (p.completion_criteria?.trim())
    lines.push(`- **完成标准**：${p.completion_criteria.trim()}`);
  if (p.sunset_conditions?.trim())
    lines.push(`- **日落条款**：${p.sunset_conditions.trim()}`);
  if (p.archive_reason?.trim())
    lines.push(`- **归档原因**：${p.archive_reason.trim()}`);
  lines.push(`- **创建时间**：${formatTime(p.created_at)}`);
  lines.push(`- **更新时间**：${formatTime(p.updated_at)}`);
  lines.push("");

  if (signals.length > 0) {
    lines.push(`## 信号（${signals.length} 条）`);
    lines.push("");
    signals.forEach((s, i) => {
      const data = safeParse(s.data);
      const conf = s.developer_confidence ?? s.suggested_confidence ?? "—";
      const src = s.source ? ` · ${s.source}` : "";
      lines.push(`### ${i + 1}. ${s.signal_type}${src}`);
      lines.push("");
      lines.push(
        `- 可信度：**${conf}**（来源可验证性 ${s.source_verifiability ?? "—"}）`
      );
      if (s.developer_confidence && s.override_reason) {
        lines.push(`- 人工覆盖原因：${s.override_reason}`);
      }
      if (s.decision_impact) {
        lines.push(`- 决策影响：${s.decision_impact}`);
      }
      const flags = safeParseArray(s.anomaly_flags);
      if (flags.length > 0) {
        lines.push(`- ⚠️ 异常标记：${flags.join(", ")}`);
      }
      const summary = describeData(data);
      if (summary) lines.push(`- 数据：${summary}`);
      lines.push(`- 创建：${formatTime(s.created_at)}`);
      lines.push("");
    });
  }

  if (conversions.length > 0) {
    lines.push(`## 转化（${conversions.length} 条）`);
    lines.push("");
    conversions.forEach((c, i) => {
      lines.push(`### ${i + 1}. ${c.user_segment ?? "（未标注客群）"}`);
      lines.push("");
      if (c.monetization_form)
        lines.push(`- 变现形态：${c.monetization_form}`);
      if (c.amount != null) {
        const amountStr = `${c.currency} ${c.amount}${
          c.recurring ? "（每期）" : ""
        }`;
        lines.push(`- 金额：${amountStr}`);
      }
      if (c.notes) lines.push(`- 备注：${c.notes}`);
      lines.push(`- 创建：${formatTime(c.created_at)}`);
      lines.push("");
    });
  }

  if (lessons.length > 0) {
    lines.push(`## 学习信号（${lessons.length} 条）`);
    lines.push("");
    lessons.forEach((l, i) => {
      const type = LESSON_TYPE_LABEL[l.lesson_type] ?? l.lesson_type;
      lines.push(`### ${i + 1}. ${type}`);
      lines.push("");
      lines.push(l.description);
      lines.push("");
      const tags = safeParseArray(l.applicable_to);
      if (tags.length > 0) lines.push(`适用场景：${tags.join(" · ")}`);
      lines.push(`- 创建：${formatTime(l.created_at)}`);
      lines.push("");
    });
  }

  if (decisions.length > 0) {
    lines.push(`## 决策日志（${decisions.length} 条）`);
    lines.push("");
    decisions.forEach((d, i) => {
      const outcome = OUTCOME_LABEL[d.outcome] ?? d.outcome;
      lines.push(`### ${i + 1}. ${d.decision}`);
      lines.push("");
      if (d.basis) lines.push(`- 依据：${d.basis}`);
      if (d.confidence) lines.push(`- 信心：${d.confidence}`);
      lines.push(`- 结果：${outcome}`);
      if (d.reviewed_at) lines.push(`- 复盘时间：${formatTime(d.reviewed_at)}`);
      lines.push(`- 创建：${formatTime(d.created_at)}`);
      lines.push("");
    });
  }

  if (
    signals.length === 0 &&
    conversions.length === 0 &&
    lessons.length === 0 &&
    decisions.length === 0
  ) {
    lines.push("## 记录");
    lines.push("");
    lines.push("_该项目暂无任何信号、转化、学习或决策记录。_");
    lines.push("");
  }

  lines.push("---");
  lines.push("");
  lines.push(
    "_本文件由 ShipSignal 生成。所有判断和可信度评分均为工具标注，最终解释权归开发者本人。_"
  );

  return lines.join("\n");
}

export function buildAllProjectsMarkdown(
  bundles: ProjectBundle[]
): string {
  if (bundles.length === 0) {
    return "# ShipSignal 导出\n\n_暂无任何项目。_\n";
  }

  const parts: string[] = [];
  parts.push(`# ShipSignal 全量导出\n`);
  parts.push(`> 导出时间：${formatTime(new Date().toISOString())}\n`);
  parts.push(`> 项目数：${bundles.length}\n`);
  parts.push(`\n---\n`);

  for (const b of bundles) {
    parts.push(buildProjectMarkdown(b));
    parts.push("\n---\n");
  }

  return parts.join("\n");
}

/* ---------------- 工具 ---------------- */

function safeParse(json: string): Record<string, unknown> {
  try {
    const v = JSON.parse(json);
    if (v && typeof v === "object" && !Array.isArray(v)) {
      return v as Record<string, unknown>;
    }
  } catch {
    // ignore
  }
  return {};
}

function safeParseArray(json: string): string[] {
  try {
    const v = JSON.parse(json);
    if (Array.isArray(v)) {
      return v.filter((x): x is string => typeof x === "string");
    }
  } catch {
    // ignore
  }
  return [];
}

function describeData(data: Record<string, unknown>): string {
  const keys = Object.keys(data);
  if (keys.length === 0) return "";
  const parts: string[] = [];
  for (const k of keys) {
    const v = data[k];
    if (v == null || v === "") continue;
    if (typeof v === "object") {
      parts.push(`${k}=${JSON.stringify(v)}`);
    } else {
      parts.push(`${k}=${String(v)}`);
    }
  }
  return parts.join(", ");
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
      d.getDate()
    )} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return iso;
  }
}