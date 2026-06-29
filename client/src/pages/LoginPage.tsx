import { useEffect, useState } from "react";
import { AlertCircle, BedDouble } from "lucide-react";

const ERROR_MESSAGES: Record<string, string> = {
  google_not_configured: "Google sign-in isn't configured yet. Contact your administrator.",
  google_failed: "Google sign-in was cancelled or failed. Please try again.",
  state_mismatch: "Your sign-in session expired. Please try again.",
  token_exchange: "Could not complete Google sign-in. Please try again.",
  no_access_token: "Could not complete Google sign-in. Please try again.",
  userinfo: "Could not read your Google profile. Please try again.",
  no_profile: "Could not read your Google profile. Please try again.",
  oauth_error: "Something went wrong during sign-in. Please try again.",
};

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.9 2.9 14.7 2 12 2 6.9 2 2.8 6.1 2.8 11.2S6.9 20.4 12 20.4c5.3 0 8.8-3.7 8.8-9 0-.6-.06-1-.15-1.4H12z" />
    </svg>
  );
}

export default function LoginPage() {
  const [error, setError] = useState("");

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("error");
    if (code) setError(ERROR_MESSAGES[code] || "Sign-in failed. Please try again.");
  }, []);

  function signInWithGoogle() {
    window.location.href = "/api/auth/google";
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
              <BedDouble className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-white font-bold text-xl tracking-tight">Accommodation</h1>
          <p className="text-slate-500 text-sm mt-1">Management System</p>
        </div>

        {/* Card */}
        <div className="w-full bg-white/[0.04] backdrop-blur-2xl rounded-3xl border border-white/[0.10] shadow-2xl shadow-black/50 overflow-hidden">
          {/* Top accent bar */}
          <div className="h-[3px] w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500" />

          <div className="px-8 pt-8 pb-9">
            <h2 className="text-[1.6rem] font-bold text-white mb-1">Sign in</h2>
            <p className="text-slate-400 text-sm mb-8">Continue with your Google account</p>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-5">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            {/* Google sign-in */}
            <button
              type="button"
              onClick={signInWithGoogle}
              className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl font-semibold text-sm text-slate-800 bg-white hover:bg-slate-100 transition-colors duration-200 shadow-lg"
            >
              <GoogleIcon />
              Continue with Google
            </button>
          </div>
        </div>

        <p className="text-slate-600 text-xs mt-7 text-center">
          Contact your administrator if you need access
        </p>
      </div>
    </div>
  );
}
