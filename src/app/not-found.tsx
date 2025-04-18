import { IconHome } from "@tabler/icons-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { env } from "@/env";
import { NotFoundIcon } from "../components/custom/icons";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `لم يتم العثور على الصفحة | ${env.NEXT_PUBLIC_APP_NAME}`,
  description: env.NEXT_PUBLIC_APP_DESCRIPTION,
};

export const dynamic = "force-static";

export default function RootNotFound() {
  return (
    <section className="h-screen flex items-center">
      <div className="container w-full px-6 mx-auto">
        <div className="flex flex-col items-center max-w-lg mx-auto text-center">
          <NotFoundIcon />

          <h1 className="mt-3 text-2xl font-semibold text-gray-800 dark:text-white md:text-3xl">
            الصفحة غير موجودة
          </h1>
          <p className="mt-4 text-gray-500 dark:text-gray-400">
            الصفحة التي تبحث عنها غير موجودة أو تم نقلها.
          </p>

          <div className="flex items-center w-full mt-6 shrink-0 gap-x-3 sm:w-auto">
            <Link href="/" className="w-full">
              <Button type="button" variant={"pressable"} className="cursor-pointer">
                <IconHome className="w-5 h-5 stroke-2" />
                الرجوع إلى الرئيسية
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
