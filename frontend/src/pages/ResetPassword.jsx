import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { LockKeyhole, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import api from "../api/axios";
import VaultDial from "../components/VaultDial";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("This reset link is missing its token. Please request a new one.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, password });
      setDone(true);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Could not reset password. Please try again.");
    } finally {
      setLoading(false);
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
              Set a new combination for your locker.
            </h1>
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

          {done ? (
            <div className="flex flex-col items-center text-center gap-3 py-8">
              <CheckCircle2 className="text-emerald-600" size={40} />
              <h2 className="font-display text-xl font-semibold text-ink">Password updated</h2>
              <p className="text-sm text-muted">Redirecting you to sign in…</p>
            </div>
          ) : (
            <>
              <h2 className="font-display text-2xl font-semibold text-ink">Choose a new password</h2>
              <p className="text-sm text-muted mt-1">Make it something you'll remember.</p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                {error && (
                  <div className="rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm px-3.5 py-2.5">
                    {error}
                  </div>
                )}

                <div>
                  <label className="label">New password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      className="input pr-10"
                      placeholder="At least 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
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

                <div>
                  <label className="label">Confirm password</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    className="input"
                    placeholder="Re-enter password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                  />
                </div>

                <button type="submit" disabled={loading} className="btn-brass w-full mt-2">
                  {loading ? "Updating…" : "Update password"}
                </button>
              </form>

              <p className="text-sm text-muted mt-6 text-center">
                Remembered it?{" "}
                <Link to="/login" className="text-ink font-medium hover:text-brass-dark underline underline-offset-2">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
