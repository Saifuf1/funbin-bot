"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    ShoppingBag,
    ShoppingCart,
    Cpu,
    Settings,
    LogOut,
    Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
    { icon: LayoutDashboard, label: "Overview", href: "/" },
    { icon: ShoppingBag, label: "Products", href: "/products" },
    { icon: ShoppingCart, label: "Orders", href: "/orders" },
    { icon: Cpu, label: "AI Control", href: "/ai-control" },
    { icon: Settings, label: "Settings", href: "/settings" },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-white/5 bg-slate-950/50 backdrop-blur-xl">
            <div className="flex h-full flex-col px-4 py-6">
                <div className="mb-10 flex items-center gap-3 px-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 shadow-lg shadow-blue-500/20">
                        <Sparkles className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-white">Fun Bin <span className="text-blue-500">AI</span></span>
                </div>

                <nav className="flex-1 space-y-1">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all hover:bg-white/5",
                                    isActive
                                        ? "bg-blue-600/10 text-blue-500"
                                        : "text-slate-400 hover:text-white"
                                )}
                            >
                                <item.icon className={cn(
                                    "h-5 w-5 transition-colors",
                                    isActive ? "text-blue-500" : "text-slate-500 group-hover:text-white"
                                )} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="mt-auto border-t border-white/5 pt-6">
                    <button className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-400 transition-all hover:bg-red-500/10 hover:text-red-500">
                        <LogOut className="h-5 w-5" />
                        Logout
                    </button>
                </div>
            </div>
        </aside>
    );
}
