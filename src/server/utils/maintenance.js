import { supabase } from "../lib/supabase.js";
import { getTransporter } from "./email.js";

/**
 * Maintenance Task:
 * 1. Fetches all orders older than 30 days.
 * 2. Generates a CSV report.
 * 3. Emails the report to the admin.
 * 4. Deletes the old records to save space.
 */
export const runOrderCleanup = async () => {
    try {
        console.log("[Maintenance] Starting monthly order cleanup...");

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // 1. Fetch old orders
        const { data: oldOrders, error: fetchError } = await supabase
            .from('orders')
            .select('*')
            .lte('created_at', thirtyDaysAgo.toISOString());

        if (fetchError) throw fetchError;

        if (!oldOrders || oldOrders.length === 0) {
            console.log("[Maintenance] No old orders found for cleanup.");
            return;
        }

        console.log(`[Maintenance] Found ${oldOrders.length} orders to archive.`);

        // 2. Build CSV
        // Header
        let csvContent = "Order ID,Customer Name,Email,Phone,Status,Total Price,Date,Tracking,Products\n";

        oldOrders.forEach(order => {
            const products = JSON.parse(order.products || '[]')
                .map(p => `${p.name}(${p.quantity})`)
                .join('; ');

            const row = [
                order.id,
                `"${order.customer_name}"`,
                order.email,
                order.phone,
                order.status,
                order.total_price,
                new Date(order.created_at).toLocaleDateString(),
                `"${order.tracking_number || ""}"`,
                `"${products}"`
            ].join(',');

            csvContent += row + "\n";
        });

        // 3. Email to Admin
        const transporter = getTransporter();
        const monthYear = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

        await transporter.sendMail({
            from: process.env.EMAIL_FROM || '"XIVI Maintenance" <noreply@xivi.in>',
            to: process.env.OWNER_EMAIL || "hello@xivi.in",
            subject: `Order Archive Report - ${monthYear}`,
            text: `Please find attached the archived orders for ${monthYear}. These orders have been removed from the live database to save space.`,
            attachments: [
                {
                    filename: `XIVI_Orders_Archive_${monthYear.replace(' ', '_')}.csv`,
                    content: csvContent
                }
            ]
        });

        console.log("[Maintenance] Email sent to admin.");

        // 4. Delete from Supabase
        const { error: deleteError } = await supabase
            .from('orders')
            .delete()
            .lte('created_at', thirtyDaysAgo.toISOString());

        if (deleteError) throw deleteError;

        console.log("[Maintenance] Cleanup successful. Records deleted.");

    } catch (error) {
        console.error("[Maintenance] Error during cleanup:", error);
    }
};

// Scheduler logic (Runs check every 24 hours)
export const initMaintenanceScheduler = () => {
    console.log("[Maintenance] Order cleanup scheduler initialized (24h checks).");

    // Check every day
    const checkInterval = 24 * 60 * 60 * 1000;

    setInterval(() => {
        const today = new Date();
        // Run on the 1st of every month
        if (today.getDate() === 1) {
            runOrderCleanup();
        }
    }, checkInterval);
};
