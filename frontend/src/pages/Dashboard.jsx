import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import ExpenseCard from "../components/ExpenseCard";
import api from "../api/axios";
import EditExpenseModal from "../components/EditExpenseModal";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Select,
  MenuItem,
  Button,
} from "@mui/material";

const COLORS = [
  "#6366f1",
  "#22c55e",
  "#f97316",
  "#ef4444",
  "#a855f7",
];

export default function Dashboard() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editOpen, setEditOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchExpenses = async () => {
    const res = await api.get("/expenses");
    setExpenses(res.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchExpenses();
  }, []);
  
  const handleEdit = (expense) => {
  setSelectedExpense(expense);
  setEditOpen(true);
};

const handleUpdated = (updatedExpense) => {
  setExpenses((prev) =>
    prev.map((e) =>
      e._id === updatedExpense._id ? updatedExpense : e
    )
  );
};

  const handleDelete = async (id) => {
    await api.delete(`/expenses/${id}`);
    setExpenses((prev) => prev.filter((e) => e._id !== id));
  };

  const filteredExpenses = expenses.filter((exp) => {
    const matchesSearch = exp.description
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesCategory = categoryFilter
      ? exp.category === categoryFilter
      : true;

    const expDate = new Date(exp.date);

    const matchesStart = startDate
      ? expDate >= new Date(startDate)
      : true;

    const matchesEnd = endDate
      ? expDate <= new Date(endDate)
      : true;

    return (
      matchesSearch &&
      matchesCategory &&
      matchesStart &&
      matchesEnd
    );
  });

  const totalExpenses = filteredExpenses.reduce(
    (sum, exp) => sum + exp.amount,
    0
  );

  const chartData = Object.values(
  filteredExpenses.reduce((acc, exp) => {
    acc[exp.category] = acc[exp.category] || {
      category: exp.category,
      value: 0,
    };
    acc[exp.category].value += exp.amount;
    return acc;
  }, {})
);

  if (loading) return null;

  return (
    <Box>
      <Navbar />

      <Box sx={{ maxWidth: 1200, mx: "auto", p: 3 }}>
        {/* INSIGHT */}
        <Box
          sx={{
            mb: 3,
            p: 2,
            borderRadius: 2,
            background:
              "rgba(34,197,94,0.1)",
          }}
        >
          <Typography fontWeight={600}>
            💡 Track and manage your expenses efficiently
          </Typography>
        </Box>
        
          <Typography variant="h6" fontFamily={"Quicksand"} mb={2}>
            This Month's Expenses
          </Typography>

        {/* SUMMARY */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: "Total", value: `₹${totalExpenses}` },
            { label: "Transactions", value: filteredExpenses.length },
            { label: "Categories", value: [...new Set(filteredExpenses.map(e => e.category))].length },
          ].map((item, i) => (
            <Grid item xs={12} md={4} key={i}>
              <Card sx={{ 
                background: "linear-gradient(145deg, #111827, #0b0f19)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}>
                <CardContent>
                  <Typography color="text.secondary">
                    {item.label}
                  </Typography>
                  <Typography variant="h5">
                    {item.value}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

       <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
  <Grid item xs={12} md={4}>
    <TextField
      fullWidth
      label="Search"
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      size="small"
    />
  </Grid>

  <Grid item xs={12} md={3}>
    <Select
      fullWidth
      value={categoryFilter}
      onChange={(e) => setCategoryFilter(e.target.value)}
      displayEmpty
      size="small"
    >
      <MenuItem value="">All Categories</MenuItem>
      {[...new Set(expenses.map((e) => e.category))].map(
        (cat) => (
          <MenuItem key={cat} value={cat}>
            {cat}
          </MenuItem>
        )
      )}
    </Select>
  </Grid>

  <Grid item xs={6} md={2}>
    <TextField
      type="date"
      fullWidth
      value={startDate}
      onChange={(e) => setStartDate(e.target.value)}
      size="small"
    />
  </Grid>

  <Grid item xs={6} md={2}>
    <TextField
      type="date"
      fullWidth
      value={endDate}
      onChange={(e) => setEndDate(e.target.value)}
      size="small"
    />
  </Grid>

  {/* RESET BUTTON */}
  <Grid
    item
    xs={12}
    md={1}
    sx={{ display: "flex", justifyContent: "flex-end" }}
  >
    <Button
      variant="contained"
      size="small"
      onClick={() => {
        setSearch("");
        setCategoryFilter("");
        setStartDate("");
        setEndDate("");
      }}
      sx={{
        background: "linear-gradient(135deg, #6366f1, #4f46e5)",
        color: "white",
        fontWeight: 500,
        px: 2,
        "&:hover": {
          background:
            "linear-gradient(135deg, #4f46e5, #4338ca)",
        },
      }}
    >
      Reset
    </Button>
  </Grid>
</Grid>

        {/* CHART */}
        {chartData.length > 0 && (
          <Card sx={{ p: 3, borderRadius: 3, background: "#111827", border: "1px solid #1f2937", mb: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              Category Breakdown
            </Typography>
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    stroke="none"
                  >
                    {chartData.map((_, index) => (
                      <Cell
                        key={index}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {/* LIST */}
        <Typography variant="h6" sx={{ mb: 2 }}>
          Recent Expenses
        </Typography>

        {filteredExpenses.length > 0 ? (
          filteredExpenses.map((expense) => (
            <ExpenseCard
              key={expense._id}
              expense={expense}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          ))
        ) : (
          <Box sx={{ p: 3, textAlign: "center" }}>
            <Typography color="text.secondary">No expenses found</Typography>
          </Box>
        )}

        <EditExpenseModal
            open={editOpen}
            onClose={() => setEditOpen(false)}
            expense={selectedExpense}
            onUpdated={handleUpdated}
          />
        
      </Box>
    </Box>
  );
}