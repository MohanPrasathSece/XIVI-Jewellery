import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
    ClipboardList,
    ChevronRight,
    Truck,
    CheckCircle2,
    XCircle,
    Clock,
    Sparkles,
    FileDown,
    Database,
    ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const OrderManagement = () => {
    const [orders, setOrders] = useState<any[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [confirmAction, setConfirmAction] = useState<{ type: 'status' | 'tracking' | 'cleanup', order: any, value?: string } | null>(null);
    const { toast } = useToast();

    const fetchOrders = async () => {
        const { data } = await supabase
            .from("orders")
            .select("*")
            .order("created_at", { ascending: false });
        if (data) setOrders(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchOrders();

        const subscription = supabase
            .channel('orders-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders)
            .subscribe();

        return () => { supabase.removeChannel(subscription); };
    }, []);

    const updateStatus = async (order: any, newStatus: string) => {
        const orderId = order.id;
        try {
            const { error } = await supabase
                .from("orders")
                .update({ status: newStatus })
                .eq("id", orderId);

            if (error) throw error;

            // Trigger email via backend with security token
            const session = await supabase.auth.getSession();
            await fetch("/api/orders/update-status", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session.data.session?.access_token}`
                },
                body: JSON.stringify({
                    orderId,
                    status: newStatus,
                    trackingNumber: order.tracking_number || "",
                    trackingId: order.tracking_id || ""
                })
            });

            toast({ title: `Order ${newStatus}` });
            fetchOrders();
            if (selectedOrder) setSelectedOrder({ ...selectedOrder, status: newStatus });
        } catch (error: any) {
            toast({ title: "Update Failed", description: error.message, variant: "destructive" });
        }
    };

    const [exportRange, setExportRange] = useState<'all' | 'week' | 'month'>('all');

    const exportToCSV = () => {
        if (!orders.length) return;

        let filteredOrders = orders;
        const now = new Date();

        if (exportRange === 'week') {
            const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            filteredOrders = orders.filter(o => new Date(o.created_at) >= lastWeek);
        } else if (exportRange === 'month') {
            const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            filteredOrders = orders.filter(o => new Date(o.created_at) >= lastMonth);
        }

        if (filteredOrders.length === 0) {
            toast({ title: "No Orders", description: "No orders found for the selected period." });
            return;
        }

        const headers = ["Order ID", "Customer", "Email", "Phone", "Status", "Gifting", "Gift Price", "Total", "Date", "Time", "Address"];
        const rows = filteredOrders.map(o => [
            o.id,
            `"${o.customer_name}"`,
            o.email,
            o.phone,
            o.status,
            `"${o.gift_option_name || 'None'}"`,
            o.gift_option_price || 0,
            o.total_price,
            `"${new Date(o.created_at).getFullYear()}-${String(new Date(o.created_at).getMonth() + 1).padStart(2, '0')}-${String(new Date(o.created_at).getDate()).padStart(2, '0')}"`,
            `"${new Date(o.created_at).getHours().toString().padStart(2, '0')}:${new Date(o.created_at).getMinutes().toString().padStart(2, '0')}:${new Date(o.created_at).getSeconds().toString().padStart(2, '0')}"`,
            `"${o.address}"`
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `XIVI_Orders_${exportRange}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({ title: "Export Successful", description: `Exported ${filteredOrders.length} orders.` });
    };

    const triggerManualCleanup = async () => {
        setConfirmAction({ type: 'cleanup', order: null });
    };

    const handleCleanup = async () => {
        try {
            const session = await supabase.auth.getSession();
            const res = await fetch("/api/orders/cleanup", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${session.data.session?.access_token}`
                }
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            toast({ title: "Maintenance Success", description: data.message });
            fetchOrders();
        } catch (e: any) {
            toast({ title: "Maintenance Failed", description: e.message, variant: "destructive" });
        }
    };

    const statusIcons: any = {
        Pending: <Clock className="w-4 h-4 text-amber-500" />,
        Confirmed: <CheckCircle2 className="w-4 h-4 text-blue-500" />,
        Shipped: <Truck className="w-4 h-4 text-purple-500" />,
        "Out for Delivery": <Truck className="w-4 h-4 text-amber-500" />,
        Delivered: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
        Cancelled: <XCircle className="w-4 h-4 text-red-500" />,
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
                <div>
                    <h2 className="text-xl md:text-2xl font-bold text-slate-800">Order Management</h2>
                    <p className="text-xs md:text-sm text-slate-500">View and manage customer orders across all stages.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 md:gap-3">
                    <select
                        value={exportRange}
                        onChange={(e) => setExportRange(e.target.value as any)}
                        className="h-9 md:h-10 rounded-xl border border-slate-200 text-xs md:text-sm px-3 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400"
                    >
                        <option value="all">All Time</option>
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                    </select>
                    <Button
                        variant="outline"
                        onClick={exportToCSV}
                        className="rounded-xl border-slate-200 text-slate-600 gap-2 hover:bg-slate-50 text-xs md:text-sm h-9 md:h-10"
                    >
                        <FileDown className="w-4 h-4" /> <span className="hidden sm:inline">Export</span>
                    </Button>
                    <Button
                        variant="outline"
                        onClick={triggerManualCleanup}
                        className="rounded-xl border-slate-200 text-red-600 hover:bg-red-50 hover:border-red-100 gap-2 text-xs md:text-sm h-9 md:h-10"
                    >
                        <Database className="w-4 h-4" /> <span className="hidden sm:inline">Run 30-Day Cleanup</span><span className="sm:hidden">Cleanup</span>
                    </Button>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-soft border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[800px]">
                        <thead className="bg-slate-50 border-b border-slate-100 font-medium text-slate-500 text-sm">
                            <tr>
                                <th className="px-4 md:px-6 py-4">Order ID</th>
                                <th className="px-4 md:px-6 py-4">Customer</th>
                                <th className="px-4 md:px-6 py-4">Status</th>
                                <th className="px-4 md:px-6 py-4">Total</th>
                                <th className="px-4 md:px-6 py-4">Date & Time</th>
                                <th className="px-4 md:px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {orders.map(order => (
                                <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 md:px-6 py-4 font-mono text-xs text-slate-500">#{order.id.slice(0, 8)}</td>
                                    <td className="px-4 md:px-6 py-4">
                                        <div className="font-bold text-slate-700">{order.customer_name}</div>
                                        <div className="text-xs text-slate-400">{order.email}</div>
                                    </td>
                                    <td className="px-4 md:px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {statusIcons[order.status]}
                                            <span className="text-sm font-medium text-slate-700">{order.status}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 md:px-6 py-4 font-bold text-slate-800">₹{order.total_price.toLocaleString()}</td>
                                    <td className="px-4 md:px-6 py-4">
                                        <div className="text-sm font-medium text-slate-700">{new Date(order.created_at).toLocaleDateString("en-IN")}</div>
                                        <div className="text-xs text-slate-400">{new Date(order.created_at).toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' })}</div>
                                    </td>
                                    <td className="px-4 md:px-6 py-4 text-right">
                                        <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(order)} className="gap-2">
                                            Details <ChevronRight className="w-4 h-4" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
                <DialogContent className="max-w-4xl w-[95%] md:w-full bg-white rounded-3xl p-6 md:p-10 font-manrope admin-portal max-h-[90vh] overflow-y-auto">
                    {selectedOrder && (
                        <>
                            <DialogHeader>
                                <div className="flex flex-col md:flex-row justify-between items-start gap-4 md:gap-0 pr-8">
                                    <DialogTitle className="text-xl md:text-2xl">Order Details</DialogTitle>
                                    <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full self-start md:self-auto">
                                        {statusIcons[selectedOrder.status]}
                                        <span className="text-sm font-bold">{selectedOrder.status}</span>
                                    </div>
                                </div>
                            </DialogHeader>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Customer Info</h4>
                                        <div className="bg-slate-50 p-4 rounded-2xl">
                                            <p className="font-bold text-slate-800">{selectedOrder.customer_name}</p>
                                            <p className="text-sm text-slate-600">{selectedOrder.email}</p>
                                            <p className="text-sm text-slate-600">{selectedOrder.phone}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Shipping Address</h4>
                                        <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl">{selectedOrder.address}</p>
                                    </div>
                                    {selectedOrder.notes && (
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Order Notes</h4>
                                            <p className="text-sm text-slate-800 font-medium bg-amber-50 border border-amber-100 p-4 rounded-2xl">{selectedOrder.notes}</p>
                                        </div>
                                    )}
                                    {selectedOrder.gift_option_name && (
                                        <div className="space-y-2">
                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Selected Gifting</h4>
                                            <div className="bg-primary/5 border border-primary/10 p-4 rounded-2xl flex justify-between items-center text-left">
                                                <div className="flex items-center gap-2">
                                                    <Sparkles className="w-4 h-4 text-primary" />
                                                    <span className="text-sm font-bold text-slate-800">{selectedOrder.gift_option_name}</span>
                                                </div>
                                                <span className="text-sm font-bold text-primary">₹{selectedOrder.gift_option_price}</span>
                                            </div>
                                            {selectedOrder.gift_custom_text && (
                                                <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl text-left">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Personalized Message</p>
                                                    <p className="text-sm italic text-slate-600">"{selectedOrder.gift_custom_text}"</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4 md:text-right">
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 md:text-right">Items</h4>
                                        <div className="space-y-2 bg-slate-50 p-4 rounded-2xl">
                                            {JSON.parse(selectedOrder.products).map((item: any, i: number) => (
                                                <div key={i} className="flex justify-between md:justify-end gap-4 text-sm text-slate-700">
                                                    <span>{item.name}</span>
                                                    <span className="font-bold">x{item.quantity}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 md:text-right">Tracking ID</h4>
                                            <Input
                                                placeholder="e.g. SF123456789"
                                                value={selectedOrder.tracking_id || ""}
                                                onChange={(e) => setSelectedOrder({ ...selectedOrder, tracking_id: e.target.value })}
                                                onBlur={async (e) => {
                                                    await supabase.from("orders").update({ tracking_id: e.target.value }).eq("id", selectedOrder.id);
                                                }}
                                                className="md:text-right h-10 rounded-xl border-slate-200 focus:ring-emerald-500"
                                            />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 md:text-right">Tracking Link</h4>
                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder="https://tracking.link/..."
                                                    value={selectedOrder.tracking_number || ""}
                                                    onChange={(e) => setSelectedOrder({ ...selectedOrder, tracking_number: e.target.value })}
                                                    onBlur={async (e) => {
                                                        await supabase.from("orders").update({ tracking_number: e.target.value }).eq("id", selectedOrder.id);
                                                    }}
                                                    className="md:text-right h-10 rounded-xl border-slate-200 focus:ring-emerald-500 flex-1"
                                                />
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={() => setConfirmAction({ type: 'tracking', order: selectedOrder })}
                                                    className="rounded-xl border-slate-200 text-slate-400 hover:text-primary hover:border-primary"
                                                    title="Notify customer about tracking"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </Button>
                                            </div>
                                            <p className="text-[10px] text-slate-400 mt-1">Status changes to 'Shipped' or 'Out for Delivery' automatically notify the customer.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
                                <div className="flex flex-wrap justify-center gap-2 w-full md:w-auto">
                                    {['Confirmed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'].map((status) => {
                                        const steps = ['Confirmed', 'Shipped', 'Out for Delivery', 'Delivered'];
                                        const currentStepIndex = steps.indexOf(selectedOrder.status);
                                        const thisStepIndex = steps.indexOf(status);

                                        const isCompleted = status !== 'Cancelled' &&
                                            currentStepIndex !== -1 &&
                                            thisStepIndex <= currentStepIndex;

                                        const isPast = status !== 'Cancelled' &&
                                            currentStepIndex !== -1 &&
                                            thisStepIndex < currentStepIndex;

                                        const isAlreadyCancelled = selectedOrder.status === 'Cancelled';
                                        const isAlreadyDelivered = selectedOrder.status === 'Delivered';

                                        // Lock logic: Cannot go back, cannot change if cancelled or delivered
                                        const isLocked = (thisStepIndex !== -1 && thisStepIndex <= currentStepIndex) || isAlreadyCancelled || isAlreadyDelivered;

                                        const isCancelled = selectedOrder.status === 'Cancelled' && status === 'Cancelled';

                                        return (
                                            <Button
                                                key={status}
                                                variant="outline"
                                                size="sm"
                                                disabled={isLocked}
                                                onClick={() => setConfirmAction({ type: 'status', order: selectedOrder, value: status })}
                                                className={cn(
                                                    "transition-all px-4 rounded-full flex-1 md:flex-none",
                                                    isCompleted
                                                        ? "bg-emerald-500 border-emerald-500 text-white hover:bg-emerald-600 font-bold shadow-sm"
                                                        : isCancelled
                                                            ? "bg-red-500 border-red-500 text-white font-bold"
                                                            : selectedOrder.status === status
                                                                ? "bg-slate-800 border-slate-800 text-white font-bold"
                                                                : "hover:bg-slate-100 text-slate-600 font-medium",
                                                    isLocked && "opacity-50 grayscale pointer-events-none"
                                                )}
                                            >
                                                {status}
                                            </Button>
                                        );
                                    })}
                                </div>
                                <div className="text-center md:text-right w-full md:w-auto bg-slate-50 md:bg-transparent p-4 md:p-0 rounded-2xl">
                                    <p className="text-xs text-slate-400">Total Price</p>
                                    <p className="text-2xl font-bold text-slate-900">₹{selectedOrder.total_price.toLocaleString()}</p>
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
                <AlertDialogContent className="bg-white rounded-3xl font-manrope w-[90%] md:w-full">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {confirmAction?.type === 'status'
                                ? `You are changing the order status to ${confirmAction.value}. This will send an automated email update to the customer.`
                                : confirmAction?.type === 'tracking'
                                    ? "This will send the current tracking link/ID to the customer via email. Use this if you already shipped the order but are adding the tracking info now."
                                    : "Are you sure you want to archive orders older than 30 days and send them to email? This will delete them from the database."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col gap-2 md:flex-row">
                        <AlertDialogCancel className="rounded-full w-full md:w-auto mt-2 md:mt-0">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-primary text-white rounded-full w-full md:w-auto"
                            onClick={() => {
                                if (confirmAction?.type === 'status') {
                                    updateStatus(confirmAction.order, confirmAction.value!);
                                } else if (confirmAction?.type === 'tracking') {
                                    updateStatus(confirmAction.order, confirmAction.order.status);
                                } else if (confirmAction?.type === 'cleanup') {
                                    handleCleanup();
                                }
                                setConfirmAction(null);
                            }}
                        >
                            Yes, send notification
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div >
    );
};

export default OrderManagement;
