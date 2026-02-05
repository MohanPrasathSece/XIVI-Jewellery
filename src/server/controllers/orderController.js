import crypto from "crypto";
// MongoDB import removed - migrating to Supabase
import { getRazorpayClient } from "../lib/razorpay.js";
import { sendOrderEmails, sendStatusUpdateEmail, sendLowStockEmail } from "../utils/email.js";
import { supabase } from "../lib/supabase.js";

import { z } from "zod";

const orderSchema = z.object({
  customer: z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    phone: z.string().min(10).max(15),
  }),
  shippingAddress: z.object({
    line1: z.string().min(5),
    line2: z.string().optional(),
    city: z.string().min(2),
    state: z.string().min(2),
    postalCode: z.string().min(5).max(10),
    country: z.string().min(2),
  }),
  items: z.array(z.object({
    id: z.union([z.string(), z.number()]),
    name: z.string(),
    price: z.number().positive(),
    quantity: z.number().int().positive(),
  })).min(1),
  notes: z.string().max(500).optional(),
  isGift: z.boolean().optional(),
});

const verifyRequiredFields = (data) => {
  const result = orderSchema.safeParse(data);
  if (!result.success) {
    const errorMsg = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    throw new Error(`Data validation failed: ${errorMsg}`);
  }
  return result.data;
};

const calculateAmounts = (items) => {
  const amount = items.reduce((total, item) => {
    const itemPrice = Number(item.price) || 0;
    const itemQty = Number(item.quantity) || 0;
    return total + itemPrice * itemQty;
  }, 0);

  const amountInPaise = Math.round(amount * 100);

  if (!amountInPaise) {
    throw new Error("Order amount must be greater than zero.");
  }

  return { amount, amountInPaise };
};

export const createOrder = async (req, res) => {
  try {
    const razorpayClient = getRazorpayClient();
    if (!razorpayClient) {
      const missing = [];
      if (!process.env.RAZORPAY_KEY_ID) missing.push("RAZORPAY_KEY_ID");
      if (!process.env.RAZORPAY_KEY_SECRET) missing.push("RAZORPAY_KEY_SECRET");
      return res.status(500).json({
        error: "Payment gateway not configured",
        details: `Missing: ${missing.join(", ")}. Please add these to your Vercel Environment Variables.`
      });
    }

    if (!supabase) {
      const missing = [];
      if (!process.env.VITE_SUPABASE_URL) missing.push("VITE_SUPABASE_URL");
      if (!process.env.VITE_SUPABASE_ANON_KEY) missing.push("VITE_SUPABASE_ANON_KEY");
      return res.status(500).json({
        error: "Database not configured",
        details: `Missing: ${missing.join(", ")}. Please add these to your Vercel Environment Variables.`
      });
    }

    const validatedData = verifyRequiredFields(req.body);
    const { customer, shippingAddress, items, notes, isGift } = validatedData;

    // Append gift option to notes
    let finalNotes = notes || "";
    if (isGift) {
      finalNotes = finalNotes ? `${finalNotes} | GIFT OPTION: YES` : "GIFT OPTION: YES";
    }

    const { amount, amountInPaise } = calculateAmounts(items);

    const razorpayOrder = await razorpayClient.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `lumi_${Date.now()}`,
      notes: {
        customerEmail: customer.email,
        customerName: customer.name,
      },
    });

    if (!supabase) {
      return res.status(500).json({ error: "Supabase is not configured." });
    }

    const { data: supaOrder, error: supaError } = await supabase.from("orders").insert([{
      razorpay_order_id: razorpayOrder.id,
      total_price: amount,
      currency: razorpayOrder.currency,
      status: "pending",
      customer_name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: `${shippingAddress.line1}, ${shippingAddress.line2 || ""}, ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.postalCode}, ${shippingAddress.country}`,
      products: JSON.stringify(items),
      notes: finalNotes
    }]).select().single();

    if (supaError) {
      console.error("Supabase order creation failed:", supaError);
      return res.status(500).json({
        error: "Database error",
        details: supaError.message,
        hint: "Make sure you have run the ALTER TABLE SQL commands in Supabase Editor."
      });
    }

    return res.json({
      success: true,
      message: "Order created",
      orderId: razorpayOrder.id,
      amount: amountInPaise,
      currency: razorpayOrder.currency,
      razorpayKey: razorpayClient.key_id,
      order: {
        id: supaOrder.id,
        status: supaOrder.status,
      },
    });
  } catch (error) {
    console.error("Failed to create order:", error);
    return res.status(400).json({ error: error.message || "Unable to create order" });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ error: "Payment verification data is incomplete." });
    }

    if (!supabase) {
      return res.status(500).json({ error: "Supabase status: unavailable" });
    }

    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("*")
      .eq("razorpay_order_id", razorpayOrderId)
      .single();

    if (fetchError || !order) {
      return res.status(404).json({ error: "Order not found." });
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    const isValid = expectedSignature === razorpaySignature;

    if (!isValid) {
      console.warn(`❌ SECURITY ALERT: Invalid payment signature for Order ${order.id}. This could be a fraud attempt.`);
      await supabase.from("orders").update({ status: "failed" }).eq("id", order.id);
      return res.status(400).json({ error: "Invalid payment signature." });
    }

    // Success
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: "Confirmed",
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: razorpaySignature,
        paid_at: new Date().toISOString()
      })
      .eq("id", order.id);

    if (updateError) throw updateError;

    try {
      // Fetch updated order for email
      const { data: updatedOrder } = await supabase.from("orders").select("*").eq("id", order.id).single();

      // STOCK MANAGEMENT LOGIC
      // Parse items
      const items = JSON.parse(updatedOrder.products);

      // We process stock reduction sequentially to avoid race conditions as much as possible without RPC
      for (const item of items) {
        if (!item.id) continue;

        // Fetch current stock
        const { data: product, error: prodError } = await supabase
          .from("products")
          .select("id, stock_quantity, stock_status, name")
          .eq("id", item.id)
          .single();

        if (prodError || !product) {
          console.error(`Could not fetch product ${item.id} for stock reduction`);
          continue;
        }

        // Calculate new stock
        // item.quantity is string usually from JSON, convert to number
        const qtyBought = Number(item.quantity) || 0;
        const currentStock = Number(product.stock_quantity) || 0;
        const newStock = Math.max(0, currentStock - qtyBought);

        const isOutOfStock = newStock === 0;

        // Update product
        await supabase
          .from("products")
          .update({
            stock_quantity: newStock,
            stock_status: isOutOfStock ? false : product.stock_status // Only flip to false if 0, otherwise keep existing (true) or if it was already false (weird but possible)
          })
          .eq("id", item.id);

        // Low Stock Check (threshold < 5)
        if (newStock < 5) {
          sendLowStockEmail({
            productName: product.name,
            productId: item.id,
            remainingStock: newStock
          }).catch(e => console.error("Failed to send low stock alert:", e));
        }
      }

      // Map Supabase order back to expected format for email utils if necessary
      // Background email sending to make checkout "very very fast"
      sendOrderEmails({
        order: {
          ...updatedOrder,
          customer: { name: updatedOrder.customer_name, email: updatedOrder.email, phone: updatedOrder.phone },
          items: JSON.parse(updatedOrder.products),
          amount: updatedOrder.total_price,
          razorpayOrderId: updatedOrder.razorpay_order_id
        }
      }).catch(e => console.error("Background Order Email Failed:", e));

    } catch (saveError) {
      console.error("Failed to send post-payment emails or update stock", saveError);
    }

    return res.json({ success: true, message: "Payment verified", orderId: order.razorpayOrderId });
  } catch (error) {
    console.error("Payment verification failed", error);
    return res.status(400).json({ error: error.message || "Unable to verify payment" });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId, status, trackingNumber, trackingId } = req.body;

    if (!supabase) {
      return res.status(503).json({ error: "Supabase service is not available. Please check environment variables." });
    }

    // Fetch order from Supabase
    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (fetchError || !order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Send email via existing email util
    try {
      // Background email sending
      sendStatusUpdateEmail({
        email: order.email,
        customerName: order.customer_name,
        status,
        orderId: order.id.slice(0, 8),
        trackingNumber: trackingNumber || order.tracking_number,
        trackingId: trackingId || order.tracking_id
      }).catch(e => console.error("Background Status Email Failed:", e));
    } catch (emailErr) {
      console.error("Failed to send status email", emailErr);
    }

    return res.json({ success: true, message: "Status updated and email queued" });
  } catch (error) {
    console.error("Update status failed", error);
    return res.status(500).json({ error: "Interal server error" });
  }
};

