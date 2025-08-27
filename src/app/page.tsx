"use client";

import { useRouter } from "next/navigation";
import { SignedIn, SignedOut } from '@clerk/nextjs';
import { NextSeoNoSSR } from "@/components/seo/NoSSRSeo";

// Import all the Landing components
import Navbar from "@/components/Landing/Navbar";
import HeroSection from "@/components/Landing/HeroSection";
import ProblemSolutionSection from "@/components/Landing/ProblemSolutionSection";
import FeatureCards from "@/components/Landing/FeatureCards";
import WorkflowSection from "@/components/Landing/WorkflowSection";
import TeamCollaborationSection from "@/components/Landing/TeamCollaborationSection";
import StatsSection from "@/components/Landing/StatsSection";
import PricingSection from "@/components/Landing/PricingSection";
import FAQSection from "@/components/Landing/FAQSection";
import ContactSection from "@/components/Landing/ContactSection";
import Footer from "@/components/Landing/Footer";

export default function LandingPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-background">
      <NextSeoNoSSR
        title="Streamline Your YouTube Team Workflow"
        description="The modern way to collaborate on YouTube content. Upload, review, approve, and publish with your team."
        canonical={typeof window !== "undefined" ? window.location.origin + "/" : undefined}
        openGraph={{
          url: typeof window !== "undefined" ? window.location.href : undefined,
          title: "Streamline Your YouTube Team Workflow",
          description: "The modern way to collaborate on YouTube content. Upload, review, approve, and publish with your team.",
        }}
      />
      
      <Navbar />
      <HeroSection />
      <WorkflowSection />
      <FeatureCards />
      <ProblemSolutionSection />
      <TeamCollaborationSection />
      <StatsSection />
      <PricingSection />
      <FAQSection />
      <ContactSection />
      <Footer />
    </main>
  );
}