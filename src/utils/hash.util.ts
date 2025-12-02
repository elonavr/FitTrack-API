import bcrypt from "bcryptjs";
const salt = 10;

export async function hashPassword(plainPassword: string) {
  if (!plainPassword) {
    throw new Error("password must be filled");
  }
  const hashedPassword = await bcrypt.hash(plainPassword, salt);
  return hashedPassword;
}

export async function comparePasswords(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return await bcrypt.compare(plainPassword, hashedPassword);
}
