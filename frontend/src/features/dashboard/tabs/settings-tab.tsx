"use client";

import { FormEvent, useState } from "react";
import { ClipboardCopy, Download, Upload } from "lucide-react";
import { LanguageToggle } from "@/components/shared/language-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DashboardPanelMotion } from "@/features/dashboard/components/dashboard-motion";
import type { DashboardStore } from "@/features/dashboard/hooks/use-dashboard-store";
import type { DashboardImportError } from "@/features/dashboard/types";
import { copy } from "@/lib/i18n/copy";
import { useLocale } from "@/lib/i18n/locale-provider";
import type { ThemePreference } from "@/lib/theme/theme-provider";

const themes: ThemePreference[] = ["system", "light", "dark"];

export function SettingsTab({ store }: { store: DashboardStore }) {
  const { locale } = useLocale();
  const t = copy[locale].dashboard.settings;
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
    <div className="grid gap-5 lg:grid-cols-2">
      <DashboardPanelMotion>
        <Card>
          <CardHeader>
            <CardTitle>{t.passcode}</CardTitle>
            <CardDescription>{t.passcodeDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-3" onSubmit={handlePasscode}>
              <Input value={passcode} onChange={(event) => setPasscode(event.target.value)} type="password" placeholder={t.newPasscode} aria-label={t.newPasscode} />
              <Button type="submit">{t.updatePasscode}</Button>
              {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
            </form>
          </CardContent>
        </Card>
      </DashboardPanelMotion>
      <DashboardPanelMotion>
        <Card>
          <CardHeader>
            <CardTitle>{t.theme}</CardTitle>
            <CardDescription>{t.themeDescription}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
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
          </CardContent>
        </Card>
      </DashboardPanelMotion>
      <DashboardPanelMotion>
        <Card>
          <CardHeader>
            <CardTitle>{t.language}</CardTitle>
            <CardDescription>{t.languageDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <LanguageToggle />
          </CardContent>
        </Card>
      </DashboardPanelMotion>
      <DashboardPanelMotion>
        <Card>
          <CardHeader>
            <CardTitle>{t.localData}</CardTitle>
            <CardDescription>{t.localDataDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button type="button" variant="destructive" onClick={store.clearData}>{t.clearLocalData}</Button>
          </CardContent>
        </Card>
      </DashboardPanelMotion>
      <DashboardPanelMotion>
        <Card>
          <CardHeader>
            <CardTitle>{t.exportData}</CardTitle>
            <CardDescription>{t.exportDescription}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
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
          </CardContent>
        </Card>
      </DashboardPanelMotion>
      <DashboardPanelMotion>
        <Card>
          <CardHeader>
            <CardTitle>{t.importData}</CardTitle>
            <CardDescription>{t.importDescription}</CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      </DashboardPanelMotion>
      {dataMessage ? <p className="lg:col-span-2 text-sm text-muted-foreground">{dataMessage}</p> : null}
    </div>
  );
}