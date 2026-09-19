import {
  listSignals,
  listFeedKeywords,
  upsertFeedKeyword,
  deleteFeedKeyword,
  getProject,
} from "@/lib/db";

const STOP_WORDS = new Set([
  "the", "and", "for", "with", "from", "this", "that", "are", "was", "were",
  "has", "have", "had", "will", "would", "can", "could", "should", "may",
  "note", "value", "data", "type", "user", "source", "info", "test", "new",
]);

function extractEnglish(text: string): string[] {
  const words = text.match(/[A-Za-z][A-Za-z0-9_\-]{2,19}/g) ?? [];
  return words.filter((w) => !STOP_WORDS.has(w.toLowerCase()));
}

export async function extractKeywords(projectId: string): Promise<string[]> {
  const manual = await listFeedKeywords(projectId);
  const manualWords = manual
    .filter((k) => k.keyword.length >= 2)
    .map((k) => k.keyword);

  const project = await getProject(projectId);
  const fromProject: string[] = [];
  if (project) {
    fromProject.push(...extractEnglish(project.name));
    if (project.description) {
      fromProject.push(...extractEnglish(project.description));
    }
  }

  const signals = await listSignals(projectId);
  const counter = new Map<string, number>();
  for (const s of signals) {
    let dataText = s.data;
    try {
      const d = JSON.parse(s.data || "{}");
      dataText = [d.note, d.description, d.text].filter(Boolean).join(" ");
    } catch {
      // keep raw
    }
    for (const w of extractEnglish(dataText)) {
      counter.set(w, (counter.get(w) ?? 0) + 1);
    }
  }
  const fromSignals = [...counter.entries()]
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([w]) => w);

  const merged = [
    ...new Set([...manualWords, ...fromProject, ...fromSignals]),
  ];

  return merged.slice(0, 12);
}

export async function addManualKeyword(
  projectId: string,
  keyword: string
): Promise<void> {
  await upsertFeedKeyword(projectId, keyword, 2);
}

export async function removeKeyword(
  projectId: string,
  keyword: string
): Promise<void> {
  await deleteFeedKeyword(projectId, keyword);
}

export async function clearKeywords(projectId: string): Promise<void> {
  const list = await listFeedKeywords(projectId);
  for (const item of list) {
    await deleteFeedKeyword(projectId, item.keyword);
  }
}