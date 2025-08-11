"use client";

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  Upload, 
  Users, 
  BarChart3, 
  Lightbulb, 
  Settings, 
  LogOut, 
  ChevronDown,
  Video,
  Crown,
  Shield,
  Target,
  Edit,
  Plus,
  Mail,
  Bell,
  Search,
  Menu,
  X
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useNotifications } from '@/components/ui/Notification';
import { ConfirmModal } from '@/components/ui/Modal';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <Home className="w-5 h-5" />,
    href: '/dashboard'
  },
  {
    id: 'upload',
    label: 'Upload Center',
    icon: <Upload className="w-5 h-5" />,
    href: '/upload'
  },
  {
    id: 'teams',
    label: 'Team Management',
    icon: <Users className="w-5 h-5" />,
    href: '/teams',
    children: [
      { id: 'teams-overview', label: 'Overview', icon: <Users className="w-4 h-4" />, href: '/teams' },
      { id: 'teams-create', label: 'Create Team', icon: <Plus className="w-4 h-4" />, href: '/teams/create' },
      { id: 'teams-invites', label: 'Invitations', icon: <Mail className="w-4 h-4" />, href: '/teams/invites' }
    ]
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: <BarChart3 className="w-5 h-5" />,
    href: '/analytics'
  },
  {
    id: 'insights',
    label: 'Insights',
    icon: <Lightbulb className="w-5 h-5" />,
    href: '/insights'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <Settings className="w-5 h-5" />,
    href: '/settings'
  }
];

export default function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const notifications = useNotifications();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSignOut = () => {
    notifications.info("Signing out...", "See you next time!");
    setTimeout(() => signOut(), 1000);
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  const renderNavItem = (item: NavItem, level: number = 0) => {
    const isExpanded = expandedItems.includes(item.id);
    const active = isActive(item.href);
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.id}>
        <Link href={item.href}>
          <motion.div
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer group ${
              active 
                ? 'bg-primary text-primary-foreground shadow-lg' 
                : 'hover:bg-muted text-muted-foreground hover:text-foreground'
            } ${level > 0 ? 'ml-4' : ''}`}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className={`${active ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'}`}>
              {item.icon}
            </div>
            <span className="font-medium">{item.label}</span>
            {hasChildren && (
              <ChevronDown 
                className={`w-4 h-4 ml-auto transition-transform duration-200 ${
                  isExpanded ? 'rotate-180' : ''
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  toggleExpanded(item.id);
                }}
              />
            )}
          </motion.div>
        </Link>
        
        {hasChildren && (
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-2 space-y-1">
                  {item.children!.map(child => renderNavItem(child, level + 1))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-card border shadow-lg"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: isMobileOpen ? 0 : -300 }}
        className={`fixed left-0 top-0 h-full w-80 bg-card border-r shadow-xl z-50 lg:translate-x-0 lg:static lg:z-auto transition-transform duration-300 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <Video className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gradient">YTUploader</h1>
                  <p className="text-sm text-muted-foreground">Team Management</p>
                </div>
              </div>
              <button
                onClick={() => setIsMobileOpen(false)}
                className="lg:hidden p-2 rounded-lg hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* User Profile */}
          <div className="p-4 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {session?.user?.name?.[0] || session?.user?.email?.[0] || "U"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{session?.user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">{session?.user?.email}</p>
              </div>
              <div className="flex items-center gap-1">
                <Crown className="w-4 h-4 text-yellow-500" />
                <span className="text-xs text-muted-foreground">Owner</span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navItems.map(item => renderNavItem(item))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t">
            <button
              onClick={() => setShowSignOutConfirm(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Sign Out Confirmation */}
      <ConfirmModal
        isOpen={showSignOutConfirm}
        onClose={() => setShowSignOutConfirm(false)}
        onConfirm={handleSignOut}
        title="Sign Out"
        message="Are you sure you want to sign out? You'll need to sign in again to access your account."
        confirmText="Sign Out"
        cancelText="Cancel"
        confirmVariant="destructive"
      />
    </>
  );
}
