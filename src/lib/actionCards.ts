// v1.1 行动卡片 —— 由信号模式驱动，生成「今日建议」
//
// 原则：
//   1. 建议来自用户自己的历史数据，不是通用模板
//   2. 生成规则确定性；AI 只在用户主动点「起草」时才介入
//   3. 每天最多一张 pending 卡，避免信息过载
//   4. 每张卡片都带 source_signals（能点回原始信号）

import type {
  ActionCard,
  SignalPattern,
  SignalBurstPayload,
  SignalSilencePayload,
  ChannelDepthPayload,
  PaymentPrecursorPayload,
} from "./types";
import {
  listActionCards,
  listSignalPatterns,
  listSignals,
  getActionCard,
  insertActionCard,
  updateActionCardStatus,
} from "./db";
import { computePatterns } from "./signalPatterns";
import { nowIso } from "./utils";

/* ---------------- 常量 ---------------- */

export const CARD_TYPES = {
  BURST_FOLLOWUP: "burst_followup",
  PAYMENT_PREPARE: "payment_prepare",
  SILENCE_REACTIVATE: "silence_reactivate",
  DEPTH_DEEPEN: "depth_deepen",
} as const;

export type CardType = (typeof CARD_TYPES)[keyof typeof CARD_TYPES];

const DAY_MS = 24 * 60 * 60 * 1000;
const RECENT_HOURS = 24;

/* ---------------- 工具 ---------------- */

function withinHours(iso: string, hours: number): boolean {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return false;
  return Date.now() - t < hours * 3600_000;
}

function withinDays(iso: string, days: number): boolean {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return false;
  return Date.now() - t < days * DAY_MS;
}

function pickFirstPerType(
  patterns: SignalPattern[]
): Map<string, SignalPattern> {
  const map = new Map<string, SignalPattern>();
  for (const p of patterns) {
    if (!map.has(p.pattern_type)) map.set(p.pattern_type, p);
  }
  return map;
}

/* ---------------- 卡片构造器 ---------------- */

async function buildBurstCard(
  projectId: string,
  payload: SignalBurstPayload
): Promise<Parameters<typeof insertActionCard>[0]> {
  const signals = await listSignals(projectId);
  const sourceIds = signals
    .filter((s) => (s.source ?? "") === payload.channel)
    .filter((s) => withinDays(s.created_at, 7))
    .map((s) => s.id);

  return {
    project_id: projectId,
    card_type: CARD_TYPES.BURST_FOLLOWUP,
    title: `跟进「${payload.channel}」`,
    body: `最近 7 天，该渠道的信号密度是之前的 ${payload.spike_ratio} 倍（共 ${payload.count} 条）。机会窗口正开着，建议尽快跟进。`,
    draft: null,
    source_signals: JSON.stringify(sourceIds),
  };
}

async function buildPaymentCard(
  projectId: string,
  payload: PaymentPrecursorPayload
): Promise<Parameters<typeof insertActionCard>[0]> {
  const signals = await listSignals(projectId);
  const sourceIds = signals
    .filter((s) => payload.precursor_types.includes(s.signal_type))
    .map((s) => s.id);

  const typesText = payload.precursor_types.join(" / ");
  return {
    project_id: projectId,
    card_type: CARD_TYPES.PAYMENT_PREPARE,
    title: `准备转化动作`,
    body: `历史数据显示，出现「${typesText}」之后，最常伴随付费事件（样本 ${payload.sample_size} 条，置信度 ${payload.confidence}）。可以考虑下一步转化动作。`,
    draft: null,
    source_signals: JSON.stringify(sourceIds),
  };
}

async function buildSilenceCard(
  projectId: string,
  payload: SignalSilencePayload
): Promise<Parameters<typeof insertActionCard>[0]> {
  const signals = await listSignals(projectId);
  const sourceIds = signals
    .filter((s) => (s.source ?? "") === payload.channel)
    .map((s) => s.id);

  const lastDate = payload.last_signal_at.slice(0, 10);
  return {
    project_id: projectId,
    card_type: CARD_TYPES.SILENCE_REACTIVATE,
    title: `重新激活「${payload.channel}」`,
    body: `该渠道已经 ${payload.days_silent} 天没有新信号了（最后一条：${lastDate}）。是否值得重新投入？`,
    draft: null,
    source_signals: JSON.stringify(sourceIds),
  };
}

async function buildDepthCard(
  projectId: string,
  payload: ChannelDepthPayload
): Promise<Parameters<typeof insertActionCard>[0]> {
  const signals = await listSignals(projectId);
  const sourceIds = signals
    .filter((s) => (s.source ?? "") === payload.channel)
    .map((s) => s.id);

  const payNote = payload.has_payment ? "，其中包含付费信号" : "";
  return {
    project_id: projectId,
    card_type: CARD_TYPES.DEPTH_DEEPEN,
    title: `深化「${payload.channel}」互动`,
    body: `该渠道已积累 ${payload.signal_count} 条信号${payNote}。这是一个值得继续投入的渠道。`,
    draft: null,
    source_signals: JSON.stringify(sourceIds),
  };
}

/* ---------------- 主流程 ---------------- */

/**
 * 按优先级生成一张行动卡片。
 * 冷却规则：
 *   - 已有 pending 卡（24h 内）→ 直接返回它
 *   - skipped 的卡片类型（24h 内）→ 不再推同类型（用户明确不想看）
 *   - done / replaced 的卡片 → 不影响（用户已经处理或主动换掉）
 */
export async function generateActionCard(
  projectId: string,
  excludeTypes: string[] = []
): Promise<ActionCard | null> {
  // 1. 重新计算 patterns
  await computePatterns(projectId);

  // 2. 读最新的 patterns
  const patternRows = await listSignalPatterns(projectId);
  const byType = pickFirstPerType(patternRows);

  // 3. 检查现有卡片
  const existing = await listActionCards(projectId);

  // 3a. 24h 内已有 pending → 直接返回，不重复生成
  const activePending = existing.find(
    (c) => c.status === "pending" && withinHours(c.created_at, RECENT_HOURS)
  );
  if (activePending) return activePending;

  // 3b. 24h 内 skipped 的类型 → 冷却
  const recentSkipped = new Set(
    existing
      .filter(
        (c) =>
          c.status === "skipped" && withinHours(c.created_at, RECENT_HOURS)
      )
      .map((c) => c.card_type)
  );

  // 4. 按优先级依次尝试
  const tries: Array<{
    type: string;
    run: () => Promise<ActionCard | null>;
  }> = [
    {
      type: CARD_TYPES.BURST_FOLLOWUP,
      run: async () => {
        const p = byType.get("signal_burst");
        if (!p) return null;
        const input = await buildBurstCard(
          projectId,
          JSON.parse(p.payload) as SignalBurstPayload
        );
        return await insertActionCard(input);
      },
    },
    {
      type: CARD_TYPES.PAYMENT_PREPARE,
      run: async () => {
        const p = byType.get("payment_precursor");
        if (!p) return null;
        const input = await buildPaymentCard(
          projectId,
          JSON.parse(p.payload) as PaymentPrecursorPayload
        );
        return await insertActionCard(input);
      },
    },
    {
      type: CARD_TYPES.SILENCE_REACTIVATE,
      run: async () => {
        const p = byType.get("signal_silence");
        if (!p) return null;
        const input = await buildSilenceCard(
          projectId,
          JSON.parse(p.payload) as SignalSilencePayload
        );
        return await insertActionCard(input);
      },
    },
    {
      type: CARD_TYPES.DEPTH_DEEPEN,
      run: async () => {
        for (const p of patternRows) {
          if (p.pattern_type !== "channel_depth") continue;
          const payload = JSON.parse(p.payload) as ChannelDepthPayload;
          if (payload.depth !== "deep") continue;
          const input = await buildDepthCard(projectId, payload);
          return await insertActionCard(input);
        }
        return null;
      },
    },
  ];

  for (const t of tries) {
    if (excludeTypes.includes(t.type)) continue;
    if (recentSkipped.has(t.type)) continue;
    const card = await t.run();
    if (card) return card;
  }

  return null;
}

/* ---------------- 卡片操作 ---------------- */

export async function markCardDone(cardId: string): Promise<void> {
  await updateActionCardStatus(cardId, "done", nowIso());
}

export async function markCardSkipped(cardId: string): Promise<void> {
  await updateActionCardStatus(cardId, "skipped", nowIso());
}

export async function replaceCard(
  cardId: string
): Promise<ActionCard | null> {
  const card = await getActionCard(cardId);
  if (!card) return null;
  await updateActionCardStatus(cardId, "replaced", nowIso());
  return generateActionCard(card.project_id, [card.card_type]);
}

/* ---------------- UI 便捷函数 ---------------- */

/** 当前 24 小时内的 pending 卡片；无则返回 null。 */
export async function getActiveCard(
  projectId: string
): Promise<ActionCard | null> {
  const all = await listActionCards(projectId);
  for (const c of all) {
    if (c.status === "pending" && withinHours(c.created_at, RECENT_HOURS)) {
      return c;
    }
  }
  return null;
}

/** 有 pending 卡就返回，没有就生成一张（可能仍为 null，表示今天无建议）。 */
export async function ensureActionCard(
  projectId: string
): Promise<ActionCard | null> {
  const active = await getActiveCard(projectId);
  if (active) return active;
  return generateActionCard(projectId);
}