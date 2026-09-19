import type { EmotionScene } from "./types";

export interface ProjectDataLite {
  signalCount: number;
  recentSignals: {
    channel: string | null;
    signal_type: string;
    created_at: string;
    payment_signal_present?: boolean;
  }[];
  isFirstEver?: boolean;
  hasMistake?: boolean;
  hasDueReview?: boolean;
  newFeedCount?: number;
}

const DAY = 24 * 60 * 60 * 1000;

function daysAgo(iso: string): number {
  return Math.floor((Date.now() - Date.parse(iso)) / DAY);
}

export function pickScene(data: ProjectDataLite): EmotionScene | null {
  if (data.isFirstEver) return "first_signal";
  if (data.newFeedCount && data.newFeedCount > 0) return "feed_greeting";
  if (data.hasDueReview) return "review_due";
  if (data.hasMistake) return "mistake_warning";

  const now = Date.now();
  const byChannel = new Map<string, { last: number; count: number }>();

  for (const s of data.recentSignals) {
    if (!s.channel) continue;
    const t = Date.parse(s.created_at);
    const prev = byChannel.get(s.channel);
    if (!prev) {
      byChannel.set(s.channel, { last: t, count: 1 });
    } else {
      byChannel.set(s.channel, {
        last: Math.max(prev.last, t),
        count: prev.count + 1,
      });
    }
  }

  // 3 天内密集信号
  for (const [, { last, count }] of byChannel) {
    if (now - last < 3 * DAY && count >= 4) return "signal_burst";
  }

  // 付费前兆
  const recentPayment = data.recentSignals.find(
    (s) =>
      s.payment_signal_present ||
      s.signal_type === "payment" ||
      s.signal_type === "reply"
  );
  if (recentPayment && daysAgo(recentPayment.created_at) < 7) {
    return "payment_precursor";
  }

  // 渠道沉默（3 天）
  for (const [, { last, count }] of byChannel) {
    if (count >= 2 && now - last > 3 * DAY) return "channel_silence";
  }

  return null;
}

export { daysAgo };