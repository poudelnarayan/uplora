"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import OnboardingLayout from "../layout";
import { useState, useEffect } from "react";
import { Check, Sparkles, ArrowRight, Zap } from "lucide-react";
import { Button } from "@/app/components/ui/button";

const MotionDiv = motion.div;
const MotionCard = motion.div;

export default function BillingPage() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState(1); // Default to Creator plan
  const [isYearly, setIsYearly] = useState(false);
  const [freeTrialEnabled, setFreeTrialEnabled] = useState(true);

  useEffect(() => {
    const savedPlan = localStorage.getItem('onboarding_selected_plan');
    if (savedPlan) {
      try {
        const planData = JSON.parse(savedPlan);
        setSelectedPlan(planData.plan === 'Starter' ? 0 : 1);
        setIsYearly(planData.isYearly || false);
        setFreeTrialEnabled(planData.freeTrialEnabled !== false);
      } catch (error) {
        console.error('Error loading saved plan:', error);
      }
    }
  }, []);

  const plans = [
    {
      name: "Starter",
      description: "Perfect for getting started",
      monthlyPrice: 9,
      yearlyPrice: 90,
      features: [
        "5 connected social accounts",
        "Multiple accounts per platform",
        "Unlimited posts",
        "Schedule posts",
        "Carousel posts",
        "Human support"
      ],
      popular: false
    },
    {
      name: "Creator",
      description: "Best for growing creators",
      monthlyPrice: 18,
      yearlyPrice: 180,
      features: [
        "15 connected social accounts",
        "Multiple accounts per platform",
        "Unlimited posts",
        "Schedule posts",
        "Carousel posts",
        "Bulk video scheduling",
        "Content studio access",
        "Priority support"
      ],
      popular: true
    }
  ];

  const handleGetStarted = async () => {
    try {
      // Save plan selection to localStorage
      localStorage.setItem('onboarding_selected_plan', JSON.stringify({
        plan: plans[selectedPlan].name,
        isYearly,
        freeTrialEnabled
      }));
      
      // Mark onboarding as completed when plan is selected
      try {
        const response = await fetch('/api/user/onboarding-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'complete' }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Failed to mark onboarding as completed:', errorData);
          // Continue anyway - don't block the user
        } else {
          console.log('✅ Onboarding marked as completed');
        }
      } catch (error) {
        console.error('Error marking onboarding as completed:', error);
        // Continue anyway - don't block the user
      }
      
      router.push('/onboarding/get-started');
    } catch (error) {
      console.error('Error saving plan:', error);
      router.push('/onboarding/get-started');
    }
  };

  const handleBack = () => {
    router.push('/onboarding/connect-accounts');
  };

  return (
    <OnboardingLayout 
      currentStep={3} 
      totalSteps={4} 
      onBack={handleBack}
      showClose={false}
    >
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary font-medium text-xs">
            <Sparkles className="w-3.5 h-3.5" />
            Choose your plan
          </div>
          
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Choose your plan
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto">
              7-day free trial • No credit card required
            </p>
          </div>
        </MotionDiv>

        {/* Billing Toggle */}
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          className="flex items-center justify-center gap-4"
        >
          <div className="relative inline-flex items-center p-1 bg-muted rounded-xl border border-border">
            <button
              onClick={() => setIsYearly(false)}
              className={`relative px-6 py-2.5 rounded-lg font-semibold text-sm transition-all duration-300 ${
                !isYearly 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`relative px-6 py-2.5 rounded-lg font-semibold text-sm transition-all duration-300 ${
                isYearly 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Yearly
              {isYearly && (
                <span className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">
                  40% OFF
                </span>
              )}
            </button>
          </div>
        </MotionDiv>

        {/* Pricing Cards */}
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto"
        >
          {plans.map((plan, index) => (
            <MotionCard
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + index * 0.1, ease: "easeOut" }}
              whileHover={{ y: -4 }}
              className="relative"
            >
              <div
                className={`relative p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer overflow-hidden ${
                  selectedPlan === index
                    ? 'border-primary shadow-2xl shadow-primary/30 bg-gradient-to-br from-primary/5 via-primary/5 to-primary/10'
                    : plan.popular
                      ? 'border-primary/30 bg-card hover:border-primary/50 hover:shadow-xl'
                      : 'border-border bg-card hover:border-primary/30 hover:shadow-lg'
                }`}
                onClick={() => setSelectedPlan(index)}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0">
                    <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-xs font-bold px-4 py-1.5 rounded-bl-2xl rounded-tr-3xl shadow-lg">
                      Most Popular
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Plan Header */}
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-1.5">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </div>

                  {/* Price */}
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-foreground">
                        ${isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                      </span>
                      <span className="text-muted-foreground text-base">/month</span>
                    </div>
                    {isYearly && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Billed ${plan.yearlyPrice} annually
                      </p>
                    )}
                  </div>

                  {/* Features */}
                  <div className="space-y-2">
                    {plan.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-start gap-2.5">
                        <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="h-3 w-3 text-primary" />
                        </div>
                        <span className="text-sm text-foreground leading-relaxed">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Selection Indicator */}
                  {selectedPlan === index && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex items-center gap-2 text-primary font-semibold"
                    >
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </div>
                      <span>Selected</span>
                    </motion.div>
                  )}
                </div>
              </div>
            </MotionCard>
          ))}
        </MotionDiv>

        {/* Free Trial Info */}
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
          className="flex items-center justify-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800 max-w-md mx-auto"
        >
          <Zap className="w-5 h-5 text-green-600 dark:text-green-400" />
          <p className="text-sm font-medium text-green-700 dark:text-green-300">
            {freeTrialEnabled ? '$0.00 due today • 7-day free trial' : 'Start immediately • Cancel anytime'}
          </p>
        </MotionDiv>

        {/* Continue Button */}
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
          className="pt-4 flex justify-center"
        >
          <Button
            onClick={handleGetStarted}
            size="lg"
            className="px-8 py-4 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
          >
            Continue with {plans[selectedPlan].name} Plan
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </MotionDiv>
      </div>
    </OnboardingLayout>
  );
}
