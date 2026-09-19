import type { EmotionScene, TemplateContext } from "./types";
import { daysAgo } from "./selectors";
import type { ProjectDataLite } from "./selectors";

export function buildContext(
  scene: EmotionScene,
  data: ProjectDataLite
): TemplateContext {
  const ctx: TemplateContext = {};

  if (scene === "channel_revisit" || scene === "channel_silence") {
    const map = new Map<string, { last: string; count: number }>();
    for (const s of data.recentSignals) {
      if (!s.channel) continue;
      const prev = map.get(s.channel);
      if (!prev) {
        map.set(s.channel, { last: s.created_at, count: 1 });
      } else {
        map.set(s.channel, {
          last:
            Date.parse(s.created_at) > Date.parse(prev.last)
              ? s.created_at
              : prev.last,
          count: prev.count + 1,
        });
      }
    }
    const sorted = [...map.entries()].sort(
      (a, b) => Date.parse(a[1].last) - Date.parse(b[1].last)
    );
    const first = sorted[0];
    ctx.channel = first?.[0] ?? "这个渠道";
    ctx.daysAgo = first ? daysAgo(first[1].last) : 0;
    ctx.lastSignalCount = first?.[1].count ?? 0;
  }

  if (scene === "signal_burst") {
    const byChannel = new Map<string, number>();
    const cutoff = Date.now() - 3 * 24 * 60 * 60 * 1000;
    for (const s of data.recentSignals) {
      if (!s.channel) continue;
      if (Date.parse(s.created_at) < cutoff) continue;
      byChannel.set(s.channel, (byChannel.get(s.channel) ?? 0) + 1);
    }
    const top = [...byChannel.entries()].sort((a, b) => b[1] - a[1])[0];
    ctx.channel = top?.[0] ?? "某渠道";
    ctx.signalCount = top?.[1] ?? 0;
  }

  if (scene === "feed_greeting") {
    ctx.feedCount = data.newFeedCount;
  }

  return ctx;
}