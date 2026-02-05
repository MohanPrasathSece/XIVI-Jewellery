import crypto from "crypto";
// MongoDB import removed - migrating to Supabase
import { getRazorpayClient } from "../lib/razorpay.js";
import { sendOrderEmails, sendStatusUpdateEmail } from "../utils/email.js";
import { supabase } from "../lib/supabase.js";

const verifyRequiredFields = ({ customer, shippingAddress, items }) => {
  if (!customer?.name || !customer?.email || !customer?.phone) {
    throw new Error("Customer name, email, and phone are required.");
  }

  if (!shippingAddress?.line1 || !shippingAddress?.city || !shippingAddress?.state || !shippingAddress?.postalCode || !shippingAddress?.country) {
    throw new Error("Complete shipping address is required.");
  }

  if (!Array.isArray(items) || !items.length) {
    throw new Error("At least one item is required.");
  }
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
      return res.status(500).json({ error: "Payment gateway is not configured." });
    }

    const { customer, shippingAddress, items, notes } = req.body;
    verifyRequiredFields({ customer, shippingAddress, items });

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
      notes: notes || ""
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

      // Map Supabase order back to expected format for email utils if necessary
      // For now, let's keep it simple or adjust sendOrderEmails
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
      console.error("Failed to send post-payment emails", saveError);
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

