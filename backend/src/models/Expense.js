import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      default: "Uncategorized",
    },
    description: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    isAnomaly: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

expenseSchema.index({ user: 1, date: -1 });

export default mongoose.model("Expense", expenseSchema);
