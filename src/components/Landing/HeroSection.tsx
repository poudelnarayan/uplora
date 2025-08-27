import { Button } from  "../../components/ui/button"
import { Play, ArrowRight } from "lucide-react";
import InteractiveSocialIcons from "./InteractiveSocialIcons";
import { useRouter } from "next/navigation";
import { SignedIn, SignedOut } from '@clerk/nextjs';

const HeroSection = () => {
  const router = useRouter();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white">
      
      <div className="container mx-auto px-4 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="text-center lg:text-left">
            {/* Differentiator Badge - Industry Standard */}
            <div className="mb-8">
              <div className="inline-block bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm">
                <span className="text-gray-600 font-medium text-sm tracking-wide" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Not another social media scheduling platform, <span className="font-bold text-blue-600">IT'S MORE</span>
                </span>
              </div>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl mb-6 leading-tight tracking-tight text-center lg:text-left" style={{ fontFamily: 'Inter, sans-serif' }}>
              <div className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 text-4xl md:text-5xl lg:text-6xl mb-1">
                Collaborative
              </div>
              <div className="font-medium text-2xl md:text-3xl lg:text-4xl text-gray-900 flex items-center justify-center lg:justify-start gap-4">
                <span>Scheduling</span>
                <span className="hidden lg:block w-16 h-0.5 bg-blue-600"></span>
              </div>
              <div className="font-light text-xl md:text-2xl lg:text-3xl text-blue-400 mt-2 tracking-widest">
                FOR EVERY PLATFORM
              </div>
            </h1>
            
            <p className="text-xl mb-8 leading-relaxed max-w-2xl" style={{ color: 'hsl(224, 20%, 50%)', fontFamily: 'Inter, sans-serif' }}>
              Uplora helps creators and teams draft, approve, and publish across 
              <span className="text-red-500 font-medium">YouTube</span>, <span className="text-black font-medium">TikTok</span>, <span className="text-pink-500 font-medium">Instagram</span>, <span className="text-blue-600 font-medium">LinkedIn</span>, <span className="text-gray-800 font-medium">X</span>, and <span className="text-blue-500 font-medium">Facebook</span>{" "}
              with seamless team workflow collaboration.
            </p>
            
            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-8 max-w-2xl shadow-sm">
              <p className="text-gray-900 font-medium text-lg" style={{ fontFamily: 'Inter, sans-serif' }}>
                🎯 Built for teams who need approval workflows
              </p>
              <p className="text-gray-600 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                Editors create • Admins review • System publishes automatically
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <SignedOut>
                <Button 
                  size="lg" 
                  onClick={() => router.push('/sign-up')}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg text-lg px-8 py-4 rounded-full"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </SignedOut>
              <SignedIn>
                <Button 
                  size="lg" 
                  onClick={() => router.push('/dashboard')}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg text-lg px-8 py-4 rounded-full"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </SignedIn>
              
              <Button 
                variant="outline" 
                size="lg" 
                onClick={() => router.push('/about')}
                className="text-lg px-8 py-4 bg-white border-gray-300 text-gray-700 hover:bg-gray-50 rounded-full"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                <Play className="mr-2 h-5 w-5" />
                See How It Works
              </Button>
            </div>

            {/* Platform Logos */}
            <div className="mt-12">
              <p className="text-sm text-gray-600 mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>Publish to all major platforms</p>
              <div className="flex flex-wrap gap-6 justify-center lg:justify-start items-center">
                <div className="text-red-500 font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>YouTube</div>
                <div className="text-black font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>TikTok</div>
                <div className="text-pink-500 font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>Instagram</div>
                <div className="text-blue-600 font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>LinkedIn</div>
                <div className="text-gray-800 font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>X</div>
                <div className="text-blue-500 font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>Facebook</div>
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