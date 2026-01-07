"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { 
  CheckCircle, 
  ArrowRight,
  Sparkles,
  FileText,
  Image,
  Video,
  Play,
  Calendar,
  BarChart3
} from "lucide-react";
import OnboardingLayout from "../layout";
import { useOnboarding } from "@/hooks/useOnboarding";

const MotionDiv = motion.div;
const MotionCard = motion.div;

const features = [
  {
    id: 'text',
    title: 'Text Posts',
    description: 'Create engaging text content',
    icon: FileText,
    color: 'bg-primary/10 text-primary'
  },
  {
    id: 'image',
    title: 'Image Posts',
    description: 'Share beautiful images',
    icon: Image,
    color: 'bg-accent/10 text-accent'
  },
  {
    id: 'video',
    title: 'Video Content',
    description: 'Upload and share videos',
    icon: Video,
    color: 'bg-destructive/10 text-destructive'
  },
  {
    id: 'reel',
    title: 'Reels',
    description: 'Create short-form videos',
    icon: Play,
    color: 'bg-muted text-foreground'
  },
  {
    id: 'schedule',
    title: 'Schedule Posts',
    description: 'Plan your content calendar',
    icon: Calendar,
    color: 'bg-warning/15 text-warning'
  },
  {
    id: 'analytics',
    title: 'Analytics',
    description: 'Track your performance',
    icon: BarChart3,
    color: 'bg-success/10 text-success'
  }
];

type OnboardingSummary = {
  userType: string | null;
  teamName: string | null;
  teamType: string | null;
  connectedAccounts: string[];
};

export default function GetStartedPage() {
  const router = useRouter();
  const { completeOnboarding } = useOnboarding();
  const [onboardingData, setOnboardingData] = useState<OnboardingSummary>({
    userType: null,
    teamName: null,
    teamType: null,
    connectedAccounts: [],
  });

  useEffect(() => {
    // Get onboarding data from localStorage
    const userType = localStorage.getItem('onboarding_user_type');
    const teamName = localStorage.getItem('onboarding_team_name');
    const teamType = localStorage.getItem('onboarding_team_type');
    const connectedAccounts = localStorage.getItem('onboarding_connected_accounts');

    setOnboardingData({
      userType,
      teamName,
      teamType,
      connectedAccounts: connectedAccounts ? JSON.parse(connectedAccounts) : []
    });
  }, []);

  const handleGetStarted = async () => {
    try {
      // Clear onboarding data from localStorage
      localStorage.removeItem('onboarding_user_type');
      localStorage.removeItem('onboarding_team_name');
      localStorage.removeItem('onboarding_team_type');
      localStorage.removeItem('onboarding_connected_accounts');
      localStorage.removeItem('onboarding_selected_plan');
      // Legacy key from older onboarding versions (safe to clear)
      localStorage.removeItem('onboarding_subscription');
      
      // Mark onboarding as completed in database and redirect
      await completeOnboarding();
    } catch (error) {
      console.error('Error completing onboarding:', error);
      alert(error instanceof Error ? error.message : 'Failed to complete onboarding. Please try again.');
    }
  };

  const handleBack = () => {
    router.push('/onboarding/billing');
  };

  return (
    <OnboardingLayout 
      currentStep={4} 
      totalSteps={4} 
      onBack={handleBack}
    >
      <div className="text-center space-y-8">
        {/* Header */}
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="space-y-4"
        >
          <div className="flex items-center justify-center gap-2 text-primary font-medium">
            <CheckCircle className="w-5 h-5" />
            Almost ready!
          </div>
          
          <div>
            <h1 className="text-3xl font-semibold text-foreground mb-4">
              You're all set!
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg mx-auto">
              Welcome to Uplora! Here's what you can do to get started
            </p>
          </div>
        </MotionDiv>


        {/* Features */}
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-4xl mx-auto"
        >
          <h3 className="text-2xl font-semibold text-foreground mb-6">
            What you can do with Uplora
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <MotionCard
                  key={feature.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  whileHover={{ scale: 1.02 }}
                >
                  <Card className="h-full hover:shadow-soft transition-shadow border-border">
                    <CardContent className="p-4 text-center">
                      <div className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center mx-auto mb-3`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <h4 className="font-semibold text-foreground mb-1">
                        {feature.title}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                </MotionCard>
              );
            })}
          </div>
        </MotionDiv>

        {/* Get Started Button */}
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="pt-4"
        >
          <Button
            onClick={handleGetStarted}
            size="lg"
            className="px-12 py-4 text-xl font-medium gradient-primary text-primary-foreground shadow-medium hover:shadow-strong"
          >
            <Sparkles className="w-6 h-6 mr-2" />
            Get Started with Uplora
            <ArrowRight className="w-6 h-6 ml-2" />
          </Button>
        </MotionDiv>

        {/* Help Text */}
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="pt-4"
        >
          <p className="text-sm text-muted-foreground">
            Need help? Check out our <a href="#" className="text-primary hover:underline">getting started guide</a>
          </p>
        </MotionDiv>
      </div>
    </OnboardingLayout>
  );
}