import { env } from "@/env";

export const baseUrl = env.NEXT_PUBLIC_APP_URL;

export default async function sitemap() {
  const routes = ["/onboarding", "/about", "/contact", "/privacy", "/terms"].map(route => ({
    url: `${baseUrl}${route}`,
  }));

  return [...routes];
}
