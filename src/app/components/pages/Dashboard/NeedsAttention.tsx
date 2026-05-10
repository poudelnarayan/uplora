"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck, Edit, AlertTriangle } from "lucide-react";

type Item = {
  id: string;
  count: number;
  label: string;
  href: string;
  tone: "amber" | "rose" | "sky";
  Icon: typeof ShieldCheck;
};

type Props = {
  pendingApprovals?: number;
  draftsReady?: number;
  failedPosts?: number;
};

/**
 * "Awaiting your action" surface that only renders when there's something
 * the user must look at. Designed to be the first thing they see after a
 * one-line greeting. Each row is a single tap.
 */
export function NeedsAttention({ pendingApprovals = 0, draftsReady = 0, failedPosts = 0 }: Props) {
  const items: Item[] = [];
  if (pendingApprovals > 0) {
    items.push({
      id: "approvals",
      count: pendingApprovals,
      label: pendingApprovals === 1 ? "post awaiting your approval" : "posts awaiting your approval",
      href: "/approvals",
      tone: "amber",
      Icon: ShieldCheck,
    });
  }
  if (draftsReady > 0) {
    items.push({
      id: "drafts",
      count: draftsReady,
      label: draftsReady === 1 ? "draft ready to publish" : "drafts ready to publish",
      href: "/posts/all?status=DRAFT",
      tone: "sky",
      Icon: Edit,
    });
  }
  if (failedPosts > 0) {
    items.push({
      id: "failed",
      count: failedPosts,
      label: failedPosts === 1 ? "failed post needs attention" : "failed posts need attention",
      href: "/posts/all?status=PROCESSING",
      tone: "rose",
      Icon: AlertTriangle,
    });
  }
  if (items.length === 0) return null;

  return (
    <section
      aria-label="Awaiting your action"
      className="rounded-xl border border-border/60 bg-card overflow-hidden"
    >
      <div className="px-3 sm:px-4 py-2 border-b border-border/60 bg-muted/30 flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Awaiting your action
        </span>
      </div>
      <ul className="divide-y divide-border/60">
        {items.map(({ id, count, label, href, tone, Icon }) => (
          <li key={id}>
            <Link
              href={href}
              className="flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-muted/30 transition-colors group"
            >
              <span
                className={
                  tone === "amber" ? "h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0" :
                  tone === "rose"  ? "h-8 w-8 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0" :
                                     "h-8 w-8 rounded-lg bg-sky-500/10 text-sky-600 flex items-center justify-center shrink-0"
                }
              >
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-foreground">
                  <span className="font-bold tabular-nums">{count}</span>{" "}
                  <span className="text-muted-foreground">{label}</span>
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground/60 group-hover:text-foreground transition-colors shrink-0" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
