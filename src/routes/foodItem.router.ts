import {
  createFoodItemHandler,
  getFoodItemHandler,
  getAllFoodItemDetailsHandler,
} from "../controllers/foodItem.controller";

import express from "express";

const router = express.Router();

router.post("/", createFoodItemHandler);

router.get("/:foodItemId", getFoodItemHandler);

router.get("/", getAllFoodItemDetailsHandler);

export default router;
