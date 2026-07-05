"use client";

import { useState } from "react";
import { Database, Languages, Palette, Trash2 } from "lucide-react";
import { LanguageToggle } from "@/components/shared/language-toggle";
import { Button } from "@/components/ui/button";
import { DashboardPanelMotion } from "@/features/dashboard/components/dashboard-motion";
import { DashboardProviderBadge } from "@/features/dashboard/components/dashboard-provider-badge";
import { DashboardSection } from "@/features/dashboard/components/dashboard-section";
import { DashboardStatusStrip } from "@/features/dashboard/components/dashboard-status-strip";
import type { DashboardStore } from "@/features/dashboard/hooks/use-dashboard-store";
import { copy } from "@/lib/i18n/copy";
import { useLocale } from "@/lib/i18n/locale-provider";
import type { ThemePreference } from "@/lib/theme/theme-provider";

const themes: ThemePreference[] = ["system", "light", "dark"];

export function SettingsTab({ store }: { store: DashboardStore }) {
  const { locale } = useLocale();
  const dashboardCopy = copy[locale].dashboard;
  const t = dashboardCopy.settings;
  const [dataMessage, setDataMessage] = useState("");
  const [resetArmed, setResetArmed] = useState(false);

  function handleArmReset() {
    setResetArmed(true);
    setDataMessage(t.resetPending);
  }

  function handleCancelReset() {
    setResetArmed(false);
    setDataMessage(t.resetCancelled);
  }

  function handleConfirmReset() {
    store.clearData();
    setResetArmed(false);
    setDataMessage(t.resetSubmitted);
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
            <div className="grid gap-3">
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="destructive" onClick={resetArmed ? handleConfirmReset : handleArmReset}>
                  <Trash2 className="h-4 w-4" />
                  {resetArmed ? t.confirmReset : t.clearLocalData}
                </Button>
                {resetArmed ? (
                  <Button type="button" variant="outline" onClick={handleCancelReset}>
                    {t.cancelReset}
                  </Button>
                ) : null}
              </div>
              {resetArmed ? <DashboardStatusStrip title={t.resetPending} variant="warning" /> : null}
            </div>
          </DashboardSection>
        </DashboardPanelMotion>
      </div>

      {dataMessage ? <DashboardStatusStrip title={dataMessage} variant="info" /> : null}
    </div>
  );
}
