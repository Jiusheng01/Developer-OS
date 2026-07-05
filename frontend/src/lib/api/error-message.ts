import { ApiClientError } from "@/lib/api/http-client";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function detailToMessage(detail: unknown): string | undefined {
  if (typeof detail === "string") return detail;
  if (!isRecord(detail)) return undefined;

  const nestedDetail = detail.detail;
  if (typeof nestedDetail === "string") return nestedDetail;
  if (Array.isArray(nestedDetail)) return "Request payload is invalid.";
  if (isRecord(nestedDetail)) {
    const resource = nestedDetail.resource;
    const id = nestedDetail.id;
    if (typeof resource === "string" && typeof id === "string") {
      return `${resource} not found: ${id}`;
    }
  }

  return undefined;
}

export function getApiErrorMessage(error: unknown, fallback = "API request failed") {
  if (error instanceof ApiClientError) {
    return detailToMessage(error.detail) ?? `Request failed with status ${error.status}`;
  }
  return error instanceof Error ? error.message : fallback;
}
