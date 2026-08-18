// "use client";

// import { BrainCircuit, ShieldAlert, Sparkles, Wrench } from "lucide-react";
// import type { ScanResponse } from "@/lib/api";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { RiskBadge } from "@/components/risk-badge";

// export function AiAnalysis({ latestScan }: { latestScan: ScanResponse | null }) {
//   const report = latestScan?.intelligence_report;
//   const detailed = report?.detailed_corporate_report || report;
//   const summary = report?.sarcastic_dashboard;

//   const cards = [
//     ["Executive summary", detailed?.executive_summary, Sparkles],
//     ["Threat actor exploitation", detailed?.threat_actor_exploitation, ShieldAlert],
//     ["Remediation recommendations", detailed?.actionable_remediation, Wrench]
//   ] as const;

//   return (
//     <div className="space-y-5">
//       <Card className="p-5">
//         <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
//           <div>
//             <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">
//               <BrainCircuit className="h-4 w-4" />
//               AI report workflow
//             </p>
//             <h2 className="mt-2 text-2xl font-semibold text-white">Dual-agent intelligence center</h2>
//           </div>
//           <RiskBadge risk={report?.risk_level} />
//         </div>
//       </Card>
//       <div className="grid gap-5 lg:grid-cols-3">
//         {cards.map(([title, copy, Icon]) => (
//           <Card key={title}>
//             <CardHeader>
//               <CardTitle className="flex items-center gap-2"><Icon className="h-5 w-5 text-cyan-200" />{title}</CardTitle>
//             </CardHeader>
//             <CardContent>
//               <p className="text-sm leading-7 text-slate-300">{copy || "Run a scan to load this AIReport-derived field from the backend scan response."}</p>
//             </CardContent>
//           </Card>
//         ))}
//       </div>
//       <Card>
//         <CardHeader><CardTitle>Sarcastic dashboard summary</CardTitle></CardHeader>
//         <CardContent>
//           <p className="terminal-text text-sm leading-7">{summary?.tl_dr || "The summary agent output will appear here after a scan."}</p>
//           <div className="mt-5 grid gap-3 md:grid-cols-2">
//             {(summary?.jargon_buster || []).map((item) => (
//               <div key={item.term} className="rounded-md border border-cyan-300/10 bg-white/[0.03] p-4">
//                 <p className="font-semibold text-cyan-100">{item.term}</p>
//                 <p className="mt-2 text-sm leading-6 text-slate-400">{item.sarcastic_explanation}</p>
//               </div>
//             ))}
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }
"use client";

import { BrainCircuit, Download, ShieldAlert, Sparkles, Wrench } from "lucide-react";
import type { ScanResponse } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RiskBadge } from "@/components/risk-badge";
import { useAuth } from "@/store/auth-context";
import { downloadDetailedReportPdf } from "@/lib/generate-report-pdf";

export function AiAnalysis({ latestScan }: { latestScan: ScanResponse | null }) {
  const { lastTarget } = useAuth();
  const report = latestScan?.intelligence_report;
  const detailed = report?.detailed_corporate_report || report;
  const summary = report?.sarcastic_dashboard;

  const cards = [
    ["Executive summary", detailed?.executive_summary, Sparkles],
    ["Threat actor exploitation", detailed?.threat_actor_exploitation, ShieldAlert],
    ["Remediation recommendations", detailed?.actionable_remediation, Wrench]
  ] as const;

  const handleDownloadPdf = () => {
    downloadDetailedReportPdf({
      target: lastTarget,
      report,
      sourcesCount: latestScan?.discovered_sources_count
    });
  };

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">
              <BrainCircuit className="h-4 w-4" />
              AI report workflow
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Dual-agent intelligence center</h2>
          </div>
          <div className="flex items-center gap-3">
            <RiskBadge risk={report?.risk_level} />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadPdf}
              disabled={!report}
              title={report ? "Download the detailed analyst report as a PDF" : "Run a scan first"}
            >
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </div>
      </Card>
      <div className="grid gap-5 lg:grid-cols-3">
        {cards.map(([title, copy, Icon]) => (
          <Card key={title}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Icon className="h-5 w-5 text-cyan-200" />{title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-7 text-slate-300">{copy || "Run a scan to load this AIReport-derived field from the backend scan response."}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle>Sarcastic dashboard summary</CardTitle></CardHeader>
        <CardContent>
          <p className="terminal-text text-sm leading-7">{summary?.tl_dr || "The summary agent output will appear here after a scan."}</p>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {(summary?.jargon_buster || []).map((item) => (
              <div key={item.term} className="rounded-md border border-cyan-300/10 bg-white/[0.03] p-4">
                <p className="font-semibold text-cyan-100">{item.term}</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">{item.sarcastic_explanation}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}