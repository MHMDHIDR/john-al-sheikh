import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { env } from "@/env";
import { checkRoleAccess } from "@/lib/check-role-access";
import { auth } from "@/server/auth";
import { UserRole } from "@/server/db/schema";
import { api } from "@/trpc/server";
import { TermsContent } from "./terms-editor";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `شروط الإستخدام | ${env.NEXT_PUBLIC_APP_NAME}`,
  description: env.NEXT_PUBLIC_APP_DESCRIPTION,
};

export const revalidate = 86400; // 24 hours

export default async function TermsPage() {
  const content = await api.pageContent.getLatestContent("TERMS");
  if (!content) notFound();

  const session = await auth();
  const isAdmin = session?.user
    ? checkRoleAccess(session.user.role, [UserRole.SUPER_ADMIN, UserRole.ADMIN])
    : false;

  const LAST_UPDATED_DATE_OPTIONS = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  } as Intl.DateTimeFormatOptions;

  return (
    <div className="container mx-auto px-4 py-8 mb-20 max-w-[800px]" dir="rtl">
      <Link
        href="/"
        className="flex items-center justify-start gap-2 text-lg hover:underline underline-offset-6"
      >
        <ArrowRight />
        العودة للرئيسية
      </Link>

      <h1 className="text-center text-2xl font-bold my-6">الشروط والأحكام</h1>

      <p className="mb-4" data-page-content-intro>
        آخر تحديث:{" "}
        {new Date(content.updatedAt).toLocaleDateString("ar-SA", LAST_UPDATED_DATE_OPTIONS)}
      </p>

      <p className="mb-2" data-page-content-intro>
        مرحبًا بك في <strong>{env.NEXT_PUBLIC_APP_NAME}</strong>! باستخدام خدمتنا، فإنك توافق على
        هذه الشروط والأحكام. يرجى قراءتها بعناية.
      </p>

      <TermsContent content={content.content} isAdmin={isAdmin} />
    </div>
  );
}
