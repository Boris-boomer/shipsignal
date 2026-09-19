import { renderTemplate } from "./templates";
import { pickScene } from "./selectors";
import { buildContext } from "./fillers";
import type { EmotionOutput, TemplateContext, EmotionScene } from "./types";
import type { ProjectDataLite } from "./selectors";

export type {
  EmotionScene,
  EmotionOutput,
  TemplateContext,
} from "./types";
export type { ProjectDataLite } from "./selectors";
export { pickScene, buildContext };

export function renderEmotion(
  scene: EmotionScene,
  ctx: TemplateContext
): EmotionOutput {
  return renderTemplate(scene, ctx);
}

export function renderEmotionFromData(
  data: ProjectDataLite
): EmotionOutput | null {
  const scene = pickScene(data);
  if (!scene) return null;
  const ctx = buildContext(scene, data);
  return renderEmotion(scene, ctx);
}