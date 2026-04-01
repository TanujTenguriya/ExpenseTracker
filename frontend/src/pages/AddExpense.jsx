import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import Navbar from "../components/Navbar";

import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  MenuItem,
  Alert,
} from "@mui/material";

export default function AddExpense() {
  const navigate = useNavigate();

  const [expense, setExpense] = useState({
    amount: "",
    description: "",
    category: "",
    date: new Date().toISOString().split("T")[0],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const categories = [
    "Food",
    "Travel",
    "Shopping",
    "Groceries",
    "Utilities",
    "Entertainment",
    "Health",
    "Other",
  ];

  const handleChange = (e) => {
    setExpense({ ...expense, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (!expense.amount || expense.amount <= 0) {
      setError("Amount must be greater than 0");
      return;
    }

    if (!expense.description.trim()) {
      setError("Description is required");
      return;
    }

    setLoading(true);

    try {
      await api.post("/expenses", expense);
      setSuccess("Expense added successfully!");
      setTimeout(() => navigate("/dashboard"), 1000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add expense");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Navbar />

      <Box sx={{ maxWidth: 500, mx: "auto", mt: 6 }}>
        <Card
          sx={{
            p: 3,
            borderRadius: 3,
            position: "relative",
            background: "linear-gradient(145deg, #111827, #0b0f19)",
            border: "1px solid rgba(255,255,255,0.08)",

            "&::before": {
              content: '""',
              position: "absolute",
              inset: 0,
              borderRadius: "inherit",
              padding: "1px",
              background:
                "linear-gradient(120deg, rgba(99,102,241,0.6), transparent)",
              WebkitMask:
                "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
              WebkitMaskComposite: "xor",
              maskComposite: "exclude",
            },
          }}
        >
          <CardContent>
            <Typography variant="h6" mb={2}>
              Add Expense
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            <Box
              component="form"
              onSubmit={handleSubmit}
              sx={{ display: "flex", flexDirection: "column", gap: 2 }}
            >
              <TextField
                label="Amount (₹)"
                name="amount"
                type="number"
                value={expense.amount}
                onChange={handleChange}
                fullWidth
                inputProps={{ step: "0.01", min: "0" }}
                error={error.includes("Amount")}
              />

              <TextField
                label="Description"
                name="description"
                value={expense.description}
                onChange={handleChange}
                fullWidth
                error={error.includes("Description")}
              />

              <TextField
                select
                label="Category"
                name="category"
                value={expense.category}
                onChange={handleChange}
                fullWidth
              >
                <MenuItem value="">
                  Other (Default)
                </MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                type="date"
                name="date"
                value={expense.date}
                onChange={handleChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />

              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                sx={{
                  mt: 2,
                  background:
                    "linear-gradient(135deg, #6366f1, #4f46e5)",
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, #4f46e5, #4338ca)",
                  },
                }}
              >
                {loading ? "Saving..." : "Save Expense"}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}