import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import api from "../api/axios";

import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  CircularProgress,
} from "@mui/material";

export default function Insights() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchInsights = async () => {
    try {
      const res = await api.get("/insights");
      setData(res.data);
    } catch (err) {
      console.error("Failed to fetch insights", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={10}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Navbar />

      <Box sx={{ maxWidth: 1200, mx: "auto", p: 3 }}>
        <Typography variant="h5" mb={3}>
          AI Insights
        </Typography>
{/* 
        // --- SCORE CARD --- */}
<Card
  sx={{
    mb: 3,
    p: 4,
    borderRadius: 4,
    background: "linear-gradient(135deg, #0f172a, #1e293b)",
    border: "1px solid rgba(255,255,255,0.08)",
  }}
>
  <Typography color="text.secondary">Financial Health</Typography>

        <Typography
            variant="h2"
            sx={{
            fontWeight: 700,
            background: "linear-gradient(90deg, #6366f1, #22c55e)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            }}
        >
            {data.score}
        </Typography>

        <Typography
            sx={{
            color:
                data.score > 80
                ? "#22c55e"
                : data.score > 60
                ? "#eab308"
                : "#ef4444",
            fontWeight: 500,
            }}
        >
            {data.status}
        </Typography>
        </Card>

        {/* SUMMARY */}
                    <Grid container spacing={2} mb={3}>
            {[
                { label: "Total Spend", value: `₹${data.total_spent}` },
                { label: "Average", value: `₹${data.average_expense}` },
                {
                label: "Prediction",
                value: data.forecast?.predicted_next_month
                    ? `₹${Math.round(data.forecast.predicted_next_month)}`
                    : "N/A",
                },
            ].map((item, i) => (
                <Grid item xs={12} md={4} key={i}>
                <Card
                    sx={{
                    p: 3,
                    borderRadius: 3,
                    background: "#111827",
                    border: "1px solid #1f2937",
                    }}
                >
                    <Typography color="text.secondary">{item.label}</Typography>
                    <Typography variant="h6" mt={1}>
                    {item.value}
                    </Typography>
                </Card>
                </Grid>
            ))}
            </Grid>

        {/* FORECAST DETAILS */}
        <Card sx={{ p: 3, mb: 3, borderRadius: 3 }}>
  <Typography variant="subtitle1" mb={1}>
    Forecast Details
  </Typography>

        {data.forecast?.trend === "insufficient_data" ? (
            <Typography color="text.secondary">
            Not enough data to generate reliable predictions yet.
            </Typography>
        ) : (
            <>
            <Typography>
                Spending Range Prediction for Next Month: ₹{Math.round( data.forecast.confidence_range?.[0])-1} – ₹
                {Math.round(data.forecast.confidence_range?.[1])}
            </Typography>

            <Typography mt={1}>
                Trend:{" "}
                <span
                style={{
                    color:
                    data.forecast.trend === "increasing"
                        ? "#ef4444"
                        : "#22c55e",
                }}
                >
                {data.forecast.trend}
                </span>
            </Typography>
            </>
        )}
        </Card>

        {/* INSIGHTS */}
                    <Card sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" mb={2}>
                Smart Insights
            </Typography>

            {data.insights.map((insight, i) => (
                <Box
                key={i}
                sx={{
                    p: 2,
                    mb: 1.5,
                    borderRadius: 2,
                    background: "rgba(99,102,241,0.1)",
                    border: "1px solid rgba(99,102,241,0.2)",
                }}
                >
                <Typography>{insight}</Typography>
                </Box>
            ))}
</Card>
      </Box>
    </Box>
  );
}