"use client";

import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/locale-provider";

export function LanguageToggle({ compact = false }: { compact?: boolean }) {
  const { locale, toggleLocale } = useLocale();
  const nextLabel = locale === "en" ? "中文" : "EN";
  const ariaLabel = locale === "en" ? "Switch to Chinese" : "Switch to English";

  return (
    <Button type="button" variant="outline" size="sm" onClick={toggleLocale} aria-label={ariaLabel}>
      <Languages className="h-4 w-4" />
      {compact ? nextLabel : locale === "en" ? "中文" : "English"}
    </Button>
  );
}