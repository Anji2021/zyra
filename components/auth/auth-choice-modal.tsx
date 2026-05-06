"use client";

import { Eye, EyeOff, Loader2, X } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { MarketingAuthModalMode } from "@/components/auth/marketing-auth-shell";
import { startGoogleOAuthSignIn } from "@/components/auth/oauth-google-client";
import { createClient } from "@/lib/supabase/client";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { ZYRA } from "@/lib/zyra/site";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function duplicateEmailMessage(err: unknown): boolean {
  const msg =
    typeof err === "object" &&
    err !== null &&
    "message" in err &&
    typeof (err as { message: unknown }).message === "string"
      ? (err as { message: string }).message.toLowerCase()
      : "";
  return (
    msg.includes("already been registered") ||
    msg.includes("already registered") ||
    msg.includes("user already registered") ||
    msg.includes("email address is already registered")
  );
}

const RESET_COOLDOWN_MS = 60_000;
const RESET_MIN_INTERVAL_MS = 3_000;

type SubView = "main" | "forgot-password";

type PasswordFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  minLength?: number;
  required?: boolean;
  disabled?: boolean;
  showPassword: boolean;
  onToggleVisibility: () => void;
};

function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  minLength,
  required,
  disabled,
  showPassword,
  onToggleVisibility,
}: PasswordFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="text-xs font-semibold text-foreground">
        {label}
      </label>
      <div className="relative mt-1.5">
        <input
          id={id}
          type={showPassword ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          minLength={minLength}
          disabled={disabled}
          className="w-full rounded-xl border border-border bg-background py-2.5 pl-3 pr-11 text-sm outline-none ring-accent/20 focus:ring-2 disabled:opacity-60"
        />
        <button
          type="button"
          onClick={onToggleVisibility}
          disabled={disabled}
          aria-controls={id}
          aria-label={showPassword ? "Hide password" : "Show password"}
          aria-pressed={showPassword}
          className="absolute inset-y-0 right-0 flex items-center justify-center rounded-r-xl px-3 text-muted transition hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent disabled:pointer-events-none"
        >
          {showPassword ? <EyeOff className="size-4 shrink-0" aria-hidden /> : <Eye className="size-4 shrink-0" aria-hidden />}
        </button>
      </div>
    </div>
  );
}

type AuthChoiceModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMode: MarketingAuthModalMode;
};

export function AuthChoiceModal({ open, onOpenChange, initialMode }: AuthChoiceModalProps) {
  const dialogTitleId = useId();
  const dialogDescId = useId();
  const forgotEmailRef = useRef<HTMLInputElement>(null);
  const lastResetAttemptRef = useRef(0);

  const [mode, setMode] = useState<MarketingAuthModalMode>(initialMode);
  const [subView, setSubView] = useState<SubView>("main");

  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signinEmail, setSigninEmail] = useState("");
  const [signinPassword, setSigninPassword] = useState("");

  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSigninPassword, setShowSigninPassword] = useState(false);

  const [resetEmail, setResetEmail] = useState("");
  const [resetBusy, setResetBusy] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetCooldownUntil, setResetCooldownUntil] = useState(0);

  const [googleBusy, setGoogleBusy] = useState(false);
  const [submitBusy, setSubmitBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const [, setCooldownTick] = useState(0);
  const nowCooldownMs =
    resetSuccess && resetCooldownUntil > Date.now()
      ? Math.max(0, resetCooldownUntil - Date.now())
      : 0;

  useEffect(() => {
    if (!open || resetCooldownUntil <= Date.now()) return;
    const id = window.setInterval(() => setCooldownTick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, [open, resetCooldownUntil]);

  useEffect(() => {
    if (!open) return;
    setMode(initialMode);
    setSubView("main");
    setFormError(null);
    setFormSuccess(null);
    setResetError(null);
    setResetSuccess(false);
    setResetEmail("");
    setShowSigninPassword(false);
    setShowSignupPassword(false);
  }, [open, initialMode]);

  useEffect(() => {
    if (!open || subView !== "forgot-password") return;
    const t = window.setTimeout(() => forgotEmailRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [open, subView]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const clearMessages = useCallback(() => {
    setFormError(null);
    setFormSuccess(null);
  }, []);

  const goToForgotPassword = useCallback(() => {
    clearMessages();
    setResetError(null);
    setResetSuccess(false);
    setResetEmail(signinEmail.trim());
    setSubView("forgot-password");
  }, [signinEmail, clearMessages]);

  const goToMainFromForgot = useCallback(() => {
    setSubView("main");
    setResetError(null);
    setResetSuccess(false);
    setResetBusy(false);
  }, []);

  const switchMode = useCallback(
    (next: MarketingAuthModalMode) => {
      setMode(next);
      clearMessages();
      setSubView("main");
      setResetError(null);
      setResetSuccess(false);
    },
    [clearMessages],
  );

  async function handleGoogle() {
    clearMessages();
    const { isConfigured } = getSupabasePublicEnv();
    if (!isConfigured) {
      setFormError("Supabase is not configured. Check .env.local.");
      return;
    }
    setGoogleBusy(true);
    const errMsg = await startGoogleOAuthSignIn();
    setGoogleBusy(false);
    if (errMsg) setFormError(errMsg);
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    clearMessages();
    const name = signupName.trim();
    const email = signupEmail.trim();
    const password = signupPassword;

    if (!name) {
      setFormError("Please enter your name.");
      return;
    }
    if (!isValidEmail(email)) {
      setFormError("Enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setFormError("Password must be at least 8 characters.");
      return;
    }

    const { isConfigured } = getSupabasePublicEnv();
    if (!isConfigured) {
      setFormError("Supabase is not configured.");
      return;
    }

    setSubmitBusy(true);
    try {
      const supabase = createClient();
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${origin}/auth/callback`,
          data: {
            full_name: name,
            name,
          },
        },
      });

      if (error) {
        if (duplicateEmailMessage(error)) {
          setFormError(
            "An account may already exist with this email. Try signing in instead—or use Google if that’s how you joined.",
          );
          setSubmitBusy(false);
          return;
        }
        setFormError(error.message);
        setSubmitBusy(false);
        return;
      }

      if (data.session) {
        window.location.assign("/app");
        return;
      }

      setFormSuccess("Check your email—we sent a confirmation link. After confirming, sign in here.");
      setSignupPassword("");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Signup failed.");
    } finally {
      setSubmitBusy(false);
    }
  }

  async function handleSignin(e: React.FormEvent) {
    e.preventDefault();
    clearMessages();
    const email = signinEmail.trim();
    const password = signinPassword;

    if (!isValidEmail(email)) {
      setFormError("Enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setFormError("Password must be at least 8 characters.");
      return;
    }

    const { isConfigured } = getSupabasePublicEnv();
    if (!isConfigured) {
      setFormError("Supabase is not configured.");
      return;
    }

    setSubmitBusy(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setFormError(error.message.includes("Invalid login") ? "Incorrect email or password." : error.message);
        setSubmitBusy(false);
        return;
      }

      window.location.assign("/app");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Sign-in failed.");
      setSubmitBusy(false);
    }
  }

  async function handlePasswordReset(e: React.FormEvent) {
    e.preventDefault();
    setResetError(null);
    setResetSuccess(false);

    const email = resetEmail.trim();
    if (!isValidEmail(email)) {
      setResetError("Enter a valid email address.");
      return;
    }

    const now = Date.now();
    if (now - lastResetAttemptRef.current < RESET_MIN_INTERVAL_MS) {
      return;
    }

    if (now < resetCooldownUntil) {
      setResetError("Please wait a moment before requesting another reset email.");
      return;
    }

    lastResetAttemptRef.current = now;

    const { isConfigured } = getSupabasePublicEnv();
    if (!isConfigured) {
      setResetError("Supabase is not configured.");
      return;
    }

    setResetBusy(true);
    try {
      const supabase = createClient();
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/auth/callback`,
      });

      if (error) {
        setResetError(error.message);
        setResetBusy(false);
        return;
      }

      setResetSuccess(true);
      setResetCooldownUntil(Date.now() + RESET_COOLDOWN_MS);
    } catch (err) {
      setResetError(err instanceof Error ? err.message : "Could not send reset email.");
    } finally {
      setResetBusy(false);
    }
  }

  const mainTitle =
    subView === "forgot-password"
      ? "Reset your password"
      : mode === "signup"
        ? "Create an account"
        : "Welcome back";

  const mainSubtitle =
    subView === "forgot-password"
      ? "We’ll email a secure reset link."
      : "Sign in or create an account";

  const resetSubmitDisabled =
    resetBusy ||
    !resetEmail.trim() ||
    !isValidEmail(resetEmail.trim()) ||
    Boolean(resetSuccess && nowCooldownMs > 0);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-8">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        onClick={() => onOpenChange(false)}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={dialogTitleId}
        aria-describedby={dialogDescId}
        className="relative z-[101] w-full max-w-[420px] rounded-2xl border border-border/80 bg-surface shadow-xl transition-[opacity,transform] duration-200 ease-out"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border/60 px-5 py-4">
          <div>
            <p id={dialogDescId} className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
              {subView === "forgot-password" ? "Account help" : `Welcome to ${ZYRA.name}`}
            </p>
            <h2 id={dialogTitleId} className="mt-1 font-serif text-xl font-semibold text-foreground">
              {mainTitle}
            </h2>
            {subView === "main" ? (
              <p className="mt-0.5 text-xs text-muted">{mainSubtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            className="rounded-full p-2 text-muted transition hover:bg-soft-rose/30 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          {subView === "main" ? (
            <>
              <button
                type="button"
                disabled={googleBusy}
                onClick={() => void handleGoogle()}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-border bg-background py-3 text-sm font-semibold text-foreground shadow-sm transition hover:border-accent/40 hover:bg-soft-rose/25 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                {googleBusy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                Continue with Google
              </button>

              <div className="flex items-center gap-3 py-1">
                <span className="h-px flex-1 bg-border/80" />
                <span className="text-[11px] font-medium uppercase tracking-wide text-muted">or email</span>
                <span className="h-px flex-1 bg-border/80" />
              </div>

              <div className="flex rounded-full border border-border/80 bg-background/90 p-0.5 text-xs font-semibold transition-colors">
                <button
                  type="button"
                  className={`flex-1 rounded-full px-3 py-2 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                    mode === "signin" ? "bg-accent text-accent-foreground shadow-sm" : "text-muted"
                  }`}
                  onClick={() => switchMode("signin")}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  className={`flex-1 rounded-full px-3 py-2 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                    mode === "signup" ? "bg-accent text-accent-foreground shadow-sm" : "text-muted"
                  }`}
                  onClick={() => switchMode("signup")}
                >
                  Create account
                </button>
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={goToMainFromForgot}
              className="text-sm font-semibold text-accent underline-offset-2 transition hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              ← Back to sign in
            </button>
          )}

          {subView === "main" && formError ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-950" role="alert">
              {formError}
            </p>
          ) : null}
          {subView === "main" && formSuccess ? (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950">
              {formSuccess}
            </p>
          ) : null}

          {subView === "forgot-password" && resetError ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-950" role="alert">
              {resetError}
            </p>
          ) : null}
          {subView === "forgot-password" && resetSuccess ? (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950">
              If an account exists for this email, a password reset link has been sent.
            </p>
          ) : null}

          <div
            className={`transition-[opacity] duration-200 ease-out ${subView === "main" ? "opacity-100" : "opacity-100"}`}
          >
            {subView === "main" && mode === "signup" ? (
              <form className="space-y-3" onSubmit={(e) => void handleSignup(e)}>
                <div>
                  <label htmlFor="auth-signup-name" className="text-xs font-semibold text-foreground">
                    Name
                  </label>
                  <input
                    id="auth-signup-name"
                    autoComplete="name"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    required
                    disabled={submitBusy}
                    className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none ring-accent/20 focus:ring-2 disabled:opacity-60"
                  />
                </div>
                <div>
                  <label htmlFor="auth-signup-email" className="text-xs font-semibold text-foreground">
                    Email
                  </label>
                  <input
                    id="auth-signup-email"
                    type="email"
                    autoComplete="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    required
                    disabled={submitBusy}
                    className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none ring-accent/20 focus:ring-2 disabled:opacity-60"
                  />
                </div>
                <PasswordField
                  id="auth-signup-password"
                  label="Password (min 8 characters)"
                  value={signupPassword}
                  onChange={setSignupPassword}
                  autoComplete="new-password"
                  minLength={8}
                  required
                  disabled={submitBusy}
                  showPassword={showSignupPassword}
                  onToggleVisibility={() => setShowSignupPassword((s) => !s)}
                />
                <button
                  type="submit"
                  disabled={submitBusy}
                  className="mt-1 flex w-full items-center justify-center gap-2 rounded-full bg-accent py-3 text-sm font-semibold text-accent-foreground outline-none transition hover:opacity-90 disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                >
                  {submitBusy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                  Create account
                </button>
              </form>
            ) : null}

            {subView === "main" && mode === "signin" ? (
              <form className="space-y-3" onSubmit={(e) => void handleSignin(e)}>
                <div>
                  <label htmlFor="auth-signin-email" className="text-xs font-semibold text-foreground">
                    Email
                  </label>
                  <input
                    id="auth-signin-email"
                    type="email"
                    autoComplete="email"
                    value={signinEmail}
                    onChange={(e) => setSigninEmail(e.target.value)}
                    required
                    disabled={submitBusy}
                    className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none ring-accent/20 focus:ring-2 disabled:opacity-60"
                  />
                </div>
                <PasswordField
                  id="auth-signin-password"
                  label="Password"
                  value={signinPassword}
                  onChange={setSigninPassword}
                  autoComplete="current-password"
                  minLength={8}
                  required
                  disabled={submitBusy}
                  showPassword={showSigninPassword}
                  onToggleVisibility={() => setShowSigninPassword((s) => !s)}
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={goToForgotPassword}
                    disabled={submitBusy}
                    className="text-xs font-semibold text-accent underline-offset-2 transition hover:underline disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    Forgot password?
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={submitBusy}
                  className="mt-1 flex w-full items-center justify-center gap-2 rounded-full bg-accent py-3 text-sm font-semibold text-accent-foreground outline-none transition hover:opacity-90 disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                >
                  {submitBusy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                  Sign in
                </button>
              </form>
            ) : null}

            {subView === "forgot-password" ? (
              <form className="space-y-3" onSubmit={(e) => void handlePasswordReset(e)}>
                <div>
                  <label htmlFor="auth-reset-email" className="text-xs font-semibold text-foreground">
                    Email
                  </label>
                  <input
                    ref={forgotEmailRef}
                    id="auth-reset-email"
                    type="email"
                    autoComplete="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                    disabled={resetBusy}
                    className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none ring-accent/20 focus:ring-2 disabled:opacity-60"
                  />
                </div>
                <button
                  type="submit"
                  disabled={resetSubmitDisabled}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-accent py-3 text-sm font-semibold text-accent-foreground outline-none transition hover:opacity-90 disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                >
                  {resetBusy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                  Send reset link
                </button>
                {nowCooldownMs > 0 && !resetBusy ? (
                  <p className="text-center text-[11px] text-muted">
                    You can request again in {Math.ceil(nowCooldownMs / 1000)}s.
                  </p>
                ) : null}
              </form>
            ) : null}
          </div>

          <p className="pb-2 text-center text-[11px] leading-relaxed text-muted">
            {ZYRA.name} does not diagnose or treat. Protected areas require authentication.
          </p>
        </div>
      </div>
    </div>
  );
}
