import { useEffect, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/admin/Sidebar";
import ProductManagement from "@/components/admin/ProductManagement";
import OrderManagement from "@/components/admin/OrderManagement";
import CategoryManagement from "@/components/admin/CategoryManagement";
import DashboardOverview from "@/components/admin/DashboardOverview";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate("/admin-portal/login");
    };

    return (
        <div className="flex min-h-screen bg-slate-50 font-manrope admin-portal">
            <Sidebar
                onLogout={handleLogout}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />
            <div className="flex-1 p-4 md:p-8 w-full max-w-[100vw] overflow-x-hidden">
                <header className="mb-6 md:mb-8 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="md:hidden text-slate-600 -ml-2"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <Menu className="w-6 h-6" />
                        </Button>
                        <h1 className="text-2xl md:text-4xl font-bold text-slate-800">Dashboard</h1>
                    </div>
                    <div className="text-xs md:text-sm font-medium text-slate-500 text-right">
                        <span className="hidden sm:inline">XIVI Silver Jewellery</span>
                        <span className="sm:hidden">XIVI</span>
                    </div>
                </header>

                <Routes>
                    <Route path="/" element={<DashboardOverview />} />
                    <Route path="/products" element={<ProductManagement />} />
                    <Route path="/categories" element={<CategoryManagement />} />
                    <Route path="/orders" element={<OrderManagement />} />
                </Routes>
            </div>
        </div>
    );
};

export default AdminDashboard;
