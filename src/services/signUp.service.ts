import prisma from "../utils/prisma.js";
import { Prisma } from "@prisma/client";

export async function createUser(
  email: string,
  username: string,
  password: string
) {
  try {
    const newUser = await prisma.user.create({
      data: {
        email: email,
        username: username,
        passwordHash: password,
      },
      select: {
        id: true,
        email: true,
        username: true,
      },
    });
    return newUser;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code == "P2002") {
        throw error;
      }
    }
    console.error("Internal error has occurred.");
    throw error;
  }
}
