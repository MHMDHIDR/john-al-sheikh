import { env } from "@/env";
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = env.NEXT_PUBLIC_APP_URL;
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/api/og"],
      disallow: ["/admin/", "/dashboard", "/account", "/api/", "/account"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
