import { Button } from "@/components/ui/button";
import { useCart } from "@/context/cart";
import { Link } from "react-router-dom";

const formatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const Cart = () => {
  const { items, subtotal, totalQuantity, updateQuantity, removeItem, clearCart } = useCart();
  const hasItems = items.length > 0;

  const handleQuantityChange = (id: number | string, delta: number) => {
    const current = items.find((item) => item.id === id);
    if (!current) return;
    const nextQuantity = current.quantity + delta;
    updateQuantity(id, Math.max(0, nextQuantity));
  };

  const formattedSubtotal = formatter.format(subtotal);

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
              {hasItems ? (
                items.map((item) => (
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
                        </div>
                        <span className="font-medium text-primary text-lg">{formatter.format(item.price * item.quantity)}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <div className="inline-flex items-center rounded-full border border-border/80 bg-background/80">
                          <button
                            type="button"
                            className="px-3 py-1 text-lg font-medium hover:text-primary transition-colors"
                            onClick={() => handleQuantityChange(item.id, -1)}
                          >
                            −
                          </button>
                          <span className="px-4 py-1 text-sm font-medium text-foreground">{item.quantity}</span>
                          <button
                            type="button"
                            className="px-3 py-1 text-lg font-medium hover:text-primary transition-colors"
                            onClick={() => handleQuantityChange(item.id, 1)}
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          className="underline underline-offset-4 hover:text-primary transition-colors"
                          onClick={() => removeItem(item.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 rounded-2xl bg-card shadow-soft text-center space-y-4">
                  <h2 className="font-cormorant text-3xl text-gradient-rose">Your cart is waiting to be adorned</h2>
                  <p className="text-muted-foreground">Select a jewel that reflects your radiance and it will appear here.</p>
                  <Button asChild className="rounded-full bg-gradient-rose text-primary-foreground hover:shadow-glow">
                    <Link to="/products">Discover the collection</Link>
                  </Button>
                </div>
              )}

              {hasItems && (
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    className="border-primary text-primary hover:bg-gradient-rose hover:text-primary-foreground"
                    onClick={() => clearCart()}
                  >
                    Clear cart
                  </Button>
                  <Button asChild variant="outline" className="border-primary text-primary hover:bg-gradient-rose hover:text-primary-foreground">
                    <Link to="/products">Continue shopping</Link>
                  </Button>
                </div>
              )}
            </div>

            <aside className="p-6 rounded-2xl bg-card shadow-soft space-y-6 animate-fade-in">
              <div>
                <h2 className="font-cormorant text-2xl font-semibold mb-2">Order Summary</h2>
                <p className="text-sm text-muted-foreground">
                  {hasItems
                    ? "Shipping and taxes are calculated at checkout. Enjoy complimentary gift wrapping on every order."
                    : "Your cart is currently empty. When you add jewels, the summary will appear here."}
                </p>
              </div>

              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span>{formattedSubtotal}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Shipping</span>
                  <span>{hasItems ? "Calculated at checkout" : "–"}</span>
                </div>
                <div className="flex items-center justify-between font-medium text-foreground text-base border-t border-border/50 pt-3">
                  <span>Total items</span>
                  <span>{totalQuantity}</span>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  className="w-full rounded-full bg-gradient-rose text-primary-foreground hover:shadow-glow"
                  disabled={!hasItems}
                >
                  Proceed to checkout
                </Button>
                <Button
                  variant="ghost"
                  className="w-full text-muted-foreground hover:text-primary"
                  disabled={!hasItems}
                >
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
