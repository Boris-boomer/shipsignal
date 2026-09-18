import { useEffect, useMemo, useState } from "react";
import { listAllConversions, listAllSignals } from "@/lib/db";
import type { Conversion, Signal } from "@/lib/types";

export interface TimelinePoint {
  date: string;
  count: number;
}
export interface ChannelPoint {
  channel: string;
  count: number;
}
export interface TypePoint {
  type: string;
  count: number;
}
export interface FunnelPoint {
  stage: string;
  value: number;
}

export interface DashboardData {
  timeline: TimelinePoint[];
  channels: ChannelPoint[];
  types: TypePoint[];
  funnel: FunnelPoint[];
  totalSignals: number;
  totalConversions: number;
}

const DAYS = 30;

export function useDashboardData() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [conversions, setConversions] = useState<Conversion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const [s, c] = await Promise.all([
          listAllSignals(),
          listAllConversions(),
        ]);
        if (!alive) return;
        setSignals(s);
        setConversions(c);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const data = useMemo<DashboardData>(() => {
    const dayMap = new Map<string, number>();
    const today = new Date();
    for (let i = DAYS - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      dayMap.set(d.toISOString().slice(0, 10), 0);
    }
    for (const s of signals) {
      const key = s.created_at.slice(0, 10);
      if (dayMap.has(key)) dayMap.set(key, (dayMap.get(key) ?? 0) + 1);
    }
    const timeline: TimelinePoint[] = Array.from(dayMap.entries()).map(
      ([date, count]) => ({ date: date.slice(5), count })
    );

    const channelMap = new Map<string, number>();
    for (const s of signals) {
      const ch = (s.source && s.source.trim()) || "未标注";
      channelMap.set(ch, (channelMap.get(ch) ?? 0) + 1);
    }
    const channels: ChannelPoint[] = Array.from(channelMap.entries())
      .map(([channel, count]) => ({ channel, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const typeMap = new Map<string, number>();
    for (const s of signals) {
      const key = s.signal_type || "unknown";
      typeMap.set(key, (typeMap.get(key) ?? 0) + 1);
    }
    const types: TypePoint[] = Array.from(typeMap.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // 信号可信度漏斗：严格递减（high ⊂ medium∪high ⊂ 全部）
    const high = signals.filter(
      (s) => s.suggested_confidence === "high"
    ).length;
    const mediumPlus = signals.filter(
      (s) =>
        s.suggested_confidence === "high" ||
        s.suggested_confidence === "medium"
    ).length;
    const funnel: FunnelPoint[] = [
      { stage: "全部信号", value: signals.length },
      { stage: "中/高可信", value: mediumPlus },
      { stage: "高可信", value: high },
    ];

    return {
      timeline,
      channels,
      types,
      funnel,
      totalSignals: signals.length,
      totalConversions: conversions.length,
    };
  }, [signals, conversions]);

  return { data, loading };
}