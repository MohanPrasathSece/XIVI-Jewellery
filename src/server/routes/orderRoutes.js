import express from "express";
import { createOrder, verifyPayment, updateOrderStatus } from "../controllers/orderController.js";

const router = express.Router();

router.post("/create", createOrder);
router.post("/verify", verifyPayment);
router.post("/update-status", updateOrderStatus);

export default router;
