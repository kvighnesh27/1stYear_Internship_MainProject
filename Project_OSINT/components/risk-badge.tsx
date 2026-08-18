import { cn, normalizeRisk, riskColor } from "@/lib/utils";

export function RiskBadge({ risk, className }: { risk?: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-bold tracking-wide", riskColor(risk), className)}>
      {normalizeRisk(risk)}
    </span>
  );
}
