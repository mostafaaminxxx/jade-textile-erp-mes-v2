"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { LogIn, LogOut, UserPlus } from "lucide-react";
import { ProfileStatusPanel } from "@/components/auth/ProfileStatusPanel";
import { getSupabaseClient, getSupabasePublicConfig } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function LoginAuthPanel() {
  const config = getSupabasePublicConfig();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function refreshUser() {
    const client = getSupabaseClient();

    if (!client) {
      setUser(null);
      setMessage("Supabase connection required.");
      return;
    }

    const { data, error } = await client.auth.getUser();
    setUser(error ? null : data.user);
  }

  useEffect(() => {
    refreshUser();
  }, []);

  async function handleSignIn() {
    const client = getSupabaseClient();

    if (!client) {
      setMessage("Supabase connection required.");
      return;
    }

    setIsSubmitting(true);
    const { error } = await client.auth.signInWithPassword({ email, password });
    setIsSubmitting(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Signed in.");
    await refreshUser();
  }

  async function handleSignUp() {
    const client = getSupabaseClient();

    if (!client) {
      setMessage("Supabase connection required.");
      return;
    }

    setIsSubmitting(true);
    const { error } = await client.auth.signUp({ email, password });
    setIsSubmitting(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(
      "User created. A profile role must be assigned by an admin before operational writes are enabled.",
    );
    await refreshUser();
  }

  async function handleSignOut() {
    const client = getSupabaseClient();

    if (!client) {
      setMessage("Supabase connection required.");
      return;
    }

    setIsSubmitting(true);
    const { error } = await client.auth.signOut({ scope: "local" });
    setIsSubmitting(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setUser(null);
    setMessage("Signed out from this browser.");
  }

  const disabled = !config.isConfigured || isSubmitting;

  return (
    <div className="space-y-5">
      <div
        className={cn(
          "rounded-md border px-4 py-3 text-sm font-semibold",
          config.isConfigured
            ? "border-emerald-200 bg-emerald-50 text-emerald-900"
            : "border-orange-200 bg-orange-50 text-orange-900",
        )}
      >
        {config.isConfigured
          ? "Supabase client variables are present."
          : "Supabase connection required."}
      </div>

      <div className="rounded-md border border-jade-line bg-jade-panel p-4 text-sm text-jade-steel">
        <p className="font-bold text-jade-ink">Current user status</p>
        <p className="mt-2 break-all font-semibold">
          {user ? `${user.email ?? "Signed-in user"} (${user.id})` : "No active browser session."}
        </p>
      </div>

      <div className="grid gap-4">
        <label className="text-sm font-bold text-jade-ink">
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 w-full rounded-md border border-jade-line px-3 py-3 text-sm font-semibold text-jade-ink outline-none focus:border-jade-blue"
            autoComplete="email"
          />
        </label>
        <label className="text-sm font-bold text-jade-ink">
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 w-full rounded-md border border-jade-line px-3 py-3 text-sm font-semibold text-jade-ink outline-none focus:border-jade-blue"
            autoComplete="current-password"
          />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          disabled={disabled}
          onClick={handleSignIn}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-jade-blue px-4 py-3 text-sm font-black text-white transition hover:bg-blue-800 disabled:bg-slate-300"
        >
          <LogIn className="h-4 w-4" aria-hidden="true" />
          Sign in
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={handleSignUp}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-jade-line px-4 py-3 text-sm font-black text-jade-ink transition hover:border-jade-blue disabled:text-slate-400"
        >
          <UserPlus className="h-4 w-4" aria-hidden="true" />
          Sign up
        </button>
      </div>

      {user ? (
        <button
          type="button"
          disabled={disabled}
          onClick={handleSignOut}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-black text-orange-900 transition hover:bg-orange-100 disabled:text-slate-400"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Sign out
        </button>
      ) : null}

      {message ? (
        <div className="rounded-md border border-jade-line bg-white px-4 py-3 text-sm font-semibold text-jade-ink">
          {message}
        </div>
      ) : null}

      <ProfileStatusPanel key={user?.id ?? "anonymous"} compact />
    </div>
  );
}
