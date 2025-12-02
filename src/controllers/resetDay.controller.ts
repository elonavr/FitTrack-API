import { Request, Response } from "express";
import { resetUserDailyGoals } from "../services/resetDay.service";

interface AuthenticatedRequest extends Request {
  userId?: number;
}
export async function resetDayHandler(
  req: AuthenticatedRequest,
  res: Response
) {
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ message: "Authentication required." });
  }
  try {
    const reset = await resetUserDailyGoals(userId);
    return res.status(200).json({
      message: "Daily goal reset successful.",
      lastResetTime: reset.lastManualReset,
    });
  } catch (error) {
    console.error("Error resetting daily goals:", error);

    if (error instanceof Error && error.message.includes("User not found")) {
      return res
        .status(404)
        .json({ message: "User not found in the database." });
    }

    return res
      .status(500)
      .json({ message: "Internal server error during reset operation." });
  }
}
