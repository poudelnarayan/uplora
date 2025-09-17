"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

const MotionDiv = motion.div as any;
const MotionCard = motion.div as any;

const features = [
  {
    id: 'text',
    title: 'Text Posts',
    description: 'Create engaging text content',
    icon: FileText,
    color: 'bg-green-100 text-green-700'
  },
  {
    id: 'image',
    title: 'Image Posts',
    description: 'Share beautiful images',
    icon: Image,
    color: 'bg-blue-100 text-blue-700'
  },
  {
    id: 'video',
    title: 'Video Content',
    description: 'Upload and share videos',
    icon: Video,
    color: 'bg-red-100 text-red-700'
  },
  {
    id: 'reel',
    title: 'Reels',
    description: 'Create short-form videos',
    icon: Play,
    color: 'bg-purple-100 text-purple-700'
  },
  {
    id: 'schedule',
    title: 'Schedule Posts',
    description: 'Plan your content calendar',
    icon: Calendar,
    color: 'bg-orange-100 text-orange-700'
  },
  {
    id: 'analytics',
    title: 'Analytics',
    description: 'Track your performance',
    icon: BarChart3,
    color: 'bg-teal-100 text-teal-700'
  }
];

export default function GetStartedPage() {
  const router = useRouter();
  const { completeOnboarding } = useOnboarding();
  const [onboardingData, setOnboardingData] = useState<any>({});

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
      
      // Mark onboarding as completed in database and redirect
      await completeOnboarding();
    } catch (error) {
      console.error('Error completing onboarding:', error);
      // Still try to complete onboarding
      await completeOnboarding();
    }
  };

  const handleBack = () => {
    router.push('/onboarding/subscription');
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
          <div className="flex items-center justify-center gap-2 text-green-600 font-medium">
            <CheckCircle className="w-5 h-5" />
            Almost ready!
          </div>
          
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 mb-4">
              You're all set!
            </h1>
            <p className="text-lg text-gray-600 max-w-lg mx-auto">
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
          <h3 className="text-2xl font-semibold text-gray-900 mb-6">
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
                  <Card className="h-full hover:shadow-sm transition-shadow border-gray-200">
                    <CardContent className="p-4 text-center">
                      <div className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center mx-auto mb-3`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-1">
                        {feature.title}
                      </h4>
                      <p className="text-sm text-gray-600">
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
            className="px-12 py-4 text-xl font-medium bg-blue-600 hover:bg-blue-700"
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
          <p className="text-sm text-gray-500">
            Need help? Check out our <a href="#" className="text-blue-600 hover:underline">getting started guide</a>
          </p>
        </MotionDiv>
      </div>
    </OnboardingLayout>
  );
}