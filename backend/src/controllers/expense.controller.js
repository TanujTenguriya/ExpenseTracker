import Expense from "../models/Expense.js";

export const addExpense = async (req, res) => {
  try {
    const { amount, description, date, category } = req.body;

    /* ---- VALIDATE REQUEST ---- */
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    if (!description || description.trim() === "") {
      return res.status(400).json({ message: "Description required" });
    }

    /* ---- CREATE EXPENSE ---- */
    const expense = await Expense.create({
      user: req.user.id,
      amount,
      description,
      date,
      category: category && category.trim() !== "" ? category : "Other",
    });

    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ message: "Failed to add expense" });
  }
};

export const getExpenses = async (req, res) => {
  try {
    const now = new Date();

    // 🔥 Get start of current month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 🔥 Get start of next month
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const expenses = await Expense.find({
      user: req.user.id,
      date: {
        $gte: startOfMonth,
        $lt: endOfMonth,
      },
    }).sort({ date: -1 });

    res.json(expenses);
  } catch (error) {
    console.error("GET EXPENSE ERROR:", error.message);
    res.status(500).json({ message: "Failed to fetch expenses" });
  }
};

export const deleteExpense = async (req, res) => {
  try {
    await Expense.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    res.json({ message: "Expense deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const updateExpense = async (req, res) => {
  try {
    const { amount, description, category, date } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    if (!description || description.trim() === "") {
      return res
        .status(400)
        .json({ message: "Description required" });
    }

    const updated = await Expense.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      {
        amount,
        description,
        category,
        date,
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};