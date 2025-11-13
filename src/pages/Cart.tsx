import { Button } from "@/components/ui/button";

const cartItems = [
  {
    id: 1,
    name: "Celestial Pendant",
    description: "Radiant vermeil pendant with hand-set crystals.",
    price: "₹4,999",
    image: "/src/assets/product-1.jpg",
    quantity: 1,
  },
  {
    id: 2,
    name: "Aurora Hoops",
    description: "Lightweight statement hoops in a champagne finish.",
    price: "₹3,799",
    image: "/src/assets/product-2.jpg",
    quantity: 2,
  },
];

const Cart = () => {
  return (
    <main className="min-h-screen pt-24 pb-16 bg-gradient-champagne/30">
      <section className="px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-10 animate-fade-in">
            <p className="uppercase tracking-[0.35em] text-xs text-muted-foreground mb-3">Your Cart</p>
            <h1 className="font-cormorant text-4xl md:text-5xl font-semibold text-gradient-rose">
              Curate your luminous ensemble
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto mt-4">
              Review your selection of handcrafted jewels. Each Lumi piece is finished to order with meticulous artistry.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-6 p-6 rounded-2xl bg-card shadow-soft hover:shadow-glow transition-all duration-500"
                >
                  <div className="w-full sm:w-40 aspect-square overflow-hidden rounded-xl">
                    <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="font-cormorant text-2xl font-semibold text-foreground">{item.name}</h2>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                      <span className="font-medium text-primary text-lg">{item.price}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span className="px-3 py-1 rounded-full border border-border">Quantity: {item.quantity}</span>
                      <button
                        type="button"
                        className="underline underline-offset-4 hover:text-primary transition-colors"
                      >
                        Move to wishlist
                      </button>
                      <button
                        type="button"
                        className="underline underline-offset-4 hover:text-primary transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <Button variant="outline" className="w-full sm:w-auto border-primary text-primary hover:bg-gradient-rose hover:text-primary-foreground">
                Continue shopping
              </Button>
            </div>

            <aside className="p-6 rounded-2xl bg-card shadow-soft space-y-6 animate-fade-in">
              <div>
                <h2 className="font-cormorant text-2xl font-semibold mb-2">Order Summary</h2>
                <p className="text-sm text-muted-foreground">
                  Shipping and taxes are calculated at checkout. Enjoy complimentary gift wrapping on every order.
                </p>
              </div>

              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span>₹12,597</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Shipping</span>
                  <span>Calculated at checkout</span>
                </div>
                <div className="flex items-center justify-between font-medium text-foreground text-base border-t border-border/50 pt-3">
                  <span>Total</span>
                  <span>₹12,597</span>
                </div>
              </div>

              <div className="space-y-3">
                <Button className="w-full rounded-full bg-gradient-rose text-primary-foreground hover:shadow-glow">
                  Proceed to checkout
                </Button>
                <Button variant="ghost" className="w-full text-muted-foreground hover:text-primary">
                  Checkout with WhatsApp
                </Button>
              </div>

              <div className="rounded-xl border border-border/50 bg-background/80 p-4 text-xs text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Need styling help?</p>
                <p>Message our concierge team at +91 90254 21149 for curated looks and bespoke sizing advice.</p>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Cart;
