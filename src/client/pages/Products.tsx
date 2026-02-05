import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/context/cart";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Search, SlidersHorizontal, ArrowDownWideNarrow, ArrowUpWideNarrow } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import SEO from "@/components/SEO";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"featured" | "price-low" | "price-high">("featured");

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
    // Only scroll if the grid top is above the current view area
    if (rect.top < 0) {
      const offset = window.pageYOffset + rect.top - 160;
      window.scrollTo({ top: Math.max(offset, 0), behavior: "smooth" });
    }
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

  const parsePrice = (price: string | number) => {
    if (typeof price === "number") return price;
    return Number(price.replace(/[^0-9.-]+/g, "")) || 0;
  };

  const filteredProducts = useMemo(() => {
    let base = selectedCategory === "All" ? products : products.filter((product) => product.category === selectedCategory);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      base = base.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }

    return [...base].sort((a, b) => {
      if (sortBy === "price-low") return parsePrice(a.price) - parsePrice(b.price);
      if (sortBy === "price-high") return parsePrice(b.price) - parsePrice(a.price);
      return Number(!!b.featured) - Number(!!a.featured);
    });
  }, [selectedCategory, products, searchQuery, sortBy]);

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
  const productListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": filteredProducts.slice(0, 20).map((product, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Product",
        "url": `https://xivi.in/products?category=${product.category}&id=${product.id}`,
        "name": product.name,
        "image": product.image.startsWith("http") ? product.image : `https://xivi.in${product.image}`,
        "description": `Handcrafted 925 silver ${product.name} from XIVI.`,
        "offers": {
          "@type": "Offer",
          "price": parsePrice(product.price),
          "priceCurrency": "INR",
          "availability": product.stock_status === false ? "https://schema.org/OutOfStock" : "https://schema.org/InStock"
        }
      }
    }))
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://xivi.in/"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Products",
        "item": "https://xivi.in/products"
      },
      ...(selectedCategory !== "All" ? [{
        "@type": "ListItem",
        "position": 3,
        "name": selectedCategory,
        "item": `https://xivi.in/products?category=${selectedCategory}`
      }] : [])
    ]
  };

  const collectionPageSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "mainEntity": productListSchema,
    "name": selectedCategory === "All" ? "Lumi Co Silver Collection" : `${selectedCategory} Collection`,
    "description": `Browse our exclusive collection of ${selectedCategory.toLowerCase()} handcrafted from pure 925 silver.`
  };

  return (
    <main className="min-h-screen pt-16">
      <SEO
        title={selectedCategory === "All" ? "Shop All Silver Jewellery" : `${selectedCategory} Collection`}
        description={`Explore our ${selectedCategory.slice(0, 1).toLowerCase() + selectedCategory.slice(1)} collection. XIVI offers handcrafted 925 silver ${selectedCategory.toLowerCase()} for every occasion.`}
        canonicalUrl={selectedCategory === "All" ? "/products" : `/products?category=${selectedCategory}`}
        schemas={[productListSchema, breadcrumbSchema, collectionPageSchema]}
      />
      <section className="py-12 px-4 bg-gradient-champagne">
        <div className="container mx-auto text-center">
          <h1 className="font-playfair text-4xl md:text-6xl font-bold mb-4 md:mb-6">
            Silver <span className="text-gradient-rose">Collection</span>
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
            Discover timeless silver pieces crafted with love, designed to celebrate your unique beauty.
          </p>
        </div>
      </section>

      <section className="sticky top-16 md:top-14 bg-background/95 backdrop-blur-sm z-40 border-b border-border/50 shadow-sm">
        <div className="container mx-auto py-3 md:py-4 px-4">
          <div className="flex flex-col md:flex-row gap-3 md:gap-4 items-center justify-between">
            {/* Category Filter */}
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto no-scrollbar scroll-smooth py-1 mt-1 md:mt-0">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  onClick={() => updateCategory(category)}
                  className={cn(
                    "h-8 md:h-10 text-xs md:text-sm px-4 md:px-6 rounded-full whitespace-nowrap transition-all duration-300",
                    selectedCategory === category
                      ? "bg-gradient-rose text-white border-transparent shadow-soft"
                      : "bg-white/50 border-slate-200 text-slate-600 hover:border-primary/50"
                  )}
                >
                  {category}
                </Button>
              ))}
            </div>

            {/* Search and Sort */}
            <div className="flex items-center gap-2 w-full md:w-64 lg:w-96">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search pieces..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 rounded-full border-slate-200 focus:ring-primary h-9 md:h-10 w-full bg-white/50"
                />
              </div>
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-full shrink-0 border-slate-200 h-9 w-9 md:h-10 md:w-10 bg-white/50">
                    <SlidersHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white/95 backdrop-blur-md border-slate-100 rounded-xl shadow-glow p-1">
                  <DropdownMenuItem
                    onClick={() => setSortBy("featured")}
                    className={cn("flex justify-between rounded-lg px-3 py-2 cursor-pointer transition-colors", sortBy === "featured" ? "bg-primary/5 text-primary font-bold" : "hover:bg-slate-50")}
                  >
                    Featured {sortBy === "featured" && "✓"}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setSortBy("price-low")}
                    className={cn("flex justify-between rounded-lg px-3 py-2 cursor-pointer transition-colors", sortBy === "price-low" ? "bg-primary/5 text-primary font-bold" : "hover:bg-slate-50")}
                  >
                    Price: Low to High <ArrowUpWideNarrow className="w-3 h-3 ml-2" />
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setSortBy("price-high")}
                    className={cn("flex justify-between rounded-lg px-3 py-2 cursor-pointer transition-colors", sortBy === "price-high" ? "bg-primary/5 text-primary font-bold" : "hover:bg-slate-50")}
                  >
                    Price: High to Low <ArrowDownWideNarrow className="w-3 h-3 ml-2" />
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </section>

      <section className="py-10 px-4">
        <div className="container mx-auto">
          <div className="mb-6 text-center h-6"> {/* Fixed height to prevent layout shift */}
            <p className="text-muted-foreground animate-fade-in">
              {filteredProducts.length === 0 ? "No pieces matching your selection" : `Showing ${filteredProducts.length} ${filteredProducts.length === 1 ? "piece" : "pieces"}`}
            </p>
          </div>

          <div ref={gridRef} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
            {filteredProducts.map((product, index) => (
              <div
                key={product.id}
                className={`group bg-card rounded-xl md:rounded-2xl overflow-hidden shadow-soft hover:shadow-glow transition-all duration-500 animate-fade-in ${product.stock_status === false ? "opacity-75 grayscale-[0.5]" : ""}`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="aspect-square overflow-hidden relative bg-slate-100">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-125 group-hover:brightness-105"
                    loading="lazy"
                  />
                  {product.stock_status === false && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px]">
                      <span className="bg-white/90 text-slate-900 px-3 py-1 rounded-full text-[10px] md:text-xs font-bold tracking-widest uppercase">Out of Stock</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
                <div className="p-3 md:p-5">
                  <h3 className="font-playfair text-sm md:text-lg font-medium mb-0.5 md:mb-1 truncate">
                    {product.name}
                  </h3>
                  <p className="text-[10px] md:text-sm text-muted-foreground mb-2 md:mb-3">
                    {product.category}
                  </p>
                  <p className="text-primary text-base md:text-xl font-medium mb-3 md:mb-4">
                    {typeof product.price === "number" ? `₹${product.price.toLocaleString()}` : product.price}
                  </p>
                  <Button
                    variant="outline"
                    className="w-full h-8 md:h-10 text-[10px] md:text-sm border-primary text-primary hover:bg-gradient-rose hover:text-primary-foreground hover:border-transparent transition-all duration-300 rounded-full"
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

