"use client";

import { copy } from "@/lib/i18n/copy";
import { useLocale } from "@/lib/i18n/locale-provider";

export function PublicFooter() {
  const { locale } = useLocale();
  const t = copy[locale].footer;

  return (
    <footer className="border-t bg-card/50">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>{t.left}</p>
        <p>{t.right}</p>
      </div>
    </footer>
  );
}