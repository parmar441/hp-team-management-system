import { useState } from "react";
import { Send, Sparkles } from "lucide-react";
import api from "../../api/client";
import { capitalizeName } from "../../lib/utils";
import { ScreenHeader, Spinner, useToast } from "../ui";

interface MatchedPerson { name: string; zone?: string; area?: string; team?: string; hotel?: string; roomNumber?: string; acoNeeded?: string }
interface ChatItem { q: string; answer?: string; people?: MatchedPerson[]; error?: string }

const EXAMPLES = [
  "What is the status of John?",
  "Which team is Sarah in?",
  "How many people are in the Northeast zone?",
  "What hotel is team 3 in?",
];

export default function MSearch() {
  const toast = useToast();
  const [input, setInput] = useState("");
  const [chat, setChat] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(false);

  async function ask(q = input) {
    if (!q.trim() || loading) return;
    setInput("");
    setLoading(true);
    const idx = chat.length;
    setChat((c) => [...c, { q }]);
    try {
      const res = await api.post("/search-assistant/query", { question: q });
      setChat((c) => c.map((it, i) => (i === idx ? { ...it, answer: res.data.answer, people: res.data.people } : it)));
    } catch (err: any) {
      const msg = err?.response?.data?.error || "Search failed";
      setChat((c) => c.map((it, i) => (i === idx ? { ...it, error: msg } : it)));
      toast(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pt-2 flex flex-col" style={{ minHeight: "calc(100dvh - 120px)" }}>
      <ScreenHeader title="Search" subtitle="Ask in plain language" />

      {chat.length === 0 ? (
        <div className="flex-1">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--m-faint)] mb-2.5">Try asking</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((e) => (
              <button key={e} onClick={() => ask(e)}
                className="px-3.5 py-2 rounded-[11px] text-[13px] font-medium text-left"
                style={{ background: "var(--m-inset)", color: "var(--m-muted)" }}>
                {e}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 space-y-4">
          {chat.map((it, i) => (
            <div key={i} className="space-y-2.5">
              <div className="flex justify-end">
                <span className="max-w-[80%] px-3.5 py-2.5 rounded-[16px] rounded-br-md text-[14px] font-medium text-white"
                  style={{ background: "var(--m-accent)" }}>{it.q}</span>
              </div>
              {it.error ? (
                <div className="px-3.5 py-2.5 rounded-[16px] text-[13.5px]" style={{ background: "var(--m-rose-bg)", color: "var(--m-rose-fg)" }}>{it.error}</div>
              ) : it.answer != null ? (
                <div className="rounded-[16px] rounded-bl-md p-3.5" style={{ background: "var(--m-card)", border: "1px solid var(--m-card-border)" }}>
                  <p className="text-[14px] leading-relaxed whitespace-pre-wrap">{it.answer}</p>
                  {(it.people ?? []).length > 0 && (
                    <div className="mt-3 space-y-2">
                      {it.people!.map((p, j) => (
                        <div key={j} className="flex items-center gap-2.5 p-2 rounded-[11px]" style={{ background: "var(--m-inset)" }}>
                          <div className="min-w-0">
                            <p className="text-[13.5px] font-semibold truncate">{capitalizeName(p.name)}</p>
                            <p className="text-[11.5px] text-[var(--m-faint)] truncate">{[p.zone, p.team].filter(Boolean).join(" · ") || "—"}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 px-2 text-[var(--m-muted)]"><Spinner className="w-4 h-4" /> <span className="text-[13px]">Thinking…</span></div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Prompt input */}
      <div className="sticky bottom-0 pt-3 pb-1" style={{ background: "var(--m-screen)" }}>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Sparkles className="w-[18px] h-[18px] absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--m-faint)]" />
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && ask()}
              placeholder="Ask anything…"
              className="w-full h-[50px] pl-11 pr-4 rounded-[14px] border text-[15px] outline-none placeholder:text-[var(--m-faint)] focus:border-[var(--m-accent-border)]"
              style={{ background: "var(--m-card)", borderColor: "var(--m-card-border)", color: "var(--m-text)" }} />
          </div>
          <button onClick={() => ask()} disabled={!input.trim() || loading} aria-label="Send"
            className="w-[50px] h-[50px] rounded-[14px] flex items-center justify-center flex-shrink-0 disabled:opacity-50"
            style={{ background: "var(--m-accent)", color: "#fff" }}>
            <Send className="w-[18px] h-[18px]" />
          </button>
        </div>
      </div>
    </div>
  );
}
