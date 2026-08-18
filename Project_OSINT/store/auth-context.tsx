// "use client";

// import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
// import type { LoginResponse, ScanResponse, User } from "@/lib/api";

// type AuthState = {
//   token: string | null;
//   user: User | null;
//   latestScan: ScanResponse | null;
//   setSession: (session: LoginResponse) => void;
//   logout: () => void;
//   setLatestScan: (scan: ScanResponse | null) => void;
// };

// const AuthContext = createContext<AuthState | null>(null);

// export function AuthProvider({ children }: { children: React.ReactNode }) {
//   const [token, setToken] = useState<string | null>(null);
//   const [user, setUser] = useState<User | null>(null);
//   const [latestScan, setLatestScan] = useState<ScanResponse | null>(null);

//   useEffect(() => {
//     const saved = window.localStorage.getItem("aegis-session");
//     if (!saved) return;
//     try {
//       const parsed = JSON.parse(saved) as LoginResponse;
//       setToken(parsed.access_token);
//       setUser(parsed.user);
//     } catch {
//       window.localStorage.removeItem("aegis-session");
//     }
//   }, []);

//   const setSession = useCallback((session: LoginResponse) => {
//     setToken(session.access_token);
//     setUser(session.user);
//     window.localStorage.setItem("aegis-session", JSON.stringify(session));
//   }, []);

//   const logout = useCallback(() => {
//     setToken(null);
//     setUser(null);
//     setLatestScan(null);
//     window.localStorage.removeItem("aegis-session");
//   }, []);

//   const value = useMemo(() => ({ token, user, latestScan, setSession, logout, setLatestScan }), [token, user, latestScan, setSession, logout]);

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
// }

// export function useAuth() {
//   const context = useContext(AuthContext);
//   if (!context) throw new Error("useAuth must be used inside AuthProvider");
//   return context;
// }
"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { LoginResponse, ScanResponse, User } from "@/lib/api";

type AuthState = {
  token: string | null;
  user: User | null;
  latestScan: ScanResponse | null;
  lastTarget: string | null;
  setSession: (session: LoginResponse) => void;
  logout: () => void;
  setLatestScan: (scan: ScanResponse | null) => void;
  setLastTarget: (target: string | null) => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [latestScan, setLatestScan] = useState<ScanResponse | null>(null);
  const [lastTarget, setLastTarget] = useState<string | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem("aegis-session");
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as LoginResponse;
      setToken(parsed.access_token);
      setUser(parsed.user);
    } catch {
      window.localStorage.removeItem("aegis-session");
    }
  }, []);

  const setSession = useCallback((session: LoginResponse) => {
    setToken(session.access_token);
    setUser(session.user);
    window.localStorage.setItem("aegis-session", JSON.stringify(session));
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setLatestScan(null);
    setLastTarget(null);
    window.localStorage.removeItem("aegis-session");
  }, []);

  const value = useMemo(
    () => ({ token, user, latestScan, lastTarget, setSession, logout, setLatestScan, setLastTarget }),
    [token, user, latestScan, lastTarget, setSession, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}