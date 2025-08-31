import {
  Ticket,
  Smartphone,
  ScanLine,
  ShieldCheck,
  BarChart3,
} from "lucide-react";
import { Badge } from "../ui/badge";

const steps = [
  { title: "Owner generates pass (QR).", Icon: Ticket },
  { title: "Customer gets QR via mobile link.", Icon: Smartphone },
  { title: "At parking gate, QR is scanned.", Icon: ScanLine },
  { title: "Slipzy validates and records entry.", Icon: ShieldCheck },
  { title: "Dashboard shows data instantly.", Icon: BarChart3 },
];

export function SystemFlow() {
  return (
    <section id="flow" className="mx-auto max-w-6xl px-4 py-16 md:py-20">
      {/* Heading */}
      <h2 className="text-center text-3xl font-bold md:text-4xl bg-gradient-to-r from-cyan-500 to-emerald-500 bg-clip-text text-transparent">
        How it works
      </h2>
      <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600 text-lg">
        A simple, secure flow from pass creation to real-time insights.
      </p>

      {/* Steps */}
      <ol className="relative mt-14 grid grid-cols-1 gap-8 md:grid-cols-5">
        {steps.map(({ title, Icon }, i) => (
          <li
            key={title}
            className="relative rounded-xl border bg-white p-6 text-center shadow-sm transition hover:shadow-lg hover:-translate-y-1"
          >
            {/* Icon */}
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-cyan-50 to-emerald-50 shadow-inner">
              <Icon className="h-7 w-7 text-cyan-600" aria-hidden />
            </div>

            {/* Title */}
            <p className="text-base font-medium text-slate-800">{title}</p>

            {/* Step Badge */}
            <span className="mt-3 block">
              <Badge
                variant="secondary"
                className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-700"
              >
                Step {i + 1}
              </Badge>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
