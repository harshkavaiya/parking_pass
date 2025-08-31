import { Linkedin, Mail, Twitter } from "lucide-react";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10">
        {/* Top Section */}
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          {/* Logo / Brand */}
          <div className="text-lg font-bold text-slate-800">Slipzy</div>

          {/* Navigation */}
          <nav className="flex flex-wrap items-center gap-6 text-sm font-medium text-slate-600">
            <Link href="#home" className="transition hover:text-slate-900">
              Home
            </Link>
            <Link href="#features" className="transition hover:text-slate-900">
              Features
            </Link>
            <Link href="#pricing" className="transition hover:text-slate-900">
              Pricing
            </Link>
            <Link href="#contact" className="transition hover:text-slate-900">
              Contact
            </Link>
          </nav>

          {/* Socials */}
          <div className="flex items-center gap-4">
            <Link
              href="mailto:your@email.com"
              className="text-slate-500 transition hover:text-slate-900"
              aria-label="Email"
            >
              <Mail className="h-5 w-5" />
            </Link>
            <Link
              href="https://linkedin.com/in/yourprofile"
              className="text-slate-500 transition hover:text-slate-900"
              aria-label="LinkedIn"
            >
              <Linkedin className="h-5 w-5" />
            </Link>
            <Link
              href="https://twitter.com/yourhandle"
              className="text-slate-500 transition hover:text-slate-900"
              aria-label="Twitter"
            >
              <Twitter className="h-5 w-5" />
            </Link>
          </div>
        </div>

        {/* Divider */}
        <div className="mt-8 border-t pt-6 text-center text-xs text-slate-500">
          © 2025 Slipzy. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
