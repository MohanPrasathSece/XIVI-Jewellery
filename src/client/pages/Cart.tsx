import { useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCart } from "@/context/cart";
import { openRazorpayCheckout } from "@/lib/razorpay";
import { getApiUrl } from "@/lib/config";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

const formatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

type CustomerDetails = {
  name: string;
  email: string;
  phone: string;
};

type ShippingAddress = {
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

const createInitialCustomer = (): CustomerDetails => ({
  name: "",
  email: "",
  phone: "",
});

const createInitialAddress = (): ShippingAddress => ({
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "India",
});

const Cart = () => {
  const { items, subtotal, totalQuantity, updateQuantity, removeItem, clearCart } = useCart();
  const { toast } = useToast();
  const [customer, setCustomer] = useState(createInitialCustomer());
  const [address, setAddress] = useState(createInitialAddress());
  const [notes, setNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRazorpayLoading, setIsRazorpayLoading] = useState(false);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const hasItems = items.length > 0;

  const handleQuantityChange = (id: number | string, delta: number) => {
    const current = items.find((item) => item.id === id);
    if (!current) return;
    const nextQuantity = current.quantity + delta;
    updateQuantity(id, Math.max(0, nextQuantity));
  };

  const formattedSubtotal = formatter.format(subtotal);

  const handleCustomerChange = <Field extends keyof CustomerDetails>(field: Field) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setCustomer((prev) => ({ ...prev, [field]: value }));
    };

  const handleAddressChange = <Field extends keyof ShippingAddress>(field: Field) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setAddress((prev) => ({ ...prev, [field]: value }));
    };

  const handleNotesChange = (event: ChangeEvent<HTMLTextAreaElement>) => setNotes(event.target.value);

  const formatAddressForNotes = () => {
    const parts = [
      address.line1,
      address.line2,
      `${address.city}, ${address.state} ${address.postalCode}`.trim(),
      address.country,
    ]
      .filter(Boolean)
      .join(", ");
    return parts;
  };

  const handleCheckout = async () => {
    if (!hasItems) {
      toast({
        title: "Your cart is empty",
        description: "Add a few radiant pieces before checking out.",
        variant: "destructive",
      });
      return;
    }

    const requiredCustomerFields: { value: string; label: string }[] = [
      { value: customer.name.trim(), label: "your full name" },
      { value: customer.email.trim(), label: "your email" },
      { value: customer.phone.trim(), label: "your phone number" },
    ];

    const missingCustomer = requiredCustomerFields.find((field) => !field.value);
    if (missingCustomer) {
      toast({
        title: "Details required",
        description: `Please provide ${missingCustomer.label} to continue.`,
        variant: "destructive",
      });
      return;
    }

    const requiredAddressFields: { value: string; label: string }[] = [
      { value: address.line1.trim(), label: "your address line 1" },
      { value: address.city.trim(), label: "your city" },
      { value: address.state.trim(), label: "your state" },
      { value: address.postalCode.trim(), label: "your postal code" },
      { value: address.country.trim(), label: "your country" },
    ];

    const missingAddress = requiredAddressFields.find((field) => !field.value);
    if (missingAddress) {
      toast({
        title: "Address required",
        description: `Please provide ${missingAddress.label} to continue.`,
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);

      const response = await fetch(`${getApiUrl()}/api/orders/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer,
          shippingAddress: address,
          items,
          notes,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Unable to create order. Please try again.");
      }

      const { razorpayKey, orderId, amount, currency } = data;
      if (!razorpayKey || !orderId) {
        throw new Error("Payment gateway is not configured correctly.");
      }

      setIsRazorpayLoading(true);
      const checkout = await openRazorpayCheckout({
        key: razorpayKey,
        amount,
        currency,
        name: "XIVI",
        description: "Complete your silver ensemble",
        order_id: orderId,
        handler: async (payment) => {
          setIsProcessing(true);
          try {
            const verifyResponse = await fetch(`${getApiUrl()}/api/orders/verify`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpayOrderId: payment.razorpay_order_id,
                razorpayPaymentId: payment.razorpay_payment_id,
                razorpaySignature: payment.razorpay_signature,
              }),
            });

            const verifyData = await verifyResponse.json().catch(() => ({}));
            if (!verifyResponse.ok) {
              throw new Error(verifyData.error || "Payment verification failed.");
            }

            toast({
              title: "Payment successful",
              description: "Thank you for choosing XIVI. We'll send a confirmation email shortly.",
            });
            clearCart();
            setCustomer(createInitialCustomer());
            setAddress(createInitialAddress());
            setNotes("");
            setIsConfirmationOpen(true);
          } catch (error) {
            const message = error instanceof Error ? error.message : "Unable to verify payment.";
            toast({ title: "Verification error", description: message, variant: "destructive" });
          } finally {
            setIsProcessing(false);
          }
        },
        prefill: {
          name: customer.name,
          email: customer.email,
          contact: customer.phone,
        },
        notes: {
          customerNotes: notes || "",
          shippingAddress: formatAddressForNotes(),
        },
        theme: {
          color: "#b83256",
        },
      });

      setIsRazorpayLoading(false);
      (checkout as any)?.on?.("payment.failed", (event: any) => {
        setIsProcessing(false);
        setIsRazorpayLoading(false);
        const description = event?.error?.description || "Payment was not completed.";
        toast({ title: "Payment failed", description, variant: "destructive" });
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to process checkout.";
      toast({ title: "Checkout error", description: message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
      setIsRazorpayLoading(false);
    }
  };

  return (
    <>
      <Dialog open={isConfirmationOpen} onOpenChange={setIsConfirmationOpen}>
        <DialogContent className="max-w-md rounded-3xl border-0 p-0 overflow-hidden bg-[#fff7fb]">
          <div className="bg-gradient-to-br from-[#f8b9d4] via-[#ffd7ef] to-white px-8 py-10 text-center">
            <DialogHeader className="space-y-3 text-center">
              <p className="text-sm tracking-[0.4em] text-[#b83256] uppercase">Order Confirmed</p>
              <DialogTitle className="font-cormorant text-3xl text-[#8a1f3e]">Your radiant pieces are reserved</DialogTitle>
              <DialogDescription className="text-base text-[#5a1a2c]">
                We’re preparing your XIVI order with love. Updates, shipping progress, and tracking will be shared via WhatsApp and email.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-6 space-y-3 text-sm text-[#5a1a2c]">
              <p>• Our concierge team will confirm details on WhatsApp shortly.</p>
              <p>• Tracking information will also arrive in your WhatsApp chat.</p>
              <p>• You can reply there anytime for styling or delivery support.</p>
            </div>
            <Button className="mt-8 rounded-full bg-[#b83256] px-8 py-2 text-white hover:bg-[#a3284b]" onClick={() => setIsConfirmationOpen(false)}>
              Continue exploring XIVI
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <main className="min-h-screen pt-24 pb-16 bg-gradient-champagne/30">
        <section className="px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-10 animate-fade-in">
              <p className="uppercase tracking-[0.35em] text-xs text-muted-foreground mb-3">Your Cart</p>
              <h1 className="font-cormorant text-4xl md:text-5xl font-semibold text-gradient-rose">
                Curate your luminous ensemble
              </h1>
              <p className="text-muted-foreground max-w-2xl mx-auto mt-4">
                Review your selection of handcrafted silver jewels. Each XIVI piece is finished to order with meticulous artistry.
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

                <div className="space-y-1.5 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>Subtotal</span>
                    <span>{formattedSubtotal}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Shipping</span>
                    <span>{hasItems ? "Calculated at checkout" : "–"}</span>
                  </div>
                  <div className="flex items-center justify-between font-medium text-foreground text-base border-t border-border/50 pt-2.5">
                    <span>Total items</span>
                    <span>{totalQuantity}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-cormorant text-xl font-semibold">Delivery Details</h3>
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <Label htmlFor="cust-name">Full name</Label>
                      <Input id="cust-name" autoComplete="name" value={customer.name} onChange={handleCustomerChange("name")} disabled={!hasItems || isProcessing} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="cust-email">Email</Label>
                        <Input id="cust-email" type="email" autoComplete="email" value={customer.email} onChange={handleCustomerChange("email")} disabled={!hasItems || isProcessing} />
                      </div>
                      <div>
                        <Label htmlFor="cust-phone">Phone</Label>
                        <Input id="cust-phone" type="tel" autoComplete="tel" value={customer.phone} onChange={handleCustomerChange("phone")} disabled={!hasItems || isProcessing} />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="addr-line1">Address line 1</Label>
                      <Input id="addr-line1" autoComplete="address-line1" value={address.line1} onChange={handleAddressChange("line1")} disabled={!hasItems || isProcessing} />
                    </div>
                    <div>
                      <Label htmlFor="addr-line2">Address line 2 (optional)</Label>
                      <Input id="addr-line2" autoComplete="address-line2" value={address.line2} onChange={handleAddressChange("line2")} disabled={!hasItems || isProcessing} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="addr-city">City</Label>
                        <Input id="addr-city" autoComplete="address-level2" value={address.city} onChange={handleAddressChange("city")} disabled={!hasItems || isProcessing} />
                      </div>
                      <div>
                        <Label htmlFor="addr-state">State</Label>
                        <Input id="addr-state" autoComplete="address-level1" value={address.state} onChange={handleAddressChange("state")} disabled={!hasItems || isProcessing} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="addr-postal">Postal code</Label>
                        <Input id="addr-postal" autoComplete="postal-code" value={address.postalCode} onChange={handleAddressChange("postalCode")} disabled={!hasItems || isProcessing} />
                      </div>
                      <div>
                        <Label htmlFor="addr-country">Country</Label>
                        <Input id="addr-country" value={address.country} onChange={handleAddressChange("country")} disabled={!hasItems || isProcessing} />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="order-notes">Notes (optional)</Label>
                      <Textarea id="order-notes" value={notes} onChange={handleNotesChange} disabled={!hasItems || isProcessing} />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    className="w-full rounded-full bg-gradient-rose text-primary-foreground hover:shadow-glow"
                    disabled={!hasItems || isProcessing || isRazorpayLoading}
                    onClick={handleCheckout}
                  >
                    {isProcessing
                      ? "Processing..."
                      : isRazorpayLoading
                        ? "Opening payment..."
                        : "Proceed to checkout"}
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full text-muted-foreground hover:text-primary"
                    disabled
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
    </>
  );
};

export default Cart;
