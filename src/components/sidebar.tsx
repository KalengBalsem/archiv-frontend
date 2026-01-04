  "use client";

  import * as React from "react";
  import { useState, useEffect } from "react";
  import Link from "next/link";
  import { usePathname, useRouter } from "next/navigation";

  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu";
  import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
  } from "@/components/ui/sidebar";

  import { UserAvatarProfile } from "@/components/user-avatar-profile";
  import { Icons } from "@/components/icons";
  import { supabaseClient } from "@/utils/supabaseClient";

  import {
    IconBell,
    IconChevronRight,
    IconChevronsDown,
    IconCreditCard,
    IconLogout,
    IconUserCircle,
  } from "@tabler/icons-react";

  import { useUserData } from "@/hooks/use-user-data";

  const navItems = [
    // {
    //   title: "Home",
    //   url: "/",
    //   icon: "logo",
    // },
    {
      title: "Projects",
      url: "/projects",
      icon: "kanban",
    },
    {
      title: "Upload",
      url: "/upload",
      icon: "add",
    },
    {
      title: "About",
      url: "/about",
      icon: "info-circle",
    },
  ];

  export default function AppSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { user, loading } = useUserData();

    // Controlled state untuk collapsible
    const [openItem, setOpenItem] = useState<string | null>(null);

    const handleLogout = async () => {
      await supabaseClient.auth.signOut();
      router.push("/login");
    };

    return (
      <Sidebar collapsible="icon">
        <SidebarHeader className="group-data-[state=collapsed]:items-center">
          {/* This is your full logo.
            It's visible by default and HIDES when the sidebar is collapsed.
          */}
          <span className="font-semibold text-xl ml-2 mt-2 group-data-[state=collapsed]:hidden">
            ARCHIV
          </span>

          {/* This is your minimized icon.
            It's HIDDEN by default and SHOWS when the sidebar is collapsed.
          */}
          <span className="hidden group-data-[state=collapsed]:block">
          </span>
        </SidebarHeader>

        <SidebarContent className="overflow-x-hidden">
          <SidebarGroup>
            {/* <SidebarGroupLabel>Overview</SidebarGroupLabel> */}
            <SidebarMenu>
              {navItems.map((item) => {
                const Icon = item.icon ? Icons[item.icon as keyof typeof Icons] : Icons.logo;
                const isParentActive =
                  pathname === item.url;

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title} isActive={isParentActive}>
                      <Link href={item.url} className="flex items-center gap-2">
                        {Icon && <Icon />}
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )})}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    {user ? (
                      <UserAvatarProfile
                        className="h-8 w-8 rounded-lg"
                        showInfo
                        user={user}
                      />
                    ) : (
                      <div className="h-8 w-8 bg-gray-300 rounded-lg animate-pulse" />
                    )}
                    <IconChevronsDown className="ml-auto size-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>

                <DropdownMenuContent side="bottom" align="end" sideOffset={4}>
                  <DropdownMenuLabel className="p-0 font-normal">
                    <div className="px-1 py-1.5">
                      {user ? (
                        <UserAvatarProfile
                          className="h-8 w-8 rounded-lg"
                          showInfo
                          user={user}
                        />
                      ) : (
                        <div className="h-8 w-8 bg-gray-300 rounded-lg animate-pulse" />
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => router.push("/profile")}>
                      <IconUserCircle className="mr-2 h-4 w-4" />
                      Profile
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <IconLogout className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
    );
  }
