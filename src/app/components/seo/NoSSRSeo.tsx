"use client";

import dynamic from "next/dynamic";

export const DefaultSeoNoSSR = dynamic(() => import("next-seo").then(m => m.DefaultSeo), { ssr: false });
export const NextSeoNoSSR = dynamic(() => import("next-seo").then(m => m.NextSeo), { ssr: false });
export const OrganizationJsonLdNoSSR = dynamic(() => import("next-seo").then(m => m.OrganizationJsonLd), { ssr: false });
export const VideoJsonLdNoSSR = dynamic(() => import("next-seo").then(m => m.VideoJsonLd), { ssr: false });


