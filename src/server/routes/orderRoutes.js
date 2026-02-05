import express from "express";
import { createOrder, verifyPayment, updateOrderStatus } from "../controllers/orderController.js";
import { runOrderCleanup } from "../utils/maintenance.js";

const router = express.Router();

router.post("/create", createOrder);
router.post("/verify", verifyPayment);
router.post("/update-status", updateOrderStatus);
router.post("/cleanup", async (req, res) => {
    try {
        await runOrderCleanup();
        res.json({ message: "Cleanup triggered successfully. Check admin email." });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
