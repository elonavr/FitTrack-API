import jwt, { JwtPayload } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

const JWT_SECRET =
  process.env.JWT_SECRET ||
  ("Fw5Hj4K9pT2yA7xQzRtVuWcYbGdEfIgLmNoPrQsTuVwXxYyZz8E0C1B6D3" as string);

if (!JWT_SECRET) {
  throw new Error(
    "FATAL ERROR: JWT_SECRET is not defined in environment variables."
  );
}
interface AuthRequest extends Request {
  userId?: number;
}

export async function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication token required." });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({
      message: "Invalid authorization header format (Missing token).",
    });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    if (typeof decoded.id !== "number") {
      return res.status(401).json({ message: "Invalid token structure." });
    }

    req.userId = decoded.id;

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      console.error("JWT Verification Failed:", error.message);
      return res.status(401).json({ message: "Invalid or expired token." });
    }

    console.error("JWT verification error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error during authentication." });
  }
}
