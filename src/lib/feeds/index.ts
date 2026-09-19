import { fetchGithub } from "./sources/github";
import { fetchRss } from "./sources/rss";
import { insertFeed, listFeeds, type FeedItem } from "@/lib/db";
import { translateBatch } from "./translate";
import type { Fetcher } from "./types";
import type { AiSettings } from "@/lib/types";

export type { FeedItem } from "@/lib/db";
export { extractKeywords, addManualKeyword, removeKeyword, clearKeywords } from "./keywords";

const FETCHERS: Fetcher[] = [
  { id: "github", run: fetchGithub },
  { id: "rss", run: fetchRss },
];

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    p,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

export async function refreshFeeds(
  projectId: string,
  keywords: string[],
  aiSettings?: AiSettings
): Promise<number> {
  if (keywords.length === 0) return 0;

  let total = 0;

  const results = await Promise.all(
    FETCHERS.map(async (f) => {
      try {
        const items = await withTimeout(f.run(keywords), 20000);
        return { id: f.id, items: items ?? [] };
      } catch (e) {
        console.warn(`[feeds] ${f.id} failed`, e);
        return { id: f.id, items: [] };
      }
    })
  );

  const allSummaries: { key: string; text: string }[] = [];
  for (const { id, items } of results) {
    for (const item of items) {
      if (item.summary) {
        allSummaries.push({ key: `${id}::${item.id}`, text: item.summary });
      }
    }
  }

  const translatedMap = new Map<string, string>();
  if (aiSettings?.api_key && allSummaries.length > 0) {
    const texts = allSummaries.map((s) => s.text);
    const translated = await translateBatch(texts, aiSettings);
    for (let i = 0; i < allSummaries.length; i++) {
      translatedMap.set(allSummaries[i].key, translated[i]);
    }
  }

  for (const { id, items } of results) {
    for (const item of items) {
      const key = `${id}::${item.id}`;
      const summary = translatedMap.get(key) ?? item.summary;

      await insertFeed({
        // 关键修复：加项目前缀，避免跨项目主键冲突
        id: `${projectId}__${item.id}`,
        source: id,
        title: item.title,
        url: item.url,
        summary,
        score: item.score ?? 0,
        project_id: projectId,
      });
      total++;
    }
  }

  return total;
}

export async function getRecentFeeds(
  projectId: string | null,
  limit = 20
): Promise<FeedItem[]> {
  return listFeeds(projectId, limit);
}