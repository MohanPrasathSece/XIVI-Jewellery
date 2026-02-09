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
import { Plus, Edit2, Trash2, ImagePlus, Eye, EyeOff, Package, PackageX } from "lucide-react";
import { cn } from "@/lib/utils";

interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    category_id: string;
    stock_status: boolean;
    stock_quantity?: number;
    visibility: boolean;
    images: string[];
}

const ProductManagement = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        id: "",
        name: "",
        description: "",
        price: 0,
        category_id: "",
        stock_status: true,
        stock_quantity: 0,
        visibility: true,
        images: [] as string[],
    });

    const fetchProducts = async () => {
        const { data: productsData } = await supabase
            .from("products")
            .select("*")
            .order("created_at", { ascending: false });

        if (productsData) setProducts(productsData);
        setLoading(false);
    };

    const fetchCategories = async () => {
        const { data } = await supabase.from("categories").select("*");
        if (data) setCategories(data);
    };

    useEffect(() => {
        fetchProducts();
        fetchCategories();

        const subscription = supabase
            .channel("products-changes")
            .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
                fetchProducts();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const payload: any = {
            name: formData.name,
            description: formData.description,
            price: formData.price,
            category_id: formData.category_id || null,
            stock_status: formData.stock_status,
            visibility: formData.visibility,
            images: formData.images,
        };

        // Only include stock_quantity if it's non-zero or we want to track it
        if (formData.stock_quantity !== undefined) {
            payload.stock_quantity = formData.stock_quantity;
        }

        try {
            if (formData.id) {
                const { error } = await supabase
                    .from("products")
                    .update(payload)
                    .eq("id", formData.id);
                if (error) throw error;
                toast({ title: "Product Updated" });
            } else {
                const { error } = await supabase.from("products").insert([payload]);
                if (error) throw error;
                toast({ title: "Product Created" });
            }
            setIsDialogOpen(false);
            resetForm();
            fetchProducts();
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this XIVI masterpiece?")) return;

        const { error } = await supabase.from("products").delete().eq("id", id);
        if (error) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } else {
            toast({ title: "Product Deleted" });
            fetchProducts();
        }
    };

    const resetForm = () => {
        setFormData({
            id: "",
            name: "",
            description: "",
            price: 0,
            category_id: "",
            stock_status: true,
            stock_quantity: 0,
            visibility: true,
            images: [],
        });
    };

    const openEdit = (product: Product) => {
        setFormData({
            ...product,
            stock_quantity: product.stock_quantity ?? 0
        });
        setIsDialogOpen(true);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `products/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('images')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('images')
                .getPublicUrl(filePath);

            setFormData(prev => ({ ...prev, images: [...prev.images, publicUrl] }));
            toast({ title: "Image Uploaded" });
        } catch (error: any) {
            toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-2xl font-bold text-slate-800">Inventory Management</h2>
                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) resetForm();
                }}>
                    <DialogTrigger asChild>
                        <Button className="rounded-full bg-gradient-rose text-white gap-2 shadow-glow w-full md:w-auto">
                            <Plus className="w-4 h-4" /> Add Silver Piece
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl w-[95%] md:w-full bg-white rounded-3xl p-6 md:p-8 max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="text-2xl">{formData.id ? "Edit Silver Piece" : "New Silver Creation"}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Product Name</Label>
                                    <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required className="rounded-xl border-slate-200" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Category</Label>
                                    <select
                                        className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-primary outline-none"
                                        value={formData.category_id}
                                        onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} required className="rounded-xl border-slate-200" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Price (₹)</Label>
                                    <Input type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} required className="rounded-xl border-slate-200" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Stock Quantity</Label>
                                    <Input type="number" value={formData.stock_quantity ?? 0} onChange={e => setFormData({ ...formData, stock_quantity: Number(e.target.value) })} className="rounded-xl border-slate-200" />
                                </div>
                                <div className="flex gap-4 items-end pb-1 pt-2 md:pt-0">
                                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => setFormData({ ...formData, stock_status: !formData.stock_status })}>
                                        {formData.stock_status ? <Package className="w-5 h-5 text-green-500" /> : <PackageX className="w-5 h-5 text-red-500" />}
                                        <span className="text-sm font-medium">{formData.stock_status ? "In Stock" : "Out of Stock"}</span>
                                    </div>
                                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => setFormData({ ...formData, visibility: !formData.visibility })}>
                                        {formData.visibility ? <Eye className="w-5 h-5 text-blue-500" /> : <EyeOff className="w-5 h-5 text-slate-400" />}
                                        <span className="text-sm font-medium">{formData.visibility ? "Visible" : "Hidden"}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Images</Label>
                                <div className="flex flex-wrap gap-2">
                                    {formData.images.map((url, i) => (
                                        <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border">
                                            <img src={url} className="w-full h-full object-cover" />
                                            <button type="button" onClick={() => setFormData({ ...formData, images: formData.images.filter((_, idx) => idx !== i) })} className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl">
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                    <Label className="w-20 h-20 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 border-slate-300">
                                        <ImagePlus className="w-6 h-6 text-slate-400" />
                                        <span className="text-[10px] mt-1">Upload</span>
                                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={loading} />
                                    </Label>
                                </div>
                            </div>

                            <Button type="submit" className="w-full rounded-full bg-gradient-rose text-white h-12" disabled={loading}>
                                {loading ? "Processing..." : "Save XIVI Piece"}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {products.map(product => {
                    const cat = categories.find(c => c.id === product.category_id);
                    return (
                        <div key={product.id} className="bg-white rounded-3xl p-4 shadow-soft border border-slate-100 flex flex-col sm:flex-row gap-4 group transition-all hover:shadow-glow">
                            <div className="w-full sm:w-24 h-40 sm:h-24 rounded-2xl overflow-hidden shadow-sm shrink-0">
                                <img
                                    src={(Array.isArray(product.images) && product.images.length > 0) ? product.images[0] : "/placeholder.jpg"}
                                    className="w-full h-full object-cover"
                                    alt={product.name}
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between">
                                    <span className="text-xs font-bold text-primary uppercase tracking-wider">{cat?.name || "Uncategorized"}</span>
                                    <div className="flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openEdit(product)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600"><Edit2 className="w-4 h-4" /></button>
                                        <button onClick={() => handleDelete(product.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-600"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </div>
                                <h3 className="font-bold text-slate-800 truncate pr-8">{product.name}</h3>
                                <p className="text-lg font-bold text-slate-900 mt-1">₹{product.price.toLocaleString()}</p>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${product.stock_status ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {product.stock_status ? "In Stock" : "Out of Stock"}
                                    </span>
                                    {product.stock_quantity !== undefined && (
                                        <span className={cn(
                                            "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border",
                                            product.stock_quantity < 5 && product.stock_status
                                                ? "bg-amber-100 text-amber-700 border-amber-200"
                                                : "bg-slate-100 text-slate-800 border-slate-200"
                                        )}>
                                            {product.stock_quantity < 5 && product.stock_status && "Low Stock: "}{product.stock_quantity}
                                        </span>
                                    )}
                                    {!product.visibility && (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-slate-100 text-slate-600">Hidden</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div >
    );
};

export default ProductManagement;
