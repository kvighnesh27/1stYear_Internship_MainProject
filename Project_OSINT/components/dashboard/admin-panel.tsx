"use client";

import { useEffect, useState } from "react";
import { Building2 } from "lucide-react";
import { api, type PendingUsersResponse } from "@/lib/api";
import { useAuth } from "@/store/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AdminPanel() {
  const { token, user } = useAuth();
  const [pending, setPending] = useState<PendingUsersResponse["pending_users"]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token || user?.role !== "admin") return;
    api.pendingUsers(token).then((response) => setPending(response.pending_users)).catch(() => setPending([]));
  }, [token, user?.role]);

  if (user?.role !== "admin") return null;

  const decide = async (userId: number, decision: "approved" | "rejected") => {
    if (!token) return;
    const result = await api.reviewRequest(token, userId, decision);
    setMessage(result.message);
    setPending((current) => current.filter((item) => item.id !== userId));
  };

  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5 text-cyan-200" />Admin approval queue</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {pending.map((item) => (
          <div key={item.id} className="flex flex-col gap-3 rounded-md border border-cyan-300/10 bg-white/[0.03] p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-semibold text-cyan-50">{item.company_name || "Unnamed company"}</p>
              <p className="text-sm text-slate-400">{item.email}</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => decide(item.id, "approved")}>Approve</Button>
              <Button size="sm" variant="danger" onClick={() => decide(item.id, "rejected")}>Reject</Button>
            </div>
          </div>
        ))}
        {!pending.length && <p className="text-sm text-slate-400">No pending company accounts.</p>}
        {message && <p className="rounded-md border border-emerald-400/30 bg-emerald-400/10 p-3 text-sm text-emerald-100">{message}</p>}
      </CardContent>
    </Card>
  );
}
