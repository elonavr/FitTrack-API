import { GoalStatus, GoalPlan } from "@prisma/client";
import prisma from "../utils/prisma.js";
import {
  BodyProfile,
  Macros,
  PlanType,
  PlanTargets,
  allPlanTargets,
  macroCalories,
  maintenanceCalories,
  planTargets,
  restingCalories,
} from "./energy.service.js";
import { invalidateDailyStatus } from "./meal.service.js";

const PLAN_GOAL_NAMES: Record<PlanType, string> = {
  CUT: "Cut",
  MAINTENANCE: "Maintenance",
  BULK: "Bulk",
};

export class MissingMaintenanceError extends Error {}

const profileSelect = {
  gender: true,
  age: true,
  heightCm: true,
  weightKg: true,
  trainingDaysPerWeek: true,
  onboardingCompleted: true,
} as const;

async function loadProfile(userId: number) {
  return prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: profileSelect,
  });
}

function toBodyProfile(u: Awaited<ReturnType<typeof loadProfile>>): BodyProfile | null {
  if (
    u.gender == null ||
    u.age == null ||
    u.heightCm == null ||
    u.weightKg == null ||
    u.trainingDaysPerWeek == null
  ) {
    return null;
  }
  return {
    gender: u.gender,
    age: u.age,
    heightCm: Number(u.heightCm),
    weightKg: Number(u.weightKg),
    trainingDaysPerWeek: u.trainingDaysPerWeek,
  };
}

function present(u: Awaited<ReturnType<typeof loadProfile>>) {
  const body = toBodyProfile(u);
  return {
    gender: u.gender,
    age: u.age,
    heightCm: u.heightCm == null ? null : Number(u.heightCm),
    weightKg: u.weightKg == null ? null : Number(u.weightKg),
    trainingDaysPerWeek: u.trainingDaysPerWeek,
    onboardingCompleted: u.onboardingCompleted,
    restingCalories: body ? restingCalories(body) : null,
    maintenanceCalories: body ? maintenanceCalories(body) : null,
  };
}

export async function getProfile(userId: number) {
  return present(await loadProfile(userId));
}

export async function saveProfile(userId: number, body: BodyProfile) {
  const updated = await prisma.user.update({
    where: { id: userId },
    data: body,
    select: profileSelect,
  });
  return present(updated);
}

/** Uses the profile's TDEE when complete, otherwise the caller-supplied maintenance. */
async function resolveMaintenance(userId: number, manualMaintenance?: number) {
  const body = toBodyProfile(await loadProfile(userId));
  if (body) return { maintenance: maintenanceCalories(body), weightKg: body.weightKg };
  if (manualMaintenance !== undefined) return { maintenance: manualMaintenance, weightKg: undefined };
  throw new MissingMaintenanceError("Maintenance calories are required when the profile is incomplete.");
}

export async function getPlans(
  userId: number,
  manualMaintenance?: number
): Promise<{ maintenanceCalories: number; plans: PlanTargets[] }> {
  const { maintenance, weightKg } = await resolveMaintenance(userId, manualMaintenance);
  return { maintenanceCalories: maintenance, plans: allPlanTargets(maintenance, weightKg) };
}

/** `customMacros` (user-edited grams) overrides the preset; calories are derived from them. */
export async function choosePlan(
  userId: number,
  type: PlanType,
  manualMaintenance?: number,
  customMacros?: Macros
): Promise<GoalPlan> {
  const t = customMacros
    ? { ...customMacros, calories: macroCalories(customMacros) }
    : await resolveMaintenance(userId, manualMaintenance).then(({ maintenance, weightKg }) =>
        planTargets(maintenance, type, weightKg)
      );
  const goalName = PLAN_GOAL_NAMES[type];
  const targets = {
    calorieGoal: t.calories,
    proteinGoal: t.protein,
    carbGoal: t.carb,
    fatGoal: t.fat,
    status: GoalStatus.ACTIVE,
  };

  const goal = await prisma.$transaction(async (tx) => {
    await tx.goalPlan.updateMany({
      where: { userId, status: GoalStatus.ACTIVE, NOT: { goalName } },
      data: { status: GoalStatus.PAUSED },
    });
    const saved = await tx.goalPlan.upsert({
      where: { goalName_userId: { goalName, userId } },
      create: { userId, goalName, ...targets },
      update: targets,
    });
    await tx.user.update({ where: { id: userId }, data: { onboardingCompleted: true } });
    return saved;
  });

  invalidateDailyStatus(userId);
  return goal;
}

/** Stores user-edited macros for a plan without changing which plan is active. */
export async function savePlan(userId: number, type: PlanType, macros: Macros): Promise<GoalPlan> {
  const goalName = PLAN_GOAL_NAMES[type];
  const targets = {
    calorieGoal: macroCalories(macros),
    proteinGoal: macros.protein,
    carbGoal: macros.carb,
    fatGoal: macros.fat,
  };
  const goal = await prisma.goalPlan.upsert({
    where: { goalName_userId: { goalName, userId } },
    create: { userId, goalName, ...targets, status: GoalStatus.PAUSED },
    update: targets, // status untouched: editing the active plan keeps it active
  });
  if (goal.status === GoalStatus.ACTIVE) invalidateDailyStatus(userId);
  return goal;
}
