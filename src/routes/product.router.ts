import express from "express";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { getProductHandler } from "../controllers/product.controller.js";

const router = express.Router();

router.get("/:barcode", authenticateToken, getProductHandler);

export default router;
