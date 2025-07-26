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
    // Optionally, you can return a fallback UI here
    // return <div>No newsletters available at this time.</div>;
  }

  return (
    <div className="container mx-auto py-8 select-none">
      <h1 className="text-3xl leading-10 m-0 font-bold mb-8 text-center">
        نشرة {env.NEXT_PUBLIC_APP_NAME}
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {newsletters.length === 0 ? (
          <div className="col-span-2 text-center text-gray-500">لا يوجد نشرات متاحة حالياً.</div>
        ) : (
          newsletters.map((item: NewsletterType) => (
            <Link
              key={item.id}
              href={`/articles/${createSlug(item.subject)}`}
              className="flex flex-row-reverse items-center hover:bg-muted/20 rounded-2xl duration-200 border border-gray-100 overflow-hidden group h-full"
            >
              <div className="flex-1 p-2 pr-4 flex flex-col justify-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-1 group-hover:text-primary-700 transition-colors truncate">
                  {truncate(item.subject, 33) ?? "بدون عنوان"}
                </h2>
                <p className="text-gray-600 text-base mb-2 line-clamp-2">
                  {item.content?.replace(/<[^>]+>/g, "").slice(0, 120) ?? "لا يوجد محتوى"}
                </p>
                <div className="flex items-center gap-2 mt-2 text-sm text-gray-400">
                  <span>{formatDate(item.createdAt.toDateString(), true)}</span>
                </div>
              </div>
              <div className="flex-shrink-0 size-30 m-2 rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                <Image
                  src={item.image ?? "/newsletter-header.png"}
                  alt={item.subject ?? "Newsletter"}
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-200"
                  width={120}
                  height={120}
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
