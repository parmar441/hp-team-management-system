import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLogin } from "../hooks/useAuth";
import { Eye, EyeOff, ArrowRight, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();
  const loginMutation = useLogin();

  const [form, setForm] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const loading = loginMutation.isPending;

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setError("");
    try {
      await loginMutation.mutateAsync({ username: form.username, password: form.password });
      navigate("/");
    } catch (err: any) {
      setError(err?.response?.data?.error || "Invalid username or password.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#080c18]">
      {/* Animated gradient mesh */}
      <div className="absolute inset-0">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-700/25 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-violet-700/20 blur-[100px]" />
        <div className="absolute top-[40%] left-[60%] w-[300px] h-[300px] rounded-full bg-blue-600/10 blur-[80px]" />
      </div>

      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage: "radial-gradient(circle, #4f46e5 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Content */}
      <div className="relative z-10 w-full max-w-[400px] px-5 py-12 flex flex-col items-center">

        {/* Brand mark */}
        <div className="flex flex-col items-center mb-10">
          <div className="relative mb-4">
            <div className="absolute inset-0 rounded-3xl bg-indigo-500/40 blur-xl scale-110" />
            <div className="relative w-[68px] h-[68px] rounded-3xl bg-gradient-to-br from-indigo-400 via-indigo-600 to-violet-700 flex items-center justify-center shadow-2xl shadow-indigo-900">
              <span className="text-white font-black text-2xl tracking-tight">HP</span>
            </div>
          </div>
          <h1 className="text-white font-bold text-xl tracking-tight">HP Team Manager</h1>
          <p className="text-slate-500 text-sm mt-1">Management System</p>
        </div>

        {/* Card */}
        <div className="w-full bg-white/[0.04] backdrop-blur-2xl rounded-3xl border border-white/[0.10] shadow-2xl shadow-black/50 overflow-hidden">
          {/* Top accent bar */}
          <div className="h-[3px] w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500" />

          <div className="px-8 pt-8 pb-9">
            <h2 className="text-[1.6rem] font-bold text-white mb-1">Sign in</h2>
            <p className="text-slate-400 text-sm mb-8">Enter your credentials to continue</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Username
                </label>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                  placeholder="Enter username"
                  required
                  autoComplete="username"
                  className="w-full px-4 py-3.5 rounded-xl bg-white/[0.07] border border-white/[0.10] text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-500/40 focus:bg-white/[0.10] transition-all"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    placeholder="Enter password"
                    required
                    autoComplete="current-password"
                    className="w-full px-4 py-3.5 pr-12 rounded-xl bg-white/[0.07] border border-white/[0.10] text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-500/40 focus:bg-white/[0.10] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    tabIndex={-1}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full relative flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-semibold text-sm text-white overflow-hidden group disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 mt-2"
                style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)" }}
              >
                {/* hover shine */}
                <span className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-200 rounded-xl" />
                {loading ? (
                  <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : (
                  <>
                    <span className="relative">Sign In</span>
                    <ArrowRight className="w-4 h-4 relative group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        <p className="text-slate-600 text-xs mt-7 text-center">
          Contact your administrator if you need access
        </p>
      </div>
    </div>
  );
}
