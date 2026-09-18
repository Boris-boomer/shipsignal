import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import type { AiChatInput, AiMessage, AiSettings, Mode } from "./types";
import type { ModeSchemaDef } from "./modeData";
import i18n, { languageDirective } from "@/i18n";

/* ---------------- 基础流式调用 ---------------- */

interface StreamEvent {
  request_id: string;
  delta: string;
}

interface DoneEvent {
  request_id: string;
  full: string;
}

interface CancelledEvent {
  request_id: string;
  full: string;
}

interface ErrorEvent {
  request_id: string;
  message: string;
}

export interface StreamCallbacks {
  onDelta?: (delta: string) => void;
  onDone?: (full: string) => void;
  onCancelled?: (full: string) => void;
  onError?: (message: string) => void;
}

export interface StreamChatArgs {
  messages: AiMessage[];
  purpose: string;
  projectId: string | null;
  apiBase: string;
  apiKey: string;
  model: string;
  temperature: number;
}

export interface StreamHandle {
  requestId: string;
  promise: Promise<string>;
  cancel: () => Promise<void>;
}

export function streamChat(
  args: StreamChatArgs,
  callbacks: StreamCallbacks = {}
): StreamHandle {
  const requestId = makeRequestId();

  const promise = (async () => {
    let unlistenStream: UnlistenFn | null = null;
    let unlistenDone: UnlistenFn | null = null;
    let unlistenCancelled: UnlistenFn | null = null;
    let unlistenError: UnlistenFn | null = null;

    try {
      unlistenStream = await listen<StreamEvent>("ai://stream", (e) => {
        if (e.payload.request_id !== requestId) return;
        callbacks.onDelta?.(e.payload.delta);
      });
      unlistenDone = await listen<DoneEvent>("ai://done", (e) => {
        if (e.payload.request_id !== requestId) return;
        callbacks.onDone?.(e.payload.full);
      });
      unlistenCancelled = await listen<CancelledEvent>(
        "ai://cancelled",
        (e) => {
          if (e.payload.request_id !== requestId) return;
          callbacks.onCancelled?.(e.payload.full);
        }
      );
      unlistenError = await listen<ErrorEvent>("ai://error", (e) => {
        if (e.payload.request_id !== requestId) return;
        callbacks.onError?.(e.payload.message);
      });

      const input: AiChatInput = {
        request_id: requestId,
        messages: args.messages,
        purpose: args.purpose,
        project_id: args.projectId,
        api_base: args.apiBase,
        api_key: args.apiKey,
        model: args.model,
        temperature: args.temperature,
      };

      const full = await invoke<string>("ai_chat", { input });
      return full;
    } finally {
      unlistenStream?.();
      unlistenDone?.();
      unlistenCancelled?.();
      unlistenError?.();
    }
  })();

  async function cancel(): Promise<void> {
    try {
      await invoke("ai_cancel", { input: { request_id: requestId } });
    } catch (e) {
      console.warn("[ai] cancel failed", e);
    }
  }

  return { requestId, promise, cancel };
}

function makeRequestId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `req_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

/* ---------------- 结构化起草（mode_data） ---------------- */

export interface DraftModeDataArgs {
  mode: Mode;
  schema: ModeSchemaDef;
  currentData: string;
  context: string;
  settings: AiSettings;
  onDelta?: (delta: string) => void;
}

export async function draftModeData(args: DraftModeDataArgs): Promise<string> {
  const systemPrompt =
    buildDraftSystemPrompt(args.mode, args.schema) + languageDirective();
  const userPrompt = buildDraftUserPrompt(args.currentData, args.context);

  const messages: AiMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  const handle = streamChat(
    {
      messages,
      purpose: "structured_draft",
      projectId: null,
      apiBase: args.settings.api_base,
      apiKey: args.settings.api_key,
      model: args.settings.model,
      temperature: args.settings.temperature,
    },
    { onDelta: args.onDelta }
  );

  return handle.promise;
}

function buildDraftSystemPrompt(mode: Mode, schema: ModeSchemaDef): string {
  const fieldsDesc = schema.sections
    .map((s) => {
      const fields = s.fields
        .map((f) => {
          const label = i18n.t(f.labelKey);
          const hint = f.hintKey ? `（提示：${i18n.t(f.hintKey)}）` : "";
          return `  - ${s.key}.${f.key}｜${label}${hint}`;
        })
        .join("\n");
      const sectionTitle = i18n.t(s.titleKey);
      const desc = s.descriptionKey ? `\n${i18n.t(s.descriptionKey)}` : "";
      return `## ${sectionTitle}${desc}\n${fields}`;
    })
    .join("\n\n");

  const MODE_LABEL: Record<Mode, string> = {
    validate_first: "模式 A（有想法，先验证）",
    build_first: "模式 B（有产品，找渠道）",
    portfolio: "模式 C（多产品组合）",
  };

  return `你是 ShipSignal 的结构化信息起草助手。

你的任务：根据用户提供的项目上下文（信号、决策、转化、学习记录），为当前项目生成一份结构化 JSON 数据。

当前模式：${MODE_LABEL[mode]}

字段定义：
${fieldsDesc}

【输出要求，必须严格遵守】
1. 只输出 JSON，不要任何解释文字、不要 markdown 代码块标记
2. JSON 结构为嵌套对象，按 "sectionKey": { "fieldKey": "value" } 组织
3. 字段路径严格遵循上面定义，不要增减字段
4. 没有依据的字段留空字符串 ""
5. 不要编造数据，只从用户提供的上下文中归纳
6. 字段值要具体、可操作，避免"很好"、"不错"这类空话

强调：你不判断数据真假，只做归纳整理。`;
}

function buildDraftUserPrompt(currentData: string, context: string): string {
  const current =
    currentData && currentData.trim() !== "{}"
      ? currentData
      : "（还没有填写任何结构化信息）";
  return `## 当前已有的结构化数据
${current}

## 项目上下文
${context}

请基于以上信息，输出符合字段定义的结构化 JSON。`;
}

/* ---------------- 实体起草（信号 / 转化 / 学习 / 决策） ---------------- */

export type DraftEntityType = "signal" | "conversion" | "lesson" | "decision";

export interface DraftEntityArgs {
  entityType: DraftEntityType;
  rawText: string;
  context: string;
  settings: AiSettings;
  onDelta?: (delta: string) => void;
}

export async function draftEntity(args: DraftEntityArgs): Promise<string> {
  const { systemPrompt } = buildEntityPrompts(args.entityType);

  const messages: AiMessage[] = [
    { role: "system", content: systemPrompt + languageDirective() },
    {
      role: "user",
      content: `## 已有记录（仅供参考格式）
${args.context || "（无）"}

## 原始文本
${args.rawText}

请从原始文本中提取一条 ${args.entityType} 记录，输出严格 JSON。`,
    },
  ];

  const handle = streamChat(
    {
      messages,
      purpose: `draft_${args.entityType}`,
      projectId: null,
      apiBase: args.settings.api_base,
      apiKey: args.settings.api_key,
      model: args.settings.model,
      temperature: args.settings.temperature,
    },
    { onDelta: args.onDelta }
  );

  return handle.promise;
}

function buildEntityPrompts(entityType: DraftEntityType): {
  systemPrompt: string;
} {
  const common = `你是 ShipSignal 的数据提取助手。

你的唯一任务：把用户提供的原始文本，转化成一条结构化 JSON 记录。

【硬性规则】
1. 只输出 JSON，不要任何解释文字、不要 markdown 代码块标记
2. 严格按下面的 schema 输出，不要增减字段
3. 文本里没有的信息，字段填 null 或空字符串，不要编造
4. 不判断数据真假，不做评价，只做格式转换
5. 如果文本中确实没有任何可提取的相关信息，输出 {"__empty__": true}`;

  if (entityType === "signal") {
    return {
      systemPrompt: `${common}

【目标 schema：信号】
{
  "signal_type": "string，信号类型，如 user_feedback / platform_metric / payment / market_observation",
  "source": "string 或 null，信号来源，如 小红书 / 抖音 / 用户访谈 / Reddit",
  "source_verifiability": "high | medium | low，来源可验证性。一手数据用 high，公开平台用 medium，口述推测用 low",
  "payment_signal_present": "boolean，文本中是否明确包含付费信息（金额、购买、订阅、付费意向）",
  "data": "object，原始数据字段，如 {\\"likes\\": 320, \\"comments\\": 45}。不确定就留空对象 {}",
  "notes": "string，一句话备注，不要评价，只客观描述"
}

注意：payment_signal_present 只有文本明确提到钱或付费意向时才为 true，不要推测。`,
    };
  }

  if (entityType === "conversion") {
    return {
      systemPrompt: `${common}

【目标 schema：转化记录】
{
  "user_segment": "string 或 null，客群描述，如 荷兰 SaaS 开发者",
  "monetization_form": "string 或 null，变现形态，如 一次性买断 / 订阅 / API 授权 / 定制开发 / 源码授权",
  "amount": "number 或 null，金额数字",
  "currency": "string，币种代码，如 USD / CNY / EUR。不确定默认 USD",
  "recurring": "number，0 表示一次性，1 表示订阅",
  "notes": "string，一句话客观备注"
}

注意：amount 必须是纯数字，不要带货币符号。`,
    };
  }

  if (entityType === "lesson") {
    return {
      systemPrompt: `${common}

【目标 schema：学习信号】
{
  "lesson_type": "validated | invalidated | discovered",
  "description": "string，一句到三句话，客观陈述这条认知",
  "applicable_to": ["string 数组，这条认知适用于什么场景的标签，如 '定价' / '冷启动' / '渠道选择'"]
}

lesson_type 判定：
- validated：某个假设被验证成立
- invalidated：某个假设被推翻
- discovered：新发现的认知，之前没预设过

如果文本里包含多条可提取的学习信号，只提取最主要的那一条。用户会多次调用。`,
    };
  }

  return {
    systemPrompt: `${common}

【目标 schema：决策日志】
{
  "decision": "string，做了什么决定，一句话",
  "basis": "string 或 null，依据是什么，基于哪些信息",
  "confidence": "high | medium | low 或 null，做这个决定时的信心"
}

注意：不判断这个决定对不对，只记录。`,
  };
}

/* ---------------- JSON 解析工具 ---------------- */

export function extractJson(
  raw: string
): Record<string, unknown> | null {
  let text = raw.trim();
  const codeBlock = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlock) text = codeBlock[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    const parsed = JSON.parse(text.slice(start, end + 1));
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const obj = parsed as Record<string, unknown>;
      if (obj.__empty__ === true) return null;
      return obj;
    }
    return null;
  } catch {
    return null;
  }
}

/* ---------------- 行动卡片起草（v1.1） ---------------- */

export interface DraftActionCardArgs {
  cardType: string;
  cardTitle: string;
  cardBody: string;
  signalsContext: string;
  settings: AiSettings;
  onDelta?: (delta: string) => void;
}

function buildActionCardSystemPrompt(cardType: string): string {
  const common = `你是 ShipSignal 的写作助手。

【核心定位】
用户接下来要执行一个动作，你负责写「用户可以直接拿去用的那段文字」。
它不是分析，不是建议，不是总结。它是「对外发出的内容」本身。

【硬性规则】
1. 只输出正文，不要任何标题、解释、前后缀、markdown 标记
2. 不评价数据，不写「建议」「可以考虑」「总体来看」这类话
3. 不编造信号中没有的事实、数字、人名、渠道名
4. 语气自然，不用「您好」「亲」这类客套称呼
5. 长度控制在该类型要求的范围内，不要凑字数
6. 语言跟随用户界面的语言`;

  switch (cardType) {
    case "burst_followup":
      return `${common}

【产物定义：渠道跟进消息】
用户要跟进一个最近突然活跃的渠道。
请写一条对外消息——可以是帖子回复、评论、或私信。
内容围绕该渠道最近出现的信号主题，语气自然，不像推销。

长度：2-4 句话。`;

    case "payment_prepare":
      return `${common}

【产物定义：转化触达文案】
用户准备发起一次转化动作。
请写一段可用于触达的话术或 offer 文案——可以是邮件、私信、或产品公告。
客观陈述价值，不做夸张承诺，不制造紧迫感。

长度：3-5 句话。`;

    case "silence_reactivate":
      return `${common}

【产物定义：重新触达开场】
用户要重新激活一个已沉默的渠道。
请写一条重新触达的问候或开场。
不道歉、不解释、不卑不亢，直接给一个继续对话的理由。

长度：2-3 句话。`;

    case "depth_deepen":
      return `${common}

【产物定义：渠道发布内容】
用户要在该渠道发布一条新内容。
请写一段可以直接发布的内容——帖子、评论、或短分享。
围绕已有信号的主题延伸，不重复已有信息。

长度：3-6 句话。`;

    default:
      return `${common}

【产物定义：通用草稿】
请写一段用户可以直接使用的文本，围绕卡片的建议动作展开。

长度：2-5 句话。`;
  }
}

export async function draftActionCard(
  args: DraftActionCardArgs
): Promise<string> {
  const systemPrompt =
    buildActionCardSystemPrompt(args.cardType) + languageDirective();

  const userPrompt = `## 卡片
标题：${args.cardTitle}
建议：${args.cardBody}

## 相关信号（用户自己记录的）
${args.signalsContext || "（无）"}

请直接输出用户可以使用的那段文字。`;

  const messages: AiMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  const handle = streamChat(
    {
      messages,
      purpose: "action_card_draft",
      projectId: null,
      apiBase: args.settings.api_base,
      apiKey: args.settings.api_key,
      model: args.settings.model,
      temperature: args.settings.temperature,
    },
    { onDelta: args.onDelta }
  );

  return handle.promise;
}

/* ---------------- 草稿点评（v1.1 冷启动 - 镜像模式） ---------------- */

export interface ReviewDraftArgs {
  draft: string;
  context?: string;
  settings: AiSettings;
  onDelta?: (delta: string) => void;
}

export async function reviewDraft(args: ReviewDraftArgs): Promise<string> {
  const systemPrompt = `你是一个懂内容但不创作内容的人。

【任务】
用户写了一段准备发到社交平台的内容。你**只给一条建议**。

【硬性规则】
1. 只给一条。不是三条，不是五条。
2. 不超过 30 个字。
3. 不重写用户的内容，不给示范。
4. 指出的是可以改进的方向，不是错误。
5. 如果内容已经不错，就说"可以发了"。
6. 不评价"好/不好"，只说"可以试试 X"。

【反面例子，不要这样】
❌ "整体不错，但建议加强开头的吸引力，可以试试用问句…"
❌ "开头太笼统，应该具体说明问题"
❌ "这段话可以优化为：xxx"

【正面例子】
✅ "开头那个数字，再具体一点会更抓人。"
✅ "结尾可以加一句你想让他们做什么。"
✅ "可以发了。"`;

  const userPrompt = `用户写的内容：

${args.draft}

${args.context ? `背景：${args.context}` : ""}

给一条建议。`;

  const messages: AiMessage[] = [
    { role: "system", content: systemPrompt + languageDirective() },
    { role: "user", content: userPrompt },
  ];

  const handle = streamChat(
    {
      messages,
      purpose: "cold_start_review",
      projectId: null,
      apiBase: args.settings.api_base,
      apiKey: args.settings.api_key,
      model: args.settings.model,
      temperature: 0.5,
    },
    { onDelta: args.onDelta }
  );

  return handle.promise;
}

/* ---------------- 冷启动反馈（AI 打分 + 认可 + 方向） ---------------- */

export interface RateDraftArgs {
  draft: string;
  projectName: string;
  projectContext?: string;
  settings: AiSettings;
  onDelta?: (delta: string) => void;
}

export interface RateDraftResult {
  score: number;
  recognition: string;
  direction: string;
}

export async function rateDraft(args: RateDraftArgs): Promise<RateDraftResult> {
  const systemPrompt = `你是一个读过很多独立开发者发布内容的人。

【任务】
用户刚写完一段准备发布的内容。你认真读完，给出三样东西：
1. score：一个 1-5 的整数
2. recognition：一句话，说清"我看到了什么"
3. direction：一句话，说清"你可以试试"

【recognition 的唯一来源】
只能从「用户写的内容」里读。
不许引用任何不在草稿里出现过的信息。
如果说不出用户草稿里实际出现过的词或句，就返回空字符串。

【打分标准，只给你自己看】
5 = 有具体场景、有细节、读起来像真的有人在做东西
4 = 具体，但有一两个地方可以更实
3 = 方向对，但还很笼统
2 = 更多是"介绍产品"，不是"分享在做的事"
1 = 完全是空话、模板、或只有几个字的敷衍

【硬性规则】
- score 必须是 1-5 的整数
- recognition 不超过 40 字
- direction 不超过 40 字，必须是可执行的动作
- 低分不要打击用户，高分不要吹捧
- 不用"您"、"亲"、"小伙伴"

【输出格式，严格 JSON】
{"score": 4, "recognition": "...", "direction": "..."}

只输出 JSON，不要解释、不要 markdown 代码块标记。`;

  const userPrompt = `【项目名称】
${args.projectName}

【用户写的内容（唯一评分和 recognition 依据）】
${args.draft}

【项目背景（仅供理解，不要在 recognition 里引用）】
${args.projectContext || "（无）"}

按格式返回 JSON。`;

  const messages: AiMessage[] = [
    { role: "system", content: systemPrompt + languageDirective() },
    { role: "user", content: userPrompt },
  ];

  const handle = streamChat(
    {
      messages,
      purpose: "cold_start_rate",
      projectId: null,
      apiBase: args.settings.api_base,
      apiKey: args.settings.api_key,
      model: args.settings.model,
      temperature: 0.3,
    },
    { onDelta: args.onDelta }
  );

  const TIMEOUT_MS = 15000;
  const timer = setTimeout(() => {
    void handle.cancel();
  }, TIMEOUT_MS);

  try {
    const raw = await handle.promise;
    clearTimeout(timer);

    const parsed = extractJson(raw);
    if (!parsed) {
      return { score: 3, recognition: "", direction: "" };
    }

    const score = Number(parsed.score);
    return {
      score: Number.isFinite(score)
        ? Math.max(1, Math.min(5, Math.round(score)))
        : 3,
      recognition:
        typeof parsed.recognition === "string" ? parsed.recognition : "",
      direction: typeof parsed.direction === "string" ? parsed.direction : "",
    };
  } catch (e) {
    clearTimeout(timer);
    console.error("[rateDraft] error:", e);
    return { score: 3, recognition: "", direction: "" };
  }
}