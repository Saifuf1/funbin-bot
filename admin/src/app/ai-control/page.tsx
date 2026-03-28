"use client";

import React, { useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { motion } from "framer-motion";
import {
    Sparkles,
    User,
    Save,
    MessageSquare,
    AlertCircle,
    ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AIControlPage() {
    const [isAIEnabled, setIsAIEnabled] = useState(true);
    const [mode, setMode] = useState("Professional");

    return (
        <DashboardShell>
            <div className="space-y-10">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">AI Control <span className="text-gradient decoration-4 italic">Center</span></h1>
                    <p className="mt-1 text-slate-400">Master your bot's personality and responsiveness.</p>
                </div>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                    {/* Main Controls */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-6"
                    >
                        <div className="glass-card rounded-2xl p-8">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-500",
                                        isAIEnabled ? "bg-blue-600/20 text-blue-500 shadow-lg shadow-blue-500/20" : "bg-slate-800 text-slate-500"
                                    )}>
                                        <Sparkles className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">AI Engine Status</h2>
                                        <p className="text-sm text-slate-400">Toggle automated WhatsApp/IG replies</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsAIEnabled(!isAIEnabled)}
                                    className={cn(
                                        "relative h-8 w-14 rounded-full transition-colors duration-300",
                                        isAIEnabled ? "bg-blue-600" : "bg-slate-800"
                                    )}
                                >
                                    <motion.div
                                        animate={{ x: isAIEnabled ? 26 : 4 }}
                                        className="h-6 w-6 rounded-full bg-white shadow-md"
                                    />
                                </button>
                            </div>

                            <div className="mt-10 space-y-4">
                                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Personality Mode</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { id: "Professional", icon: Sparkles, desc: "Polite & Sales-focused" },
                                        { id: "Casual", icon: MessageSquare, desc: "Friendly & Human-like" }
                                    ].map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => setMode(item.id)}
                                            className={cn(
                                                "group flex flex-col items-start gap-3 rounded-2xl border p-4 text-left transition-all",
                                                mode === item.id
                                                    ? "border-blue-500 bg-blue-600/5 ring-1 ring-blue-500"
                                                    : "border-white/5 bg-white/5 hover:bg-white/10"
                                            )}
                                        >
                                            <item.icon className={cn(
                                                "h-5 w-5 transition-colors",
                                                mode === item.id ? "text-blue-500" : "text-slate-500 group-hover:text-white"
                                            )} />
                                            <div>
                                                <div className="text-sm font-bold text-white">{item.id}</div>
                                                <div className="text-xs text-slate-500">{item.desc}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="glass-card rounded-2xl p-8 border-l-4 border-amber-500/50">
                            <div className="flex gap-4">
                                <AlertCircle className="h-6 w-6 text-amber-500 shrink-0" />
                                <div>
                                    <h3 className="text-sm font-bold text-white">Usage Alert</h3>
                                    <p className="mt-1 text-sm text-slate-400">
                                        Your Gemini API usage is currently at 84% of your daily free tier. The bot will automatically switch to "Manual Mode" if the limit is reached.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* System Prompt Editor */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="glass-card flex flex-col rounded-2xl"
                    >
                        <div className="flex items-center justify-between border-b border-white/5 px-8 py-6">
                            <h2 className="text-lg font-semibold text-white">System Framework</h2>
                            <button className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-blue-700 active:scale-95">
                                <Save className="h-4 w-4" />
                                Save Changes
                            </button>
                        </div>
                        <div className="flex-1 p-8">
                            <div className="relative h-full min-h-[400px]">
                                <textarea
                                    className="h-full w-full resize-none rounded-xl bg-slate-950/50 p-6 font-mono text-sm leading-relaxed text-slate-300 border border-white/5 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                                    defaultValue={`You are the lead sales assistant at Fun Bin. 
Your tone is professional yet welcoming. 
You speak both English and Manglish (Malayalam written in English).

Key Rules:
1. Prioritize native catalog help.
2. If payment status is pending, remind them of UPI.
3. Keep response under 100 words.`}
                                />
                                <div className="absolute bottom-4 right-4 text-[10px] font-medium uppercase tracking-widest text-slate-500">
                                    Last updated: Today, 2:15 PM
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </DashboardShell>
    );
}
