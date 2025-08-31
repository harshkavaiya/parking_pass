"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import {
  BarChart3,
  CheckCircle,
  Leaf,
  QrCode,
  ShieldCheck,
  Timer,
} from "lucide-react";
import Image from "next/image";

export function About() {
  const isMobile = useIsMobile();
  return (
    <section
      id="about"
      className="mx-auto p-0 py-16 md:py-20"
      style={{
        background:
          "linear-gradient(to bottom, rgba(16,185,129,0.12), rgba(34,211,238,0.18), transparent)",
      }}
    >
      <div className="grid grid-cols-1 items-start gap-10 md:grid-cols-2">
        <div className="flex justify-center">
          <Image
            src="/about.png"
            // width={isMobile ? 300 : 450}
            // height={isMobile ? 300 : 450}
            width={ 450}
            height={ 450}
            alt="Mobile QR scan illustration"
          />
        </div>
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl font-bold md:text-4xl bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent">
            Why Slipzy?
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-slate-600">
            Slipzy transforms the way parking owners manage passes — making the
            entire system smarter, faster, and more secure. Forget messy
            registers and paper slips — go fully digital and grow your revenue
            with ease.
          </p>
          <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto px-6">
            {/* Feature 1 */}
            <div className="group rounded-xl border border-slate-200 bg-white flex flex-col items-center justify-center p-6 shadow-sm hover:shadow-md transition">
              <QrCode className="h-8 w-8 text-emerald-500 mb-4" />
              <h3 className="font-semibold text-lg text-slate-800">
                Digital Passes with QR Security
              </h3>
            </div>

            {/* Feature 2 */}
            <div className="group rounded-xl border border-slate-200 bg-white flex flex-col items-center justify-center p-6 shadow-sm hover:shadow-md transition">
              <Timer className="h-8 w-8 text-cyan-500 mb-4" />
              <h3 className="font-semibold text-lg text-slate-800">
                Seamless Entry & Exit
              </h3>
            </div>

            {/* Feature 3 */}
            <div className="group rounded-xl border border-slate-200 bg-white flex flex-col items-center justify-center p-6 shadow-sm hover:shadow-md transition">
              <ShieldCheck className="h-8 w-8 text-rose-500 mb-4" />
              <h3 className="font-semibold text-lg text-slate-800">
                Fraud Prevention
              </h3>
            </div>

            {/* Feature 4 */}
            <div className="group rounded-xl border border-slate-200 bg-white flex flex-col items-center justify-center p-6 shadow-sm hover:shadow-md transition">
              <BarChart3 className="h-8 w-8 text-indigo-500 mb-4" />
              <h3 className="font-semibold text-lg text-slate-800">
                Smart Analytics
              </h3>
            </div>

            {/* Feature 5 */}
            <div className="group rounded-xl border border-slate-200 bg-white flex flex-col items-center justify-center p-6 shadow-sm hover:shadow-md transition">
              <CheckCircle className="h-8 w-8 text-amber-500 mb-4" />
              <h3 className="font-semibold text-lg text-slate-800">
                Save Time & Manpower
              </h3>
            </div>

            {/* Feature 6 */}
            <div className="group rounded-xl border border-slate-200 bg-white flex flex-col items-center justify-center p-6 shadow-sm hover:shadow-md transition">
              <Leaf className="h-8 w-8 text-green-500 mb-4" />
              <h3 className="font-semibold text-lg text-slate-800">
                Eco-Friendly & Paperless
              </h3>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
