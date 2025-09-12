"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  User, 
  Users, 
  Building2, 
  Briefcase, 
  Home, 
  Sparkles,
  ArrowRight
} from "lucide-react";
import OnboardingLayout from "../layout";

const MotionDiv = motion.div as any;
const MotionCard = motion.div as any;

const userTypes = [
  {
    id: 'creator',
    title: 'Creator',
    description: 'Growing my personal brand and audience',
    icon: User,
    color: 'bg-blue-100 text-blue-700'
  },
  {
    id: 'business',
    title: 'Small Business',
    description: 'Running a small business or startup',
    icon: Building2,
    color: 'bg-green-100 text-green-700'
  },
  {
    id: 'agency',
    title: 'Agency',
    description: 'Managing multiple client accounts',
    icon: Briefcase,
    color: 'bg-purple-100 text-purple-700'
  },
  {
    id: 'enterprise',
    title: 'Enterprise',
    description: 'Large company with multiple teams',
    icon: Users,
    color: 'bg-orange-100 text-orange-700'
  },
  {
    id: 'personal',
    title: 'Personal',
    description: 'Just for my personal social media',
    icon: Home,
    color: 'bg-gray-100 text-gray-700'
  }
];

export default function WelcomePage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<string>('');

  const handleNext = async () => {
    if (selectedType) {
      try {
        // Store user type in localStorage
        localStorage.setItem('onboarding_user_type', selectedType);
        
        // You can also save to database here if needed
        // await saveUserType(selectedType);
        
        router.push('/onboarding/connect-accounts');
      } catch (error) {
        console.error('Error saving user type:', error);
        // Still proceed to next step even if save fails
        router.push('/onboarding/connect-accounts');
      }
    }
  };

  return (
    <OnboardingLayout currentStep={1} totalSteps={4}>
      <div className="text-center space-y-8">
        {/* Header */}
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="space-y-4"
        >
          <div className="flex items-center justify-center gap-2 text-blue-600 font-medium">
            <Sparkles className="w-5 h-5" />
            Welcome to Uplora
          </div>
          
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 mb-4">
              What best describes you?
            </h1>
            <p className="text-lg text-gray-600 max-w-lg mx-auto">
              Help us personalize your experience by telling us a bit about yourself
            </p>
          </div>
        </MotionDiv>

        {/* User Type Selection */}
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto"
        >
          {userTypes.map((type, index) => {
            const Icon = type.icon;
            return (
              <MotionCard
                key={type.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  className={`cursor-pointer transition-all duration-200 ${
                    selectedType === type.id
                      ? 'ring-2 ring-blue-500 shadow-md'
                      : 'hover:shadow-sm border-gray-200'
                  }`}
                  onClick={() => setSelectedType(type.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-lg ${type.color} flex items-center justify-center`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {type.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {type.description}
                        </p>
                      </div>
                      {selectedType === type.id && (
                        <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </MotionCard>
            );
          })}
        </MotionDiv>

        {/* Continue Button */}
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="pt-4"
        >
          <Button
            onClick={handleNext}
            disabled={!selectedType}
            size="lg"
            className="px-8 py-3 text-lg font-medium bg-blue-600 hover:bg-blue-700"
          >
            Continue
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </MotionDiv>
      </div>
    </OnboardingLayout>
  );
}