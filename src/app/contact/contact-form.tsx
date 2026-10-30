"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { z } from "zod";

const ContactSchema = z.object({
  name: z.string().min(2, "Please enter your name"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  service: z.string().optional(),
  message: z.string().min(10, "Please tell us a bit more"),
});

export function ContactForm() {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [service, setService] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [error, setError] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, service, message }),
      });

      if (!res.ok) {
        setError("Failed to send message. Please try again.");
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="flex items-center justify-center w-full">
          <div className="rounded-lg bg-brand/10 p-6 text-sm text-brand-text border border-brand/20">
            Thank you! Your message has been received (demo — not actually sent).
          </div>
        </div>
        <Button onClick={() => setSubmitted(false)} className="mt-4 bg-brand text-brand-fg hover:bg-brand/90">
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-fg-2">Full name</label>
        <Input
          type="text"
          placeholder="Riya Banerjee"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full"
        />
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-fg-2">Email address</label>
        <Input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full"
        />
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-fg-2">Phone number</label>
        <Input
          type="tel"
          placeholder="+91 90000 00000"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          className="w-full"
        />
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-fg-2">Service of interest</label>
        <select
          value={service}
          onChange={(e) => setService(e.target.value)}
          className="w-full border border-line rounded-lg px-4 py-2.5 bg-surface text-fg focus:border-brand focus:outline-none transition-colors"
        >
          <option value="">Any service</option>
          <option value="haircut">Haircut & styling</option>
          <option value="colour">Hair colour & balayage</option>
          <option value="treatment">Smoothing & treatments</option>
          <option value="bridal">Bridal makeup & hair</option>
          <option value="nails">Manicure & pedicure</option>
          <option value="grooming">Beard trim & grooming</option>
        </select>
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-fg-2">Message</label>
        <textarea
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          className="w-full border border-line rounded-lg px-4 py-2.5 bg-surface text-fg focus:border-brand focus:outline-none transition-colors"
          placeholder="What can we help you with?"
        ></textarea>
      </div>
      {error && (
        <div className="rounded-lg bg-ink/50 p-4 text-sm text-fg-2 border border-ink/30">
          {error}
        </div>
      )}
      <Button type="submit" className="w-full bg-brand text-brand-fg hover:bg-brand/90" disabled={loading}>
        {loading ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
