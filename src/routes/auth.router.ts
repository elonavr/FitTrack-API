import express from "express";
const router = express.Router();
import { signUpHandler } from "../controllers/signUp.controller.js";
import { loginHandler } from "../controllers/login.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { resetDayHandler } from "../controllers/resetDay.controller.js";

router.post("/signup", signUpHandler);

router.post("/login", loginHandler);

router.patch("/resetDay", authenticateToken, resetDayHandler); // change userId

export default router;
