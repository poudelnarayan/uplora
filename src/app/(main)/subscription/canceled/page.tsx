"use client";

import { motion } from "framer-motion";
import { XCircle, ArrowLeft, CreditCard } from "lucide-react";
import { Card, CardContent } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { NextSeoNoSSR } from "@/app/components/seo/NoSSRSeo";
import { useUser, RedirectToSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import AppShell from "@/app/components/layout/AppLayout";

const MotionDiv = motion.div as any;

export const dynamic = "force-dynamic";

export default function SubscriptionCanceledPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  if (!isLoaded) return null;
  if (!user) return <RedirectToSignIn redirectUrl="/subscription/canceled" />;

  return (
    <>
      <NextSeoNoSSR 
        title="Payment Canceled" 
        description="Your payment was canceled." 
        noindex 
        nofollow 
      />
      
      <AppShell>
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Canceled Header */}
          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="h-10 w-10 text-gray-500" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Payment Canceled</h1>
            <p className="text-xl text-muted-foreground">
              No worries! Your payment was canceled and you haven't been charged.
            </p>
          </MotionDiv>

          {/* Information Card */}
          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardContent className="p-8 text-center">
                <h2 className="text-2xl font-semibold mb-4">What happened?</h2>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  You canceled the checkout process before completing your payment. 
                  This is completely normal and happens all the time. No charges were made to your account.
                </p>
                
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="font-semibold text-blue-800 mb-2">Still interested in Uplora?</h3>
                    <p className="text-sm text-blue-700">
                      You can return to the subscription page anytime to complete your purchase. 
                      Your account is still active and you can continue using the free features.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </MotionDiv>

          {/* Action Buttons */}
          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center space-y-4"
          >
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={() => router.push('/subscription')}
                className="gap-2"
              >
                <CreditCard className="h-4 w-4" />
                Try Again
              </Button>
              
              <Button 
                variant="outline" 
                size="lg" 
                onClick={() => router.push('/dashboard')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Questions about pricing?{' '}
              <a href="/contact" className="text-primary hover:underline">
                Contact our support team
              </a>
            </p>
          </MotionDiv>
        </div>
      </AppShell>
    </>
  );
}