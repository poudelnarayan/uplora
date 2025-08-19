"use client";

import { motion } from "framer-motion";

const MotionDiv = motion.div as any;
import SignInForm from "@/components/auth/SignInForm";
import { Suspense } from "react";
import { NextSeoNoSSR } from "@/components/seo/NoSSRSeo";

function SignInContent() {
  return <SignInForm />;
}

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
      <NextSeoNoSSR title="Sign in" noindex nofollow />
      <div className="container mx-auto px-4 py-16">
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto"
        >
          <div className="text-center mb-8">
            <h1 className="heading-2">Sign in</h1>
            <p className="text-muted-foreground">Welcome back. Continue to your dashboard.</p>
          </div>
          <Suspense fallback={<div className="spinner" />}>
            <SignInContent />
          </Suspense>
        </MotionDiv>
      </div>
    </div>
  );
}


