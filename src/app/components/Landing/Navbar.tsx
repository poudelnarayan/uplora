"use client";

import { ClerkLoaded, ClerkLoading, SignedOut, SignedIn } from "@clerk/nextjs";
import AuthButtons from "./AuthButtons";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/app/components/ui/button";

const Navbar = () => {
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
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center">
              <Image
                src="/text-logo.png"
                alt="Uplora"
                width={280}
                height={60}
                className="h-8 w-auto hover:opacity-80 transition-opacity"
                priority
              />
            </Link>

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
              <div className="h-8 w-20 bg-primary/10 rounded animate-pulse" />
            </ClerkLoading>
            <ClerkLoaded>
              <div className="flex items-center gap-2">
                <SignedOut>
                  <Link href="/sign-up?redirect_url=/dashboard">
                    <Button
                      size="sm"
                      className="gradient-cta text-primary-foreground font-medium px-4 py-2 text-sm rounded-lg"
                    >
                      Start Free
                    </Button>
                  </Link>
                </SignedOut>
                <SignedIn>
                  <Link href="/dashboard">
                    <Button
                      size="sm"
                      className="gradient-cta text-primary-foreground font-medium px-4 py-2 text-sm rounded-lg"
                    >
                      Dashboard
                    </Button>
                  </Link>
                </SignedIn>
              </div>
            </ClerkLoaded>
          </div>
        </div>

      </div>
    </nav>
  );
};

export default Navbar;
