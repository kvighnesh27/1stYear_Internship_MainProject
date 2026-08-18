"use client";

import { motion } from "framer-motion";
import { Network } from "lucide-react";
import type { InfrastructureMap } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function InfrastructureVisualization({ infrastructure }: { infrastructure?: InfrastructureMap }) {
  const dns = infrastructure?.passive_dns;
  const cert = infrastructure?.certificate_transparency;
  const subdomains = cert?.discovered_subdomains || [];
  const nodes = [dns?.resolved_ip || "target", ...subdomains.slice(0, 10)];

  return (
    <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Network className="h-5 w-5 text-cyan-200" />Animated network graph</CardTitle></CardHeader>
        <CardContent>
          <div className="relative h-[520px] overflow-hidden rounded-lg border border-cyan-300/10 bg-slate-950/70">
            <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/40 bg-cyan-300/10 shadow-glow" />
            <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/10" />
            <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/10" />
            <div className="absolute left-1/2 top-1/2 h-px w-[90%] -translate-x-1/2 bg-cyan-300/15" />
            <div className="absolute left-1/2 top-1/2 h-[90%] w-px -translate-y-1/2 bg-cyan-300/15" />
            {nodes.map((node, index) => {
              const angle = (index / Math.max(nodes.length, 1)) * Math.PI * 2;
              const radius = index === 0 ? 0 : 185;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;
              return (
                <motion.div
                  key={`${node}-${index}`}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1, x, y }}
                  transition={{ delay: index * 0.08, type: "spring", stiffness: 120 }}
                  className="absolute left-1/2 top-1/2 max-w-[150px] -translate-x-1/2 -translate-y-1/2 rounded-md border border-cyan-300/25 bg-slate-900/90 px-3 py-2 text-center text-xs text-cyan-100 shadow-glow"
                >
                  {node}
                </motion.div>
              );
            })}
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full border-t border-cyan-300/70 animate-sweep" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>DNS and certificate mapping</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border border-cyan-300/10 bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Resolved IP</p>
            <p className="mt-2 text-lg font-semibold text-cyan-50">{dns?.resolved_ip || "No passive DNS result loaded"}</p>
            {dns?.error && <p className="mt-2 text-sm text-red-200">{dns.error}</p>}
          </div>
          <div className="rounded-md border border-cyan-300/10 bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Subdomains</p>
            <p className="mt-2 text-lg font-semibold text-cyan-50">{cert?.count ?? subdomains.length}</p>
            {cert?.error && <p className="mt-2 text-sm text-red-200">{cert.error}</p>}
          </div>
          <div className="max-h-72 space-y-2 overflow-auto pr-1">
            {subdomains.map((subdomain) => (
              <div key={subdomain} className="rounded-md border border-cyan-300/10 bg-cyan-300/5 px-3 py-2 text-sm text-slate-300">{subdomain}</div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
