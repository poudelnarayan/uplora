"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/app/components/ui/button";
import { 
  Instagram, 
  Twitter, 
  Youtube, 
  Facebook, 
  Linkedin,
  ArrowRight,
  CheckCircle2,
  Plus,
  Loader2
} from "lucide-react";
import OnboardingLayout from "../layout";

const MotionDiv = motion.div;
const MotionCard = motion.div;

const socialPlatforms = [
  {
    id: 'instagram',
    name: 'Instagram',
    icon: Instagram,
    gradient: 'from-purple-500 via-pink-500 to-orange-500',
    bgGradient: 'from-purple-50 to-orange-50 dark:from-purple-950/20 dark:to-orange-950/20'
  },
  {
    id: 'twitter',
    name: 'Twitter/X',
    icon: Twitter,
    gradient: 'from-blue-400 to-blue-600',
    bgGradient: 'from-blue-50 to-blue-50 dark:from-blue-950/20 dark:to-blue-950/20'
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: Youtube,
    gradient: 'from-red-500 to-red-600',
    bgGradient: 'from-red-50 to-red-50 dark:from-red-950/20 dark:to-red-950/20'
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: Facebook,
    gradient: 'from-blue-600 to-blue-700',
    bgGradient: 'from-blue-50 to-blue-50 dark:from-blue-950/20 dark:to-blue-950/20'
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: Linkedin,
    gradient: 'from-blue-700 to-blue-800',
    bgGradient: 'from-blue-50 to-blue-50 dark:from-blue-950/20 dark:to-blue-950/20'
  }
];

export default function ConnectAccountsPage() {
  const router = useRouter();
  const [connectedAccounts, setConnectedAccounts] = useState<string[]>([]);
  const [connecting, setConnecting] = useState<string | null>(null);

  useEffect(() => {
    // Check existing connections
    const checkConnections = async () => {
      try {
        const res = await fetch('/api/social-connections/status');
        if (res.ok) {
          const data = await res.json();
          const connected = data.connectedPlatforms || [];
          setConnectedAccounts(connected);
        }
      } catch (error) {
        console.error('Error checking connections:', error);
      }
    };
    checkConnections();
  }, []);

  const handleConnect = async (platformId: string) => {
    if (connecting) return;
    
    try {
      setConnecting(platformId);
      
      // Redirect to social connection page
      router.push(`/social?platform=${platformId}`);
    } catch (error) {
      console.error('Error connecting account:', error);
      setConnecting(null);
    }
  };

  const handleNext = () => {
    localStorage.setItem('onboarding_connected_accounts', JSON.stringify(connectedAccounts));
    router.push('/onboarding/billing');
  };

  const handleBack = () => {
    router.push('/onboarding/welcome');
  };

  const handleSkip = () => {
    router.push('/onboarding/billing');
  };

  return (
    <OnboardingLayout 
      currentStep={2} 
      totalSteps={4} 
      onBack={handleBack}
    >
      <div className="text-center space-y-12">
        {/* Header */}
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm">
            <Plus className="w-4 h-4" />
            Connect your accounts
          </div>
          
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Connect your social media
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Connect your social media accounts to start creating and scheduling content. You can add more later.
            </p>
          </div>
        </MotionDiv>

        {/* Social Platforms */}
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          className="max-w-3xl mx-auto"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {socialPlatforms.map((platform, index) => {
              const Icon = platform.icon;
              const isConnected = connectedAccounts.includes(platform.id);
              const isConnecting = connecting === platform.id;
              
              return (
                <MotionCard
                  key={platform.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div
                    className={`relative p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer group overflow-hidden ${
                      isConnected
                        ? 'border-green-500/50 shadow-xl shadow-green-500/20 bg-gradient-to-br ' + platform.bgGradient
                        : 'border-border hover:border-primary/50 bg-card/50 backdrop-blur-sm hover:shadow-lg'
                    }`}
                    onClick={() => !isConnected && handleConnect(platform.id)}
                  >
                    {!isConnected && (
                      <div className={`absolute inset-0 bg-gradient-to-br ${platform.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                    )}
                    
                    <div className="relative z-10">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${platform.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      
                      <h3 className="text-lg font-bold text-foreground mb-2">
                        {platform.name}
                      </h3>
                      
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          {isConnected ? 'Connected' : isConnecting ? 'Connecting...' : 'Click to connect'}
                        </p>
                        {isConnected ? (
                          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          </div>
                        ) : isConnecting ? (
                          <Loader2 className="w-5 h-5 text-primary animate-spin" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                            <Plus className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </MotionCard>
              );
            })}
          </div>
        </MotionDiv>

        {/* Action Buttons */}
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          className="pt-4"
        >
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
            <Button
              variant="outline"
              onClick={handleSkip}
              size="lg"
              className="w-full sm:w-auto px-8 py-6 text-lg font-semibold border-border hover:bg-muted/50 transition-all rounded-xl"
            >
              Skip for now
            </Button>
            
            <Button
              onClick={handleNext}
              size="lg"
              className="w-full sm:w-auto px-8 py-6 text-lg font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-xl hover:shadow-2xl transition-all duration-300 rounded-xl"
            >
              Continue
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </MotionDiv>
      </div>
    </OnboardingLayout>
  );
}
