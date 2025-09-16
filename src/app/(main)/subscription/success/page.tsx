"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle, ArrowRight, CreditCard, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { NextSeoNoSSR } from "@/components/seo/NoSSRSeo";
import { useUser, RedirectToSignIn } from "@clerk/nextjs";
import { getProductByPriceId } from "@/stripe-config";
import AppShell from "@/components/layout/AppLayout";

const MotionDiv = motion.div as any;

export const dynamic = "force-dynamic";

interface CheckoutSession {
  id: string;
  status: string;
  customer_email: string;
  amount_total: number;
  currency: string;
  subscription?: {
    id: string;
    status: string;
    current_period_end: number;
  };
  line_items: Array<{
    price: {
      id: string;
      nickname?: string;
      unit_amount: number;
      recurring?: {
        interval: string;
      };
    };
    quantity: number;
  }>;
}

function SubscriptionSuccessContent() {
  const { user, isLoaded } = useUser();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [session, setSession] = useState<CheckoutSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!sessionId) {
      setError('No session ID provided');
      setLoading(false);
      return;
    }

    fetchSessionDetails();
  }, [sessionId]);

  const fetchSessionDetails = async () => {
    try {
      // In a real implementation, you'd fetch session details from your API
      // For now, we'll simulate the session data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockSession: CheckoutSession = {
        id: sessionId!,
        status: 'complete',
        customer_email: user?.emailAddresses[0]?.emailAddress || '',
        amount_total: 699, // $6.99 in cents
        currency: 'usd',
        subscription: {
          id: 'sub_' + Math.random().toString(36).substr(2, 9),
          status: 'active',
          current_period_end: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days from now
        },
        line_items: [
          {
            price: {
              id: 'price_1S827kDS63fnzmVBBpk36xma',
              nickname: 'Uplora Monthly',
              unit_amount: 699,
              recurring: {
                interval: 'month',
              },
            },
            quantity: 1,
          },
        ],
      };

      setSession(mockSession);
    } catch (err) {
      setError('Failed to load payment details');
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) return null;
  if (!user) return <RedirectToSignIn redirectUrl="/subscription/success" />;

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" text="Verifying payment..." />
        </div>
      </AppShell>
    );
  }

  if (error || !session) {
    return (
      <AppShell>
        <div className="max-w-2xl mx-auto text-center py-12">
          <Card>
            <CardContent className="p-8">
              <div className="text-red-500 mb-4">
                <CreditCard className="h-12 w-12 mx-auto" />
              </div>
              <h1 className="text-2xl font-bold mb-4">Payment Verification Failed</h1>
              <p className="text-muted-foreground mb-6">
                {error || 'Unable to verify your payment. Please contact support if you were charged.'}
              </p>
              <Button onClick={() => router.push('/subscription')}>
                Back to Subscription
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }

  const product = getProductByPriceId(session.line_items[0]?.price?.id);
  const isSubscription = session.subscription;
  const amount = session.amount_total / 100; // Convert from cents

  return (
    <>
      <NextSeoNoSSR 
        title="Payment Successful" 
        description="Your payment was processed successfully." 
        noindex 
        nofollow 
      />
      
      <AppShell>
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Success Header */}
          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Payment Successful!</h1>
            <p className="text-xl text-muted-foreground">
              Welcome to Uplora! Your {isSubscription ? 'subscription' : 'purchase'} is now active.
            </p>
          </MotionDiv>

          {/* Payment Details */}
          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-3">Product</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span>Plan:</span>
                        <span className="font-medium">{product?.name || 'Uplora'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Amount:</span>
                        <span className="font-medium">${amount.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Type:</span>
                        <Badge variant="outline">
                          {isSubscription ? 'Subscription' : 'One-time'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Billing</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span>Email:</span>
                        <span className="font-medium">{session.customer_email}</span>
                      </div>
                      {isSubscription && session.subscription && (
                        <>
                          <div className="flex items-center justify-between">
                            <span>Status:</span>
                            <Badge className="bg-green-100 text-green-800">
                              {session.subscription.status}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Next billing:</span>
                            <span className="font-medium">
                              {new Date(session.subscription.current_period_end * 1000).toLocaleDateString()}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </MotionDiv>

          {/* What's Next */}
          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>What's Next?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">🚀</span>
                    </div>
                    <h3 className="font-semibold mb-2">Start Creating</h3>
                    <p className="text-sm text-muted-foreground">
                      Begin uploading and scheduling your content across multiple platforms
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">👥</span>
                    </div>
                    <h3 className="font-semibold mb-2">Invite Your Team</h3>
                    <p className="text-sm text-muted-foreground">
                      Add team members and set up collaboration workflows
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">📊</span>
                    </div>
                    <h3 className="font-semibold mb-2">Track Performance</h3>
                    <p className="text-sm text-muted-foreground">
                      Monitor your content performance with detailed analytics
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </MotionDiv>

          {/* Action Buttons */}
          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-center space-y-4"
          >
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={() => router.push('/dashboard')}
                className="gap-2"
              >
                Go to Dashboard
                <ArrowRight className="h-4 w-4" />
              </Button>
              
              <Button 
                variant="outline" 
                size="lg" 
                onClick={() => router.push('/make-post')}
                className="gap-2"
              >
                Create First Post
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Need help getting started? Check out our{' '}
              <a href="/contact" className="text-primary hover:underline">
                support center
              </a>{' '}
              or contact us directly.
            </p>
          </MotionDiv>
        </div>
      </AppShell>
    </>
  );
}

export default function SubscriptionSuccessPage() {
  return (
    <Suspense fallback={
      <AppShell>
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" text="Loading..." />
        </div>
      </AppShell>
    }>
      <SubscriptionSuccessContent />
    </Suspense>
  );
}