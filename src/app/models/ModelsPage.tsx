"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import AppShell from "@/components/AppShell";

interface Provider { id: string; name: string; }
interface Model {
  id: string; provider_id: string; model_id: string; display_name: string; description: string;
  context_length: number; max_output: number; supports_vision: number; supports_tools: number;
  supports_streaming: number; is_active: number; provider_name: string; created_at: string;
}

export default function ModelsPage() {
  const [models, setModels] = useState<Model[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Model | null>(null);
  const [form, setForm] = useState({
    provider_id: "", model_id: "", display_name: "", description: "",
    context_length: 4096, max_output: 4096,
    supports_vision: false, supports_tools: false, supports_streaming: true, is_active: true,
  });

  const fetchData = async () => {
    const [m, p] = await Promise.all([fetch("/api/models"), fetch("/api/providers")]);
    setModels(await m.json()); setProviders(await p.json()); setLoading(false);
  };
  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editing ? "PATCH" : "POST";
    const url = editing ? `/api/models/${editing.id}` : "/api/models";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setShowModal(false); setEditing(null); fetchData();
  };

  const toggleActive = async (model: Model) => {
    await fetch(`/api/models/${model.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ is_active: !model.is_active }) });
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this model?")) return;
    await fetch(`/api/models/${id}`, { method: "DELETE" }); fetchData();
  };

  const openEdit = (m: Model) => {
    setEditing(m);
    setForm({ provider_id: m.provider_id, model_id: m.model_id, display_name: m.display_name, description: m.description,
      context_length: m.context_length, max_output: m.max_output,
      supports_vision: !!m.supports_vision, supports_tools: !!m.supports_tools,
      supports_streaming: !!m.supports_streaming, is_active: !!m.is_active });
    setShowModal(true);
  };

  const openNew = () => {
    setEditing(null);
    setForm({ provider_id: providers[0]?.id || "", model_id: "", display_name: "", description: "",
      context_length: 4096, max_output: 4096, supports_vision: false, supports_tools: false, supports_streaming: true, is_active: true });
    setShowModal(true);
  };

  return (
    <AppShell>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-800">Models</h1>
            <p className="text-sm text-slate-400 mt-0.5">Register models from your providers</p>
          </div>
          <button onClick={openNew} disabled={providers.length === 0}
            className="px-4 py-2 bg-violet-500 hover:bg-violet-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors shadow-sm shadow-violet-200">
            + Add
          </button>
        </div>

        {providers.length === 0 && !loading && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-700">
            Add a provider first before registering models.
          </div>
        )}

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-2xl bg-white border border-slate-100 animate-pulse" />)}
          </div>
        ) : models.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-2xl border border-slate-100">
            <div className="w-14 h-14 rounded-2xl bg-violet-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <p className="text-sm text-slate-500 font-medium">No models registered</p>
            <p className="text-xs text-slate-400 mt-1">Add models from your providers</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  {["Model", "Provider", "Context", "Features", "Active", ""].map((h) => (
                    <th key={h} className="text-left text-[10px] uppercase tracking-wider text-slate-400 font-medium px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {models.map((m) => (
                  <tr key={m.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium text-slate-700">{m.display_name}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{m.model_id}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider rounded-md bg-slate-50 text-slate-400 font-medium border border-slate-100">{m.provider_name}</span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-500">{m.context_length.toLocaleString()}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-1">
                        {m.supports_vision ? <span className="px-1.5 py-0.5 text-[9px] rounded bg-purple-50 text-purple-500 font-medium">V</span> : null}
                        {m.supports_tools ? <span className="px-1.5 py-0.5 text-[9px] rounded bg-blue-50 text-blue-500 font-medium">T</span> : null}
                        {m.supports_streaming ? <span className="px-1.5 py-0.5 text-[9px] rounded bg-emerald-50 text-emerald-500 font-medium">S</span> : null}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <button onClick={() => toggleActive(m)}
                        className={`relative w-9 h-5 rounded-full transition-colors ${m.is_active ? "bg-emerald-400" : "bg-slate-200"}`}>
                        <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all"
                          style={{ left: m.is_active ? "20px" : "2px" }} />
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(m)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
                        </button>
                        <button onClick={() => handleDelete(m.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditing(null); }} title={editing ? "Edit Model" : "Add Model"}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Provider</label>
              <select value={form.provider_id} onChange={(e) => setForm({ ...form, provider_id: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700" required>
                <option value="">Select...</option>
                {providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Model ID</label>
              <input type="text" value={form.model_id} onChange={(e) => setForm({ ...form, model_id: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 font-mono" placeholder="llama-3.1-8b" required />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Display Name</label>
              <input type="text" value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700" placeholder="Llama 3.1 8B" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Context</label>
                <input type="number" value={form.context_length} onChange={(e) => setForm({ ...form, context_length: parseInt(e.target.value) || 4096 })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700" />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Max Output</label>
                <input type="number" value={form.max_output} onChange={(e) => setForm({ ...form, max_output: parseInt(e.target.value) || 4096 })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700" />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-2 uppercase tracking-wider">Capabilities</label>
              <div className="flex gap-4">
                {([["supports_vision", "Vision"], ["supports_tools", "Tools"], ["supports_streaming", "Streaming"]] as const).map(([k, l]) => (
                  <label key={k} className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                    <input type="checkbox" checked={(form as Record<string, unknown>)[k] as boolean} onChange={(e) => setForm({ ...form, [k]: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-300 text-violet-500 focus:ring-violet-400" />
                    {l}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => { setShowModal(false); setEditing(null); }} className="px-4 py-2 text-sm rounded-xl text-slate-500 hover:bg-slate-100 transition-colors">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm rounded-xl bg-violet-500 hover:bg-violet-600 text-white font-medium transition-colors shadow-sm shadow-violet-200">
                {editing ? "Save" : "Add Model"}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </AppShell>
  );
}
