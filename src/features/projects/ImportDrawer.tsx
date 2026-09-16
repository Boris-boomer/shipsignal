import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Upload, X, FileText, Check, AlertCircle, Copy } from "lucide-react";
import { Button } from "@/components/ui";
import {
  detectFormat,
  parseImportText,
  rowToSignal,
  rowToConversion,
  fingerprintSignalInput,
  fingerprintSignalRow,
  fingerprintConversionInput,
  fingerprintConversionRow,
  type SignalImportRow,
  type ConversionImportRow,
  type ImportError,
  type ParseFormat,
} from "@/lib/import";
import { listSignals, listConversions } from "@/lib/db";
import type { SignalInput, Conversion } from "@/lib/types";

type EntityType = "signal" | "conversion";

type ParsedRow =
  | ({ index: number; duplicate: boolean } & SignalImportRow)
  | ({ index: number; duplicate: boolean } & ConversionImportRow)
  | ({ index: number; duplicate: false } & ImportError);

export interface ImportResult {
  succeeded: number;
  failed: { index: number; error: string }[];
  duplicatesSkipped?: number;
}

interface ImportDrawerProps {
  entityType: EntityType;
  projectId: string;
  onImport: (items: unknown[]) => Promise<ImportResult>;
  onClose: () => void;
}

type Phase = "input" | "parsing" | "preview" | "importing" | "done";

export function ImportDrawer({
  entityType,
  projectId,
  onImport,
  onClose,
}: ImportDrawerProps) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<Phase>("input");
  const [text, setText] = useState("");
  const [format, setFormat] = useState<ParseFormat>("csv");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  const validRows = useMemo(
    () => rows.filter((r) => r.ok && !(skipDuplicates && r.duplicate)),
    [rows, skipDuplicates]
  );
  const duplicateRows = useMemo(
    () => rows.filter((r) => r.ok && r.duplicate),
    [rows]
  );
  const skippedDupCount = skipDuplicates ? duplicateRows.length : 0;
  const errorRows = useMemo(() => rows.filter((r) => !r.ok), [rows]);
  const emptyText = !text.trim();

  const entityName =
    entityType === "signal" ? t("entity.signal") : t("entity.conversion");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const content = await f.text();
      setText(content);
      setFormat(detectFormat(content));
      setError(null);
    } catch (err) {
      setError(
        t("import.error.readFile", {
          msg: err instanceof Error ? err.message : String(err),
        })
      );
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleParse() {
    setError(null);
    const trimmed = text.trim();
    if (!trimmed) {
      setError(t("import.error.empty"));
      return;
    }

    let raw: Record<string, unknown>[];
    try {
      raw = parseImportText(trimmed, format);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return;
    }

    if (raw.length === 0) {
      setError(t("import.error.noRows"));
      return;
    }

    setPhase("parsing");

    let existingFingerprints = new Set<string>();
    try {
      if (entityType === "signal") {
        const existing = await listSignals(projectId);
        existingFingerprints = new Set(existing.map(fingerprintSignalRow));
      } else {
        const existing = await listConversions(projectId);
        existingFingerprints = new Set(
          existing.map(fingerprintConversionRow)
        );
      }
    } catch (e) {
      console.error("[import] 加载现有记录失败，将跳过去重", e);
    }

    const parsed: ParsedRow[] = raw.map((r, i) => {
      const base = { index: i + 1 };
      if (entityType === "signal") {
        const res = rowToSignal(r, projectId);
        if (!res.ok) {
          return { ...base, duplicate: false, ...res } as ParsedRow;
        }
        const fp = fingerprintSignalInput(res.value);
        const dup = existingFingerprints.has(fp);
        return { ...base, duplicate: dup, ...res } as ParsedRow;
      }
      const res = rowToConversion(r, projectId);
      if (!res.ok) {
        return { ...base, duplicate: false, ...res } as ParsedRow;
      }
      const fp = fingerprintConversionInput(res.value);
      const dup = existingFingerprints.has(fp);
      return { ...base, duplicate: dup, ...res } as ParsedRow;
    });

    setRows(parsed);
    setPhase("preview");
  }

  async function handleImport() {
    if (validRows.length === 0) return;
    setPhase("importing");
    setError(null);

    try {
      const items = validRows.map((r) =>
        r.ok ? (r as { value: unknown }).value : null
      );
      const res = await onImport(items.filter((x) => x !== null));
      setResult({ ...res, duplicatesSkipped: skippedDupCount });
      setPhase("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setPhase("preview");
    }
  }

  function handleReset() {
    setPhase("input");
    setText("");
    setRows([]);
    setResult(null);
    setError(null);
  }

  return (
    <div className="rounded-lg border border-[var(--color-accent)]/40 bg-[var(--color-panel-2)]/40 p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-accent)]">
          <Upload size="0.75rem" />
          {t("import.title", { entity: entityName })}
        </div>
        <button
          onClick={onClose}
          className="text-[var(--color-muted)] hover:text-[var(--color-strong)]"
        >
          <X size="0.875rem" />
        </button>
      </div>

      {error && (
        <div className="mb-2 rounded-md border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 px-2 py-1.5 text-xs text-[var(--color-danger)]">
          {error}
        </div>
      )}

      {phase === "input" && (
        <>
          <div className="mb-2 text-[0.6rem] leading-relaxed text-[var(--color-muted)]">
            {entityType === "signal" ? (
              <>
                {t("import.hint.signalCsv")}
                <br />
                {t("import.hint.jsonArray")}
              </>
            ) : (
              <>
                {t("import.hint.conversionCsv")}
                <br />
                {t("import.hint.jsonArray")}
              </>
            )}
          </div>

          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setFormat(detectFormat(e.target.value));
            }}
            placeholder={t("import.placeholder")}
            rows={6}
            className="w-full resize-y rounded-md border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2 font-mono text-xs text-[var(--color-strong)] outline-none focus:border-[var(--color-accent)]"
          />

          <div className="mt-2 flex items-center justify-between gap-3">
            <div>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.json,.txt"
                onChange={handleFile}
                className="hidden"
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => fileRef.current?.click()}
              >
                <FileText size="0.75rem" className="mr-1" />
                {t("import.pickFile")}
              </Button>
            </div>
            <div className="flex items-center gap-3">
              {emptyText && (
                <span className="text-[0.6rem] text-[var(--color-muted)]">
                  {t("import.emptyHint")}
                </span>
              )}
              <Button size="sm" onClick={handleParse} disabled={emptyText}>
                {t("import.parse")}
              </Button>
            </div>
          </div>
        </>
      )}

      {phase === "parsing" && (
        <div className="py-6 text-center text-xs text-[var(--color-muted)]">
          {t("import.parsing")}
        </div>
      )}

      {phase === "preview" && (
        <>
          <div className="mb-2 flex flex-wrap items-center gap-3 text-xs">
            <span className="text-[var(--color-muted)]">
              {t("import.stats.total", { n: rows.length })}
            </span>
            <span className="text-[var(--color-accent-2)]">
              {t("import.stats.valid", { n: validRows.length })}
            </span>
            {duplicateRows.length > 0 && (
              <span className="text-[var(--color-warn)]">
                {t("import.stats.duplicate", { n: duplicateRows.length })}
              </span>
            )}
            {errorRows.length > 0 && (
              <span className="text-[var(--color-danger)]">
                {t("import.stats.failed", { n: errorRows.length })}
              </span>
            )}
          </div>

          {duplicateRows.length > 0 && (
            <label className="mb-2 flex cursor-pointer items-center gap-2 rounded-md border border-[var(--color-warn)]/30 bg-[var(--color-warn)]/5 px-2 py-1.5 text-[0.6rem] text-[var(--color-warn)]">
              <input
                type="checkbox"
                checked={skipDuplicates}
                onChange={(e) => setSkipDuplicates(e.target.checked)}
                className="cursor-pointer"
              />
              <span>
                {t("import.skipDuplicates", { n: duplicateRows.length })}
                {!skipDuplicates && t("import.skipDuplicatesOff")}
              </span>
            </label>
          )}

          <div className="max-h-60 overflow-auto rounded-md border border-[var(--color-border)] bg-[var(--color-panel)]">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-[var(--color-panel-2)] text-[var(--color-muted)]">
                <tr>
                  <th className="px-2 py-1.5 text-left">#</th>
                  {entityType === "signal" ? (
                    <>
                      <th className="px-2 py-1.5 text-left">
                        {t("import.table.type")}
                      </th>
                      <th className="px-2 py-1.5 text-left">
                        {t("import.table.source")}
                      </th>
                      <th className="px-2 py-1.5 text-left">
                        {t("import.table.confidence")}
                      </th>
                      <th className="px-2 py-1.5 text-left">
                        {t("import.table.paid")}
                      </th>
                    </>
                  ) : (
                    <>
                      <th className="px-2 py-1.5 text-left">
                        {t("import.table.segment")}
                      </th>
                      <th className="px-2 py-1.5 text-left">
                        {t("import.table.form")}
                      </th>
                      <th className="px-2 py-1.5 text-left">
                        {t("import.table.amount")}
                      </th>
                      <th className="px-2 py-1.5 text-left">
                        {t("import.table.currency")}
                      </th>
                      <th className="px-2 py-1.5 text-left">
                        {t("import.table.paid")}
                      </th>
                    </>
                  )}
                  <th className="px-2 py-1.5 text-left">
                    {t("import.table.status")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 100).map((r) => (
                  <tr
                    key={r.index}
                    className="border-t border-[var(--color-border)]"
                  >
                    <td className="px-2 py-1.5 text-[var(--color-muted)]">
                      {r.index}
                    </td>
                    {r.ok ? (
                      <>
                        {entityType === "signal" ? (
                          <>
                            <td className="px-2 py-1.5 text-[var(--color-strong)]">
                              {(r as { preview: SignalImportRow["preview"] }).preview.signal_type}
                            </td>
                            <td className="px-2 py-1.5 text-[var(--color-strong)]">
                              {(r as { preview: SignalImportRow["preview"] }).preview.source}
                            </td>
                            <td className="px-2 py-1.5 text-[var(--color-strong)]">
                              {(r as { preview: SignalImportRow["preview"] }).preview.source_verifiability}
                            </td>
                            <td className="px-2 py-1.5 text-[var(--color-strong)]">
                              {(r as { preview: SignalImportRow["preview"] }).preview.payment_signal_present}
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-2 py-1.5 text-[var(--color-strong)]">
                              {(r as { preview: ConversionImportRow["preview"] }).preview.user_segment}
                            </td>
                            <td className="px-2 py-1.5 text-[var(--color-strong)]">
                              {(r as { preview: ConversionImportRow["preview"] }).preview.monetization_form}
                            </td>
                            <td className="px-2 py-1.5 text-[var(--color-strong)]">
                              {(r as { preview: ConversionImportRow["preview"] }).preview.amount}
                            </td>
                            <td className="px-2 py-1.5 text-[var(--color-strong)]">
                              {(r as { preview: ConversionImportRow["preview"] }).preview.currency}
                            </td>
                            <td className="px-2 py-1.5 text-[var(--color-strong)]">
                              {(r as { preview: ConversionImportRow["preview"] }).preview.recurring}
                            </td>
                          </>
                        )}
                        {r.duplicate ? (
                          <td className="px-2 py-1.5 text-[var(--color-warn)]">
                            {skipDuplicates
                              ? t("import.status.duplicateSkip")
                              : t("import.status.duplicate")}
                          </td>
                        ) : (
                          <td className="px-2 py-1.5 text-[var(--color-accent-2)]">
                            {t("import.status.importable")}
                          </td>
                        )}
                      </>
                    ) : (
                      <>
                        <td
                          colSpan={entityType === "signal" ? 4 : 5}
                          className="px-2 py-1.5 text-[var(--color-danger)]"
                        >
                          {(r as ImportError).error}
                        </td>
                        <td className="px-2 py-1.5 text-[var(--color-danger)]">
                          {t("import.status.failed")}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 100 && (
              <div className="px-2 py-1.5 text-center text-[0.6rem] text-[var(--color-muted)]">
                {t("import.onlyFirst100")}
              </div>
            )}
          </div>

          <div className="mt-2 flex justify-between">
            <Button size="sm" variant="ghost" onClick={handleReset}>
              {t("import.action.reset")}
            </Button>
            <Button
              size="sm"
              onClick={handleImport}
              disabled={validRows.length === 0}
            >
              <Check size="0.75rem" className="mr-1" />
              {t("import.action.confirm", { n: validRows.length })}
            </Button>
          </div>
        </>
      )}

      {phase === "importing" && (
        <div className="py-6 text-center text-xs text-[var(--color-muted)]">
          {t("import.importing")}
        </div>
      )}

      {phase === "done" && result && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 rounded-md border border-[var(--color-accent-2)]/40 bg-[var(--color-accent-2)]/10 px-3 py-2 text-xs text-[var(--color-accent-2)]">
            <Check size="0.875rem" />
            {t("import.done.success", { n: result.succeeded })}
          </div>

          {typeof result.duplicatesSkipped === "number" &&
            result.duplicatesSkipped > 0 && (
              <div className="flex items-center gap-2 rounded-md border border-[var(--color-warn)]/40 bg-[var(--color-warn)]/10 px-3 py-2 text-xs text-[var(--color-warn)]">
                <Copy size="0.875rem" />
                {t("import.done.duplicates", {
                  n: result.duplicatesSkipped,
                })}
              </div>
            )}

          {result.failed.length > 0 && (
            <div className="rounded-md border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 px-3 py-2 text-xs text-[var(--color-danger)]">
              <div className="flex items-center gap-2 font-medium">
                <AlertCircle size="0.875rem" />
                {t("import.done.failed", { n: result.failed.length })}
              </div>
              <ul className="mt-1 list-inside list-disc space-y-0.5 text-[0.6rem]">
                {result.failed.slice(0, 5).map((f) => (
                  <li key={f.index}>
                    {t("import.done.failLine", {
                      n: f.index,
                      error: f.error,
                    })}
                  </li>
                ))}
                {result.failed.length > 5 && (
                  <li>
                    {t("import.done.more", { n: result.failed.length - 5 })}
                  </li>
                )}
              </ul>
            </div>
          )}
          <div className="flex justify-end">
            <Button size="sm" onClick={onClose}>
              {t("import.done.close")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}