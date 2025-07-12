import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { env } from "@/env";
import { checkRoleAccess } from "@/lib/check-role-access";
import { formatDate } from "@/lib/format-date";
import { auth } from "@/server/auth";
import { UserRole } from "@/server/db/schema";
import { api } from "@/trpc/server";
import { PrivacyContent } from "./privacy-editor";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `سياسة الخصوصية | ${env.NEXT_PUBLIC_APP_NAME}`,
  description: env.NEXT_PUBLIC_APP_DESCRIPTION,
};

export const revalidate = 86400; // 24 hours

export default async function PrivacyPage() {
  const content = await api.pageContent.getLatestContent("PRIVACY");
  if (!content) notFound();

  const session = await auth();
  const isAdmin = session?.user
    ? checkRoleAccess(session.user.role, [UserRole.SUPER_ADMIN, UserRole.ADMIN])
    : false;

  return (
    <div className="container mx-auto px-4 py-8 text-right max-w-[800px]" dir="rtl">
      <Link
        href="/"
        className="flex items-center justify-start gap-2 text-lg hover:underline underline-offset-6"
      >
        <ArrowRight />
        العودة للرئيسية
      </Link>

      <h1 className="text-center text-2xl font-bold my-6">سياسة الخصوصية</h1>

      <p className="mb-4" data-page-content-intro>
        آخر تحديث: {formatDate(content.updatedAt.toDateString(), true)}
      </p>

      <PrivacyContent content={content.content} isAdmin={isAdmin} />
    </div>
  );
}
