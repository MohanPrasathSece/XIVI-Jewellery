import nodemailer from "nodemailer";

let transporter;

export const getTransporter = () => {
  if (transporter) return transporter;
  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
  } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    console.warn("⚠️ Email credentials missing. Emails will not be sent.");
    return null;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  return transporter;
};

export const sendMail = async ({ to, subject, html }) => {
  const mailer = getTransporter();
  if (!mailer) {
    console.warn("Skipping email send because transporter is not configured.");
    return;
  }

  await mailer.sendMail({
    from: (process.env.EMAIL_FROM || process.env.SMTP_USER),
    to,
    subject,
    html,
  });
};

export const sendOrderEmails = async ({ order }) => {
  const formattedItems = order.items
    .map(
      (item) => `
        <tr>
          <td style="padding: 6px 12px; border: 1px solid #eee;">${item.name}</td>
          <td style="padding: 6px 12px; border: 1px solid #eee;">${item.quantity}</td>
          <td style="padding: 6px 12px; border: 1px solid #eee;">₹${item.price.toLocaleString("en-IN")}</td>
        </tr>
      `
    )
    .join("");

  const orderTable = `
    <table style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif;">
      <thead>
        <tr>
          <th style="padding: 8px 12px; text-align: left; background: #f7f1ff; border: 1px solid #eee;">Product</th>
          <th style="padding: 8px 12px; text-align: left; background: #f7f1ff; border: 1px solid #eee;">Qty</th>
          <th style="padding: 8px 12px; text-align: left; background: #f7f1ff; border: 1px solid #eee;">Price</th>
        </tr>
      </thead>
      <tbody>${formattedItems}</tbody>
    </table>
  `;

  let addressBlock = "";
  if (order.shippingAddress && typeof order.shippingAddress === 'object') {
    addressBlock = `
      <p style="margin:0;">${order.shippingAddress.line1 || ""}</p>
      ${order.shippingAddress.line2 ? `<p style="margin:0;">${order.shippingAddress.line2}</p>` : ""}
      <p style="margin:0;">${order.shippingAddress.city || ""}, ${order.shippingAddress.state || ""} ${order.shippingAddress.postalCode || ""}</p>
      <p style="margin:0;">${order.shippingAddress.country || ""}</p>
    `;
  } else if (order.address) {
    addressBlock = `<p style="margin:0;">${order.address}</p>`;
  }

  const ownerHtml = `
    <h2 style="font-family: 'Playfair Display', serif; color:#9b2241;">New XIVI order</h2>
    <p>A new order has been placed on XIVI.</p>
    <p><strong>Customer:</strong> ${order.customer.name}</p>
    <p><strong>Email:</strong> ${order.customer.email}</p>
    <p><strong>Phone:</strong> ${order.customer.phone}</p>
    <p><strong>Order ID:</strong> ${order.razorpayOrderId}</p>
    <p><strong>Payment ID:</strong> ${order.razorpayPaymentId || "Pending"}</p>
    <h3 style="margin-top:24px;">Items</h3>
    ${orderTable}
    <p style="margin-top:24px;"><strong>Total:</strong> ₹${order.amount.toLocaleString("en-IN")}</p>
    <h3 style="margin-top:24px;">Shipping Address</h3>
    ${addressBlock}
  `;

  const customerHtml = `
    <h2 style="font-family: 'Playfair Display', serif; color:#9b2241;">Thank you for your order!</h2>
    <p>Hello ${order.customer.name},</p>
    <p>We're delighted to confirm your XIVI order. Our artisans will begin preparing your silver pieces.</p>
    <p><strong>Order reference:</strong> ${order.razorpayOrderId}</p>
    <h3 style="margin-top:24px;">Your Selection</h3>
    ${orderTable}
    <p style="margin-top:24px;"><strong>Total paid:</strong> ₹${order.amount.toLocaleString("en-IN")}</p>
    <h3 style="margin-top:24px;">Shipping Address</h3>
    ${addressBlock}
    <p style="margin-top:24px;">We'll send a dispatch update as soon as your silver jewels leave our atelier.</p>
    <p style="margin-top:16px;">With warmth,<br/>XIVI</p>
  `;

  await Promise.all([
    sendMail({ to: (process.env.OWNER_EMAIL || "hello@xivi.in"), subject: "New XIVI Order", html: ownerHtml }),
    sendMail({ to: order.customer.email, subject: "Your XIVI order is confirmed", html: customerHtml }),
  ]);
};

export const sendStatusUpdateEmail = async ({ email, customerName, status, orderId, trackingNumber, trackingId }) => {
  const statusMessages = {
    Confirmed: "Great news! Your silver order has been confirmed and is now being prepared by our master artisans.",
    Shipped: `Your silver adornments are on their way! They've officially left our atelier.`,
    Delivered: "The wait is over! Your XIVI pieces have been delivered. We hope they bring radiance to your day.",
    Cancelled: "Your order has been cancelled as requested or due to processing issues. If this was a mistake, please reach out.",
  };

  const message = statusMessages[status] || `Your order status has been updated to ${status}.`;

  let trackingBlock = "";
  if (status === 'Shipped' && (trackingId || trackingNumber)) {
    trackingBlock = `
      <div style="margin-top: 20px; padding: 15px; background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px;">
        <h4 style="margin: 0 0 10px 0; color: #065f46;">Tracking Information</h4>
        ${trackingId ? `<p style="margin: 5px 0;"><strong>Tracking ID:</strong> ${trackingId}</p>` : ""}
        ${trackingNumber ? `<p style="margin: 5px 0;"><a href="${trackingNumber}" style="color: #059669; font-weight: bold; text-decoration: underline;">Track your package here &rarr;</a></p>` : ""}
      </div>
    `;
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #f0f0f0; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #f8b9d4 0%, #ffd7ef 100%); padding: 32px 24px; text-align: center;">
        <h1 style="margin: 0; color: #8a1f3e; font-size: 28px; font-family: 'Cormorant Garamond', serif;">XIVI</h1>
      </div>
      <div style="padding: 24px; color: #444; line-height: 1.6;">
        <h2 style="color: #8a1f3e;">Order Update: ${status}</h2>
        <p>Dear ${customerName},</p>
        <p>${message}</p>
        ${trackingBlock}
        <div style="background: #fdf2f7; padding: 16px; border-radius: 8px; margin: 24px 0;">
          <p style="margin: 0; font-size: 14px; color: #7a1e3a;"><strong>Order ID:</strong> #${orderId}</p>
          <p style="margin: 4px 0 0; font-size: 14px; color: #7a1e3a;"><strong>Status:</strong> ${status}</p>
        </div>
        <p>If you have any questions, simply reply to this email or reach out to us on WhatsApp.</p>
        <p style="margin-top: 32px;">Stay radiant,<br/><strong>Team XIVI</strong></p>
      </div>
    </div>
  `;

  await sendMail({
    to: email,
    subject: `Update on your XIVI Order #${orderId}: ${status}`,
    html
  });
};

export const sendLowStockEmail = async ({ productName, productId, remainingStock }) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px;">
      <div style="background-color: #fff1f2; padding: 24px; text-align: center; border-bottom: 1px solid #e2e8f0;">
        <h2 style="margin: 0; color: #be123c;">Low Stock Alert</h2>
      </div>
      <div style="padding: 24px;">
        <p><strong>Item:</strong> ${productName}</p>
        <p><strong>ID:</strong> ${productId}</p>
        <p><strong>Remaining Quantity:</strong> <span style="font-size: 18px; font-weight: bold; color: #be123c;">${remainingStock}</span></p>
        <p>Please restock this item soon to avoid running out of inventory.</p>
        <div style="margin-top: 24px; text-align: center;">
          <a href="#" style="background-color: #be123c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Manage Inventory</a>
        </div>
      </div>
    </div>
  `;

  await sendMail({
    to: (process.env.OWNER_EMAIL || "admin@example.com"),
    subject: `Running Low: ${productName}`,
    html
  });
};
