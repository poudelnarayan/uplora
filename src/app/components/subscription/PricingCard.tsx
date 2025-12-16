"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";

interface PricingCardProps {
  planId: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  popular?: boolean;
  currentPlan?: boolean;
  billingCycle: 'monthly' | 'yearly';
  onSubscribe: (planId: string, cycle: 'monthly' | 'yearly') => Promise<void>;
}

export default function PricingCard({
  planId,
  name,
  description,
  monthlyPrice,
  yearlyPrice,
  features,
  popular = false,
  currentPlan = false,
  billingCycle,
  onSubscribe,
}: PricingCardProps) {
  const [loading, setLoading] = useState(false);
  
  const price = billingCycle === 'monthly' ? monthlyPrice : yearlyPrice;
  const yearlyDiscount = Math.round((1 - yearlyPrice / (monthlyPrice * 12)) * 100);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      await onSubscribe(planId, billingCycle);
    } catch (error) {
      console.error('Subscription error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={`relative h-full ${popular ? 'border-primary shadow-lg' : ''} ${currentPlan ? 'ring-2 ring-primary' : ''}`}>
      {popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground px-4 py-1">
            Most Popular
          </Badge>
        </div>
      )}
      
      {currentPlan && (
        <div className="absolute -top-3 right-4">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Current Plan
          </Badge>
        </div>
      )}

      <CardHeader className="text-center pb-8 pt-8">
        <CardTitle className="text-2xl font-bold">{name}</CardTitle>
        <p className="text-muted-foreground">{description}</p>
        
        <div className="mt-4">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-4xl font-bold">${price}</span>
            <span className="text-muted-foreground">/{billingCycle === 'monthly' ? 'month' : 'year'}</span>
          </div>
          
          {billingCycle === 'yearly' && yearlyDiscount > 0 && (
            <p className="text-sm text-green-600 font-medium mt-1">
              Save {yearlyDiscount}% with yearly billing
            </p>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <ul className="space-y-3 mb-8">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center gap-3">
              <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>

        <Button
          onClick={handleSubscribe}
          disabled={loading || currentPlan}
          className={`w-full ${popular ? 'bg-primary hover:bg-primary/90' : ''}`}
          variant={currentPlan ? 'outline' : popular ? 'default' : 'outline'}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Loading...
            </>
          ) : currentPlan ? (
            'Current Plan'
          ) : (
            'Start Free Trial'
          )}
        </Button>
        
        {!currentPlan && (
          <p className="text-xs text-muted-foreground text-center mt-3">
            7-day free trial • Cancel anytime
          </p>
        )}
      </CardContent>
    </Card>
  );
}