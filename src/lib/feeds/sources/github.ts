import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import type { RawFeedItem } from "../types";

function dateNDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

async function fetchWithTimeout(url: string, ms: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await tauriFetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "ShipSignal/1.2",
      },
      danger: {
        acceptInvalidCerts: true,
        acceptInvalidHostnames: true,
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchGithub(keywords: string[]): Promise<RawFeedItem[]> {
  const items: RawFeedItem[] = [];
  const seen = new Set<string>();
  const since = dateNDaysAgo(365);

  console.log("[github] start, keywords =", keywords);

  for (const kw of keywords.slice(0, 3)) {
    // 随机页码，每次刷新拿不同的结果
    const page = 1 + Math.floor(Math.random() * 3);
    const q = encodeURIComponent(`${kw} pushed:>${since}`);
    const url = `https://api.github.com/search/repositories?q=${q}&sort=stars&order=desc&per_page=10&page=${page}`;
    console.log("[github] request:", url);

    try {
      const res = await fetchWithTimeout(url, 8000);
      console.log("[github] status:", res.status, "for", kw);

      if (!res.ok) {
        const text = await res.text();
        console.warn(`[github] "${kw}" → ${res.status}:`, text.slice(0, 200));
        continue;
      }

      const data = await res.json();
      const count = data?.items?.length ?? 0;
      console.log(`[github] "${kw}" → ${count} items`);

      for (const r of data?.items ?? []) {
        if (seen.has(String(r.id))) continue;
        seen.add(String(r.id));

        // 拼装富信息：描述 · star 数 · 语言 · topics
        const parts: string[] = [];
        if (r.description) parts.push(String(r.description));
        if (typeof r.stargazers_count === "number") {
          parts.push(`⭐ ${r.stargazers_count}`);
        }
        if (r.language) parts.push(String(r.language));
        const topics: string[] = Array.isArray(r.topics) ? r.topics : [];
        if (topics.length > 0) {
          parts.push(topics.slice(0, 3).join(" / "));
        }

        items.push({
          id: `gh_${r.id}`,
          title: r.full_name,
          url: r.html_url,
          summary: parts.join(" · ").slice(0, 220),
          score: 3 + Math.min(Math.log10((r.stargazers_count ?? 0) + 1), 4),
        });
      }
    } catch (e: any) {
      console.error(`[github] "${kw}" threw:`, e?.message ?? e);
    }
  }

  console.log("[github] total items:", items.length);
  return items;
}