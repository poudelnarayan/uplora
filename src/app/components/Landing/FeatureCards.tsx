"use client";

import {
  Youtube,
  ShieldCheck,
  Calendar,
  Users,
  Eye,
  Sparkles,
} from "lucide-react";

const FEATURES = [
  {
    Icon: Youtube,
    title: "Publish straight to YouTube",
    body: "Editors upload the video, owners approve it, and Uplora pushes it to your channel — title, description, tags, thumbnail, and scheduling all in one flow.",
    tint: "bg-red-500/10 text-red-600 dark:text-red-400",
  },
  {
    Icon: ShieldCheck,
    title: "Approvals built in",
    body: "Editors request, owners review, posts ship. No more screenshots in DMs or last-minute fire drills.",
    tint: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  {
    Icon: Calendar,
    title: "Schedule that respects you",
    body: "Set a publish time, see the full week on the calendar, and reschedule with a drag — never a re-upload.",
    tint: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  {
    Icon: Users,
    title: "Workspaces and roles",
    body: "Separate personal work from team workspaces. Owner, admin, manager, editor — each role only sees what it needs.",
    tint: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  },
  {
    Icon: Eye,
    title: "True live preview",
    body: "Exactly what YouTube will render — title, description, thumbnail, tags, chapters, end screens — before anyone clicks publish.",
    tint: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  },
  {
    Icon: Sparkles,
    title: "AI assist (soon)",
    body: "Generate titles, rewrite descriptions, suggest tags, and auto-pick the best thumbnail — without leaving the editor.",
    tint: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  },
];

const FeatureCards = () => {
  return (
    <section className="relative py-20 sm:py-28 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
            Features
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            Everything a content team needs.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground">
            Built around how creator teams actually work, not how scheduling tools assume you do.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {FEATURES.map(({ Icon, title, body, tint }) => (
            <div
              key={title}
              className="group relative rounded-2xl border border-border bg-card p-5 sm:p-6 hover:border-primary/30 hover:shadow-md transition-all"
            >
              <div className={`h-11 w-11 rounded-xl ${tint} flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                <Icon className="h-5 w-5" strokeWidth={1.8} />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1.5">
                {title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureCards;
