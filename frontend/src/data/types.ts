import type { Locale } from "@/lib/i18n/locale-provider";

export type Localized<T> = Record<Locale, T>;