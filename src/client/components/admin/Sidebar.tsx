import { Link, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    ShoppingBag,
    ListTree,
    ClipboardList,
    LogOut,
    Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
    onLogout: () => void;
}

const Sidebar = ({ onLogout }: SidebarProps) => {
    const location = useLocation();
    const currentPath = location.pathname;

    const menuItems = [
        { icon: LayoutDashboard, label: "Overview", path: "/admin-portal" },
        { icon: ShoppingBag, label: "Products", path: "/admin-portal/products" },
        { icon: ListTree, label: "Categories", path: "/admin-portal/categories" },
        { icon: ClipboardList, label: "Orders", path: "/admin-portal/orders" },
    ];

    return (
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0">
            <div className="p-6">
                <div className="flex items-center gap-2 mb-8">
                    <div className="w-8 h-8 bg-gradient-rose rounded-lg flex items-center justify-center text-white">
                        <Sparkles className="w-5 h-5" />
                    </div>
                    <span className="text-2xl font-bold text-gradient-rose">XIVI</span>
                </div>

                <nav className="space-y-1">
                    {menuItems.map((item) => {
                        const isActive = currentPath === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
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
    );
};

export default Sidebar;
