import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LockKeyhole, Mail, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import VaultDial from "../components/VaultDial";

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const result = await login(form.email, form.password);
    if (result.ok) {
      navigate("/dashboard");
    } else {
      setError(result.message);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-canvas">
      {/* Left: brand panel */}
      <div className="hidden lg:flex flex-col justify-between bg-ink text-white p-12 relative overflow-hidden">
        <div className="flex items-center gap-2 relative z-10">
          <LockKeyhole className="text-brass" size={22} />
          <span className="font-display font-semibold text-lg tracking-tight">Vaultly</span>
        </div>

        <div className="relative z-10 flex flex-col items-start gap-6">
          <VaultDial size={220} />
          <div>
            <h1 className="font-display text-3xl font-semibold leading-tight max-w-sm">
              Your documents, one turn of the dial away.
            </h1>
            <p className="mt-3 text-white/60 max-w-sm text-sm leading-relaxed">
              Store IDs, certificates, and contracts in folders you control. Encrypted in transit,
              searchable in seconds.
            </p>
          </div>
        </div>

        <p className="relative z-10 text-xs text-white/40 font-mono">SECURE · ORGANIZED · ALWAYS AVAILABLE</p>
      </div>

      {/* Right: form */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <LockKeyhole className="text-brass" size={22} />
            <span className="font-display font-semibold text-lg text-ink">Vaultly</span>
          </div>

          <h2 className="font-display text-2xl font-semibold text-ink">Welcome back</h2>
          <p className="text-sm text-muted mt-1">Sign in to open your locker.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm px-3.5 py-2.5">
                {error}
              </div>
            )}

            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
                <input
                  type="email"
                  required
                  className="input pl-9"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="input pr-10"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-brass w-full mt-2">
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="text-sm text-muted mt-6 text-center">
            New to Vaultly?{" "}
            <Link to="/register" className="text-ink font-medium hover:text-brass-dark underline underline-offset-2">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
