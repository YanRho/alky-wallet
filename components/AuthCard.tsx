"use client";
import React, { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export interface AuthCardProps {
  mode: "login" | "signup";
}

export default function AuthCard({ mode }: AuthCardProps) {
  const isLogin = mode === "login";
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const normalizedEmail = form.email.trim().toLowerCase();

      if (isLogin) {
        const res = await signIn("credentials", {
          email: normalizedEmail,
          password: form.password,
          redirect: false, 
        });

        if (!res) {
          setError("No response from auth server");
        } else if (res.error) {
          setError(res.error === "CredentialsSignin" ? "Invalid email or password" : res.error);
        } else if (res.ok) {
          router.push("/dashboard");
        } else {
          setError(`Login failed${res.status ? ` (status ${res.status})` : ""}`);
        }
      } else {
        if (form.password !== form.confirm) {
          setError("Passwords do not match");
          setLoading(false);
          return;
        }

        // Create account
        const r = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name.trim(),
            email: normalizedEmail,
            password: form.password,
          }),
        });

        if (!r.ok) {
          let msg = "Could not create account";
          try {
            const data = await r.json();
            if (data?.error) msg = data.error;
          } catch {}
          setError(msg);
          return;
        }

        // Auto-login after successful signup
        const res = await signIn("credentials", {
          email: normalizedEmail,
          password: form.password,
          redirect: false,
        });

        if (!res) {
          setError("Account created, but no response from auth server.");
        } else if (res.error) {
          setError("Account created, but auto-login failed. Try logging in.");
        } else if (res.ok) {
          router.push("/dashboard");
        } else {
          setError("Account created, but could not complete login.");
        }
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100 p-6">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-lg border border-neutral-200 p-6">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-semibold text-gray-900">
            {isLogin ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-gray-700 text-sm mt-1">
            {isLogin ? "Log in to continue to Gala" : "Sign up to start planning with friends"}
          </p>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-900" htmlFor="name">
                Name
              </label>
              <input
                id="name"
                type="text"
                placeholder="Your name"
                className="mt-1 w-full rounded-lg border border-gray-400 bg-white text-gray-900 placeholder-gray-500 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-900/30 focus:border-gray-900"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-900" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              className="mt-1 w-full rounded-lg border border-gray-400 bg-white text-gray-900 placeholder-gray-500 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-900/30 focus:border-gray-900"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-900" htmlFor="password">
                Password
              </label>
              {isLogin && (
                <a className="text-xs text-gray-700 hover:underline" href="#">
                  Forgot Password?
                </a>
              )}
            </div>
            <input
              id="password"
              type="password"
              placeholder={isLogin ? "Your password" : "Create a password"}
              className="mt-1 w-full rounded-lg border border-gray-400 bg-white text-gray-900 placeholder-gray-500 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-900/30 focus:border-gray-900"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-900" htmlFor="confirm">
                Confirm password
              </label>
              <input
                id="confirm"
                type="password"
                placeholder="Confirm password"
                className="mt-1 w-full rounded-lg border border-gray-400 bg-white text-gray-900 placeholder-gray-500 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-900/30 focus:border-gray-900"
                required
                minLength={8}
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              />
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gray-900 text-white py-2.5 font-medium hover:bg-black transition disabled:opacity-60"
          >
            {loading ? (isLogin ? "Logging in…" : "Creating…") : isLogin ? "Log in" : "Create account"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-800">
          {isLogin ? (
            <>
              Don't have an account?{" "}
              <Link href="/signup" className="font-medium text-gray-900 hover:underline">
                Sign up
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-gray-900 hover:underline">
                Log in
              </Link>
            </>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-gray-700">
          By continuing, you agree to Gala’s Terms and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
