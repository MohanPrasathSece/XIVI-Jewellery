import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
    ShoppingBag,
    ClipboardList,
    AlertTriangle,
    ArrowUpRight,
    TrendingUp,
    Calendar
} from "lucide-react";

const DashboardOverview = () => {
    const [stats, setStats] = useState({
        products: 0,
        orders: 0,
        lowStock: 0,
        revenue: 0
    });
    const [recentOrders, setRecentOrders] = useState<any[]>([]);
    const [recentProducts, setRecentProducts] = useState<any[]>([]);

    useEffect(() => {
        const fetchStats = async () => {
            // Products count
            const { count: productsCount } = await supabase
                .from('products')
                .select('*', { count: 'exact', head: true });

            // Orders count & Revenue
            const { data: ordersData } = await supabase
                .from('orders')
                .select('total_price, status, created_at, customer_name');

            const totalOrders = ordersData?.length || 0;
            const revenue = ordersData?.reduce((acc, order) => acc + (order.total_price || 0), 0) || 0;

            // Low stock
            const { count: lowStockCount } = await supabase
                .from('products')
                .select('*', { count: 'exact', head: true })
                .eq('stock_status', false);

            setStats({
                products: productsCount || 0,
                orders: totalOrders,
                lowStock: lowStockCount || 0,
                revenue: revenue
            });

            if (ordersData) {
                setRecentOrders(ordersData.slice(0, 5));
            }

            const { data: recentProds } = await supabase
                .from('products')
                .select('name, price, created_at')
                .order('created_at', { ascending: false })
                .limit(5);

            if (recentProds) {
                setRecentProducts(recentProds);
            }
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
                        {recentOrders.length > 0 ? (
                            recentOrders.map((order, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors">
                                    <div>
                                        <p className="font-bold text-slate-700">{order.customer_name}</p>
                                        <p className="text-xs text-slate-400">{new Date(order.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <p className="font-bold text-primary">₹{(order.total_price || 0).toLocaleString()}</p>
                                </div>
                            ))
                        ) : (
                            <p className="text-slate-500 text-sm">No recent orders to show yet.</p>
                        )}
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
                        {recentProducts.length > 0 ? (
                            recentProducts.map((prod, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors">
                                    <div>
                                        <p className="font-bold text-slate-700">{prod.name}</p>
                                        <p className="text-xs text-slate-400">{new Date(prod.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <p className="font-bold text-slate-600">₹{(prod.price || 0).toLocaleString()}</p>
                                </div>
                            ))
                        ) : (
                            <p className="text-slate-500 text-sm">No recent products found.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardOverview;
