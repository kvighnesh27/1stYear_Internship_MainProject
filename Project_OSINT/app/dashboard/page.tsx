"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CosmicBackground } from "@/components/cosmic-background";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ScanConsole } from "@/components/dashboard/scan-console";
import { CommandCenter, ThreatDashboard } from "@/components/dashboard/command-center";
import { AiAnalysis } from "@/components/dashboard/ai-analysis";
import { InfrastructureVisualization } from "@/components/dashboard/infrastructure-visualization";
import { SourceExplorer } from "@/components/dashboard/source-explorer";
import { HistoryCenter } from "@/components/dashboard/history-center";
import { AdminPanel } from "@/components/dashboard/admin-panel";
import { api, type HistoryResponse } from "@/lib/api";
import { useAuth } from "@/store/auth-context";
import { ReviewPanel } from "@/components/dashboard/review-panel";
export default function DashboardPage() {
  const router = useRouter();
  const { token, latestScan } = useAuth();
  const [active, setActive] = useState("command");
  const [history, setHistory] = useState<HistoryResponse | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    if (token === null) {
      const timer = window.setTimeout(() => {
        const saved = window.localStorage.getItem("aegis-session");
        if (!saved) router.push("/login");
      }, 250);
      return () => window.clearTimeout(timer);
    }
    api.history(token).then(setHistory).finally(() => setLoadingHistory(false));
  }, [token, router]);

  return (
    <main className="relative min-h-screen overflow-hidden">
      <CosmicBackground />
      <DashboardShell active={active} setActive={setActive}>
        <div className="space-y-5">
          <ScanConsole onHistoryRefresh={setHistory} />
          <AdminPanel />
          {loadingHistory ? (
            <div className="grid gap-4 md:grid-cols-4">
              {[0, 1, 2, 3].map((item) => <div key={item} className="h-32 animate-pulse rounded-lg border border-cyan-300/10 bg-cyan-300/5" />)}
            </div>
          ) : (
            <>
              {active === "command" && <CommandCenter history={history} latestScan={latestScan} />}
              {active === "threats" && <ThreatDashboard history={history} />}
              {active === "ai" && <AiAnalysis latestScan={latestScan} />}
              {active === "infra" && <InfrastructureVisualization infrastructure={latestScan?.infrastructure_map} />}
              {active === "sources" && <SourceExplorer latestScan={latestScan} />}
              {active === "history" && <HistoryCenter history={history} />}
              {active === "reviews" && <ReviewPanel />}
            </>
          )}
        </div>
      </DashboardShell>
    </main>
  );
}
