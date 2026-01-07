"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { 
  Instagram, 
  Twitter, 
  Youtube, 
  Facebook, 
  Linkedin,
  ArrowRight,
  Check,
  Plus
} from "lucide-react";
import OnboardingLayout from "../layout";

const MotionDiv = motion.div;
const MotionCard = motion.div;

const socialPlatforms = [
  {
    id: 'instagram',
    name: 'Instagram',
    icon: Instagram,
    color: 'bg-accent/10 text-accent',
    connected: false
  },
  {
    id: 'twitter',
    name: 'Twitter/X',
    icon: Twitter,
    color: 'bg-muted text-foreground',
    connected: false
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: Youtube,
    color: 'bg-destructive/10 text-destructive',
    connected: false
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: Facebook,
    color: 'bg-primary/10 text-primary',
    connected: false
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: Linkedin,
    color: 'bg-success/10 text-success',
    connected: false
  }
];

export default function ConnectAccountsPage() {
  const router = useRouter();
  const [connectedAccounts, setConnectedAccounts] = useState<string[]>([]);

  const handleConnect = async (platformId: string) => {
    try {
      // Here you would implement real OAuth connection
      // For now, we'll simulate the connection
      setConnectedAccounts(prev => 
        prev.includes(platformId) 
          ? prev.filter(id => id !== platformId)
          : [...prev, platformId]
      );
      
      // You can add real OAuth flow here:
      // const authUrl = await getOAuthUrl(platformId);
      // window.open(authUrl, '_blank');
    } catch (error) {
      console.error('Error connecting account:', error);
    }
  };

  const handleNext = () => {
    // Store connected accounts
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
      totalSteps={5} 
      onBack={handleBack}
    >
      <div className="text-center space-y-8">
        {/* Header */}
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="space-y-4"
        >
          <div className="flex items-center justify-center gap-2 text-primary font-medium">
            <Plus className="w-5 h-5" />
            Connect your accounts
          </div>
          
          <div>
            <h1 className="text-3xl font-semibold text-foreground mb-4">
              Connect your social media
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg mx-auto">
              Connect your social media accounts to start creating and scheduling content
            </p>
          </div>
        </MotionDiv>

        {/* Social Platforms */}
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-2xl mx-auto"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {socialPlatforms.map((platform, index) => {
              const Icon = platform.icon;
              const isConnected = connectedAccounts.includes(platform.id);
              
              return (
                <MotionCard
                  key={platform.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card
                    className={`cursor-pointer transition-all duration-200 ${
                      isConnected
                        ? 'ring-2 ring-success/30 shadow-medium border-success/20'
                        : 'hover:shadow-soft border-border'
                    }`}
                    onClick={() => handleConnect(platform.id)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-lg ${platform.color} flex items-center justify-center`}>
                            <Icon className="w-6 h-6" />
                          </div>
                          <div className="text-left">
                            <h3 className="font-semibold text-foreground">
                              {platform.name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {isConnected ? 'Connected' : 'Click to connect'}
                            </p>
                          </div>
                        </div>
                        {isConnected ? (
                          <div className="w-8 h-8 rounded-full bg-success flex items-center justify-center">
                            <Check className="w-5 h-5 text-white" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            <Plus className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </MotionCard>
              );
            })}
          </div>
        </MotionDiv>

        {/* Action Buttons */}
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="pt-8"
        >
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
            <Button
              variant="outline"
              onClick={handleSkip}
              size="lg"
              className="w-full sm:w-auto px-8 py-3 text-lg font-medium border-border text-foreground hover:bg-muted transition-all duration-200"
            >
              Skip for now
            </Button>
            
            <Button
              onClick={handleNext}
              size="lg"
              className="w-full sm:w-auto px-8 py-3 text-lg font-medium gradient-primary text-primary-foreground shadow-medium hover:shadow-strong transition-all duration-200 transform hover:scale-[1.02]"
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