"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/app/components/ui/button";
import { 
  User, 
  Users, 
  Building2, 
  Briefcase, 
  Home, 
  Sparkles,
  ArrowRight,
  CheckCircle2
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
    gradient: 'from-purple-500 to-pink-500',
    bgGradient: 'from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20'
  },
  {
    id: 'business',
    title: 'Small Business',
    description: 'Running a small business or startup',
    icon: Building2,
    gradient: 'from-blue-500 to-cyan-500',
    bgGradient: 'from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20'
  },
  {
    id: 'agency',
    title: 'Agency',
    description: 'Managing multiple client accounts',
    icon: Briefcase,
    gradient: 'from-emerald-500 to-teal-500',
    bgGradient: 'from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20'
  },
  {
    id: 'enterprise',
    title: 'Enterprise',
    description: 'Large company with multiple teams',
    icon: Users,
    gradient: 'from-orange-500 to-red-500',
    bgGradient: 'from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20'
  },
  {
    id: 'personal',
    title: 'Personal',
    description: 'Just for my personal social media',
    icon: Home,
    gradient: 'from-slate-500 to-gray-500',
    bgGradient: 'from-slate-50 to-gray-50 dark:from-slate-950/20 dark:to-gray-950/20'
  }
];

export default function WelcomePage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<string>('');

  const handleNext = async () => {
    if (selectedType) {
      try {
        localStorage.setItem('onboarding_user_type', selectedType);
        router.push('/onboarding/connect-accounts');
      } catch (error) {
        console.error('Error saving user type:', error);
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
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary font-medium text-xs">
            <Sparkles className="w-3.5 h-3.5" />
            Welcome to Uplora
          </div>
          
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              What best describes you?
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto">
              Help us personalize your experience
            </p>
          </div>
        </MotionDiv>

        {/* User Type Selection */}
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-w-4xl mx-auto"
        >
          {userTypes.map((type, index) => {
            const Icon = type.icon;
            const isSelected = selectedType === type.id;
            
            return (
              <MotionCard
                key={type.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
              >
                <div
                  className={`relative p-5 rounded-xl border-2 transition-all duration-300 cursor-pointer group overflow-hidden ${
                    isSelected
                      ? 'border-primary shadow-xl shadow-primary/20 bg-gradient-to-br ' + type.bgGradient
                      : 'border-border hover:border-primary/50 bg-card/50 backdrop-blur-sm hover:shadow-lg'
                  }`}
                  onClick={() => setSelectedType(type.id)}
                >
                  {/* Gradient overlay on hover */}
                  {!isSelected && (
                    <div className={`absolute inset-0 bg-gradient-to-br ${type.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                  )}
                  
                  <div className="relative z-10">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${type.gradient} flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    
                    <h3 className="text-base font-bold text-foreground mb-1.5">
                      {type.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {type.description}
                    </p>
                    
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-4 right-4 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-lg"
                      >
                        <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
                      </motion.div>
                    )}
                  </div>
                </div>
              </MotionCard>
            );
          })}
        </MotionDiv>

        {/* Continue Button */}
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          className="pt-4"
        >
          <Button
            onClick={handleNext}
            disabled={!selectedType}
            size="lg"
            className="px-6 py-4 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl"
          >
            Continue
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </MotionDiv>
      </div>
    </OnboardingLayout>
  );
}
