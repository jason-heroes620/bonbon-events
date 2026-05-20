import ApplicationLogo from "@/components/ApplicationLogo";
import Dropdown from "@/components/Dropdown";
import ResponsiveNavLink from "@/components/ResponsiveNavLink";
import { Link, usePage } from "@inertiajs/react";
import { useState, type ReactNode } from "react";
import type { User } from "@/types";
import {
    SidebarProvider,
    SidebarTrigger,
    SidebarInset,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Toaster } from "sonner";

const AuthenticatedLayout = ({
    header,
    children,
}: {
    header: ReactNode;
    children: ReactNode;
}) => {
    return (
        <SidebarProvider className="sidebar-accent-brand">
            <AppSidebar />
            <Toaster />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white">
                    <SidebarTrigger className="-ml-1" />
                    {/* <Separator orientation="vertical" className="mr-2 h-4" /> */}
                    {/* We can add breadcrumbs here later */}
                </header>
                <div className="flex flex-1 flex-col gap-4 p-4 pt-0 mt-4">
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
};

export default AuthenticatedLayout;
