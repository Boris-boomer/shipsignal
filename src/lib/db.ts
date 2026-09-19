import Database from "@tauri-apps/plugin-sql";
import type {
  Project,
  ProjectCreateInput,
  ProjectStats,
  Signal,
  SignalInput,
  Conversion,
  Lesson,
  DecisionLog,
  LessonType,
  Confidence,
  DecisionOutcome,
  AiInteraction,
  DataSource,
  DataSourceProvider,
  DataSourceStatus,
  BackupData,
  SignalPattern,
  ActionCard,
  ActionCardStatus,
} from "./types";
import { assessSignal } from "./credibility";
import { nowIso, uuid } from "./utils";

let dbPromise: Promise<Database> | null = null;

export function getDb(): Promise<Database> {
  if (!dbPromise) {
    const t0 = performance.now();
    console.log("[db] opening sqlite:shipssignal.db …");
    dbPromise = Database.load("sqlite:shipssignal.db").then(
      (db) => {
        console.log(
          `[db] opened in ${(performance.now() - t0).toFixed(0)}ms`
        );
        return db;
      },
      (err) => {
        console.error(
          `[db] open FAILED after ${(performance.now() - t0).toFixed(0)}ms`,
          err
        );
        dbPromise = null;
        throw err;
      }
    );
  }
  return dbPromise;
}

/* ---------------- Projects ---------------- */

export async function listProjects(): Promise<Project[]> {
  const db = await getDb();
  const t0 = performance.now();
  const rows = await db.select<Project[]>(
    "SELECT * FROM projects ORDER BY updated_at DESC"
  );
  console.log(
    `[db] listProjects → ${rows.length} rows in ${(performance.now() - t0).toFixed(0)}ms`
  );
  return rows;
}

export async function getProject(id: string): Promise<Project | null> {
  const db = await getDb();
  const rows = await db.select<Project[]>(
    "SELECT * FROM projects WHERE id = $1 LIMIT 1",
    [id]
  );
  return rows[0] ?? null;
}

export async function createProject(
  input: ProjectCreateInput
): Promise<Project> {
  const db = await getDb();
  const id = uuid();
  const now = nowIso();
  const project: Project = {
    id,
    mode: input.mode,
    entry: input.entry ?? null,
    name: input.name,
    description: input.description ?? null,
    status: input.status ?? "planning",
    project_type: input.project_type ?? null,
    completion_criteria: input.completion_criteria ?? null,
    archive_reason: null,
    sunset_conditions: input.sunset_conditions ?? null,
    build_hours: 0,
    distribution_hours: 0,
    mode_data: JSON.stringify(input.mode_data ?? {}),
    created_at: now,
    updated_at: now,
  };
  await db.execute(
    `INSERT INTO projects
      (id, mode, entry, name, description, status, project_type,
       completion_criteria, archive_reason, sunset_conditions,
       build_hours, distribution_hours, mode_data, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
    [
      project.id,
      project.mode,
      project.entry,
      project.name,
      project.description,
      project.status,
      project.project_type,
      project.completion_criteria,
      project.archive_reason,
      project.sunset_conditions,
      project.build_hours,
      project.distribution_hours,
      project.mode_data,
      project.created_at,
      project.updated_at,
    ]
  );
  return project;
}

export async function updateProject(
  id: string,
  patch: Partial<Project>
): Promise<void> {
  const db = await getDb();
  const current = await getProject(id);
  if (!current) throw new Error(`Project not found: ${id}`);
  const next: Project = { ...current, ...patch, updated_at: nowIso() };
  await db.execute(
    `UPDATE projects SET
      mode=$1, entry=$2, name=$3, description=$4, status=$5,
      project_type=$6, completion_criteria=$7, archive_reason=$8,
      sunset_conditions=$9, build_hours=$10, distribution_hours=$11,
      mode_data=$12, updated_at=$13
     WHERE id=$14`,
    [
      next.mode,
      next.entry,
      next.name,
      next.description,
      next.status,
      next.project_type,
      next.completion_criteria,
      next.archive_reason,
      next.sunset_conditions,
      next.build_hours,
      next.distribution_hours,
      next.mode_data,
      next.updated_at,
      next.id,
    ]
  );
}

export async function deleteProject(id: string): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM signals WHERE project_id = $1", [id]);
  await db.execute("DELETE FROM conversions WHERE project_id = $1", [id]);
  await db.execute("DELETE FROM lessons WHERE project_id = $1", [id]);
  await db.execute("DELETE FROM decision_logs WHERE project_id = $1", [id]);
  await db.execute(
    "UPDATE ai_interactions SET project_id = NULL WHERE project_id = $1",
    [id]
  );
  await db.execute("DELETE FROM action_cards WHERE project_id = $1", [id]);
  await db.execute("DELETE FROM signal_patterns WHERE project_id = $1", [id]);
  await db.execute("DELETE FROM feed_keywords WHERE project_id = $1", [id]);
  await db.execute("DELETE FROM feeds WHERE project_id = $1", [id]);
  await db.execute("DELETE FROM projects WHERE id = $1", [id]);
}

export async function listProjectStats(): Promise<ProjectStats[]> {
  const db = await getDb();
  const signalRows = await db.select<
    { project_id: string; cnt: number }[]
  >("SELECT project_id, COUNT(*) as cnt FROM signals GROUP BY project_id");
  const lessonRows = await db.select<
    { project_id: string; cnt: number }[]
  >("SELECT project_id, COUNT(*) as cnt FROM lessons GROUP BY project_id");

  const map = new Map<string, ProjectStats>();
  for (const r of signalRows) {
    map.set(r.project_id, {
      project_id: r.project_id,
      signals: r.cnt,
      lessons: 0,
    });
  }
  for (const r of lessonRows) {
    const existing = map.get(r.project_id);
    if (existing) {
      existing.lessons = r.cnt;
    } else {
      map.set(r.project_id, {
        project_id: r.project_id,
        signals: 0,
        lessons: r.cnt,
      });
    }
  }
  return Array.from(map.values());
}

/* ---------------- Signals ---------------- */

export async function listSignals(projectId: string): Promise<Signal[]> {
  const db = await getDb();
  return db.select<Signal[]>(
    "SELECT * FROM signals WHERE project_id = $1 ORDER BY created_at DESC",
    [projectId]
  );
}

export async function createSignal(input: SignalInput): Promise<Signal> {
  const db = await getDb();
  const assessment = assessSignal({
    sourceVerifiability: input.source_verifiability ?? "medium",
    paymentSignalPresent: input.payment_signal_present ?? false,
    anomalyFlags: input.anomaly_flags ?? [],
    timeSeries: input.time_series,
  });
  const id = uuid();
  const now = nowIso();
  const row: Signal = {
    id,
    project_id: input.project_id,
    signal_type: input.signal_type,
    data: JSON.stringify(input.data ?? {}),
    source: input.source ?? null,
    source_verifiability: input.source_verifiability ?? "medium",
    anomaly_flags: JSON.stringify(assessment.anomaly_flags),
    suggested_confidence: assessment.suggested_confidence,
    developer_confidence: null,
    override_reason: null,
    decision_impact: null,
    created_at: now,
  };
  await db.execute(
    `INSERT INTO signals
      (id, project_id, signal_type, data, source, source_verifiability,
       anomaly_flags, suggested_confidence, developer_confidence,
       override_reason, decision_impact, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    [
      row.id,
      row.project_id,
      row.signal_type,
      row.data,
      row.source,
      row.source_verifiability,
      row.anomaly_flags,
      row.suggested_confidence,
      row.developer_confidence,
      row.override_reason,
      row.decision_impact,
      row.created_at,
    ]
  );
  return row;
}

export async function updateSignal(
  id: string,
  input: SignalInput
): Promise<void> {
  const db = await getDb();
  const assessment = assessSignal({
    sourceVerifiability: input.source_verifiability ?? "medium",
    paymentSignalPresent: input.payment_signal_present ?? false,
    anomalyFlags: input.anomaly_flags ?? [],
    timeSeries: input.time_series,
  });
  await db.execute(
    `UPDATE signals SET
       signal_type=$1, data=$2, source=$3, source_verifiability=$4,
       anomaly_flags=$5, suggested_confidence=$6
     WHERE id=$7`,
    [
      input.signal_type,
      JSON.stringify(input.data ?? {}),
      input.source ?? null,
      input.source_verifiability ?? "medium",
      JSON.stringify(assessment.anomaly_flags),
      assessment.suggested_confidence,
      id,
    ]
  );
}

export async function deleteSignal(id: string): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM signals WHERE id = $1", [id]);
}

export async function overrideSignalConfidence(
  id: string,
  developerConfidence: Confidence | "ignored",
  reason: string,
  decisionImpact: string
): Promise<void> {
  const db = await getDb();
  await db.execute(
    `UPDATE signals SET developer_confidence=$1, override_reason=$2, decision_impact=$3
     WHERE id=$4`,
    [developerConfidence, reason, decisionImpact, id]
  );
}

/* ---------------- Conversions ---------------- */

export async function listConversions(
  projectId: string
): Promise<Conversion[]> {
  const db = await getDb();
  return db.select<Conversion[]>(
    "SELECT * FROM conversions WHERE project_id = $1 ORDER BY created_at DESC",
    [projectId]
  );
}

export async function createConversion(
  conv: Omit<Conversion, "id" | "created_at">
): Promise<Conversion> {
  const db = await getDb();
  const id = uuid();
  const now = nowIso();
  const row: Conversion = { ...conv, id, created_at: now };
  await db.execute(
    `INSERT INTO conversions
      (id, project_id, user_segment, monetization_form, amount, currency, recurring, notes, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [
      row.id,
      row.project_id,
      row.user_segment,
      row.monetization_form,
      row.amount,
      row.currency,
      row.recurring,
      row.notes,
      row.created_at,
    ]
  );
  return row;
}

export async function updateConversion(
  id: string,
  input: {
    user_segment: string | null;
    monetization_form: string | null;
    amount: number | null;
    currency: string;
    recurring: number;
    notes: string | null;
  }
): Promise<void> {
  const db = await getDb();
  await db.execute(
    `UPDATE conversions SET
       user_segment=$1, monetization_form=$2, amount=$3,
       currency=$4, recurring=$5, notes=$6
     WHERE id=$7`,
    [
      input.user_segment,
      input.monetization_form,
      input.amount,
      input.currency,
      input.recurring,
      input.notes,
      id,
    ]
  );
}

export async function deleteConversion(id: string): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM conversions WHERE id = $1", [id]);
}

/* ---------------- Lessons ---------------- */

export async function listLessons(projectId: string): Promise<Lesson[]> {
  const db = await getDb();
  return db.select<Lesson[]>(
    "SELECT * FROM lessons WHERE project_id = $1 ORDER BY created_at DESC",
    [projectId]
  );
}

export async function createLesson(input: {
  project_id: string;
  lesson_type: LessonType;
  description: string;
  applicable_to?: string[];
}): Promise<Lesson> {
  const db = await getDb();
  const id = uuid();
  const now = nowIso();
  const row: Lesson = {
    id,
    project_id: input.project_id,
    lesson_type: input.lesson_type,
    description: input.description,
    applicable_to: JSON.stringify(input.applicable_to ?? []),
    created_at: now,
  };
  await db.execute(
    `INSERT INTO lessons
      (id, project_id, lesson_type, description, applicable_to, created_at)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [
      row.id,
      row.project_id,
      row.lesson_type,
      row.description,
      row.applicable_to,
      row.created_at,
    ]
  );
  return row;
}

export async function updateLesson(
  id: string,
  input: {
    lesson_type: LessonType;
    description: string;
    applicable_to?: string[];
  }
): Promise<void> {
  const db = await getDb();
  await db.execute(
    `UPDATE lessons SET
       lesson_type=$1, description=$2, applicable_to=$3
     WHERE id=$4`,
    [
      input.lesson_type,
      input.description,
      JSON.stringify(input.applicable_to ?? []),
      id,
    ]
  );
}

export async function deleteLesson(id: string): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM lessons WHERE id = $1", [id]);
}

/* ---------------- Decision Logs ---------------- */

export async function listDecisions(
  projectId: string
): Promise<DecisionLog[]> {
  const db = await getDb();
  return db.select<DecisionLog[]>(
    "SELECT * FROM decision_logs WHERE project_id = $1 ORDER BY created_at DESC",
    [projectId]
  );
}

export async function createDecision(input: {
  project_id: string;
  signal_id?: string | null;
  decision: string;
  basis?: string | null;
  confidence?: Confidence | null;
}): Promise<DecisionLog> {
  const db = await getDb();
  const id = uuid();
  const now = nowIso();
  const row: DecisionLog = {
    id,
    project_id: input.project_id,
    signal_id: input.signal_id ?? null,
    decision: input.decision,
    basis: input.basis ?? null,
    confidence: input.confidence ?? null,
    outcome: "pending",
    created_at: now,
    reviewed_at: null,
  };
  await db.execute(
    `INSERT INTO decision_logs
      (id, project_id, signal_id, decision, basis, confidence, outcome, created_at, reviewed_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [
      row.id,
      row.project_id,
      row.signal_id,
      row.decision,
      row.basis,
      row.confidence,
      row.outcome,
      row.created_at,
      row.reviewed_at,
    ]
  );
  return row;
}

export async function updateDecision(
  id: string,
  input: {
    decision: string;
    basis?: string | null;
    confidence?: Confidence | null;
  }
): Promise<void> {
  const db = await getDb();
  await db.execute(
    `UPDATE decision_logs SET decision=$1, basis=$2, confidence=$3
     WHERE id=$4`,
    [input.decision, input.basis ?? null, input.confidence ?? null, id]
  );
}

export async function deleteDecision(id: string): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM decision_logs WHERE id = $1", [id]);
}

export async function reviewDecision(
  id: string,
  outcome: DecisionOutcome
): Promise<void> {
  const db = await getDb();
  await db.execute(
    "UPDATE decision_logs SET outcome=$1, reviewed_at=$2 WHERE id=$3",
    [outcome, nowIso(), id]
  );
}

/* ---------------- Settings ---------------- */

export async function getSetting(key: string): Promise<string | null> {
  const db = await getDb();
  const rows = await db.select<{ value: string }[]>(
    "SELECT value FROM settings WHERE key = $1 LIMIT 1",
    [key]
  );
  return rows[0]?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDb();
  await db.execute(
    `INSERT INTO settings (key, value) VALUES ($1, $2)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [key, value]
  );
}

/* ---------------- AI Interactions ---------------- */

export async function createAiInteraction(input: {
  project_id?: string | null;
  purpose?: string | null;
  prompt?: string | null;
  response?: string | null;
  model?: string | null;
}): Promise<AiInteraction> {
  const db = await getDb();
  const id = uuid();
  const now = nowIso();
  const row: AiInteraction = {
    id,
    project_id: input.project_id ?? null,
    purpose: input.purpose ?? null,
    prompt: input.prompt ?? null,
    response: input.response ?? null,
    model: input.model ?? null,
    created_at: now,
  };
  await db.execute(
    `INSERT INTO ai_interactions
      (id, project_id, purpose, prompt, response, model, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [
      row.id,
      row.project_id,
      row.purpose,
      row.prompt,
      row.response,
      row.model,
      row.created_at,
    ]
  );
  return row;
}

export async function listAiInteractions(
  projectId?: string | null
): Promise<AiInteraction[]> {
  const db = await getDb();
  if (projectId) {
    return db.select<AiInteraction[]>(
      "SELECT * FROM ai_interactions WHERE project_id = $1 ORDER BY created_at DESC",
      [projectId]
    );
  }
  return db.select<AiInteraction[]>(
    "SELECT * FROM ai_interactions ORDER BY created_at DESC LIMIT 200"
  );
}

export async function deleteAiInteraction(id: string): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM ai_interactions WHERE id = $1", [id]);
}

/* ---------------- Data Sources ---------------- */

export async function listDataSources(): Promise<DataSource[]> {
  const db = await getDb();
  return db.select<DataSource[]>(
    "SELECT * FROM data_sources ORDER BY updated_at DESC"
  );
}

export async function getDataSource(id: string): Promise<DataSource | null> {
  const db = await getDb();
  const rows = await db.select<DataSource[]>(
    "SELECT * FROM data_sources WHERE id = $1 LIMIT 1",
    [id]
  );
  return rows[0] ?? null;
}

export async function getDataSourceByProvider(
  provider: DataSourceProvider
): Promise<DataSource | null> {
  const db = await getDb();
  const rows = await db.select<DataSource[]>(
    "SELECT * FROM data_sources WHERE provider = $1 LIMIT 1",
    [provider]
  );
  return rows[0] ?? null;
}

export async function upsertDataSource(ds: DataSource): Promise<void> {
  const db = await getDb();
  await db.execute(
    `INSERT INTO data_sources
      (id, provider, label, client_id, client_secret, access_token, refresh_token,
       token_expires_at, scopes, user_openid, user_name, user_avatar, status,
       last_sync_at, last_error, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
     ON CONFLICT(id) DO UPDATE SET
       provider=excluded.provider,
       label=excluded.label,
       client_id=excluded.client_id,
       client_secret=excluded.client_secret,
       access_token=excluded.access_token,
       refresh_token=excluded.refresh_token,
       token_expires_at=excluded.token_expires_at,
       scopes=excluded.scopes,
       user_openid=excluded.user_openid,
       user_name=excluded.user_name,
       user_avatar=excluded.user_avatar,
       status=excluded.status,
       last_sync_at=excluded.last_sync_at,
       last_error=excluded.last_error,
       updated_at=excluded.updated_at`,
    [
      ds.id,
      ds.provider,
      ds.label,
      ds.client_id,
      ds.client_secret,
      ds.access_token,
      ds.refresh_token,
      ds.token_expires_at,
      ds.scopes,
      ds.user_openid,
      ds.user_name,
      ds.user_avatar,
      ds.status,
      ds.last_sync_at,
      ds.last_error,
      ds.created_at,
      ds.updated_at,
    ]
  );
}

export async function deleteDataSource(id: string): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM data_sources WHERE id = $1", [id]);
}

export async function updateDataSourceStatus(
  id: string,
  status: DataSourceStatus,
  lastError: string | null = null
): Promise<void> {
  const db = await getDb();
  await db.execute(
    "UPDATE data_sources SET status=$1, last_error=$2, updated_at=$3 WHERE id=$4",
    [status, lastError, nowIso(), id]
  );
}

export async function markDataSourceSynced(id: string): Promise<void> {
  const db = await getDb();
  const now = nowIso();
  await db.execute(
    "UPDATE data_sources SET last_sync_at=$1, updated_at=$2 WHERE id=$3",
    [now, now, id]
  );
}

/* ---------------- Backup ---------------- */

export async function dumpAllData(): Promise<BackupData> {
  const db = await getDb();

  const projects = await db.select<Project[]>(
    "SELECT * FROM projects ORDER BY created_at ASC"
  );
  const signals = await db.select<Signal[]>(
    "SELECT * FROM signals ORDER BY created_at ASC"
  );
  const conversions = await db.select<Conversion[]>(
    "SELECT * FROM conversions ORDER BY created_at ASC"
  );
  const lessons = await db.select<Lesson[]>(
    "SELECT * FROM lessons ORDER BY created_at ASC"
  );
  const decision_logs = await db.select<DecisionLog[]>(
    "SELECT * FROM decision_logs ORDER BY created_at ASC"
  );

  return {
    version: 1,
    exported_at: nowIso(),
    app_version: "1.2.0",
    projects,
    signals,
    conversions,
    lessons,
    decision_logs,
  };
}

export async function restoreAllData(data: BackupData): Promise<void> {
  const db = await getDb();

  await db.execute("DELETE FROM action_cards");
  await db.execute("DELETE FROM signal_patterns");
  await db.execute("DELETE FROM cold_start_attempts");
  await db.execute("DELETE FROM feed_keywords");
  await db.execute("DELETE FROM feeds");

  await db.execute("UPDATE ai_interactions SET project_id = NULL");

  await db.execute("DELETE FROM decision_logs");
  await db.execute("DELETE FROM lessons");
  await db.execute("DELETE FROM conversions");
  await db.execute("DELETE FROM signals");
  await db.execute("DELETE FROM projects");

  for (const p of data.projects) {
    await db.execute(
      `INSERT INTO projects
        (id, mode, entry, name, description, status, project_type,
         completion_criteria, archive_reason, sunset_conditions,
         build_hours, distribution_hours, mode_data, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
      [
        p.id,
        p.mode,
        p.entry,
        p.name,
        p.description,
        p.status,
        p.project_type,
        p.completion_criteria,
        p.archive_reason,
        p.sunset_conditions,
        p.build_hours,
        p.distribution_hours,
        p.mode_data,
        p.created_at,
        p.updated_at,
      ]
    );
  }

  for (const s of data.signals) {
    await db.execute(
      `INSERT INTO signals
        (id, project_id, signal_type, data, source, source_verifiability,
         anomaly_flags, suggested_confidence, developer_confidence,
         override_reason, decision_impact, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [
        s.id,
        s.project_id,
        s.signal_type,
        s.data,
        s.source,
        s.source_verifiability,
        s.anomaly_flags,
        s.suggested_confidence,
        s.developer_confidence,
        s.override_reason,
        s.decision_impact,
        s.created_at,
      ]
    );
  }

  for (const c of data.conversions) {
    await db.execute(
      `INSERT INTO conversions
        (id, project_id, user_segment, monetization_form, amount, currency, recurring, notes, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        c.id,
        c.project_id,
        c.user_segment,
        c.monetization_form,
        c.amount,
        c.currency,
        c.recurring,
        c.notes,
        c.created_at,
      ]
    );
  }

  for (const l of data.lessons) {
    await db.execute(
      `INSERT INTO lessons
        (id, project_id, lesson_type, description, applicable_to, created_at)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [
        l.id,
        l.project_id,
        l.lesson_type,
        l.description,
        l.applicable_to,
        l.created_at,
      ]
    );
  }

  for (const d of data.decision_logs) {
    await db.execute(
      `INSERT INTO decision_logs
        (id, project_id, signal_id, decision, basis, confidence, outcome, created_at, reviewed_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        d.id,
        d.project_id,
        d.signal_id,
        d.decision,
        d.basis,
        d.confidence,
        d.outcome,
        d.created_at,
        d.reviewed_at,
      ]
    );
  }
}

/* ---------------- Harbor ---------------- */

export interface HarborStats {
  project_id: string;
  signals: number;
  conversions: number;
  lessons: number;
  decision_logs: number;
  income_by_currency: Record<string, number>;
}

export async function listHarborStats(): Promise<HarborStats[]> {
  const db = await getDb();

  const [signals, conversions, lessons, decisions, income] =
    await Promise.all([
      db.select<{ project_id: string; cnt: number }[]>(
        "SELECT project_id, COUNT(*) as cnt FROM signals GROUP BY project_id"
      ),
      db.select<{ project_id: string; cnt: number }[]>(
        "SELECT project_id, COUNT(*) as cnt FROM conversions GROUP BY project_id"
      ),
      db.select<{ project_id: string; cnt: number }[]>(
        "SELECT project_id, COUNT(*) as cnt FROM lessons GROUP BY project_id"
      ),
      db.select<{ project_id: string; cnt: number }[]>(
        "SELECT project_id, COUNT(*) as cnt FROM decision_logs GROUP BY project_id"
      ),
      db.select<
        { project_id: string; currency: string; total: number }[]
      >(
        "SELECT project_id, currency, SUM(amount) as total FROM conversions WHERE amount IS NOT NULL GROUP BY project_id, currency"
      ),
    ]);

  const map = new Map<string, HarborStats>();

  function ensure(pid: string): HarborStats {
    let s = map.get(pid);
    if (!s) {
      s = {
        project_id: pid,
        signals: 0,
        conversions: 0,
        lessons: 0,
        decision_logs: 0,
        income_by_currency: {},
      };
      map.set(pid, s);
    }
    return s;
  }

  for (const r of signals) ensure(r.project_id).signals = r.cnt;
  for (const r of conversions) ensure(r.project_id).conversions = r.cnt;
  for (const r of lessons) ensure(r.project_id).lessons = r.cnt;
  for (const r of decisions) ensure(r.project_id).decision_logs = r.cnt;
  for (const r of income) {
    ensure(r.project_id).income_by_currency[r.currency] = r.total;
  }

  return Array.from(map.values());
}

/* ---------------- Support / Feedback ---------------- */

export async function getSupportCount(): Promise<number> {
  const raw = await getSetting("support_count");
  if (!raw) return 0;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

export async function incrementSupportCount(): Promise<number> {
  const current = await getSupportCount();
  const next = current + 1;
  await setSetting("support_count", String(next));
  return next;
}

export async function hasSupported(): Promise<boolean> {
  const raw = await getSetting("has_supported");
  return raw === "true";
}

export async function markSupported(): Promise<void> {
  await setSetting("has_supported", "true");
}

/* ---------------- Global Search ---------------- */

export interface SearchHit {
  id: string;
  kind: "project" | "signal" | "lesson" | "decision" | "conversion";
  project_id: string;
  project_name: string;
  title: string;
  snippet: string;
  created_at: string;
}

export async function globalSearch(
  query: string,
  limit = 30
): Promise<SearchHit[]> {
  const q = query.trim();
  if (!q) return [];
  const db = await getDb();
  const like = `%${q}%`;

  const rows = await db.select<
    {
      id: string;
      kind: string;
      project_id: string;
      project_name: string;
      title: string;
      snippet: string;
      created_at: string;
    }[]
  >(
    `
    SELECT
      p.id AS id,
      'project' AS kind,
      p.id AS project_id,
      p.name AS project_name,
      p.name AS title,
      COALESCE(p.description, '') AS snippet,
      p.updated_at AS created_at
    FROM projects p
    WHERE p.name LIKE $1 OR p.description LIKE $1

    UNION ALL

    SELECT
      s.id,
      'signal' AS kind,
      s.project_id,
      p.name AS project_name,
      s.signal_type AS title,
      (COALESCE(s.source, '') || ' ' || COALESCE(s.data, '')) AS snippet,
      s.created_at
    FROM signals s
    JOIN projects p ON p.id = s.project_id
    WHERE s.signal_type LIKE $1
       OR s.source LIKE $1
       OR s.data LIKE $1

    UNION ALL

    SELECT
      l.id,
      'lesson' AS kind,
      l.project_id,
      p.name AS project_name,
      l.description AS title,
      '' AS snippet,
      l.created_at
    FROM lessons l
    JOIN projects p ON p.id = l.project_id
    WHERE l.description LIKE $1

    UNION ALL

    SELECT
      d.id,
      'decision' AS kind,
      d.project_id,
      p.name AS project_name,
      d.decision AS title,
      COALESCE(d.basis, '') AS snippet,
      d.created_at
    FROM decision_logs d
    JOIN projects p ON p.id = d.project_id
    WHERE d.decision LIKE $1 OR d.basis LIKE $1

    UNION ALL

    SELECT
      c.id,
      'conversion' AS kind,
      c.project_id,
      p.name AS project_name,
      (
        COALESCE(c.user_segment, '') ||
        CASE WHEN c.amount IS NOT NULL THEN
          ' ' || COALESCE(c.currency, '') || ' ' || CAST(c.amount AS TEXT)
        ELSE '' END
      ) AS title,
      COALESCE(c.notes, '') AS snippet,
      c.created_at
    FROM conversions c
    JOIN projects p ON p.id = c.project_id
    WHERE c.user_segment LIKE $1 OR c.notes LIKE $1

    ORDER BY created_at DESC
    LIMIT $2
    `,
    [like, limit]
  );

  return rows.map((r) => ({
    id: r.id,
    kind: r.kind as SearchHit["kind"],
    project_id: r.project_id,
    project_name: r.project_name,
    title: r.title || "—",
    snippet: r.snippet,
    created_at: r.created_at,
  }));
}

/* ---------------- Signal Patterns (v1.1) ---------------- */

export async function listSignalPatterns(
  projectId: string
): Promise<SignalPattern[]> {
  const db = await getDb();
  return db.select<SignalPattern[]>(
    "SELECT * FROM signal_patterns WHERE project_id = $1 ORDER BY computed_at DESC, pattern_type ASC",
    [projectId]
  );
}

export async function replaceSignalPatterns(
  projectId: string,
  rows: SignalPattern[]
): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM signal_patterns WHERE project_id = $1", [
    projectId,
  ]);
  for (const r of rows) {
    await db.execute(
      `INSERT INTO signal_patterns (id, project_id, pattern_type, payload, computed_at)
       VALUES ($1,$2,$3,$4,$5)`,
      [r.id, r.project_id, r.pattern_type, r.payload, r.computed_at]
    );
  }
}

/* ---------------- Action Cards (v1.1) ---------------- */

export async function listActionCards(
  projectId: string
): Promise<ActionCard[]> {
  const db = await getDb();
  return db.select<ActionCard[]>(
    "SELECT * FROM action_cards WHERE project_id = $1 ORDER BY created_at DESC",
    [projectId]
  );
}

export async function getActionCard(id: string): Promise<ActionCard | null> {
  const db = await getDb();
  const rows = await db.select<ActionCard[]>(
    "SELECT * FROM action_cards WHERE id = $1 LIMIT 1",
    [id]
  );
  return rows[0] ?? null;
}

export async function insertActionCard(input: {
  project_id: string;
  card_type: string;
  title: string;
  body?: string | null;
  draft?: string | null;
  source_signals?: string;
}): Promise<ActionCard> {
  const db = await getDb();
  const id = uuid();
  const now = nowIso();
  const row: ActionCard = {
    id,
    project_id: input.project_id,
    card_type: input.card_type,
    title: input.title,
    body: input.body ?? null,
    draft: input.draft ?? null,
    source_signals: input.source_signals ?? "[]",
    status: "pending",
    created_at: now,
    acted_at: null,
  };
  await db.execute(
    `INSERT INTO action_cards
      (id, project_id, card_type, title, body, draft, source_signals, status, created_at, acted_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [
      row.id,
      row.project_id,
      row.card_type,
      row.title,
      row.body,
      row.draft,
      row.source_signals,
      row.status,
      row.created_at,
      row.acted_at,
    ]
  );
  return row;
}

export async function updateActionCardStatus(
  id: string,
  status: ActionCardStatus,
  actedAt: string | null
): Promise<void> {
  const db = await getDb();
  await db.execute(
    "UPDATE action_cards SET status=$1, acted_at=$2 WHERE id=$3",
    [status, actedAt, id]
  );
}

export async function updateActionCardDraft(
  id: string,
  draft: string | null
): Promise<void> {
  const db = await getDb();
  await db.execute("UPDATE action_cards SET draft=$1 WHERE id=$2", [draft, id]);
}

/* ---------------- Dashboard Aggregation (v1.2) ---------------- */

export async function listAllSignals(): Promise<Signal[]> {
  const db = await getDb();
  return db.select<Signal[]>("SELECT * FROM signals ORDER BY created_at ASC");
}

export async function listAllConversions(): Promise<Conversion[]> {
  const db = await getDb();
  return db.select<Conversion[]>(
    "SELECT * FROM conversions ORDER BY created_at ASC"
  );
}

/* ---------------- Feeds (v1.2) ---------------- */

export interface FeedItem {
  id: string;
  source: string;
  title: string;
  url: string;
  summary: string | null;
  score: number;
  matched_keywords: string;
  fetched_at: string;
  read_at: string | null;
  starred: number;
  project_id: string | null;
}

export async function listFeeds(
  projectId: string | null,
  limit = 50
): Promise<FeedItem[]> {
  const db = await getDb();
  if (projectId) {
    return db.select<FeedItem[]>(
      "SELECT * FROM feeds WHERE project_id = $1 ORDER BY score DESC, fetched_at DESC LIMIT $2",
      [projectId, limit]
    );
  }
  return db.select<FeedItem[]>(
    "SELECT * FROM feeds WHERE project_id IS NULL ORDER BY score DESC, fetched_at DESC LIMIT $1",
    [limit]
  );
}

export async function insertFeed(item: {
  id: string;
  source: string;
  title: string;
  url: string;
  summary?: string | null;
  score?: number;
  matched_keywords?: string[];
  project_id: string;
}): Promise<void> {
  const db = await getDb();
  await db.execute(
    `INSERT INTO feeds (id, source, title, url, summary, score, matched_keywords, fetched_at, project_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     ON CONFLICT(id) DO NOTHING`,
    [
      item.id,
      item.source,
      item.title,
      item.url,
      item.summary ?? null,
      item.score ?? 0,
      JSON.stringify(item.matched_keywords ?? []),
      nowIso(),
      item.project_id,
    ]
  );
}

export async function markFeedRead(id: string): Promise<void> {
  const db = await getDb();
  await db.execute("UPDATE feeds SET read_at = $1 WHERE id = $2", [
    nowIso(),
    id,
  ]);
}

export async function starFeed(id: string, starred: boolean): Promise<void> {
  const db = await getDb();
  await db.execute("UPDATE feeds SET starred = $1 WHERE id = $2", [
    starred ? 1 : 0,
    id,
  ]);
}

export async function listFeedKeywords(
  projectId: string
): Promise<{ id: string; keyword: string; weight: number }[]> {
  const db = await getDb();
  return db.select(
    "SELECT id, keyword, weight FROM feed_keywords WHERE project_id = $1 ORDER BY weight DESC",
    [projectId]
  );
}

export async function upsertFeedKeyword(
  projectId: string,
  keyword: string,
  weight: number = 1
): Promise<void> {
  const db = await getDb();
  const id = uuid();
  await db.execute(
    `INSERT INTO feed_keywords (id, project_id, keyword, weight, created_at)
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT(project_id, keyword) DO UPDATE SET weight = weight + 1`,
    [id, projectId, keyword, weight, nowIso()]
  );
}

export async function deleteFeedKeyword(
  projectId: string,
  keyword: string
): Promise<void> {
  const db = await getDb();
  await db.execute(
    "DELETE FROM feed_keywords WHERE project_id = $1 AND keyword = $2",
    [projectId, keyword]
  );
}

export async function clearAllFeeds(): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM feeds");
}

/* ---------------- RSS Sources (v1.2) ---------------- */

export interface RssSource {
  id: string;
  url: string;
  label: string;
  enabled: number;
  created_at: string;
}

export async function listRssSources(): Promise<RssSource[]> {
  const db = await getDb();
  return db.select<RssSource[]>(
    "SELECT * FROM rss_sources ORDER BY created_at ASC"
  );
}

export async function addRssSource(
  url: string,
  label: string
): Promise<RssSource> {
  const db = await getDb();
  const id = uuid();
  const now = nowIso();
  await db.execute(
    `INSERT INTO rss_sources (id, url, label, enabled, created_at)
     VALUES ($1,$2,$3,1,$4)
     ON CONFLICT(url) DO NOTHING`,
    [id, url, label, now]
  );
  return { id, url, label, enabled: 1, created_at: now };
}

export async function deleteRssSource(id: string): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM rss_sources WHERE id = $1", [id]);
}

export async function setRssSourceEnabled(
  id: string,
  enabled: boolean
): Promise<void> {
  const db = await getDb();
  await db.execute("UPDATE rss_sources SET enabled = $1 WHERE id = $2", [
    enabled ? 1 : 0,
    id,
  ]);
}