import {
  createFoodItemHandler,
  getFoodItemHandler,
  getAllFoodItemDetailsHandler,
} from "../controllers/foodItem.controller";
import { authenticateToken } from "../middleware/auth.middleware";

import express from "express";

const router = express.Router();

router.post("/", authenticateToken, createFoodItemHandler);

router.get("/:foodItemId", authenticateToken, getFoodItemHandler);

router.get("/", authenticateToken, getAllFoodItemDetailsHandler);

export default router;
