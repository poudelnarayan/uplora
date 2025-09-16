'use client';

import { SignedIn, SignedOut, SignInButton, SignUpButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

export default function AuthButtons() {
  return (
    <>
      {/* Desktop version - hidden on mobile */}
      <div className="hidden md:flex items-center space-x-3">
        <SignedOut>
          <Link href="/sign-in?redirect_url=/dashboard">
            <Button
              variant="ghost"
              size="sm"
              className="bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary border border-primary/20 font-medium px-6"
            >
              Sign In
            </Button>
          </Link>
          <Link href="/sign-up?redirect_url=/dashboard">
            <Button
              size="sm"
              className="gradient-primary text-primary-foreground hover-glow shadow-medium font-medium px-6 group"
            >
              Get Started Free
              <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </Link>
        </SignedOut>
        <SignedIn>
          <Link href="/dashboard">
            <Button
              size="sm"
              className="gradient-primary text-primary-foreground hover-glow shadow-medium font-medium px-6 group"
            >
              Go to Dashboard
              <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </Link>
        </SignedIn>
      </div>

      {/* Mobile version - only one button */}
      <div className="md:hidden">
        <SignedOut>
          <Link href="/sign-in?redirect_url=/dashboard">
            <Button
              variant="ghost"
              size="sm"
              className="bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary border border-primary/20 font-medium px-4"
            >
              Sign In
            </Button>
          </Link>
        </SignedOut>
        <SignedIn>
          <Link href="/dashboard">
            <Button
              size="sm"
              className="gradient-primary text-primary-foreground font-medium px-4"
            >
              Dashboard
            </Button>
          </Link>
        </SignedIn>
      </div>
    </>
  );
}