"use client";

import { FormEvent, useState } from "react";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { copy } from "@/lib/i18n/copy";
import { useLocale } from "@/lib/i18n/locale-provider";

export function AccessGate({
  hasPasscode,
  onCreatePasscode,
  onUnlock,
}: {
  hasPasscode: boolean;
  onCreatePasscode: (passcode: string) => boolean;
  onUnlock: (passcode: string) => boolean;
}) {
  const { locale } = useLocale();
  const t = copy[locale].dashboard.access;
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const ok = hasPasscode ? onUnlock(passcode) : onCreatePasscode(passcode);
    if (!ok) {
      setError(hasPasscode ? t.mismatch : t.short);
      return;
    }
    setError("");
    setPasscode("");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-md border bg-secondary">
            {hasPasscode ? <LockKeyhole className="h-5 w-5 text-primary" /> : <ShieldCheck className="h-5 w-5 text-primary" />}
          </div>
          <CardTitle>{hasPasscode ? t.unlockTitle : t.setupTitle}</CardTitle>
          <CardDescription>{hasPasscode ? t.unlockDescription : t.setupDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <Input
              value={passcode}
              onChange={(event) => setPasscode(event.target.value)}
              type="password"
              placeholder={t.placeholder}
              aria-label={t.placeholder}
              autoComplete="current-password"
            />
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit">{hasPasscode ? t.unlockButton : t.createButton}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}