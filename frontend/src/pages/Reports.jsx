import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Charts from "../components/Charts";
import api from "../api/axios";

import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
} from "@mui/material";

export default function Reports() {
  const [categoryData, setCategoryData] = useState([]);
  const [timeData, setTimeData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [allExpenses, setAllExpenses] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get analytics data (category-wise)
        const analyticsRes = await api.get("/analytics");
        const formatted = analyticsRes.data.map((item) => ({
          category: item._id,
          value: item.total,
        }));
        setCategoryData(formatted);

        // Get all expenses for time-based analysis
        const expensesRes = await api.get("/expenses");
        setAllExpenses(expensesRes.data);

        // Process time-based data (daily)
        const timeMap = {};
        expensesRes.data.forEach((expense) => {
          const dateStr = new Date(expense.date).toLocaleDateString();
          timeMap[dateStr] = (timeMap[dateStr] || 0) + expense.amount;
        });

        const timeFormatted = Object.entries(timeMap)
          .map(([date, amount]) => ({ date, amount }))
          .sort((a, b) => new Date(a.date) - new Date(b.date));

        setTimeData(timeFormatted);

        // Process monthly data
        const monthMap = {};
        expensesRes.data.forEach((expense) => {
          const date = new Date(expense.date);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
          monthMap[monthKey] = (monthMap[monthKey] || 0) + expense.amount;
        });

        const monthFormatted = Object.entries(monthMap)
          .map(([month, total]) => ({ month, total }))
          .sort((a, b) => a.month.localeCompare(b.month));

        setMonthlyData(monthFormatted);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  const total = categoryData.reduce((s, d) => s + d.value, 0);

  const topCategory =
    categoryData.length > 0
      ? categoryData.reduce((a, b) => (a.value > b.value ? a : b))
          .category
      : "N/A";

  const avgExpense = allExpenses.length > 0 
    ? Math.round(total / allExpenses.length)
    : 0;

  return (
    <Box>
      <Navbar />

      <Box sx={{ maxWidth: 1400, mx: "auto", p: 3 }}>
        <Typography variant="h6" mb={3}>
          Reports & Analytics
        </Typography>

        {/* SUMMARY STATS */}
        <Grid container spacing={2} mb={3}>
          {[
            { label: "Total Spending", value: `₹${total}` },
            { label: "Top Category", value: topCategory },
            { label: "Categories", value: categoryData.length },
            { label: "Avg Per Expense", value: `₹${avgExpense}` },
          ].map((item, i) => (
            <Grid item xs={12} md={3} key={i}>
              <Card
                sx={{
                  position: "relative",
                  borderRadius: 3,
                  background:
                    "linear-gradient(145deg, #111827, #0b0f19)",
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

        {/* CHARTS */}
        <Card
          sx={{
            p: 3,
            borderRadius: 3,
            background: "#111827",
            border: "1px solid #1f2937",
          }}
        >
          {categoryData.length > 0 && (
            <Charts 
              data={categoryData} 
              timeData={timeData}
              monthlyData={monthlyData}
            />
          )}
        </Card>
      </Box>
    </Box>
  );
}