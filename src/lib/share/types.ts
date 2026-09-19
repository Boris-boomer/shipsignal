export interface ShareData {
  projectName: string;
  description?: string;
  signalCount: number;
  decisionCount: number;
  conversionCount: number;
  lessonCount: number;
  daysActive: number;
  incomeText?: string;
}

export interface ShareOptions {
  width?: number;
  height?: number;
  theme?: "light" | "dark";
}