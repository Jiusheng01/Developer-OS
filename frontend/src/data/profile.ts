import type { Localized } from "@/data/types";

export const profile = {
  name: {
    en: "AI Engineer in Progress",
    zh: "成长中的 AI 工程师",
  },
  handle: "Developer OS",
  role: {
    en: "Learning AI engineering through real product systems",
    zh: "通过真实产品系统学习 AI 工程化",
  },
  location: {
    en: "Remote / China",
    zh: "远程 / 中国",
  },
  tagline: {
    en: "A public workbench for projects, learning direction, and daily execution.",
    zh: "一个展示项目、学习方向和每日执行的公开工作台。",
  },
  summary: {
    en: "I am building practical AI engineering skills by turning learning into usable systems: product interfaces, local-first workflows, API-ready data boundaries, and long-term iteration habits.",
    zh: "我正在通过可用系统训练 AI 工程能力：产品界面、本地优先工作流、可替换的数据边界，以及长期迭代习惯。",
  },
  currentFocus: {
    en: [
      "Next.js App Router and TypeScript product architecture",
      "Local-first dashboards that can later move to FastAPI",
      "AI application foundations, evaluation habits, and tool workflows",
    ],
    zh: [
      "Next.js App Router 与 TypeScript 产品架构",
      "未来可迁移到 FastAPI 的本地优先 Dashboard",
      "AI 应用基础、评估习惯与工具工作流",
    ],
  } satisfies Localized<string[]>,
  operatingPrinciples: {
    en: [
      "Build small, useful systems before adding infrastructure",
      "Keep data contracts explicit so the backend can arrive later",
      "Treat learning progress as product material, not private clutter",
    ],
    zh: [
      "先构建小而有用的系统，再添加基础设施",
      "保持数据契约清晰，让后端可以后续接入",
      "把学习进展当成产品素材，而不是私密杂物",
    ],
  } satisfies Localized<string[]>,
  metrics: {
    en: [
      { label: "Mode", value: "Builder", detail: "Learning through shipped interfaces" },
      { label: "Focus", value: "AI + Web", detail: "Product systems and applied tooling" },
      { label: "Cadence", value: "Iterative", detail: "Public growth, private execution" },
    ],
    zh: [
      { label: "模式", value: "构建者", detail: "通过交付界面学习" },
      { label: "方向", value: "AI + Web", detail: "产品系统与应用工具" },
      { label: "节奏", value: "迭代", detail: "公开成长，私下执行" },
    ],
  } satisfies Localized<Array<{ label: string; value: string; detail: string }>>,
  links: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Projects", href: "/projects" },
    { label: "Learning", href: "/learning" },
  ],
} as const;