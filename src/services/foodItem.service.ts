import prisma from "../utils/prisma";
import { Prisma } from "@prisma/client";

export async function createFoodItem(
  foodName: string,
  caloriesPerServing: number,
  proteinPerServing: number,
  carbPerServing: number,
  fatPerServing: number
) {
  try {
    const newFoodItem = await prisma.foodItem.create({
      data: {
        foodName: foodName,
        caloriesPerServing: caloriesPerServing,
        proteinPerServing: proteinPerServing,
        carbPerServing: carbPerServing,
        fatPerServing: fatPerServing,
      },
    });
    return newFoodItem;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.name === "P2002") {
        throw new Error("Food item must be unique.");
      }
    }
    console.error("Error creating FoodItem:", error);
    throw new Error(
      "Failed to create food item  due to an internal server issue."
    );
  }
}

export async function getFoodItem(foodName: string) {
  try {
    const foodItem = await prisma.foodItem.findUnique({
      where: { foodName: foodName },
    });
    return foodItem;
  } catch (error) {
    console.error("Error retrieving FoodItem:", error);
    throw new Error(
      "Failed to retrieve food item due to an internal server issue."
    );
  }
}
