"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { User } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Panel, PanelHeader, PanelBody } from "@/components/ui/card";

export function SignupForm() {
  const searchParams = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (searchParams.get("error")) {
      setError(searchParams.get("error")!);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/sign-up/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error?.message ?? "Failed to create account. Please try again.");
        return;
      }

      setMessage("Account created! Redirecting to sign in...");
      setTimeout(() => {
        window.location.href = "/login?registered=true";
      }, 1500);
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
            title="Create account"
            description="Join Stellar Family Salon. Book appointments and manage your visits online."
            icon={<User className="size-5" />}
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
              <Field label="Full name" hint="Your name as it should appear on bookings.">
                <Input
                  type="text"
                  placeholder="Riya Banerjee"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full"
                />
              </Field>
              <Field label="Email address" hint="We'll use this to sign you in.">
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full"
                />
              </Field>
              <Field label="Password" hint="At least 8 characters.">
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full"
                />
              </Field>
              <Field label="Confirm password" hint="Type your password again.">
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full"
                />
              </Field>
              <Button type="submit" className="w-full bg-brand text-brand-fg hover:bg-brand/90" disabled={loading}>
                {loading ? "Creating account…" : "Create account"}
                <User className="size-4 ml-2" />
              </Button>
            </form>
          </PanelBody>
          <div className="border-t border-line p-5">
            <p className="text-sm text-fg-2 mb-4">Already have an account?</p>
            <Link
              href="/login"
              className="text-sm text-brand-text hover:underline flex items-center gap-1"
            >
              Sign in <User className="size-3.5" />
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
