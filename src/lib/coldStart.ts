import type { ColdStartAttempt, ColdStartMood } from "./types";
import { getDb } from "./db";
import { nowIso, uuid } from "./utils";

/* ---------------- 读 ---------------- */

export async function listAttempts(
  projectId: string
): Promise<ColdStartAttempt[]> {
  const db = await getDb();
  return db.select<ColdStartAttempt[]>(
    "SELECT * FROM cold_start_attempts WHERE project_id = $1 ORDER BY created_at DESC",
    [projectId]
  );
}

export async function countAttempts(projectId: string): Promise<number> {
  const db = await getDb();
  const rows = await db.select<{ cnt: number }[]>(
    "SELECT COUNT(*) as cnt FROM cold_start_attempts WHERE project_id = $1",
    [projectId]
  );
  return rows[0]?.cnt ?? 0;
}

export async function getLastAttempt(
  projectId: string
): Promise<ColdStartAttempt | null> {
  const db = await getDb();
  const rows = await db.select<ColdStartAttempt[]>(
    "SELECT * FROM cold_start_attempts WHERE project_id = $1 ORDER BY created_at DESC LIMIT 1",
    [projectId]
  );
  return rows[0] ?? null;
}

/* ---------------- 写 ---------------- */

export async function createAttempt(input: {
  project_id: string;
  track?: string | null;
  pain?: string | null;
  action?: string | null;
  draft?: string | null;
}): Promise<ColdStartAttempt> {
  const db = await getDb();
  const id = uuid();
  const now = nowIso();
  const row: ColdStartAttempt = {
    id,
    project_id: input.project_id,
    track: input.track ?? null,
    pain: input.pain ?? null,
    action: input.action ?? null,
    draft: input.draft ?? null,
    mood: null,
    published: 0,
    created_at: now,
  };
  await db.execute(
    `INSERT INTO cold_start_attempts
      (id, project_id, track, pain, action, draft, mood, published, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [
      row.id,
      row.project_id,
      row.track,
      row.pain,
      row.action,
      row.draft,
      row.mood,
      row.published,
      row.created_at,
    ]
  );
  return row;
}

export async function updateAttemptDraft(
  id: string,
  draft: string
): Promise<void> {
  const db = await getDb();
  await db.execute(
    "UPDATE cold_start_attempts SET draft=$1 WHERE id=$2",
    [draft, id]
  );
}

export async function markPublished(id: string): Promise<void> {
  const db = await getDb();
  await db.execute(
    "UPDATE cold_start_attempts SET published=1 WHERE id=$1",
    [id]
  );
}

export async function setAttemptMood(
  id: string,
  mood: ColdStartMood
): Promise<void> {
  const db = await getDb();
  await db.execute(
    "UPDATE cold_start_attempts SET mood=$1 WHERE id=$2",
    [mood, id]
  );
}

/* ---------------- 赛道存到 mode_data ---------------- */

export async function getTrack(
  projectId: string,
  modeData: string
): Promise<string | null> {
  try {
    const md = JSON.parse(modeData || "{}");
    return md.coldStartTrack ?? null;
  } catch {
    return null;
  }
}