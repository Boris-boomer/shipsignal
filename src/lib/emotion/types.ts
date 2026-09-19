export type EmotionScene =
  | "channel_revisit"
  | "channel_silence"
  | "payment_precursor"
  | "signal_burst"
  | "first_signal"
  | "action_done"
  | "mistake_warning"
  | "review_due"
  | "feed_greeting";

export interface TemplateContext {
  channel?: string;
  daysAgo?: number;
  signalCount?: number;
  lastSignalCount?: number;
  newDetail?: string;
  paymentCount?: number;
  isFirstEver?: boolean;
  mistakeTitle?: string;
  mistakeReason?: string;
  feedCount?: number;
  projectName?: string;
  decisionBasis?: string;
}

export interface EmotionOutput {
  title: string;
  body: string;
}

export interface Template {
  id: string;
  build: (ctx: TemplateContext) => EmotionOutput;
}