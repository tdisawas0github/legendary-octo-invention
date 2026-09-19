"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";

interface LogEntry {
  id: string; status: string; input_tokens: number; output_tokens: number;
  latency_ms: number; error_message: string; created_at: string;
  model_name: string; provider_name: string;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const limit = 25;

  const fetchLogs = async () => {
    setLoading(true);
    const res = await fetch(`/api/logs?limit=${limit}&offset=${page * limit}`);
    const data = await res.json();
    setLogs(data.logs); setTotal(data.total); setLoading(false);
  };
  useEffect(() => { fetchLogs(); }, [page]);

  const totalPages = Math.ceil(total / limit);
  const fmt = (iso: string) => new Date(iso + "Z").toLocaleString();

  return (
    <AppShell>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Logs</h1>
          <p className="text-sm text-slate-400 mt-0.5">{total.toLocaleString()} requests</p>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[...Array(8)].map((_, i) => <div key={i} className="h-11 rounded-xl bg-white border border-slate-100 animate-pulse" />)}
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-2xl border border-slate-100">
            <div className="w-14 h-14 rounded-2xl bg-violet-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <p className="text-sm text-slate-500 font-medium">No logs yet</p>
            <p className="text-xs text-slate-400 mt-1">Requests will appear here</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    {["Status", "Model", "Provider", "Tokens", "Latency", "Time"].map((h) => (
                      <th key={h} className="text-left text-[10px] uppercase tracking-wider text-slate-400 font-medium px-5 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map((l) => (
                    <tr key={l.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-medium ${
                          l.status === "success" ? "bg-emerald-50 text-emerald-600" :
                          l.status === "pending" ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            l.status === "success" ? "bg-emerald-400" : l.status === "pending" ? "bg-amber-400" : "bg-rose-400"
                          }`} />
                          {l.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm text-slate-600 font-mono">{l.model_name || "—"}</td>
                      <td className="px-5 py-3 text-sm text-slate-400">{l.provider_name || "—"}</td>
                      <td className="px-5 py-3 text-sm text-slate-400">
                        {l.input_tokens > 0 || l.output_tokens > 0 ? `${l.input_tokens.toLocaleString()} → ${l.output_tokens.toLocaleString()}` : "—"}
                      </td>
                      <td className="px-5 py-3 text-sm text-slate-400">{l.latency_ms > 0 ? `${l.latency_ms}ms` : "—"}</td>
                      <td className="px-5 py-3 text-xs text-slate-400">{fmt(l.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">Page {page + 1} of {totalPages}</p>
                <div className="flex gap-2">
                  <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}
                    className="px-3 py-1.5 text-xs rounded-lg bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors">Prev</button>
                  <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}
                    className="px-3 py-1.5 text-xs rounded-lg bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors">Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
