// 真实感的发布案例 —— 不是"AI 写的模板"，是"别人发过的内容"
// 用途：用户选「看别人怎么写的」时展示
// 原则：
//   1. 第一人称、具体、平静，没有营销词
//   2. 每条带一句点评，说清"为什么这么写好"
//   3. 定期轮换，用户点「换一批」看到不同的

export interface ColdStartCase {
  id: string;
  source: string;
  content: string;
  whyItWorks: string;
}

export const CASES: ColdStartCase[] = [
  {
    id: "c1",
    source: "V2EX",
    content:
      "花了两个周末写了个小工具，帮自己把散落在 Notion / 飞书 / 微信里的用户反馈整合到一块。之前是手动搬，现在点一下就行。还没开源，先自己用几天。",
    whyItWorks: "开头说清场景，中间说清做法，结尾留白不推销。读者会自己问「能试试吗」。",
  },
  {
    id: "c2",
    source: "小红书",
    content:
      "做了一个特别小的东西：输入一段文字，自动生成三种不同风格的封面。因为我每次做封面都纠结一小时，干脆写个工具治自己的病。截图放下面了。",
    whyItWorks: "用「治自己的病」代替「解决痛点」，让读者觉得真实。截图是必要的证据。",
  },
  {
    id: "c3",
    source: "即刻",
    content:
      "做了一个 Chrome 插件，自动把当前网页存成 markdown。因为我发现自己在手机、电脑、iPad 上收藏了一堆链接，从来没打开过。存成 markdown 至少能进本地文件夹。",
    whyItWorks: "从一个具体小问题切入，不做宏大叙事。独立开发者的日常感。",
  },
  {
    id: "c4",
    source: "V2EX",
    content:
      "写了 3 个月的侧项目终于能用了。它是一个 CLI，把 GitHub issue 自动整理成周报。之前每周手动整理要一小时，现在跑一条命令。第一版肯定有 bug，轻拍。",
    whyItWorks: "「3 个月」「一小时」这些具体数字让内容可信。承认 bug 反而增加好感。",
  },
  {
    id: "c5",
    source: "小红书",
    content:
      "在做一个 AI 写作辅助，但是不做那种「一键生成」的。我的想法是：你写，我在旁边提醒你哪个词用得太空。目前还在做第一个版本，手边有 5 个朋友在试。",
    whyItWorks: "说清「不做什么」比说清「做什么」更有说服力。有朋友试用说明有人在用。",
  },
  {
    id: "c6",
    source: "GitHub",
    content:
      "ShipSignal v1.1 发布了。加了一个新功能：它不再只是帮你记录决策，而是从你的记录里认出模式，然后给你一条具体的行动建议。全部本地跑，不联网。",
    whyItWorks: "「从 X 到 Y」的结构，说清版本升级的实质。技术名词加上一句白话解释。",
  },
  {
    id: "c7",
    source: "即刻",
    content:
      "把自己的记账流程重做了一遍。不是做个记账 App，是做个小脚本：每天抓一下支付宝账单，汇总成一份 markdown。省掉的不是记账时间，是打开记账 App 的那 3 秒。",
    whyItWorks: "「不是做 X，是做 Y」这个句式能让人记住。结尾一句话点破核心价值。",
  },
  {
    id: "c8",
    source: "小红书",
    content:
      "做了一周的小工具终于能跑了。它帮我把下载文件夹里的截图按日期分类。以前手机截图丢过去就找不到了，现在按天归类。功能很简陋，但是我自己每天都用。",
    whyItWorks: "「简陋但自己每天用」是最有说服力的一句话。承认简陋反而可信。",
  },
  {
    id: "c9",
    source: "V2EX",
    content:
      "业余时间做的东西上线了，是一个给独立开发者用的项目 checklist。我不擅长营销，就直接说吧：这个工具帮我少忘掉了 3 次发版前必须做的事。",
    whyItWorks: "「不擅长营销就直接说吧」这句话本身最打动开发者。数字（3 次）也是具体价值。",
  },
];

/** 随机抽 N 条 */
export function pickCases(n: number = 3): ColdStartCase[] {
  const shuffled = [...CASES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}