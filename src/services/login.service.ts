import prisma from "../utils/prisma";
import { comparePasswords } from "../utils/hash.util";

export class InvalidCredentialsError extends Error {
  constructor(message = "Invalid email or password.") {
    super(message);
    this.name = "InvalidCredentialsError";
  }
}

export async function login(email: string, plainPassword: string) {
  if (!email || !plainPassword) {
    throw new InvalidCredentialsError();
  }
  try {
    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });
    if (!user) {
      throw new InvalidCredentialsError();
    }

    const isPasswordValid = await comparePasswords(
      plainPassword,
      user.passwordHash
    );
    if (!isPasswordValid) {
      throw new InvalidCredentialsError();
    }
    return {
      id: user.id,
      email: user.email,
      username: user.username,
    };
  } catch (error) {
    console.error("Login service failed:", error);
    throw error;
  }
}
