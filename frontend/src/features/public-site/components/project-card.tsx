"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Project } from "@/data/projects";
import { copy } from "@/lib/i18n/copy";
import { pickLocale, useLocale } from "@/lib/i18n/locale-provider";

export function ProjectCard({ project }: { project: Project }) {
  const { locale } = useLocale();
  const t = copy[locale].public;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <CardTitle>{pickLocale(project.name, locale)}</CardTitle>
          <Badge variant={project.status === "building" ? "default" : "secondary"}>{t.status[project.status]}</Badge>
        </div>
        <CardDescription>{pickLocale(project.problem, locale)}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex flex-wrap gap-2">
          {project.stack.map((item) => (
            <Badge key={item} variant="outline">{item}</Badge>
          ))}
        </div>
        <div className="grid gap-3 text-sm">
          <p><span className="font-medium text-foreground">{t.signal}:</span> <span className="text-muted-foreground">{pickLocale(project.signal, locale)}</span></p>
          <p><span className="font-medium text-foreground">{t.next}:</span> <span className="text-muted-foreground">{pickLocale(project.nextStep, locale)}</span></p>
        </div>
      </CardContent>
    </Card>
  );
}