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
    ExternalLink
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

const OrderManagement = () => {
    const [orders, setOrders] = useState<any[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
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
                body: JSON.stringify({ orderId, status: newStatus })
            });

            toast({ title: `Order ${newStatus}` });
            fetchOrders();
            if (selectedOrder) setSelectedOrder({ ...selectedOrder, status: newStatus });
        } catch (error: any) {
            toast({ title: "Update Failed", description: error.message, variant: "destructive" });
        }
    };

    const statusIcons: any = {
        Pending: <Clock className="w-4 h-4 text-amber-500" />,
        Confirmed: <CheckCircle2 className="w-4 h-4 text-blue-500" />,
        Shipped: <Truck className="w-4 h-4 text-purple-500" />,
        Delivered: <CheckCircle2 className="w-4 h-4 text-green-500" />,
        Cancelled: <XCircle className="w-4 h-4 text-red-500" />,
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-3xl shadow-soft border border-slate-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100 font-medium text-slate-500 text-sm">
                        <tr>
                            <th className="px-6 py-4">Order ID</th>
                            <th className="px-6 py-4">Customer</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Total</th>
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
                <DialogContent className="max-w-2xl bg-white rounded-3xl p-8">
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
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 text-right">Tracking</h4>
                                        <Input
                                            placeholder="Add tracking number..."
                                            defaultValue={selectedOrder.tracking_number}
                                            onBlur={async (e) => {
                                                await supabase.from("orders").update({ tracking_number: e.target.value }).eq("id", selectedOrder.id);
                                                toast({ title: "Tracking updated" });
                                            }}
                                            className="text-right h-8 rounded-lg"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 pt-8 border-t border-slate-100 flex justify-between items-center">
                                <div className="flex gap-2">
                                    {['Confirmed', 'Shipped', 'Delivered', 'Cancelled'].map(status => (
                                        <Button
                                            key={status}
                                            variant="outline"
                                            size="sm"
                                            onClick={() => updateStatus(selectedOrder.id, status)}
                                            className={selectedOrder.status === status ? "bg-slate-100 border-slate-300" : ""}
                                        >
                                            {status}
                                        </Button>
                                    ))}
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
        </div>
    );
};

export default OrderManagement;
