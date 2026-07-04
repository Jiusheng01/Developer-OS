"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { SectionHeading } from "@/components/shared/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HeroConsole } from "@/features/public-site/components/hero-console";
import { LearningTrackCard } from "@/features/public-site/components/learning-track-card";
import { ProjectCard } from "@/features/public-site/components/project-card";
import { learningTracks } from "@/data/learning";
import { profile } from "@/data/profile";
import { projects } from "@/data/projects";
import { copy } from "@/lib/i18n/copy";
import { pickLocale, useLocale } from "@/lib/i18n/locale-provider";

export default function HomePage() {
  const { locale } = useLocale();
  const t = copy[locale].public;

  return (
    <>
      <HeroConsole />
      <section className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
        <SectionHeading label={t.operatingLabel} title={t.operatingTitle} description={t.operatingDescription} />
        <div className="grid gap-4 sm:grid-cols-2">
          {pickLocale(profile.operatingPrinciples, locale).map((principle) => (
            <Card key={principle}>
              <CardContent className="flex gap-3 p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <p className="text-sm leading-6 text-muted-foreground">{principle}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
      <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading label={t.projectsLabel} title={t.projectsTitle} />
          <Button asChild variant="outline">
            <Link href="/projects">
              {t.allProjects} <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </section>
      <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading label={t.learningLabel} title={t.learningTitle} />
          <Badge variant="outline" className="w-fit">{t.semiRealData}</Badge>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {learningTracks.map((track) => (
            <LearningTrackCard key={track.id} track={track} />
          ))}
        </div>
      </section>
    </>
  );
}