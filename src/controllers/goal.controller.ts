import {
  cteateGoalPlan,
  getGoals,
  getGoalPlan,
  pauseGoal,
  activateGoal,
} from "../services/goal.service";
import { Request, Response } from "express";

export async function createGoalPlanHandler(req: Request, res: Response) {
  const userId = (req as any).userId;

  if (!userId) {
    return res.status(401).json({ message: "Authentication required." });
  }

  const { goalName, calorieGoal, proteinGoal, carbGoal, fatGoal } = req.body;

  const parsedCalorie = Number(calorieGoal);
  const parsedProtein = Number(proteinGoal);
  const parsedCarb = Number(carbGoal);
  const parsedFat = Number(fatGoal);
  if (
    !goalName ||
    isNaN(parsedCalorie) ||
    isNaN(parsedProtein) ||
    isNaN(parsedCarb) ||
    isNaN(parsedFat) ||
    parsedCalorie <= 0
  ) {
    return res.status(400).json({
      message:
        "Goal name and all macro goals must be provided as valid positive numbers.",
    });
  }

  try {
    const newGoal = await cteateGoalPlan(
      userId,
      goalName,
      parsedCalorie,
      parsedProtein,
      parsedCarb,
      parsedFat
    );
    console.log("Goal plan created successfully.");

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

export async function getGoalsHandler(req: Request, res: Response) {
  const userId = (req as any).userId;
  console.log("Controller Check: Retrieved userId:", userId);
  if (!userId) {
    return res.status(401).json({ message: "Authentication required." });
  }

  try {
    const goalPlans = await getGoals(userId);
    console.log("Succesfully retrived goal plans.");
    return res
      .status(200)
      .json({ message: "Succesfully retrived goal plans.", goals: goalPlans });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("Error while trying to retrieve all goal plans.")
    ) {
      return res.status(400).json(error.message);
    }
    return res
      .status(500)
      .json({ Error: "Enternal server error has occured." });
  }
}
export async function getGoalPlanHandler(req: Request, res: Response) {
  const userId = (req as any).userId;
  if (!userId) {
    return res.status(401).json({ message: "Authentication required." });
  }
  const goalId = Number(req.params.id);
  if (isNaN(goalId) || goalId <= 0) {
    return res.status(400).json({ message: "Invalid Goal ID provided." });
  }
  console.log(
    "Controller Check: Retrieved userId:",
    userId,
    "goalID: ",
    goalId
  );

  try {
    const goalPlan = await getGoalPlan(userId, goalId);
    return res.status(200).json({
      message: `Succsefully retrived goal plan.`,
      goal: goalPlan,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("Error while trying to retrieve  goal plan.")
    ) {
      return res.status(404).json({ message: `Goal plan was not found.` });
    }
    return res
      .status(500)
      .json({ Error: "Enternal server error has occured." });
  }
}

export async function pauseGoalHandler(req: Request, res: Response) {
  const userId = (req as any).userId;
  if (!userId) {
    return res
      .status(401)
      .json({ message: "Authentication failed: User ID not found." });
  }
  const idParam = req.params.id;
  if (!idParam) {
    return res
      .status(400)
      .json({ message: "Goal ID is required in the path." });
  }

  const goalPlanId = parseInt(idParam, 10);
  if (isNaN(goalPlanId)) {
    return res.status(400).json({ message: "Invalid Goal ID format." });
  }
  try {
    const pausedGoal = await pauseGoal(goalPlanId, userId);

    return res.status(200).json({
      message: "Goal successfully paused.",
      goal: pausedGoal,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("not exist")) {
      return res.status(404).json({ message: error.message });
    }

    console.error("Error pausing goal:", error);
    return res
      .status(500)
      .json({ message: "Failed to pause goal plan due to a server error." });
  }
}

export async function activateGoalHandler(req: Request, res: Response) {
  const userId = (req as any).userId;

  if (!userId) {
    return res
      .status(401)
      .json({ message: "Authentication failed: User ID not found." });
  }

  const idParam = req.params.id;

  if (!idParam) {
    return res
      .status(400)
      .json({ message: "Goal ID is required in the path." });
  }

  const goalPlanId = parseInt(idParam, 10);

  if (isNaN(goalPlanId)) {
    return res.status(400).json({ message: "Invalid Goal ID format." });
  }

  try {
    const activatedGoal = await activateGoal(goalPlanId, userId);

    return res.status(200).json({
      message: "Goal successfully activated. Previous active goal was paused.",
      goal: activatedGoal,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("not found")) {
      return res.status(404).json({ message: error.message });
    }

    console.error("Error activating goal:", error);
    return res
      .status(500)
      .json({ message: "Failed to activate goal plan due to a server error." });
  }
}
