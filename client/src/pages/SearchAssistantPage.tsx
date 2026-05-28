import { useState } from "react";
import api from "../api/client";
import { MessageSquare, Search, Loader2, Hotel, UsersRound, MapPin, Sparkles, Send } from "lucide-react";

interface SearchResult {
  answer: string;
  people: Array<{
    name: string;
    zone?: string;
    area?: string;
    acoNeeded?: string;
    team?: string;
    hotel?: string;
    roomNumber?: string;
  }>;
}

export default function SearchAssistantPage() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState("");

  const exampleQueries = [
    "What is the status of John?",
    "Which team is Sarah in?",
    "How many people are in the Northeast zone?",
    "Show me all people from New Jersey",
    "What hotel is team 3 in?",
  ];

  async function handleSearch(q = question) {
    if (!q.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const response = await api.post("/search-assistant/query", { question: q });
      setResult(response.data);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Search failed. Make sure OPENAI_API_KEY is configured.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-indigo-100 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Search Assistant</h1>
          <p className="text-gray-500 text-sm">Ask natural language questions about people, teams, and assignments</p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 shadow-sm bg-white p-6 space-y-5">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            className="w-full pl-12 pr-28 py-4 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-400"
            placeholder="Ask anything... e.g. 'What is the status of John?'"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors inline-flex items-center gap-2 disabled:opacity-50"
            onClick={() => handleSearch()}
            disabled={loading || !question.trim()}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Search
          </button>
        </div>

        <div>
          <p className="text-xs text-gray-400 mb-2.5">Try these examples:</p>
          <div className="flex flex-wrap gap-2">
            {exampleQueries.map((q) => (
              <button
                key={q}
                onClick={() => { setQuestion(q); handleSearch(q); }}
                className="text-xs px-3.5 py-1.5 rounded-full bg-gray-100 hover:bg-indigo-50 text-gray-500 hover:text-indigo-700 transition-colors font-medium"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {result && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-gray-100 shadow-sm bg-white p-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-indigo-600" />
              </div>
              <span className="text-sm font-semibold text-gray-900">Assistant Response</span>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{result.answer}</p>
          </div>

          {result.people.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-semibold text-gray-900">Matched People</h3>
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                  {result.people.length}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {result.people.map((p, i) => (
                  <div key={i} className="rounded-2xl border border-gray-100 shadow-sm bg-white p-4">
                    <div className="font-semibold text-gray-900 mb-3">{p.name}</div>
                    <div className="space-y-2 text-sm">
                      {p.zone && (
                        <div className="flex items-center gap-2 text-gray-500">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          <span>{p.zone}{p.area ? ` / ${p.area}` : ""}</span>
                        </div>
                      )}
                      {p.team && (
                        <div className="flex items-center gap-2 text-gray-500">
                          <UsersRound className="w-3.5 h-3.5 text-gray-400" />
                          <span>{p.team}</span>
                        </div>
                      )}
                      {p.hotel && (
                        <div className="flex items-center gap-2 text-gray-500">
                          <Hotel className="w-3.5 h-3.5 text-gray-400" />
                          <span>{p.hotel}{p.roomNumber ? ` — Room ${p.roomNumber}` : ""}</span>
                        </div>
                      )}
                      {p.acoNeeded && (
                        <div className="mt-2">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            p.acoNeeded === "Yes"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-gray-100 text-gray-500"
                          }`}>
                            ACO: {p.acoNeeded}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!result && !loading && !error && (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-7 h-7 text-gray-400" />
          </div>
          <p className="text-gray-900 font-semibold text-lg">Ask anything</p>
          <p className="text-gray-500 text-sm mt-1">The assistant uses AI to understand your question and search the database</p>
        </div>
      )}
    </div>
  );
}
