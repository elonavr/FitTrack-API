import express from "express";
const router = express.Router();
import { signUpHandler } from "../controllers/signUp.controller.js";
import { loginHandler } from "../controllers/login.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { resetDayHandler } from "../controllers/resetDay.controller.js";
import {
  getMeHandler,
  saveProfileHandler,
  getPlansHandler,
  choosePlanHandler,
  savePlanHandler,
} from "../controllers/profile.controller.js";

router.post("/signup", signUpHandler);

router.post("/login", loginHandler);

router.patch("/resetDay", authenticateToken, resetDayHandler); // change userId

router.get("/me", authenticateToken, getMeHandler);
router.put("/me/profile", authenticateToken, saveProfileHandler);
router.get("/me/plans", authenticateToken, getPlansHandler);
router.post("/me/plan", authenticateToken, choosePlanHandler);
router.put("/me/plans/:type", authenticateToken, savePlanHandler);

export default router;
