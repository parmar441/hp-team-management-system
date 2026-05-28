import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLogin, useLocalLogin } from "../hooks/useAuth";
import { UsersRound, Eye, EyeOff, ArrowRight, Shield, Users, BarChart3 } from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();
  const loginMutation = useLogin();
  const localLoginMutation = useLocalLogin();

  const [tab, setTab] = useState<"local" | "credentials">("local");
  const [form, setForm] = useState({ username: "", password: "", name: "", email: "" });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const loading = loginMutation.isPending || localLoginMutation.isPending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      if (tab === "credentials") {
        await loginMutation.mutateAsync({ username: form.username, password: form.password });
      } else {
        await localLoginMutation.mutateAsync({ name: form.name, email: form.email });
      }
      navigate("/");
    } catch (err: any) {
      setError(err?.response?.data?.error || "Login failed. Please check your details.");
    }
  }

  const inputCls = "w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition-all text-sm";

  return (
    <div className="min-h-screen flex bg-[#0f172a]">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] p-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
            <UsersRound className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-white text-base">HP Team Manager</p>
            <p className="text-slate-500 text-xs">Management System</p>
          </div>
        </div>

        <div className="space-y-10">
          <div>
            <h1 className="text-4xl font-extrabold leading-[1.15] mb-4 text-white">
              Manage your team<br />with confidence
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed max-w-md">
              Streamline group assignments, track registrations, and organize tournaments all in one place.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { icon: <Users className="w-5 h-5" />, title: "People Management", desc: "Track 100+ members across zones and areas" },
              { icon: <Shield className="w-5 h-5" />, title: "Role-Based Access", desc: "Admin, zone leads, area leads, and team leads" },
              { icon: <BarChart3 className="w-5 h-5" />, title: "Live Dashboard", desc: "Real-time stats, zone breakdowns, and more" },
            ].map((f) => (
              <div key={f.title} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center flex-shrink-0 border border-white/[0.08] text-slate-400">
                  {f.icon}
                </div>
                <div>
                  <p className="font-medium text-white text-sm">{f.title}</p>
                  <p className="text-slate-500 text-sm">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-slate-600 text-xs">© 2026 HP Team Management System</p>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-gray-50 lg:rounded-l-[2rem]">
        <div className="w-full max-w-[420px]">
          {/* Mobile Logo */}
          <div className="flex lg:hidden items-center justify-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
              <UsersRound className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-lg">HP Team Manager</p>
              <p className="text-gray-500 text-sm">Management System</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-elevated border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="px-8 pt-8 pb-5">
              <h2 className="text-xl font-bold text-gray-900">Welcome back</h2>
              <p className="text-gray-500 text-sm mt-1">Sign in to access your dashboard</p>
            </div>

            {/* Tab Toggle */}
            <div className="px-8 pb-3">
              <div className="flex rounded-xl bg-gray-100 p-1 gap-1">
                {[
                  { key: "local", label: "Quick Sign In" },
                  { key: "credentials", label: "Lead Login" },
                ].map((t) => (
                  <button
                    key={t.key}
                    onClick={() => { setTab(t.key as any); setError(""); }}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                      tab === t.key
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="px-8 pb-8 pt-3 space-y-4">
              {tab === "local" ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="e.g. Raj Patel"
                      required
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      placeholder="you@example.com"
                      required
                      className={inputCls}
                    />
                  </div>
                  <div className="bg-indigo-50 rounded-xl px-4 py-3">
                    <p className="text-xs text-indigo-700 font-medium">First user to sign in gets admin access automatically.</p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
                    <input
                      type="text"
                      value={form.username}
                      onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                      placeholder="Your username"
                      required
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={form.password}
                        onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                        placeholder="Your password"
                        required
                        className={`${inputCls} pr-12`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {error && (
                <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all duration-200 shadow-sm mt-2"
              >
                {loading ? (
                  <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
