"use client";

import Link from "next/link";
import { Button } from "@/app/components/ui/button";
import { ArrowRight } from "lucide-react";
import { SignedIn, SignedOut, SignUpButton } from "@clerk/nextjs";

/**
 * Final-fold CTA. Modern SaaS landings always close with a re-pitch:
 * a strong line, one primary CTA, one supporting trust signal.
 */
const ClosingCTA = () => {
  return (
    <section className="relative py-20 sm:py-28">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative max-w-4xl mx-auto overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/5 via-background to-accent/5 px-6 py-16 sm:px-12 sm:py-20 text-center">
          {/* Decorative glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(ellipse 60% 70% at 50% 0%, hsl(82 30% 60% / 0.18), transparent 70%)",
            }}
          />

          <div className="relative">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
              Ship content together. Without the chaos.
            </h2>
            <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
              Spin up your workspace in under a minute. No credit card to start.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <SignedOut>
                <SignUpButton mode="redirect" forceRedirectUrl="/subscription">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto h-12 px-8 text-base font-semibold gradient-cta text-primary-foreground shadow-lg shadow-primary/20"
                  >
                    Start free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <Link href="/dashboard">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto h-12 px-8 text-base font-semibold gradient-cta text-primary-foreground shadow-lg shadow-primary/20"
                  >
                    Open dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </SignedIn>
              <Link href="#pricing">
                <Button variant="outline" size="lg" className="w-full sm:w-auto h-12 px-8 text-base font-semibold border-border">
                  See pricing
                </Button>
              </Link>
            </div>

            <p className="mt-6 text-xs text-muted-foreground">
              Free plan available · Upgrade any time · Cancel any time
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ClosingCTA;
