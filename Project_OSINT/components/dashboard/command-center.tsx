"use client";

import { Activity, AlertTriangle, BarChart3, SearchCheck } from "lucide-react";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { HistoryResponse, ScanResponse } from "@/lib/api";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RiskBadge } from "@/components/risk-badge";
import { normalizeRisk } from "@/lib/utils";

const riskPalette: Record<string, string> = {
  LOW: "#34d399",
  MEDIUM: "#fde047",
  HIGH: "#fb923c",
  CRITICAL: "#f87171"
};

export function CommandCenter({ history, latestScan }: { history: HistoryResponse | null; latestScan: ScanResponse | null }) {
  const rows = history?.history || [];
  const riskCounts = ["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((risk) => ({
    risk,
    count: rows.filter((item) => normalizeRisk(item.risk_level) === risk).length
  }));
  const latestReport = latestScan?.intelligence_report;
  const detailed = latestReport?.detailed_corporate_report;
  const threatCount = latestReport?.total_threat_count ?? detailed?.total_threat_count ?? rows.length;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total scans" value={history?.total_scans ?? 0} icon={SearchCheck} tone="cyan" />
        <StatCard label="Threat count" value={threatCount} icon={AlertTriangle} tone={threatCount > 0 ? "yellow" : "green"} />
        <StatCard label="Latest risk" value={normalizeRisk(latestReport?.risk_level || rows[0]?.risk_level)} icon={Activity} tone={normalizeRisk(latestReport?.risk_level || rows[0]?.risk_level) === "CRITICAL" ? "red" : "cyan"} />
        <StatCard label="Sources found" value={latestScan?.discovered_sources_count ?? 0} icon={BarChart3} tone="green" />
      </div>
      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader><CardTitle>Risk distribution</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={riskCounts} dataKey="count" nameKey="risk" innerRadius={58} outerRadius={94} paddingAngle={5}>
                  {riskCounts.map((item) => <Cell key={item.risk} fill={riskPalette[item.risk]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#06111f", border: "1px solid rgba(34,211,238,.25)", borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Recent activity</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {rows.slice(0, 6).map((item) => (
                <div key={item.scan_id} className="flex items-center justify-between gap-4 rounded-md border border-cyan-300/10 bg-white/[0.03] p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-cyan-50">{item.target_searched}</p>
                    <p className="text-xs text-slate-400">{item.scan_type} | {item.date}</p>
                  </div>
                  <RiskBadge risk={item.risk_level} />
                </div>
              ))}
              {!rows.length && <p className="rounded-md border border-cyan-300/10 bg-white/[0.03] p-5 text-sm text-slate-400">Run a scan to populate history from `/api/v1/history`.</p>}
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Executive overview</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm leading-7 text-slate-300">
            {detailed?.executive_summary || latestReport?.executive_summary || "No executive summary is loaded yet. Run a scan to receive the backend AI intelligence report."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export function ThreatDashboard({ history }: { history: HistoryResponse | null }) {
  const rows = (history?.history || []).slice().reverse();
  const chartData = rows.map((item, index) => ({
    name: `#${index + 1}`,
    risk: { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 }[normalizeRisk(item.risk_level)],
    label: item.target_searched,
    level: normalizeRisk(item.risk_level)
  }));

  return (
    <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
      <Card>
        <CardHeader><CardTitle>Intelligence trends</CardTitle></CardHeader>
        <CardContent className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" domain={[0, 4]} ticks={[1, 2, 3, 4]} />
              <Tooltip contentStyle={{ background: "#06111f", border: "1px solid rgba(34,211,238,.25)", borderRadius: 8 }} />
              <Bar dataKey="risk" radius={[6, 6, 0, 0]}>
                {chartData.map((item) => <Cell key={item.name} fill={riskPalette[item.level]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Risk heatmap</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-2">
            {(history?.history || []).slice(0, 28).map((item) => (
              <div key={item.scan_id} className="aspect-square rounded-md border border-white/10" style={{ backgroundColor: `${riskPalette[normalizeRisk(item.risk_level)]}55` }} title={`${item.target_searched}: ${item.risk_level}`} />
            ))}
          </div>
          <p className="mt-5 text-sm leading-6 text-slate-400">Each square represents a historical scan returned by the Flask history endpoint, colored by backend risk level.</p>
        </CardContent>
      </Card>
    </div>
  );
}
