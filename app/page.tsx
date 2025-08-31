import { SiteHeader } from "@/components/dashboard/site-header";
import { Hero } from "@/components/dashboard/hero";
import { Features } from "@/components/dashboard/features";
import { About } from "@/components/dashboard/about";
import { Pricing } from "@/components/dashboard/pricing";
import { SystemFlow } from "@/components/dashboard/system-flow";
import { Contact } from "@/components/dashboard/contact";
import { SiteFooter } from "@/components/dashboard/site-footer";

export default function Page() {
  return (
    <main>
      <SiteHeader />
      <Hero />
      <Features />
      <About />
      <Pricing />
      <SystemFlow />
      <Contact />
      <SiteFooter />
    </main>
  );
}
