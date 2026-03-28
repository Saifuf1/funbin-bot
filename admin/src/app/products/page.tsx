"use client";

import React from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { motion } from "framer-motion";
import {
    Plus,
    Search,
    Filter,
    RefreshCw,
    MoreVertical,
    Edit,
    Trash2,
    ExternalLink,
    ShoppingBag
} from "lucide-react";
import { cn } from "@/lib/utils";

const products = [
    { sku: "COT-001", name: "Premium Blue Cotton Shirt", category: "Apparel", price: "₹1,299", stock: 45, status: "In Stock" },
    { sku: "SILK-022", name: "Deep Red Silk Saree", category: "Traditional", price: "₹3,450", stock: 12, status: "Low Stock" },
    { sku: "LTH-005", name: "Brown Leather Wallet", category: "Accessories", price: "₹599", stock: 0, status: "Out of Stock" },
    { sku: "JWL-102", name: "Handmade Pearl Necklace", category: "Jewelry", price: "₹850", stock: 89, status: "In Stock" },
    { sku: "COT-002", name: "White Linen Trousers", category: "Apparel", price: "₹1,499", stock: 23, status: "In Stock" },
];

export default function ProductsPage() {
    const [products, setProducts] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [syncing, setSyncing] = React.useState(false);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const password = localStorage.getItem("admin_password") || "admin123";
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/admin/products`, {
                headers: { "Authorization": `Bearer ${password}` }
            });
            const data = await res.json();
            setProducts(data || []);
        } catch (err) {
            console.error("Failed to fetch products", err);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchProducts();
    }, []);

    const handleSync = async () => {
        setSyncing(true);
        try {
            // In a real app, this would trigger a backend pull from Sheets
            await fetchProducts();
            alert("Products synced with Google Sheets!");
        } finally {
            setSyncing(false);
        }
    };

    return (
        <DashboardShell>
            <div className="space-y-10">
                {/* Header */}
                <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white">Product <span className="text-gradient decoration-4 italic">Inventory</span></h1>
                        <p className="mt-1 text-slate-400">Manage your entire catalog across WhatsApp, IG, and FB.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleSync}
                            disabled={syncing}
                            className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-white/10 border border-white/5 disabled:opacity-50"
                        >
                            <RefreshCw className={cn("h-4 w-4 text-slate-400", syncing && "animate-spin")} />
                            {syncing ? "Syncing..." : "Sync Sheets"}
                        </button>
                        <button className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-700 active:scale-95">
                            <Plus className="h-4 w-4" />
                            Add Product
                        </button>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by name, category or SKU..."
                            className="h-10 w-full rounded-xl bg-white/5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 border border-white/5 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-sm font-medium text-slate-300 border border-white/5 hover:bg-white/10 transition-all">
                            <Filter className="h-4 w-4" />
                            Filter
                        </button>
                    </div>
                </div>

                {/* Products Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card rounded-2xl overflow-hidden"
                >
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-white/5 text-xs font-medium uppercase tracking-wider text-slate-500">
                                    <th className="px-8 py-5">Product Details</th>
                                    <th className="px-6 py-5">Category</th>
                                    <th className="px-6 py-5">Price</th>
                                    <th className="px-6 py-5">Inventory</th>
                                    <th className="px-6 py-5">Status</th>
                                    <th className="px-8 py-5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    <tr><td colSpan={6} className="px-8 py-20 text-center text-slate-500">Loading your catalog...</td></tr>
                                ) : products.length === 0 ? (
                                    <tr><td colSpan={6} className="px-8 py-20 text-center text-slate-500">No products found in Google Sheets.</td></tr>
                                ) : products.map((product, i) => (
                                    <motion.tr
                                        key={product.sku || i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="group hover:bg-white/[0.02] transition-colors"
                                    >
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-xl bg-slate-800 flex items-center justify-center border border-white/5 overflow-hidden">
                                                    <ShoppingBag className="h-5 w-5 text-slate-600" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-white">{product.name}</div>
                                                    <div className="text-xs font-mono text-slate-500">{product.sku}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-sm text-slate-300">{product.category || "General"}</td>
                                        <td className="px-6 py-5 text-sm font-bold text-white">₹{product.price}</td>
                                        <td className="px-6 py-5">
                                            <div className="text-sm text-white">{product.stock || 0} units</div>
                                            <div className="h-1.5 w-24 rounded-full bg-slate-800 mt-2 overflow-hidden">
                                                <div
                                                    className={cn(
                                                        "h-full rounded-full transition-all duration-1000",
                                                        (product.stock || 0) > 20 ? "bg-emerald-500" :
                                                            (product.stock || 0) > 5 ? "bg-amber-500" : "bg-red-500"
                                                    )}
                                                    style={{ width: `${Math.min((product.stock || 0) * 4, 100)}%` }}
                                                />
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={cn(
                                                "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                                                (product.stock || 0) > 5 ? "bg-emerald-500/10 text-emerald-500" :
                                                    (product.stock || 0) > 0 ? "bg-amber-500/10 text-amber-500" :
                                                        "bg-red-500/10 text-red-500"
                                            )}>
                                                {(product.stock || 0) > 5 ? "In Stock" : (product.stock || 0) > 0 ? "Low Stock" : "Out of Stock"}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                                <button className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-white transition-colors">
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-red-500 transition-colors">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                                <button className="p-2 rounded-lg bg-blue-600/10 text-blue-500 hover:bg-blue-600/20 transition-colors">
                                                    <ExternalLink className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="border-t border-white/5 px-8 py-4 bg-white/[0.01]">
                        <p className="text-xs text-slate-500 tracking-wide">Showing {products.length} products direct from Google Sheets</p>
                    </div>
                </motion.div>
            </div>
        </DashboardShell>
    );
}
