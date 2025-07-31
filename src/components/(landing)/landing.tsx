import Hero from "@/components/(landing)/hero";
import How from "@/components/(landing)/how";
import StickyCtaBar from "@/components/(landing)/sticky-cta-bar";
import Testimonials from "@/components/(landing)/testimonials";
import Why from "@/components/(landing)/why";
import Footer from "@/components/custom/footer";

// import { QuickSpeakingTest } from "@/components/custom/quick-speaking-test";

export default function LandingPage() {
  return (
    <>
      <Hero />
      <Why />
      <How />
      <Testimonials />
      {/* <QuickSpeakingTest /> */}
      <StickyCtaBar />
      <Footer />
    </>
  );
}
