import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LockKeyhole, User, Mail, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import VaultDial from "../components/VaultDial";

export default function Register() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const result = await register(form.name, form.email, form.password);
    if (result.ok) {
      navigate("/dashboard");
    } else {
      setError(result.message);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-canvas">
      <div className="hidden lg:flex flex-col justify-between bg-ink text-white p-12 relative overflow-hidden">
        <div className="flex items-center gap-2 relative z-10">
          <LockKeyhole className="text-brass" size={22} />
          <span className="font-display font-semibold text-lg tracking-tight">Vaultly</span>
        </div>

        <div className="relative z-10 flex flex-col items-start gap-6">
          <VaultDial size={220} />
          <div>
            <h1 className="font-display text-3xl font-semibold leading-tight max-w-sm">
              Set your combination once. Access it forever.
            </h1>
            <p className="mt-3 text-white/60 max-w-sm text-sm leading-relaxed">
              Create folders for every category of document, then find anything with a search
              that actually works.
            </p>
          </div>
        </div>

        <p className="relative z-10 text-xs text-white/40 font-mono">SECURE · ORGANIZED · ALWAYS AVAILABLE</p>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <LockKeyhole className="text-brass" size={22} />
            <span className="font-display font-semibold text-lg text-ink">Vaultly</span>
          </div>

          <h2 className="font-display text-2xl font-semibold text-ink">Create your locker</h2>
          <p className="text-sm text-muted mt-1">Takes less than a minute.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm px-3.5 py-2.5">
                {error}
              </div>
            )}

            <div>
              <label className="label">Full name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
                <input
                  type="text"
                  required
                  className="input pl-9"
                  placeholder="Jane Doe"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
            </div>

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
                  minLength={6}
                  className="input pr-10"
                  placeholder="At least 6 characters"
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
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="text-sm text-muted mt-6 text-center">
            Already have a locker?{" "}
            <Link to="/login" className="text-ink font-medium hover:text-brass-dark underline underline-offset-2">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
