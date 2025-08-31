import { QrCode, LayoutDashboard, ShieldCheck, Smartphone } from "lucide-react";

const features = [
  {
    title: "QR-Based Entry",
    desc: "Prevents duplicate or fake entries.",
    Icon: QrCode,
  },
  {
    title: "Real-time Dashboard",
    desc: "Track all parking usage in one place.",
    Icon: LayoutDashboard,
  },
  {
    title: "Fraud Detection",
    desc: "Stops pass misuse instantly.",
    Icon: ShieldCheck,
  },
  {
    title: "Easy Setup",
    desc: "Works with phone or tablet, no expensive hardware needed.",
    Icon: Smartphone,
  },
];

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-4 pb-28 ">
      {/* Heading */}
      <h2 className="text-center text-3xl font-bold md:text-4xl bg-gradient-to-r from-cyan-500 to-emerald-500 bg-clip-text text-transparent">
        Powerful, Simple Features
      </h2>
      <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600 text-lg">
        Everything you need to manage parking passes digitally and securely.
      </p>

      {/* Features Grid */}
      <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
        {features.map(({ title, desc, Icon }) => (
          <div
            key={title}
            className="rounded-2xl border bg-white p-6 shadow-sm transition hover:shadow-lg hover:-translate-y-1"
          >
            {/* Icon Container */}
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-50 to-emerald-50 shadow-inner">
              <Icon className="h-7 w-7 text-cyan-600" aria-hidden />
            </div>

            {/* Title */}
            <h3 className="text-lg font-semibold text-center text-slate-800">
              {title}
            </h3>

            {/* Description */}
            <p className="mt-3 text-sm leading-relaxed text-slate-600 text-center">
              {desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
