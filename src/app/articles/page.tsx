import Image from "next/image";
import Link from "next/link";
import { generateMetadata } from "@/components/custom/seo";
import { env } from "@/env";
import { createSlug } from "@/lib/create-slug";
import { formatDate } from "@/lib/format-date";
import { truncate } from "@/lib/truncate";
import { api } from "@/trpc/server";

type NewsletterType = Awaited<ReturnType<typeof api.newsletter.getAllNewsletters>>[number];

export const dynamic = "force-static";
export const revalidate = 600;
export const metadata = generateMetadata({ title: `نشرة المقالات` });

export default async function Articles() {
  let newsletters: NewsletterType[] = [];
  try {
    newsletters = await api.newsletter.getAllNewsletters();
  } catch (error) {
    console.error("Failed to fetch newsletters:", error);
  }

  return (
    <div className="container mx-auto py-8 select-none">
      <h1 className="text-3xl leading-10 m-0 font-bold mb-8 text-center">
        نشرة {env.NEXT_PUBLIC_APP_NAME}
      </h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {newsletters.length === 0 ? (
          <div className="col-span-2 text-center text-gray-500">لا يوجد نشرات متاحة حالياً.</div>
        ) : (
          newsletters.map((item: NewsletterType) => (
            <Link
              key={item.id}
              href={`/articles/${createSlug(item.subject)}`}
              className="flex flex-row-reverse items-stretch w-full max-w-full hover:bg-muted/20 rounded-2xl duration-200 border border-gray-100 overflow-hidden group min-h-[140px] h-[140px]"
            >
              <div className="flex-1 min-w-0 p-3 pr-4 flex flex-col justify-between">
                <div className="flex-1">
                  <h2 className="text-sm sm:text-base lg:text-lg xl:text-xl font-bold text-gray-900 mb-2 group-hover:text-primary-700 transition-colors line-clamp-2 leading-tight">
                    {item.subject ?? "بدون عنوان"}
                  </h2>
                  <p className="text-gray-600 text-xs sm:text-sm lg:text-base mb-2 line-clamp-2 leading-relaxed">
                    {item.content?.replace(/<[^>]+>/g, "").slice(0, 100) ?? "لا يوجد محتوى"}...
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-400 mt-auto">
                  <span>{formatDate(item.createdAt.toDateString(), true)}</span>
                </div>
              </div>
              <div className="flex-shrink-0 w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 m-2 rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                <Image
                  src={item.image ?? "/newsletter-header.png"}
                  alt={item.subject ?? "Newsletter"}
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-200"
                  width={128}
                  height={128}
                  blurDataURL={item.blurImage ?? item.image}
                  placeholder="blur"
                  loading="lazy"
                />
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
