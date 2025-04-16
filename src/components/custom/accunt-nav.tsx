"use client";

import { IconHome, IconPackage, IconSettings, IconUser } from "@tabler/icons-react";
import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignoutButton } from "@/components/custom/signout-button";
import { AvatarFallback, AvatarImage, Avatar as AvatarWrapper } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { checkRoleAccess } from "@/lib/check-role-access";
import { fallbackUsername, truncateUsername } from "@/lib/fallback-username";
import { cn } from "@/lib/utils";
import { UserRole } from "@/server/db/schema";
import type { Session } from "next-auth";

export default function AccountNav({ user }: { user: Session["user"] }) {
  const NAV_ITEMS = [
    { href: "/", icon: IconHome, label: "الرئيسية" },
    { href: "/account", icon: IconUser, label: "الحساب" },
    user.role === UserRole.USER && {
      href: "/dashboard",
      icon: IconSettings,
      label: "لوحة التحكم",
    },
    // Show admin management link if user is SUPER_ADMIN or ADMIN
    checkRoleAccess(user.role, [UserRole.SUPER_ADMIN, UserRole.ADMIN])
      ? {
          href: "/admin",
          icon: IconPackage,
          label: "الإدارة",
        }
      : null,
  ].filter(Boolean);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="inline-flex cursor-pointer justify-between px-0 shadow"
        >
          <Avatar user={user} className="rounded-sm rounded-r-none size-8" />
          <span className="px-2">{truncateUsername(user.name)}</span>
        </Button>
      </SheetTrigger>
      <SheetContent side={"right"} className="flex flex-col bg-white">
        <SheetHeader className="flex-col flex-1 gap-2">
          <div className="flex items-center gap-x-2">
            <SheetTitle>
              <Avatar user={user} />
            </SheetTitle>
            <SheetDescription className="font-semibold truncate select-none">
              <span className="hidden md:inline-flex mr-1">مرحبا، </span>
              {truncateUsername(user.name, 2, 20)}
            </SheetDescription>
          </div>

          <div className="flex flex-col gap-y-1.5">
            {NAV_ITEMS.map(item => {
              if (!item) return null;
              const Icon = item.icon;
              return (
                <NavLink key={item.href} href={item.href}>
                  <Icon size={20} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </SheetHeader>

        <SheetFooter className="self-stretch md:self-start">
          <SheetClose asChild>
            <SignoutButton />
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function Avatar({ user, className }: { user: Session["user"]; className?: string }) {
  return (
    <AvatarWrapper className={cn("h-8 w-8 select-none rounded-full shadow-sm", className)}>
      {user.image ? (
        <AvatarImage
          src={user.image}
          alt={fallbackUsername(user.name) ?? "Restaurant App User"}
          blurDataURL={user.blurImageDataURL ?? "/logo.svg"}
          className="object-contain"
        />
      ) : (
        <AvatarFallback className="text-orange-600 rounded-lg">
          {fallbackUsername(user.name) ?? "User"}
        </AvatarFallback>
      )}
    </AvatarWrapper>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <SheetClose asChild>
      <Link
        href={href}
        className={clsx(
          "inline-flex items-center gap-x-2 w-full select-none rounded-sm border text-orange-400 p-2 transition-colors hover:bg-orange-200/50 dark:hover:bg-orange-900/50 outline-orange-300",
          {
            "text-orange-500 border-orange-500": pathname === href,
          },
        )}
      >
        {children}
      </Link>
    </SheetClose>
  );
}
