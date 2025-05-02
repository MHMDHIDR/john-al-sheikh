"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AccountNav from "@/components/custom/accunt-nav";
import { Logo } from "@/components/custom/icons";
import { Button } from "@/components/ui/button";
import { env } from "@/env";
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

  return pathname.includes("/admin") && isHidden ? null : (
    <header className="w-full border-b border-primary/20 shadow-xs sticky top-0 z-40 bg-white/30 dark:bg-black/30 backdrop-blur-md">
      <div className="flex items-center justify-between px-2 md:px-1.5 p-1.5 md:py-2 max-w-(--breakpoint-xl) mx-auto">
        <Link href="/" className="flex select-none gap-x-2 text-xl font-bold text-primary">
          <Logo className="mx-auto h-7 w-7 stroke-1 stroke-current" />
          <span className="hidden sm:inline-flex">{env.NEXT_PUBLIC_APP_NAME}</span>
        </Link>
        <nav className="flex items-center gap-4">
          {user ? (
            <AccountNav user={currentUser!} />
          ) : (
            <Link href="/signin">
              <Button className="cursor-pointer" variant="default">
                تسجيل الدخول
              </Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
