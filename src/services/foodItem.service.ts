import prisma from "../utils/prisma";
import { Prisma } from "@prisma/client";
import RedisClient from "../utils/redis.cache.service";
import Redis from "ioredis";
import { FoodItem } from "@prisma/client";

const DEFAULT_TTL_SECONDS = 259200; // 3 days limit
const ALL_FOOD_ITEMS_KEY = "foodItems:all";
const FOOD_ITEM_KEY = `foodItem:`;

export async function createFoodItem(
  userId: number,
  foodName: string,
  caloriesPerServing: string,
  proteinPerServing: string,
  carbPerServing: string,
  fatPerServing: string
): Promise<FoodItem> {
  try {
    const newFoodItem = await prisma.foodItem.create({
      data: {
        userId: userId,
        foodName: foodName,
        caloriesPerServing: caloriesPerServing,
        proteinPerServing: proteinPerServing,
        carbPerServing: carbPerServing,
        fatPerServing: fatPerServing,
      },
    });
    const singleCachekey = FOOD_ITEM_KEY + `${newFoodItem.id}`;
    await RedisClient.set(singleCachekey, newFoodItem, DEFAULT_TTL_SECONDS);

    const ALL_USER_FOOD_ITEMS_KEY = ALL_FOOD_ITEMS_KEY + `:${userId}`;
    await RedisClient.del(ALL_USER_FOOD_ITEMS_KEY);

    return newFoodItem;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        throw new Error("Food item must be unique for this user.");
      }
    }
    console.error("Error creating FoodItem:", error);
    throw new Error(
      "Failed to create food item  due to an internal server issue."
    );
  }
}

export async function getFoodItemDetails(
  foodItemId: number,
  userId: number
): Promise<FoodItem> {
  try {
    const singleCachekey = FOOD_ITEM_KEY + `${userId}:${foodItemId}`;
    const foodItemCahced = await RedisClient.get<FoodItem>(singleCachekey);
    if (foodItemCahced) {
      console.log(`[CACHE]: HIT for Food Item ID ${foodItemId}.`);
      return foodItemCahced;
    }

    const foodItem = await prisma.foodItem.findUnique({
      where: { id: foodItemId, userId: userId },
    });
    if (!foodItem) {
      throw new Error("Food item details not found for this ID.");
    }
    await RedisClient.set(singleCachekey, foodItem, DEFAULT_TTL_SECONDS);
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

export async function getAllFoodItemDetails(
  userId: number
): Promise<FoodItem[]> {
  try {
    const ALL_USER_FOOD_ITEMS_KEY = ALL_FOOD_ITEMS_KEY + `:${userId}`;
    const allFoodItemsCached = await RedisClient.get<FoodItem[]>(
      ALL_USER_FOOD_ITEMS_KEY
    );
    if (allFoodItemsCached) {
      console.log(`[CACHE] HIT for all food Items`);
      return allFoodItemsCached;
    }
    const allFoodItems = await prisma.foodItem.findMany({
      where: { userId: userId },
    });
    await RedisClient.set<FoodItem[]>(
      ALL_USER_FOOD_ITEMS_KEY,
      allFoodItems,
      DEFAULT_TTL_SECONDS
    );
    return allFoodItems;
  } catch (error) {
    console.error("Error: Failed to find all food items details.");
    throw error;
  }
}
