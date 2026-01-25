"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/app/components/ui/button";
import { 
  CheckCircle, 
  ArrowRight,
  Sparkles,
  FileText,
  Image,
  Video,
  Play,
  Calendar,
  BarChart3,
  Rocket,
  Zap
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
    gradient: 'from-blue-500 to-cyan-500',
    bgGradient: 'from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20'
  },
  {
    id: 'image',
    title: 'Image Posts',
    description: 'Share beautiful images',
    icon: Image,
    gradient: 'from-purple-500 to-pink-500',
    bgGradient: 'from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20'
  },
  {
    id: 'video',
    title: 'Video Content',
    description: 'Upload and share videos',
    icon: Video,
    gradient: 'from-red-500 to-orange-500',
    bgGradient: 'from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20'
  },
  {
    id: 'reel',
    title: 'Reels',
    description: 'Create short-form videos',
    icon: Play,
    gradient: 'from-emerald-500 to-teal-500',
    bgGradient: 'from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20'
  },
  {
    id: 'schedule',
    title: 'Schedule Posts',
    description: 'Plan your content calendar',
    icon: Calendar,
    gradient: 'from-indigo-500 to-purple-500',
    bgGradient: 'from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20'
  },
  {
    id: 'analytics',
    title: 'Analytics',
    description: 'Track your performance',
    icon: BarChart3,
    gradient: 'from-amber-500 to-yellow-500',
    bgGradient: 'from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20'
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
  const [isCompleting, setIsCompleting] = useState(false);

  useEffect(() => {
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
    if (isCompleting) return;
    
    setIsCompleting(true);
    try {
      localStorage.removeItem('onboarding_user_type');
      localStorage.removeItem('onboarding_team_name');
      localStorage.removeItem('onboarding_team_type');
      localStorage.removeItem('onboarding_connected_accounts');
      localStorage.removeItem('onboarding_selected_plan');
      localStorage.removeItem('onboarding_subscription');
      
      await completeOnboarding();
    } catch (error) {
      console.error('Error completing onboarding:', error);
      alert(error instanceof Error ? error.message : 'Failed to complete onboarding. Please try again.');
      setIsCompleting(false);
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
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 shadow-xl shadow-green-500/30 mx-auto"
          >
            <CheckCircle className="w-8 h-8 text-white" />
          </motion.div>
          
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              You're all set! 🎉
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto">
              Welcome to Uplora! Here's what you can do
            </p>
          </div>
        </MotionDiv>

        {/* Features */}
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          className="max-w-5xl mx-auto"
        >
          <h3 className="text-xl font-bold text-foreground mb-6">
            What you can do
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <MotionCard
                  key={feature.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 + index * 0.1, ease: "easeOut" }}
                  whileHover={{ scale: 1.05, y: -4 }}
                  className="group"
                >
                  <div className={`p-5 rounded-xl border border-border bg-gradient-to-br ${feature.bgGradient} hover:shadow-lg transition-all duration-300 h-full`}>
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform duration-300 mx-auto`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="font-bold text-foreground mb-1.5 text-base">
                      {feature.title}
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </MotionCard>
              );
            })}
          </div>
        </MotionDiv>

        {/* Get Started Button */}
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8, ease: "easeOut" }}
          className="pt-4"
        >
          <Button
            onClick={handleGetStarted}
            disabled={isCompleting}
            size="lg"
            className="px-8 py-4 text-base font-semibold bg-gradient-to-r from-primary via-primary/90 to-primary hover:from-primary/90 hover:via-primary/80 hover:to-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl disabled:opacity-50"
          >
            {isCompleting ? (
              <>
                <Zap className="w-5 h-5 mr-2 animate-pulse" />
                Setting up...
              </>
            ) : (
              <>
                <Rocket className="w-5 h-5 mr-2" />
                Get Started with Uplora
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </MotionDiv>

        {/* Help Text */}
        <MotionDiv
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1, ease: "easeOut" }}
          className="pt-4"
        >
          <p className="text-sm text-muted-foreground">
            Need help? Check out our <a href="#" className="text-primary hover:underline font-medium">getting started guide</a>
          </p>
        </MotionDiv>
      </div>
    </OnboardingLayout>
  );
}
