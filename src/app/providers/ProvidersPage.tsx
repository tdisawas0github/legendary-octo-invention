"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import AppShell from "@/components/AppShell";

interface Provider {
  id: string;
  name: string;
  base_url: string;
  api_key: string;
  provider_type: string;
  is_active: number;
  created_at: string;
}

const PROVIDER_TYPES = [
  { value: "openai", label: "OpenAI-Compatible" },
  { value: "ollama", label: "Ollama" },
  { value: "custom", label: "Custom" },
];

const PRESETS = [
  { name: "Ollama", base_url: "http://localhost:11434", provider_type: "ollama" },
  { name: "LM Studio", base_url: "http://localhost:1234", provider_type: "openai" },
  { name: "vLLM", base_url: "http://localhost:8000", provider_type: "openai" },
  { name: "Text Gen", base_url: "http://localhost:5000", provider_type: "openai" },
];

export default function ProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [form, setForm] = useState({ name: "", base_url: "", api_key: "", provider_type: "openai" });

  const fetchProviders = async () => {
    const res = await fetch("/api/providers");
    setProviders(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchProviders(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingProvider ? "PATCH" : "POST";
    const url = editingProvider ? `/api/providers/${editingProvider.id}` : "/api/providers";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setShowModal(false);
    setEditingProvider(null);
    setForm({ name: "", base_url: "", api_key: "", provider_type: "openai" });
    fetchProviders();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this provider and all its models?")) return;
    await fetch(`/api/providers/${id}`, { method: "DELETE" });
    fetchProviders();
  };

  return (
    <AppShell>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-800">Providers</h1>
            <p className="text-sm text-slate-400 mt-0.5">Connect your LLM backends</p>
          </div>
          <button
            onClick={() => { setEditingProvider(null); setForm({ name: "", base_url: "", api_key: "", provider_type: "openai" }); setShowModal(true); }}
            className="px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white text-sm font-medium rounded-xl transition-colors shadow-sm shadow-violet-200"
          >
            + Add
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-2xl bg-white border border-slate-100 animate-pulse" />)}
          </div>
        ) : providers.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-2xl border border-slate-100">
            <div className="w-14 h-14 rounded-2xl bg-violet-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7" />
              </svg>
            </div>
            <p className="text-sm text-slate-500 font-medium">No providers yet</p>
            <p className="text-xs text-slate-400 mt-1">Add your first LLM backend to get started</p>
          </div>
        ) : (
          <div className="space-y-2">
            {providers.map((p) => (
              <div key={p.id} className="flex items-center justify-between bg-white rounded-2xl border border-slate-100 px-5 py-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className={`w-2.5 h-2.5 rounded-full ${p.is_active ? "bg-emerald-400" : "bg-slate-300"}`} />
                  <div>
                    <p className="text-sm font-medium text-slate-800">{p.name}</p>
                    <p className="text-xs text-slate-400 font-mono">{p.base_url}</p>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider rounded-md bg-slate-50 text-slate-400 font-medium border border-slate-100">
                    {p.provider_type}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => { setEditingProvider(p); setForm({ name: p.name, base_url: p.base_url, api_key: p.api_key, provider_type: p.provider_type }); setShowModal(true); }} className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
                  </button>
                  <button onClick={() => handleDelete(p.id)} className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditingProvider(null); }} title={editingProvider ? "Edit Provider" : "Add Provider"}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!editingProvider && (
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-2 uppercase tracking-wider">Quick setup</label>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map((pr) => (
                    <button key={pr.name} type="button" onClick={() => setForm({ ...form, name: pr.name, base_url: pr.base_url, provider_type: pr.provider_type })}
                      className="px-3 py-1.5 text-xs rounded-lg bg-slate-50 text-slate-500 hover:bg-violet-50 hover:text-violet-600 border border-slate-100 transition-colors font-medium">
                      {pr.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Name</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 transition-colors" placeholder="My LLM Server" required />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Type</label>
              <select value={form.provider_type} onChange={(e) => setForm({ ...form, provider_type: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 transition-colors">
                {PROVIDER_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Base URL</label>
              <input type="text" value={form.base_url} onChange={(e) => setForm({ ...form, base_url: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 font-mono transition-colors" placeholder="http://localhost:11434" required />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1.5 uppercase tracking-wider">API Key <span className="text-slate-300 normal-case">(optional)</span></label>
              <input type="password" value={form.api_key} onChange={(e) => setForm({ ...form, api_key: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 transition-colors" placeholder="sk-..." />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => { setShowModal(false); setEditingProvider(null); }} className="px-4 py-2 text-sm rounded-xl text-slate-500 hover:bg-slate-100 transition-colors">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm rounded-xl bg-violet-500 hover:bg-violet-600 text-white font-medium transition-colors shadow-sm shadow-violet-200">
                {editingProvider ? "Save" : "Add Provider"}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </AppShell>
  );
}
