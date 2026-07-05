export type AIProviderType = "openai_compatible";

export type AIProviderConfig = {
  id: string;
  providerType: AIProviderType;
  displayName: string;
  baseUrl: string;
  model: string;
  enabled: boolean;
  isDefault: boolean;
  hasApiKey: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AIProviderInput = {
  providerType: AIProviderType;
  displayName: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  enabled: boolean;
  isDefault?: boolean;
};

export type AIProviderPatch = Partial<{
  displayName: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  enabled: boolean;
  isDefault: boolean;
}>;

export type LearningGoalInput = {
  target: string;
  currentLevel: string;
  deadline?: string;
  weeklyHours: number;
  preferredStack: string[];
  constraints: string;
};

export type LearningPlanDraft = {
  id: string;
  title: string;
  summary: string;
  goals: Array<{ title: string; targetYear?: string }>;
  learningItems: Array<{
    title: string;
    area: string;
    status: string;
    progress: number;
    notes: string;
    tags: string[];
  }>;
  todos: Array<{ title: string; priority: string; dueDate?: string; tags: string[] }>;
  notePrompts: Array<{ title: string; category: string; prompt: string; tags: string[] }>;
  status: string;
  createdAt: string;
};

export type PlannerCommitResult = {
  draftId: string;
  status: string;
  goalsCreated: number;
  learningItemsCreated: number;
  todosCreated: number;
  notesCreated: number;
};

export type AIProviderTestResult = {
  providerId: string;
  ok: boolean;
  message: string;
};
