import type { Localized } from "@/data/types";

export type ProjectStatus = "building" | "planning" | "learning";

export type Project = {
  id: string;
  name: Localized<string>;
  status: ProjectStatus;
  problem: Localized<string>;
  stack: string[];
  signal: Localized<string>;
  nextStep: Localized<string>;
};

export const projects: Project[] = [
  {
    id: "developer-os",
    name: { en: "Developer OS", zh: "Developer OS" },
    status: "building",
    problem: {
      en: "A personal website should also be useful as a daily engineering workspace.",
      zh: "个人网站不应该只展示自己，也应该成为每天可用的工程工作台。",
    },
    stack: ["Next.js", "FastAPI", "SQLAlchemy", "JWT"],
    signal: {
      en: "Combines public growth signals with a private learning dashboard.",
      zh: "把公开成长信号和私有学习工作台合在一起。",
    },
    nextStep: {
      en: "Stabilize the account-backed Dashboard workflow and prepare the next product layer.",
      zh: "稳定账号化 Dashboard 工作流，并准备下一层产品能力。",
    },
  },
  {
    id: "learning-system",
    name: { en: "Learning Management System", zh: "学习管理系统" },
    status: "building",
    problem: {
      en: "Study notes and goals are easy to lose when they are not tied to execution.",
      zh: "学习笔记和目标如果不连接到执行，很容易散落和遗忘。",
    },
    stack: ["React state", "REST API", "Typed models"],
    signal: {
      en: "Turns learning tracks into visible progress and private actions.",
      zh: "把学习路线转化为可见进度和私有行动。",
    },
    nextStep: {
      en: "Connect learning tracks to dashboard tasks and goals.",
      zh: "把学习路线和 Dashboard 里的任务、目标连接起来。",
    },
  },
  {
    id: "future-api",
    name: { en: "FastAPI Data Layer", zh: "FastAPI 数据层" },
    status: "planning",
    problem: {
      en: "The workspace now needs a backend boundary that can later support sync, analytics, and AI features.",
      zh: "工作台现在需要一个后端边界，后续才能支持同步、统计和 AI 功能。",
    },
    stack: ["FastAPI", "PostgreSQL", "JWT"],
    signal: {
      en: "Implemented through the provider boundary so pages stay independent from storage details.",
      zh: "通过 Provider 边界实现，让页面不依赖具体存储细节。",
    },
    nextStep: {
      en: "Prepare the data layer for PostgreSQL deployment and future AI-backed workflows.",
      zh: "为 PostgreSQL 部署和未来 AI 工作流继续打磨数据层。",
    },
  },
];
