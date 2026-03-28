import React from "react";
import { Sidebar } from "./Sidebar";

interface DashboardShellProps {
    children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
    return (
        <div className="flex min-h-screen bg-slate-950">
            <Sidebar />
            <main className="flex-1 pl-64 transition-all duration-300">
                <div className="mx-auto max-w-7xl px-8 py-10">
                    {children}
                </div>
            </main>
        </div>
    );
}
