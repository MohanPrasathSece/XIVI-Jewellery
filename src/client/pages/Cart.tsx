import { useState, useEffect, type ChangeEvent } from "react";
import { supabase } from "@/lib/supabase";
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
import { cn } from "@/lib/utils";
import { Gift, Maximize2, X } from "lucide-react";

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
  const [isGift, setIsGift] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRazorpayLoading, setIsRazorpayLoading] = useState(false);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [giftingOptions, setGiftingOptions] = useState<any[]>([]);
  const [selectedGiftOption, setSelectedGiftOption] = useState<any>(null);
  const [customGiftText, setCustomGiftText] = useState("");
  const [giftLoading, setGiftLoading] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const hasItems = items.length > 0;

  useEffect(() => {
    const fetchGifting = async () => {
      setGiftLoading(true);
      const { data } = await supabase
        .from("gifting_options")
        .select("*")
        .eq("is_active", true)
        .order("price", { ascending: true });
      if (data) setGiftingOptions(data);
      setGiftLoading(false);
    };
    fetchGifting();
  }, []);

  const handleQuantityChange = (id: number | string, delta: number) => {
    const current = items.find((item) => item.id === id);
    if (!current) return;
    const nextQuantity = current.quantity + delta;
    updateQuantity(id, Math.max(0, nextQuantity));
  };

  const total = subtotal + (selectedGiftOption?.price || 0);
  const formattedSubtotal = formatter.format(subtotal);
  const formattedTotal = formatter.format(total);

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

  const validateDetails = () => {
    if (!hasItems) {
      toast({
        title: "Your cart is empty",
        description: "Add a few radiant pieces before checking out.",
        variant: "destructive",
      });
      return false;
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
      return false;
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
      return false;
    }

    return true;
  };

  const handleWhatsAppCheckout = () => {
    if (!validateDetails()) return;

    const message = `Hello XIVI, I would like to order the following items:

*Items:*
${items.map((item) => `- ${item.name} (x${item.quantity}) - ${formatter.format(item.price * item.quantity)}`).join("\n")}

*Subtotal:* ${formatter.format(subtotal)}
${selectedGiftOption ? `*Gifting:* ${selectedGiftOption.name} (+${formatter.format(selectedGiftOption.price)})` : "*Gifting:* No"}
${customGiftText ? `*Gift Message:* ${customGiftText}` : ""}

*Grand Total: ${formatter.format(total)}*

-------------------
*My Details:*
Name: ${customer.name}
Phone: ${customer.phone}
Email: ${customer.email}

*Shipping Address:*
${formatAddressForNotes()}

${notes ? `*Additional Notes:* ${notes}` : ""}

Please confirm my order. Thank you!`.trim();

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/919742999547?text=${encodedMessage}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleCheckout = async () => {
    if (!validateDetails()) return;

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
          isGift: !!selectedGiftOption,
          giftOptionId: selectedGiftOption?.id,
          giftOptionName: selectedGiftOption?.name,
          giftOptionPrice: selectedGiftOption?.price,
          giftCustomText: customGiftText,
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
            setSelectedGiftOption(null);
            setCustomGiftText("");
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
              <h1 className="font-cormorant text-4xl md:text-5xl font-semibold text-gradient-rose pb-1">
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
                  {selectedGiftOption && (
                    <div className="flex items-center justify-between text-primary">
                      <span>{selectedGiftOption.name}</span>
                      <span>{formatter.format(selectedGiftOption.price)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span>Shipping</span>
                    <span>{hasItems ? "Calculated at checkout" : "–"}</span>
                  </div>
                  <div className="flex items-center justify-between font-semibold text-foreground text-lg border-t border-border/50 pt-2.5">
                    <span>Grand Total</span>
                    <span>{formattedTotal}</span>
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
                    {giftingOptions.length > 0 && (
                      <div className="space-y-3 pt-2">
                        <Label className="text-sm font-semibold">Gifting Options</Label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setSelectedGiftOption(null)}
                            className={cn(
                              "flex flex-col p-3 rounded-2xl border transition-all text-left group",
                              !selectedGiftOption ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:bg-slate-50"
                            )}
                            disabled={!hasItems || isProcessing}
                          >
                            <div className="w-full aspect-square rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 mb-3 group-hover:bg-white transition-colors">
                              <Gift className="w-8 h-8 text-slate-300" />
                            </div>
                            <div className="mt-auto">
                              <span className="text-xs font-bold text-slate-800 block">No Gifting</span>
                              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Free</span>
                            </div>
                          </button>
                          {giftingOptions.map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => setSelectedGiftOption(opt)}
                              className={cn(
                                "flex flex-col p-3 rounded-2xl border transition-all text-left group relative",
                                selectedGiftOption?.id === opt.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:bg-slate-50"
                              )}
                              disabled={!hasItems || isProcessing}
                            >
                              <div className="w-full aspect-square rounded-xl overflow-hidden border border-slate-100 mb-3 bg-white relative">
                                {opt.image_url ? (
                                  <>
                                    <img src={opt.image_url} alt={opt.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    <div
                                      className="absolute top-2 right-2 p-2 bg-white/80 backdrop-blur-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all cursor-zoom-in shadow-sm hover:bg-white"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setZoomedImage(opt.image_url);
                                      }}
                                    >
                                      <Maximize2 className="w-3.5 h-3.5 text-slate-600" />
                                    </div>
                                  </>
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-slate-50">
                                    <Gift className="w-8 h-8 text-slate-200" />
                                  </div>
                                )}
                              </div>
                              <div className="mt-auto space-y-0.5">
                                <span className="text-xs font-bold text-slate-800 line-clamp-1">{opt.name}</span>
                                <span className="text-[10px] text-primary font-bold">{formatter.format(opt.price)}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                        {selectedGiftOption?.allow_custom_text && (
                          <div className="mt-4 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                            <Label htmlFor="custom-gift-text" className="text-sm font-medium text-slate-700">Personalized Message</Label>
                            <Input
                              id="custom-gift-text"
                              placeholder="Type your message here..."
                              value={customGiftText}
                              onChange={(e) => setCustomGiftText(e.target.value)}
                              className="rounded-xl border-primary/20 focus:border-primary"
                              disabled={isProcessing}
                            />
                            <p className="text-[10px] text-muted-foreground italic">This message will be included with your gift.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    className="w-full rounded-full bg-gray-300 text-gray-600 hover:bg-gray-400 hover:text-gray-700"
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
                    className="w-full rounded-full bg-gradient-rose text-primary-foreground hover:shadow-glow"
                    disabled={!hasItems || isProcessing}
                    onClick={handleWhatsAppCheckout}
                  >
                    Checkout with WhatsApp
                  </Button>
                </div>

                <div className="rounded-xl border border-border/50 bg-background/80 p-4 text-xs text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">Need styling help?</p>
                  <p>Message our concierge team at +91 97429 99547 for curated looks and bespoke sizing advice.</p>
                </div>
              </aside>
            </div>
          </div>
        </section>
      </main>
      <Dialog open={!!zoomedImage} onOpenChange={() => setZoomedImage(null)}>
        <DialogContent className="max-w-[90vw] md:max-w-xl p-0 overflow-hidden border-0 bg-transparent shadow-none outline-none">
          <div className="relative w-full">
            {zoomedImage && (
              <img
                src={zoomedImage}
                alt="Zoomed Gift"
                className="w-full h-auto max-h-[85vh] object-contain rounded-3xl shadow-2xl"
              />
            )}
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute top-4 right-4 p-3 bg-white/90 backdrop-blur-sm rounded-full text-slate-800 hover:bg-white transition-all shadow-xl hover:scale-110 active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Cart;
