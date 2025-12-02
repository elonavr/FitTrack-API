import {
  createFoodItemHandler,
  getFoodItemHandler,
} from "../controllers/foodItem.controller";

import express from "express";

const router = express.Router();

router.post("/", createFoodItemHandler);

router.get("/", getFoodItemHandler);

export default router;
