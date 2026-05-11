import DashboardLayout from "@/app/components/layout/DashboardLayout";
import HeroSection from "@/app/components/Landing/HeroSection";
import StatsSection from "@/app/components/Landing/StatsSection";
import FeatureCards from "@/app/components/Landing/FeatureCards";
import WorkflowSection from "@/app/components/Landing/WorkflowSection";
import ReviewsSection from "@/app/components/Landing/ReviewsSection";
import PricingSection from "@/app/components/Landing/PricingSection";
import FAQSection from "@/app/components/Landing/FAQSection";
import ClosingCTA from "@/app/components/Landing/ClosingCTA";

/**
 * Landing page section order — modeled on proven SaaS funnels
 * (Linear / Vercel / Stripe / Notion):
 *
 *   1. Hero          — value prop + CTA + product mock
 *   2. Stats         — instant social proof
 *   3. Features      — what you actually get
 *   4. Workflow      — how it works in 3 steps
 *   5. Reviews       — voice of customer
 *   6. Pricing       — plain plans
 *   7. FAQ           — objection handling
 *   8. Closing CTA   — final ask
 *   9. Footer        — (rendered inside DashboardLayout)
 *
 * The old structure stacked Motivation + Problem/Solution + TeamCollab on
 * top of Workflow + Features — four sections all roughly answering "why
 * use this." The redesign folds those into Workflow + Features and drops
 * the Contact section (the Footer + closing CTA cover that surface).
 */
export default function Home() {
  return (
    <div className="theme-landing">
      <DashboardLayout>
        <HeroSection />
        <StatsSection />
        <FeatureCards />
        <WorkflowSection />
        <ReviewsSection />
        <PricingSection />
        <FAQSection />
        <ClosingCTA />
      </DashboardLayout>
    </div>
  );
}
