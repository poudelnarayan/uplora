"use client";

import { Star } from "lucide-react";
import { ClerkLoaded, ClerkLoading } from "@clerk/nextjs";
import AuthButtons from "./AuthButtons";
import Image from "next/image";

const Navbar = () => {
  const scrollToReviews = () => {
    document.getElementById("reviews")?.scrollIntoView({
      behavior: "smooth",
    });
  };

  const scrollToFeatures = () => {
    document.getElementById("features")?.scrollIntoView({
      behavior: "smooth",
    });
  };

  const scrollToPricing = () => {
    document.getElementById("pricing")?.scrollIntoView({
      behavior: "smooth",
    });
  };

  const scrollToContact = () => {
    document.getElementById("contact")?.scrollIntoView({
      behavior: "smooth",
    });
  };

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border/50 shadow-soft">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Section */}
          <div className="flex items-center space-x-8">
            <div className="flex items-center">
              <Image src="/text-logo.png" alt="Uplora" width={220} height={50} className="h-12 w-auto" />
            </div>

            {/* Enhanced Review Indicator */}
            <div
              onClick={scrollToReviews}
              className="hidden lg:flex items-center space-x-3 px-4 py-2 rounded-full bg-gradient-to-r from-secondary/30 to-accent/20 border border-primary/20 cursor-pointer hover:from-secondary/50 hover:to-accent/30 hover:border-primary/30 transition-all duration-300 hover:scale-105"
            >
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-semibold text-foreground">
                  4.9
                </span>
                <div className="h-4 w-px bg-border/50" />
                <span className="text-xs font-medium text-muted-foreground">
                  50+ teams
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            <div className="flex items-center space-x-1 mr-6">
              <button
                onClick={scrollToFeatures}
                className="px-4 py-2 text-foreground hover:text-primary hover:bg-primary/5 rounded-lg transition-all duration-200 font-medium"
              >
                Features
              </button>
              <button
                onClick={scrollToPricing}
                className="px-4 py-2 text-foreground hover:text-primary hover:bg-primary/5 rounded-lg transition-all duration-200 font-medium"
              >
                Pricing
              </button>
              <button
                onClick={scrollToContact}
                className="px-4 py-2 text-foreground hover:text-primary hover:bg-primary/5 rounded-lg transition-all duration-200 font-medium"
              >
                Contact
              </button>
            </div>

            <div className="flex items-center space-x-3">
              <ClerkLoading>
                <div className="h-9 flex items-center gap-2">
                  <span className="w-20 h-9 bg-primary/10 rounded animate-pulse" />
                  <span className="w-32 h-9 bg-primary/10 rounded animate-pulse" />
                </div>
              </ClerkLoading>
              <ClerkLoaded>
                <AuthButtons />
              </ClerkLoaded>
            </div>
          </div>

          {/* Mobile Auth Button */}
          <div className="md:hidden">
            <ClerkLoading>
              <div className="h-9 w-24 bg-primary/10 rounded animate-pulse" />
            </ClerkLoading>
            <ClerkLoaded>
              <AuthButtons />
            </ClerkLoaded>
          </div>
        </div>

      </div>
    </nav>
  );
};

export default Navbar;
