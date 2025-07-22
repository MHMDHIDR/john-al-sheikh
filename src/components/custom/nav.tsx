"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AccountNav from "@/components/custom/accunt-nav";
import { Logo } from "@/components/custom/icons";
import { Button } from "@/components/ui/button";
import { env } from "@/env";
import { api } from "@/trpc/react";
import type { Session } from "next-auth";

export default function Nav({
  user,
  isHidden,
}: {
  user: Session["user"] | undefined;
  isHidden?: boolean;
}) {
  isHidden = isHidden ?? false;
  const pathname = usePathname();
  const { data: session } = useSession();
  const currentUser = session?.user ?? user;
  const { data: minutes } = api.payments.getUserMinutes.useQuery(undefined, {
    enabled: !!session,
  });

  return pathname.includes("/admin") && isHidden ? null : (
    <header className="w-full border-b border-primary/20 shadow-xs sticky top-0 z-40 bg-white/30 dark:bg-black/30 backdrop-blur-md">
      <div className="flex items-center justify-between px-2 md:px-1.5 p-1.5 md:py-2 max-w-(--breakpoint-xl) mx-auto">
        <Link
          href="/"
          className="flex items-center select-none gap-x-2 text-xl font-bold text-primary"
        >
          <Logo className="mx-auto size-7 stroke-1 stroke-current" />
          <span className="max-sm:text-sm sm:inline-flex">{env.NEXT_PUBLIC_APP_NAME}</span>
        </Link>
        <nav className="flex items-center gap-4">
          {user ? (
            <AccountNav user={currentUser!} minutes={minutes ?? 0} />
          ) : (
            <Link href="/signin">
              <Button className="cursor-pointer select-none" variant="default">
                تسجيل الدخول
              </Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
