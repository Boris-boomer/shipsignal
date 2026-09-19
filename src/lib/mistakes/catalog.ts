import type { MistakeRule } from "./types";

export const rules: MistakeRule[] = [
  {
    id: "build_without_distribute",
    detect: (d) => {
      if (d.buildHours > 0 && d.distributionHours === 0) {
        return {
          id: "build_without_distribute",
          severity: "warn",
          vars: { buildHours: d.buildHours },
        };
      }
      return null;
    },
  },
  {
    id: "build_distribute_unbalanced",
    detect: (d) => {
      if (
        d.buildHours > 5 * Math.max(d.distributionHours, 1) &&
        d.distributionHours > 0
      ) {
        return {
          id: "build_distribute_unbalanced",
          severity: "info",
          vars: {
            buildHours: d.buildHours,
            distributionHours: d.distributionHours,
          },
        };
      }
      return null;
    },
  },
  {
    id: "no_signals_recently",
    detect: (d) => {
      if (d.daysSinceFirstSignal > 7 && d.signalsLast7Days === 0) {
        return {
          id: "no_signals_recently",
          severity: "warn",
          vars: { daysSinceLastSignal: d.daysSinceLastSignal },
        };
      }
      return null;
    },
  },
  {
    id: "many_channels_zero_conversion",
    detect: (d) => {
      if (
        d.channelsWithSignals >= 3 &&
        d.channelsWithConversion === 0 &&
        d.signalCount >= 10
      ) {
        return {
          id: "many_channels_zero_conversion",
          severity: "warn",
          vars: {
            channelsWithSignals: d.channelsWithSignals,
            signalCount: d.signalCount,
          },
        };
      }
      return null;
    },
  },
  {
    id: "signal_density_drop",
    detect: (d) => {
      if (
        d.signalsPrevious7Days >= 5 &&
        d.signalsLast7Days < d.signalsPrevious7Days * 0.4
      ) {
        return {
          id: "signal_density_drop",
          severity: "info",
          vars: {
            signalsPrevious7Days: d.signalsPrevious7Days,
            signalsLast7Days: d.signalsLast7Days,
          },
        };
      }
      return null;
    },
  },
  {
    id: "no_payment_signal",
    detect: (d) => {
      if (
        d.signalCount >= 20 &&
        d.conversionCount === 0 &&
        d.daysSinceFirstSignal > 14
      ) {
        return {
          id: "no_payment_signal",
          severity: "warn",
          vars: {
            daysSinceFirstSignal: d.daysSinceFirstSignal,
            signalCount: d.signalCount,
          },
        };
      }
      return null;
    },
  },
];