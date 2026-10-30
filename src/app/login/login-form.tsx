"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { LogIn } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Panel, PanelHeader, PanelBody } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      setMessage("Account created successfully. Please sign in.");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/sign-in/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error?.message ?? "Invalid email or password.");
        return;
      }

      if (data?.user) {
        window.location.href = next;
      } else {
        setError("Sign-in failed. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-canvas flex items-center justify-center pb-20 sm:pb-0">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-md focus:bg-ink focus:px-4 focus:py-2 focus:text-sand">
        Skip to content
      </a>
      <div className="shell-narrow">
        <Panel className="w-full max-w-lg">
          <PanelHeader
            title="Sign in"
            description="Welcome back to Stellar Family Salon. Enter your details below."
            icon={<LogIn className="size-5" />}
          />
          <PanelBody className="space-y-5">
            {message && (
              <div className="rounded-lg bg-brand/10 p-4 text-sm text-brand-text border border-brand/20">
                {message}
              </div>
            )}
            {error && (
              <div className="rounded-lg bg-ink/50 p-4 text-sm text-fg-2 border border-ink/30">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <Field
                label="Email address"
                hint="We'll use this to sign you in."
                error={error}
              >
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full"
                />
              </Field>
              <Field label="Password" hint="Your account password.">
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full"
                />
              </Field>
              <Button type="submit" className="w-full bg-brand text-brand-fg hover:bg-brand/90" disabled={loading}>
                {loading ? "Signing in…" : "Sign in"}
                <LogIn className="size-4 ml-2" />
              </Button>
            </form>
          </PanelBody>
          <div className="border-t border-line p-5">
            <p className="text-sm text-fg-2 mb-4">Don't have an account?</p>
            <Link
              href="/signup"
              className="text-sm text-brand-text hover:underline flex items-center gap-1"
            >
              Create an account <LogIn className="size-3.5" />
            </Link>
            <p className="mt-6 text-xs text-fg-2 leading-relaxed">
              Demo accounts (password = DEMO_PASSWORD): admin@stellar-demo.example · priya.sharma@stellar-demo.example · riya.banerjee@stellar-demo.example
            </p>
          </div>
        </Panel>
      </div>
    </div>
  );
}
