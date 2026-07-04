"use client";

import { FormEvent, useState } from "react";
import { ClipboardCopy, Database, Download, KeyRound, Languages, Palette, Trash2, Upload } from "lucide-react";
import { LanguageToggle } from "@/components/shared/language-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DashboardPanelMotion } from "@/features/dashboard/components/dashboard-motion";
import { DashboardProviderBadge } from "@/features/dashboard/components/dashboard-provider-badge";
import { DashboardSection } from "@/features/dashboard/components/dashboard-section";
import { DashboardStatusStrip } from "@/features/dashboard/components/dashboard-status-strip";
import type { DashboardStore } from "@/features/dashboard/hooks/use-dashboard-store";
import type { DashboardImportError } from "@/features/dashboard/types";
import { copy } from "@/lib/i18n/copy";
import { useLocale } from "@/lib/i18n/locale-provider";
import type { ThemePreference } from "@/lib/theme/theme-provider";

const themes: ThemePreference[] = ["system", "light", "dark"];

export function SettingsTab({ store }: { store: DashboardStore }) {
  const { locale } = useLocale();
  const dashboardCopy = copy[locale].dashboard;
  const t = dashboardCopy.settings;
  const [passcode, setPasscode] = useState("");
  const [message, setMessage] = useState("");
  const [exportText, setExportText] = useState("");
  const [importText, setImportText] = useState("");
  const [dataMessage, setDataMessage] = useState("");

  const importErrorMessages: Record<DashboardImportError, string> = {
    empty: t.importEmpty,
    "invalid-json": t.importInvalidJson,
    "invalid-source": t.importInvalidSource,
    "invalid-shape": t.importInvalidShape,
  };

  function handlePasscode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const ok = store.updatePasscode(passcode);
    setMessage(ok ? t.passcodeUpdated : t.passcodeShort);
    if (ok) setPasscode("");
  }

  async function handleGenerateExport() {
    setExportText(await store.exportDashboardData());
    setDataMessage(t.exportReady);
  }

  async function handleCopyExport() {
    const text = exportText || (await store.exportDashboardData());
    setExportText(text);

    if (!("clipboard" in navigator)) {
      setDataMessage(t.copyUnavailable);
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setDataMessage(t.copySuccess);
    } catch {
      setDataMessage(t.copyUnavailable);
    }
  }

  async function handleImport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = await store.importDashboardData(importText);

    if (!result.ok) {
      setDataMessage(importErrorMessages[result.error]);
      return;
    }

    setImportText("");
    setExportText("");
    setDataMessage(t.importSuccess);
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-5 lg:grid-cols-2">
        <DashboardPanelMotion>
          <DashboardSection title={t.dataProvider} description={t.dataProviderDescription} icon={Database} contentClassName="grid gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <DashboardProviderBadge mode={store.providerMode} labels={dashboardCopy.providerLabels} />
            </div>
            <DashboardStatusStrip
              title={store.dataError ? t.providerIssue : t.providerHealthy}
              detail={store.dataError}
              variant={store.dataError ? "warning" : "ok"}
            />
          </DashboardSection>
        </DashboardPanelMotion>

        <DashboardPanelMotion>
          <DashboardSection title={t.passcode} description={t.passcodeDescription} icon={KeyRound}>
            <form className="grid gap-3" onSubmit={handlePasscode}>
              <Input value={passcode} onChange={(event) => setPasscode(event.target.value)} type="password" placeholder={t.newPasscode} aria-label={t.newPasscode} />
              <Button type="submit">{t.updatePasscode}</Button>
              {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
            </form>
          </DashboardSection>
        </DashboardPanelMotion>

        <DashboardPanelMotion>
          <DashboardSection title={t.theme} description={t.themeDescription} icon={Palette}>
            <div className="flex flex-wrap gap-2">
              {themes.map((theme) => (
                <Button
                  key={theme}
                  type="button"
                  variant={store.state.preferences.theme === theme ? "default" : "outline"}
                  onClick={() => store.setTheme(theme)}
                >
                  {theme}
                </Button>
              ))}
            </div>
          </DashboardSection>
        </DashboardPanelMotion>

        <DashboardPanelMotion>
          <DashboardSection title={t.language} description={t.languageDescription} icon={Languages}>
            <LanguageToggle />
          </DashboardSection>
        </DashboardPanelMotion>

        <DashboardPanelMotion>
          <DashboardSection title={t.localData} description={t.localDataDescription} icon={Trash2}>
            <Button type="button" variant="destructive" onClick={store.clearData}>
              <Trash2 className="h-4 w-4" />
              {t.clearLocalData}
            </Button>
          </DashboardSection>
        </DashboardPanelMotion>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <DashboardPanelMotion>
          <DashboardSection title={t.exportData} description={t.exportDescription} icon={Download} contentClassName="grid gap-3">
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={() => void handleGenerateExport()}>
                <Download className="h-4 w-4" />
                {t.generateExport}
              </Button>
              <Button type="button" variant="outline" onClick={() => void handleCopyExport()}>
                <ClipboardCopy className="h-4 w-4" />
                {t.copyExport}
              </Button>
            </div>
            <Textarea
              value={exportText}
              readOnly
              placeholder={t.exportPlaceholder}
              className="min-h-44 font-mono text-xs"
              aria-label={t.exportData}
            />
          </DashboardSection>
        </DashboardPanelMotion>

        <DashboardPanelMotion>
          <DashboardSection title={t.importData} description={t.importDescription} icon={Upload}>
            <form className="grid gap-3" onSubmit={handleImport}>
              <Textarea
                value={importText}
                onChange={(event) => setImportText(event.target.value)}
                placeholder={t.importPlaceholder}
                className="min-h-44 font-mono text-xs"
                aria-label={t.importData}
              />
              <Button type="submit">
                <Upload className="h-4 w-4" />
                {t.importAction}
              </Button>
            </form>
          </DashboardSection>
        </DashboardPanelMotion>
      </div>

      {dataMessage ? <DashboardStatusStrip title={dataMessage} variant="info" /> : null}
    </div>
  );
}
