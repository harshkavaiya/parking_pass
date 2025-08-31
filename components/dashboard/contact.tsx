"use client";

import type React from "react";
import { useState } from "react";
import Link from "next/link";
import { Linkedin, Mail, MessageCircle, Twitter } from "lucide-react";

export function Contact() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    // Simulate async submit; replace with a real API route later.
    setTimeout(() => setStatus("sent"), 800);
  }

  return (
    <section id="contact" className="mx-auto max-w-6xl px-4 py-16 md:py-20">
      {/* Heading */}
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold md:text-4xl bg-gradient-to-r from-cyan-500 to-emerald-500 bg-clip-text text-transparent">
          Interested? Let’s talk!
        </h2>
        <p className="mt-3 text-slate-600 text-lg">
          Contact us today to start using{" "}
          <span className="font-semibold text-slate-800">Slipzy</span> at your
          parking space.
        </p>
      </div>

      {/* Grid */}
      <div className="mx-auto mt-12 grid max-w-3xl grid-cols-1 gap-8 md:grid-cols-2">
        {/* Contact Form */}
        <form
          onSubmit={onSubmit}
          className="rounded-2xl border bg-white p-6 shadow-sm"
        >
          <div className="grid gap-5">
            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className="text-sm font-medium text-slate-700"
              >
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 shadow-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="text-sm font-medium text-slate-700"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 shadow-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            {/* Message */}
            <div>
              <label
                htmlFor="message"
                className="text-sm font-medium text-slate-700"
              >
                Message
              </label>
              <textarea
                id="message"
                name="message"
                rows={4}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 shadow-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={status !== "idle"}
              className="rounded-lg bg-gradient-to-r from-cyan-500 to-emerald-500 px-5 py-2.5 font-medium text-white shadow hover:from-cyan-600 hover:to-emerald-600 disabled:opacity-60"
            >
              {status === "sending"
                ? "Sending..."
                : status === "sent"
                ? "Sent!"
                : "Submit"}
            </button>
          </div>
        </form>

        {/* WhatsApp Contact */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-2">
            Prefer Quick Chat?
          </h3>
          <p className="text-sm text-slate-600 mb-5">
            Choose your favorite platform and connect with our team directly.
          </p>

          <div className="flex flex-col gap-3">
            {/* WhatsApp */}
            <Link
              href="https://wa.me/8238443846"
              className="flex items-center gap-3 rounded-lg border px-4 py-2 text-slate-800 font-medium shadow hover:bg-slate-50 transition"
            >
              <MessageCircle className="h-5 w-5 text-green-500" /> WhatsApp
            </Link>

            {/* Email */}
            <Link
              href="mailto:hkavaiya001@email.com"
              className="flex items-center gap-3 rounded-lg border px-4 py-2 text-slate-800 font-medium hover:bg-slate-50 transition"
            >
              <Mail className="h-5 w-5 text-cyan-500" /> Email Us
            </Link>

            {/* LinkedIn */}
            <Link
              href="https://linkedin.com/in/harshkavaiya"
              className="flex items-center gap-3 rounded-lg border px-4 py-2 text-slate-800 font-medium hover:bg-slate-50 transition"
            >
              <Linkedin className="h-5 w-5 text-blue-600" /> LinkedIn
            </Link>

            {/* Twitter */}
            <Link
              href="https://twitter.com/yourhandle"
              className="flex items-center gap-3 rounded-lg border px-4 py-2 text-slate-800 font-medium hover:bg-slate-50 transition"
            >
              <Twitter className="h-5 w-5 text-sky-500" /> Twitter
            </Link>
          </div>

          <p className="mt-4 text-xs text-slate-500">
            Replace these links with your business accounts.
          </p>
        </div>
      </div>
    </section>
  );
}
