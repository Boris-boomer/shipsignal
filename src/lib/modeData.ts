import type { Mode } from "./types";

export interface ModeFieldDef {
  key: string;
  labelKey: string;
  hintKey?: string;
  placeholderKey?: string;
  multiline?: boolean;
}

export interface ModeSectionDef {
  key: string;
  titleKey: string;
  descriptionKey?: string;
  fields: ModeFieldDef[];
}

export interface ModeSchemaDef {
  sections: ModeSectionDef[];
}

const P = "modeData";

export const MODE_SCHEMAS: Record<Mode, ModeSchemaDef> = {
  validate_first: {
    sections: [
      {
        key: "pain_point",
        titleKey: `${P}.validate_first.pain_point.title`,
        descriptionKey: `${P}.validate_first.pain_point.description`,
        fields: [
          {
            key: "who",
            labelKey: `${P}.validate_first.pain_point.fields.who.label`,
            hintKey: `${P}.validate_first.pain_point.fields.who.hint`,
            placeholderKey: `${P}.validate_first.pain_point.fields.who.placeholder`,
          },
          {
            key: "what",
            labelKey: `${P}.validate_first.pain_point.fields.what.label`,
            placeholderKey: `${P}.validate_first.pain_point.fields.what.placeholder`,
          },
          {
            key: "workaround",
            labelKey: `${P}.validate_first.pain_point.fields.workaround.label`,
            hintKey: `${P}.validate_first.pain_point.fields.workaround.hint`,
            placeholderKey: `${P}.validate_first.pain_point.fields.workaround.placeholder`,
          },
        ],
      },
      {
        key: "validation_result",
        titleKey: `${P}.validate_first.validation_result.title`,
        fields: [
          {
            key: "method",
            labelKey: `${P}.validate_first.validation_result.fields.method.label`,
            placeholderKey: `${P}.validate_first.validation_result.fields.method.placeholder`,
          },
          {
            key: "sample_size",
            labelKey: `${P}.validate_first.validation_result.fields.sample_size.label`,
            placeholderKey: `${P}.validate_first.validation_result.fields.sample_size.placeholder`,
          },
          {
            key: "conclusion",
            labelKey: `${P}.validate_first.validation_result.fields.conclusion.label`,
            placeholderKey: `${P}.validate_first.validation_result.fields.conclusion.placeholder`,
          },
        ],
      },
      {
        key: "product_spec",
        titleKey: `${P}.validate_first.product_spec.title`,
        fields: [
          {
            key: "core_feature",
            labelKey: `${P}.validate_first.product_spec.fields.core_feature.label`,
            placeholderKey: `${P}.validate_first.product_spec.fields.core_feature.placeholder`,
          },
          {
            key: "target_user",
            labelKey: `${P}.validate_first.product_spec.fields.target_user.label`,
            placeholderKey: `${P}.validate_first.product_spec.fields.target_user.placeholder`,
          },
          {
            key: "scope",
            labelKey: `${P}.validate_first.product_spec.fields.scope.label`,
            hintKey: `${P}.validate_first.product_spec.fields.scope.hint`,
            placeholderKey: `${P}.validate_first.product_spec.fields.scope.placeholder`,
          },
        ],
      },
    ],
  },

  build_first: {
    sections: [
      {
        key: "product_layer",
        titleKey: `${P}.build_first.product_layer.title`,
        fields: [
          {
            key: "what_it_does",
            labelKey: `${P}.build_first.product_layer.fields.what_it_does.label`,
            placeholderKey: `${P}.build_first.product_layer.fields.what_it_does.placeholder`,
          },
          {
            key: "current_state",
            labelKey: `${P}.build_first.product_layer.fields.current_state.label`,
            placeholderKey: `${P}.build_first.product_layer.fields.current_state.placeholder`,
          },
          {
            key: "user_count",
            labelKey: `${P}.build_first.product_layer.fields.user_count.label`,
            placeholderKey: `${P}.build_first.product_layer.fields.user_count.placeholder`,
          },
        ],
      },
      {
        key: "channel_signal",
        titleKey: `${P}.build_first.channel_signal.title`,
        fields: [
          {
            key: "tried_channels",
            labelKey: `${P}.build_first.channel_signal.fields.tried_channels.label`,
            placeholderKey: `${P}.build_first.channel_signal.fields.tried_channels.placeholder`,
          },
          {
            key: "best_channel",
            labelKey: `${P}.build_first.channel_signal.fields.best_channel.label`,
            placeholderKey: `${P}.build_first.channel_signal.fields.best_channel.placeholder`,
          },
          {
            key: "detail",
            labelKey: `${P}.build_first.channel_signal.fields.detail.label`,
            hintKey: `${P}.build_first.channel_signal.fields.detail.hint`,
            placeholderKey: `${P}.build_first.channel_signal.fields.detail.placeholder`,
          },
        ],
      },
      {
        key: "monetization_match",
        titleKey: `${P}.build_first.monetization_match.title`,
        fields: [
          {
            key: "current_model",
            labelKey: `${P}.build_first.monetization_match.fields.current_model.label`,
            placeholderKey: `${P}.build_first.monetization_match.fields.current_model.placeholder`,
          },
          {
            key: "price_point",
            labelKey: `${P}.build_first.monetization_match.fields.price_point.label`,
            placeholderKey: `${P}.build_first.monetization_match.fields.price_point.placeholder`,
          },
          {
            key: "assessment",
            labelKey: `${P}.build_first.monetization_match.fields.assessment.label`,
            placeholderKey: `${P}.build_first.monetization_match.fields.assessment.placeholder`,
          },
        ],
      },
    ],
  },

  portfolio: {
    sections: [
      {
        key: "portfolio_management",
        titleKey: `${P}.portfolio.portfolio_management.title`,
        fields: [
          {
            key: "products",
            labelKey: `${P}.portfolio.portfolio_management.fields.products.label`,
            hintKey: `${P}.portfolio.portfolio_management.fields.products.hint`,
            placeholderKey: `${P}.portfolio.portfolio_management.fields.products.placeholder`,
            multiline: true,
          },
          {
            key: "allocation",
            labelKey: `${P}.portfolio.portfolio_management.fields.allocation.label`,
            placeholderKey: `${P}.portfolio.portfolio_management.fields.allocation.placeholder`,
          },
          {
            key: "review_cycle",
            labelKey: `${P}.portfolio.portfolio_management.fields.review_cycle.label`,
            placeholderKey: `${P}.portfolio.portfolio_management.fields.review_cycle.placeholder`,
          },
        ],
      },
      {
        key: "sunset_clause",
        titleKey: `${P}.portfolio.sunset_clause.title`,
        descriptionKey: `${P}.portfolio.sunset_clause.description`,
        fields: [
          {
            key: "trigger_conditions",
            labelKey: `${P}.portfolio.sunset_clause.fields.trigger_conditions.label`,
            hintKey: `${P}.portfolio.sunset_clause.fields.trigger_conditions.hint`,
            placeholderKey: `${P}.portfolio.sunset_clause.fields.trigger_conditions.placeholder`,
            multiline: true,
          },
          {
            key: "exit_plan",
            labelKey: `${P}.portfolio.sunset_clause.fields.exit_plan.label`,
            placeholderKey: `${P}.portfolio.sunset_clause.fields.exit_plan.placeholder`,
          },
        ],
      },
    ],
  },
};

/**
 * 从 JSON 字符串里安全读取某个路径的值。
 * 路径格式： "pain_point.who"
 */
export function readField(json: string, path: string): string {
  try {
    const obj = JSON.parse(json || "{}");
    const parts = path.split(".");
    let cur: unknown = obj;
    for (const p of parts) {
      if (cur && typeof cur === "object" && p in (cur as Record<string, unknown>)) {
        cur = (cur as Record<string, unknown>)[p];
      } else {
        return "";
      }
    }
    return typeof cur === "string" ? cur : "";
  } catch {
    return "";
  }
}

/**
 * 往 JSON 字符串里写某个路径的值，返回新的 JSON 字符串。
 * 保留原有其他字段。
 */
export function writeField(
  json: string,
  path: string,
  value: string
): string {
  let obj: Record<string, unknown>;
  try {
    const parsed = JSON.parse(json || "{}");
    obj = parsed && typeof parsed === "object" ? { ...parsed } : {};
  } catch {
    obj = {};
  }

  const parts = path.split(".");
  let cur: Record<string, unknown> = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    const next = cur[p];
    if (!next || typeof next !== "object" || Array.isArray(next)) {
      cur[p] = {};
    }
    cur = cur[p] as Record<string, unknown>;
  }
  const last = parts[parts.length - 1];
  if (value.trim()) {
    cur[last] = value;
  } else {
    delete cur[last];
  }

  return JSON.stringify(obj);
}

/**
 * 判断这个 mode_data 是否至少有一个字段被填过。
 */
export function hasAnyData(json: string): boolean {
  try {
    const obj = JSON.parse(json || "{}");
    return deepHasValue(obj);
  } catch {
    return false;
  }
}

function deepHasValue(obj: unknown): boolean {
  if (typeof obj === "string") return obj.trim().length > 0;
  if (obj && typeof obj === "object") {
    return Object.values(obj as Record<string, unknown>).some(deepHasValue);
  }
  return false;
}

/**
 * 统计已填字段数 / 总字段数。
 */
export function countFilled(
  json: string,
  schema: ModeSchemaDef
): { filled: number; total: number } {
  let filled = 0;
  let total = 0;
  for (const section of schema.sections) {
    for (const field of section.fields) {
      total++;
      if (readField(json, `${section.key}.${field.key}`).trim()) {
        filled++;
      }
    }
  }
  return { filled, total };
}