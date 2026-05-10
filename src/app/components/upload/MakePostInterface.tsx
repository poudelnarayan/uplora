"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  FileText,
  Image as ImageIcon,
  Video,
  Sparkles,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Youtube,
  Settings2,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useTeamPlatforms, type Platform } from "@/hooks/use-team-platforms";

const MotionDiv = motion.div as any;

interface MakePostInterfaceProps {
  selectedTeam?: { name: string } | null;
  selectedTeamId: string | null;
}

// ──────────────────────────────────────────────────────────────────────────
// Platform icon helpers — Lucide for the brands it ships, tiny inline SVGs
// for TikTok / Threads / Pinterest. These render in `text-current` so the
// card can dim them with a single color class.
// ──────────────────────────────────────────────────────────────────────────
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M19.321 5.562a5.124 5.124 0 01-.443-.258 6.228 6.228 0 01-1.137-.966c-.849-.849-1.342-2.019-1.342-3.196h-3.064v13.814c0 1.384-1.117 2.507-2.5 2.507s-2.5-1.123-2.5-2.507c0-1.384 1.117-2.507 2.5-2.507.284 0 .556.048.81.135V9.321c-.254-.052-.516-.08-.785-.08C7.486 9.241 5 11.727 5 14.861c0 3.134 2.486 5.62 5.86 5.62 3.374 0 5.86-2.486 5.86-5.62V8.797c1.26.9 2.799 1.425 4.46 1.425v-3.064c-1.385 0-2.599-.562-3.459-1.476z" />
  </svg>
);

const PinterestIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M12.04 2C6.5 2 3 5.73 3 10.1c0 2.62 1.47 4.9 3.86 5.76.36.13.55.01.64-.26.06-.18.22-.77.3-1.06.1-.26.06-.35-.2-.65-.78-.93-1.27-2.13-1.27-3.42 0-3.3 2.5-6.25 6.5-6.25 3.54 0 5.49 2.16 5.49 5.05 0 3.8-1.68 7.01-4.17 7.01-1.38 0-2.4-1.13-2.07-2.52.39-1.66 1.14-3.45 1.14-4.65 0-1.07-.57-1.96-1.76-1.96-1.39 0-2.5 1.44-2.5 3.37 0 1.23.41 2.06.41 2.06s-1.43 6.06-1.68 7.12c-.5 2.13-.07 4.75-.03 5.01.02.16.23.2.32.08.13-.17 1.8-2.2 2.36-4.25.16-.58.94-3.65.94-3.65.47.9 1.83 1.7 3.28 1.7 4.31 0 7.23-3.93 7.23-9.19C21.9 5.72 18.5 2 12.04 2z" />
  </svg>
);

const ThreadsIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M16.5 12.5a4.5 4.5 0 1 1-3-7.5" />
    <path d="M12 21c-5 0-8-3.6-8-9 0-5.6 3-9 8-9 4 0 6.5 2.2 7.4 5.4" />
    <path d="M12 16.5c-2 0-3.5-1-3.5-2.5s1.3-2.5 3.5-2.5c2 0 3.5 1 3.5 2.5" />
  </svg>
);

type PlatformId = Platform & ("facebook" | "twitter" | "linkedin" | "threads" | "instagram" | "pinterest" | "tiktok" | "youtube");

const PLATFORM_LABEL: Record<PlatformId, string> = {
  facebook: "Facebook",
  twitter: "X",
  linkedin: "LinkedIn",
  threads: "Threads",
  instagram: "Instagram",
  pinterest: "Pinterest",
  tiktok: "TikTok",
  youtube: "YouTube",
};

const PLATFORM_RENDER: Record<PlatformId, ({ className }: { className?: string }) => React.ReactElement> = {
  facebook: (p) => <Facebook {...p} />,
  twitter: (p) => <Twitter {...p} />,
  linkedin: (p) => <Linkedin {...p} />,
  threads: (p) => <ThreadsIcon {...p} />,
  instagram: (p) => <Instagram {...p} />,
  pinterest: (p) => <PinterestIcon {...p} />,
  tiktok: (p) => <TikTokIcon {...p} />,
  youtube: (p) => <Youtube {...p} />,
};

// Which platforms each content type can publish to. Mostly informational
// here — the picker on the inner pages still enforces what's actually
// possible per workspace.
const TYPE_PLATFORMS: Record<string, PlatformId[]> = {
  text:  ["facebook", "twitter", "linkedin", "threads"],
  image: ["instagram", "facebook", "twitter", "linkedin", "threads", "pinterest", "tiktok"],
  reel:  ["instagram", "tiktok", "facebook", "youtube", "threads"],
  video: ["youtube", "facebook"],
};

type ContentType = {
  id: string;
  title: string;
  subtitle: string;
  Icon: LucideIcon;
  route: string;
};

const CONTENT_TYPES: ContentType[] = [
  { id: "text",  title: "Text post",  subtitle: "Quick thoughts and updates",     Icon: FileText,  route: "/make-post/text"  },
  { id: "image", title: "Image post", subtitle: "Photos and visual stories",      Icon: ImageIcon, route: "/make-post/image" },
  { id: "reel",  title: "Short reel", subtitle: "Vertical video for short feeds", Icon: Sparkles,  route: "/make-post/reel"  },
  { id: "video", title: "Video post", subtitle: "Long-form for YouTube",          Icon: Video,     route: "/make-post/video" },
];

export default function MakePostInterface({ selectedTeam }: MakePostInterfaceProps) {
  const router = useRouter();
  const { team, isPersonal, has } = useTeamPlatforms();

  const handle = (route: string) => router.push(route);
  const platformAllowed = (p: PlatformId) => isPersonal || has(p);

  // Owners on a team workspace see a quiet "Manage access" affordance below
  // the cards if any platform is locked. Editors / personal-workspace users
  // get nothing — there's nothing to act on for them at this step.
  const isOwner = !!team && (team.role === "OWNER" || (team as any).isOwner === true);
  const lockedPlatformsAcrossCards = Array.from(
    new Set(
      Object.values(TYPE_PLATFORMS)
        .flat()
        .filter((p) => !platformAllowed(p)),
    ),
  );
  const showManageHint = !isPersonal && lockedPlatformsAcrossCards.length > 0;
  const teamSettingsHref = team ? `/teams?team=${encodeURIComponent(team.id)}` : "/teams";

  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-5 sm:space-y-6">
      {/* Header — minimal: action + destination workspace. */}
      <MotionDiv
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="space-y-1"
      >
        <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
          Create a new post
        </h1>
        <p className="text-sm text-muted-foreground">
          {selectedTeam?.name
            ? <>Posting to <span className="text-foreground font-medium">{selectedTeam.name}</span></>
            : "Pick the kind of post you want to make."}
        </p>
      </MotionDiv>

      {/* Content type cards — dashed border, platform icons under each title.
          Locked platform icons are dimmed to ~25% so the user can see at a
          glance which platforms aren't enabled for this workspace, without
          a separate banner repeating the same information. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {CONTENT_TYPES.map((type, index) => {
          const Icon = type.Icon;
          const platforms = TYPE_PLATFORMS[type.id] || [];
          return (
            <MotionDiv
              key={type.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, delay: 0.04 * index }}
              onClick={() => handle(type.route)}
              role="button"
              tabIndex={0}
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handle(type.route);
                }
              }}
              className={cn(
                "group cursor-pointer select-none rounded-2xl border-2 border-dashed border-border/70 bg-card",
                "px-5 py-7 sm:px-6 sm:py-9 flex flex-col items-center justify-center gap-3",
                "transition-all duration-150 hover:border-primary/50 hover:bg-primary/[0.02] active:scale-[0.99]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              )}
            >
              <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl bg-muted/60 text-muted-foreground flex items-center justify-center transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                <Icon className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={1.6} />
              </div>

              <div className="text-center">
                <h3 className="text-base sm:text-lg font-semibold text-foreground">
                  {type.title}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  {type.subtitle}
                </p>
              </div>

              {/* Platform icon row — dimmed icons = not enabled for this
                  workspace; full-opacity = enabled. No lock badge per icon
                  (keeps the row visually quiet); the workspace-level hint
                  below the grid explains the dimming once. */}
              <div className="flex items-center gap-2 sm:gap-2.5 mt-1">
                {platforms.map((p) => {
                  const Render = PLATFORM_RENDER[p];
                  const allowed = platformAllowed(p);
                  return (
                    <span
                      key={p}
                      title={
                        allowed
                          ? PLATFORM_LABEL[p]
                          : `${PLATFORM_LABEL[p]} — not enabled for this workspace`
                      }
                      className={cn(
                        "inline-flex h-5 w-5 sm:h-[18px] sm:w-[18px] items-center justify-center transition-opacity",
                        allowed
                          ? "text-muted-foreground/80 group-hover:text-foreground/80"
                          : "text-muted-foreground/25",
                      )}
                      aria-hidden
                    >
                      <Render className="h-full w-full" />
                    </span>
                  );
                })}
              </div>
            </MotionDiv>
          );
        })}
      </div>

      {/* Workspace allowlist hint — single line, contextual.
          - Owners get a tappable "Manage access" link to fix it now.
          - Editors get a passive note so they know why icons are faded.
          - Personal workspaces never see this (nothing to lock). */}
      {showManageHint && (
        <div className="flex items-center justify-between gap-3 px-1">
          <p className="text-xs text-muted-foreground">
            Faded icons aren&apos;t enabled for{" "}
            <span className="text-foreground font-medium">{team?.name}</span>.
          </p>
          {isOwner && (
            <Link
              href={teamSettingsHref}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline shrink-0"
            >
              <Settings2 className="h-3.5 w-3.5" />
              Manage access
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
