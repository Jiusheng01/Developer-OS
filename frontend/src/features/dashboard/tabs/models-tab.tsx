"use client";

import { FormEvent, useEffect, useState } from "react";
import { Boxes, CheckCircle2, KeyRound, Pencil, Plus, Power, RadioTower, Save, Star, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createAIProvider,
  deleteAIProvider,
  listAIProviders,
  setDefaultAIProvider,
  testAIProvider,
  updateAIProvider,
} from "@/features/ai/data/ai-api";
import type { AIProviderConfig, AIProviderPatch } from "@/features/ai/data/types";
import { DashboardEmptyState } from "@/features/dashboard/components/dashboard-empty-state";
import { DashboardPanelMotion } from "@/features/dashboard/components/dashboard-motion";
import { DashboardSection } from "@/features/dashboard/components/dashboard-section";
import { DashboardStatusStrip } from "@/features/dashboard/components/dashboard-status-strip";
import { getApiErrorMessage } from "@/lib/api/error-message";
import { copy } from "@/lib/i18n/copy";
import { useLocale } from "@/lib/i18n/locale-provider";
import { cn } from "@/lib/utils";

const PROVIDER_PRESETS = [
  {
    id: "openai",
    providerName: "OpenAI",
    displayName: "OpenAI Planner",
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4.1-mini",
  },
  {
    id: "deepseek",
    providerName: "DeepSeek",
    displayName: "DeepSeek Planner",
    baseUrl: "https://api.deepseek.com",
    model: "deepseek-chat",
  },
  {
    id: "qwen",
    providerName: "Qwen",
    displayName: "Qwen Planner",
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    model: "qwen-plus",
  },
  {
    id: "doubao",
    providerName: "Doubao",
    displayName: "Doubao Planner",
    baseUrl: "https://ark.cn-beijing.volces.com/api/v3",
    model: "doubao-seed-1-6-250615",
  },
  {
    id: "zhipu",
    providerName: "Zhipu",
    displayName: "Zhipu Planner",
    baseUrl: "https://open.bigmodel.cn/api/paas/v4",
    model: "glm-4-flash",
  },
  {
    id: "openrouter",
    providerName: "OpenRouter",
    displayName: "OpenRouter Planner",
    baseUrl: "https://openrouter.ai/api/v1",
    model: "openai/gpt-4o-mini",
  },
  {
    id: "ollama",
    providerName: "Ollama",
    displayName: "Ollama Local Planner",
    baseUrl: "http://127.0.0.1:11434/v1",
    model: "llama3.1",
  },
] as const;

type ProviderPreset = (typeof PROVIDER_PRESETS)[number];
type ProviderPresetId = ProviderPreset["id"];

export function ModelsTab() {
  const { locale } = useLocale();
  const t = copy[locale].dashboard.models;
  const [providers, setProviders] = useState<AIProviderConfig[]>([]);
  const [displayName, setDisplayName] = useState("OpenAI Compatible");
  const [baseUrl, setBaseUrl] = useState("https://api.openai.com/v1");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("gpt-4.1-mini");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingProviderId, setUpdatingProviderId] = useState<string | undefined>();
  const [testingProviderId, setTestingProviderId] = useState<string | undefined>();
  const [editingProviderId, setEditingProviderId] = useState<string | undefined>();
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | undefined>();
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editBaseUrl, setEditBaseUrl] = useState("");
  const [editModel, setEditModel] = useState("");
  const [editApiKey, setEditApiKey] = useState("");
  const [selectedPresetId, setSelectedPresetId] = useState<ProviderPresetId | undefined>();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    void listAIProviders()
      .then((loadedProviders) => {
        if (!cancelled) setProviders(loadedProviders);
      })
      .catch((requestError: unknown) => {
        if (!cancelled) setError(getApiErrorMessage(requestError, "AI provider request failed"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function applyPreset(preset: ProviderPreset) {
    setDisplayName(preset.displayName);
    setBaseUrl(preset.baseUrl);
    setModel(preset.model);
    setApiKey("");
    setSelectedPresetId(preset.id);
    setError("");
    setMessage(t.presetApplied.replace("{provider}", preset.providerName));
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!displayName.trim() || !baseUrl.trim() || !apiKey.trim() || !model.trim()) {
      setError(t.required);
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const provider = await createAIProvider({
        providerType: "openai_compatible",
        displayName: displayName.trim(),
        baseUrl: baseUrl.trim(),
        apiKey: apiKey.trim(),
        model: model.trim(),
        enabled: true,
      });
      setProviders((current) => [provider, ...current.filter((item) => item.id !== provider.id)]);
      setApiKey("");
      setMessage(t.saved);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "AI provider request failed"));
    } finally {
      setSaving(false);
    }
  }

  function startEditing(provider: AIProviderConfig) {
    setError("");
    setMessage("");
    setConfirmingDeleteId(undefined);
    setEditingProviderId(provider.id);
    setEditDisplayName(provider.displayName);
    setEditBaseUrl(provider.baseUrl);
    setEditModel(provider.model);
    setEditApiKey("");
  }

  function cancelEditing() {
    setEditingProviderId(undefined);
    setEditDisplayName("");
    setEditBaseUrl("");
    setEditModel("");
    setEditApiKey("");
  }

  async function handleSaveEdit(providerId: string) {
    if (!editDisplayName.trim() || !editBaseUrl.trim() || !editModel.trim()) {
      setError(t.editRequired);
      return;
    }

    const patch: AIProviderPatch = {
      displayName: editDisplayName.trim(),
      baseUrl: editBaseUrl.trim(),
      model: editModel.trim(),
    };
    if (editApiKey.trim()) {
      patch.apiKey = editApiKey.trim();
    }

    setError("");
    setMessage("");
    setUpdatingProviderId(providerId);
    try {
      const updated = await updateAIProvider(providerId, patch);
      setProviders((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      cancelEditing();
      setMessage(t.updated);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "AI provider request failed"));
    } finally {
      setUpdatingProviderId(undefined);
    }
  }

  async function handleSetDefault(providerId: string) {
    setError("");
    setMessage("");
    setConfirmingDeleteId(undefined);
    setUpdatingProviderId(providerId);
    try {
      const provider = await setDefaultAIProvider(providerId);
      setProviders((current) => current.map((item) => (item.id === provider.id ? provider : { ...item, isDefault: false })));
      setMessage(t.defaultUpdated);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "AI provider request failed"));
    } finally {
      setUpdatingProviderId(undefined);
    }
  }

  async function handleToggle(provider: AIProviderConfig) {
    setError("");
    setMessage("");
    setConfirmingDeleteId(undefined);
    setUpdatingProviderId(provider.id);
    try {
      const updated = await updateAIProvider(provider.id, { enabled: !provider.enabled });
      setProviders((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setMessage(t.updated);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "AI provider request failed"));
    } finally {
      setUpdatingProviderId(undefined);
    }
  }

  async function handleDelete(providerId: string) {
    if (confirmingDeleteId !== providerId) {
      setError("");
      setMessage(t.deletePending);
      setConfirmingDeleteId(providerId);
      return;
    }

    setError("");
    setMessage("");
    setUpdatingProviderId(providerId);
    try {
      await deleteAIProvider(providerId);
      setProviders((current) => current.filter((provider) => provider.id !== providerId));
      setConfirmingDeleteId(undefined);
      setMessage(t.deleted);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "AI provider request failed"));
    } finally {
      setUpdatingProviderId(undefined);
    }
  }

  async function handleTestProvider(providerId: string) {
    setError("");
    setMessage("");
    setConfirmingDeleteId(undefined);
    setTestingProviderId(providerId);
    try {
      const result = await testAIProvider(providerId);
      setMessage(result.message);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "AI provider request failed"));
    } finally {
      setTestingProviderId(undefined);
    }
  }

  return (
    <div className="grid gap-5">
      <DashboardPanelMotion>
        <DashboardSection title={t.presetsTitle} description={t.presetsDescription} icon={RadioTower} contentClassName="grid gap-3">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {PROVIDER_PRESETS.map((preset) => {
              const selected = selectedPresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => applyPreset(preset)}
                  className={cn(
                    "min-h-40 rounded-md border bg-background/70 p-3 text-left transition hover:border-primary/50 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    selected ? "border-primary bg-primary/10" : "border-border",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{preset.providerName}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{t.plannerChatModel}</p>
                    </div>
                    <Badge variant="outline">{t.openAICompatible}</Badge>
                  </div>
                  <p className="mt-3 min-h-10 text-xs leading-5 text-muted-foreground">{t.presetDescriptions[preset.id]}</p>
                  <div className="mt-3 grid gap-1 text-xs">
                    <p className="truncate text-foreground">
                      <span className="text-muted-foreground">{t.model}: </span>
                      {preset.model}
                    </p>
                    <p className="break-all text-muted-foreground">{preset.baseUrl}</p>
                  </div>
                </button>
              );
            })}
          </div>
          <p className="text-xs leading-5 text-muted-foreground">{t.presetsHint}</p>
        </DashboardSection>
      </DashboardPanelMotion>

      <DashboardPanelMotion>
        <DashboardSection title={t.title} description={t.description} icon={Boxes}>
          <form className="grid gap-3 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.2fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_auto]" onSubmit={handleCreate}>
            <Input
              value={displayName}
              onChange={(event) => {
                setDisplayName(event.target.value);
                setSelectedPresetId(undefined);
              }}
              placeholder={t.displayName}
              aria-label={t.displayName}
            />
            <Input
              value={baseUrl}
              onChange={(event) => {
                setBaseUrl(event.target.value);
                setSelectedPresetId(undefined);
              }}
              placeholder={t.baseUrl}
              aria-label={t.baseUrl}
            />
            <Input
              value={model}
              onChange={(event) => {
                setModel(event.target.value);
                setSelectedPresetId(undefined);
              }}
              placeholder={t.model}
              aria-label={t.model}
            />
            <Input value={apiKey} onChange={(event) => setApiKey(event.target.value)} type="password" placeholder={t.apiKey} aria-label={t.apiKey} />
            <Button type="submit" disabled={saving}>
              <Plus className="h-4 w-4" />
              {saving ? t.saving : t.add}
            </Button>
          </form>
        </DashboardSection>
      </DashboardPanelMotion>

      {error ? <DashboardStatusStrip title={t.errorTitle} detail={error} variant="warning" /> : null}
      {message ? <DashboardStatusStrip title={message} variant="info" /> : null}

      <DashboardSection title={t.providers} description={t.providersDescription} icon={KeyRound} contentClassName="grid gap-3">
        {loading ? <DashboardEmptyState title={t.loading} icon={Boxes} /> : null}
        {!loading && providers.length === 0 ? <DashboardEmptyState title={t.emptyTitle} description={t.emptyDescription} icon={Boxes} /> : null}
        {providers.map((provider) => {
          const editing = editingProviderId === provider.id;
          const busy = updatingProviderId === provider.id || testingProviderId === provider.id;
          const confirmingDelete = confirmingDeleteId === provider.id;

          return (
            <div key={provider.id} className="rounded-md border bg-background/70 p-4">
              {editing ? (
                <form
                  className="grid gap-3"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void handleSaveEdit(provider.id);
                  }}
                >
                  <div className="grid gap-3 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.2fr)_minmax(0,0.8fr)_minmax(0,0.8fr)]">
                    <Input value={editDisplayName} onChange={(event) => setEditDisplayName(event.target.value)} placeholder={t.displayName} aria-label={t.displayName} />
                    <Input value={editBaseUrl} onChange={(event) => setEditBaseUrl(event.target.value)} placeholder={t.baseUrl} aria-label={t.baseUrl} />
                    <Input value={editModel} onChange={(event) => setEditModel(event.target.value)} placeholder={t.model} aria-label={t.model} />
                    <Input value={editApiKey} onChange={(event) => setEditApiKey(event.target.value)} type="password" placeholder={t.apiKeyOptional} aria-label={t.apiKeyOptional} />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="submit" size="sm" disabled={busy}>
                      <Save className="h-4 w-4" />
                      {t.save}
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={cancelEditing} disabled={busy}>
                      <X className="h-4 w-4" />
                      {t.cancel}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{provider.displayName}</p>
                      {provider.isDefault ? <Badge>{t.default}</Badge> : null}
                      <Badge variant={provider.enabled ? "secondary" : "outline"}>{provider.enabled ? t.enabled : t.disabled}</Badge>
                    </div>
                    <p className="mt-2 truncate text-sm text-muted-foreground">{provider.baseUrl}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t.model}: {provider.model} · {provider.hasApiKey ? t.keyStored : t.keyMissing}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => startEditing(provider)} disabled={busy}>
                      <Pencil className="h-4 w-4" />
                      {t.edit}
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => void handleSetDefault(provider.id)} disabled={provider.isDefault || busy}>
                      <Star className="h-4 w-4" />
                      {t.setDefault}
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => void handleTestProvider(provider.id)} disabled={busy || !provider.enabled}>
                      <RadioTower className="h-4 w-4" />
                      {testingProviderId === provider.id ? t.testing : t.test}
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => void handleToggle(provider)} disabled={busy}>
                      {provider.enabled ? <Power className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                      {provider.enabled ? t.disable : t.enable}
                    </Button>
                    <Button type="button" size="sm" variant="destructive" onClick={() => void handleDelete(provider.id)} disabled={busy}>
                      <Trash2 className="h-4 w-4" />
                      {confirmingDelete ? t.confirmDelete : t.delete}
                    </Button>
                    {confirmingDelete ? (
                      <Button type="button" size="sm" variant="outline" onClick={() => setConfirmingDeleteId(undefined)} disabled={busy}>
                        <X className="h-4 w-4" />
                        {t.cancel}
                      </Button>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </DashboardSection>
    </div>
  );
}
