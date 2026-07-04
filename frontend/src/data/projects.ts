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
    stack: ["Next.js", "TypeScript", "Tailwind", "LocalStorage"],
    signal: {
      en: "Combines public growth signals with a private learning dashboard.",
      zh: "把公开成长信号和私有学习工作台合在一起。",
    },
    nextStep: {
      en: "Ship the public shell, dashboard gate, Todo, and Learning modules.",
      zh: "交付公开站点、Dashboard 门禁、Todo 和 Learning 模块。",
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
    stack: ["React state", "Local-first data", "Typed models"],
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
      en: "LocalStorage is enough for v1, but long-term sync needs a backend boundary.",
      zh: "v1 使用 LocalStorage 足够，但长期同步需要清晰的后端边界。",
    },
    stack: ["FastAPI", "PostgreSQL", "JWT"],
    signal: {
      en: "Planned as a repository replacement, not a page rewrite.",
      zh: "未来作为 repository 替换，而不是重写页面。",
    },
    nextStep: {
      en: "Keep v1 components independent from storage details.",
      zh: "保持 v1 组件不依赖具体存储细节。",
    },
  },
];