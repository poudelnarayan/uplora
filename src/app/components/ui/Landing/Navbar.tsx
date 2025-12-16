"use client";

import { Button } from "@/app/components/ui/button";
import { Menu, X, Star, ChevronRight } from "lucide-react";
import { useState } from "react";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <div className="w-4 h-4 bg-white rounded-sm"></div>
              </div>
              <div className="text-2xl font-bold gradient-text tracking-tight">
                Uplora
              </div>
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
              <Button
                variant="ghost"
                size="sm"
                className="bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary border border-primary/20 font-medium px-6"
              >
                Sign In
              </Button>
              <Button
                size="sm"
                className="gradient-primary text-primary-foreground hover-glow shadow-medium font-medium px-6 group"
              >
                Get Started Free
                <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="hover:bg-primary/10 hover:text-primary"
            >
              {isMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Enhanced Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-6 border-t border-border/50 bg-secondary/20 rounded-b-xl -mx-4 px-4">
            <div className="flex flex-col space-y-1">
              <button
                onClick={scrollToFeatures}
                className="text-foreground hover:text-primary hover:bg-primary/5 transition-all duration-200 text-left py-3 px-4 rounded-lg font-medium"
              >
                Features
              </button>
              <button
                onClick={scrollToPricing}
                className="text-foreground hover:text-primary hover:bg-primary/5 transition-all duration-200 text-left py-3 px-4 rounded-lg font-medium"
              >
                Pricing
              </button>
              <button
                onClick={scrollToContact}
                className="text-foreground hover:text-primary hover:bg-primary/5 transition-all duration-200 text-left py-3 px-4 rounded-lg font-medium"
              >
                Contact
              </button>

              <div className="pt-4 space-y-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary border border-primary/20 font-medium"
                >
                  Sign In
                </Button>
                <Button
                  size="sm"
                  className="w-full gradient-primary text-primary-foreground font-medium group"
                >
                  Get Started Free
                  <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
