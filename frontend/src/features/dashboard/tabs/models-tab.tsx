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
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editBaseUrl, setEditBaseUrl] = useState("");
  const [editModel, setEditModel] = useState("");
  const [editApiKey, setEditApiKey] = useState("");
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
    setError("");
    setMessage("");
    setUpdatingProviderId(providerId);
    try {
      await deleteAIProvider(providerId);
      setProviders((current) => current.filter((provider) => provider.id !== providerId));
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
        <DashboardSection title={t.title} description={t.description} icon={Boxes}>
          <form className="grid gap-3 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.2fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_auto]" onSubmit={handleCreate}>
            <Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder={t.displayName} aria-label={t.displayName} />
            <Input value={baseUrl} onChange={(event) => setBaseUrl(event.target.value)} placeholder={t.baseUrl} aria-label={t.baseUrl} />
            <Input value={model} onChange={(event) => setModel(event.target.value)} placeholder={t.model} aria-label={t.model} />
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
                      {t.delete}
                    </Button>
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
