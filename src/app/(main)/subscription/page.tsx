"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { NextSeoNoSSR } from "@/components/seo/NoSSRSeo";
import { useUser, RedirectToSignIn } from "@clerk/nextjs";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import SubscriptionManager from "@/components/subscription/SubscriptionManager";
import { StripeProvider } from "@/components/subscription/StripeProvider";
import AppShell from "@/components/layout/AppLayout";

const MotionDiv = motion.div as any;

export const dynamic = "force-dynamic";

export default function SubscriptionPage() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) return null;
  if (!user) return <RedirectToSignIn redirectUrl="/subscription" />;

  return (
    <>
      <NextSeoNoSSR 
        title="Subscription" 
        description="Manage your Uplora subscription and billing." 
        noindex 
        nofollow 
      />
      
      <AppShell>
        <StripeProvider>
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold">Subscription & Billing</h1>
              <p className="text-xl text-muted-foreground">
                Choose the perfect plan for your content creation needs
              </p>
            </div>
            
            <SubscriptionManager />
          </div>
        </StripeProvider>
      </AppShell>
      </>
    );
}