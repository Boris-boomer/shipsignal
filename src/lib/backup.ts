import { save, open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import type { BackupData } from "./types";
import { dumpAllData, restoreAllData } from "./db";
import {
  buildAllProjectsMarkdown,
  buildProjectMarkdown,
  type ProjectBundle,
} from "./export";
import {
  listSignals,
  listConversions,
  listLessons,
  listDecisions,
} from "./db";
import type { Project } from "./types";

/* ---------------- Markdown 导出 ---------------- */

export async function exportProjectMarkdown(project: Project): Promise<void> {
  const bundle = await loadProjectBundle(project);
  const md = buildProjectMarkdown(bundle);

  const defaultName = `${sanitizeFilename(project.name)}-${dateStamp()}.md`;
  const path = await save({
    defaultPath: defaultName,
    filters: [{ name: "Markdown", extensions: ["md"] }],
  });
  if (!path) return;

  await invoke("save_text_file", { path, content: md });
}

export async function exportAllProjectsMarkdown(
  projects: Project[]
): Promise<void> {
  const bundles: ProjectBundle[] = [];
  for (const p of projects) {
    bundles.push(await loadProjectBundle(p));
  }
  const md = buildAllProjectsMarkdown(bundles);

  const defaultName = `ShipSignal-全量导出-${dateStamp()}.md`;
  const path = await save({
    defaultPath: defaultName,
    filters: [{ name: "Markdown", extensions: ["md"] }],
  });
  if (!path) return;

  await invoke("save_text_file", { path, content: md });
}

async function loadProjectBundle(project: Project): Promise<ProjectBundle> {
  const [signals, conversions, lessons, decisions] = await Promise.all([
    listSignals(project.id),
    listConversions(project.id),
    listLessons(project.id),
    listDecisions(project.id),
  ]);
  return { project, signals, conversions, lessons, decisions };
}

/* ---------------- JSON 备份 ---------------- */

export async function exportBackup(): Promise<void> {
  const data = await dumpAllData();
  const json = JSON.stringify(data, null, 2);

  const defaultName = `ShipSignal-backup-${dateStamp()}.json`;
  const path = await save({
    defaultPath: defaultName,
    filters: [{ name: "JSON", extensions: ["json"] }],
  });
  if (!path) return;

  await invoke("save_text_file", { path, content: json });
}

/* ---------------- 恢复备份 ---------------- */

export interface RestorePreview {
  path: string;
  data: BackupData;
  summary: {
    projects: number;
    signals: number;
    conversions: number;
    lessons: number;
    decision_logs: number;
    exported_at: string;
  };
}

export async function pickBackupFile(): Promise<RestorePreview | null> {
  const selected = await open({
    multiple: false,
    filters: [{ name: "JSON", extensions: ["json"] }],
  });
  if (!selected) return null;

  const path = typeof selected === "string" ? selected : selected;

  const content = await invoke<string>("read_text_file", { path });

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch (e) {
    throw new Error(
      `JSON 解析失败：${e instanceof Error ? e.message : String(e)}`
    );
  }

  const data = validateBackup(parsed);

  return {
    path,
    data,
    summary: {
      projects: data.projects.length,
      signals: data.signals.length,
      conversions: data.conversions.length,
      lessons: data.lessons.length,
      decision_logs: data.decision_logs.length,
      exported_at: data.exported_at,
    },
  };
}

export async function performRestore(preview: RestorePreview): Promise<void> {
  await restoreAllData(preview.data);
}

function validateBackup(raw: unknown): BackupData {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("文件内容不是有效的备份对象。");
  }
  const obj = raw as Record<string, unknown>;

  if (obj.version !== 1) {
    throw new Error(
      `不支持的备份版本：${String(obj.version)}（当前仅支持 version=1）`
    );
  }

  const required = [
    "projects",
    "signals",
    "conversions",
    "lessons",
    "decision_logs",
  ] as const;

  for (const key of required) {
    if (!Array.isArray(obj[key])) {
      throw new Error(`备份文件缺少字段或类型错误：${key} 不是数组`);
    }
  }

  return {
    version: 1,
    exported_at:
      typeof obj.exported_at === "string"
        ? obj.exported_at
        : new Date().toISOString(),
    app_version:
      typeof obj.app_version === "string" ? obj.app_version : "unknown",
    projects: obj.projects as BackupData["projects"],
    signals: obj.signals as BackupData["signals"],
    conversions: obj.conversions as BackupData["conversions"],
    lessons: obj.lessons as BackupData["lessons"],
    decision_logs: obj.decision_logs as BackupData["decision_logs"],
  };
}

/* ---------------- 工具 ---------------- */

function sanitizeFilename(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, "_").trim() || "项目";
}

function dateStamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(
    d.getDate()
  )}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}