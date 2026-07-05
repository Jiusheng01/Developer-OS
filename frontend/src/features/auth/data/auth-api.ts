import type { AuthLoginInput, AuthRegisterInput, AuthToken, AuthUser, RegistrationStatus } from "@/features/auth/types";
import { apiRequest } from "@/lib/api/http-client";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === "string" ? value : undefined;
}

export function normalizeAuthUser(value: unknown): AuthUser {
  if (!isRecord(value)) throw new Error("Invalid user response");
  const id = readString(value, "id");
  const email = readString(value, "email");
  const username = readString(value, "username");
  const displayName = readString(value, "displayName");
  const createdAt = readString(value, "createdAt");
  const updatedAt = readString(value, "updatedAt");
  if (!id || !email || !username || !displayName || !createdAt || !updatedAt) {
    throw new Error("Invalid user response");
  }
  return { id, email, username, displayName, createdAt, updatedAt };
}

function normalizeAuthToken(value: unknown): AuthToken {
  if (!isRecord(value)) throw new Error("Invalid auth token response");
  const accessToken = readString(value, "accessToken");
  const tokenType = readString(value, "tokenType");
  const expiresInSeconds = value.expiresInSeconds;
  if (!accessToken || tokenType !== "bearer" || typeof expiresInSeconds !== "number") {
    throw new Error("Invalid auth token response");
  }
  return {
    accessToken,
    tokenType,
    expiresInSeconds,
    user: normalizeAuthUser(value.user),
  };
}

function normalizeRegistrationStatus(value: unknown): RegistrationStatus {
  if (!isRecord(value) || typeof value.publicRegistrationEnabled !== "boolean") {
    throw new Error("Invalid registration status response");
  }
  return { publicRegistrationEnabled: value.publicRegistrationEnabled };
}

function encodeBody(value: unknown) {
  return JSON.stringify(value);
}

export async function fetchRegistrationStatus() {
  return normalizeRegistrationStatus(await apiRequest<unknown>("/auth/registration-status", { auth: false }));
}

export async function registerUser(input: AuthRegisterInput) {
  return normalizeAuthUser(
    await apiRequest<unknown>("/auth/register", {
      method: "POST",
      body: encodeBody(input),
      auth: false,
    }),
  );
}

export async function loginUser(input: AuthLoginInput) {
  return normalizeAuthToken(
    await apiRequest<unknown>("/auth/login", {
      method: "POST",
      body: encodeBody(input),
      auth: false,
    }),
  );
}

export async function fetchCurrentUser() {
  return normalizeAuthUser(await apiRequest<unknown>("/auth/me"));
}
