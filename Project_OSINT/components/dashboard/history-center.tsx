"use client";

import type { HistoryResponse } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RiskBadge } from "@/components/risk-badge";

export function HistoryCenter({ history }: { history: HistoryResponse | null }) {
  const rows = history?.history || [];

  return (
    <Card>
      <CardHeader><CardTitle>Scan history center</CardTitle></CardHeader>
      <CardContent>
        <div className="relative space-y-4 before:absolute before:bottom-0 before:left-4 before:top-2 before:w-px before:bg-cyan-300/20">
          {rows.map((item) => (
            <div key={item.scan_id} className="relative grid gap-3 pl-11 md:grid-cols-[1fr_auto] md:items-center">
              <span className="absolute left-1 top-2 h-7 w-7 rounded-full border border-cyan-300/30 bg-slate-950 shadow-glow" />
              <div className="rounded-md border border-cyan-300/10 bg-white/[0.03] p-4">
                <p className="font-semibold text-cyan-50">{item.target_searched}</p>
                <p className="mt-1 text-sm text-slate-400">{item.scan_type} | {item.date}</p>
              </div>
              <RiskBadge risk={item.risk_level} />
            </div>
          ))}
          {!rows.length && <p className="rounded-md border border-cyan-300/10 bg-white/[0.03] p-6 text-sm text-slate-400">No scan history returned yet.</p>}
        </div>
      </CardContent>
    </Card>
  );
}
