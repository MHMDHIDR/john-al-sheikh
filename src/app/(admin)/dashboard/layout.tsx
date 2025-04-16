import { IconCategory2 } from "@tabler/icons-react";
import { ChefHatIcon, Home, LineChart, Package, ShoppingCart, Users } from "lucide-react";
import { notFound } from "next/navigation";
import Nav from "@/components/custom/nav";
import { AppSidebar } from "@/components/ui/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { checkRoleAccess } from "@/lib/check-role-access";
import { auth } from "@/server/auth";
import { UserRole } from "@/server/db/schema";
import type { AdminNavItems } from "@/types";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  const user = session?.user;
  const ALLOWED_ROLES = [UserRole.SUPER_ADMIN] as const;

  const adminNavItems: AdminNavItems = {
    navMain: [
      {
        title: "Main",
        url: "#",
        items: [
          {
            title: "Dashboard",
            url: "/dashboard",
            icon: <Home className="w-4 h-4" />,
          },
          {
            title: "Vendors",
            url: "/dashboard/vendors",
            icon: <ChefHatIcon className="w-4 h-4" />,
          },
          {
            title: "Orders",
            url: "/dashboard/orders",
            icon: <ShoppingCart className="w-4 h-4" />,
          },
          {
            title: "Products",
            url: "/dashboard/products",
            icon: <Package className="w-4 h-4" />,
          },
          {
            title: "Categories",
            url: "/dashboard/categories?view=categories",
            icon: <IconCategory2 className="w-4 h-4" />,
          },
          {
            title: "Users",
            url: "/dashboard/users",
            icon: <Users className="w-4 h-4" />,
          },
          {
            title: "Analytics",
            url: "https://analytics.technodevlabs.com/share/E060vsZebCFZhhy7/restaurant-app.technodevlabs.com",
            icon: <LineChart className="w-4 h-4" />,
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
          <SidebarTrigger className="-ml-1" />
        </div>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="grid auto-rows-min gap-4 grid-cols-1">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
