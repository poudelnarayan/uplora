"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
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

const MotionDiv = motion.div;
const MotionCard = motion.div;

const userTypes = [
  {
    id: 'creator',
    title: 'Creator',
    description: 'Growing my personal brand and audience',
    icon: User,
    color: 'bg-primary/10 text-primary'
  },
  {
    id: 'business',
    title: 'Small Business',
    description: 'Running a small business or startup',
    icon: Building2,
    color: 'bg-success/10 text-success'
  },
  {
    id: 'agency',
    title: 'Agency',
    description: 'Managing multiple client accounts',
    icon: Briefcase,
    color: 'bg-accent/10 text-accent'
  },
  {
    id: 'enterprise',
    title: 'Enterprise',
    description: 'Large company with multiple teams',
    icon: Users,
    color: 'bg-warning/15 text-warning'
  },
  {
    id: 'personal',
    title: 'Personal',
    description: 'Just for my personal social media',
    icon: Home,
    color: 'bg-muted text-foreground'
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
    <OnboardingLayout currentStep={1} totalSteps={5}>
      <div className="text-center space-y-8">
        {/* Header */}
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="space-y-4"
        >
          <div className="flex items-center justify-center gap-2 text-primary font-medium">
            <Sparkles className="w-5 h-5" />
            Welcome to Uplora
          </div>
          
          <div>
            <h1 className="text-3xl font-semibold text-foreground mb-4">
              What best describes you?
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg mx-auto">
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
                      ? 'ring-2 ring-primary/30 shadow-medium border-primary/20'
                      : 'hover:shadow-soft border-border'
                  }`}
                  onClick={() => setSelectedType(type.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-lg ${type.color} flex items-center justify-center`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="font-semibold text-foreground mb-1">
                          {type.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {type.description}
                        </p>
                      </div>
                      {selectedType === type.id && (
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
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
            className="px-8 py-3 text-lg font-medium bg-primary text-primary-foreground hover:bg-primary-hover"
          >
            Continue
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </MotionDiv>
      </div>
    </OnboardingLayout>
  );
}