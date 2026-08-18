// "use client";

// import { FormEvent, useState } from "react";
// import { Crosshair, Loader2, Terminal } from "lucide-react";
// import { api, type HistoryResponse } from "@/lib/api";
// import { useAuth } from "@/store/auth-context";
// import { Button } from "@/components/ui/button";
// import { Card } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";

// export function ScanConsole({ onHistoryRefresh }: { onHistoryRefresh: (history: HistoryResponse) => void }) {
//   const { token, user, setLatestScan } = useAuth();
//   const [target, setTarget] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [message, setMessage] = useState("");

//   const submit = async (event: FormEvent) => {
//     event.preventDefault();
//     if (!token) return;
//     setLoading(true);
//     setMessage("");
//     try {
//       const scan = await api.scan(token, target);
//       setLatestScan(scan);
//       const history = await api.history(token);
//       onHistoryRefresh(history);
//       setMessage(scan.status === "rejected" ? "Target rejected by backend validation." : "Scan complete. Intelligence modules updated.");
//     } catch (err) {
//       setMessage(err instanceof Error ? err.message : "Scan failed");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const isCompany = user?.role === "company";

//   return (
//     <Card className="p-5">
//       <div className="mb-4 flex items-center justify-between gap-4">
//         <div>
//           <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">
//             <Terminal className="h-4 w-4" />
//             Scan workflow
//           </p>
//           <h1 className="mt-2 text-2xl font-semibold text-white">Executive command center</h1>
//         </div>
//         <div className="hidden rounded-md border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-xs text-cyan-100 sm:block">
//           Flask API: /api/v1/scan
//         </div>
//       </div>
//       <form onSubmit={submit} className="grid gap-3 md:grid-cols-[1fr_auto]">
//         <Input
//           value={isCompany ? user?.company_name || "" : target}
//           onChange={(event) => setTarget(event.target.value)}
//           placeholder="domain.com, analyst@example.com, or keyword"
//           disabled={loading || isCompany}
//           required={!isCompany}
//         />
//         <Button type="submit" disabled={loading || !token}>
//           {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crosshair className="h-4 w-4" />}
//           {loading ? "Scanning" : "Run scan"}
//         </Button>
//       </form>
//       <p className="mt-3 text-sm text-slate-400">
//         {isCompany ? "Company accounts scan the approved company name from the backend user record." : "Individual accounts send target_input exactly as the Flask scan endpoint expects."}
//       </p>
//       {message && <p className="mt-3 rounded-md border border-cyan-300/15 bg-cyan-300/10 p-3 text-sm text-cyan-100">{message}</p>}
//     </Card>
//   );
// }
"use client";

import { FormEvent, useState } from "react";
import { Crosshair, Loader2, Terminal } from "lucide-react";
import { api, type HistoryResponse } from "@/lib/api";
import { useAuth } from "@/store/auth-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function ScanConsole({ onHistoryRefresh }: { onHistoryRefresh: (history: HistoryResponse) => void }) {
  const { token, user, setLatestScan, setLastTarget } = useAuth();
  const [target, setTarget] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const isCompany = user?.role === "company";

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;
    const scanTarget = isCompany ? user?.company_name || "" : target;
    if (!scanTarget) {
      setMessage("No target available to scan.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const scan = await api.scan(token, scanTarget);
      setLatestScan(scan);
      setLastTarget(scanTarget);
      const history = await api.history(token);
      onHistoryRefresh(history);
      setMessage(scan.status === "rejected" ? "Target rejected by backend validation." : "Scan complete. Intelligence modules updated.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Scan failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">
            <Terminal className="h-4 w-4" />
            Scan workflow
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-white">Executive command center</h1>
        </div>
        <div className="hidden rounded-md border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-xs text-cyan-100 sm:block">
          Flask API: /api/v1/scan
        </div>
      </div>
      <form onSubmit={submit} className="grid gap-3 md:grid-cols-[1fr_auto]">
        <Input
          value={isCompany ? user?.company_name || "" : target}
          onChange={(event) => setTarget(event.target.value)}
          placeholder="domain.com, analyst@example.com, or keyword"
          disabled={loading || isCompany}
          required={!isCompany}
        />
        <Button type="submit" disabled={loading || !token}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crosshair className="h-4 w-4" />}
          {loading ? "Scanning" : "Run scan"}
        </Button>
      </form>
      <p className="mt-3 text-sm text-slate-400">
        {isCompany ? "Company accounts scan the approved company name from the backend user record." : "Individual accounts send target_input exactly as the Flask scan endpoint expects."}
      </p>
      {message && <p className="mt-3 rounded-md border border-cyan-300/15 bg-cyan-300/10 p-3 text-sm text-cyan-100">{message}</p>}
    </Card>
  );
}