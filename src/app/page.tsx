import DashboardLayout from "@/app/components/layout/DashboardLayout";
import HeroSection from "@/app/components/Landing/HeroSection";
import StatsSection from "@/app/components/Landing/StatsSection";
import FeatureCards from "@/app/components/Landing/FeatureCards";
import WorkflowSection from "@/app/components/Landing/WorkflowSection";
import ReviewsSection from "@/app/components/Landing/ReviewsSection";
import PricingSection from "@/app/components/Landing/PricingSection";
import FAQSection from "@/app/components/Landing/FAQSection";
import ClosingCTA from "@/app/components/Landing/ClosingCTA";

export default function Home() {
  return (
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
  );
}
