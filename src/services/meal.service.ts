import { GoalStatus, Meal } from "@prisma/client";
import prisma from "../utils/prisma.js";
import { Decimal } from "decimal.js";
import MemoryCache from "../utils/memory.cache.service.js";

const CACHE_TTL_SECONDS = 600;
const DAILY_STATUS_KEY_PREFIX = "dailyStatus:";

// interfaces
interface DailyStatusData {
  caloriesConsumed: number;
  caloriesGoal: number;
  caloriesRemaining: number;

  proteinConsumed: number;
  proteinGoal: number;
  proteinRemaining: number;

  carbConsumed: number;
  carbGoal: number;
  carbRemaining: number;

  fatConsumed: number;
  fatGoal: number;
  fatRemaining: number;
}

interface MealInput {
  foodItemId: number;
  quantity: number;
}

// main functions
export async function getDailyStatus(userId: number): Promise<DailyStatusData> {
  try {
    const cacheKey = DAILY_STATUS_KEY_PREFIX + userId;

    const cachedDailyStatusData = MemoryCache.get<DailyStatusData>(cacheKey);

    if (cachedDailyStatusData) {
      console.log(`[LOCAL CACHE]: HIT for Daily Status ID ${userId}.`);
      return cachedDailyStatusData;
    }
    const dailyStatus = await calculateUserDailyStatus(userId);

    MemoryCache.set<DailyStatusData>(cacheKey, dailyStatus, CACHE_TTL_SECONDS);

    return dailyStatus;
  } catch (error) {
    console.error("Error retrieving daily status:", error);
    throw error;
  }
}

export async function createMealsWithTracking(
  userId: number,
  mealsInput: MealInput[]
): Promise<{ meals: Meal[]; dailyStatus: DailyStatusData }> {
  try {
    const newMealsDataPromises = mealsInput.map(async (mealsInput) => {
      const foodItem = await getFoodItemDetails(mealsInput.foodItemId);
      /////////////////////

      const quantityDecimal = new Decimal(mealsInput.quantity);
      const hundred = new Decimal(100);
      const ratio = quantityDecimal.div(hundred);

      const caloriesPerServing = new Decimal(foodItem.caloriesPerServing || 0);
      const proteinPerServing = new Decimal(foodItem.proteinPerServing || 0);
      const carbPerServing = new Decimal(foodItem.carbPerServing || 0);
      const fatPerServing = new Decimal(foodItem.fatPerServing || 0);

      const calculated = {
        calories: caloriesPerServing.mul(ratio),
        protein: proteinPerServing.mul(ratio),
        carb: carbPerServing.mul(ratio),
        fat: fatPerServing.mul(ratio),
      };

      const roundedCalculated = {
        calories: calculated.calories.toFixed(2),
        protein: calculated.protein.toFixed(2),
        carb: calculated.carb.toFixed(2),
        fat: calculated.fat.toFixed(2),
      };

      return {
        userId: userId,
        foodItemId: mealsInput.foodItemId,
        quantity: mealsInput.quantity,

        caloriesConsumed: roundedCalculated.calories,
        proteinConsumed: roundedCalculated.protein,
        carbConsumed: roundedCalculated.carb,
        fatConsumed: roundedCalculated.fat,
      };
    });
    const newMealsData = await Promise.all(newMealsDataPromises);
    const createdMealPromises = newMealsData.map((data) =>
      prisma.meal.create({ data })
    );
    const newMeals = await Promise.all(createdMealPromises);

    const dailyStatus = await calculateUserDailyStatus(userId);

    // cache:
    const cacheKey = DAILY_STATUS_KEY_PREFIX + userId;
    MemoryCache.del(cacheKey);
    MemoryCache.set<DailyStatusData>(cacheKey, dailyStatus, CACHE_TTL_SECONDS);

    return { meals: newMeals, dailyStatus: dailyStatus };
  } catch (error) {
    console.error("Error in createMealsWithTracking:", error);
    throw error;
  }
}

// helping functions:

async function getUserData(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lastManualReset: true, id: true },
  });
  if (!user) {
    throw new Error("User not found.");
  }
  return user;
}

async function getFoodItemDetails(foodItemId: number) {
  const item = await prisma.foodItem.findUnique({
    where: { id: foodItemId },
  });
  if (!item) {
    throw new Error("Food item details not found for this ID.");
  }
  return item;
}

async function calculateUserDailyStatus(
  userId: number
): Promise<DailyStatusData> {
  const user = await getUserData(userId);

  const aggregationResult = await prisma.meal.aggregate({
    _sum: {
      caloriesConsumed: true,
      proteinConsumed: true,
      carbConsumed: true,
      fatConsumed: true,
    },
    where: { userId: userId, createdAt: { gte: user.lastManualReset } },
  });
  const activeGoal = await prisma.goalPlan.findFirst({
    where: { userId: userId, status: GoalStatus.ACTIVE },
    select: {
      calorieGoal: true,
      proteinGoal: true,
      carbGoal: true,
      fatGoal: true,
    },
  });
  const goalData = {
    calories: Number(activeGoal?.calorieGoal) || 0,
    protein: Number(activeGoal?.proteinGoal) || 0,
    carb: Number(activeGoal?.carbGoal) || 0,
    fat: Number(activeGoal?.fatGoal) || 0,
  };

  const totalConsumption = {
    calories: Number(aggregationResult._sum.caloriesConsumed) || 0,
    protein: Number(aggregationResult._sum.proteinConsumed) || 0,
    carb: Number(aggregationResult._sum.carbConsumed) || 0,
    fat: Number(aggregationResult._sum.fatConsumed) || 0,
  };

  const dailyStatus: DailyStatusData = {
    caloriesConsumed: Number(totalConsumption.calories.toFixed(2)),
    caloriesGoal: goalData.calories,
    caloriesRemaining: Number(
      (goalData.calories - totalConsumption.calories).toFixed(2)
    ),

    proteinConsumed: Number(totalConsumption.protein.toFixed(2)),
    proteinGoal: goalData.protein,
    proteinRemaining: Number(
      (goalData.protein - totalConsumption.protein).toFixed(2)
    ),

    carbConsumed: Number(totalConsumption.carb.toFixed(2)),
    carbGoal: goalData.carb,
    carbRemaining: Number((goalData.carb - totalConsumption.carb).toFixed(2)),

    fatConsumed: Number(totalConsumption.fat.toFixed(2)),
    fatGoal: goalData.fat,
    fatRemaining: Number((goalData.fat - totalConsumption.fat).toFixed(2)),
  };

  return dailyStatus;
}
