import { IconHome } from "@tabler/icons-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { auth } from "@/server/auth";
import { NotFoundIcon } from "../components/custom/icons";

export default async function RootNotFound() {
  const session = await auth();
  const userRole = session?.user.role;

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
            {userRole === "SUPER_ADMIN" && (
              <Link href="/dashboard" className="w-full">
                <Button type="button" variant={"pressable"} className="cursor-pointer">
                  لوحة التحكم
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
