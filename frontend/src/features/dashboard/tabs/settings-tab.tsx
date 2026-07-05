"use client";

import { useState } from "react";
import { LogOut, Palette, RefreshCcw, Trash2 } from "lucide-react";
import { LanguageToggle } from "@/components/shared/language-toggle";
import { Button } from "@/components/ui/button";
import { DashboardPanelMotion } from "@/features/dashboard/components/dashboard-motion";
import { DashboardSection } from "@/features/dashboard/components/dashboard-section";
import { DashboardStatusStrip } from "@/features/dashboard/components/dashboard-status-strip";
import { useAuth } from "@/features/auth/hooks/use-auth";
import type { DashboardStore } from "@/features/dashboard/hooks/use-dashboard-store";
import { copy } from "@/lib/i18n/copy";
import { useLocale } from "@/lib/i18n/locale-provider";
import type { ThemePreference } from "@/lib/theme/theme-provider";

const themes: ThemePreference[] = ["system", "light", "dark"];

export function SettingsTab({ store }: { store: DashboardStore }) {
  const auth = useAuth();
  const { locale } = useLocale();
  const t = copy[locale].dashboard.settings;
  const [dataMessage, setDataMessage] = useState("");
  const [resetArmed, setResetArmed] = useState(false);
  const [reloading, setReloading] = useState(false);

  async function handleReloadData() {
    setResetArmed(false);
    setReloading(true);
    await store.reloadData();
    setReloading(false);
    setDataMessage(t.reloadSubmitted);
  }

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
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
        <DashboardPanelMotion>
          <DashboardSection title={t.preferences} description={t.preferencesDescription} icon={Palette} contentClassName="grid gap-5">
            <div className="grid gap-3">
              <div>
                <p className="text-sm font-medium">{t.theme}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t.themeDescription}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {themes.map((theme) => (
                  <Button
                    key={theme}
                    type="button"
                    variant={store.state.preferences.theme === theme ? "default" : "outline"}
                    onClick={() => store.setTheme(theme)}
                  >
                    {t.themeLabels[theme]}
                  </Button>
                ))}
              </div>
            </div>
            <div className="grid gap-3 border-t pt-5">
              <div>
                <p className="text-sm font-medium">{t.language}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t.languageDescription}</p>
              </div>
              <LanguageToggle />
            </div>
          </DashboardSection>
        </DashboardPanelMotion>

        <div className="grid gap-5">
          <DashboardPanelMotion>
            <DashboardSection title={t.workspaceActions} description={t.workspaceActionsDescription} icon={RefreshCcw}>
              <div className="grid gap-3">
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={() => void handleReloadData()} disabled={reloading || store.isMutating}>
                    <RefreshCcw className="h-4 w-4" />
                    {reloading ? t.reloading : t.reloadData}
                  </Button>
                  <Button type="button" variant="destructive" onClick={resetArmed ? handleConfirmReset : handleArmReset} disabled={store.isMutating}>
                    <Trash2 className="h-4 w-4" />
                    {resetArmed ? t.confirmReset : t.clearLocalData}
                  </Button>
                </div>
                {resetArmed ? (
                  <DashboardStatusStrip
                    title={t.resetPending}
                    detail={t.resetPendingDetail}
                    variant="warning"
                  />
                ) : null}
                {resetArmed ? (
                  <Button type="button" variant="outline" onClick={handleCancelReset}>
                    {t.cancelReset}
                  </Button>
                ) : null}
              </div>
            </DashboardSection>
          </DashboardPanelMotion>

          <DashboardPanelMotion>
            <DashboardSection title={t.session} description={t.sessionDescription} icon={LogOut}>
              <Button type="button" variant="outline" onClick={auth.logout}>
                <LogOut className="h-4 w-4" />
                {copy[locale].dashboard.auth.signOut}
              </Button>
            </DashboardSection>
          </DashboardPanelMotion>
        </div>
      </div>

      {dataMessage ? <DashboardStatusStrip title={dataMessage} variant="info" /> : null}
    </div>
  );
}
