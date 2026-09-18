export type Mode = "validate_first" | "build_first" | "portfolio";
export type Entry = "A" | "B" | "C";

export type ProjectStatus =
  | "planning"
  | "building"
  | "launched"
  | "converting"
  | "archived"
  | "frozen"
  | "active";

export type ProjectType = "learning" | "validation" | "asset";
export type Confidence = "high" | "medium" | "low";
export type Verifiability = "high" | "medium" | "low";
export type LessonType = "validated" | "invalidated" | "discovered";
export type DecisionOutcome = "pending" | "confirmed" | "reversed";

export interface Project {
  id: string;
  mode: Mode;
  entry: Entry | null;
  name: string;
  description: string | null;
  status: ProjectStatus;
  project_type: ProjectType | null;
  completion_criteria: string | null;
  archive_reason: string | null;
  sunset_conditions: string | null;
  build_hours: number;
  distribution_hours: number;
  mode_data: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectCreateInput {
  mode: Mode;
  entry?: Entry | null;
  name: string;
  description?: string;
  status?: ProjectStatus;
  project_type?: ProjectType | null;
  completion_criteria?: string | null;
  sunset_conditions?: string | null;
  mode_data?: Record<string, unknown>;
}

export interface ProjectStats {
  project_id: string;
  signals: number;
  lessons: number;
}

export interface Signal {
  id: string;
  project_id: string;
  signal_type: string;
  data: string;
  source: string | null;
  source_verifiability: Verifiability | null;
  anomaly_flags: string;
  suggested_confidence: Confidence | null;
  developer_confidence: Confidence | "ignored" | null;
  override_reason: string | null;
  decision_impact: string | null;
  created_at: string;
}

export interface SignalInput {
  project_id: string;
  signal_type: string;
  data?: Record<string, unknown>;
  source?: string | null;
  source_verifiability?: Verifiability;
  anomaly_flags?: string[];
  payment_signal_present?: boolean;
  time_series?: number[];
}

export interface Conversion {
  id: string;
  project_id: string;
  user_segment: string | null;
  monetization_form: string | null;
  amount: number | null;
  currency: string;
  recurring: number;
  notes: string | null;
  created_at: string;
}

export interface Lesson {
  id: string;
  project_id: string;
  lesson_type: LessonType;
  description: string;
  applicable_to: string;
  created_at: string;
}

export interface DecisionLog {
  id: string;
  project_id: string;
  signal_id: string | null;
  decision: string;
  basis: string | null;
  confidence: Confidence | null;
  outcome: DecisionOutcome;
  created_at: string;
  reviewed_at: string | null;
}

export interface CredibilityAssessment {
  verifiability_score: number;
  anomaly_score: number;
  payment_signal_present: boolean;
  suggested_confidence: Confidence;
  raw: number;
  reasons: string[];
  anomaly_flags: string[];
}

/* ---------------- AI ---------------- */

export interface AiMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export type AiPurpose =
  | "general"
  | "signal_summary"
  | "channel_summary"
  | "distribution_draft"
  | "lesson_summary"
  | "structured_draft";

export interface AiChatInput {
  request_id: string;
  messages: AiMessage[];
  purpose: string;
  project_id: string | null;
  api_base: string;
  api_key: string;
  model: string;
  temperature: number;
}

export interface AiInteraction {
  id: string;
  project_id: string | null;
  purpose: string | null;
  prompt: string | null;
  response: string | null;
  model: string | null;
  created_at: string;
}

export interface AiSettings {
  api_base: string;
  api_key: string;
  model: string;
  temperature: number;
}

/* ---------------- Data Sources ---------------- */

export type DataSourceProvider = "bilibili" | "kuaishou" | "weibo";

export type DataSourceStatus =
  | "disconnected"
  | "connected"
  | "expired"
  | "error";

export interface DataSource {
  id: string;
  provider: DataSourceProvider;
  label: string;
  client_id: string | null;
  client_secret: string | null;
  access_token: string | null;
  refresh_token: string | null;
  token_expires_at: number | null;
  scopes: string;
  user_openid: string | null;
  user_name: string | null;
  user_avatar: string | null;
  status: DataSourceStatus;
  last_sync_at: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface OAuthStartOutput {
  auth_url: string;
  redirect_uri: string;
  state: string;
}

export interface TokenInfo {
  access_token: string;
  refresh_token: string | null;
  expires_at: number | null;
  scopes: string[];
}

export interface BiliUserInfo {
  name: string;
  face: string;
  openid: string;
}

export interface BiliUserStat {
  following: number;
  follower: number;
  arc_passed_total: number;
}

export interface FetchedSignal {
  signal_type: string;
  source: string;
  source_verifiability: string;
  payment_signal_present: boolean;
  data: Record<string, unknown>;
  notes: string;
}

/* ---------------- Backup ---------------- */

export interface BackupData {
  version: 1;
  exported_at: string;
  app_version: string;
  projects: Project[];
  signals: Signal[];
  conversions: Conversion[];
  lessons: Lesson[];
  decision_logs: DecisionLog[];
}

/* ---------------- v1.1 引导层 ---------------- */

export type ActionCardStatus = "pending" | "done" | "skipped" | "replaced";

export interface ActionCard {
  id: string;
  project_id: string;
  card_type: string;
  title: string;
  body: string | null;
  draft: string | null;
  source_signals: string; // JSON array of signal ids
  status: ActionCardStatus;
  created_at: string;
  acted_at: string | null;
}

export type PatternType =
  | "channel_depth"
  | "signal_burst"
  | "signal_silence"
  | "payment_precursor";

export interface SignalPattern {
  id: string;
  project_id: string;
  pattern_type: PatternType;
  payload: string; // JSON
  computed_at: string;
}

/* ---- 各 pattern_type 的 payload 结构 ---- */

export interface ChannelDepthPayload {
  channel: string;
  depth: "shallow" | "deep";
  signal_count: number;
  has_payment: boolean;
}

export interface SignalBurstPayload {
  channel: string;
  count: number;
  spike_ratio: number;
}

export interface SignalSilencePayload {
  channel: string;
  days_silent: number;
  last_signal_at: string;
}

export interface PaymentPrecursorPayload {
  precursor_types: string[];
  confidence: number;
  sample_size: number;
}

/* ---------------- v1.1 冷启动 ---------------- */

export type ColdStartMood = "confident" | "ok" | "unsure" | "retry";

export type ColdStartTrack =
  | "efficiency"
  | "ai_tool"
  | "dev_tool"
  | "content"
  | "learning"
  | "lifestyle"
  | "monetization"
  | "other";

export interface ColdStartAttempt {
  id: string;
  project_id: string;
  track: string | null;
  pain: string | null;
  action: string | null;
  draft: string | null;
  mood: string | null;
  published: number;
  created_at: string;
}