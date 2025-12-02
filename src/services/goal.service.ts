import { Prisma } from "@prisma/client";
import prisma from "../utils/prisma";

export async function cteateGoalPlan(
  userId: number,
  goalName: string,
  calorieGoal: number,
  proteinGoal: number,
  carbGoal: number,
  fatGoal: number
) {
  try {
    const newGoal = await prisma.goalPlan.create({
      data: {
        userId: userId,
        goalName: goalName,
        calorieGoal: calorieGoal,
        proteinGoal: proteinGoal,
        carbGoal: carbGoal,
        fatGoal: fatGoal,
      },
    });
    return newGoal;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.name === "P2002") {
        throw new Error("Goal plan name must be unique for this user.");
      }
    }
    console.error("Error creating GoalPlan:", error);
    throw new Error(
      "Failed to create goal plan due to an internal server issue."
    );
  }
}
