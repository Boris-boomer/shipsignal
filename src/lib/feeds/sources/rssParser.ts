import type { RawFeedItem } from "../types";

export function parseRssXml(
  xml: string,
  keywords: string[],
  prefix: string
): RawFeedItem[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "text/xml");
  const nodes = doc.querySelectorAll("item, entry");
  const lower = keywords.map((k) => k.toLowerCase()).filter((k) => k.length >= 2);
  const items: RawFeedItem[] = [];

  nodes.forEach((node, i) => {
    const title = node.querySelector("title")?.textContent?.trim() ?? "";
    const link =
      node.querySelector("link")?.textContent?.trim() ??
      node.querySelector("link")?.getAttribute("href") ??
      "";
    const desc =
      node.querySelector("description")?.textContent?.trim() ??
      node.querySelector("summary")?.textContent?.trim() ??
      "";
    const guid =
      node.querySelector("guid")?.textContent?.trim() ??
      node.querySelector("id")?.textContent?.trim() ??
      link ??
      `${prefix}_${i}`;

    if (!title || !link) return;

    const text = `${title} ${desc}`.toLowerCase();
    let score = 0;
    for (const kw of lower) {
      if (text.includes(kw)) score += 3;
    }
    if (score === 0) return;

    items.push({
      id: `${prefix}_${hash(guid)}`,
      title,
      url: link,
      summary: desc.replace(/<[^>]+>/g, "").slice(0, 120),
      score,
    });
  });

  return items;
}

function hash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36);
}