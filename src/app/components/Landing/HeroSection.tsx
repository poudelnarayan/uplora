"use client";

import Link from "next/link";
import { Button } from "@/app/components/ui/button";
import { ArrowRight, ShieldCheck, Users, Sparkles } from "lucide-react";
import { SignedIn, SignedOut, SignUpButton } from "@clerk/nextjs";

/**
 * Landing hero — modern SaaS pattern: short value proposition headline,
 * one supporting line, two CTAs, and a product mock to anchor the visual.
 */
const HeroSection = () => {
  return (
    <section className="relative overflow-hidden">
      {/* Subtle background — radial spotlight + grid pattern. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: [
            "radial-gradient(ellipse 80% 50% at 50% -10%, hsl(152 45% 42% / 0.14), transparent 70%)",
            "radial-gradient(hsl(152 40% 35% / 0.07) 1px, transparent 1px)",
          ].join(","),
          backgroundSize: "auto, 24px 24px",
        }}
      />

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-28 pb-16 sm:pb-24">
        {/* Top: tiny badge */}
        <div className="flex justify-center mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 backdrop-blur px-3 py-1 text-xs">
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-muted-foreground">New</span>
            <span className="font-semibold text-foreground">Team approval workflow is live</span>
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
          </div>
        </div>

        {/* Headline */}
        <h1 className="text-center text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground leading-[1.05] max-w-4xl mx-auto">
          Ship YouTube videos,{" "}
          <span className="relative inline-block">
            <span className="relative z-10 bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
              with your team.
            </span>
            <span aria-hidden className="absolute inset-x-0 bottom-1 h-3 bg-primary/15 rounded-sm -z-0 hidden sm:block" />
          </span>
        </h1>

        {/* Sub */}
        <p className="mt-5 sm:mt-6 text-center text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          One workspace for editors to upload, owners to approve, and videos
          to publish to YouTube — without sharing channel passwords or
          juggling Google Drive links.
        </p>

        {/* CTAs */}
        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <SignedOut>
            <SignUpButton mode="redirect" forceRedirectUrl="/subscription">
              <Button
                size="lg"
                className="w-full sm:w-auto h-12 px-7 text-base font-semibold gradient-cta text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/25 transition-shadow"
              >
                Start free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto h-12 px-7 text-base font-semibold gradient-cta text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/25 transition-shadow"
              >
                Open dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </SignedIn>
          <Link href="#how-it-works" className="w-full sm:w-auto">
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto h-12 px-7 text-base font-semibold border-border hover:bg-muted/60"
            >
              See how it works
            </Button>
          </Link>
        </div>

        {/* Trust strip */}
        <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs sm:text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            Owner-approved publishing
          </span>
          <span className="hidden sm:inline text-border">·</span>
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-4 w-4 text-primary" />
            Role-based team access
          </span>
          <span className="hidden sm:inline text-border">·</span>
          <span className="inline-flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-amber-500" />
            AI-assist coming soon
          </span>
        </div>

      </div>
    </section>
  );
};

export default HeroSection;
