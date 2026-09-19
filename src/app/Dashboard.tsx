"use client";

import { useEffect, useState } from "react";
import StatCard from "@/components/StatCard";

interface Stats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  avgLatency: number;
  totalModels: number;
  activeModels: number;
  totalProviders: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats").then((r) => r.json()).then(setStats).finally(() => setLoading(false));
  }, []);

  const successRate = stats
    ? stats.totalRequests > 0
      ? ((stats.successfulRequests / stats.totalRequests) * 100).toFixed(1) + "%"
      : "—"
    : "—";

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Dashboard</h1>
        <p className="text-sm text-slate-400 mt-0.5">Overview of your local AI gateway</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-white border border-slate-100 animate-pulse" />
          ))}
        </div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Requests"
              value={stats.totalRequests.toLocaleString()}
              icon={<svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" /></svg>}
            />
            <StatCard
              label="Success"
              value={successRate}
              icon={<svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              color="text-emerald-500"
            />
            <StatCard
              label="Latency"
              value={stats.avgLatency > 0 ? `${stats.avgLatency}ms` : "—"}
              icon={<svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              color="text-amber-500"
            />
            <StatCard
              label="Models"
              value={`${stats.activeModels} / ${stats.totalModels}`}
              icon={<svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>}
              color="text-violet-500"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Input Tokens</p>
              <p className="text-lg font-bold mt-1 text-slate-700">{stats.totalInputTokens.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Output Tokens</p>
              <p className="text-lg font-bold mt-1 text-slate-700">{stats.totalOutputTokens.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Failed</p>
              <p className="text-lg font-bold mt-1 text-rose-500">{stats.failedRequests.toLocaleString()}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">Quick Start</h3>
            <p className="text-sm text-slate-500 mb-3">Use the gateway as an OpenAI-compatible endpoint:</p>
            <div className="bg-slate-50 rounded-xl p-4 font-mono text-xs leading-relaxed text-slate-500 border border-slate-100">
              <span className="text-emerald-600 font-semibold">POST</span>{" "}
              <span className="text-violet-600">http://localhost:3000/api/v1/chat/completions</span>
              <br /><br />
              <span className="text-slate-400">curl http://localhost:3000/api/v1/chat/completions \</span>
              <br />
              <span className="text-slate-400">&nbsp;&nbsp;-H &quot;Content-Type: application/json&quot; \</span>
              <br />
              <span className="text-slate-400">&nbsp;&nbsp;-d &apos;{"{"}&quot;model&quot;: &quot;your-model-id&quot;, &quot;messages&quot;: [{"{"}&quot;role&quot;: &quot;user&quot;, &quot;content&quot;: &quot;Hello!&quot;{"}"}]{"}"}&apos;</span>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
