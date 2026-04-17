import type { SearchParamsRecord } from "@/lib/types";

export function getSingleParam(
  value: string | string[] | undefined,
  fallback = "",
) {
  if (Array.isArray(value)) {
    return value[0] ?? fallback;
  }

  return value ?? fallback;
}

export function readFlash(params: SearchParamsRecord) {
  return {
    success: getSingleParam(params.success),
    error: getSingleParam(params.error),
  };
}

export function buildFeedbackPath(
  basePath: string,
  type: "success" | "error",
  message: string,
) {
  const next = new URLSearchParams();
  next.set(type, message);
  return `${basePath}?${next.toString()}`;
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatRole(role: string) {
  return role === "admin" ? "Administrador" : "Colaborador";
}

export function formatBarrelStatus(status: string) {
  return status === "out" ? "Com cliente" : "Disponível";
}

export function formatMovementType(type: string) {
  return type === "checkout" ? "Saída" : "Entrada";
}

export function isTruthy(value: FormDataEntryValue | null) {
  return value === "true" || value === "on" || value === "1";
}

export function normalizeText(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeNullableText(value: FormDataEntryValue | null) {
  const normalized = normalizeText(value);
  return normalized ? normalized : null;
}

export function normalizePositiveNumber(value: FormDataEntryValue | null) {
  const normalized = Number(normalizeText(value));
  return Number.isFinite(normalized) && normalized > 0 ? normalized : null;
}
