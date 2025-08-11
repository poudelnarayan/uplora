"use client";

import { motion } from "framer-motion";
import AppShell from "@/components/layout/AppShell";
import { Check, Star } from "lucide-react";

export default function SubscriptionPage() {
  return (
    <AppShell>
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <h1 className="heading-2 mb-2">Choose Your Plan</h1>
          <p className="text-muted-foreground">Pick a plan that fits your workflow. Upgrade anytime.</p>
        </motion.div>

        {/* Row 1: Lite Plans */}
        <div className="mb-8">
          <h2 className="text-sm uppercase tracking-wide text-muted-foreground mb-3">Lite</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Lite Monthly */}
            <div className="card p-6">
              <div className="mb-3">
                <h3 className="text-xl font-bold">Lite (Monthly)</h3>
                <p className="text-xs text-muted-foreground">Starter plan</p>
              </div>
              <div className="mb-4 space-y-1">
                <div className="text-3xl font-bold">$19.99<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                <p className="text-xs text-muted-foreground">Billed monthly. Cancel anytime.</p>
              </div>
              <ul className="space-y-2 mb-6 text-sm">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Up to <strong>3</strong> projects simultaneously</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Unlimited uploads</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Team collaboration</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Email invitations</li>
              </ul>
              <button className="btn btn-primary w-full">Choose Lite Monthly</button>
            </div>

            {/* Lite Yearly */}
            <div className="card p-6 border-primary/30 relative">
              <span className="absolute -top-3 right-4 text-xs px-2 py-1 rounded-full bg-primary text-primary-foreground">Save</span>
              <div className="mb-3">
                <h3 className="text-xl font-bold">Lite (Yearly)</h3>
                <p className="text-xs text-muted-foreground">Starter plan</p>
              </div>
              <div className="mb-4 space-y-1">
                <div className="text-3xl font-bold">$199.99<span className="text-sm font-normal text-muted-foreground">/yr</span></div>
                <p className="text-xs text-muted-foreground">~17% off vs monthly</p>
              </div>
              <ul className="space-y-2 mb-6 text-sm">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Up to <strong>3</strong> projects simultaneously</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Unlimited uploads</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Team collaboration</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Email invitations</li>
              </ul>
              <button className="btn btn-primary w-full">Choose Lite Yearly</button>
            </div>
          </div>
        </div>

        {/* Row 2: Blaze Plans */}
        <div>
          <h2 className="text-sm uppercase tracking-wide text-muted-foreground mb-3">Blaze</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Blaze Monthly */}
            <div className="card p-6">
              <div className="mb-3">
                <h3 className="text-xl font-bold">Blaze (Monthly)</h3>
                <p className="text-xs text-muted-foreground">Pro plan</p>
              </div>
              <div className="mb-4 space-y-1">
                <div className="text-3xl font-bold">$29.99<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                <p className="text-xs text-muted-foreground">Billed monthly. Cancel anytime.</p>
              </div>
              <ul className="space-y-2 mb-6 text-sm">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Up to <strong>10</strong> projects simultaneously</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Unlimited uploads</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Team collaboration</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Priority support</li>
              </ul>
              <button className="btn btn-primary w-full">Choose Blaze Monthly</button>
            </div>

            {/* Blaze Yearly */}
            <div className="card p-6 border-primary/30 relative">
              <span className="absolute -top-3 right-4 text-xs px-2 py-1 rounded-full bg-primary text-primary-foreground flex items-center gap-1"><Star className="w-3 h-3" /> Best Value</span>
              <div className="mb-3">
                <h3 className="text-xl font-bold">Blaze (Yearly)</h3>
                <p className="text-xs text-muted-foreground">Pro plan</p>
              </div>
              <div className="mb-4 space-y-1">
                <div className="text-3xl font-bold">$299.99<span className="text-sm font-normal text-muted-foreground">/yr</span></div>
                <p className="text-xs text-muted-foreground">~17% off vs monthly</p>
              </div>
              <ul className="space-y-2 mb-6 text-sm">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Up to <strong>10</strong> projects simultaneously</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Unlimited uploads</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Team collaboration</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Priority support</li>
              </ul>
              <button className="btn btn-primary w-full">Choose Blaze Yearly</button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
