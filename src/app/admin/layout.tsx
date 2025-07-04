import {
  CircleUser,
  CreditCard,
  Home,
  MailIcon,
  ShieldUser,
  UserPen,
  UserPlus,
} from "lucide-react";
import { notFound } from "next/navigation";
import Nav from "@/components/custom/nav";
import { AppSidebar } from "@/components/ui/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { checkRoleAccess } from "@/lib/check-role-access";
import { auth } from "@/server/auth";
import { UserRole } from "@/server/db/schema";
import type { AdminNavItems } from "@/app/types";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  const user = session?.user;
  const ALLOWED_ROLES = [UserRole.SUPER_ADMIN, UserRole.ADMIN] as const;

  const adminNavItems: AdminNavItems = {
    navMain: [
      {
        title: "الرئيسية",
        url: "#",
        items: [
          {
            title: "لوحة الإدارة",
            url: "/admin",
            icon: <Home className="size-4" />,
          },
          {
            title: "المستخدمون المميزون",
            url: "/admin/premium-users",
            icon: <ShieldUser className="size-4" />,
          },
          {
            title: "المستخدمين",
            url: "/admin/users",
            icon: <CircleUser className="size-4" />,
          },
          {
            title: "الممتحنين",
            url: "/admin/test-users",
            icon: <UserPen className="size-5" />,
          },
          {
            title: "المشتركين",
            url: "/admin/subscribers",
            icon: <UserPlus className="size-4" />,
          },
          {
            title: "المدفوعات",
            url: "/admin/payments",
            icon: <CreditCard className="size-4" />,
          },
          {
            title: "النشرة البريدية",
            url: "/admin/news-letter/compose",
            icon: <MailIcon className="size-4" />,
          },
        ],
      },
    ],
  };

  return !checkRoleAccess(user?.role, ALLOWED_ROLES) ? (
    notFound()
  ) : (
    <SidebarProvider>
      <AppSidebar items={adminNavItems} />
      <SidebarInset>
        <Nav user={user} />
        <div className="border-b px-4 py-0">
          <SidebarTrigger className="-mr-1" />
        </div>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="grid auto-rows-min gap-4 grid-cols-1">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
