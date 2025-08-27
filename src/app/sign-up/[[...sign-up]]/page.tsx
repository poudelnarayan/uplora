"use client";
import { SignUp, useAuth } from '@clerk/nextjs'
import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
 
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <img src="/text-logo.png" alt="Uplora" className="h-8" />
        </div>
        {!isSignedIn ? (
        <SignUp 
          routing="path"
          path="/sign-up"
          appearance={{
            layout: { socialButtonsVariant: 'blockButton' },
            elements: {
              formButtonPrimary: 'btn btn-primary w-full',
              card: 'bg-white border border-gray-200 shadow-lg rounded-lg',
              headerTitle: 'text-gray-900',
              headerSubtitle: 'text-gray-600',
              socialButtonsBlockButton: 'btn btn-outline w-full',
              formFieldInput: 'bg-white border border-gray-300 rounded-lg px-3 py-2 w-full',
              formFieldLabel: 'text-gray-700',
              formFieldErrorText: 'text-red-500',
              footerActionLink: 'text-blue-600 hover:text-blue-700',
            },
          }}
          afterSignUpUrl={redirectTarget}
          signInUrl="/sign-in"
        />
        ) : (
          <div className="text-center text-sm text-gray-600">Redirecting…</div>
        )}
      </div>
    </div>
  )
}
