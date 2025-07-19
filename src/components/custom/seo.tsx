import { type Metadata } from "next";
import { env } from "@/env";

interface PageSEOProps {
  title: string;
  description?: string;
  image?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export function generateMetadata({ title, description, image, ...rest }: PageSEOProps): Metadata {
  return {
    title,
    description: description ?? env.NEXT_PUBLIC_APP_DESCRIPTION,
    openGraph: {
      title: `${title} | ${env.NEXT_PUBLIC_APP_NAME}`,
      description: description ?? env.NEXT_PUBLIC_APP_DESCRIPTION,
      url: "./",
      siteName: env.NEXT_PUBLIC_APP_NAME,
      images: image ? [image] : [env.NEXT_PUBLIC_APP_SOCIAL_BANNER],
      locale: "ar_EG",
      type: "website",
    },
    twitter: {
      title: `${title} | ${env.NEXT_PUBLIC_APP_NAME}`,
      card: "summary_large_image",
      images: image ? [image] : [env.NEXT_PUBLIC_APP_SOCIAL_BANNER],
    },
    ...rest,
  };
}
