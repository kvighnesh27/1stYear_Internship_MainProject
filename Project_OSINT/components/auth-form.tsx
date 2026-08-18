"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { AlertCircle, LogIn, ShieldPlus } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/store/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CosmicBackground } from "@/components/cosmic-background";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const auth = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"individual" | "company">("individual");
  const [companyName, setCompanyName] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      if (mode === "login") {
        const session = await api.login(email, password);
        auth.setSession(session);
        router.push("/dashboard");
      } else {
        const result = await api.register({ email, password, role, company_name: companyName || undefined });
        setMessage(role === "company" ? `${result.message}. Company accounts require admin approval.` : result.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-10">
      <CosmicBackground />
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {mode === "login" ? <LogIn className="h-5 w-5 text-cyan-200" /> : <ShieldPlus className="h-5 w-5 text-cyan-200" />}
            {mode === "login" ? "Secure analyst login" : "Request analyst access"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <Input type="email" placeholder="Email address" value={email} onChange={(event) => setEmail(event.target.value)} required />
            <Input type="password" placeholder="Password" value={password} onChange={(event) => setPassword(event.target.value)} required />
            {mode === "register" && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  {(["individual", "company"] as const).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setRole(item)}
                      className={`rounded-md border px-3 py-2 text-sm font-semibold transition ${role === item ? "border-cyan-300 bg-cyan-300/15 text-cyan-100" : "border-cyan-300/15 bg-white/5 text-slate-400"}`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
                {role === "company" && (
                  <Input placeholder="Company domain or name" value={companyName} onChange={(event) => setCompanyName(event.target.value)} required />
                )}
              </>
            )}
            {error && (
              <div className="flex items-center gap-2 rounded-md border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
            {message && <div className="rounded-md border border-emerald-400/30 bg-emerald-500/10 p-3 text-sm text-emerald-100">{message}</div>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Processing..." : mode === "login" ? "Enter command center" : "Create account"}
            </Button>
          </form>
          <p className="mt-5 text-center text-sm text-slate-400">
            {mode === "login" ? "Need access?" : "Already approved?"}{" "}
            <Link href={mode === "login" ? "/register" : "/login"} className="font-semibold text-cyan-200 hover:text-cyan-100">
              {mode === "login" ? "Request an account" : "Login"}
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
