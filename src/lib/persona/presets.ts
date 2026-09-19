export interface Persona {
  id: string;
  name: string;
  keywords: string[];
}

export const PERSONAS: Persona[] = [
  {
    id: "ai_tool",
    name: "AI 工具",
    keywords: ["llm", "ai-agent", "rag", "openai", "langchain", "prompt"],
  },
  {
    id: "saas",
    name: "SaaS 产品",
    keywords: ["saas", "b2b", "subscription", "stripe", "churn", "onboarding"],
  },
  {
    id: "content",
    name: "内容 / 自媒体",
    keywords: ["newsletter", "youtube", "podcast", "creator", "substack"],
  },
  {
    id: "dev_tool",
    name: "开发者工具",
    keywords: ["cli", "vscode", "developer-tools", "sdk", "api"],
  },
  {
    id: "ecommerce",
    name: "电商 / 独立产品",
    keywords: ["ecommerce", "shopify", "gumroad", "indie", "product-hunt"],
  },
  {
    id: "efficiency",
    name: "效率 / 生产力",
    keywords: ["productivity", "notion", "workflow", "automation", "obsidian"],
  },
];