import Expense from "../models/Expense.js";
import axios from "axios";

export const getInsights = async (req, res) => {
  try {
    const expenses = await Expense.find({ user: req.user.id }).sort({ date: 1 });

    if (!expenses.length) {
      return res.json({
        insights: [],
        score: 100,
        status: "No Data",
        forecast: null,
      });
    }

    const formatted = expenses.map((e) => ({
      amount: e.amount,
      category: e.category,
      date: e.date,
    }));

    const response = await axios.post(
      "http://localhost:8000/analyze",
      {
        user_id: req.user.id,
        expenses: formatted,
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error("INSIGHTS ERROR:", error.message);
    res.status(500).json({ message: "Failed to fetch insights" });
  }
};