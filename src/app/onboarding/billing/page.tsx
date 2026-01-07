"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import OnboardingLayout from "../layout";
import { useState, useEffect } from "react";
import { Check } from "lucide-react";

const MotionDiv = motion.div;

export default function BillingPage() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState(1); // Default to Creator plan
  const [isYearly, setIsYearly] = useState(false);
  const [freeTrialEnabled, setFreeTrialEnabled] = useState(true);

  useEffect(() => {
    // Load any previously selected plan from localStorage
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
      description: "Best for beginner creators",
      monthlyPrice: 9,
      yearlyPrice: 90,
      features: [
        "5 connected social accounts",
        "Multiple accounts per platform",
        "Unlimited posts",
        "Schedule posts",
        "Carousel posts",
        "Human support"
      ]
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
        "Human support"
      ],
      popular: true
    }
  ];

  const handleGetStarted = async () => {
    try {
      // Store selected plan
      localStorage.setItem('onboarding_selected_plan', JSON.stringify({
        plan: plans[selectedPlan].name,
        isYearly,
        freeTrialEnabled
      }));
      
      // Redirect to subscription page
      router.push('/onboarding/subscription');
    } catch (error) {
      console.error('Error saving plan:', error);
      router.push('/onboarding/subscription');
    }
  };

  const handleBack = () => {
    router.push('/onboarding/connect-accounts');
  };

  return (
    <OnboardingLayout 
      currentStep={3} 
      totalSteps={5} 
      onBack={handleBack}
      showClose={false}
    >
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center space-y-4"
        >
          <h1 className="text-3xl font-bold text-foreground">
            Choose your plan
          </h1>
          <p className="text-lg text-muted-foreground">
            Try for free for 7 days - cancel anytime
          </p>
        </MotionDiv>

        {/* Billing Toggle */}
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex items-center justify-center gap-6"
        >
          <button
            onClick={() => setIsYearly(false)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              !isYearly 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground hover:bg-muted/70'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setIsYearly(true)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors relative ${
              isYearly 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground hover:bg-muted/70'
            }`}
          >
            Yearly
            {isYearly && (
              <span className="absolute -top-2 -right-2 bg-warning text-warning-foreground text-xs px-2 py-1 rounded-full">
                40% OFF
              </span>
            )}
          </button>
        </MotionDiv>

        {/* Free Trial Toggle */}
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex items-center justify-center gap-3"
        >
          <span className="text-sm text-muted-foreground">Free trial</span>
          <button
            onClick={() => setFreeTrialEnabled(!freeTrialEnabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              freeTrialEnabled ? 'bg-primary' : 'bg-border'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                freeTrialEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </MotionDiv>

        {/* Pricing Cards */}
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto"
        >
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              className={`relative p-8 rounded-2xl border-2 transition-all cursor-pointer ${
                selectedPlan === index
                  ? 'border-primary/40 bg-primary/5'
                  : plan.popular
                    ? 'border-primary/20 bg-card hover:border-primary/30'
                    : 'border-border bg-card hover:border-primary/20'
              }`}
              onClick={() => setSelectedPlan(index)}
            >
              {plan.popular && (
                <div className="absolute -top-3 right-6">
                  <span className="gradient-primary text-primary-foreground text-sm font-medium px-3 py-1 rounded-full shadow-medium">
                    Most popular
                  </span>
                </div>
              )}

              <div className="text-center space-y-6">
                {/* Plan Header */}
                <div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">{plan.name}</h3>
                  <p className="text-muted-foreground">{plan.description}</p>
                </div>

                {/* Price */}
                <div>
                  <span className="text-4xl font-bold text-foreground">
                    ${isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                  </span>
                  <span className="text-muted-foreground ml-1">/month</span>
                </div>

                {/* Features */}
                <div className="space-y-3 text-left">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center gap-3">
                      <Check className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className={`text-foreground ${featureIndex === 0 ? 'font-semibold' : ''}`}>
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Button */}
                <button
                  className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                    selectedPlan === index
                      ? 'bg-primary text-primary-foreground hover:bg-primary-hover'
                      : 'bg-muted text-muted-foreground hover:bg-muted/70'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPlan(index);
                  }}
                >
                  Start 7 day free trial →
                </button>

                {/* Fine Print */}
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-primary" />
                  <span>
                    {freeTrialEnabled ? '$0.00 due today, cancel anytime' : 'Start immediately, cancel anytime'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </MotionDiv>

        {/* Continue Button */}
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="pt-4 flex justify-center"
        >
          <button
            onClick={handleGetStarted}
            className="gradient-primary text-primary-foreground py-4 px-8 rounded-lg font-medium shadow-medium hover:shadow-strong transition-all text-lg"
          >
            Continue with {plans[selectedPlan].name} Plan
          </button>
        </MotionDiv>
      </div>
    </OnboardingLayout>
  );
}