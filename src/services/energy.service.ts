import { Gender } from "@prisma/client";

// Estimates only, not medical advice.
const KCAL_PER_G_PROTEIN = 4;
const KCAL_PER_G_CARB = 4;
const KCAL_PER_G_FAT = 9;

const MIN_PLAN_CALORIES = 1200;
const PROTEIN_G_PER_KG = 2;
const PROTEIN_SHARE_WITHOUT_WEIGHT = 0.3;
const FAT_SHARE = 0.25;

export const PLAN_TYPES = ["CUT", "MAINTENANCE", "BULK"] as const;
export type PlanType = (typeof PLAN_TYPES)[number];

const PLAN_CALORIE_FACTOR: Record<PlanType, number> = {
  CUT: 0.8,
  MAINTENANCE: 1,
  BULK: 1.1,
};

export interface BodyProfile {
  gender: Gender;
  age: number;
  heightCm: number;
  weightKg: number;
  trainingDaysPerWeek: number;
}

export interface PlanTargets {
  type: PlanType;
  calories: number;
  protein: number;
  carb: number;
  fat: number;
}

/** Mifflin-St Jeor resting energy expenditure. */
export function restingCalories(p: BodyProfile): number {
  const base = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age;
  return Math.round(base + (p.gender === Gender.MALE ? 5 : -161));
}

function activityMultiplier(trainingDaysPerWeek: number): number {
  if (trainingDaysPerWeek <= 0) return 1.2;
  if (trainingDaysPerWeek <= 2) return 1.375;
  if (trainingDaysPerWeek <= 5) return 1.55;
  return 1.725;
}

export function maintenanceCalories(p: BodyProfile): number {
  return Math.round(restingCalories(p) * activityMultiplier(p.trainingDaysPerWeek));
}

export interface Macros {
  protein: number;
  carb: number;
  fat: number;
}

export function macroCalories(m: Macros): number {
  return Math.round(m.protein * KCAL_PER_G_PROTEIN + m.carb * KCAL_PER_G_CARB + m.fat * KCAL_PER_G_FAT);
}

export function planTargets(
  maintenance: number,
  type: PlanType,
  weightKg?: number
): PlanTargets {
  const calories = Math.max(
    MIN_PLAN_CALORIES,
    Math.round(maintenance * PLAN_CALORIE_FACTOR[type])
  );
  const protein = Math.round(
    weightKg
      ? weightKg * PROTEIN_G_PER_KG
      : (calories * PROTEIN_SHARE_WITHOUT_WEIGHT) / KCAL_PER_G_PROTEIN
  );
  const fat = Math.round((calories * FAT_SHARE) / KCAL_PER_G_FAT);
  const carbKcal = calories - protein * KCAL_PER_G_PROTEIN - fat * KCAL_PER_G_FAT;
  const carb = Math.max(0, Math.round(carbKcal / KCAL_PER_G_CARB));
  return { type, calories, protein, carb, fat };
}

export function allPlanTargets(maintenance: number, weightKg?: number): PlanTargets[] {
  return PLAN_TYPES.map((t) => planTargets(maintenance, t, weightKg));
}
