"use client";

import Link from "next/link";
import { ArrowRight, BrainCircuit, TerminalSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MetricCard } from "@/components/shared/metric-card";
import { profile } from "@/data/profile";
import { copy } from "@/lib/i18n/copy";
import { pickLocale, useLocale } from "@/lib/i18n/locale-provider";

export function HeroConsole() {
  const { locale } = useLocale();
  const t = copy[locale].public;

  return (
    <section className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:py-14">
      <div className="flex flex-col justify-center rounded-none py-6">
        <Badge variant="outline" className="mb-5 w-fit">{t.heroBadge}</Badge>
        <h1 className="max-w-4xl text-4xl font-semibold leading-tight tracking-normal text-foreground sm:text-5xl">
          {t.heroTitle}
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
          {pickLocale(profile.summary, locale)}
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Button asChild>
            <Link href="/dashboard">
              {t.openDashboard} <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/projects">{t.viewProjectLog}</Link>
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="border-b bg-secondary/60 px-4 py-3 text-sm font-medium">{t.consoleTitle}</div>
          <div className="grid gap-4 p-5">
            <div className="flex items-start gap-3 rounded-md border bg-background p-4">
              <TerminalSquare className="mt-1 h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">{t.currentBuildTitle}</p>
                <p className="mt-1 text-sm text-muted-foreground">{t.currentBuildBody}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-md border bg-background p-4">
              <BrainCircuit className="mt-1 h-5 w-5 text-accent" />
              <div>
                <p className="font-medium">{t.learningLoopTitle}</p>
                <p className="mt-1 text-sm text-muted-foreground">{t.learningLoopBody}</p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {pickLocale(profile.metrics, locale).map((metric) => (
                <MetricCard key={metric.label} {...metric} />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}