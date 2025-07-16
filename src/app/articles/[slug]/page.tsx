import { ChevronsLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShareButtons } from "@/app/articles/share-button";
import { SubscriptionForm } from "@/app/subscribe/subscription-form";
import { Logo } from "@/components/custom/icons";
import { env } from "@/env";
import { formatDate } from "@/lib/format-date";
import { auth } from "@/server/auth";
import { api } from "@/trpc/server";
import type { Metadata } from "next";

export const dynamic = "force-static";
export const revalidate = 600;

type ArticleProps = {
  params: Promise<{ slug: string }>;
};

function getShareUrl(slug: string) {
  const baseUrl = env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${baseUrl}/articles/${slug}`;
}

export async function generateMetadata({ params }: ArticleProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const newsletter = await api.newsletter.getNewsletterBySlug({ slug });
    if (!newsletter) {
      return {
        title: "نشرة المقالات",
        description: "نشرة المقالات",
      };
    }
    const title = `نشرة المقالات | ${newsletter.subject}`;
    const description = newsletter
      ? `نشرة المقالات - ${newsletter.subject}`
      : `نشرة المقالات | ${env.NEXT_PUBLIC_APP_NAME}`;

    return {
      title,
      description,
      metadataBase: new URL(env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
      openGraph: {
        title,
        description,
        images: [newsletter.image ?? "/newsletter-header.png"],
      },
    };
  } catch (error) {
    console.error("Error generating metadata for test result page =>  ", error);
    return {
      title: "نشرة المقالات",
      description: "نشرة المقالات",
    };
  }
}

export default async function Article({ params }: ArticleProps) {
  const { slug } = await params;
  let newsletter = null;
  try {
    newsletter = await api.newsletter.getNewsletterBySlug({ slug });
  } catch (error) {
    console.error("Failed to fetch newsletter by slug:", error);
    return notFound();
  }
  if (!newsletter) return notFound();

  const session = await auth();
  const user = session?.user;
  const shareUrl = getShareUrl(slug);

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 py-10 px-2">
      <div className="w-full max-w-3xl rounded-xl border border-gray-100 overflow-hidden">
        <Link
          href="/articles"
          className="inline-flex items-center self-start mb-3 gap-2 p-2 rounded-full bg-primary-50 text-primary-700 font-semibold text-xs hover:bg-primary-100 transition-colors border border-primary-200 shadow-sm"
        >
          العودة إلى المقالات
          <ChevronsLeft />
        </Link>
        <div className="w-full h-56 md:h-72 relative">
          <Image
            src={newsletter.image ?? "/newsletter-header.png"}
            alt={newsletter.subject ?? "Newsletter"}
            className="object-cover w-full h-full rounded-lg"
            width={1024}
            height={400}
            blurDataURL={newsletter.blurImage ?? newsletter.image}
            placeholder="blur"
            loading="lazy"
            draggable={false}
          />
        </div>
        <h1 className="text-lg md:text-3xl select-none underline underline-offset-8 decoration-wavy font-bold text-gray-900 my-2 text-center">
          {newsletter.subject ?? "بدون عنوان"}
        </h1>

        <div className="px-6 py-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs inline-flex items-center gap-1.5 select-none font-semibold text-primary-700 bg-primary-50 rounded px-3 py-1">
              <Logo />
              {env.NEXT_PUBLIC_APP_NAME}
            </span>
            <span>{formatDate(newsletter.createdAt.toDateString(), true)}</span>
          </div>

          <div
            className="prose prose-lg prose-slate rtl leading-loose max-w-none text-gray-800"
            dir="rtl"
          >
            <div dangerouslySetInnerHTML={{ __html: newsletter.content ?? "لا يوجد محتوى" }} />
          </div>

          {/* Share Buttons Row */}
          <ShareButtons url={shareUrl} title={newsletter.subject ?? "مقال جديد"} />

          {newsletter.ctaUrl && newsletter.ctaButtonLabel && (
            <div className="text-center mt-8">
              <Link
                href={newsletter.ctaUrl}
                className="inline-block bg-gradient-to-r from-indigo-500 to-cyan-500 text-white px-8 py-3 rounded-full font-semibold shadow-sm hover:scale-105 transition-transform duration-200"
                target="_blank"
                rel="noopener noreferrer"
              >
                {newsletter.ctaButtonLabel}
              </Link>
            </div>
          )}
        </div>

        {/* Subscription Section */}
        {!user && (
          <div className="bg-muted border-t border-gray-300 px-2 py-6 flex flex-col items-center text-center rounded-2xl">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between w-full max-w-2xl mx-auto gap-4">
              <div className="flex-1">
                <div className="flex-shrink-0 mb-4 md:mb-0">
                  <Image
                    src="/logo.png"
                    alt="newsletter"
                    width={64}
                    height={64}
                    className="rounded-full size-16 object-cover mx-auto"
                    draggable={false}
                  />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">اشترك في نشرتنا البريدية!</h2>
                <p className="text-gray-600 text-lg mb-4 text-pretty">
                  لا تفوت جديد المقالات، اشترك الآن لتصلك أفضل المواضيع مباشرة إلى بريدك الإلكتروني.
                </p>
              </div>
            </div>
            <div className="w-full mx-auto">
              <SubscriptionForm className="mx-auto" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
