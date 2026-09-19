"use client";

import { useEffect, useState, useRef } from "react";
import AppShell from "@/components/AppShell";

interface Model { id: string; model_id: string; display_name: string; owned_by: string; }
interface Message { role: "system" | "user" | "assistant"; content: string; }

export default function PlaygroundPage() {
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [messages, setMessages] = useState<Message[]>([{ role: "system", content: "You are a helpful assistant." }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [streaming, setStreaming] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/v1/chat/completions").then((r) => r.json()).then((d) => {
      const list = d.data || []; setModels(list);
      if (list.length > 0) setSelectedModel(list[0].id);
    });
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!input.trim() || !selectedModel || loading) return;
    const user: Message = { role: "user", content: input.trim() };
    const msgs = [...messages, user];
    setMessages(msgs); setInput(""); setLoading(true);

    try {
      if (streaming) {
        setMessages([...msgs, { role: "assistant", content: "" }]);
        const res = await fetch("/api/v1/chat/completions", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model: selectedModel, messages: msgs, temperature, max_tokens: maxTokens, stream: true }),
        });
        const reader = res.body?.getReader();
        const dec = new TextDecoder();
        let full = "";
        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            for (const line of dec.decode(value, { stream: true }).split("\n")) {
              const t = line.trim();
              if (t.startsWith("data: ") && t !== "data: [DONE]") {
                try { const d = JSON.parse(t.slice(6)); const c = d.choices?.[0]?.delta?.content; if (c) { full += c; setMessages((p) => { const u = [...p]; u[u.length - 1] = { role: "assistant", content: full }; return u; }); } } catch {}
              }
            }
          }
        }
      } else {
        const res = await fetch("/api/v1/chat/completions", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model: selectedModel, messages: msgs, temperature, max_tokens: maxTokens, stream: false }),
        });
        const data = await res.json();
        setMessages([...msgs, { role: "assistant", content: data.choices?.[0]?.message?.content || "No response" }]);
      }
    } catch (e) {
      setMessages([...msgs, { role: "assistant", content: `Error: ${e instanceof Error ? e.message : "Failed"}` }]);
    } finally { setLoading(false); }
  };

  return (
    <AppShell>
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-slate-800">Playground</h1>
            <p className="text-sm text-slate-400 mt-0.5">Chat with your local models</p>
          </div>
          <button onClick={() => setMessages([{ role: "system", content: "You are a helpful assistant." }])}
            className="px-3 py-1.5 text-xs rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors">
            Clear
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Settings */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-5 sticky top-20">
              <h3 className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Settings</h3>
              <div>
                <label className="block text-xs text-slate-500 mb-1.5 font-medium">Model</label>
                <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700">
                  {models.length === 0 && <option value="">No models</option>}
                  {models.map((m) => <option key={m.id} value={m.id}>{m.display_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1.5 font-medium">Temperature: {temperature}</label>
                <input type="range" min="0" max="2" step="0.1" value={temperature} onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full accent-violet-500" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1.5 font-medium">Max Tokens</label>
                <input type="number" value={maxTokens} onChange={(e) => setMaxTokens(parseInt(e.target.value) || 2048)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700" />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-500 cursor-pointer">
                <input type="checkbox" checked={streaming} onChange={(e) => setStreaming(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-violet-500 focus:ring-violet-400" />
                Streaming
              </label>
            </div>
          </div>

          {/* Chat */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col" style={{ height: "calc(100vh - 180px)" }}>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.filter((m) => m.role !== "system").length === 0 && (
                  <div className="text-center py-24 text-slate-300">
                    <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center mx-auto mb-3">
                      <svg className="w-5 h-5 text-violet-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium">Start a conversation</p>
                  </div>
                )}
                {messages.filter((m) => m.role !== "system").map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === "user" ? "bg-violet-500 text-white" : "bg-slate-50 text-slate-700 border border-slate-100"
                    }`}>
                      <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-50 rounded-2xl px-4 py-3 border border-slate-100">
                      <div className="flex gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-pulse-dot" style={{ animationDelay: "0s" }} />
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-pulse-dot" style={{ animationDelay: "0.2s" }} />
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-pulse-dot" style={{ animationDelay: "0.4s" }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={endRef} />
              </div>

              <div className="p-4 border-t border-slate-100">
                <div className="flex gap-2">
                  <textarea value={input} onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                    placeholder="Type a message..." rows={2}
                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 resize-none transition-colors" />
                  <button onClick={send} disabled={!input.trim() || !selectedModel || loading}
                    className="px-5 bg-violet-500 hover:bg-violet-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-colors self-end shadow-sm shadow-violet-200">
                    {loading ? (
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
                    )}
                  </button>
                </div>
                <p className="text-[10px] text-slate-300 mt-2">Enter to send · Shift+Enter for newline</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
