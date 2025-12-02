import {
  createMealsWithTracking,
  getDailyStatus,
} from "../services/meal.service";
import { Request, Response } from "express";

interface MealInput {
  foodItemId: number;
  quantity: number;
}
interface AuthenticatedRequest extends Request {
  userId?: number;
  body: MealInput[];
}

export async function createMealsHandler(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const mealsInput = req.body;
    const userId = req.userId;

    if (userId == null) {
      return res.status(401).json({ message: "Authentication required." });
    }

    if (!Array.isArray(mealsInput) || mealsInput.length === 0) {
      return res
        .status(400)
        .json({ message: "Request body must be a non-empty array of meals." });
    }

    const isValid = mealsInput.every(
      (meal) =>
        meal.foodItemId != null && meal.quantity != null && meal.quantity > 0
    );

    if (!isValid) {
      return res.status(400).json({
        message:
          "Each meal must include a valid foodItemId and positive quantity.",
      });
    }

    const result = await createMealsWithTracking(userId, mealsInput);

    return res.status(201).json({
      message: `${result.meals.length} meal(s) created and goal status updated.`,
      meals: result.meals,
      dailyStatus: result.dailyStatus,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("Food item details not found")
    ) {
      return res.status(404).json({ message: error.message });
    }

    console.error("Error creating Meal:", error);
    return res.status(500).json({
      message: "Internal server error. Failed to log meal(s).",
    });
  }
}

export async function getDailyStatusHandler(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const userId = req.userId;

    if (userId == null) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const dailyStatus = await getDailyStatus(userId);
    return res.status(200).json({
      dailyStatus: dailyStatus,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.name.includes("Error retrieving daily status")
    ) {
      return res.status(404).json({ message: error.message });
    }
    console.error("Error getting daily status:", error);
    return res.status(500).json({
      message: "Internal server error. Failed to find daily status.",
    });
  }
}
