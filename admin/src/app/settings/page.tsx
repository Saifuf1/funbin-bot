"use client";

import React from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { motion } from "framer-motion";
import {
    Building2,
    Mail,
    Globe,
    Webhook,
    ShieldCheck,
    Bell,
    Save,
    ChevronRight
} from "lucide-react";

export default function SettingsPage() {
    return (
        <DashboardShell>
            <div className="space-y-10">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">Business <span className="text-gradient decoration-4 italic">Settings</span></h1>
                    <p className="mt-1 text-slate-400">Configure your brand identity and system integrations.</p>
                </div>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                    {/* Navigation Tabs (Vertical for Desktop) */}
                    <div className="lg:col-span-1 space-y-2">
                        {[
                            { label: "Profile", icon: Building2, active: true },
                            { label: "Notifications", icon: Bell, active: false },
                            { label: "Webhooks", icon: Webhook, active: false },
                            { label: "Security", icon: ShieldCheck, active: false },
                        ].map((tab) => (
                            <button
                                key={tab.label}
                                className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all ${tab.active ? "bg-white/10 text-white border border-white/5 shadow-lg shadow-black/20" : "text-slate-500 hover:text-white"
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <tab.icon className="h-4 w-4" />
                                    {tab.label}
                                </div>
                                {tab.active && <ChevronRight className="h-4 w-4" />}
                            </button>
                        ))}
                    </div>

                    {/* Settings Content */}
                    <div className="lg:col-span-2 space-y-8">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass-card rounded-2xl p-8"
                        >
                            <h2 className="text-xl font-bold text-white mb-6">Business Profile</h2>
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Business Name</label>
                                    <input type="text" defaultValue="Fun Bin" className="w-full rounded-xl bg-slate-950/50 p-3 text-sm text-white border border-white/5 focus:ring-1 focus:ring-blue-500 outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Brand Email</label>
                                    <input type="email" defaultValue="hello@funbin.shop" className="w-full rounded-xl bg-slate-950/50 p-3 text-sm text-white border border-white/5 focus:ring-1 focus:ring-blue-500 outline-none" />
                                </div>
                                <div className="space-y-2 sm:col-span-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Website URL</label>
                                    <div className="relative group">
                                        <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                                        <input type="url" defaultValue="https://funbin.shop" className="w-full rounded-xl bg-slate-950/50 pl-10 pr-3 py-3 text-sm text-white border border-white/5 focus:ring-1 focus:ring-blue-500 outline-none" />
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="glass-card rounded-2xl p-8"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-white">Webhook Configuration</h2>
                                    <p className="text-sm text-slate-400">Manage real-time event delivery.</p>
                                </div>
                                <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Active</span>
                            </div>
                            <div className="space-y-4">
                                <div className="rounded-xl bg-slate-950/50 p-4 border border-white/5 flex items-center justify-between">
                                    <code className="text-xs text-blue-400">https://funbin-salesbot.onrender.com/webhook</code>
                                    <button className="text-xs font-bold text-slate-500 hover:text-white transition-colors">Copy URL</button>
                                </div>
                            </div>
                        </motion.div>

                        <div className="flex justify-end gap-3">
                            <button className="rounded-xl px-6 py-2.5 text-sm font-bold text-slate-400 hover:text-white transition-all">Cancel</button>
                            <button className="flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-700 active:scale-95">
                                <Save className="h-4 w-4" />
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardShell>
    );
}
