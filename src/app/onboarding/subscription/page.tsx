"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Switch } from "@/app/components/ui/switch";
import { 
  CheckCircle, 
  ArrowRight,
  ArrowLeft,
  CreditCard,
  Clock,
  Crown,
  Zap,
  Shield,
  Users,
  BarChart3,
  Calendar,
  AlertCircle,
  Check
} from "lucide-react";
import OnboardingLayout from "../layout";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useNotifications } from "@/app/components/ui/Notification";

const MotionDiv = motion.div as any;
const MotionCard = motion.div as any;

const plans = [
  {
    id: 'starter',
    name: "Starter",
    description: "Perfect for individual creators",
    monthlyPrice: 9,
    yearlyPrice: 90,
    features: [
      "5 connected social accounts",
      "Unlimited posts & scheduling",
      "Basic analytics",
      "Email support",
      "Mobile app access"
    ],
    limits: {
      accounts: 5,
      posts: "Unlimited",
      analytics: "Basic"
    }
  },
  {
    id: 'creator',
    name: "Creator",
    description: "Best for growing creators",
    monthlyPrice: 18,
    yearlyPrice: 180,
    features: [
      "15 connected social accounts",
      "Unlimited posts & scheduling",
      "Advanced analytics & insights",
      "Content calendar",
      "Team collaboration (up to 3 members)",
      "Priority support",
      "Custom branding"
    ],
    limits: {
      accounts: 15,
      posts: "Unlimited",
      analytics: "Advanced",
      teamMembers: 3
    },
    popular: true
  },
  {
    id: 'pro',
    name: "Pro",
    description: "For agencies and large teams",
    monthlyPrice: 49,
    yearlyPrice: 490,
    features: [
      "Unlimited social accounts",
      "Unlimited posts & scheduling",
      "Advanced analytics & reporting",
      "White-label solution",
      "Unlimited team members",
      "API access",
      "Dedicated account manager",
      "Custom integrations"
    ],
    limits: {
      accounts: "Unlimited",
      posts: "Unlimited",
      analytics: "Advanced + Reporting",
      teamMembers: "Unlimited"
    }
  }
];

export default function SubscriptionOnboardingPage() {
  const router = useRouter();
  const { completeOnboarding } = useOnboarding();
  const notifications = useNotifications();
  const [selectedPlan, setSelectedPlan] = useState('creator');
  const [isYearly, setIsYearly] = useState(false);
  const [freeTrialEnabled, setFreeTrialEnabled] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubscribe = async () => {
    setIsProcessing(true);
    try {
      // Store subscription choice
      localStorage.setItem('onboarding_subscription', JSON.stringify({
        planId: selectedPlan,
        cycle: isYearly ? 'yearly' : 'monthly',
        freeTrial: freeTrialEnabled
      }));

      // Create checkout session
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: selectedPlan,
          cycle: isYearly ? 'yearly' : 'monthly',
        }),
      });

      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      notifications.addNotification({
        type: 'error',
        title: 'Subscription Error',
        message: error instanceof Error ? error.message : 'Failed to start subscription process',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSkip = async () => {
    try {
      // Store that user skipped subscription
      localStorage.setItem('onboarding_subscription', JSON.stringify({
        planId: null,
        skipped: true
      }));
      
      // Complete onboarding without subscription
      await completeOnboarding();
    } catch (error) {
      console.error('Error skipping subscription:', error);
      await completeOnboarding();
    }
  };

  const handleBack = () => {
    router.push('/onboarding/connect-accounts');
  };

  const selectedPlanData = plans.find(plan => plan.id === selectedPlan);

  return (
    <OnboardingLayout 
      currentStep={3} 
      totalSteps={4} 
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
          <div className="flex items-center justify-center gap-2 text-blue-600 font-medium">
            <Crown className="w-5 h-5" />
            Choose Your Plan
          </div>
          
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Unlock the full power of Uplora
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Start with a 7-day free trial. No credit card required. Cancel anytime.
            </p>
          </div>
        </MotionDiv>

        {/* Free Trial Banner */}
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
          className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6"
        >
          <div className="flex items-center justify-center gap-3">
            <div className="flex items-center gap-2">
              <Switch
                checked={freeTrialEnabled}
                onCheckedChange={setFreeTrialEnabled}
                className="data-[state=checked]:bg-green-600"
              />
              <span className="font-medium text-gray-900">7-day free trial</span>
            </div>
            <Badge className="bg-green-100 text-green-800 border-green-200">
              <Clock className="w-3 h-3 mr-1" />
              No credit card required
            </Badge>
          </div>
        </MotionDiv>

        {/* Billing Toggle */}
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
          className="flex items-center justify-center gap-6"
        >
          <button
            onClick={() => setIsYearly(false)}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              !isYearly 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setIsYearly(true)}
            className={`px-6 py-3 rounded-lg font-medium transition-all relative ${
              isYearly 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Yearly
            {isYearly && (
              <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1">
                40% OFF
              </Badge>
            )}
          </button>
        </MotionDiv>

        {/* Pricing Cards */}
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
          className="grid md:grid-cols-3 gap-6"
        >
          {plans.map((plan, index) => (
            <MotionCard
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 + index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className="relative"
            >
              <Card
                className={`h-full cursor-pointer transition-all duration-200 ${
                  selectedPlan === plan.id
                    ? 'ring-2 ring-blue-500 shadow-lg'
                    : plan.popular
                      ? 'border-blue-200 hover:border-blue-300'
                      : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-600 text-white px-4 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                  <p className="text-sm text-gray-600">{plan.description}</p>
                  
                  <div className="mt-4">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-3xl font-bold">
                        ${isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                      </span>
                      <span className="text-gray-600">/month</span>
                    </div>
                    {isYearly && (
                      <p className="text-sm text-green-600 font-medium mt-1">
                        Billed annually (${plan.yearlyPrice}/year)
                      </p>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-3">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPlan(plan.id);
                    }}
                    className={`w-full ${
                      selectedPlan === plan.id
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : plan.popular
                          ? 'bg-blue-600 hover:bg-blue-700'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    variant={selectedPlan === plan.id || plan.popular ? 'default' : 'outline'}
                  >
                    {selectedPlan === plan.id ? 'Selected' : 'Select Plan'}
                  </Button>
                </CardContent>
              </Card>
            </MotionCard>
          ))}
        </MotionDiv>

        {/* Action Buttons */}
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Button
            onClick={handleSubscribe}
            disabled={isProcessing}
            size="lg"
            className="px-8 py-3 text-lg font-medium bg-blue-600 hover:bg-blue-700"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5 mr-2" />
                {freeTrialEnabled ? 'Start Free Trial' : 'Subscribe Now'}
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
          
          <Button
            onClick={handleSkip}
            variant="outline"
            size="lg"
            className="px-8 py-3 text-lg font-medium"
          >
            Skip for now
          </Button>
        </MotionDiv>

        {/* Trust Indicators */}
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.7 }}
          className="flex flex-wrap justify-center gap-6 text-sm text-gray-500"
        >
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span>Secure payment</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>Cancel anytime</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            <span>Instant access</span>
          </div>
        </MotionDiv>
      </div>
    </OnboardingLayout>
  );
}
