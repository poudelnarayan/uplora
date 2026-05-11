"use client";

import { Pencil, ShieldCheck, Send, ArrowRight } from "lucide-react";

const STEPS = [
  {
    n: "01",
    Icon: Pencil,
    title: "Editor drafts",
    body:
      "Your team uploads videos, writes captions, picks platforms — all inside Uplora. No file passing, no version chaos.",
    tint: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  },
  {
    n: "02",
    Icon: ShieldCheck,
    title: "Owner approves",
    body:
      "A side-by-side preview shows exactly what will publish where. One tap to approve, send back, or edit.",
    tint: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  {
    n: "03",
    Icon: Send,
    title: "Uplora publishes",
    body:
      "We post to every selected platform on the schedule you set — and confirm in your dashboard the moment they go live.",
    tint: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
];

const WorkflowSection = () => {
  return (
    <section id="how-it-works" className="relative py-20 sm:py-28">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
            How it works
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            Three steps from idea to live.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground">
            A workflow that trusts editors to move fast and gives owners the safety net to approve before anything goes out.
          </p>
        </div>

        {/* Steps — horizontal connected timeline on lg, stacked on mobile */}
        <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-0">
          {/* Connecting line (desktop only) */}
          <div
            aria-hidden
            className="hidden lg:block absolute top-[3.25rem] left-[16.66%] right-[16.66%] h-px bg-gradient-to-r from-transparent via-border to-transparent"
          />

          {STEPS.map((step, i) => (
            <div key={step.n} className="relative flex flex-col items-center text-center px-4 lg:px-8">
              {/* Numbered step tile */}
              <div className="relative z-10 mb-5">
                <div className={`h-[6.5rem] w-[6.5rem] rounded-2xl ${step.tint} flex flex-col items-center justify-center border border-border/60 shadow-sm`}>
                  <step.Icon className="h-7 w-7 mb-1" strokeWidth={1.8} />
                  <span className="text-[10px] font-bold tracking-widest opacity-80">{step.n}</span>
                </div>
              </div>

              <h3 className="text-xl font-semibold text-foreground mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                {step.body}
              </p>

              {/* Arrow between cards (mobile only) */}
              {i < STEPS.length - 1 && (
                <div className="lg:hidden mt-6 -mb-2 text-muted-foreground/40">
                  <ArrowRight className="h-5 w-5 rotate-90" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Subtle workspace callout */}
        <div className="mt-16 sm:mt-20 mx-auto max-w-3xl">
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-soft text-center">
            <p className="text-sm sm:text-base text-foreground">
              <span className="font-semibold">Workspaces keep teams clean.</span>{" "}
              <span className="text-muted-foreground">
                Personal workspace for solo work. Team workspaces with role-based access for the rest.
              </span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WorkflowSection;
