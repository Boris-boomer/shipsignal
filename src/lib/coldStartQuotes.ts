// 冷启动文案池 —— 不可证伪的社交证明
//
// 原则：
//   1. 不编造可被戳穿的具体数字（"200+人在尝试" 这种会被穿帮）
//   2. 只给情绪共鸣和方向确认，用户无法证伪
//   3. 每个赛道 4 种角度 × 6 条 = 24 条
//   4. 用完再洗牌，同一项目短期内不重复

export type QuoteAngle = "pain" | "direction" | "companionship" | "humor";

interface QuotePool {
  pain: string[];
  direction: string[];
  companionship: string[];
  humor: string[];
}

/* ---------------- 通用池（赛道未选时） ---------------- */

export const GENERIC_QUOTES: QuotePool = {
  pain: [
    "空的项目，是最有想象力的项目。",
    "你不需要准备好，你只需要开始。",
    "看着空白的页面发呆，这件事每个做产品的人都干过。",
    "不知道怎么开始，是因为你想一次就做对。",
    "没人告诉过你第一步该踩哪里，这很正常。",
    "最难的不是做，是决定做什么。",
  ],
  direction: [
    "每个人都是从这里开始的。",
    "发出去比发对重要。先发，再改。",
    "第一条不用好，只需要存在。",
    "你不需要一整套策略，你只需要一句话。",
    "先做一版最丑的，后面再修。",
    "方向是走出来的，不是想出来的。",
  ],
  companionship: [
    "你走的时候，就是你在走你自己的。",
    "有人走通过这条路，也有人摔过。都一样。",
    "你不是第一个，也不会是最后一个。",
    "现在有很多人和你一样，面对着同一个空白页。",
    "不需要一个人扛。慢慢来。",
    "这条路上，停下来的人比走完的人多。但停一下也没关系。",
  ],
  humor: [
    "产品经理的第一次发布，通常是自己给自己点了个赞。",
    "你写的东西可能没人看。但写了就比没写好。",
    "如果一开始就顺利，那这件事就没意思了。",
    "别想着改变世界，先想着让别人看一眼。",
    "发出去之后你可能会后悔。但不发你一定会后悔。",
    "做好没人理的准备。然后你会发现，其实有人理。",
  ],
};

/* ---------------- 各赛道专属池 ---------------- */

export const TRACK_QUOTES: Record<string, QuotePool> = {
  efficiency: {
    pain: [
      "做效率工具的人，最容易被效率困住。",
      "你想帮别人省时间，自己的时间却不够用。",
      "工具做完了，发现最需要它的人是自己。",
    ],
    direction: [
      "效率工具的说服力，来自一个具体场景，不是一个功能列表。",
      "先展示它解决了一个什么问题，再说它有什么功能。",
    ],
    companionship: [
      "效率工具这个赛道，做的人多，活下来的少。不是因为你不够好，是因为太挤了。",
      "你手里那个小工具，可能正好是某个人找了很久的东西。",
    ],
    humor: [
      "别人做效率工具是为了赚钱，你做效率工具是为了让自己少加班。",
      "效率工具最大的用户群，是做效率工具的人。",
    ],
  },

  ai_tool: {
    pain: [
      "AI 工具最怕的不是没功能，是没人觉得它有用。",
      "所有人都说自己在做 AI，但很少有人说得清自己做的到底是什么。",
      "你花了三个月调模型，用户三秒钟决定要不要继续看。",
    ],
    direction: [
      "AI 产品不需要解释技术，只需要展示效果。",
      "让人看到 AI 做了什么，比让人知道 AI 怎么做的更有用。",
    ],
    companionship: [
      "做 AI 工具的人，每天都在面对一个不确定的黑箱。习惯它。",
      "2026 年做 AI 产品，最不缺的就是竞争。但最缺的，是有人真的用。",
    ],
    humor: [
      "你的 AI 可能不如隔壁的，但你的文案可以比隔壁的真诚。",
      "AI 能帮你做很多东西，但帮不了你发第一条内容。",
    ],
  },

  dev_tool: {
    pain: [
      "开发者做的工具，最容易犯的错是只给开发者看。",
      "你觉得很酷的技术，用户可能完全不关心。",
      "写了三万字文档，没人看。一条十秒视频，来了一百个人。",
    ],
    direction: [
      "给开发者做的工具，先让开发者觉得爽，再让他们告诉别人。",
      "开发者是最好伺候的用户，也是最难取悦的用户。",
    ],
    companionship: [
      "每个开发者工具的作者，都经历过发完帖零回复的沉默。",
      "你不孤独。每个做开发者工具的人，都在同一个论坛里挣扎。",
    ],
    humor: [
      "你以为发布之后会收到 star，结果收到的是自己的心跳声。",
      "开发者工具的第一条用户反馈，通常来自作者的小号。",
    ],
  },

  content: {
    pain: [
      "做内容的人最怕的不是没灵感，是发了没人看。",
      "你写了一百篇，爆的可能只是第三十七篇。",
    ],
    direction: [
      "内容不需要完美，需要被看见。",
      "先写你能写出来的，再写你想写出来的。",
    ],
    companionship: [
      "每个做内容的人，都经历过连续三天零阅读的阶段。",
      "写得好的不一定被看到，被看到的也不一定写得好。但坚持写的人，迟早会被看到。",
    ],
    humor: [
      "内容创作者最大的敌人，是上一秒的自己。",
      "你把最好的内容发出去，它没火。你把最随便发出去，它火了。",
    ],
  },

  learning: {
    pain: [
      "做学习产品的人，最怕用户学完就走。",
      "你想帮人学东西，但别人可能连打开的动力都没有。",
    ],
    direction: [
      "学习类产品的第一步，是让人觉得自己学到了东西。",
      "先给一个小的成就感，再给一个大的学习路径。",
    ],
    companionship: [
      "学习产品这个赛道，慢热，但一旦热起来就不容易凉。",
      "你的第一个用户，可能只是想找个借口坚持学下去。",
    ],
    humor: [
      "学习产品最大的竞争对手，是短视频。",
      "你花三个月做了一门课，别人花三秒钟决定要不要看。",
    ],
  },

  lifestyle: {
    pain: [
      "生活类产品最难的不是做出来，是让人知道它存在。",
      "你想让生活变好一点，但大多数人觉得自己生活还行。",
    ],
    direction: [
      "生活类产品不需要解决大问题，只需要让一个小瞬间变好。",
      "展示一个具体的生活场景，比展示一个功能有用得多。",
    ],
    companionship: [
      "做生活类产品的人，往往自己就是第一个用户。",
      "你不需要说服所有人，只需要找到那批和你一样的人。",
    ],
    humor: [
      "生活类产品最容易陷入的陷阱：你自己觉得好用，别人觉得用不上。",
      "你以为在做产品，其实在做自己的生活方式。",
    ],
  },

  monetization: {
    pain: [
      "做变现产品的人，最怕的是自己都不想付钱。",
      "你想帮别人赚钱，但你自己还没赚到。",
    ],
    direction: [
      "变现产品先讲清楚，别人付钱能得到什么，而不是你有什么功能。",
      "收入是结果，不是目标。先帮别人解决问题，再想怎么收钱。",
    ],
    companionship: [
      "每个做变现产品的人，都经历过第一笔收入之前的漫长等待。",
      "你不是唯一一个盯着后台刷新数据的人。",
    ],
    humor: [
      "做变现产品的人，最容易在定价上纠结三个月。",
      "你定价的时候觉得自己在收钱，用户看的时候觉得自己在花钱。",
    ],
  },

  other: {
    pain: [
      "不知道自己在做什么赛道，这本身就是一种赛道。",
      "所有赛道看起来都有人做了，但你做的这一版还没人做。",
    ],
    direction: [
      "不用急着归类。先做出来，再想它属于什么。",
      "赛道是别人总结的，你不需要按别人的地图走。",
    ],
    companionship: [
      "做没人做过的东西，最容易觉得自己在做错的事。",
      "你觉得自己在瞎搞，但很多好东西都是瞎搞出来的。",
    ],
    humor: [
      "如果所有人都能理解你在做什么，那你可能在做一件很普通的事。",
      "你的产品可能不属于任何赛道。这也是一个赛道。",
    ],
  },
};

/* ---------------- 随机抽取（不重复 + 洗牌） ---------------- */

const recentQuotes = new Map<string, string[]>();
const MAX_RECENT = 8;

/** 从池子里随机抽一条，尽量不重复最近抽过的 */
export function pickQuote(projectId: string, pool: string[]): string {
  if (pool.length === 0) return "";

  const recent = recentQuotes.get(projectId) ?? [];
  const available = pool.filter((q) => !recent.includes(q));

  // 如果可选池空了，重置历史
  const candidates = available.length > 0 ? available : pool;
  const picked = candidates[Math.floor(Math.random() * candidates.length)];

  // 更新最近记录
  const nextRecent = [...recent, picked].slice(-MAX_RECENT);
  recentQuotes.set(projectId, nextRecent);

  return picked;
}

/** 按赛道 + 角度抽文案 */
export function pickTrackedQuote(
  projectId: string,
  track: string | null,
  angles: QuoteAngle[] = ["pain", "direction", "companionship", "humor"]
): string {
  const pool = track
    ? TRACK_QUOTES[track] ?? TRACK_QUOTES.other
    : GENERIC_QUOTES;

  const angle = angles[Math.floor(Math.random() * angles.length)];
  const quotes = pool[angle];
  return pickQuote(projectId, quotes.length > 0 ? quotes : pool.pain);
}

/** 情绪反馈文案 */
export function pickMoodResponse(
  mood: string,
  projectId: string
): string {
  const map: Record<string, string[]> = {
    confident: [
      "记住这个感觉。下次没底的时候回来看看。",
      "这个方向，值得再走一步。",
      "感觉对了就继续。不用想太多。",
    ],
    ok: [
      "'还行'是好状态。期望太高反而走不远。",
      "发出去就行。你已经比昨天多走了一步。",
      "不用激动。保持这个节奏。",
    ],
    unsure: [
      "没底说明你在做新的东西。这是好事。",
      "不确定的时候，先继续走。答案在后面。",
      "没底是正常的。每个认真做东西的人都会没底。",
    ],
    retry: [
      "换一个开头。试错是唯一的捷径。",
      "再来一次。这次换个角度。",
      "想再试，就再试。反正没人拦你。",
    ],
  };
  const pool = map[mood] ?? map.ok;
  return pool[Math.floor(Math.random() * pool.length)];
}

/** 进度鼓励语 */
export function pickProgressMessage(attempts: number): string {
  if (attempts <= 1) return "第一步，最难，你走完了。";
  if (attempts <= 3) return `已经在 ShipSignal 里试了 ${attempts} 次。每一次都算数。`;
  if (attempts <= 7) return `${attempts} 次了。你没有在等，你在走。`;
  if (attempts <= 15) return `${attempts} 次。大多数人到这里已经停了。你没有。`;
  return `${attempts} 次。你已经不需要鼓励了。`;
}