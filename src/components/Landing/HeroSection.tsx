import { Button } from  "../../components/ui/button"
import { Play, ArrowRight } from "lucide-react";
import InteractiveSocialIcons from "./InteractiveSocialIcons";
import { useRouter } from "next/navigation";
import { SignedIn, SignedOut } from '@clerk/nextjs';

const HeroSection = () => {
  const router = useRouter();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 gradient-hero opacity-5"></div>
      
      <div className="container mx-auto px-4 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="text-center lg:text-left">
            {/* Differentiator Badge - Industry Standard */}
            <div className="mb-8">
              <div className="inline-block bg-secondary/50 border border-border rounded-lg px-4 py-2">
                <span className="text-muted-foreground font-medium text-sm tracking-wide">
                  Not another social media scheduling platform, <span className="font-bold text-primary">IT'S MORE</span>
                </span>
              </div>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-poppins mb-6 leading-tight tracking-tight text-center lg:text-left">
              <div className="font-bold gradient-text text-4xl md:text-5xl lg:text-6xl mb-1">
                Collaborative
              </div>
              <div className="font-medium text-2xl md:text-3xl lg:text-4xl text-foreground flex items-center justify-center lg:justify-start gap-4">
                <span>Scheduling</span>
                <span className="hidden lg:block w-16 h-0.5 bg-primary"></span>
              </div>
              <div className="font-extralight text-xl md:text-2xl lg:text-3xl text-muted-foreground mt-2 tracking-widest">
                FOR EVERY PLATFORM
              </div>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed max-w-2xl">
              Uplora helps creators and teams draft, approve, and publish across 
              <span className="text-primary font-medium"> YouTube, TikTok, Instagram, LinkedIn, X, and Facebook</span>{" "}
              with seamless team workflow collaboration.
            </p>
            
            <div className="bg-secondary/50 border border-border rounded-lg p-4 mb-8 max-w-2xl">
              <p className="text-foreground font-medium text-lg">
                🎯 Built for teams who need approval workflows
              </p>
              <p className="text-muted-foreground mt-1">
                Editors create • Admins review • System publishes automatically
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <SignedOut>
                <Button 
                  size="lg" 
                  onClick={() => router.push('/sign-up')}
                  className="gradient-primary text-primary-foreground hover-glow text-lg px-8 py-4"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </SignedOut>
              <SignedIn>
                <Button 
                  size="lg" 
                  onClick={() => router.push('/dashboard')}
                  className="gradient-primary text-primary-foreground hover-glow text-lg px-8 py-4"
                >
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </SignedIn>
              
              <Button 
                variant="outline" 
                size="lg" 
                onClick={() => router.push('/about')}
                className="text-lg px-8 py-4 hover-lift"
              >
                <Play className="mr-2 h-5 w-5" />
                See How It Works
              </Button>
            </div>

            {/* Platform Logos */}
            <div className="mt-12">
              <p className="text-sm text-muted-foreground mb-4">Publish to all major platforms</p>
              <div className="flex flex-wrap gap-6 justify-center lg:justify-start items-center opacity-60">
                <div className="text-red-500 font-bold">YouTube</div>
                <div className="text-pink-500 font-bold">TikTok</div>
                <div className="text-purple-500 font-bold">Instagram</div>
                <div className="text-blue-600 font-bold">LinkedIn</div>
                <div className="text-gray-800 font-bold">X</div>
                <div className="text-blue-500 font-bold">Facebook</div>
              </div>
            </div>
          </div>

          {/* Interactive Social Media Icons */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="w-full max-w-md mx-auto lg:max-w-none lg:mx-0">
              <InteractiveSocialIcons />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;