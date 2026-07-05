"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  AUTH_SESSION_STORAGE_KEY,
  clearAuthSession,
  getStoredAccessToken,
  loadAuthSession,
  saveAuthSession,
  updateStoredAuthUser,
} from "@/features/auth/data/auth-token-storage";
import { fetchCurrentUser, fetchRegistrationStatus, loginUser, registerUser } from "@/features/auth/data/auth-api";
import type {
  AuthActionResult,
  AuthLoginInput,
  AuthRegisterInput,
  AuthUser,
  RegistrationStatus,
} from "@/features/auth/types";
import { getApiErrorMessage } from "@/lib/api/error-message";
import { ApiClientError, setApiAuthTokenGetter, setApiUnauthorizedHandler } from "@/lib/api/http-client";

type AuthContextValue = {
  hydrated: boolean;
  user: AuthUser | null;
  registrationStatus: RegistrationStatus | null;
  registrationStatusChecked: boolean;
  authError?: string;
  login: (input: AuthLoginInput) => Promise<AuthActionResult>;
  register: (input: AuthRegisterInput) => Promise<AuthActionResult>;
  logout: () => void;
  clearError: () => void;
  refreshCurrentUser: () => Promise<AuthActionResult>;
  refreshRegistrationStatus: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const SESSION_EXPIRED_ERROR = "auth/session-expired";

function getAuthErrorMessage(error: unknown) {
  return getApiErrorMessage(error, "Authentication request failed");
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [registrationStatus, setRegistrationStatus] = useState<RegistrationStatus | null>(null);
  const [registrationStatusChecked, setRegistrationStatusChecked] = useState(false);
  const [authError, setAuthError] = useState<string | undefined>();

  const logout = useCallback(() => {
    clearAuthSession();
    setUser(null);
    setAuthError(undefined);
  }, []);

  const handleUnauthorized = useCallback(() => {
    clearAuthSession();
    setUser(null);
    setAuthError(SESSION_EXPIRED_ERROR);
  }, []);

  const refreshRegistrationStatus = useCallback(async () => {
    setRegistrationStatusChecked(false);
    try {
      setRegistrationStatus(await fetchRegistrationStatus());
      setAuthError(undefined);
    } catch (error) {
      setRegistrationStatus(null);
      setAuthError(getAuthErrorMessage(error));
    } finally {
      setRegistrationStatusChecked(true);
    }
  }, []);

  const refreshCurrentUser = useCallback(async (): Promise<AuthActionResult> => {
    try {
      const currentUser = await fetchCurrentUser();
      updateStoredAuthUser(currentUser);
      setUser(currentUser);
      setAuthError(undefined);
      return { ok: true };
    } catch (error) {
      const message = getAuthErrorMessage(error);
      if (error instanceof ApiClientError && error.status === 401) {
        clearAuthSession();
        setUser(null);
        setAuthError(SESSION_EXPIRED_ERROR);
        return { ok: false, error: SESSION_EXPIRED_ERROR };
      }
      setAuthError(message);
      return { ok: false, error: message };
    }
  }, []);

  const login = useCallback(async (input: AuthLoginInput): Promise<AuthActionResult> => {
    try {
      const token = await loginUser(input);
      saveAuthSession(token);
      setUser(token.user);
      setAuthError(undefined);
      return { ok: true };
    } catch (error) {
      const message = getAuthErrorMessage(error);
      setAuthError(message);
      return { ok: false, error: message };
    }
  }, []);

  const register = useCallback(async (input: AuthRegisterInput): Promise<AuthActionResult> => {
    try {
      await registerUser(input);
      return await login({ identifier: input.email, password: input.password });
    } catch (error) {
      const message = getAuthErrorMessage(error);
      setAuthError(message);
      return { ok: false, error: message };
    }
  }, [login]);

  useEffect(() => {
    setApiAuthTokenGetter(getStoredAccessToken);
    setApiUnauthorizedHandler(handleUnauthorized);

    function handleStorage(event: StorageEvent) {
      if (event.key !== AUTH_SESSION_STORAGE_KEY) return;
      setUser(loadAuthSession()?.user ?? null);
    }

    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
      setApiAuthTokenGetter(undefined);
      setApiUnauthorizedHandler(undefined);
    };
  }, [handleUnauthorized]);

  useEffect(() => {
    let cancelled = false;

    async function hydrateAuth() {
      const session = loadAuthSession();
      if (!cancelled && session) {
        setUser(session.user);
      }

      if (session) {
        try {
          const currentUser = await fetchCurrentUser();
          if (!cancelled) {
            updateStoredAuthUser(currentUser);
            setUser(currentUser);
            setAuthError(undefined);
          }
        } catch (error) {
          if (!cancelled) {
            const message = getAuthErrorMessage(error);
            if (error instanceof ApiClientError && error.status === 401) {
              clearAuthSession();
              setUser(null);
              setAuthError(SESSION_EXPIRED_ERROR);
            } else {
              setAuthError(message);
            }
          }
        }
      }

      if (!cancelled) setHydrated(true);
    }

    void hydrateAuth();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      hydrated,
      user,
      registrationStatus,
      registrationStatusChecked,
      authError,
      login,
      register,
      logout,
      clearError: () => setAuthError(undefined),
      refreshCurrentUser,
      refreshRegistrationStatus,
    }),
    [
      authError,
      hydrated,
      login,
      logout,
      refreshCurrentUser,
      refreshRegistrationStatus,
      register,
      registrationStatus,
      registrationStatusChecked,
      user,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return value;
}
