import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit2, Trash2, Eye, EyeOff } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

const CategoryManagement = () => {
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const { toast } = useToast();
    const [formData, setFormData] = useState({ id: "", name: "", visibility: true });

    const fetchCategories = async () => {
        const { data } = await supabase.from("categories").select("*").order("name");
        if (data) setCategories(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (formData.id) {
                await supabase.from("categories").update({ name: formData.name, visibility: formData.visibility }).eq("id", formData.id);
            } else {
                await supabase.from("categories").insert([{ name: formData.name, visibility: formData.visibility }]);
            }
            toast({ title: "Category Saved" });
            setIsDialogOpen(false);
            fetchCategories();
            setFormData({ id: "", name: "", visibility: true });
        } catch (error) {
            toast({ title: "Error", variant: "destructive" });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete category? This will affect products assigned to it.")) return;
        await supabase.from("categories").delete().eq("id", id);
        fetchCategories();
    };

    return (
        <div className="space-y-6 max-w-4xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-2xl font-bold text-slate-800">Silver Collections</h2>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen} modal={false}>
                    <DialogTrigger asChild>
                        <Button className="rounded-full bg-gradient-rose text-white gap-2 w-full md:w-auto">
                            <Plus className="w-4 h-4" /> Create Category
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-white rounded-3xl p-6 md:p-8 w-[95%] md:w-full max-w-lg">
                        <DialogHeader><DialogTitle className="text-2xl">Category Details</DialogTitle></DialogHeader>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Collection Name</Label>
                                <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required className="rounded-xl" />
                            </div>
                            <div className="flex items-center gap-2 cursor-pointer pt-2" onClick={() => setFormData({ ...formData, visibility: !formData.visibility })}>
                                {formData.visibility ? <Eye className="w-5 h-5 text-blue-500" /> : <EyeOff className="w-5 h-5 text-slate-400" />}
                                <span className="text-sm font-medium">{formData.visibility ? "Visible on storefront" : "Hidden from storefront"}</span>
                            </div>
                            <Button type="submit" className="w-full rounded-full bg-gradient-rose h-12">Save Collection</Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="bg-white rounded-3xl shadow-soft border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[600px]">
                        <thead className="bg-slate-50 border-b border-slate-100 font-medium text-slate-500 text-sm">
                            <tr>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {categories.map(cat => (
                                <tr key={cat.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-slate-700">{cat.name}</td>
                                    <td className="px-6 py-4">
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${cat.visibility ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                                            {cat.visibility ? "Visible" : "Hidden"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => { setFormData(cat); setIsDialogOpen(true); }} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 mr-2"><Edit2 className="w-4 h-4" /></button>
                                        <button onClick={() => handleDelete(cat.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-600"><Trash2 className="w-4 h-4" /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CategoryManagement;
