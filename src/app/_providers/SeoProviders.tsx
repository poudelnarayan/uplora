"use client";

import React from "react";
import { DefaultSeoNoSSR, OrganizationJsonLdNoSSR } from "@/components/seo/NoSSRSeo";
import defaultSeo from "@/seo.config";

export function SeoProviders({ children, siteUrl }: { children: React.ReactNode; siteUrl: string }) {
  return (
    <>
      <DefaultSeoNoSSR {...defaultSeo} />
      <OrganizationJsonLdNoSSR
        type="Organization"
        id={`${siteUrl}/#organization`}
        name="Uplora"
        url={siteUrl}
        sameAs={[]}
      />
      {children}
    </>
  );
}


