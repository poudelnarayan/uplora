"use client";

import { 
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton 
} from '@clerk/nextjs';
import Link from 'next/link';
import Image from 'next/image';

export default function ClerkHeader() {
  return (
    <header className="flex justify-between items-center p-4 border-b border-border bg-card">
      <Link href="/" className="flex items-center">
        <Image 
          src="/text-logo.png" 
          alt="Uplora" 
          width={120} 
          height={30} 
          className="rounded-md" 
        />
      </Link>
      
      <div className="flex items-center gap-4">
        <SignedOut>
          <SignInButton mode="modal">
            <button className="btn btn-ghost">
              Sign In
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="btn btn-primary">
              Sign Up
            </button>
          </SignUpButton>
        </SignedOut>
        <SignedIn>
          <UserButton 
            appearance={{
              elements: {
                avatarBox: "w-8 h-8",
                userButtonPopoverCard: "bg-card border border-border shadow-lg",
                userButtonPopoverActionButton: "text-foreground hover:bg-muted",
                userButtonPopoverActionButtonText: "text-foreground",
                userButtonPopoverFooter: "hidden"
              }
            }}
            afterSignOutUrl="/"
          />
        </SignedIn>
      </div>
    </header>
  );
}
