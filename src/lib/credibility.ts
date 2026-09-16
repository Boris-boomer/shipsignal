import type { Confidence, Verifiability, CredibilityAssessment } from "./types";
import { clamp } from "./utils";

const VERIFIABILITY_SCORE: Record<Verifiability, number> = {
  high: 1,
  medium: 0.6,
  low: 0.3,
};

export function detectTimeSeriesAnomaly(timeSeries?: number[]): {
  score: number;
  flags: string[];
} {
  if (!timeSeries || timeSeries.length < 3) {
    return { score: 0, flags: [] };
  }
  const flags: string[] = [];
  let maxJump = 0;
  for (let i = 1; i < timeSeries.length; i++) {
    const prev = timeSeries[i - 1] || 1;
    const curr = timeSeries[i];
    const jump = Math.abs(curr - prev) / Math.max(prev, 1);
    if (jump > maxJump) maxJump = jump;
  }
  if (maxJump > 3) flags.push("time_series_jump");
  return {
    score: clamp(maxJump / 5, 0, 1),
    flags,
  };
}

export interface AssessInput {
  sourceVerifiability: Verifiability;
  paymentSignalPresent: boolean;
  anomalyFlags?: string[];
  timeSeries?: number[];
}

export function assessSignal(input: AssessInput): CredibilityAssessment {
  const verifiabilityScore = VERIFIABILITY_SCORE[input.sourceVerifiability];
  const baseFlags = input.anomalyFlags ?? [];
  const timeAnomaly = detectTimeSeriesAnomaly(input.timeSeries);

  const anomalyBase = Math.min(baseFlags.length * 0.15, 0.45);
  const anomalyScore = clamp(anomalyBase + timeAnomaly.score * 0.25, 0, 1);

  const paymentScore = input.paymentSignalPresent ? 1 : 0;

  const raw =
    verifiabilityScore * 0.3 + paymentScore * 0.45 + (1 - anomalyScore) * 0.25;

  let suggestedConfidence: Confidence = "low";
  if (raw >= 0.72) suggestedConfidence = "high";
  else if (raw >= 0.45) suggestedConfidence = "medium";

  if (input.paymentSignalPresent && suggestedConfidence === "low") {
    suggestedConfidence = "medium";
  }

  const reasons: string[] = [];
  if (input.paymentSignalPresent) reasons.push("存在真实付费信号");
  else reasons.push("无付费信号");
  if (input.sourceVerifiability === "low") reasons.push("来源可验证性低");
  if (input.sourceVerifiability === "high") reasons.push("来源可验证性高");
  if (anomalyScore > 0.3) reasons.push("存在异常模式");
  reasons.push(...timeAnomaly.flags);

  return {
    verifiability_score: verifiabilityScore,
    anomaly_score: anomalyScore,
    payment_signal_present: input.paymentSignalPresent,
    suggested_confidence: suggestedConfidence,
    raw,
    reasons,
    anomaly_flags: [...baseFlags, ...timeAnomaly.flags],
  };
}