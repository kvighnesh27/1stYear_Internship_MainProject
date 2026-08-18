"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({ label, value, icon: Icon, tone = "cyan" }: { label: string; value: string | number; icon: LucideIcon; tone?: "cyan" | "green" | "yellow" | "red" }) {
  const tones = {
    cyan: "text-cyan-200 bg-cyan-300/10 border-cyan-300/30",
    green: "text-emerald-200 bg-emerald-300/10 border-emerald-300/30",
    yellow: "text-yellow-200 bg-yellow-300/10 border-yellow-300/30",
    red: "text-red-200 bg-red-300/10 border-red-300/30"
  };

  return (
    <motion.div whileHover={{ y: -4, scale: 1.01 }} transition={{ type: "spring", stiffness: 260, damping: 20 }}>
      <Card className="p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{label}</p>
            <p className="mt-3 text-3xl font-semibold text-cyan-50">{value}</p>
          </div>
          <div className={cn("rounded-md border p-3", tones[tone])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
