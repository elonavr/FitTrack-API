import { Request, Response } from "express";
import {
  createFoodItem,
  getFoodItemDetails,
  getAllFoodItemDetails,
} from "../services/foodItem.service";
import { AuthRequest } from "../middleware/auth.middleware";

interface FoodItemRequestBody {
  foodName?: string;
  caloriesPerServing?: string;
  proteinPerServing?: string;
  carbPerServing?: string;
  fatPerServing?: string;
}

interface FoodItemCreateRequest extends AuthRequest {
  body: FoodItemRequestBody;
}

function isMacroValid(value: any): boolean {
  if (typeof value !== "number" || isNaN(value)) return false;
  if (value < 0) return false;
  return true;
}

export async function createFoodItemHandler(
  req: FoodItemCreateRequest,
  res: Response
) {
  const userId = req.userId;
  if (!userId) {
    return res
      .status(401)
      .json({ message: "Anauthorized request, user id must be valid." });
  }

  const foodName = req.body.foodName
    ? String(req.body.foodName).trim()
    : undefined;

  const {
    caloriesPerServing: rawCalories,
    proteinPerServing: rawProtein,
    carbPerServing: rawCarb,
    fatPerServing: rawFat,
  } = req.body;

  const caloriesPerServing = parseFloat(rawCalories ?? "");
  const proteinPerServing = parseFloat(rawProtein ?? "");
  const carbPerServing = parseFloat(rawCarb ?? "");
  const fatPerServing = parseFloat(rawFat ?? "");

  if (!foodName || foodName.length === 0) {
    return res.status(400).json({ message: "Food Name must be full" });
  }

  if (
    !isMacroValid(caloriesPerServing) ||
    !isMacroValid(proteinPerServing) ||
    !isMacroValid(carbPerServing) ||
    !isMacroValid(fatPerServing)
  ) {
    return res.status(400).json({
      message:
        "All nutritional values must be provided as valid non-negative numbers.",
    });
  }

  try {
    const newFoodItem = await createFoodItem(
      userId,
      foodName,
      String(caloriesPerServing),
      String(proteinPerServing),
      String(carbPerServing),
      String(fatPerServing)
    );
    return res.status(201).json({
      message: "Food item created successfully.",
      foodItem: newFoodItem,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("Food item must be unique for this user.")
    ) {
      return res.status(409).json({ message: error.message });
    }
    console.log("Error creating FoodItem:", error);
    return res
      .status(500)
      .json({ message: "Failed to create Food Item due to a server error." });
  }
}

export async function getFoodItemHandler(req: AuthRequest, res: Response) {
  const userId = req.userId;
  if (!userId) {
    return res
      .status(401)
      .json({ message: "Anauthorized request, user id must be valid." });
  }

  const idString = req.params.foodItemId;
  if (!idString) {
    return res.status(400).json({ BadRequest: "Missing Food Item ID." });
  }
  const foodItemId = parseInt(idString, 10);
  if (isNaN(foodItemId) || foodItemId <= 0) {
    return res
      .status(400)
      .json({ BadRequest: "Food Item id must be a positive number" });
  }
  try {
    const foodItem = await getFoodItemDetails(foodItemId, userId);

    return res.status(200).json(foodItem);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("Food item details not found")
    ) {
      return res.status(404).json({ NotFound: error.message });
    }
    console.log("Error getting food item.");
    return res
      .status(500)
      .json({ message: "Failed to get Food Item due to a server error." });
  }
}
export async function getAllFoodItemDetailsHandler(
  req: AuthRequest,
  res: Response
) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res
        .status(401)
        .json({ message: "Anauthorized request, user id must be valid." });
    }
    const allFoodItems = await getAllFoodItemDetails(userId);
    return res.status(200).json({
      message: `Succesfully retrived all food items.`,
      foodItems: allFoodItems,
    });
  } catch (error) {
    console.error("Controller Error in getting all food items:", error);
    return res.status(500).json({
      message: "Failed to retrieve food items due to an internal server error.",
      error: error instanceof Error ? error.message : "Unknown error.",
    });
  }
}
