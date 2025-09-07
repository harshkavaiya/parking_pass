import { Check } from "lucide-react";

type Plan = {
  name: string;
  price: string;
  features: string[];
  highlight?: boolean;
  ribbon?: string;
};

const plans: Plan[] = [
  {
    name: "Basic",
    price: "₹399/month",
    features: [
      "For small parking owners",
      "Upto 100 passes",
      "Basic QR validation",
      "Dashboard",
    ],
  },
  {
    name: "Standard",
    price: "₹799/month",
    features: [
      "For mid-size parking owners",
      "Upto 500 passes",
      "Dashboard + fraud detection",
      "Priority support",
    ],
    highlight: true,
    ribbon: "Best Seller",
  },
  {
    name: "Premium",
    price: "₹1499/month",
    features: [
      "For large parking owners",
      "Unlimited passes",
      "Full analytics dashboard",
      "Multi-staff access",
    ],
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="mx-auto max-w-6xl px-4 py-16 md:py-20">
      <h2 className="text-center text-3xl font-bold md:text-4xl bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent">
        Simple Pricing(testing)
      </h2>
      <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600 text-lg">
        Choose a plan that fits your parking size.
      </p>

      <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
        {plans.map((plan, idx) => (
          <div
            key={plan.name}
            className={`
            relative rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl p-8 shadow-sm
            ${
              plan.highlight
                ? "border-yellow-400 bg-gradient-to-b from-yellow-50 to-white shadow-lg scale-105 z-10"
                : "border-slate-200 bg-white"
            }
          `}
          >
            {/* Best Seller Ribbon */}
            {plan.ribbon ? (
              <div
                className={`absolute -top-3 right-6 rounded-full px-3 py-1 text-xs font-semibold shadow-md
              ${
                plan.highlight
                  ? "bg-gradient-to-r from-yellow-400 to-yellow-500 text-white"
                  : "bg-cyan-500 text-white"
              }`}
              >
                {plan.ribbon}
              </div>
            ) : null}

            {/* Plan Title */}
            <h3
              className={`text-xl font-semibold ${
                plan.highlight ? "text-yellow-600" : "text-slate-800"
              }`}
            >
              {plan.name} Plan
            </h3>

            {/* Price */}
            <p
              className={`mt-2 text-3xl font-bold ${
                plan.highlight ? "text-yellow-500" : "text-slate-900"
              }`}
            >
              {plan.price}
            </p>

            {/* Features */}
            <ul className="mt-6 space-y-3 text-sm">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check
                    className={`mt-0.5 h-4 w-4 ${
                      plan.highlight ? "text-yellow-500" : "text-emerald-500"
                    }`}
                  />
                  <span className="text-slate-700">{f}</span>
                </li>
              ))}
            </ul>

            {/* CTA Button */}
            <button
              className={`mt-8 w-full rounded-lg px-5 py-2.5 font-medium transition
              ${
                plan.highlight
                  ? "bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow hover:from-yellow-500 hover:to-yellow-600"
                  : "border text-slate-800 hover:bg-slate-50"
              }`}
              aria-label={`Choose ${plan.name} plan`}
            >
              Get Started
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
