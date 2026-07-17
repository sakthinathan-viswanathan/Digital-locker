import React, { useState } from "react";
import { Link } from "react-router-dom";
import { LockKeyhole, Mail, ArrowLeft } from "lucide-react";
import api from "../api/axios";
import VaultDial from "../components/VaultDial";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/forgot-password", { email });
      setSent(true);
      if (data.devResetUrl) setDevResetUrl(data.devResetUrl);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
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
              Forgot your combination? We'll help you reset it.
            </h1>
            <p className="mt-3 text-white/60 max-w-sm text-sm leading-relaxed">
              Enter the email on your account and we'll send a secure link to choose a new password.
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

          <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink mb-6">
            <ArrowLeft size={14} /> Back to sign in
          </Link>

          {sent ? (
            <>
              <h2 className="font-display text-2xl font-semibold text-ink">Check your email</h2>
              <p className="text-sm text-muted mt-2 leading-relaxed">
                If an account exists for <span className="text-ink font-medium">{email}</span>, we've sent a link to
                reset your password. It expires in 1 hour.
              </p>
              {devResetUrl && (
                <div className="mt-4 rounded-lg bg-amber-50 border border-amber-100 text-xs text-amber-800 px-3.5 py-2.5 break-all">
                  <p className="font-medium mb-1">Dev mode — no SMTP configured, use this link directly:</p>
                  <Link to={devResetUrl.replace(window.location.origin, "")} className="underline">
                    {devResetUrl}
                  </Link>
                </div>
              )}
            </>
          ) : (
            <>
              <h2 className="font-display text-2xl font-semibold text-ink">Reset your password</h2>
              <p className="text-sm text-muted mt-1">We'll email you a secure reset link.</p>

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
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <button type="submit" disabled={loading} className="btn-brass w-full mt-2">
                  {loading ? "Sending…" : "Send reset link"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
