"use client";

import type { FormEvent, ReactNode } from "react";
import { useEffect, useState } from "react";
import { LogIn, ShieldCheck, UserPlus } from "lucide-react";
import { LanguageToggle } from "@/components/shared/language-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { copy } from "@/lib/i18n/copy";
import { useLocale } from "@/lib/i18n/locale-provider";
import { cn } from "@/lib/utils";

type AuthMode = "login" | "register";

const USERNAME_PATTERN = /^[A-Za-z0-9_-]{3,40}$/;

export function AuthGate({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const { refreshRegistrationStatus } = auth;
  const { locale } = useLocale();
  const t = copy[locale].dashboard.auth;
  const [mode, setMode] = useState<AuthMode>("login");
  const [identifier, setIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const registrationEnabled = auth.registrationStatus?.publicRegistrationEnabled === true;
  const registrationDisabled = auth.registrationStatus?.publicRegistrationEnabled === false;
  const registrationPending = !auth.registrationStatusChecked;
  const effectiveMode = registrationDisabled && mode === "register" ? "login" : mode;

  useEffect(() => {
    void refreshRegistrationStatus();
  }, [refreshRegistrationStatus]);

  if (!auth.hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 text-muted-foreground">
        <div className="grid gap-3 text-center">
          <div className="mx-auto h-8 w-8 animate-pulse rounded-md border bg-card" />
          <p className="text-sm">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (auth.user) {
    return children;
  }

  function validateForm() {
    if (effectiveMode === "login") {
      if (!identifier.trim() || !password) return t.required;
      if (password.length < 8) return t.passwordShort;
      return "";
    }

    if (!registrationEnabled) return t.registrationDisabled;
    if (!email.trim() || !username.trim() || !password) return t.required;
    if (!USERNAME_PATTERN.test(username.trim())) return t.usernameInvalid;
    if (password.length < 8) return t.passwordShort;
    return "";
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setLocalError(validationError);
      return;
    }

    setSubmitting(true);
    setLocalError("");
    auth.clearError();

    const result =
      effectiveMode === "login"
        ? await auth.login({ identifier: identifier.trim(), password })
        : await auth.register({
            email: email.trim(),
            username: username.trim(),
            password,
            displayName: displayName.trim() || undefined,
          });

    if (!result.ok) {
      setLocalError(result.error);
    }
    setSubmitting(false);
  }

  const title = effectiveMode === "login" ? t.loginTitle : t.registerTitle;
  const description = effectiveMode === "login" ? t.loginDescription : t.registerDescription;
  const Icon = effectiveMode === "login" ? LogIn : UserPlus;
  const authError = auth.authError === "auth/session-expired" ? t.sessionExpired : auth.authError;
  const error = localError || authError;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="absolute right-4 top-4">
        <LanguageToggle compact />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-md border bg-secondary">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          {registrationEnabled ? (
            <div className="mb-4 grid grid-cols-2 rounded-md border bg-background p-1">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={cn(
                  "inline-flex h-9 items-center justify-center gap-2 rounded-sm px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  effectiveMode === "login" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <LogIn className="h-4 w-4" />
                {t.loginTab}
              </button>
              <button
                type="button"
                onClick={() => setMode("register")}
                className={cn(
                  "inline-flex h-9 items-center justify-center gap-2 rounded-sm px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  effectiveMode === "register" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <UserPlus className="h-4 w-4" />
                {t.registerTab}
              </button>
            </div>
          ) : (
            <div className="mb-4 flex items-start gap-3 rounded-md border bg-secondary/40 p-3 text-sm text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p>
                {registrationPending
                  ? t.registrationChecking
                  : registrationDisabled
                    ? t.registrationDisabled
                    : t.registrationUnknown}
              </p>
            </div>
          )}

          <form className="grid gap-4" onSubmit={handleSubmit}>
            {effectiveMode === "login" ? (
              <Input
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                placeholder={t.identifierPlaceholder}
                aria-label={t.identifierPlaceholder}
                autoComplete="username"
              />
            ) : (
              <>
                <Input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  placeholder={t.emailPlaceholder}
                  aria-label={t.emailPlaceholder}
                  autoComplete="email"
                />
                <Input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder={t.usernamePlaceholder}
                  aria-label={t.usernamePlaceholder}
                  autoComplete="username"
                />
                <Input
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder={t.displayNamePlaceholder}
                  aria-label={t.displayNamePlaceholder}
                  autoComplete="name"
                />
              </>
            )}
            <Input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              placeholder={t.passwordPlaceholder}
              aria-label={t.passwordPlaceholder}
              autoComplete={effectiveMode === "login" ? "current-password" : "new-password"}
            />
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit" disabled={submitting || (mode === "register" && !registrationEnabled)}>
              {submitting ? t.submitting : effectiveMode === "login" ? t.loginButton : t.registerButton}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
