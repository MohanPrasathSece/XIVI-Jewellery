import { Link, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    ShoppingBag,
    ListTree,
    ClipboardList,
    LogOut,
    Sparkles,
    X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SidebarProps {
    onLogout: () => void;
    isOpen: boolean;
    onClose: () => void;
}

const Sidebar = ({ onLogout, isOpen, onClose }: SidebarProps) => {
    const location = useLocation();
    const currentPath = location.pathname;

    const menuItems = [
        { icon: LayoutDashboard, label: "Overview", path: "/admin-portal" },
        { icon: ShoppingBag, label: "Products", path: "/admin-portal/products" },
        { icon: ListTree, label: "Categories", path: "/admin-portal/categories" },
        { icon: ClipboardList, label: "Orders", path: "/admin-portal/orders" },
    ];

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
                    onClick={onClose}
                />
            )}

            {/* Sidebar Container */}
            <aside className={cn(
                "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col h-screen transition-transform duration-300 ease-in-out md:sticky md:top-0 md:translate-x-0",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="p-6">
                    <div className="flex items-center justify-between mb-8">
                        <Link to="/admin-portal" className="flex items-center gap-2">
                            <img src="/new_logo-removebg-preview.png" alt="XIVI Logo" className="h-8 w-auto object-contain" />
                        </Link>
                        <Button variant="ghost" size="icon" className="md:hidden text-slate-500" onClick={onClose}>
                            <X className="w-5 h-5" />
                        </Button>
                    </div>

                    <nav className="space-y-1">
                        {menuItems.map((item) => {
                            const isActive = currentPath === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => onClose()} // Close on navigation on mobile
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                                        isActive
                                            ? "bg-primary/10 text-primary"
                                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                    )}
                                >
                                    <item.icon className="w-5 h-5" />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="mt-auto p-6 border-t border-slate-100">
                    <button
                        onClick={onLogout}
                        className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all text-left"
                    >
                        <LogOut className="w-5 h-5" />
                        Log Out
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
