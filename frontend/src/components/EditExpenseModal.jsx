import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Button,
  Box,
  MenuItem,
} from "@mui/material";
import { useState, useEffect } from "react";
import api from "../api/axios";

export default function EditExpenseModal({
  open,
  onClose,
  expense,
  onUpdated,
}) {
  const [form, setForm] = useState({
    amount: "",
    description: "",
    category: "",
    date: "",
  });

  useEffect(() => {
    if (expense) {
      setForm({
        amount: expense.amount,
        description: expense.description,
        category: expense.category,
        date: expense.date?.split("T")[0],
      });
    }
  }, [expense]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleUpdate = async () => {
    try {
      const expenseId = expense._id ?? expense.id;
      if (!expenseId) {
        throw new Error("Missing expense ID");
      }

      const payload = {
        ...form,
        amount: Number(form.amount),
      };

      if (Number.isNaN(payload.amount) || payload.amount <= 0) {
        throw new Error("Amount must be a positive number");
      }

      const res = await api.put(`/expenses/${expenseId}`, payload);
      onUpdated(res.data);
      onClose();
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        "Failed to update";
      alert(message);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>Edit Expense</DialogTitle>

      <DialogContent>
        <Box display="flex" flexDirection="column" gap={2} mt={1}>
          <TextField
            label="Amount"
            name="amount"
            type="number"
            value={form.amount}
            onChange={handleChange}
          />

          <TextField
            label="Description"
            name="description"
            value={form.description}
            onChange={handleChange}
          />

          <TextField
            select
            label="Category"
            name="category"
            value={form.category}
            onChange={handleChange}
          >
            {[
              "Food",
              "Travel",
              "Shopping",
              "Groceries",
              "Utilities",
              "Entertainment",
              "Health",
              "Other",
            ].map((cat) => (
              <MenuItem key={cat} value={cat}>
                {cat}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
          />

          <Button
            variant="contained"
            onClick={handleUpdate}
            sx={{
              mt: 1,
              background:
                "linear-gradient(135deg, #6366f1, #4f46e5)",
            }}
          >
            Update Expense
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}