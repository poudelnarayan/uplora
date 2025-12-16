import DashboardLayout from "@/app/components/layout/DashboardLayout";
import HeroSection from "@/app/components/Landing/HeroSection";
import ProblemSolutionSection from "@/app/components/Landing/ProblemSolutionSection";
import MotivationSection from "@/app/components/Landing/MotivationSection";
import FeatureCards from "@/app/components/Landing/FeatureCards";
import WorkflowSection from "@/app/components/Landing/WorkflowSection";
import TeamCollaborationSection from "@/app/components/Landing/TeamCollaborationSection";
import StatsSection from "@/app/components/Landing/StatsSection";
import PricingSection from "@/app/components/Landing/PricingSection";
import FAQSection from "@/app/components/Landing/FAQSection";
import ContactSection from "@/app/components/Landing/ContactSection";
import ReviewsSection from "@/app/components/Landing/ReviewsSection";

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
