// 免费热搜 API —— uapis.cn，完全免费无需注册
// 仅用于展示"该赛道本周热词"，给用户可靠感和方向感
//
// 成本控制：用户手动触发才调用，不点不花钱
// 缓存绕过：加时间戳参数，避免 CDN 返回旧数据

const BASE_URL = "https://uapis.cn/api/v1/misc/hotboard";

export interface HotItem {
  index: number;
  title: string;
  url: string;
  hot_value: string;
}

export interface HotboardResult {
  type: string;
  update_time: string;
  list: HotItem[];
}

/** 平台映射：赛道 → 对应热搜平台 */
const TRACK_PLATFORM: Record<string, string> = {
  efficiency: "douyin",
  ai_tool: "douyin",
  dev_tool: "bilibili",
  content: "xiaohongshu",
  learning: "zhihu",
  lifestyle: "xiaohongshu",
  monetization: "douyin",
  other: "douyin",
};

async function fetchWithTimeout(
  url: string,
  timeoutMs = 5000
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchHotboard(
  platform: string
): Promise<HotboardResult | null> {
  try {
    // 加时间戳绕过 CDN 缓存
    const url = `${BASE_URL}?type=${platform}&_t=${Date.now()}`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) {
      console.warn("[hotboard] HTTP", res.status);
      return null;
    }
    const data = (await res.json()) as HotboardResult;
    console.log("[hotboard] fetched", platform, data.list?.length ?? 0, "items");
    return data;
  } catch (e) {
    console.warn("[hotboard] fetch failed", e);
    return null;
  }
}

export async function fetchTrackHotboard(
  track: string | null
): Promise<HotItem[]> {
  const platform = track ? TRACK_PLATFORM[track] ?? "douyin" : "douyin";
  const data = await fetchHotboard(platform);
  if (!data?.list) return [];
  // 打乱顺序，避免每次看起来一样
  const shuffled = [...data.list].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 5);
}