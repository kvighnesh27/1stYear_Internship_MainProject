"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Database,
  Layers,
  LayoutDashboard,
  ServerCog,
  ShieldCheck,
  Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CosmicBackground } from "@/components/cosmic-background";

type TeamMember = {
  name: string;
  responsibilities: string[];
  photo?: string;
};

type TeamGroup = {
  role: string;
  description: string;
  icon: typeof ServerCog;
  members: TeamMember[];
};

const teamGroups: TeamGroup[] = [
  {
    role: "Team Lead & Backend Developer",
    description:
      "Led the project end to end and built the backend: APIs, authentication, AI integration, and the core scanning pipeline.",
    icon: ServerCog,
    members: [
      // To add a real photo: drop the file in public/team/, e.g. public/team/person1.jpg,
      // then set photo: "/team/person1.jpg" below.
      { name: "K Vighnesh", responsibilities: ["Project leadership", "Backend architecture", "AI integration"], photo: "/team/Vighnesh.jpeg" },
      { name: "K Sai Saranya", responsibilities: ["API development", "Authentication", "Core scanning features"], photo: "/team/Saranya.jpeg" }
    ]
  },
  {
    role: "Frontend Developers",
    description: "Built the user interface and dashboards, and integrated the frontend with the backend.",
    icon: LayoutDashboard,
    members: [
      { name: "S Indu", responsibilities: ["UI design", "Dashboard development"], photo: "/team/Indu.jpeg" },
      { name: "A Sathwika", responsibilities: ["Frontend-backend integration", "Dashboard development"], photo: "/team/Sathwika.jpeg" },
      {name: "A Ganesh", responsibilities:["Data Flow"],photo:"/team/Ganesh.jpeg"}
    ]
  },
  {
    role: "Database Developers",
    description: "Designed and managed the MySQL database, including data storage and retrieval.",
    icon: Database,
    members: [
      { name: "Harleen Kour Randhawa", responsibilities: ["Database design"], photo: "/team/Harleen.jpeg" },
      { name: "N Shiva", responsibilities: ["Data storage & retrieval"], photo: "/team/Shiva.jpeg" },
      { name: "Tanay Raj", responsibilities: ["Database management"], photo: "/team/Tanay.jpeg" }
    ]
  }
];

const pillars: Array<[string, string, typeof Target]> = [
  [
    "Aim",
    "Turn scattered public signals — domains, emails, news, listings — into a single, structured threat picture in minutes, not hours.",
    Target
  ],
  [
    "Approach",
    "Pair automated OSINT collection across multiple public sources with a dual-agent AI pipeline that reads the noise and writes the report.",
    Layers
  ],
  [
    "Outcome",
    "Executive-ready risk summaries, infrastructure maps, and remediation guidance — backed by sources, available as history, exportable as a PDF.",
    ShieldCheck
  ]
];

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function Avatar({ name, photo }: { name: string; photo?: string }) {
  if (photo) {
    return (
      <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-full border-2 border-cyan-300/30 bg-white/5 shadow-glow">
        <Image src={photo} alt={name} fill sizes="96px" className="object-cover" />
      </div>
    );
  }
  return (
    <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-full border-2 border-cyan-300/30 bg-cyan-300/10 text-xl font-semibold text-cyan-100 shadow-glow">
      {initials(name)}
    </div>
  );
}

export default function AboutPage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <CosmicBackground />
      <section className="relative mx-auto flex w-full max-w-7xl flex-col px-5 pb-20 pt-6 sm:px-8">
        <nav className="z-10 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md border border-cyan-300/30 bg-cyan-300/10 shadow-glow">
              <ShieldCheck className="h-5 w-5 text-cyan-200" />
            </span>
            <span className="text-lg font-semibold tracking-wide text-cyan-50">Aegis OSINT</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm"><Link href="/">Home</Link></Button>
            <Button asChild variant="ghost" size="sm"><Link href="/login">Login</Link></Button>
            <Button asChild size="sm"><Link href="/register">Request access</Link></Button>
          </div>
        </nav>

        {/* Vision */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="mt-14 max-w-3xl"
        >
          <div className="mb-5 inline-flex items-center gap-2 rounded-md border border-cyan-300/25 bg-cyan-300/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100">
            <ShieldCheck className="h-4 w-4" />
            About this project
          </div>
          <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">
            Our goal: make open-source threat intelligence as easy to read as a dashboard.
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-300">
            Aegis OSINT is a full-stack threat intelligence platform built to automatically collect public
            information on a target — a domain, email, or company — and turn it into a clear, structured risk
            report. The goal is simple: replace hours of manual searching with a single scan that gathers,
            analyzes, and explains what is publicly exposed, so a non-technical reader can understand the risk
            as quickly as a security analyst can.
          </p>
        </motion.div>

        {/* Pillars */}
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {pillars.map(([title, copy, Icon], i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 * i }}
            >
              <Card className="h-full p-6">
                <Icon className="h-6 w-6 text-cyan-200" />
                <h2 className="mt-4 text-lg font-semibold text-white">{title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-400">{copy}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Our Team */}
        <div className="mt-20" id="our-team">
          <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-cyan-300/25 bg-cyan-300/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100">
            Our team
          </div>
          <h2 className="text-3xl font-semibold text-white sm:text-4xl">The people behind Aegis</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            Three small crews, one pipeline: backend and AI, frontend and dashboards, and the database holding
            it all together.
          </p>

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {teamGroups.map((group, i) => {
              const Icon = group.icon;
              return (
                <motion.div
                  key={group.role}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 * i }}
                >
                  <Card className="flex h-full flex-col p-6">
                    <span className="flex h-11 w-11 items-center justify-center rounded-md border border-cyan-300/25 bg-cyan-300/10">
                      <Icon className="h-5 w-5 text-cyan-200" />
                    </span>
                    <h3 className="mt-4 text-lg font-semibold text-white">{group.role}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{group.description}</p>

                    <div className="mt-5 flex-1 space-y-4 border-t border-cyan-300/10 pt-5">
                      {group.members.map((member) => (
                        <div key={member.name} className="flex flex-col items-center gap-3 rounded-md bg-white/5 p-5 text-center">
                          <Avatar name={member.name} photo={member.photo} />
                          <div>
                            <p className="text-base font-semibold text-cyan-50">{member.name}</p>
                            <ul className="mt-2 space-y-1">
                              {member.responsibilities.map((item) => (
                                <li key={item} className="flex items-center justify-center gap-2 text-xs text-slate-400">
                                  <span className="h-1 w-1 flex-shrink-0 rounded-full bg-cyan-300/60" />
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-400">Want to see the platform in action?</p>
          <Button asChild size="lg">
            <Link href="/login">
              Launch dashboard <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}