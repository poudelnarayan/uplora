import { Button } from "../../components/ui/button";
import { Menu, X, Star, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

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
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-200/50">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Section */}
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <div className="w-4 h-4 bg-white rounded-sm"></div>
              </div>
              <div className="text-2xl font-bold text-blue-600 tracking-tight" style={{ fontFamily: 'Inter, sans-serif' }}>
                Uplora
              </div>
            </div>

            {/* Enhanced Review Indicator */}
            <div
              onClick={scrollToReviews}
              className="hidden lg:flex items-center space-x-3 px-4 py-2 rounded-full bg-gradient-to-r from-yellow-100 to-orange-100 border border-yellow-300 cursor-pointer hover:from-yellow-200 hover:to-orange-200 hover:border-yellow-400 transition-all duration-300 hover:scale-105"
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
                <span className="text-sm font-semibold text-gray-800" style={{ fontFamily: 'Inter, sans-serif' }}>
                  4.9
                </span>
                <div className="h-4 w-px bg-gray-300" />
                <span className="text-xs font-medium text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>
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
                className="px-4 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Features
              </button>
              <button
                onClick={scrollToPricing}
                className="px-4 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Pricing
              </button>
              <button
                onClick={scrollToContact}
                className="px-4 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Contact
              </button>
            </div>

            <div className="flex items-center space-x-3">
              <SignedOut>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/sign-in')}
                  className="bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 border border-blue-200 font-medium px-6 rounded-lg"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  Sign In
                </Button>
                <Button
                  size="sm"
                  onClick={() => router.push('/sign-up')}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg font-medium px-6 rounded-full group"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  Get Started Free
                  <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </SignedOut>
              <SignedIn>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/dashboard')}
                  className="bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 border border-blue-200 font-medium px-6 rounded-lg"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  Dashboard
                </Button>
                <UserButton 
                  appearance={{
                    elements: {
                      avatarBox: "w-8 h-8",
                      userButtonPopoverCard: "bg-white border border-gray-200 shadow-lg",
                      userButtonPopoverActionButton: "text-gray-700 hover:bg-gray-50",
                      userButtonPopoverActionButtonText: "text-gray-700"
                    }
                  }}
                  afterSignOutUrl="/"
                />
              </SignedIn>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="hover:bg-blue-50 hover:text-blue-600"
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
          <div className="md:hidden py-6 border-t border-gray-200 bg-gray-50 rounded-b-xl -mx-4 px-4">
            <div className="flex flex-col space-y-1">
              <button
                onClick={scrollToFeatures}
                className="text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 text-left py-3 px-4 rounded-lg font-medium"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Features
              </button>
              <button
                onClick={scrollToPricing}
                className="text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 text-left py-3 px-4 rounded-lg font-medium"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Pricing
              </button>
              <button
                onClick={scrollToContact}
                className="text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 text-left py-3 px-4 rounded-lg font-medium"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Contact
              </button>

              <div className="pt-4 space-y-3">
                <SignedOut>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push('/sign-in')}
                    className="w-full bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 border border-blue-200 font-medium rounded-lg"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    Sign In
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => router.push('/sign-up')}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg font-medium px-6 rounded-full group"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    Get Started Free
                    <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Button>
                </SignedOut>
                <SignedIn>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push('/dashboard')}
                    className="w-full bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 border border-blue-200 font-medium rounded-lg"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    Dashboard
                  </Button>
                  <div className="flex justify-center">
                    <UserButton 
                      appearance={{
                        elements: {
                          avatarBox: "w-8 h-8",
                          userButtonPopoverCard: "bg-white border border-gray-200 shadow-lg",
                          userButtonPopoverActionButton: "text-gray-700 hover:bg-gray-50",
                          userButtonPopoverActionButtonText: "text-gray-700"
                        }
                      }}
                      afterSignOutUrl="/"
                    />
                  </div>
                </SignedIn>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
