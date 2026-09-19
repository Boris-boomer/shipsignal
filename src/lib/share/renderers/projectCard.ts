import type { ShareData, ShareOptions } from "../types";

interface Palette {
  bg1: string;
  bg2: string;
  title: string;
  sub: string;
  metricLabel: string;
  metricValue: string;
  divider: string;
  brand: string;
  footer: string;
}

const LIGHT: Palette = {
  bg1: "#ffffff",
  bg2: "#f4f5fa",
  title: "#1a1d2b",
  sub: "#6b7280",
  metricLabel: "#8a92a6",
  metricValue: "#1a1d2b",
  divider: "#e5e7eb",
  brand: "#6366f1",
  footer: "#9ca3af",
};

const DARK: Palette = {
  bg1: "#1a1d2b",
  bg2: "#11131c",
  title: "#f5f6fa",
  sub: "#9ca3af",
  metricLabel: "#6b7280",
  metricValue: "#f5f6fa",
  divider: "#2a2d3d",
  brand: "#8b9cff",
  footer: "#6b7280",
};

export function renderProjectCard(
  canvas: HTMLCanvasElement,
  data: ShareData,
  options: ShareOptions = {}
): void {
  const width = options.width ?? 960;
  const height = options.height ?? 540;
  const theme = options.theme ?? "light";
  const c = theme === "dark" ? DARK : LIGHT;

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, c.bg1);
  grad.addColorStop(1, c.bg2);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = c.brand;
  ctx.fillRect(0, 0, width, 6);

  ctx.fillStyle = c.title;
  ctx.font =
    "600 42px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.textBaseline = "top";
  ctx.fillText(truncate(data.projectName, 26), 60, 78);

  if (data.description) {
    ctx.fillStyle = c.sub;
    ctx.font =
      "400 18px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    const lines = wrapText(data.description, 50);
    lines.slice(0, 2).forEach((line, i) => {
      ctx.fillText(line, 60, 138 + i * 26);
    });
  }

  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  ctx.fillStyle = c.footer;
  ctx.font =
    "400 14px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillText(`记录 ${data.daysActive} 天 · 导出于 ${dateStr}`, 60, height - 52);

  ctx.fillStyle = c.brand;
  ctx.font =
    "600 16px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("ShipSignal", width - 60, height - 54);
  ctx.textAlign = "left";

  ctx.strokeStyle = c.divider;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(60, height - 90);
  ctx.lineTo(width - 60, height - 90);
  ctx.stroke();

  const metrics = [
    { label: "信号", value: String(data.signalCount) },
    { label: "决策", value: String(data.decisionCount) },
    { label: "转化", value: String(data.conversionCount) },
    { label: "学习", value: String(data.lessonCount) },
  ];

  const metricStartY = 270;
  const metricGap = (width - 120) / 4;

  metrics.forEach((m, i) => {
    const x = 60 + i * metricGap;

    ctx.fillStyle = c.metricValue;
    ctx.font =
      "600 56px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    ctx.fillText(m.value, x, metricStartY);

    ctx.fillStyle = c.metricLabel;
    ctx.font =
      "400 16px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    ctx.fillText(m.label, x, metricStartY + 72);
  });

  if (data.incomeText) {
    ctx.fillStyle = c.sub;
    ctx.font =
      "400 16px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    ctx.fillText(`累计收入：${data.incomeText}`, 60, height - 140);
  }
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

function wrapText(s: string, maxPerLine: number): string[] {
  const out: string[] = [];
  let line = "";
  for (const ch of s) {
    if (line.length >= maxPerLine) {
      out.push(line);
      line = "";
    }
    line += ch;
  }
  if (line) out.push(line);
  return out;
}