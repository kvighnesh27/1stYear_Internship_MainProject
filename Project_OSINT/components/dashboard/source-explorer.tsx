"use client";

import { useMemo, useState } from "react";
import { ExternalLink, Search } from "lucide-react";
import type { ScanResponse, SourceLog } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
// Add this helper at the top of the file, outside the component:

type Row = SourceLog & { vector: string };

export function SourceExplorer({ latestScan }: { latestScan: ScanResponse | null }) {
  const [query, setQuery] = useState("");
  const rows = useMemo<Row[]>(() => {
    const logs = latestScan?.raw_data_logs || {};
    return Object.entries(logs).flatMap(([vector, value]) => {
      if (!Array.isArray(value)) return [];
      return value.map((item) => ({ ...item, vector }));
    });
  }, [latestScan]);

  const filtered = rows.filter((row) => `${row.vector} ${row.title} ${row.snippet || ""}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Source intelligence explorer</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative mb-5">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input className="pl-10" placeholder="Search sources, vectors, snippets" value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
        <div className="overflow-hidden rounded-lg border border-cyan-300/10">
          <div className="grid grid-cols-[160px_1fr_90px] gap-3 bg-cyan-300/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100">
            <span>Vector</span>
            <span>Source</span>
            <span>Open</span>
          </div>
          <div className="max-h-[560px] overflow-auto">
            {filtered.map((row, index) => (
              <div key={`${row.vector}-${row.url}-${index}`} className="grid grid-cols-[160px_1fr_90px] gap-3 border-t border-cyan-300/10 px-4 py-4">
                <span className="text-xs font-semibold text-cyan-200">{row.vector}</span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-cyan-50">{row.title}</p>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-400">{row.snippet || row.url}</p>
                </div>
               {/* <a href={row.url} target="_blank" rel="noreferrer" className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-cyan-300/20 text-cyan-200 hover:bg-cyan-300/10" aria-label="Open source">
                  <ExternalLink className="h-4 w-4" />
                </a> */}
              </div>
            ))}
            {!filtered.length && (
              <div className="p-8 text-center text-sm text-slate-400">
                Run a scan to populate source rows from `raw_data_logs`. Persisted `FetchedSource` records are not exposed by the current Flask routes.
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


