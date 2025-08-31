import Image from "next/image";
import Link from "next/link";

export function Hero() {
  return (
    <section id="home" className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(900px 500px at 80% -10%, rgba(34,211,238,0.18), transparent), radial-gradient(800px 500px at -10% 10%, rgba(16,185,129,0.12), transparent)",
        }}
      />
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
        <div className="flex flex-col gap-6">
          <h1 className="text-balance text-4xl font-bold leading-tight md:text-5xl text-center md:text-left ">
            Slipzy – Smart Parking Pass System
          </h1>
          <p className="text-pretty text-lg leading-relaxed text-slate-600 md:text-base text-center md:text-left">
            No more slips. No more fraud. A seamless QR-based pass system for
            parking owners.
          </p>
          <div className="flex flex-col md:flex-row items-center gap-3 md:justify-start justify-center px-3 md:p-0">
            <Link
              href="#contact"
              className="rounded-lg w-full bg-gradient-to-r from-cyan-500 to-emerald-500 px-5 py-3 text-white shadow hover:from-cyan-600 hover:to-emerald-600 text-lg font-bold text-center"
            >
              Get Started
            </Link>
            <Link
              href="#features"
              className="rounded-lg w-full text-center border px-5 py-3 text-slate-800 hover:bg-slate-50"
            >
              See Features
            </Link>
          </div>
        </div>
        <div className="mx-auto flex w-full max-w-sm items-center justify-center md:max-w-md">
          <Image
            src="/hero.png"
            width={360}
            height={360}
            alt="Slipzy logo"
            className="rounded-xl"
            priority
          />
        </div>
      </div>
    </section>
  );
}
