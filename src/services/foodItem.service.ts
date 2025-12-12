import prisma from "../utils/prisma";
import { Prisma } from "@prisma/client";
import RedisClient from "../utils/redis.cache.service";
import Redis from "ioredis";
import { FoodItem } from "@prisma/client";

const DEFAULT_TTL_SECONDS = 259200; // 3 days limit
const ALL_FOOD_ITEMS_KEY = "foodItems:all";
const FOOD_ITEM_KEY = `foodItem:`;

export async function createFoodItem(
  foodName: string,
  caloriesPerServing: number,
  proteinPerServing: number,
  carbPerServing: number,
  fatPerServing: number
): Promise<FoodItem> {
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

    const singleCachekey = FOOD_ITEM_KEY + `${newFoodItem.id}`;

    await RedisClient.del(ALL_FOOD_ITEMS_KEY);

    await RedisClient.set(singleCachekey, newFoodItem, DEFAULT_TTL_SECONDS);

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

export async function getFoodItemDetails(
  foodItemId: number
): Promise<FoodItem> {
  try {
    const foodItemCahced = await RedisClient.get<FoodItem>(
      FOOD_ITEM_KEY + `${foodItemId}`
    );
    if (foodItemCahced) {
      console.log(`[CACHE]: HIT for Food Item ID ${foodItemId}.`);
      return foodItemCahced;
    }

    const foodItem = await prisma.foodItem.findUnique({
      where: { id: foodItemId },
    });
    if (!foodItem) {
      throw new Error("Food item details not found for this ID.");
    }
    await RedisClient.set(
      FOOD_ITEM_KEY + `${foodItem.id}`,
      foodItem,
      DEFAULT_TTL_SECONDS
    );
    return foodItem;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("Food item details not found")
    ) {
      throw error;
    }
    console.error("Error retrieving FoodItem:", error);
    throw new Error(
      "Failed to retrieve food item due to an internal server issue."
    );
  }
}

export async function getAllFoodItemDetails(): Promise<FoodItem[]> {
  try {
    const allFoodItemsCached = await RedisClient.get<FoodItem[]>(
      ALL_FOOD_ITEMS_KEY
    );
    if (allFoodItemsCached) {
      console.log(`[CACHE] HIT for all food Items`);
      return allFoodItemsCached;
    }
    const allFoodItems = await prisma.foodItem.findMany();
    await RedisClient.set<FoodItem[]>(
      ALL_FOOD_ITEMS_KEY,
      allFoodItems,
      DEFAULT_TTL_SECONDS
    );
    return allFoodItems;
  } catch (error) {
    console.error("Error: Failed to find all food items details.");
    throw error;
  }
}
