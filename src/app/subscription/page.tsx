"use client";

import AppShell from "@/components/layout/AppShell";
import { Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { NextSeoNoSSR } from "@/components/seo/NoSSRSeo";
export const dynamic = "force-dynamic";

// User-facing benefits (as requested)
const features = [
  "Work together: invite your team and assign roles",
  "Email notifications for key actions",
  "Fast support",
  "Unlimited uploads",
  "Priority support",
];

function FeatureItem({ enabled, text }: { enabled: boolean; text: string }) {
  return (
    <li className="flex items-start gap-2">
      {enabled ? (
        <Check className="w-4 h-4 text-green-600 mt-0.5" />
      ) : (
        <X className="w-4 h-4 text-muted-foreground mt-0.5" />
      )}
      <span className={enabled ? "text-foreground" : "text-muted-foreground"}>{text}</span>
    </li>
  );
}

export default function SubscriptionPage() {
  const router = useRouter();

  const handleSubscribe = (plan: "monthly" | "yearly") => {
    // Placeholder action. Integrate payment later.
    router.push(`/checkout?plan=${plan}`);
  };

  return (
    <AppShell>
      <NextSeoNoSSR title="Pricing" description="Choose a Uplora plan." />
      <div className="max-w-7xl mx-auto py-12">
        <div className="text-center mb-12">
          <h1 className="heading-2">Choose your plan</h1>
          <p className="text-muted-foreground mt-3">
            Create, manage and publish YouTube videos with your team. Start free, upgrade when you’re ready.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Free */}
          <div className="card p-8 flex flex-col">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Free</h3>
              <p className="text-3xl font-bold mt-2">$0</p>
              <p className="text-muted-foreground mt-1">Limited access</p>
            </div>
            <ul className="space-y-2 text-sm flex-1">
              <FeatureItem enabled={true} text="1 test upload only" />
              <FeatureItem enabled={true} text="Preview the video online" />
              <FeatureItem enabled={true} text="Try the request-for-publish flow" />
              <FeatureItem enabled={false} text="Invite your team" />
              <FeatureItem enabled={false} text="Unlimited uploads" />
              <FeatureItem enabled={false} text="Email notifications & priority support" />
            </ul>
            <button className="btn btn-outline mt-6" onClick={() => router.push("/upload")}>Start Free</button>
          </div>

          {/* Monthly */}
          <div className="card p-8 border-primary/30 ring-2 ring-primary/20 flex flex-col">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Monthly</h3>
              <div className="flex items-end gap-2 mt-2">
                <p className="text-3xl font-bold">$19</p>
                <span className="text-muted-foreground">/mo</span>
              </div>
              <p className="text-muted-foreground mt-1">Full access</p>
            </div>
            <ul className="space-y-2 text-sm flex-1">
              {features.map((f) => (
                <FeatureItem key={f} enabled={true} text={f} />
              ))}
            </ul>
            <button className="btn btn-primary mt-6" onClick={() => handleSubscribe("monthly")}>Subscribe Monthly</button>
          </div>

          {/* Yearly */}
          <div className="card p-8 flex flex-col">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Yearly</h3>
              <div className="flex items-end gap-2 mt-2">
                <p className="text-3xl font-bold">$190</p>
                <span className="text-muted-foreground">/yr</span>
              </div>
              <p className="text-green-600 text-sm mt-1">2 months free</p>
            </div>
            <ul className="space-y-2 text-sm flex-1">
              {features.map((f) => (
                <FeatureItem key={f} enabled={true} text={f} />
              ))}
            </ul>
            <button className="btn btn-primary mt-6" onClick={() => handleSubscribe("yearly")}>Subscribe Yearly</button>
          </div>
        </div>

        <div className="text-center mt-12 text-xs text-muted-foreground">
          Free plan is for evaluation only. After your single test upload, subscribe to continue using background uploads, team workflows, and publishing.
        </div>
      </div>
    </AppShell>
  );
}
 
