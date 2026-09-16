import type { Confidence } from "./types";

/**
 * 返回可信度的 i18n key，调用方用 t(key) 取显示文案。
 */
export function confidenceLabelKey(c: Confidence): string {
  return `confidence.${c}`;
}

export const confidenceTone = (
  c: Confidence | "ignored" | null | undefined
): "success" | "warn" | "danger" | "neutral" => {
  switch (c) {
    case "high":
      return "success";
    case "medium":
      return "warn";
    case "low":
      return "danger";
    case "ignored":
      return "neutral";
    default:
      return "neutral";
  }
};

export function money(amount: number | null, currency: string): string {
  if (amount == null) return "—";
  const symbol =
    currency === "USD"
      ? "$"
      : currency === "CNY"
      ? "¥"
      : currency === "EUR"
      ? "€"
      : "";
  return `${symbol}${amount.toFixed(2)}`;
}