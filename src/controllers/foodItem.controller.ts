import e, { Request, Response } from "express";
import {
  createFoodItem,
  getFoodItemDetails,
  getAllFoodItemDetails,
} from "../services/foodItem.service";

interface FoodItemRequestBody {
  foodName?: string;
  caloriesPerServing?: number;
  proteinPerServing?: number;
  carbPerServing?: number;
  fatPerServing?: number;
}

interface FoodItemRequest extends Request {
  body: FoodItemRequestBody;
}

export async function createFoodItemHandler(
  req: FoodItemRequest,
  res: Response
) {
  const foodName = req.body.foodName ? req.body.foodName.trim() : undefined;

  const {
    caloriesPerServing,
    proteinPerServing,
    carbPerServing,
    fatPerServing,
  } = req.body;
  if (!foodName) {
    return res.status(400).json({ message: "Food Name must be full" });
  }
  if (caloriesPerServing == null) {
    return res
      .status(400)
      .json({ message: "caloriesPerServing field must be full" });
  }
  if (proteinPerServing == null) {
    return res
      .status(400)
      .json({ message: "proteinPerServing field must be full" });
  }
  if (carbPerServing == null) {
    return res
      .status(400)
      .json({ message: "carbPerServing field must be full" });
  }
  if (fatPerServing == null) {
    return res
      .status(400)
      .json({ message: "fatPerServing field must be full" });
  }

  try {
    const newFoodItem = await createFoodItem(
      foodName as string,
      caloriesPerServing as number,
      proteinPerServing as number,
      carbPerServing as number,
      fatPerServing as number
    );
    return res.status(201).json({
      message: "Food item created successfully.",
      foodItem: newFoodItem,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("Food item must be unique.")
    ) {
      return res.status(409).json({ message: error.message });
    }
    console.log("Error creating FoodItem:", error);
    return res
      .status(500)
      .json({ message: "Failed to create Food Item due to a server error." });
  }
}

export async function getFoodItemHandler(req: Request, res: Response) {
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
    const foodItem = await getFoodItemDetails(foodItemId);

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
  req: Request,
  res: Response
) {
  try {
    const allFoodItems = await getAllFoodItemDetails();
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
