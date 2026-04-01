import Expense from "../models/Expense.js";

export const getAnalytics = async (req, res) => {
  try {
    const data = await Expense.aggregate([
      { $match: { user: req.user.id } },
      {
        $group: {
          _id: "$category",
          total: { $sum: "$amount" },
        },
      },
    ]);

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
