"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Switch } from "@/app/components/ui/switch";
import { Check, X, ArrowRight } from "lucide-react";
import { useState } from "react";

const basicFeatures = [
  "Multi-platform publishing",
  "Basic team collaboration",
  "Up to 50 posts per month",
  "Standard video support",
  "Basic analytics",
  "Email support"
];

const basicLimitations = [
  "YouTube long video support",
  "Advanced approval workflow",
  "Unlimited posts",
  "Priority support",
  "AI-powered optimization"
];

const proFeatures = [
  "Multi-platform publishing",
  "Advanced team collaboration",
  "Unlimited posts & videos",
  "YouTube long video support",
  "Advanced approval workflow",
  "Shared content calendar",
  "Real-time notifications",
  "Advanced analytics & reporting",
  "Priority customer support",
  "AI-powered optimization (coming soon)"
];

const PricingSection = () => {
  const [isYearly, setIsYearly] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(1); // Default to Pro (index 1)
  const [freeTrialEnabled, setFreeTrialEnabled] = useState(true);

  const plans = [
    {
      name: "Basic",
      description: "Perfect for individuals and small teams",
      monthlyPrice: 9.99,
      yearlyPrice: 6.99,
      features: basicFeatures,
      limitations: basicLimitations,
      popular: false,
      buttonText: "Start 7 days free trial"
    },
    {
      name: "Pro",
      description: "Advanced features for growing teams",
      monthlyPrice: 14.99,
      yearlyPrice: 11.99,
      features: proFeatures,
      limitations: [],
      popular: true,
      buttonText: "Start 7 days free trial"
    }
  ];

  return (
    <section id="pricing" className="py-20">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Simple, <span className="gradient-text">Transparent Pricing</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the perfect plan for your team. Upgrade or downgrade anytime.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-12">
          <div className="flex items-center bg-secondary/50 rounded-lg p-1">
            <button
              onClick={() => setIsYearly(false)}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-smooth ${
                !isYearly 
                  ? 'bg-primary text-primary-foreground shadow-soft' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-smooth relative ${
                isYearly 
                  ? 'bg-primary text-primary-foreground shadow-soft' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Yearly
              <Badge className="absolute -top-3 -right-4 bg-accent text-accent-foreground text-xs px-1.5 py-0.5 whitespace-nowrap">
                Save 30%
              </Badge>
            </button>
          </div>
          
          {/* Free Trial Toggle */}
          <div className="flex items-center space-x-3 bg-secondary/30 rounded-lg px-4 py-2">
            <span className="text-sm font-medium text-foreground">Free Trial</span>
            <Switch
              checked={freeTrialEnabled}
              onCheckedChange={setFreeTrialEnabled}
            />
          </div>
        </div>

        {/* Plans */}
        <div className="grid lg:grid-cols-2 gap-8 md:gap-12 lg:gap-8 max-w-5xl mx-auto relative px-4 md:px-8 lg:px-0">
          {plans.map((plan, index) => (
            <div key={index} className="relative">
              {/* Popular Badge - Outside the card to avoid clipping */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-20">
                  <Badge className="gradient-primary text-primary-foreground px-4 py-1 shadow-medium">
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <Card 
                className={`h-full flex flex-col shadow-strong bg-card relative overflow-hidden cursor-pointer transition-all duration-300 ${
                  selectedPlan === index 
                    ? 'border-2 border-primary/50 ring-2 ring-primary/20 scale-105' 
                    : plan.popular 
                      ? 'border-2 border-primary/20 hover:border-primary/30' 
                      : 'border border-border hover:border-primary/20'
                }`}
                onClick={() => setSelectedPlan(index)}
              >
                {/* Gradient Background for Pro */}
                {plan.popular && (
                  <div className="absolute inset-0 gradient-hero opacity-5"></div>
                )}

                <CardHeader className="text-center pb-8 pt-12 relative z-10">
                <CardTitle className="text-3xl font-bold">{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className={`text-5xl font-bold ${plan.popular ? 'gradient-text' : 'text-foreground'}`}>
                    ${isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                  </span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                {isYearly && (
                  <p className="text-sm text-accent font-medium mt-1">
                    Billed annually (${(isYearly ? plan.yearlyPrice : plan.monthlyPrice) * 12}/year)
                  </p>
                )}
                <p className="text-muted-foreground mt-2">{plan.description}</p>
              </CardHeader>

              <CardContent className="relative z-10 flex flex-col flex-grow">
                <div className="flex-grow">
                  <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center space-x-3">
                      <div className="flex-shrink-0 w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center">
                        <Check className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                  
                  {/* Show limitations for Basic plan */}
                  {plan.limitations.length > 0 && (
                    <>
                      {plan.limitations.map((limitation, limitIndex) => (
                        <li key={`limit-${limitIndex}`} className="flex items-center space-x-3 opacity-50">
                          <div className="flex-shrink-0 w-5 h-5 bg-muted/30 rounded-full flex items-center justify-center">
                            <X className="h-3 w-3 text-muted-foreground" />
                          </div>
                          <span className="text-muted-foreground line-through">{limitation}</span>
                        </li>
                      ))}
                    </>
                  )}
                </ul>
                </div>

                <Button 
                  size="lg" 
                  onClick={() => window.location.href = '/subscription'}
                  className={`w-full text-lg py-4 mb-6 transition-all duration-300 group ${
                    selectedPlan === index
                      ? 'gradient-cta text-primary-foreground hover:opacity-90 shadow-lg hover:shadow-xl' 
                      : 'bg-muted text-muted-foreground hover:bg-muted/60'
                  }`}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {selectedPlan === index ? (freeTrialEnabled ? plan.buttonText : 'Get Started') : 'Select Plan'}
                    <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </Button>
                
                <p className="text-center text-sm text-muted-foreground mt-4 flex items-center justify-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  {freeTrialEnabled ? '$0.00 today • Cancel any time' : 'Start immediately • Cancel any time'}
                </p>
              </CardContent>
              </Card>
            </div>
          ))}
        </div>

        {/* Additional info */}
        <div className="mt-16 max-w-3xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="text-center">
              <h3 className="font-semibold text-lg mb-2">No Hidden Fees</h3>
              <p className="text-muted-foreground">What you see is what you pay. No surprise charges or usage limits.</p>
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-lg mb-2">Cancel Anytime</h3>
              <p className="text-muted-foreground">No long-term contracts. Pause or cancel your subscription whenever you need.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;