"use client";

import { useState } from "react";
import { Check, Loader2, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";

interface Product {
  id: string;
  priceId: string;
  name: string;
  description: string;
  price: number;
  mode: 'subscription' | 'payment';
  features: string[];
  popular?: boolean;
}

interface ProductCardProps {
  product: Product;
  onSubscribe: (priceId: string, mode: 'subscription' | 'payment') => Promise<void>;
  isCurrentPlan?: boolean;
  loading?: boolean;
}

export default function ProductCard({
  product,
  onSubscribe,
  isCurrentPlan = false,
  loading = false,
}: ProductCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async () => {
    setIsLoading(true);
    try {
      await onSubscribe(product.priceId, product.mode);
    } catch (error) {
      console.error('Subscription error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className={`relative h-full ${product.popular ? 'border-primary shadow-lg ring-2 ring-primary/20' : ''} ${isCurrentPlan ? 'ring-2 ring-green-500' : ''}`}>
      {product.popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground px-4 py-1">
            Most Popular
          </Badge>
        </div>
      )}
      
      {isCurrentPlan && (
        <div className="absolute -top-3 right-4">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Current Plan
          </Badge>
        </div>
      )}

      <CardHeader className="text-center pb-8 pt-8">
        <CardTitle className="text-2xl font-bold">{product.name}</CardTitle>
        <p className="text-muted-foreground leading-relaxed">{product.description}</p>
        
        <div className="mt-6">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-4xl font-bold">${product.price}</span>
            <span className="text-muted-foreground">/{product.mode === 'subscription' ? 'month' : 'one-time'}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <ul className="space-y-3 mb-8">
          {product.features.map((feature, index) => (
            <li key={index} className="flex items-center gap-3">
              <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>

        <Button
          onClick={handleSubscribe}
          disabled={isLoading || loading || isCurrentPlan}
          className={`w-full ${product.popular ? 'bg-primary hover:bg-primary/90' : ''}`}
          variant={isCurrentPlan ? 'outline' : product.popular ? 'default' : 'outline'}
        >
          {isLoading || loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : isCurrentPlan ? (
            'Current Plan'
          ) : (
            <>
              <CreditCard className="h-4 w-4 mr-2" />
              {product.mode === 'subscription' ? 'Subscribe Now' : 'Buy Now'}
            </>
          )}
        </Button>
        
        {!isCurrentPlan && product.mode === 'subscription' && (
          <p className="text-xs text-muted-foreground text-center mt-3">
            Secure payment • Cancel anytime
          </p>
        )}
      </CardContent>
    </Card>
  );
}