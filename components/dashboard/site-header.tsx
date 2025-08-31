"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link href="#home" className="flex items-center gap-2 group">
          <div
            aria-hidden
            className="h-8 w-8 rounded-md ring-2 ring-cyan-400 transition-transform group-hover:scale-105"
            style={{
              background:
                "conic-gradient(from 90deg at 50% 50%, #22d3ee, #10b981)",
            }}
            title="Slipzy"
          />
          <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-cyan-500 to-emerald-500 bg-clip-text text-transparent">
            Slipzy
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          {[
            { href: "#features", label: "Features" },
            { href: "#about", label: "About" },
            { href: "#pricing", label: "Pricing" },
            { href: "#flow", label: "System Flow" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="relative text-slate-700 transition hover:text-cyan-600 after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:bg-cyan-500 after:transition-all hover:after:w-full"
            >
              {link.label}
            </Link>
          ))}

          <Link
            href="#contact"
            className="rounded-md bg-gradient-to-r from-cyan-500 to-emerald-500 px-4 py-1.5 text-white shadow hover:from-cyan-600 hover:to-emerald-600 transition"
          >
            Get Started
          </Link>
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 text-slate-700 hover:text-cyan-600"
          aria-label="Toggle menu"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile Nav */}
      {open && (
        <div className="md:hidden border-t bg-white/95 backdrop-blur px-4 py-4 space-y-3">
          <Link
            href="#features"
            className="block text-slate-700 hover:text-cyan-600"
          >
            Features
          </Link>
          <Link
            href="#about"
            className="block text-slate-700 hover:text-cyan-600"
          >
            About
          </Link>
          <Link
            href="#pricing"
            className="block text-slate-700 hover:text-cyan-600"
          >
            Pricing
          </Link>
          <Link
            href="#flow"
            className="block text-slate-700 hover:text-cyan-600"
          >
            System Flow
          </Link>
          <Link
            href="#contact"
            className="mt-3 block rounded-md bg-gradient-to-r from-cyan-500 to-emerald-500 px-4 py-2 text-center text-white shadow hover:from-cyan-600 hover:to-emerald-600"
          >
            Get Started
          </Link>
        </div>
      )}
    </header>
  );
}
