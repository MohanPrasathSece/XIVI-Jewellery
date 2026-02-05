import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
    ShoppingBag,
    ClipboardList,
    AlertTriangle,
    ArrowUpRight,
    TrendingUp
} from "lucide-react";

const DashboardOverview = () => {
    const [stats, setStats] = useState({
        products: 0,
        orders: 0,
        lowStock: 0,
        revenue: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            // Products count
            const { count: productsCount } = await supabase
                .from('products')
                .select('*', { count: 'exact', head: true });

            // Orders count
            const { count: ordersCount } = await supabase
                .from('orders')
                .select('*', { count: 'exact', head: true });

            // Low stock (e.g., if we had a stock field, but user asked for stock_status toggles)
            // For now, let's just use some placeholder logic or actual counts if possible

            setStats({
                products: productsCount || 0,
                orders: ordersCount || 0,
                lowStock: 2, // Placeholder for demonstration
                revenue: 125000 // Placeholder
            });
        };

        fetchStats();
    }, []);

    const cards = [
        { label: "Total Products", value: stats.products, icon: ShoppingBag, color: "bg-blue-500" },
        { label: "Total Orders", value: stats.orders, icon: ClipboardList, color: "bg-green-500" },
        { label: "Low Stock Alerts", value: stats.lowStock, icon: AlertTriangle, color: "bg-amber-500" },
        { label: "Total Revenue", value: `₹${stats.revenue.toLocaleString()}`, icon: TrendingUp, color: "bg-purple-500" },
    ];

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card, i) => (
                    <div key={i} className="bg-white p-6 rounded-3xl shadow-soft border border-slate-100 flex items-center gap-4 transition-all hover:shadow-glow hover:-translate-y-1">
                        <div className={`${card.color} p-3 rounded-2xl text-white shadow-lg`}>
                            <card.icon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">{card.label}</p>
                            <h3 className="text-2xl font-bold text-slate-800">{card.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-3xl shadow-soft border border-slate-100">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-slate-800">Recent Orders</h3>
                        <button className="text-primary text-sm font-medium flex items-center gap-1 hover:underline">
                            View All <ArrowUpRight className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="space-y-4">
                        {/* Placeholder for recent orders */}
                        <p className="text-slate-500 text-sm">No recent orders to show yet.</p>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-3xl shadow-soft border border-slate-100">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-slate-800">New Products</h3>
                        <button className="text-primary text-sm font-medium flex items-center gap-1 hover:underline">
                            Add New <ArrowUpRight className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="space-y-4">
                        {/* Placeholder for recent products */}
                        <p className="text-slate-500 text-sm">Welcome to XIVI. Get started by adding your first silver masterpiece!</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardOverview;
