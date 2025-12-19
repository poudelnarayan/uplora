import type { DefaultSeoProps } from "next-seo";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

const defaultSeo: DefaultSeoProps = {
  defaultTitle: "Uplora — Team YouTube Workflow",
  titleTemplate: "%s | Uplora",
  description:
    "Uplora streamlines team uploads and approvals for YouTube. Editors upload, owners approve, and videos go to YouTube—no manual downloading.",
  canonical: siteUrl,
  openGraph: {
    url: siteUrl,
    type: "website",
    siteName: "Uplora",
  },
  twitter: {
    cardType: "summary_large_image",
  },
  additionalMetaTags: [],
  additionalLinkTags: [
    { rel: "icon", href: "/favicon.ico" },
  ],
  robotsProps: {
    noarchive: false,
    maxSnippet: -1,
    maxImagePreview: "large",
    maxVideoPreview: -1,
  },
};

export default defaultSeo;


