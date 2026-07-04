import type { Localized } from "@/data/types";

export type LearningTrack = {
  id: string;
  title: Localized<string>;
  status: "active" | "next" | "review";
  progress: number;
  description: Localized<string>;
  modules: Localized<string[]>;
  milestone: Localized<string>;
};

export const learningTracks: LearningTrack[] = [
  {
    id: "frontend-architecture",
    title: { en: "Frontend Architecture", zh: "前端架构" },
    status: "active",
    progress: 65,
    description: {
      en: "Build maintainable product interfaces with typed data and reusable components.",
      zh: "用类型化数据和可复用组件构建可维护的产品界面。",
    },
    modules: {
      en: ["Next.js App Router", "Component boundaries", "Tailwind systems"],
      zh: ["Next.js App Router", "组件边界", "Tailwind 设计系统"],
    },
    milestone: {
      en: "Ship the Developer OS public site and dashboard shell.",
      zh: "交付 Developer OS 公开站点和 Dashboard Shell。",
    },
  },
  {
    id: "ai-engineering",
    title: { en: "AI Engineering Foundations", zh: "AI 工程化基础" },
    status: "active",
    progress: 42,
    description: {
      en: "Learn how AI features fit into real products, workflows, and evaluation loops.",
      zh: "学习 AI 功能如何进入真实产品、工作流和评估循环。",
    },
    modules: {
      en: ["Prompt workflows", "Tool orchestration", "Evaluation thinking"],
      zh: ["提示词工作流", "工具编排", "评估思维"],
    },
    milestone: {
      en: "Design an AI-assisted learning review module after v1 stabilizes.",
      zh: "在 v1 稳定后设计 AI 辅助学习复盘模块。",
    },
  },
  {
    id: "backend-systems",
    title: { en: "Backend Systems", zh: "后端系统" },
    status: "next",
    progress: 18,
    description: {
      en: "Prepare the app for FastAPI, PostgreSQL, JWT, and synchronized private data.",
      zh: "为 FastAPI、PostgreSQL、JWT 和私有数据同步做准备。",
    },
    modules: {
      en: ["FastAPI API design", "PostgreSQL modeling", "Auth boundaries"],
      zh: ["FastAPI API 设计", "PostgreSQL 建模", "认证边界"],
    },
    milestone: {
      en: "Replace LocalStorage repository with an API repository in v2.",
      zh: "在 v2 中用 API repository 替换 LocalStorage repository。",
    },
  },
];