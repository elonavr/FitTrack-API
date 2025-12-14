import express from "express";
const router = express.Router();
import {
  createGoalPlanHandler,
  getGoalsHandler,
  getGoalPlanHandler,
  pauseGoalHandler,
  activateGoalHandler,
} from "../controllers/goal.controller";
import { authenticateToken } from "../middleware/auth.middleware.js";

router.post("/", authenticateToken, createGoalPlanHandler);

router.get("/", authenticateToken, getGoalsHandler);

router.get("/:id", authenticateToken, getGoalPlanHandler);

router.put("/:id/pause", authenticateToken, pauseGoalHandler);

router.put("/:id/activate", authenticateToken, activateGoalHandler);

export default router;
