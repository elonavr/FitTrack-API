import express from "express";
const router = express.Router();
import { createGoalPlanHandler } from "../controllers/goal.controller";
import { authenticateToken } from "../middleware/auth.middleware.js";

router.post("/", authenticateToken, createGoalPlanHandler);

export default router;
