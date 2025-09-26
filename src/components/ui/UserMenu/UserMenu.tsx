"use client";

import { useMemo, useState } from "react";
import { Settings, LogOut, CreditCard, ChevronDown } from "lucide-react";
import { useUser, SignOutButton } from "@clerk/nextjs";
import Link from "next/link";
import SubscriptionBadge from "@/components/ui/SubscriptionBadge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserMenuProps {
  onFeedbackClick: () => void;
  dropdownPosition?: 'top' | 'bottom';
}

export default function UserMenu({ onFeedbackClick, dropdownPosition = 'bottom' }: UserMenuProps) {
  const { user } = useUser();
  const [open, setOpen] = useState(false);

  const userName = useMemo(() => user?.fullName || user?.firstName || "User", [user]);
  const userInitials = useMemo(() => {
    return (
      user?.fullName?.split(' ').map(n => n[0]).join('') ||
      user?.firstName?.[0] ||
      user?.emailAddresses?.[0]?.emailAddress?.[0] || "U"
    );
  }, [user]);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-3 px-3 py-2 rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm hover:bg-card hover:border-border transition-all duration-200 hover:shadow-sm">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.imageUrl || undefined} alt={userName} />
            <AvatarFallback>{userInitials}</AvatarFallback>
          </Avatar>
          <span className="hidden sm:block text-sm font-medium text-foreground truncate max-w-32">
            {userName}
          </span>
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side={dropdownPosition} sideOffset={8} className="w-64">
        {/* Optional: keep subscription badge minimal at top if desired */}
        {/* <div className="px-3 py-2"><SubscriptionBadge showTrialInfo={false} /></div>
        <DropdownMenuSeparator /> */}

        <Link href="/settings">
          <DropdownMenuItem className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Settings</span>
          </DropdownMenuItem>
        </Link>

        <Link href="/subscription">
          <DropdownMenuItem className="cursor-pointer">
            <CreditCard className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Billing</span>
          </DropdownMenuItem>
        </Link>

        <DropdownMenuSeparator />
        <SignOutButton signOutOptions={{ redirectUrl: "/" }}>
          <DropdownMenuItem className="text-destructive cursor-pointer">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sign Out</span>
          </DropdownMenuItem>
        </SignOutButton>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}