import { Request, Response } from "express";
import { Gender } from "@prisma/client";
import { Macros, PLAN_TYPES, PlanType, macroCalories } from "../services/energy.service.js";
import {
  MissingMaintenanceError,
  choosePlan,
  getPlans,
  getProfile,
  savePlan,
  saveProfile,
} from "../services/profile.service.js";

interface AuthenticatedRequest extends Request {
  userId?: number;
}

const MAINTENANCE_RANGE = [800, 6000] as const;
const MACRO_GRAMS_RANGE = [0, 1000] as const;

/** Returns the number if it is finite and within [min, max], otherwise undefined. */
function inRange(value: unknown, min: number, max: number, integer = false) {
  const n = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  if (typeof n !== "number" || !Number.isFinite(n)) return undefined;
  if (integer && !Number.isInteger(n)) return undefined;
  return n >= min && n <= max ? n : undefined;
}

function parseMaintenance(value: unknown): number | undefined | null {
  if (value === undefined || value === null || value === "") return undefined;
  return inRange(value, ...MAINTENANCE_RANGE) ?? null; // null = present but invalid
}

/** undefined = not sent; string = validation error message. */
function parseMacros(body: Record<string, unknown>): Macros | undefined | string {
  const keys = ["protein", "carb", "fat"] as const;
  if (keys.every((k) => body[k] === undefined)) return undefined;
  const m = Object.fromEntries(keys.map((k) => [k, inRange(body[k], ...MACRO_GRAMS_RANGE, true)]));
  if (keys.some((k) => m[k] === undefined))
    return "Protein, carbs and fat must all be whole grams between 0 and 1000.";
  const macros = m as unknown as Macros;
  const kcal = macroCalories(macros);
  if (kcal < MAINTENANCE_RANGE[0] || kcal > MAINTENANCE_RANGE[1])
    return `Plan calories must be between ${MAINTENANCE_RANGE[0]} and ${MAINTENANCE_RANGE[1]} (got ${kcal}).`;
  return macros;
}

function handleError(res: Response, error: unknown, action: string) {
  if (error instanceof MissingMaintenanceError) {
    return res.status(400).json({ message: error.message });
  }
  console.error(`Error ${action}:`, error);
  return res.status(500).json({ message: `Failed ${action}.` });
}

export async function getMeHandler(req: AuthenticatedRequest, res: Response) {
  if (!req.userId) return res.status(401).json({ message: "Authentication required." });
  try {
    return res.status(200).json(await getProfile(req.userId));
  } catch (error) {
    return handleError(res, error, "loading profile");
  }
}

export async function saveProfileHandler(req: AuthenticatedRequest, res: Response) {
  if (!req.userId) return res.status(401).json({ message: "Authentication required." });
  const b = req.body ?? {};
  const gender = Object.values(Gender).includes(b.gender) ? (b.gender as Gender) : undefined;
  const age = inRange(b.age, 13, 100, true);
  const heightCm = inRange(b.heightCm, 100, 250);
  const weightKg = inRange(b.weightKg, 30, 300);
  const trainingDaysPerWeek = inRange(b.trainingDaysPerWeek, 0, 7, true);

  if (!gender) return res.status(400).json({ message: "Gender must be MALE or FEMALE." });
  if (age === undefined) return res.status(400).json({ message: "Age must be a whole number between 13 and 100." });
  if (heightCm === undefined) return res.status(400).json({ message: "Height must be between 100 and 250 cm." });
  if (weightKg === undefined) return res.status(400).json({ message: "Weight must be between 30 and 300 kg." });
  if (trainingDaysPerWeek === undefined)
    return res.status(400).json({ message: "Training days must be a whole number between 0 and 7." });

  try {
    const profile = await saveProfile(req.userId, { gender, age, heightCm, weightKg, trainingDaysPerWeek });
    return res.status(200).json(profile);
  } catch (error) {
    return handleError(res, error, "saving profile");
  }
}

export async function getPlansHandler(req: AuthenticatedRequest, res: Response) {
  if (!req.userId) return res.status(401).json({ message: "Authentication required." });
  const maintenance = parseMaintenance(req.query.maintenanceCalories);
  if (maintenance === null)
    return res.status(400).json({ message: "Maintenance calories must be between 800 and 6000." });
  try {
    return res.status(200).json(await getPlans(req.userId, maintenance));
  } catch (error) {
    return handleError(res, error, "calculating plans");
  }
}

export async function choosePlanHandler(req: AuthenticatedRequest, res: Response) {
  if (!req.userId) return res.status(401).json({ message: "Authentication required." });
  const type = req.body?.type as PlanType;
  if (!PLAN_TYPES.includes(type))
    return res.status(400).json({ message: `Plan type must be one of ${PLAN_TYPES.join(", ")}.` });
  const maintenance = parseMaintenance(req.body?.maintenanceCalories);
  if (maintenance === null)
    return res.status(400).json({ message: "Maintenance calories must be between 800 and 6000." });
  const macros = parseMacros(req.body ?? {});
  if (typeof macros === "string") return res.status(400).json({ message: macros });
  try {
    const goal = await choosePlan(req.userId, type, maintenance, macros);
    return res.status(200).json({ message: "Plan selected.", goal });
  } catch (error) {
    return handleError(res, error, "selecting plan");
  }
}

export async function savePlanHandler(req: AuthenticatedRequest, res: Response) {
  if (!req.userId) return res.status(401).json({ message: "Authentication required." });
  const type = String(req.params.type).toUpperCase() as PlanType;
  if (!PLAN_TYPES.includes(type))
    return res.status(400).json({ message: `Plan type must be one of ${PLAN_TYPES.join(", ")}.` });
  const macros = parseMacros(req.body ?? {});
  if (macros === undefined) return res.status(400).json({ message: "Protein, carbs and fat are required." });
  if (typeof macros === "string") return res.status(400).json({ message: macros });
  try {
    const goal = await savePlan(req.userId, type, macros);
    return res.status(200).json({ message: "Plan saved.", goal });
  } catch (error) {
    return handleError(res, error, "saving plan");
  }
}
