"use client";

import { SectionHeading } from "@/components/shared/section-heading";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { profile } from "@/data/profile";
import { copy } from "@/lib/i18n/copy";
import { pickLocale, useLocale } from "@/lib/i18n/locale-provider";

export default function AboutPage() {
  const { locale } = useLocale();
  const t = copy[locale].public;

  return (
    <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
      <SectionHeading label={t.aboutLabel} title={t.aboutTitle} description={pickLocale(profile.summary, locale)} />
      <div className="grid gap-5">
        <Card>
          <CardHeader>
            <CardTitle>{t.currentFocus}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {pickLocale(profile.currentFocus, locale).map((item) => (
              <Badge key={item} variant="outline">{item}</Badge>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t.operatingPrinciples}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {pickLocale(profile.operatingPrinciples, locale).map((principle) => (
              <p key={principle} className="rounded-md border bg-background p-3 text-sm text-muted-foreground">{principle}</p>
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}