import React, { useState } from "react";
import { Brain, Lock, Mail, Sparkles, Loader2, KeyRound, AlertTriangle, CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";

interface AuthViewProps {
  onAuthSuccess: (token: string, user: { id: string; email: string }) => void;
}

export default function AuthView({ onAuthSuccess }: AuthViewProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);

    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/signup";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Authentication failed. Please verify credentials.");
      }

      setSuccess(data.message || "Welcome to Cognitive Companion!");
      
      setTimeout(() => {
        onAuthSuccess(data.token, data.user);
      }, 800);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during authentication.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    const demoEmail = "guest@mindlab.io";
    const demoPassword = "guestPassword123";

    try {
      // Direct login try
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: demoEmail, password: demoPassword }),
      });

      let data = await loginRes.json();

      if (!data.success) {
        // Register if not found
        const signupRes = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: demoEmail, password: demoPassword }),
        });
        const signupData = await signupRes.json();
        
        if (signupData.success) {
          data = signupData;
        } else {
          throw new Error(signupData.error || "Unable to initialize Guest sandbox.");
        }
      }

      setSuccess("Welcome back, Guest Explorer! Loaded local lab instance.");
      setTimeout(() => {
        onAuthSuccess(data.token, data.user);
      }, 850);
    } catch (err: any) {
      setError("Demo sandbox loading error: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#0c0008] relative overflow-hidden px-4" id="auth-screen">
      {/* Dynamic Cosmic Purple Background Glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-[#66023C]/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[450px] h-[450px] rounded-full bg-[#8B0053]/10 blur-[130px] pointer-events-none" />

      {/* Main Authentication Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md p-8 rounded-2xl glass-panel border border-white/5 bg-zinc-950/40 relative z-10 shadow-[0_20px_50px_rgba(102,2,60,0.18)]"
        id="auth-card"
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#4A002C] to-[#8B0053] shadow-[0_0_25px_rgba(139,0,83,0.45)] mb-4">
            <Brain className="w-8 h-8 text-white animate-pulse" />
          </div>
          <h1 className="font-display font-extrabold text-2xl tracking-tight text-white">
            Cognitive <span className="text-[#8B0053]">Companion</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1.5 font-light leading-relaxed">
            Stateful Agentic Self-Discovery Workspace & CBT Analytics Engine
          </p>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-black/60 border border-white/5 mb-6" id="auth-tabs">
          <button
            onClick={() => {
              setIsLogin(true);
              setError(null);
            }}
            className={`py-2 rounded-lg text-xs font-medium font-display transition-all cursor-pointer ${
              isLogin ? "bg-gradient-to-r from-[#4a002c] to-[#66023c] text-white shadow-md" : "text-gray-400 hover:text-white"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setIsLogin(false);
              setError(null);
            }}
            className={`py-2 rounded-lg text-xs font-medium font-display transition-all cursor-pointer ${
              !isLogin ? "bg-gradient-to-r from-[#4a002c] to-[#66023c] text-white shadow-md" : "text-gray-400 hover:text-white"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Success / Error Alerts */}
        <div className="mb-4">
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-3.5 rounded-xl border border-red-950/40 bg-red-950/20 text-red-300 text-xs flex items-start gap-2.5"
            >
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Security Alert</p>
                <p className="opacity-90">{error}</p>
              </div>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-3.5 rounded-xl border border-emerald-950/40 bg-emerald-950/20 text-emerald-300 text-xs flex items-start gap-2.5"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Authorization Success</p>
                <p className="opacity-90">{success}</p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Forms */}
        <form onSubmit={handleSubmit} className="space-y-4" id="auth-form">
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono tracking-wider text-gray-400 uppercase">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                id="auth-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl glass-input text-sm text-white placeholder-gray-600 outline-none transition-all focus:border-[#8B0053] focus:ring-1 focus:ring-[#8B0053]/50"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-mono tracking-wider text-gray-400 uppercase">Security Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                id="auth-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 rounded-xl glass-input text-sm text-white placeholder-gray-600 outline-none transition-all focus:border-[#8B0053] focus:ring-1 focus:ring-[#8B0053]/50"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#4A002C] via-[#66023C] to-[#8B0053] text-white font-medium hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-sm cursor-pointer shadow-[0_4px_15px_rgba(139,0,83,0.3)] mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authorizing Session...</span>
              </>
            ) : (
              <>
                <span>{isLogin ? "Sign In Workspace" : "Provision Security Key"}</span>
              </>
            )}
          </button>
        </form>

        {/* Easy Access Local Tip */}
        <div className="mt-4 p-3.5 rounded-xl bg-[#8B0053]/5 border border-[#8B0053]/15 text-[11px] text-gray-300 leading-relaxed text-right" dir="rtl">
          <p className="font-semibold text-white mb-1 flex items-center gap-1.5 justify-end">🔐 دیتابیس امن محلی (بدون نیاز به تأیید ایمیل):</p>
          <p className="opacity-90">
            یک محیط کاربری کاملاً مستقل، امن و خصوصی روی سرور اختصاصی شما فعال است. شما می‌توانید با <span className="text-[#8B0053] font-semibold">هر ایمیل و پسورد دلخواهی</span> ثبت‌نام کنید و بلافاصله وارد شوید. کلیه اطلاعات شما به صورت کاملاً رمزشده و محافظت‌شده در این دیتابیس امن سرور ذخیره می‌شود.
          </p>
        </div>

        {/* Divider */}
        <div className="relative my-6 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/5"></div>
          </div>
          <span className="relative px-3 bg-[#0a0006] text-[10px] font-mono uppercase tracking-widest text-gray-500">
            Enterprise Sandbox
          </span>
        </div>

        {/* Guest Credentials Loader */}
        <button
          onClick={handleDemoLogin}
          disabled={isLoading}
          id="btn-demo-guest"
          className="w-full py-3 px-4 rounded-xl bg-zinc-900/60 border border-white/5 hover:border-[#8B0053]/30 hover:bg-zinc-900 text-gray-300 font-mono text-xs hover:text-white active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
        >
          <KeyRound className="w-4 h-4 text-[#8B0053]" />
          <span>Load Guest Account Sandbox</span>
          <Sparkles className="w-3.5 h-3.5 text-[#8B0053] animate-bounce" />
        </button>

        {/* Footer info */}
        <div className="mt-6 text-center text-[10px] text-gray-500 font-mono flex items-center justify-center gap-1">
          <span>🔒 SSL Secure Proxy Vault</span>
          <span>•</span>
          <span>Zero-Trust LLMOps Mode</span>
        </div>
      </motion.div>
    </div>
  );
}
