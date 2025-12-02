import express from "express";
const router = express.Router();
import {
  createMealsHandler,
  getDailyStatusHandler,
} from "../controllers/meal.controller";
import { authenticateToken } from "../middleware/auth.middleware.js";

router.post("/", authenticateToken, createMealsHandler);

router.get("/dailyStatus", authenticateToken, getDailyStatusHandler);

export default router;
