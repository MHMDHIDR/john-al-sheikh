"use client";

import {
  IconClock,
  IconCreditCard,
  IconHome,
  IconMenu3,
  IconPackage,
  IconPhoneCalling,
  IconSettings,
  IconSpeakerphone,
  IconUser,
} from "@tabler/icons-react";
import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useGlobalVapiConversation } from "@/app/providers/vapi-conversation-provider";
import { SignoutButton } from "@/components/custom/signout-button";
import TestActionWrapper from "@/components/custom/test-action-wrapper";
import { AvatarFallback, AvatarImage, Avatar as AvatarWrapper } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import { useCountUp } from "@/hooks/use-count-up";
import { CallStatus } from "@/hooks/use-vapi-conversation";
import { checkRoleAccess } from "@/lib/check-role-access";
import { MINUTES_IN_MS } from "@/lib/constants";
import { fallbackUsername, truncateUsername } from "@/lib/fallback-username";
import { minutesLabel } from "@/lib/minutes-label";
import { cn } from "@/lib/utils";
import { UserRole } from "@/server/db/schema";
import { api } from "@/trpc/react";
import type { LucideIcon } from "lucide-react";
import type { Session } from "next-auth";

type NavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
  testType?: "general-english" | "mock-test";
};

export default function AccountNav({ user }: { user: Session["user"] }) {
  const { callStatus } = useGlobalVapiConversation();
  const isCallActive = callStatus === CallStatus.ACTIVE;
  const { data: minutes, isLoading } = api.payments.getUserMinutes.useQuery(undefined, {
    refetchInterval: isCallActive ? 5000 : MINUTES_IN_MS * 2,
    refetchOnWindowFocus: isCallActive,
  });

  // Use count-up animation when we have actual minutes data and it's > 0
  const shouldAnimate = !isLoading && minutes !== undefined && minutes > 0;
  const displayMinutes = useCountUp(shouldAnimate ? minutes : 0, 2000);
  const actualDisplayMinutes = shouldAnimate ? displayMinutes : (minutes ?? 0);

  // Color logic: red if loading, or if minutes is 0, otherwise green
  const isRedBadge = isLoading || (minutes !== undefined && minutes === 0);

  const NAV_ITEMS: NavItem[] = [
    { href: "/", icon: IconHome, label: "الرئيسية" },
    { href: "/account", icon: IconUser, label: "الحساب" },
    { href: "/dashboard", icon: IconPackage, label: "لوحة التحكم" },
    {
      href: "/mock-test",
      icon: IconSpeakerphone,
      label: "اختبار المحادثة",
      testType: "mock-test",
    },
    {
      href: "/general-english",
      icon: IconPhoneCalling,
      label: "محادثة عامة بالإنجليزي",
      testType: "general-english",
    },
    { href: "/buy-minutes", icon: IconCreditCard, label: "شراء رصيد دقائق" },
    // Show admin management link if user is SUPER_ADMIN or ADMIN
    checkRoleAccess(user.role, [UserRole.SUPER_ADMIN, UserRole.ADMIN])
      ? { href: "/admin", icon: IconSettings, label: "الإدارة" }
      : null,
  ].filter(Boolean) as NavItem[];

  return (
    <div className="flex gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Badge
            className={`text-xs flex items-center gap-x-1 font-semibold py-0 rounded-full text-background select-none cursor-pointer transition-all duration-300 ${
              isRedBadge ? "hover:bg-red-600" : "hover:bg-green-600"
            }`}
            variant={isRedBadge ? "destructive" : "success"}
          >
            <strong className="hidden md:inline-flex">رصيد الدقائق: </strong>
            <IconClock size={14} />
            {actualDisplayMinutes} {minutesLabel({ credits: actualDisplayMinutes })}
          </Badge>
        </PopoverTrigger>
        <PopoverContent className="w-fit py-2 px-1 mx-auto text-sm" side="bottom" align="center">
          <div className="flex items-center gap-x-1">
            <IconClock size={16} className="text-green-600" />
            <span>
              لديك {actualDisplayMinutes} {minutesLabel({ credits: actualDisplayMinutes })} متوفرة
              حالياً
            </span>
          </div>
          <Link href="/buy-minutes" className="w-full inline-flex justify-center">
            <span className="text-2xs text-blue-600 hover:underline hover:text-blue-600/80 underline-offset-6 hover:decoration-wavy">
              انقر للحصول على المزيد من الدقائق
            </span>
          </Link>
        </PopoverContent>
      </Popover>
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            className="inline-flex cursor-pointer justify-between hover:bg-transparent"
          >
            <IconMenu3 size={20} />
          </Button>
        </SheetTrigger>
        <SheetContent side={"right"} className="flex flex-col">
          <SheetHeader className="flex-col flex-1 gap-2">
            <div className="flex items-center gap-x-2">
              <SheetTitle>
                <Avatar user={user} />
              </SheetTitle>
              <SheetDescription className="font-semibold truncate select-none">
                <span className="hidden md:inline-flex mx-1">مرحبا،</span>
                {truncateUsername(user.name, 2, 20)}
              </SheetDescription>
            </div>

            <div className="flex flex-col gap-y-1.5">
              {NAV_ITEMS.map((item, index) => {
                if (!item) return null;
                const Icon = item.icon;
                return (
                  <NavLink key={item.href + index} href={item.href} testType={item.testType}>
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </SheetHeader>

          <SheetFooter className="rtl:self-start">
            <SheetClose asChild>
              <SignoutButton />
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="inline-flex cursor-pointer justify-between hover:bg-transparent"
          >
            <span className="pl-2 pr-1 select-none hidden md:inline-flex">
              {truncateUsername(user.name)}
            </span>
            <Avatar user={user} className="rounded-full size-8" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="max-sm:ml-1 rtl">
          <DropdownMenuItem asChild>
            <Link href="/account" className="flex items-center gap-2">
              <IconUser size={16} />
              <span>الحساب</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/dashboard" className="flex items-center gap-2">
              <IconPackage size={16} />
              <span>لوحة التحكم</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <SignoutButton />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
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
        <AvatarFallback className="text-blue-600 rounded-lg">
          {fallbackUsername(user.name) ?? "User"}
        </AvatarFallback>
      )}
    </AvatarWrapper>
  );
}

function NavLink({
  href,
  children,
  testType,
}: {
  href: string;
  children: React.ReactNode;
  testType?: "general-english" | "mock-test";
}) {
  const pathname = usePathname();

  const linkContent = (
    <div
      className={clsx(
        "inline-flex items-center gap-x-2 w-full select-none rounded-sm border text-blue-400 p-2 transition-colors hover:bg-blue-200/50 dark:hover:bg-blue-900/70 outline-blue-300",
        {
          "text-blue-500 border-blue-600 bg-blue-50 dark:bg-blue-900/50": pathname === href,
          "text-red-500 border-red-600 bg-red-50 ": pathname === href && href === "/admin",
          "text-red-400 hover:bg-red-200/50 dark:hover:bg-red-900/50 outline-red-300":
            href === "/admin",
        },
      )}
    >
      {children}
    </div>
  );

  // If it's a test type, use TestActionWrapper
  if (testType) {
    return (
      <SheetClose asChild>
        <TestActionWrapper testType={testType}>{linkContent}</TestActionWrapper>
      </SheetClose>
    );
  }

  // Otherwise, use regular Link
  return (
    <SheetClose asChild>
      <Link href={href}>{linkContent}</Link>
    </SheetClose>
  );
}
