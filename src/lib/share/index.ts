import { renderProjectCard } from "./renderers/projectCard";
import type { ShareData, ShareOptions } from "./types";

export type { ShareData, ShareOptions } from "./types";

export async function generateProjectCardBlob(
  data: ShareData,
  options: ShareOptions = {}
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  renderProjectCard(canvas, data, options);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("canvas.toBlob returned null"));
      },
      "image/png",
      0.95
    );
  });
}

export async function downloadProjectCard(
  data: ShareData,
  options: ShareOptions = {}
): Promise<void> {
  const blob = await generateProjectCardBlob(data, options);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${sanitize(data.projectName)}-shipsignal.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function sanitize(s: string): string {
  return s.replace(/[\\/:*?"<>|]/g, "_").slice(0, 40) || "shipsignal";
}