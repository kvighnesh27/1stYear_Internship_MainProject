import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizeRisk(risk?: string) {
  const value = (risk || "LOW").toUpperCase();
  if (["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(value)) return value;
  return "LOW";
}

export function riskColor(risk?: string) {
  const value = normalizeRisk(risk);
  return {
    LOW: "text-emerald-300 border-emerald-400/40 bg-emerald-400/10",
    MEDIUM: "text-yellow-200 border-yellow-300/40 bg-yellow-300/10",
    HIGH: "text-orange-300 border-orange-400/40 bg-orange-400/10",
    CRITICAL: "text-red-200 border-red-400/60 bg-red-500/15 animate-critical"
  }[value];
}

export function parseMaybeJson<T>(value: unknown, fallback: T): T {
  if (!value) return fallback;
  if (typeof value === "object") return value as T;
  if (typeof value !== "string") return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
