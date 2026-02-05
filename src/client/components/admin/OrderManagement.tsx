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
    const [confirmAction, setConfirmAction] = useState<{ type: 'status' | 'tracking', value?: string } | null>(null);
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

    const updateStatus = async (orderId: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from("orders")
                .update({ status: newStatus })
                .eq("id", orderId);

            if (error) throw error;

            // Trigger email via backend
            await fetch("/api/orders/update-status", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    orderId,
                    status: newStatus,
                    trackingNumber: selectedOrder?.tracking_number || "",
                    trackingId: selectedOrder?.tracking_id || ""
                })
            });

            toast({ title: `Order ${newStatus}` });
            fetchOrders();
            if (selectedOrder) setSelectedOrder({ ...selectedOrder, status: newStatus });
        } catch (error: any) {
            toast({ title: "Update Failed", description: error.message, variant: "destructive" });
        }
    };

    const exportToCSV = () => {
        if (!orders.length) return;

        const headers = ["Order ID", "Customer", "Email", "Phone", "Status", "Total", "Date", "Time", "Address"];
        const rows = orders.map(o => [
            o.id,
            `"${o.customer_name}"`,
            o.email,
            o.phone,
            o.status,
            o.total_price,
            new Date(o.created_at).toLocaleDateString(),
            new Date(o.created_at).toLocaleTimeString(),
            `"${o.address}"`
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `XIVI_Orders_${new Date().toLocaleDateString()}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({ title: "Export Successful", description: "CSV file has been downloaded." });
    };

    const triggerManualCleanup = async () => {
        if (!confirm("Are you sure you want to archive orders older than 30 days and send them to email? This will delete them from the database.")) return;

        try {
            const res = await fetch("/api/orders/cleanup", { method: "POST" });
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
        Delivered: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
        Cancelled: <XCircle className="w-4 h-4 text-red-500" />,
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Order Management</h2>
                    <p className="text-sm text-slate-500">View and manage customer orders across all stages.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={exportToCSV}
                        className="rounded-xl border-slate-200 text-slate-600 gap-2 hover:bg-slate-50"
                    >
                        <FileDown className="w-4 h-4" /> Export All
                    </Button>
                    <Button
                        variant="outline"
                        onClick={triggerManualCleanup}
                        className="rounded-xl border-slate-200 text-red-600 hover:bg-red-50 hover:border-red-100 gap-2"
                    >
                        <Database className="w-4 h-4" /> Run 30-Day Cleanup
                    </Button>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-soft border border-slate-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100 font-medium text-slate-500 text-sm">
                        <tr>
                            <th className="px-6 py-4">Order ID</th>
                            <th className="px-6 py-4">Customer</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Total</th>
                            <th className="px-6 py-4">Date & Time</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {orders.map(order => (
                            <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 font-mono text-xs text-slate-500">#{order.id.slice(0, 8)}</td>
                                <td className="px-6 py-4">
                                    <div className="font-bold text-slate-700">{order.customer_name}</div>
                                    <div className="text-xs text-slate-400">{order.email}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        {statusIcons[order.status]}
                                        <span className="text-sm font-medium text-slate-700">{order.status}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 font-bold text-slate-800">₹{order.total_price.toLocaleString()}</td>
                                <td className="px-6 py-4">
                                    <div className="text-sm font-medium text-slate-700">{new Date(order.created_at).toLocaleDateString("en-IN")}</div>
                                    <div className="text-xs text-slate-400">{new Date(order.created_at).toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' })}</div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(order)} className="gap-2">
                                        Details <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
                <DialogContent className="max-w-4xl bg-white rounded-3xl p-10 font-manrope admin-portal">
                    {selectedOrder && (
                        <>
                            <DialogHeader>
                                <div className="flex justify-between items-start pr-8">
                                    <DialogTitle className="text-2xl">Order Details</DialogTitle>
                                    <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full">
                                        {statusIcons[selectedOrder.status]}
                                        <span className="text-sm font-bold">{selectedOrder.status}</span>
                                    </div>
                                </div>
                            </DialogHeader>

                            <div className="grid grid-cols-2 gap-8 mt-6">
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Customer Info</h4>
                                        <p className="font-bold text-slate-800">{selectedOrder.customer_name}</p>
                                        <p className="text-sm text-slate-600">{selectedOrder.email}</p>
                                        <p className="text-sm text-slate-600">{selectedOrder.phone}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Shipping Address</h4>
                                        <p className="text-sm text-slate-600 leading-relaxed">{selectedOrder.address}</p>
                                    </div>
                                </div>

                                <div className="space-y-4 text-right">
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 text-right">Items</h4>
                                        <div className="space-y-1">
                                            {JSON.parse(selectedOrder.products).map((item: any, i: number) => (
                                                <p key={i} className="text-sm text-slate-700">
                                                    {item.quantity}x {item.name}
                                                </p>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 text-right">Tracking ID</h4>
                                            <Input
                                                placeholder="e.g. SF123456789"
                                                value={selectedOrder.tracking_id || ""}
                                                onChange={(e) => setSelectedOrder({ ...selectedOrder, tracking_id: e.target.value })}
                                                onBlur={async (e) => {
                                                    await supabase.from("orders").update({ tracking_id: e.target.value }).eq("id", selectedOrder.id);
                                                    toast({ title: "ID Saved" });
                                                }}
                                                className="text-right h-10 rounded-xl border-slate-200 focus:ring-emerald-500"
                                            />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 text-right">Tracking Link</h4>
                                            <Input
                                                placeholder="https://tracking.link/..."
                                                value={selectedOrder.tracking_number}
                                                onChange={(e) => setSelectedOrder({ ...selectedOrder, tracking_number: e.target.value })}
                                                onBlur={async (e) => {
                                                    await supabase.from("orders").update({ tracking_number: e.target.value }).eq("id", selectedOrder.id);
                                                    toast({ title: "Link Saved" });
                                                }}
                                                className="text-right h-10 rounded-xl border-slate-200 focus:ring-emerald-500"
                                            />
                                        </div>
                                        <p className="text-[10px] text-slate-400 mt-1">Tracking info is automatically included in the 'Shipped' status email.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 pt-8 border-t border-slate-100 flex justify-between items-center">
                                <div className="flex gap-2">
                                    {['Confirmed', 'Shipped', 'Delivered', 'Cancelled'].map((status) => {
                                        const steps = ['Confirmed', 'Shipped', 'Delivered'];
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
                                                onClick={() => setConfirmAction({ type: 'status', value: status })}
                                                className={cn(
                                                    "transition-all px-4 rounded-full",
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
                                <div className="text-right">
                                    <p className="text-xs text-slate-400">Total Price</p>
                                    <p className="text-2xl font-bold text-slate-900">₹{selectedOrder.total_price.toLocaleString()}</p>
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
                <AlertDialogContent className="bg-white rounded-3xl font-manrope">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {confirmAction?.type === 'status'
                                ? `You are changing the order status to ${confirmAction.value}. This will send an automated email update to the customer.`
                                : "This will send the current tracking link/ID to the customer via email. Please ensure the link is correct."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-primary text-white rounded-full"
                            onClick={() => {
                                if (confirmAction?.type === 'status') {
                                    updateStatus(selectedOrder.id, confirmAction.value!);
                                }
                                setConfirmAction(null);
                            }}
                        >
                            Yes, send notification
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default OrderManagement;
