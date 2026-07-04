"use client";

import { SectionHeading } from "@/components/shared/section-heading";
import { ProjectCard } from "@/features/public-site/components/project-card";
import { projects } from "@/data/projects";
import { copy } from "@/lib/i18n/copy";
import { useLocale } from "@/lib/i18n/locale-provider";

export default function ProjectsPage() {
  const { locale } = useLocale();
  const t = copy[locale].public;

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <SectionHeading label={t.projectsLabel} title={t.projectsPageTitle} description={t.projectsPageDescription} />
      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </section>
  );
}