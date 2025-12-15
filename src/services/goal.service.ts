import { GoalPlan, GoalStatus, Prisma } from "@prisma/client";
import prisma from "../utils/prisma";
export async function createGoalPlan(
  userId: number,
  goalName: string,
  calorieGoal: number,
  proteinGoal: number,
  carbGoal: number,
  fatGoal: number
) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      await tx.goalPlan.updateMany({
        where: { userId: userId, status: GoalStatus.ACTIVE },
        data: { status: GoalStatus.PAUSED },
      });

      const newGoal = await tx.goalPlan.create({
        data: {
          userId: userId,
          goalName: goalName,
          calorieGoal: calorieGoal,
          proteinGoal: proteinGoal,
          carbGoal: carbGoal,
          fatGoal: fatGoal,
          status: GoalStatus.ACTIVE,
        },
      });

      return newGoal;
    });

    return result;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        throw new Error("Goal plan name must be unique for this user.");
      }
    }
    console.error("Error creating GoalPlan:", error);
    throw new Error(
      "Failed to create goal plan due to an internal server issue."
    );
  }
}

export async function getGoals(userId: number): Promise<GoalPlan[]> {
  try {
    const goals = await prisma.goalPlan.findMany({
      where: {
        userId: userId,
      },
    });
    return goals;
  } catch (error) {
    console.error("Error while trying to retrieve all goal plans.");
    throw error;
  }
}

export async function getGoalPlan(
  userId: number,
  goalPlanId: number
): Promise<GoalPlan | null> {
  try {
    const goalPlan = await prisma.goalPlan.findUnique({
      where: {
        id: goalPlanId,
        userId: userId,
      },
    });
    return goalPlan;
  } catch (error) {
    console.error("Error while trying to retrieve  goal plan.");
    throw error;
  }
}
export async function pauseGoal(goalId: number, userId: number) {
  try {
    const pausedGoal = await prisma.goalPlan.update({
      where: {
        id: goalId,
        userId: userId,
      },
      data: {
        status: GoalStatus.PAUSED,
      },
    });

    return pausedGoal;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new Error(
        "This goal plan does not exist or does not belong to the user."
      );
    }
    console.error("Error pausing GoalPlan:", error);
    throw new Error("Failed to pause goal plan due to a server issue.");
  }
}

export async function activateGoal(
  goalPlanId: number,
  userId: number
): Promise<GoalPlan> {
  await prisma.goalPlan.updateMany({
    where: {
      userId: userId,
      status: GoalStatus.ACTIVE,
      id: { not: goalPlanId },
    },
    data: {
      status: GoalStatus.PAUSED,
    },
  });

  const activatedGoal = await prisma.goalPlan.update({
    where: { id: goalPlanId, userId: userId },
    data: { status: GoalStatus.ACTIVE },
  });
  return activatedGoal;
}

export async function deleteGoal(
  goalId: number,
  userId: number
): Promise<string> {
  try {
    const deletedGoalObject = await prisma.goalPlan.delete({
      select: { goalName: true },
      where: { userId: userId, id: goalId },
    });
    return deletedGoalObject.goalName;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      console.error("Plan goal not found for deletion.");
      throw new Error("Goal plan not found.");
    }
  }
  console.error("Error in deleteGoal service:");
  throw new Error("Internal server error during goal deletion.");
}
