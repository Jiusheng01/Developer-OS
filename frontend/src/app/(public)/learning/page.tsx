"use client";

import { SectionHeading } from "@/components/shared/section-heading";
import { LearningTrackCard } from "@/features/public-site/components/learning-track-card";
import { learningTracks } from "@/data/learning";
import { copy } from "@/lib/i18n/copy";
import { useLocale } from "@/lib/i18n/locale-provider";

export default function LearningPage() {
  const { locale } = useLocale();
  const t = copy[locale].public;

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <SectionHeading label={t.learningLabel} title={t.learningPageTitle} description={t.learningPageDescription} />
      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        {learningTracks.map((track) => (
          <LearningTrackCard key={track.id} track={track} />
        ))}
      </div>
    </section>
  );
}