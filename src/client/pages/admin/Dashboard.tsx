import { useEffect, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/admin/Sidebar";
import ProductManagement from "@/components/admin/ProductManagement";
import OrderManagement from "@/components/admin/OrderManagement";
import CategoryManagement from "@/components/admin/CategoryManagement";
import DashboardOverview from "@/components/admin/DashboardOverview";

const AdminDashboard = () => {
    const navigate = useNavigate();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate("/admin-portal/login");
    };

    return (
        <div className="flex min-h-screen bg-slate-50">
            <Sidebar onLogout={handleLogout} />
            <div className="flex-1 p-8">
                <header className="mb-8 flex items-center justify-between">
                    <h1 className="text-4xl font-bold text-slate-800">Admin Dashboard</h1>
                    <div className="text-sm font-medium text-slate-500">XIVI Silver Jewellery</div>
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
