"use client";
import { SignUp, useAuth } from '@clerk/nextjs'
import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
 
export default function Page() {
  const { isSignedIn } = useAuth();
  const search = useSearchParams();
  const router = useRouter();
  const redirectTarget = search.get('redirect_url') || '/dashboard';

  useEffect(() => {
    if (isSignedIn) {
      router.replace(redirectTarget);
    }
  }, [isSignedIn, router, redirectTarget]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
       
        {!isSignedIn ? (
        <>
        <div className="flex justify-center mb-6">
          <Image
            src="/text-logo.png"
            alt="Uplora"
            width={180}
            height={36}
            priority
          />
        </div>
        <SignUp 
          routing="path"
          path="/sign-up"
          appearance={{
            layout: { socialButtonsVariant: 'blockButton', logoPlacement: 'none' as any },
            elements: {
              formButtonPrimary: 'btn btn-primary w-full',
              card: 'bg-card border border-border shadow-lg',
              headerTitle: 'text-foreground',
              headerSubtitle: 'text-muted-foreground',
              socialButtonsBlockButton: 'btn btn-outline w-full',
              formFieldInput: 'input input-bordered w-full',
              formFieldLabel: 'text-foreground',
              formFieldErrorText: 'text-red-500',
              footerActionLink: 'link text-primary',
            },
          }}
          afterSignUpUrl={redirectTarget}
          signInUrl="/sign-in"
        />
        </>
        ) : (
          <div className="text-center text-sm text-muted-foreground">Redirecting…</div>
        )}
      </div>
    </div>
  )
}
