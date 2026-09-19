import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import type { RawFeedItem } from "../types";
import { listRssSources } from "@/lib/db";
import { parseRssXml } from "./rssParser";

export async function fetchRss(keywords: string[]): Promise<RawFeedItem[]> {
  const sources = await listRssSources();
  const enabled = sources.filter((s) => s.enabled);

  const all: RawFeedItem[] = [];
  for (const s of enabled) {
    try {
      const res = await tauriFetch(s.url, {
        headers: { "User-Agent": "ShipSignal/1.2" },
        danger: {
          acceptInvalidCerts: true,
          acceptInvalidHostnames: true,
        },
      });
      if (!res.ok) continue;
      const xml = await res.text();
      const prefix = `rss_${s.id.slice(0, 6)}`;
      const items = parseRssXml(xml, keywords, prefix);
      all.push(...items);
    } catch {
      // 一个源挂了不影响其他
    }
  }
  return all;
}