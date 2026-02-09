import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit2, Trash2, Gift, Eye, EyeOff } from "lucide-react";

interface GiftingOption {
    id: string;
    name: string;
    description: string;
    price: number;
    is_active: boolean;
}

const GiftingManagement = () => {
    const [options, setOptions] = useState<GiftingOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        id: "",
        name: "",
        description: "",
        price: 0,
        is_active: true,
    });

    const fetchOptions = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("gifting_options")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching gifting options:", error);
        } else if (data) {
            setOptions(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchOptions();

        const subscription = supabase
            .channel("gifting-changes")
            .on("postgres_changes", { event: "*", schema: "public", table: "gifting_options" }, () => {
                fetchOptions();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const payload = {
            name: formData.name,
            description: formData.description,
            price: formData.price,
            is_active: formData.is_active,
        };

        try {
            if (formData.id) {
                const { error } = await supabase
                    .from("gifting_options")
                    .update(payload)
                    .eq("id", formData.id);
                if (error) throw error;
                toast({ title: "Gifting Option Updated" });
            } else {
                const { error } = await supabase.from("gifting_options").insert([payload]);
                if (error) throw error;
                toast({ title: "Gifting Option Created" });
            }
            setIsDialogOpen(false);
            resetForm();
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this gifting option?")) return;

        const { error } = await supabase.from("gifting_options").delete().eq("id", id);
        if (error) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } else {
            toast({ title: "Gifting Option Deleted" });
        }
    };

    const resetForm = () => {
        setFormData({
            id: "",
            name: "",
            description: "",
            price: 0,
            is_active: true,
        });
    };

    const openEdit = (option: GiftingOption) => {
        setFormData({
            id: option.id,
            name: option.name,
            description: option.description || "",
            price: option.price,
            is_active: option.is_active,
        });
        setIsDialogOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-2xl font-bold text-slate-800">Gifting Management</h2>
                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) resetForm();
                }}>
                    <DialogTrigger asChild>
                        <Button className="rounded-full bg-gradient-rose text-white gap-2 shadow-glow w-full md:w-auto">
                            <Plus className="w-4 h-4" /> Add Gifting Option
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md w-[95%] bg-white rounded-3xl p-6 md:p-8">
                        <DialogHeader>
                            <DialogTitle className="text-2xl">{formData.id ? "Edit Gifting Option" : "New Gifting Option"}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Option Name</Label>
                                <Input 
                                    value={formData.name} 
                                    onChange={e => setFormData({ ...formData, name: e.target.value })} 
                                    placeholder="e.g. Luxury Gift Wrap"
                                    required 
                                    className="rounded-xl border-slate-200" 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea 
                                    value={formData.description} 
                                    onChange={e => setFormData({ ...formData, description: e.target.value })} 
                                    placeholder="Brief details about this gifting service..."
                                    className="rounded-xl border-slate-200" 
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Price (₹)</Label>
                                    <Input 
                                        type="number" 
                                        value={formData.price} 
                                        onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} 
                                        required 
                                        className="rounded-xl border-slate-200" 
                                    />
                                </div>
                                <div className="flex items-end pb-1">
                                    <div 
                                        className="flex items-center gap-2 cursor-pointer h-10 px-3 border rounded-xl"
                                        onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                                    >
                                        {formData.is_active ? <Eye className="w-4 h-4 text-blue-500" /> : <EyeOff className="w-4 h-4 text-slate-400" />}
                                        <span className="text-sm font-medium">{formData.is_active ? "Active" : "Hidden"}</span>
                                    </div>
                                </div>
                            </div>
                            <Button type="submit" className="w-full rounded-full bg-gradient-rose text-white h-12 mt-4" disabled={loading}>
                                {loading ? "Processing..." : "Save Gifting Option"}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {options.length === 0 && !loading ? (
                <div className="bg-white rounded-3xl p-12 shadow-soft border border-slate-100 text-center">
                    <Gift className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-800">No gifting options yet</h3>
                    <p className="text-slate-500 mt-2">Create your first dynamic gift option to show it at checkout.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {options.map(option => (
                        <div key={option.id} className="bg-white rounded-3xl p-6 shadow-soft border border-slate-100 group transition-all hover:shadow-glow relative">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                                    <Gift className="w-6 h-6" />
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => openEdit(option)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"><Edit2 className="w-4 h-4" /></button>
                                    <button onClick={() => handleDelete(option.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-600"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                            <h3 className="font-bold text-slate-800 text-lg">{option.name}</h3>
                            <p className="text-slate-500 text-sm mt-1 line-clamp-2 min-h-[40px]">{option.description || "No description provided."}</p>
                            <div className="flex justify-between items-center mt-6">
                                <span className="text-xl font-bold text-slate-900">₹{option.price}</span>
                                <span className={cn(
                                    "text-[10px] px-2 py-1 rounded-full font-bold uppercase",
                                    option.is_active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"
                                )}>
                                    {option.is_active ? "Active" : "Disabled"}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default GiftingManagement;
