import DashboardLayout from "@/components/layout/DashboardLayout";
import HeroSection from "@/components/Landing/HeroSection";
import ProblemSolutionSection from "@/components/Landing/ProblemSolutionSection";
import MotivationSection from "@/components/Landing/MotivationSection";
import FeatureCards from "@/components/Landing/FeatureCards";
import WorkflowSection from "@/components/Landing/WorkflowSection";
import TeamCollaborationSection from "@/components/Landing/TeamCollaborationSection";
import StatsSection from "@/components/Landing/StatsSection";
import PricingSection from "@/components/Landing/PricingSection";
import FAQSection from "@/components/Landing/FAQSection";
import ContactSection from "@/components/Landing/ContactSection";
import ReviewsSection from "@/components/Landing/ReviewsSection";

export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <DashboardLayout>
      <HeroSection />
      <MotivationSection />
      <WorkflowSection />
      <FeatureCards />
      <ProblemSolutionSection />
      <TeamCollaborationSection />
      <ReviewsSection />
      <StatsSection />
      <PricingSection />
      <FAQSection />
      <ContactSection />
    </DashboardLayout>
  );
}
