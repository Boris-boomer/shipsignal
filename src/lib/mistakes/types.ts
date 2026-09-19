export interface Mistake {
  id: string;
  title: string;
  reason: string;
  severity: "info" | "warn";
}

export interface ProjectDataLite {
  signalCount: number;
  conversionCount: number;
  buildHours: number;
  distributionHours: number;
  daysSinceLastSignal: number;
  daysSinceFirstSignal: number;
  channelsWithSignals: number;
  channelsWithConversion: number;
  signalsLast7Days: number;
  signalsPrevious7Days: number;
}

export interface MistakeHit {
  id: string;
  severity: "info" | "warn";
  vars: Record<string, string | number>;
}

export interface MistakeRule {
  id: string;
  detect: (data: ProjectDataLite) => MistakeHit | null;
}