/**
 * Single source of truth for every platform Uplora knows about.
 *
 * Today only YouTube is `enabled: true`. The other definitions are kept here
 * so the UI, OAuth routes, and brand metadata for each platform are NOT lost
 * — flip `enabled: true` on any entry to bring it back without re-introducing
 * scattered constants across the codebase.
 *
 * UI surfaces should iterate `enabledPlatforms()` (never the full record) so
 * that disabled platforms stop rendering automatically.
 */

export type PlatformId =
  | "youtube"
  | "instagram"
  | "facebook"
  | "twitter"
  | "linkedin"
  | "tiktok"
  | "pinterest"
  | "threads"
  | "telegram";

export type LucideIconName =
  | "Youtube"
  | "Instagram"
  | "Facebook"
  | "Twitter"
  | "Linkedin"
  | "custom";

export interface PlatformDefinition {
  id: PlatformId;
  displayName: string;
  /** Hex brand color — for marketing/accent use, not the main UI surface. */
  brandColor: string;
  /** Tailwind tint classes for icon background/foreground inside cards. */
  iconBg: string;
  iconFg: string;
  /** lucide-react icon name, or "custom" when rendered via inline SVG. */
  lucideIcon: LucideIconName;
  /** Whether this platform renders in the current product. */
  enabled: boolean;
  /** API routes for the connect/disconnect flow. */
  connectHref: string;
  disconnectHref: string;
  /** Content kinds this platform accepts. */
  supports: {
    video: boolean;
    image: boolean;
    text: boolean;
  };
}

export const PLATFORMS: Record<PlatformId, PlatformDefinition> = {
  youtube: {
    id: "youtube",
    displayName: "YouTube",
    brandColor: "#FF0000",
    iconBg: "bg-red-500/10",
    iconFg: "text-red-600 dark:text-red-400",
    lucideIcon: "Youtube",
    enabled: true,
    connectHref: "/api/youtube/start",
    disconnectHref: "/api/youtube/disconnect",
    supports: { video: true, image: false, text: false },
  },
  instagram: {
    id: "instagram",
    displayName: "Instagram",
    brandColor: "#E4405F",
    iconBg: "bg-pink-500/10",
    iconFg: "text-pink-600 dark:text-pink-400",
    lucideIcon: "Instagram",
    enabled: false,
    connectHref: "/api/instagram/start",
    disconnectHref: "/api/facebook/disconnect",
    supports: { video: true, image: true, text: false },
  },
  facebook: {
    id: "facebook",
    displayName: "Facebook",
    brandColor: "#1877F2",
    iconBg: "bg-blue-500/10",
    iconFg: "text-blue-600 dark:text-blue-400",
    lucideIcon: "Facebook",
    enabled: false,
    connectHref: "/api/facebook/start?intent=facebook",
    disconnectHref: "/api/facebook/disconnect",
    supports: { video: true, image: true, text: true },
  },
  twitter: {
    id: "twitter",
    displayName: "X (Twitter)",
    brandColor: "#000000",
    iconBg: "bg-foreground/5 dark:bg-foreground/10",
    iconFg: "text-foreground",
    lucideIcon: "Twitter",
    enabled: false,
    connectHref: "/api/twitter/connect",
    disconnectHref: "/api/twitter/disconnect",
    supports: { video: true, image: true, text: true },
  },
  linkedin: {
    id: "linkedin",
    displayName: "LinkedIn",
    brandColor: "#0A66C2",
    iconBg: "bg-sky-500/10",
    iconFg: "text-sky-700 dark:text-sky-400",
    lucideIcon: "Linkedin",
    enabled: false,
    connectHref: "/api/linkedin/connect",
    disconnectHref: "/api/linkedin/disconnect",
    supports: { video: true, image: true, text: true },
  },
  tiktok: {
    id: "tiktok",
    displayName: "TikTok",
    brandColor: "#000000",
    iconBg: "bg-foreground/5 dark:bg-foreground/10",
    iconFg: "text-foreground",
    lucideIcon: "custom",
    enabled: false,
    connectHref: "/api/tiktok/auth/connect",
    disconnectHref: "/api/tiktok/disconnect",
    supports: { video: true, image: false, text: false },
  },
  pinterest: {
    id: "pinterest",
    displayName: "Pinterest",
    brandColor: "#E60023",
    iconBg: "bg-rose-500/10",
    iconFg: "text-rose-600 dark:text-rose-400",
    lucideIcon: "custom",
    enabled: false,
    connectHref: "/api/pinterest/auth/connect",
    disconnectHref: "/api/pinterest/disconnect",
    supports: { video: true, image: true, text: false },
  },
  threads: {
    id: "threads",
    displayName: "Threads",
    brandColor: "#000000",
    iconBg: "bg-foreground/5 dark:bg-foreground/10",
    iconFg: "text-foreground",
    lucideIcon: "custom",
    enabled: false,
    connectHref: "/api/threads/auth/connect",
    disconnectHref: "/api/threads/disconnect",
    supports: { video: true, image: true, text: true },
  },
  telegram: {
    id: "telegram",
    displayName: "Telegram",
    brandColor: "#229ED9",
    iconBg: "bg-blue-500/10",
    iconFg: "text-blue-600 dark:text-blue-400",
    lucideIcon: "custom",
    enabled: false,
    connectHref: "/api/telegram/connect",
    disconnectHref: "/api/telegram/disconnect",
    supports: { video: true, image: true, text: true },
  },
};

export function getPlatform(id: PlatformId): PlatformDefinition {
  return PLATFORMS[id];
}

export function enabledPlatforms(): PlatformDefinition[] {
  return Object.values(PLATFORMS).filter((p) => p.enabled);
}

export function isPlatformEnabled(id: PlatformId): boolean {
  return PLATFORMS[id]?.enabled === true;
}

export const ENABLED_PLATFORM_IDS: PlatformId[] = enabledPlatforms().map(
  (p) => p.id,
);
