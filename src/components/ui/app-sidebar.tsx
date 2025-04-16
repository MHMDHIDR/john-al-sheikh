"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import type { AdminNavItems } from "@/types";

export function AppSidebar({ items }: { items: AdminNavItems }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isActive = (url: string) => {
    // If the URL contains a search parameter
    if (url.includes("?")) {
      const [path, query] = url.split("?");
      const urlParams = new URLSearchParams(query);

      // Check if both pathname and search params match
      return pathname === path && urlParams.get("view") === searchParams.get("view");
    }
    // Otherwise just check the pathname
    return pathname === url;
  };

  return (
    <Sidebar>
      <SidebarContent className="select-none">
        {items.navMain.map(item => (
          <SidebarGroup key={item.title}>
            <SidebarGroupLabel>
              {item.icon}
              {item.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {item.items?.map(subItem => (
                  <SidebarMenuItem key={subItem.title}>
                    <SidebarMenuButton asChild isActive={isActive(subItem.url)}>
                      <Link href={subItem.url}>
                        {subItem.icon}
                        {subItem.title}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
