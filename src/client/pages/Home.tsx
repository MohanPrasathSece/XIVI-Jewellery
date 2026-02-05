import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/context/cart";
import heroImage from "@/assets/hero-jewelry.jpg";
import product1 from "@/assets/product-1.jpg";
import product2 from "@/assets/product-2.jpg";
import product3 from "@/assets/product-3.jpg";
import product4 from "@/assets/product-4.jpg";
import product5 from "@/assets/product-5.jpg";
import product6 from "@/assets/product-6.jpg";
import { Sparkles, ShieldCheck, Leaf } from "lucide-react";
import SEO from "@/components/SEO";

type FeaturedProduct = {
  id: number;
  name: string;
  price: string;
  image: string;
  category: string;
};

const products: FeaturedProduct[] = [
  { id: 31, name: "Celestial Pendant", price: "₹899", image: product1, category: "Necklaces" },
  { id: 32, name: "Aurora Hoops", price: "₹699", image: product2, category: "Earrings" },
  { id: 33, name: "Whisper Bracelet", price: "₹699", image: product3, category: "Bracelets" },
  { id: 34, name: "Pearl Grace Ring", price: "₹599", image: product4, category: "Rings" },
  { id: 35, name: "Layered Elegance", price: "₹999", image: product5, category: "Jewelry Sets" },
  { id: 36, name: "Crystal Studs", price: "₹499", image: product6, category: "Earrings" },
];

const parsePrice = (price: string) => Number(price.replace(/[^0-9.-]+/g, "")) || 0;

const Home = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { addItem } = useCart();
  const [email, setEmail] = useState("");

  useEffect(() => {
    const state = location.state as { scrollToHero?: boolean } | null;
    if (state?.scrollToHero) {
      document.getElementById("hero")?.scrollIntoView({ behavior: "smooth" });
      navigate(location.pathname, { replace: true, state: { ...state, scrollToHero: false } });
    }
  }, [location.state, location.pathname, navigate]);

  const handleAddToCart = (product: FeaturedProduct) => {
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

  const handleNewsletterSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) {
      toast({
        title: "Email required",
        description: "Please enter your email to subscribe.",
      });
      return;
    }

    toast({
      title: "Subscription confirmed",
      description: "You're on the list for XIVI exclusives!",
    });

    setEmail("");
  };

  const handleProductNavigation = (category: string) => {
    navigate(`/products?category=${encodeURIComponent(category)}`);
  };

  const featuredProductsSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Featured Silver Jewellery",
    "itemListElement": products.map((product, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Product",
        "name": product.name,
        "image": `https://xivi.in${product.image}`,
        "description": `Exquisite handcrafted 925 silver ${product.name}.`,
        "offers": {
          "@type": "Offer",
          "price": parsePrice(product.price),
          "priceCurrency": "INR",
          "availability": "https://schema.org/InStock"
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
      }
    ]
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is the purity of XIVI silver jewellery?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Every piece of XIVI jewellery is handcrafted from pure 925 sterling silver, ensuring the highest quality and lasting brilliance."
        }
      },
      {
        "@type": "Question",
        "name": "Is XIVI jewellery handcrafted?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, our artisans blend traditional craftsmanship with modern design, shaping every piece slowly and thoughtfully by hand."
        }
      },
      {
        "@type": "Question",
        "name": "What types of jewellery does XIVI offer?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "XIVI offers a wide range of silver jewellery including celestial pendants, earrings, rings, bracelets, and layered sets."
        }
      }
    ]
  };

  return (
    <main className="min-h-screen">
      <SEO
        title="XIVI | Exquisite Silver Jewellery & Accessories"
        description="Discover XIVI's handcrafted, timeless silver jewellery. Pure 925 sterling silver rings, necklaces, and bracelets designed for elegance."
        canonicalUrl="/"
        schemas={[featuredProductsSchema, breadcrumbSchema, faqSchema]}
        preloadImage={heroImage}
      />
      {/* Hero Section */}
      <section
        id="hero"
        className="relative min-h-screen md:h-screen flex items-center justify-center overflow-hidden pt-32 pb-16 md:pt-0 md:pb-0 font-manrope"
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px]" />
        </div>

        <div className="relative z-10 text-center px-4 animate-fade-in-slow max-w-5xl">
          <p className="text-sm md:text-base tracking-[0.2em] text-muted-foreground mb-5 uppercase font-medium">Premium Silver Jewelry</p>
          <h1 className="font-cormorant text-4xl sm:text-6xl md:text-7xl font-bold mb-6 text-foreground tracking-tight leading-[1.1]">
            Timeless
            <br />
            <span className="text-gradient-rose">Elegance</span>
          </h1>
          <p className="text-sm md:text-lg text-muted-foreground/90 max-w-2xl mx-auto mb-8 font-normal leading-relaxed">
            Discover our exquisite collection of pure 925 silver jewelry, where every piece tells a story of artistry and refinement.
          </p>
          <Button
            asChild
            variant="default"
            size="default"
            className="bg-gradient-rose hover:shadow-glow transition-all duration-500 rounded-full px-10 py-5 text-base border-none"
          >
            <Link to="/products">Explore Collection</Link>
          </Button>
        </div>
      </section>

      {/* Featured Collection / OUR CRAFT */}
      <section id="collection" className="py-12 md:py-24 px-4 bg-gradient-champagne">
        <div className="container mx-auto">
          <div className="text-center mb-10 md:mb-16 animate-fade-in">
            <h2 className="font-cormorant text-2xl sm:text-3xl md:text-5xl font-semibold mb-3 md:mb-4">
              OUR CRAFT
            </h2>
            <div className="w-24 h-1 bg-gradient-rose mx-auto rounded-full" />
          </div>

          <div className="space-y-8">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-100px" }}
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.1,
                  }
                }
              }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8 max-w-6xl mx-auto"
            >
              {products.map((product) => (
                <motion.div
                  key={product.id}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
                  }}
                  className="group bg-card rounded-2xl overflow-hidden shadow-soft hover:shadow-glow hover-lift transition-all duration-500 cursor-pointer"
                  role="button"
                  tabIndex={0}
                  onClick={() => handleProductNavigation(product.category)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleProductNavigation(product.category);
                    }
                  }}
                >
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.name}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  </div>
                  <div className="p-4 md:p-6">
                    <h3 className="font-cormorant text-base md:text-xl font-medium mb-2">
                      {product.name}
                    </h3>
                    <p className="text-primary text-sm md:text-lg font-medium mb-4">
                      {product.price}
                    </p>
                    <Button
                      variant="outline"
                      className="w-full border-primary text-primary hover:bg-gradient-rose hover:text-primary-foreground hover:border-transparent transition-all duration-300"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleAddToCart(product);
                      }}
                    >
                      Add to Cart
                    </Button>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <div className="flex justify-center">
              <Button
                asChild
                variant="default"
                className="rounded-full px-8 py-4 text-base sm:text-lg font-semibold bg-gradient-rose text-primary-foreground hover:shadow-glow hover:scale-[1.02] transition-transform"
              >
                <Link to="/products">View More</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Brand Story / OUR STORY */}
      <section className="py-12 md:py-24 px-4">
        <div className="container mx-auto max-w-4xl text-center animate-fade-in">
          <h2 className="font-cormorant text-2xl sm:text-4xl md:text-5xl font-semibold mb-5 md:mb-8">
            The Art of Silver
          </h2>
          <div className="w-24 h-1 bg-gradient-rose mx-auto rounded-full mb-8" />
          <p className="text-sm md:text-lg text-muted-foreground leading-relaxed mb-6">
            XIVI began as a small dream, built on love and a deep appreciation for timeless 925 silver. Every piece is handcrafted in pure silver, shaped slowly and thoughtfully—because we believe beauty deserves time.
          </p>
          <p className="text-sm md:text-lg text-muted-foreground leading-relaxed">
            Our artisans blend traditional craftsmanship with modern design, creating jewellery that feels personal, effortless, and lasting. At XIVI, we don't just create jewellery—we create pieces that become part of your story.
          </p>
        </div>
      </section>

      {/* Highlights */}
      <section className="py-12 md:py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Highlights */}
          <section className="py-12 md:py-20 px-4">
            <div className="container mx-auto max-w-6xl">
              <motion.div
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-50px" }}
                variants={{
                  hidden: { opacity: 0 },
                  show: {
                    opacity: 1,
                    transition: { staggerChildren: 0.15 }
                  }
                }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8"
              >
                {[
                  { icon: <Sparkles className="w-4 h-4 md:w-6 md:h-6" />, title: "925 Pure Silver", text: "Only the highest quality 925 sterling silver" },
                  { icon: <ShieldCheck className="w-4 h-4 md:w-6 md:h-6" />, title: "Handcrafted", text: "Each piece is made with artisan precision" },
                  { icon: <Leaf className="w-4 h-4 md:w-6 md:h-6" />, title: "Timeless", text: "Designs that transcend fleeting trends" },
                ].map((highlight, i) => (
                  <motion.div
                    key={i}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      show: { opacity: 1, y: 0, transition: { duration: 0.6 } }
                    }}
                    className="bg-card rounded-2xl p-5 md:p-8 shadow-soft hover:shadow-glow transition-smooth text-center"
                  >
                    <div className="w-9 h-9 md:w-12 md:h-12 rounded-full bg-gradient-rose text-primary-foreground flex items-center justify-center mb-4 shadow-glow mx-auto">
                      {highlight.icon}
                    </div>
                    <h3 className="font-cormorant text-lg md:text-2xl mb-2">{highlight.title}</h3>
                    <p className="text-muted-foreground">{highlight.text}</p>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </section>

          {/* Testimonials */}
          <section className="py-12 md:py-24 px-4 bg-gradient-champagne">
            <div className="container mx-auto max-w-6xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-8 md:mb-12"
              >
                <h2 className="font-cormorant text-2xl sm:text-4xl md:text-5xl font-semibold">Celebrated by modern tastemakers</h2>
              </motion.div>
              <motion.div
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={{
                  hidden: { opacity: 0 },
                  show: {
                    opacity: 1,
                    transition: { staggerChildren: 0.2 }
                  }
                }}
                className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-8"
              >
                {["The detailing rivals my bespoke pieces—every edge feels intentional.", "Effortlessly chic; I layer them from boardroom to after-hours without missing a beat.", "XIVI captures that rare blend of subtlety and statement—I'm constantly asked about them."].map((quote, i) => (
                  <motion.div
                    key={i}
                    variants={{
                      hidden: { opacity: 0, scale: 0.95 },
                      show: { opacity: 1, scale: 1, transition: { duration: 0.5 } }
                    }}
                    className="bg-card rounded-2xl p-4 md:p-6 shadow-soft hover:shadow-glow transition-smooth"
                  >
                    <p className="text-muted-foreground text-sm md:text-base mb-4">“{quote}”</p>
                    <div className="h-1 w-16 bg-gradient-rose rounded-full" />
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </section>

          {/* Newsletter CTA */}
          <section className="py-12 md:py-20 px-4">
            <div className="container mx-auto max-w-3xl text-center">
              <h3 className="font-cormorant text-2xl md:text-4xl mb-3 md:mb-4">Enter the XIVI inner circle</h3>
              <p className="text-muted-foreground text-sm md:text-base mb-5 md:mb-6">Receive private previews, curated silver styling notes, and invitations to limited releases.</p>
              <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3 justify-center max-w-xl mx-auto">
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 min-w-0 rounded-full border bg-background px-5 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Button type="submit" className="rounded-full px-6 bg-gradient-rose text-primary-foreground hover:shadow-glow">Subscribe</Button>
              </form>
            </div>
          </section>
        </main>
        );
};

        export default Home;
