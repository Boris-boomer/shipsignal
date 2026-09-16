import type { SignalInput, Signal, Verifiability, Conversion } from "./types";

/* ---------------- CSV 解析 ---------------- */

export interface CsvParseResult {
  headers: string[];
  rows: Record<string, string>[];
}

export function parseCsv(text: string): CsvParseResult {
  const rawRows = splitCsvRows(text);
  if (rawRows.length === 0) return { headers: [], rows: [] };

  const headers = rawRows[0].map((h) => h.trim());
  const dataRows = rawRows.slice(1).filter((r) => r.some((c) => c.trim()));

  const rows: Record<string, string>[] = [];
  for (const r of dataRows) {
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h] = (r[idx] ?? "").trim();
    });
    rows.push(obj);
  }
  return { headers, rows };
}

function splitCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let current: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += c;
      i++;
      continue;
    }
    if (c === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (c === ",") {
      current.push(field);
      field = "";
      i++;
      continue;
    }
    if (c === "\r") {
      i++;
      continue;
    }
    if (c === "\n") {
      current.push(field);
      rows.push(current);
      current = [];
      field = "";
      i++;
      continue;
    }
    field += c;
    i++;
  }
  if (field.length > 0 || current.length > 0) {
    current.push(field);
    rows.push(current);
  }
  return rows.filter((r) => r.length > 0);
}

/* ---------------- JSON 解析 ---------------- */

export function parseJsonArray(text: string): Record<string, unknown>[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    throw new Error(
      `JSON 解析失败：${e instanceof Error ? e.message : String(e)}`
    );
  }

  if (Array.isArray(parsed)) {
    return parsed.filter(
      (v): v is Record<string, unknown> =>
        v !== null && typeof v === "object" && !Array.isArray(v)
    );
  }

  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    const obj = parsed as Record<string, unknown>;
    for (const key of ["signals", "conversions", "items", "data"]) {
      const arr = obj[key];
      if (Array.isArray(arr)) {
        return arr.filter(
          (v): v is Record<string, unknown> =>
            v !== null && typeof v === "object" && !Array.isArray(v)
        );
      }
    }
  }

  throw new Error(
    "JSON 必须是数组，或包含数组的 {signals: [...]} / {conversions: [...]} 形式"
  );
}

/* ---------------- 通用工具 ---------------- */

function asString(v: unknown): string | null {
  if (typeof v === "string" && v.trim()) return v.trim();
  if (typeof v === "number") return String(v);
  return null;
}

function asBool(v: unknown, defaultValue = false): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  if (typeof v === "string") {
    const s = v.toLowerCase().trim();
    if (["true", "1", "yes", "y", "是", "真"].includes(s)) return true;
    if (["false", "0", "no", "n", "否", "假", ""].includes(s)) return false;
  }
  return defaultValue;
}

function asNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const cleaned = v.replace(/[^\d.-]/g, "");
    if (!cleaned) return null;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/* ---------------- 信号映射 ---------------- */

export interface SignalImportRow {
  ok: true;
  value: SignalInput;
  preview: {
    signal_type: string;
    source: string;
    source_verifiability: string;
    payment_signal_present: string;
  };
}

export interface ImportError {
  ok: false;
  error: string;
}

export function rowToSignal(
  row: Record<string, unknown>,
  projectId: string
): SignalImportRow | ImportError {
  const signalType = asString(row.signal_type ?? row.type);
  if (!signalType) return { ok: false, error: "缺少 signal_type 字段" };

  const source = asString(row.source);

  const rawVer = asString(row.source_verifiability ?? row.verifiability);
  const verifiability: Verifiability =
    rawVer === "high" || rawVer === "medium" || rawVer === "low"
      ? rawVer
      : "medium";

  const payment = asBool(row.payment_signal_present ?? row.payment, false);

  const value = asNumber(row.value);
  const notes = asString(row.notes ?? row.note ?? row.remark);

  const data: Record<string, unknown> = {};
  if (value !== null) data.value = value;
  if (notes) data.notes = notes;
  data.payment_signal_present = payment;

  const KNOWN = new Set([
    "signal_type",
    "type",
    "source",
    "source_verifiability",
    "verifiability",
    "payment_signal_present",
    "payment",
    "value",
    "notes",
    "note",
    "remark",
  ]);
  for (const [k, v] of Object.entries(row)) {
    if (KNOWN.has(k)) continue;
    if (v === null || v === undefined || v === "") continue;
    data[k] = v;
  }

  return {
    ok: true,
    value: {
      project_id: projectId,
      signal_type: signalType,
      source,
      source_verifiability: verifiability,
      payment_signal_present: payment,
      anomaly_flags: [],
      data,
    },
    preview: {
      signal_type: signalType,
      source: source ?? "—",
      source_verifiability: verifiability,
      payment_signal_present: payment ? "是" : "否",
    },
  };
}

/* ---------------- 转化映射 ---------------- */

export interface ConversionImportRow {
  ok: true;
  value: Omit<Conversion, "id" | "created_at">;
  preview: {
    user_segment: string;
    monetization_form: string;
    amount: string;
    currency: string;
    recurring: string;
  };
}

const MONETIZATION_MAP: Record<string, string> = {
  一次性买断: "one_time",
  买断: "one_time",
  一次性: "one_time",
  one_time: "one_time",
  subscription: "subscription",
  订阅: "subscription",
  持续付费: "subscription",
  api_license: "api_license",
  "API 授权": "api_license",
  API授权: "api_license",
  custom_development: "custom_development",
  定制开发: "custom_development",
  定制: "custom_development",
  source_license: "source_license",
  源码授权: "source_license",
  源码: "source_license",
  other: "other",
  其他: "other",
};

function normalizeMonetization(v: unknown): string | null {
  const s = asString(v);
  if (!s) return null;
  return MONETIZATION_MAP[s] ?? MONETIZATION_MAP[s.toLowerCase()] ?? "other";
}

export function rowToConversion(
  row: Record<string, unknown>,
  projectId: string
): ConversionImportRow | ImportError {
  const user_segment = asString(row.user_segment ?? row.segment);
  const monetization_form = normalizeMonetization(
    row.monetization_form ?? row.form
  );
  const amount = asNumber(row.amount ?? row.price);
  const currency = (() => {
    const c = asString(row.currency);
    if (!c) return "USD";
    const up = c.toUpperCase();
    return up.length === 3 ? up : "USD";
  })();
  const recurring = asBool(row.recurring ?? row.is_recurring, false) ? 1 : 0;
  const notes = asString(row.notes ?? row.note ?? row.remark);

  return {
    ok: true,
    value: {
      project_id: projectId,
      user_segment,
      monetization_form,
      amount,
      currency,
      recurring,
      notes,
    },
    preview: {
      user_segment: user_segment ?? "—",
      monetization_form: monetization_form ?? "—",
      amount: amount !== null ? String(amount) : "—",
      currency,
      recurring: recurring ? "订阅" : "一次性",
    },
  };
}

/* ---------------- 顶层入口 ---------------- */

export type ParseFormat = "csv" | "json";

export function detectFormat(text: string): ParseFormat {
  const t = text.trim();
  if (t.startsWith("[") || t.startsWith("{")) return "json";
  return "csv";
}

export function parseImportText(
  text: string,
  format: ParseFormat
): Record<string, unknown>[] {
  if (format === "json") {
    return parseJsonArray(text);
  }
  const { rows } = parseCsv(text);
  return rows;
}

/* ---------------- 指纹（去重用） ----------------
 *
 * 指纹只包含"核心字段"，不含 id / created_at / 派生字段（如 suggested_confidence）。
 * 相同来源的同一行数据 → 指纹相同；行内任何一处关键信息不同 → 指纹不同。
 */

function safeParseObject(json: string): Record<string, unknown> {
  try {
    const v = JSON.parse(json);
    if (v && typeof v === "object" && !Array.isArray(v)) {
      return v as Record<string, unknown>;
    }
  } catch {
    // ignore
  }
  return {};
}

export function fingerprintSignalInput(input: SignalInput): string {
  const data = (input.data ?? {}) as Record<string, unknown>;
  return JSON.stringify([
    input.signal_type,
    input.source ?? "",
    input.source_verifiability ?? "medium",
    input.payment_signal_present ? 1 : 0,
    data.value ?? null,
    data.notes ?? null,
  ]);
}

export function fingerprintSignalRow(s: Signal): string {
  const data = safeParseObject(s.data);
  return JSON.stringify([
    s.signal_type,
    s.source ?? "",
    s.source_verifiability ?? "medium",
    data.payment_signal_present ? 1 : 0,
    data.value ?? null,
    data.notes ?? null,
  ]);
}

export function fingerprintConversionInput(
  c: Omit<Conversion, "id" | "created_at">
): string {
  return JSON.stringify([
    c.user_segment ?? "",
    c.monetization_form ?? "",
    c.amount ?? null,
    c.currency ?? "USD",
    c.recurring ? 1 : 0,
    c.notes ?? "",
  ]);
}

export function fingerprintConversionRow(c: Conversion): string {
  return JSON.stringify([
    c.user_segment ?? "",
    c.monetization_form ?? "",
    c.amount ?? null,
    c.currency ?? "USD",
    c.recurring ? 1 : 0,
    c.notes ?? "",
  ]);
}