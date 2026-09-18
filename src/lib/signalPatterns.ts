// v1.1 信号模式识别 —— 纯确定性算法，不调 AI
// 四个维度：渠道深度 / 信号聚集 / 信号沉默 / 付费前兆
//
// 铁律：
//   1. 所有结论必须能点回原始信号（payload 只存客观计数，不存幻觉）
//   2. 输出是「指标」，不是「判决」——工具不下结论，用户自己判断

import type {
  Signal,
  Conversion,
  SignalPattern,
  PatternType,
  ChannelDepthPayload,
  SignalBurstPayload,
  SignalSilencePayload,
  PaymentPrecursorPayload,
} from "./types";
import {
  listSignals,
  listConversions,
  replaceSignalPatterns,
} from "./db";
import { nowIso, uuid } from "./utils";

const DAY_MS = 24 * 60 * 60 * 1000;
const BURST_WINDOW_DAYS = 7;
const SILENCE_THRESHOLD_DAYS = 14;
const SILENCE_MIN_SIGNALS = 3;
const BURST_MIN_SIGNALS = 3;
const BURST_MIN_RATIO = 2;
const PRECURSOR_WINDOW_DAYS = 7;

/* ---------------- 内部工具 ---------------- */

function channelOf(s: Signal): string | null {
  const src = (s.source ?? "").trim();
  return src.length > 0 ? src : null;
}

function isPaymentSignal(s: Signal): boolean {
  if (s.signal_type === "payment") return true;
  try {
    const d = JSON.parse(s.data || "{}") as Record<string, unknown>;
    return d.payment_signal_present === true;
  } catch {
    return false;
  }
}

function parseTime(iso: string | null | undefined): number {
  if (!iso) return 0;
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : 0;
}

/* ---------------- 1. 渠道深度 ---------------- */

function computeChannelDepth(signals: Signal[]): ChannelDepthPayload[] {
  const byChannel = new Map<string, Signal[]>();

  for (const s of signals) {
    const ch = channelOf(s);
    if (!ch) continue;
    const arr = byChannel.get(ch);
    if (arr) arr.push(s);
    else byChannel.set(ch, [s]);
  }

  const out: ChannelDepthPayload[] = [];

  for (const [channel, list] of byChannel) {
    const has_payment = list.some(isPaymentSignal);
    const has_impact = list.some(
      (s) => (s.decision_impact ?? "").trim().length > 0
    );
    const has_high_verifiability = list.some(
      (s) => s.source_verifiability === "high"
    );

    const depth: "shallow" | "deep" =
      has_payment || has_impact || has_high_verifiability ? "deep" : "shallow";

    out.push({
      channel,
      depth,
      signal_count: list.length,
      has_payment,
    });
  }

  // 深渠道优先，其次信号数多的优先
  out.sort((a, b) => {
    if (a.depth !== b.depth) return a.depth === "deep" ? -1 : 1;
    return b.signal_count - a.signal_count;
  });

  return out;
}

/* ---------------- 2. 信号聚集 ---------------- */

function computeSignalBurst(
  signals: Signal[],
  now: number = Date.now()
): SignalBurstPayload[] {
  const recentStart = now - BURST_WINDOW_DAYS * DAY_MS;
  const prevStart = now - 2 * BURST_WINDOW_DAYS * DAY_MS;

  const recent = new Map<string, number>();
  const prev = new Map<string, number>();

  for (const s of signals) {
    const ch = channelOf(s);
    if (!ch) continue;
    const t = parseTime(s.created_at);
    if (t >= recentStart) {
      recent.set(ch, (recent.get(ch) ?? 0) + 1);
    } else if (t >= prevStart) {
      prev.set(ch, (prev.get(ch) ?? 0) + 1);
    }
  }

  const out: SignalBurstPayload[] = [];

  for (const [channel, count] of recent) {
    if (count < BURST_MIN_SIGNALS) continue;
    const before = prev.get(channel) ?? 0;
    // 之前 0 条 → 视为爆发（ratio 记为 count，方便排序）
    const ratio = before === 0 ? count : count / before;
    if (ratio > BURST_MIN_RATIO) {
      out.push({
        channel,
        count,
        spike_ratio: Math.round(ratio * 100) / 100,
      });
    }
  }

  out.sort((a, b) => b.spike_ratio - a.spike_ratio);
  return out;
}

/* ---------------- 3. 信号沉默 ---------------- */

function computeSignalSilence(
  signals: Signal[],
  now: number = Date.now()
): SignalSilencePayload[] {
  const stats = new Map<
    string,
    { count: number; last: number; lastIso: string }
  >();

  for (const s of signals) {
    const ch = channelOf(s);
    if (!ch) continue;
    const t = parseTime(s.created_at);
    const cur = stats.get(ch);
    if (!cur) {
      stats.set(ch, { count: 1, last: t, lastIso: s.created_at });
    } else {
      cur.count += 1;
      if (t > cur.last) {
        cur.last = t;
        cur.lastIso = s.created_at;
      }
    }
  }

  const silentMs = SILENCE_THRESHOLD_DAYS * DAY_MS;
  const out: SignalSilencePayload[] = [];

  for (const [channel, info] of stats) {
    if (info.count < SILENCE_MIN_SIGNALS) continue;
    const gap = now - info.last;
    if (gap > silentMs) {
      out.push({
        channel,
        days_silent: Math.floor(gap / DAY_MS),
        last_signal_at: info.lastIso,
      });
    }
  }

  out.sort((a, b) => b.days_silent - a.days_silent);
  return out;
}

/* ---------------- 4. 付费前兆 ---------------- */

function computePaymentPrecursor(
  signals: Signal[],
  conversions: Conversion[]
): PaymentPrecursorPayload | null {
  if (conversions.length === 0) return null;

  const sortedSignals = [...signals]
    .map((s) => ({ s, t: parseTime(s.created_at) }))
    .filter((x) => x.t > 0)
    .sort((a, b) => a.t - b.t);

  const windowMs = PRECURSOR_WINDOW_DAYS * DAY_MS;
  const typeHits = new Map<string, number>();
  let matchedSignals = 0;

  for (const conv of conversions) {
    const convT = parseTime(conv.created_at);
    if (convT === 0) continue;
    const windowStart = convT - windowMs;

    for (const { s, t } of sortedSignals) {
      if (t < windowStart) continue;
      if (t > convT) break;
      // payment 本身不算「前兆」
      if (s.signal_type === "payment") continue;
      if (isPaymentSignal(s)) continue;
      typeHits.set(s.signal_type, (typeHits.get(s.signal_type) ?? 0) + 1);
      matchedSignals += 1;
    }
  }

  if (matchedSignals === 0) return null;

  const ranked = [...typeHits.entries()].sort((a, b) => b[1] - a[1]);
  if (ranked.length === 0) return null;

  const top = ranked.slice(0, 3).map(([t]) => t);
  const topCount = ranked[0][1];
  const share = topCount / matchedSignals;
  const sampleFactor = Math.min(matchedSignals / 10, 1);
  const confidence = Math.round(share * sampleFactor * 100) / 100;

  return {
    precursor_types: top,
    confidence,
    sample_size: matchedSignals,
  };
}

/* ---------------- 主入口 ---------------- */

export interface ComputedPatterns {
  channel_depth: ChannelDepthPayload[];
  signal_burst: SignalBurstPayload[];
  signal_silence: SignalSilencePayload[];
  payment_precursor: PaymentPrecursorPayload | null;
}

/** 纯函数：读数据 + 跑四个维度，不写库。便于测试。 */
export function analyzePatterns(
  signals: Signal[],
  conversions: Conversion[],
  now: number = Date.now()
): ComputedPatterns {
  return {
    channel_depth: computeChannelDepth(signals),
    signal_burst: computeSignalBurst(signals, now),
    signal_silence: computeSignalSilence(signals, now),
    payment_precursor: computePaymentPrecursor(signals, conversions),
  };
}

/** 主入口：跑完写库，返回落库的行。 */
export async function computePatterns(
  projectId: string
): Promise<SignalPattern[]> {
  const [signals, conversions] = await Promise.all([
    listSignals(projectId),
    listConversions(projectId),
  ]);

  const computed = analyzePatterns(signals, conversions);
  const computedAt = nowIso();

  const flat: { type: PatternType; payload: unknown }[] = [];

  for (const p of computed.channel_depth) {
    flat.push({ type: "channel_depth", payload: p });
  }
  for (const p of computed.signal_burst) {
    flat.push({ type: "signal_burst", payload: p });
  }
  for (const p of computed.signal_silence) {
    flat.push({ type: "signal_silence", payload: p });
  }
  if (computed.payment_precursor) {
    flat.push({ type: "payment_precursor", payload: computed.payment_precursor });
  }

  const rows: SignalPattern[] = flat.map((f) => ({
    id: uuid(),
    project_id: projectId,
    pattern_type: f.type,
    payload: JSON.stringify(f.payload),
    computed_at: computedAt,
  }));

  await replaceSignalPatterns(projectId, rows);
  return rows;
}