"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ArrowRight, Building2, CheckCircle2, LockKeyhole, Radar, ShieldCheck, Sparkles, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CosmicBackground } from "@/components/cosmic-background";
import { CyberGlobe } from "@/components/cyber-globe";

function Typewriter({ text }: { text: string }) {
  const [value, setValue] = useState("");

  useEffect(() => {
    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setValue(text.slice(0, index));
      if (index >= text.length) window.clearInterval(timer);
    }, 42);
    return () => window.clearInterval(timer);
  }, [text]);

  return <span>{value}<span className="text-cyan-300">_</span></span>;
}

export function Landing() {
  const beamRef = useRef<HTMLDivElement>(null);
  const counters = useMemo(() => [
    ["7", "OSINT vectors"],
    ["30s", "parallel collection window"],
    ["2", "AI analysis agents"],
    ["100", "context items summarized"]
  ], []);
  const platformCards: Array<[string, string, LucideIcon]> = [
    ["Executive Command", "Risk distribution, total scans, live activity, and management-ready summaries.", Building2],
    ["AI Analysis Center", "Detailed corporate reports, sarcastic summaries, jargon busting, and remediation.", Sparkles],
    ["Infrastructure Graph", "Passive DNS, certificate transparency, subdomains, and relationship mapping.", Radar]
  ];

  useEffect(() => {
    if (!beamRef.current) return;
    gsap.fromTo(beamRef.current, { xPercent: -120, opacity: 0.15 }, { xPercent: 140, opacity: 0.8, duration: 2.6, repeat: -1, ease: "power2.inOut" });
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden">
      <CosmicBackground />
      <section className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 pb-16 pt-6 sm:px-8">
        <nav className="z-10 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md border border-cyan-300/30 bg-cyan-300/10 shadow-glow">
              <ShieldCheck className="h-5 w-5 text-cyan-200" />
            </span>
            <span className="text-lg font-semibold tracking-wide text-cyan-50">Aegis OSINT</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm"><Link href="/about">About</Link></Button>
            <Button asChild variant="ghost" size="sm"><Link href="/login">Login</Link></Button>
            <Button asChild size="sm"><Link href="/register">Request access</Link></Button>
          </div>
        </nav>

        <div className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1.02fr_0.98fr]">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="mb-5 inline-flex items-center gap-2 rounded-md border border-cyan-300/25 bg-cyan-300/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100">
              <Sparkles className="h-4 w-4" />
              Enterprise AI threat intelligence
            </div>
            <h1 className="max-w-4xl text-5xl font-semibold leading-tight text-white sm:text-6xl lg:text-7xl">
              <Typewriter text="AI-powered OSINT command center" />
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Transform domains, emails, and exposed public signals into executive-grade risk intelligence, infrastructure maps, and source-backed threat narratives.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg"><Link href="/login">Launch dashboard <ArrowRight className="h-4 w-4" /></Link></Button>
              <Button asChild variant="outline" size="lg"><Link href="#platform">Explore platform</Link></Button>
            </div>
            <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {counters.map(([value, label]) => (
                <Card key={label} className="p-4">
                  <p className="text-2xl font-semibold text-cyan-100">{value}</p>
                  <p className="mt-1 text-xs text-slate-400">{label}</p>
                </Card>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.15 }} className="relative min-h-[520px]">
            <div className="absolute inset-0 rounded-full bg-cyan-300/10 blur-3xl" />
            <CyberGlobe />
            <div ref={beamRef} className="scanline absolute left-0 top-1/2 h-px w-1/2 shadow-glow" />
            <Card className="absolute left-0 top-12 w-64 p-4 animate-float">
              <div className="flex items-center gap-3">
                <Radar className="h-5 w-5 text-cyan-200" />
                <div>
                  <p className="text-sm font-semibold text-cyan-50">Live vector sweep</p>
                  <p className="text-xs text-slate-400">Search, news, scholar, maps, jobs</p>
                </div>
              </div>
            </Card>
            <Card className="absolute bottom-14 right-0 w-72 p-4 animate-float [animation-delay:1.2s]">
              <div className="flex items-center gap-3">
                <LockKeyhole className="h-5 w-5 text-emerald-200" />
                <div>
                  <p className="text-sm font-semibold text-cyan-50">JWT protected workflow</p>
                  <p className="text-xs text-slate-400">Approved company access enforced</p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      <section id="platform" className="mx-auto grid max-w-7xl gap-4 px-5 pb-20 sm:px-8 md:grid-cols-3">
        {platformCards.map(([title, copy, Icon]) => (
          <Card key={String(title)} className="p-6">
            <Icon className="h-6 w-6 text-cyan-200" />
            <h2 className="mt-5 text-xl font-semibold text-white">{title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">{copy}</p>
            <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-emerald-200">
              <CheckCircle2 className="h-4 w-4" />
              Integrated with existing Flask backend
            </div>
          </Card>
        ))}
      </section>
    </main>
  );
}