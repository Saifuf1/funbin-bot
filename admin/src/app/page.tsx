"use client";

import React from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Users,
  ShoppingBag,
  DollarSign,
  ArrowUpRight,
  Clock,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

const stats = [
  { label: "Total Revenue", value: "₹45,231", icon: DollarSign, trend: "+12.5%", color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { label: "Active Orders", value: "12", icon: ShoppingBag, trend: "+3", color: "text-blue-500", bg: "bg-blue-500/10" },
  { label: "New Customers", value: "148", icon: Users, trend: "+18%", color: "text-violet-500", bg: "bg-violet-500/10" },
  { label: "AI Conversations", value: "1,240", icon: TrendingUp, trend: "98% success", color: "text-amber-500", bg: "bg-amber-500/10" },
];

const recentOrders = [
  { id: "ORD-7342", customer: "Rahul K.", product: "Premium Cotton Shirt", status: "Paid", amount: "₹1,299", time: "2 mins ago" },
  { id: "ORD-7341", customer: "Sneha M.", product: "Silk Saree (Red)", status: "Pending", amount: "₹3,450", time: "15 mins ago" },
  { id: "ORD-7340", customer: "Anjali P.", product: "Handmade Necklace", status: "Paid", amount: "₹850", time: "1 hour ago" },
  { id: "ORD-7339", customer: "Vikram S.", product: "Leather Wallet", status: "Shipped", amount: "₹599", time: "3 hours ago" },
];

export default function DashboardPage() {
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const password = localStorage.getItem("admin_password") || "admin123";
        const clientId = "owner"; // In a real SaaS, this would come from a context/selector
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/admin/stats`, {
          headers: {
            "Authorization": `Bearer ${password}`,
            "X-Client-Id": clientId
          }
        });
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Failed to fetch stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const displayStats = data ? [
    { label: "Total Revenue", value: data.revenue || "₹0", icon: DollarSign, trend: "+0%", color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Active Orders", value: String(data.ordersCount || 0), icon: ShoppingBag, trend: "Stable", color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Products", value: String(data.productsCount || 0), icon: Users, trend: "Sync OK", color: "text-violet-500", bg: "bg-violet-500/10" },
    { label: "AI Status", value: data.aiStats?.enabled ? "Online" : "Off", icon: TrendingUp, trend: data.aiStats?.mode || "Auto", color: "text-amber-500", bg: "bg-amber-500/10" },
  ] : [
    { label: "Total Revenue", value: "₹0", icon: DollarSign, trend: "0%", color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Active Orders", value: "0", icon: ShoppingBag, trend: "0", color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "New Customers", value: "0", icon: Users, trend: "0%", color: "text-violet-500", bg: "bg-violet-500/10" },
    { label: "AI Conversations", value: "0", icon: TrendingUp, trend: "0% success", color: "text-amber-500", bg: "bg-amber-500/10" },
  ];

  const displayOrders = data?.recentOrders || [];

  return (
    <DashboardShell>
      <div className="space-y-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard <span className="text-gradient decoration-4 italic">Overview</span></h1>
            <p className="mt-1 text-slate-400">Welcome back! Here is what's happening with Fun Bin today.</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-white/10 border border-white/5"
          >
            <Clock className="h-4 w-4 text-slate-400" />
            Refresh Data
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {displayStats.map((stat: any, i: number) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card group relative overflow-hidden rounded-2xl p-6"
            >
              <div className="flex items-center justify-between">
                <div className={cn("rounded-xl p-2.5", stat.bg || "bg-blue-500/10")}>
                  {stat.label === "Total Revenue" && <DollarSign className={cn("h-6 w-6", stat.color)} />}
                  {stat.label === "Active Orders" && <ShoppingBag className={cn("h-6 w-6", stat.color)} />}
                  {stat.label === "New Customers" && <Users className={cn("h-6 w-6", stat.color)} />}
                  {stat.label === "AI Conversations" && <TrendingUp className={cn("h-6 w-6", stat.color)} />}
                </div>
                <div className="flex items-center gap-1 text-xs font-medium text-emerald-500">
                  <ArrowUpRight className="h-3 w-3" />
                  {stat.trend}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium text-slate-400">{stat.label}</p>
                <h3 className="mt-1 text-2xl font-bold text-white tracking-tight">
                  {loading ? "..." : stat.value}
                </h3>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Main Section */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Recent Orders Table */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2 glass-card rounded-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-white/5 px-6 py-5">
              <h2 className="text-lg font-semibold text-white">Recent Orders</h2>
              <a href="/orders" className="text-sm font-medium text-blue-500 hover:text-blue-400 transition-colors">View All</a>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5 text-xs font-medium uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-4">Order ID</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Product</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loading ? (
                    <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-500">Loading orders...</td></tr>
                  ) : displayOrders.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-500">No recent orders found.</td></tr>
                  ) : (
                    displayOrders.slice(0, 5).map((order: any) => (
                      <tr key={order.ref} className="group hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 text-sm font-mono text-slate-400">{order.ref}</td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-white">{order.customerName}</div>
                          <div className="text-xs text-slate-500">{order.createdAt || "Recently"}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-300">{order.items}</td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                            order.status === "Paid" ? "bg-emerald-500/10 text-emerald-500" :
                              order.status === "Pending" ? "bg-amber-500/10 text-amber-500" :
                                "bg-blue-500/10 text-blue-500"
                          )}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-white">₹{order.amount}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* AI Activity / Quick Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-8"
          >
            <div className="glass-card rounded-2xl p-6">
              <h2 className="mb-4 text-lg font-semibold text-white">AI Control</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-xl bg-white/5 p-4 border border-white/5">
                  <div>
                    <div className="text-sm font-medium text-white">AI-Powered Replies</div>
                    <div className="text-xs text-slate-500 font-mono">Status: {data?.aiStats?.enabled ? "ACTIVE" : "DISABLED"}</div>
                  </div>
                  <div className={cn("h-2 w-2 rounded-full animate-pulse", data?.aiStats?.enabled ? "bg-emerald-500" : "bg-red-500")} />
                </div>
                <a
                  href="/ai-control"
                  className="block w-full text-center rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-700 active:scale-95"
                >
                  Configure Bot
                </a>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6">
              <h2 className="mb-4 text-lg font-semibold text-white">Current Mode</h2>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">{data?.aiStats?.mode || "Standard Mode"}</div>
                  <div className="text-xs text-slate-500">Optimizing for conversions</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardShell>
  );
}
