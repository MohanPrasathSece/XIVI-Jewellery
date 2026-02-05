import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/cart";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

// Fallback images if Supabase is empty
import earring1 from "@/assets/products/earring-1.jpg";
import necklace1 from "@/assets/products/necklace-1.jpg";
import bracelet1 from "@/assets/products/bracelet-1.jpg";
import ring1 from "@/assets/products/ring-1.jpg";

type CategoryName = string;

interface Product {
  id: string | number;
  name: string;
  price: string | number;
  category: CategoryName;
  image: string;
  featured?: boolean;
  stock_status?: boolean;
  visibility?: boolean;
}

const MOCK_PRODUCTS: Product[] = [
  { id: 1, name: "Teardrop Elegance", price: "₹699", category: "Earrings", image: earring1, visibility: true, stock_status: true },
  { id: 6, name: "Engraved Bar Necklace", price: "₹899", category: "Necklaces", image: necklace1, visibility: true, stock_status: true },
  { id: 11, name: "Tennis Bracelet", price: "₹799", category: "Bracelets", image: bracelet1, visibility: true, stock_status: true },
  { id: 16, name: "Solitaire Statement", price: "₹999", category: "Rings", image: ring1, visibility: true, stock_status: true },
];

const Products = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { toast } = useToast();

  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [dbCategories, setDbCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSupabaseData = async () => {
    try {
      const { data: catData } = await supabase.from("categories").select("name").eq("visibility", true);
      const { data: prodData } = await supabase
        .from("products")
        .select(`
          *,
          categories(name)
        `)
        .eq("visibility", true);

      if (catData) setDbCategories(["All", ...catData.map(c => c.name)]);
      if (prodData) {
        setDbProducts(prodData.map(p => ({
          ...p,
          category: p.categories?.name || "Uncategorized",
          image: p.images?.[0] || ""
        })));
      }
    } catch (e) {
      console.warn("Supabase fetch failed, using mock data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupabaseData();

    const channel = supabase
      .channel("public-products")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, fetchSupabaseData)
      .on("postgres_changes", { event: "*", schema: "public", table: "categories" }, fetchSupabaseData)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const products = dbProducts.length > 0 ? dbProducts : MOCK_PRODUCTS;
  const categories = dbCategories.length > 0 ? dbCategories : ["All", "Earrings", "Necklaces", "Bracelets", "Rings", "Anklets", "Jewelry Sets"];

  const queryCategory = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const categoryParam = params.get("category");
    if (!categoryParam) return undefined;
    const normalized = categoryParam.replace(/\+/g, " ");
    const match = categories.find((cat) => cat.toLowerCase() === normalized.toLowerCase());
    return match;
  }, [location.search, categories]);

  const [selectedCategory, setSelectedCategory] = useState<string>(queryCategory ?? "All");
  const gridRef = useRef<HTMLDivElement>(null);
  const hasScrolledForQueryRef = useRef(false);

  const scrollToGrid = () => {
    if (!gridRef.current) return;
    const rect = gridRef.current.getBoundingClientRect();
    const offset = window.pageYOffset + rect.top - 160;
    window.scrollTo({ top: Math.max(offset, 0), behavior: "smooth" });
  };

  useEffect(() => {
    if (queryCategory && queryCategory !== selectedCategory) {
      setSelectedCategory(queryCategory);
      if (!hasScrolledForQueryRef.current) {
        requestAnimationFrame(() => scrollToGrid());
        hasScrolledForQueryRef.current = true;
      }
    }
    if (!queryCategory && selectedCategory !== "All") {
      setSelectedCategory("All");
    }
  }, [queryCategory, selectedCategory]);

  const updateCategory = (category: string) => {
    setSelectedCategory(category);
    const params = new URLSearchParams(location.search);
    if (category === "All") {
      params.delete("category");
    } else {
      params.set("category", category);
    }
    navigate({ pathname: location.pathname, search: params.toString() }, { replace: true });
    requestAnimationFrame(() => scrollToGrid());
  };

  const filteredProducts = useMemo(() => {
    const base = selectedCategory === "All" ? products : products.filter((product) => product.category === selectedCategory);
    return [...base].sort((a, b) => Number(!!b.featured) - Number(!!a.featured));
  }, [selectedCategory, products]);

  const parsePrice = (price: string | number) => {
    if (typeof price === 'number') return price;
    return Number(price.replace(/[^0-9.-]+/g, "")) || 0;
  };

  const handleAddToCart = (product: Product) => {
    if (product.stock_status === false) {
      toast({ title: "Out of Stock", description: "This silver piece is currently unavailable.", variant: "destructive" });
      return;
    }
    addItem({
      id: product.id,
      name: product.name,
      price: parsePrice(product.price),
      image: product.image,
      quantity: 1,
    });
    toast({
      title: "Added to your cart",
      description: `${product.name} now awaits in your XIVI collection.`,
    });
  };

  return (
    <main className="min-h-screen pt-16">
      <section className="py-12 px-4 bg-gradient-champagne">
        <div className="container mx-auto text-center animate-fade-in">
          <h1 className="font-playfair text-5xl md:text-6xl font-bold mb-6">
            Silver <span className="text-gradient-rose">Collection</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover timeless silver pieces crafted with love, designed to celebrate your unique beauty.
          </p>
        </div>
      </section>

      <section className="py-4 px-4 border-b border-border/50 sticky top-16 md:top-14 bg-background/95 backdrop-blur-sm z-40">
        <div className="container mx-auto text-center">
          <div className="flex items-center gap-2 overflow-x-auto px-4 pb-2 md:pb-0 md:px-0 md:flex-wrap md:justify-center md:gap-3 scrollbar-thin">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                onClick={() => updateCategory(category)}
                className={
                  selectedCategory === category
                    ? "bg-gradient-rose hover:shadow-glow transition-all duration-500 whitespace-nowrap"
                    : "border-primary/30 text-foreground hover:border-primary hover:bg-accent transition-all duration-300 whitespace-nowrap"
                }
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-10 px-4">
        <div className="container mx-auto">
          <div className="mb-6 text-center">
            <p className="text-muted-foreground">
              Showing {filteredProducts.length} {filteredProducts.length === 1 ? "piece" : "pieces"}
            </p>
          </div>

          <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredProducts.map((product, index) => (
              <div
                key={product.id}
                className={`group bg-card rounded-2xl overflow-hidden shadow-soft hover:shadow-glow hover-lift transition-all duration-500 animate-fade-in ${product.stock_status === false ? 'opacity-75 grayscale-[0.5]' : ''}`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="aspect-square overflow-hidden relative">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  {product.stock_status === false && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="bg-white/90 text-slate-900 px-4 py-1 rounded-full text-xs font-bold tracking-widest uppercase">Out of Stock</span>
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-playfair text-lg font-medium mb-1">
                    {product.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {product.category}
                  </p>
                  <p className="text-primary text-xl font-medium mb-4">
                    {typeof product.price === 'number' ? `₹${product.price.toLocaleString()}` : product.price}
                  </p>
                  <Button
                    variant="outline"
                    className="w-full border-primary text-primary hover:bg-gradient-rose hover:text-primary-foreground hover:border-transparent transition-all duration-300"
                    onClick={() => handleAddToCart(product)}
                    disabled={product.stock_status === false}
                  >
                    {product.stock_status === false ? "Out of Stock" : "Add to Cart"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};

export default Products;
