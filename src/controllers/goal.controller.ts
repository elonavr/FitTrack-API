import { cteateGoalPlan } from "../services/goal.service";
import { Request, Response } from "express";

interface GoalPlanRequestBody {
  goalName?: string;
  calorieGoal?: number;
  proteinGoal?: number;
  carbGoal?: number;
  fatGoal?: number;
}
interface AuthenticatedRequest extends Request {
  userId?: number;
  body: GoalPlanRequestBody;
}

export async function createGoalPlanHandler(
  req: AuthenticatedRequest,
  res: Response
) {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ message: "Authentication required." });
  }
  const { goalName, calorieGoal, proteinGoal, carbGoal, fatGoal } = req.body;
  if (!goalName || !calorieGoal || !proteinGoal || !carbGoal || !fatGoal) {
    return res.status(400).json({ message: "All fields must be full" });
  }
  try {
    const newGoal = await cteateGoalPlan(
      userId,
      goalName,
      calorieGoal,
      proteinGoal,
      carbGoal,
      fatGoal
    );
    return res
      .status(201)
      .json({ message: "Goal plan created successfully.", goal: newGoal });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("Goal plan name must be unique")
    ) {
      return res.status(409).json({ message: error.message });
    }

    console.error("Error creating GoalPlan:", error);
    return res
      .status(500)
      .json({ message: "Failed to create goal plan due to a server error." });
  }
}
