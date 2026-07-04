"use client";

import Link from "next/link";
import { ArrowUpRight, LayoutDashboard } from "lucide-react";
import { LanguageToggle } from "@/components/shared/language-toggle";
import { Button } from "@/components/ui/button";
import { copy } from "@/lib/i18n/copy";
import { useLocale } from "@/lib/i18n/locale-provider";

const navItems = [
  { href: "/", key: "home" },
  { href: "/about", key: "about" },
  { href: "/learning", key: "learning" },
  { href: "/projects", key: "projects" },
] as const;

export function PublicHeader() {
  const { locale } = useLocale();
  const t = copy[locale].nav;

  return (
    <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex min-h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3 font-semibold">
          <span className="flex h-9 w-9 items-center justify-center rounded-md border bg-card text-sm">OS</span>
          <span className="hidden sm:inline">Developer OS</span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground">
              {t[item.key]}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <LanguageToggle compact />
          <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
            <Link href="/projects">
              {t.worklog} <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/dashboard">
              <LayoutDashboard className="h-4 w-4" /> {t.dashboard}
            </Link>
          </Button>
        </div>
      </div>
      <nav className="mx-auto flex w-full max-w-6xl gap-1 overflow-x-auto px-4 pb-3 md:hidden">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
            {t[item.key]}
          </Link>
        ))}
      </nav>
    </header>
  );
}