"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { LearningTrack } from "@/data/learning";
import { copy } from "@/lib/i18n/copy";
import { pickLocale, useLocale } from "@/lib/i18n/locale-provider";

export function LearningTrackCard({ track }: { track: LearningTrack }) {
  const { locale } = useLocale();
  const t = copy[locale].public;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <CardTitle>{pickLocale(track.title, locale)}</CardTitle>
          <Badge variant={track.status === "active" ? "default" : "secondary"}>{t.status[track.status]}</Badge>
        </div>
        <CardDescription>{pickLocale(track.description, locale)}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t.progress}</span>
            <span className="font-medium">{track.progress}%</span>
          </div>
          <Progress value={track.progress} />
        </div>
        <div className="flex flex-wrap gap-2">
          {pickLocale(track.modules, locale).map((module) => (
            <Badge key={module} variant="outline">{module}</Badge>
          ))}
        </div>
        <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">{t.milestone}:</span> {pickLocale(track.milestone, locale)}</p>
      </CardContent>
    </Card>
  );
}