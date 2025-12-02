import prisma from "../utils/prisma";
export async function resetUserDailyGoals(
  userId: number
): Promise<{ id: number; lastManualReset: Date }> {
  if (!userId) {
    throw new Error("Couldn't get user id.");
  }
  try {
    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        lastManualReset: new Date(),
      },
      select: {
        id: true,
        lastManualReset: true,
      },
    });
    return updatedUser;
  } catch (error) {
    console.error("Error resetting user daily goals:", error);
    throw error;
  }
}
