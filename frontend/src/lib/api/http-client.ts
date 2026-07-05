const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000/api/v1";

type AuthTokenGetter = () => string | null;
type UnauthorizedHandler = () => void;

let authTokenGetter: AuthTokenGetter | undefined;
let unauthorizedHandler: UnauthorizedHandler | undefined;

export type ApiRequestInit = RequestInit & {
  auth?: boolean;
};

export class ApiClientError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly detail: unknown,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

export function setApiAuthTokenGetter(getter: AuthTokenGetter | undefined) {
  authTokenGetter = getter;
}

export function setApiUnauthorizedHandler(handler: UnauthorizedHandler | undefined) {
  unauthorizedHandler = handler;
}

function getApiBaseUrl() {
  return (process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL).replace(/\/$/, "");
}

async function readResponseDetail(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

export async function apiRequest<T>(path: string, init: ApiRequestInit = {}): Promise<T> {
  const { auth = true, ...requestInit } = init;
  const headers = new Headers(requestInit.headers);
  if (requestInit.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const accessToken = auth ? authTokenGetter?.() : null;
  if (accessToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...requestInit,
    headers,
  });

  if (!response.ok) {
    const detail = await readResponseDetail(response);
    if (auth && response.status === 401) {
      unauthorizedHandler?.();
    }
    throw new ApiClientError(`API request failed: ${response.status}`, response.status, detail);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
