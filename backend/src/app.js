import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import expenseRoutes from "./routes/expense.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import insightsRoutes from "./routes/insights.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Expense Tracker API running 🚀" });
});

app.use("/api/auth", authRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/insights", insightsRoutes);

export default app;
