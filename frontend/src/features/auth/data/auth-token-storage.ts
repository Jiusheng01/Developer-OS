import type { AuthToken, AuthUser } from "@/features/auth/types";
import { readLocalStorage, removeLocalStorage, writeLocalStorage } from "@/lib/storage/safe-local-storage";

export const AUTH_SESSION_STORAGE_KEY = "developer-os-auth-session";

export type StoredAuthSession = {
  accessToken: string;
  tokenType: "bearer";
  expiresAt: string;
  user: AuthUser;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === "string" ? value : undefined;
}

function normalizeUser(value: unknown): AuthUser | undefined {
  if (!isRecord(value)) return undefined;
  const id = readString(value, "id");
  const email = readString(value, "email");
  const username = readString(value, "username");
  const displayName = readString(value, "displayName");
  const createdAt = readString(value, "createdAt");
  const updatedAt = readString(value, "updatedAt");
  if (!id || !email || !username || !displayName || !createdAt || !updatedAt) return undefined;
  return { id, email, username, displayName, createdAt, updatedAt };
}

function normalizeStoredSession(value: unknown): StoredAuthSession | undefined {
  if (!isRecord(value)) return undefined;
  const accessToken = readString(value, "accessToken");
  const tokenType = readString(value, "tokenType");
  const expiresAt = readString(value, "expiresAt");
  const user = normalizeUser(value.user);
  if (!accessToken || tokenType !== "bearer" || !expiresAt || !user) return undefined;
  return { accessToken, tokenType, expiresAt, user };
}

function isExpired(session: StoredAuthSession) {
  const expiresAt = Date.parse(session.expiresAt);
  return !Number.isFinite(expiresAt) || expiresAt <= Date.now();
}

export function loadAuthSession(): StoredAuthSession | undefined {
  const raw = readLocalStorage(AUTH_SESSION_STORAGE_KEY);
  if (!raw) return undefined;

  try {
    const session = normalizeStoredSession(JSON.parse(raw) as unknown);
    if (!session || isExpired(session)) {
      clearAuthSession();
      return undefined;
    }
    return session;
  } catch {
    clearAuthSession();
    return undefined;
  }
}

export function saveAuthSession(token: AuthToken) {
  const session: StoredAuthSession = {
    accessToken: token.accessToken,
    tokenType: token.tokenType,
    expiresAt: new Date(Date.now() + token.expiresInSeconds * 1000).toISOString(),
    user: token.user,
  };
  writeLocalStorage(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function updateStoredAuthUser(user: AuthUser) {
  const session = loadAuthSession();
  if (!session) return;
  writeLocalStorage(AUTH_SESSION_STORAGE_KEY, JSON.stringify({ ...session, user }));
}

export function clearAuthSession() {
  removeLocalStorage(AUTH_SESSION_STORAGE_KEY);
}

export function getStoredAccessToken() {
  return loadAuthSession()?.accessToken ?? null;
}
