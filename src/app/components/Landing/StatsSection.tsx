"use client";

import { Users, Upload, Clock, Globe } from "lucide-react";

const STATS = [
  {
    Icon: Users,
    label: "Active teams",
    value: "100+",
    tint: "text-primary bg-primary/10",
  },
  {
    Icon: Upload,
    label: "Posts shipped",
    value: "5,000+",
    tint: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
  },
  {
    Icon: Clock,
    label: "Avg approval time",
    value: "< 5 min",
    tint: "text-amber-600 dark:text-amber-400 bg-amber-500/10",
  },
  {
    Icon: Globe,
    label: "Platforms supported",
    value: "8",
    tint: "text-sky-600 dark:text-sky-400 bg-sky-500/10",
  },
];

const StatsSection = () => {
  return (
    <section className="relative py-16 sm:py-20 border-y border-border bg-card/40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {STATS.map(({ Icon, label, value, tint }) => (
            <div
              key={label}
              className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 sm:p-5"
            >
              <div className={`h-12 w-12 sm:h-14 sm:w-14 rounded-xl ${tint} flex items-center justify-center shrink-0`}>
                <Icon className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={1.8} />
              </div>
              <div className="min-w-0">
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground tabular-nums leading-tight">
                  {value}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground truncate">
                  {label}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
