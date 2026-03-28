"use client";

import React from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { motion } from "framer-motion";
import {
    Search,
    Filter,
    Download,
    ExternalLink,
    MessageCircle,
    Clock,
    CheckCircle2,
    AlertCircle,
    Truck
} from "lucide-react";
import { cn } from "@/lib/utils";

const orders = [
    { id: "ORD-7342", customer: "Rahul Kumar", phone: "+91 9876543210", items: "Premium Cotton Shirt (XL)", amount: "₹1,299", status: "Paid", date: "Today, 2:15 PM" },
    { id: "ORD-7341", customer: "Sneha Menon", phone: "+91 8877665544", items: "Silk Saree (Red)", amount: "₹3,450", status: "Pending", date: "Today, 1:45 PM" },
    { id: "ORD-7340", customer: "Anjali Pillai", phone: "+91 7766554433", items: "Handmade Necklace", amount: "₹850", status: "Paid", date: "Today, 11:20 AM" },
    { id: "ORD-7339", customer: "Vikram Singh", phone: "+91 9988776655", items: "Leather Wallet", amount: "₹599", status: "Shipped", date: "Yesterday, 6:30 PM" },
    { id: "ORD-7338", customer: "Deepika R.", phone: "+91 9122334455", items: "Linen Trousers (32)", amount: "₹1,499", status: "Paid", date: "Yesterday, 4:15 PM" },
];

export default function OrdersPage() {
    const [orders, setOrders] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchOrders = async () => {
            try {
                const password = localStorage.getItem("admin_password") || "admin123";
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/admin/orders`, {
                    headers: { "Authorization": `Bearer ${password}` }
                });
                const data = await res.json();
                setOrders(data || []);
            } catch (err) {
                console.error("Failed to fetch orders", err);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, []);

    const openWhatsApp = (phone: string) => {
        // Remove non-numeric characters
        const cleanPhone = phone.replace(/\D/g, "");
        window.open(`https://wa.me/${cleanPhone}`, "_blank");
    };

    return (
        <DashboardShell>
            <div className="space-y-10">
                {/* Header */}
                <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white">Sales <span className="text-gradient decoration-4 italic">Feed</span></h1>
                        <p className="mt-1 text-slate-400">Track and fulfill all incoming orders from AI-assisted chats.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-white/10 border border-white/5">
                            <Download className="h-4 w-4 text-slate-400" />
                            Export CSV
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
                        {["All Orders", "Pending", "Paid", "Shipped", "Cancelled"].map((tab, i) => (
                            <button
                                key={tab}
                                className={cn(
                                    "whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all",
                                    i === 0 ? "bg-white/10 text-white" : "text-slate-500 hover:text-white"
                                )}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                    <div className="relative group min-w-[300px]">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by Order ID or Name..."
                            className="h-10 w-full rounded-xl bg-white/5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 border border-white/5 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                        />
                    </div>
                </div>

                {/* Orders List */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="py-20 text-center text-slate-500">Retrieving orders from Google Sheets...</div>
                    ) : orders.length === 0 ? (
                        <div className="py-20 text-center text-slate-500">No orders found.</div>
                    ) : (
                        orders.map((order, i) => (
                            <motion.div
                                key={order.id || i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="glass-card group relative flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-white/5 hover:bg-white/[0.03] transition-all duration-300"
                            >
                                <div className="flex items-center gap-6">
                                    <div className={cn(
                                        "flex h-12 w-12 items-center justify-center rounded-2xl shrink-0 transition-transform duration-500 group-hover:scale-110",
                                        order.status === "Paid" ? "bg-emerald-500/10 text-emerald-500" :
                                            order.status === "Pending" ? "bg-amber-500/10 text-amber-500" :
                                                "bg-blue-500/10 text-blue-500"
                                    )}>
                                        {order.status === "Paid" ? <CheckCircle2 className="h-6 w-6" /> :
                                            order.status === "Pending" ? <Clock className="h-6 w-6" /> :
                                                <Truck className="h-6 w-6" />}
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-mono text-slate-500 uppercase tracking-tighter">{order.id}</span>
                                            <span className="h-1 w-1 rounded-full bg-slate-700" />
                                            <span className="text-xs text-slate-500">{order.date || "Just now"}</span>
                                        </div>
                                        <h3 className="text-lg font-bold text-white mt-1">{order.customer}</h3>
                                        <p className="text-sm text-slate-400 mt-0.5">{order.product || order.items}</p>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-10">
                                    <div className="text-left sm:text-right">
                                        <div className="text-xl font-bold text-white">{order.amount}</div>
                                        <div className={cn(
                                            "mt-1 text-xs font-bold uppercase tracking-widest",
                                            order.status === "Paid" ? "text-emerald-500" :
                                                order.status === "Pending" ? "text-amber-500" :
                                                    "text-blue-500"
                                        )}>
                                            {order.status}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => openWhatsApp(order.phone)}
                                            title="Open WhatsApp Chat"
                                            className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500/20 transition-all active:scale-95"
                                        >
                                            <MessageCircle className="h-5 w-5" />
                                        </button>
                                        <button
                                            title="Order Details"
                                            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-slate-400 border border-white/5 hover:bg-white/10 hover:text-white transition-all active:scale-95"
                                        >
                                            <ExternalLink className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Status Glow Tip */}
                                <div className={cn(
                                    "absolute left-0 top-1/2 -translate-y-1/2 h-12 w-1 blur-lg opacity-0 group-hover:opacity-100 transition-opacity",
                                    order.status === "Paid" ? "bg-emerald-500" :
                                        order.status === "Pending" ? "bg-amber-500" :
                                            "bg-blue-500"
                                )} />
                            </motion.div>
                        ))
                    )}
                </div>

                {!loading && orders.length > 5 && (
                    <div className="flex items-center justify-center pt-6">
                        <button className="text-sm font-medium text-slate-500 hover:text-white transition-colors">Load more activity...</button>
                    </div>
                )}
            </div>
        </DashboardShell>
    );
}
