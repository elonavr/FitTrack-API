import jwt from "jsonwebtoken";

const JWT_SECRET = (process.env.JWT_SECRET ||
  "Fw5Hj4K9pT2yA7xQzRtVuWcYbGdEfIgLmNoPrQsTuVwXxYyZz8E0C1B6D3") as string;

const JWT_EXPIRATION = "1d";

if (!JWT_SECRET) {
  throw new Error("FATAL ERROR: JWT_SECRET must be defined.");
}

interface TokenPayload {
  id: number;
  email: string;
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
}
