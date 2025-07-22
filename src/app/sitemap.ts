import { env } from "@/env";

export const baseUrl = env.NEXT_PUBLIC_APP_URL;

export default async function sitemap() {
  const routes = [
    "onboarding",
    "about",
    "contact",
    "privacy",
    "terms",
    "mock-test",
    "general-english",
    "buy-minutes",
    "subscribe",
    "signin",
    "articles",
  ].map(route => ({
    url: `${baseUrl}/${route}`,
  }));

  return [...routes];
}
