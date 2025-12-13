import "dotenv/config";
import express from "express";
import cors from "cors";
import userRouter from "./routes/auth.router.js";
import goalRouter from "./routes/goal.router.js";
import foodItemRoute from "./routes/foodItem.router.js";
import mealRoute from "./routes/meal.router.js";
const port = process.env.PORT || 5000;

const app = express();

app.use(cors());

app.use(express.json());
app.use("/api/users", userRouter);
app.use("/api/goals", goalRouter);
app.use("/api/foodItem", foodItemRoute);
app.use("/api/meals", mealRoute);

const url = `http://localhost:${port}`;
app.listen(port, () => {
  console.log(`Server listening to address: ${url}`);
});
