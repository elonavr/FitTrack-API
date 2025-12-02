import { createUser } from "../services/signUp.service.js";
import { hashPassword } from "../utils/hash.util.js";
import { Request, Response } from "express";

interface SignUpRequestBody {
  email?: string;
  username?: string;
  password?: string;
}
interface SignUpRequest extends Request {
  body: SignUpRequestBody;
}

export async function signUpHandler(req: SignUpRequest, res: Response) {
  let rawEmail = req.body.email ? req.body.email.trim() : undefined;
  let rawUsername = req.body.username ? req.body.username.trim() : undefined;
  let rawPassword = req.body.password ? req.body.password.trim() : undefined;

  if (!rawEmail) {
    return res.status(400).json({ message: `You must fill Email.` });
  }
  if (!rawUsername) {
    return res.status(400).json({ message: `You must fill Username.` });
  }
  if (!rawPassword) {
    return res.status(400).json({ message: `You must fill all Password.` });
  }

  try {
    const hashedPassword = await hashPassword(rawPassword);
    const newUser = await createUser(rawEmail, rawUsername, hashedPassword);
    res.status(201).json({
      message: `User created successfully.`,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
      },
    });
  } catch (error) {
    console.error("Sign-up failed:", error);
    if (error instanceof Error && error.message.includes("P2002")) {
      return res
        .status(409)
        .json({ message: "Email or Username already in use." });
    }
    return res
      .status(500)
      .json({ message: "Registration failed due to a server error." });
  }
}
