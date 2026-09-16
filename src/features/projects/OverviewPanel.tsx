import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { Project } from "@/lib/types";
import { useSignalStore } from "@/stores/signalStore";
import { useConversionStore } from "@/stores/conversionStore";
import { useLessonStore } from "@/stores/lessonStore";
import { useDecisionStore } from "@/stores/decisionStore";
import { useProjectStore } from "@/stores/projectStore";
import { Card, CardBody, CardHeader } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import { ModeDataForm } from "./ModeDataForm";

const MODE_LABEL: Record<string, string> = {
  validate_first: "A · 有想法，先验证",
  build_first: "B · 有产品，找渠道",
  portfolio: "C · 多产品组合",
};

const TYPE_LABEL: Record<string, string> = {
  learning: "学习型",
  validation: "验证型",
  asset: "资产型",
};

export function OverviewPanel({ project }: { project: Project }) {
  const { t } = useTranslation();
  const signals = useSignalStore((s) => s.signals);
  const conversions = useConversionStore((s) => s.conversions);
  const lessons = useLessonStore((s) => s.lessons);
  const decisions = useDecisionStore((s) => s.decisions);
  const updateProject = useProjectStore((s) => s.update);

  const context = useMemo(() => {
    const parts: string[] = [];

    // 项目基础信息（即使没有任何记录，AI 也能参考这些）
    const projectLines: string[] = [];
    projectLines.push(`- 名称：${project.name}`);
    projectLines.push(`- 模式：${MODE_LABEL[project.mode] ?? project.mode}`);
    if (project.entry) projectLines.push(`- 入口：${project.entry}`);
    if (project.project_type)
      projectLines.push(
        `- 类型：${TYPE_LABEL[project.project_type] ?? project.project_type}`
      );
    if (project.description?.trim())
      projectLines.push(`- 描述：${project.description.trim()}`);
    if (project.completion_criteria?.trim())
      projectLines.push(`- 完成标准：${project.completion_criteria.trim()}`);
    if (project.sunset_conditions?.trim())
      projectLines.push(`- 日落条款：${project.sunset_conditions.trim()}`);
    parts.push("### 项目基础信息\n" + projectLines.join("\n"));

    if (signals.length > 0) {
      parts.push(
        "### 信号\n" +
          signals
            .map((s) => {
              const data = safeParse(s.data);
              const conf =
                s.developer_confidence ??
                s.suggested_confidence ??
                "未评估";
              return `- [${s.signal_type}] 来源：${s.source ?? "未知"}｜可信度：${conf}｜数据：${JSON.stringify(data)}`;
            })
            .join("\n")
      );
    }

    if (conversions.length > 0) {
      parts.push(
        "### 转化记录\n" +
          conversions
            .map(
              (c) =>
                `- ${c.user_segment ?? "未知客群"}｜${c.monetization_form ?? "未说明"}｜${c.currency} ${c.amount ?? 0}${c.recurring ? "（订阅）" : ""}`
            )
            .join("\n")
      );
    }

    if (decisions.length > 0) {
      parts.push(
        "### 决策记录\n" +
          decisions
            .map(
              (d) =>
                `- ${d.decision}（${d.outcome}）${d.basis ? `｜依据：${d.basis}` : ""}`
            )
            .join("\n")
      );
    }

    if (lessons.length > 0) {
      parts.push(
        "### 学习信号\n" +
          lessons
            .map((l) => `- [${l.lesson_type}] ${l.description}`)
            .join("\n")
      );
    }

    if (parts.length === 1) {
      // 只有项目基础信息，说明没有记录
      parts.push("（该项目还没有任何信号、决策、转化、学习记录）");
    }

    return parts.join("\n\n");
  }, [project, signals, conversions, decisions, lessons]);

  async function handleSaveModeData(next: string) {
    await updateProject(project.id, { mode_data: next });
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title={t("overview.title")}
          description={`${project.mode} · ${project.status}`}
        />
        <CardBody className="grid grid-cols-2 gap-4 text-sm">
          <Info
            label={t("overview.field.entry")}
            value={project.entry ?? "—"}
          />
          <Info
            label={t("overview.field.type")}
            value={project.project_type ?? t("common.notSet")}
          />
          <Info
            label={t("overview.field.criteria")}
            value={project.completion_criteria ?? t("common.notSet")}
          />
          <Info
            label={t("overview.field.hours")}
            value={`${project.build_hours ?? 0} / ${
              project.distribution_hours ?? 0
            }`}
          />
          <Info
            label={t("overview.field.createdAt")}
            value={formatDate(project.created_at)}
          />
          <Info
            label={t("overview.field.updatedAt")}
            value={formatDate(project.updated_at)}
          />
        </CardBody>
      </Card>

      <div className="grid grid-cols-4 gap-3">
        <Mini label={t("overview.mini.signals")} value={signals.length} />
        <Mini
          label={t("overview.mini.decisions")}
          value={decisions.length}
        />
        <Mini
          label={t("overview.mini.conversions")}
          value={conversions.length}
        />
        <Mini label={t("overview.mini.lessons")} value={lessons.length} />
      </div>

      <ModeDataForm
        mode={project.mode}
        value={project.mode_data}
        context={context}
        onSave={handleSaveModeData}
      />

      <Card>
        <CardHeader title={t("overview.principles.title")} />
        <CardBody className="space-y-2 text-xs text-[var(--color-muted)]">
          <div>{t("overview.principles.p1")}</div>
          <div>{t("overview.principles.p2")}</div>
          <div>{t("overview.principles.p3")}</div>
          <div>{t("overview.principles.p4")}</div>
        </CardBody>
      </Card>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-[var(--color-muted)]">{label}</div>
      <div className="mt-0.5 text-[var(--color-strong)]">{value}</div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-3">
      <div className="text-xs text-[var(--color-muted)]">{label}</div>
      <div className="mt-1 text-xl font-semibold text-[var(--color-strong)]">{value}</div>
    </Card>
  );
}

function safeParse(json: string): unknown {
  try {
    return JSON.parse(json || "null");
  } catch {
    return null;
  }
}