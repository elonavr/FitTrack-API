import { login, InvalidCredentialsError } from "../services/login.service";
import { Request, Response } from "express";
import { generateToken } from "../utils/jwt.util";

interface LoginRequestBody {
  email?: string;
  password?: string;
}
interface LoginRequest extends Request {
  body: LoginRequestBody;
}

export async function loginHandler(req: LoginRequest, res: Response) {
  let rawEmail = req.body.email ? req.body.email.trim() : undefined;
  let rawPassword = req.body.password ? req.body.password.trim() : undefined;

  if (!rawEmail || !rawPassword) {
    return res.status(400).json({ message: `You must fill all fields.` });
  }
  try {
    const user = await login(rawEmail, rawPassword);

    if (!user) {
      throw new InvalidCredentialsError();
    }
    const token = generateToken({
      id: user.id,
      email: user.email,
    });

    return res.status(200).json({
      message: "Succesfully connected",
      user: { id: user.id, email: user.email, username: user.username },
      token: token,
    });
  } catch (error) {
    if (error instanceof InvalidCredentialsError) {
      return res.status(400).json({
        message: `Invalid email or password.`,
      });
    }
    console.error("An unexpected error occurred:", error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
}
