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
  Chip,
  LinearProgress,
} from "@mui/material";

const TREND_COLOR = {
  increasing: "#ef4444",
  decreasing: "#f59e0b",
  stable: "#22c55e",
};

export default function Insights() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchInsights = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await api.get("/insights");
      setData(res.data);
    } catch (err) {
      console.error("Failed to fetch insights", err);
      setError(true);
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

  if (error || !data) {
    return (
      <Box>
        <Navbar />
        <Box sx={{ maxWidth: 1200, mx: "auto", p: 3, textAlign: "center" }}>
          <Typography color="text.secondary" mt={6}>
            Couldn't load your insights right now. Please try again in a moment.
          </Typography>
        </Box>
      </Box>
    );
  }

  const {
    score = 0,
    status,
    total_spent,
    average_expense,
    volatility_cv,
    necessary_spent,
    discretionary_spent,
    neutral_spent,
    anomalies = [],
    forecast,
    insights = [],
  } = data;

  const breakdownTotal =
    (necessary_spent || 0) + (discretionary_spent || 0) + (neutral_spent || 0) || 1;

  return (
    <Box>
      <Navbar />

      <Box sx={{ maxWidth: 1200, mx: "auto", p: 3 }}>
        <Typography variant="h5" mb={3}>
          AI Insights
        </Typography>

        {/* --- SCORE CARD --- */}
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
            {score}
          </Typography>

          <Typography
            sx={{
              color: score > 80 ? "#22c55e" : score > 60 ? "#eab308" : "#ef4444",
              fontWeight: 500,
            }}
          >
            {status}
          </Typography>

          {typeof volatility_cv === "number" && (
            <Typography color="text.secondary" variant="body2" mt={1}>
              Spending volatility: {volatility_cv.toFixed(2)}
              {volatility_cv > 0.8 ? " (quite unpredictable)" : volatility_cv > 0.4 ? " (moderate)" : " (steady)"}
            </Typography>
          )}
        </Card>

        {/* SUMMARY */}
        <Grid container spacing={2} mb={3}>
          {[
            { label: "Total Spend", value: `₹${Math.round(total_spent || 0)}` },
            { label: "Average", value: `₹${Math.round(average_expense || 0)}` },
            {
              label: "Prediction",
              value: forecast?.predicted_next_month
                ? `₹${Math.round(forecast.predicted_next_month)}`
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

        {/* SPEND BREAKDOWN */}
        <Card sx={{ p: 3, mb: 3, borderRadius: 3 }}>
          <Typography variant="subtitle1" mb={2}>
            Where Your Money Goes
          </Typography>

          <Box sx={{ display: "flex", height: 10, borderRadius: 5, overflow: "hidden", mb: 2 }}>
            <Box sx={{ width: `${((necessary_spent || 0) / breakdownTotal) * 100}%`, background: "#22c55e" }} />
            <Box sx={{ width: `${((discretionary_spent || 0) / breakdownTotal) * 100}%`, background: "#ef4444" }} />
            <Box sx={{ width: `${((neutral_spent || 0) / breakdownTotal) * 100}%`, background: "#6b7280" }} />
          </Box>

          <Grid container spacing={2}>
            {[
              { label: "Necessary", value: necessary_spent, color: "#22c55e" },
              { label: "Discretionary", value: discretionary_spent, color: "#ef4444" },
              { label: "Neutral", value: neutral_spent, color: "#6b7280" },
            ].map((item, i) => (
              <Grid item xs={12} md={4} key={i}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box sx={{ width: 10, height: 10, borderRadius: "50%", background: item.color }} />
                  <Typography color="text.secondary" variant="body2">
                    {item.label}
                  </Typography>
                </Box>
                <Typography variant="h6" mt={0.5}>
                  ₹{Math.round(item.value || 0)}
                </Typography>
              </Grid>
            ))}
          </Grid>
        </Card>

        {/* FORECAST DETAILS */}
        <Card sx={{ p: 3, mb: 3, borderRadius: 3 }}>
          <Typography variant="subtitle1" mb={1}>
            Forecast Details
          </Typography>

          {forecast ? (
            <>
              <Typography>
                {forecast.confidence_range?.length === 2
                  ? `Spending range prediction for next month: ₹${Math.round(
                      forecast.confidence_range[0]
                    )} – ₹${Math.round(forecast.confidence_range[1])}`
                  : `Estimated next month spending: ₹${Math.round(
                      forecast.predicted_next_month
                    )}`}
              </Typography>

              <Box display="flex" alignItems="center" gap={1} mt={1}>
                <Typography>Trend:</Typography>
                <span
                  style={{
                    color: TREND_COLOR[forecast.trend] || "#9ca3af",
                    fontWeight: 500,
                  }}
                >
                  {forecast.trend === "insufficient_data" ? "Low confidence" : forecast.trend}
                </span>
                {typeof forecast.trend_strength_pct === "number" &&
                  forecast.trend !== "insufficient_data" && (
                    <Typography color="text.secondary" variant="body2">
                      ({forecast.trend_strength_pct > 0 ? "+" : ""}
                      {forecast.trend_strength_pct}% / month)
                    </Typography>
                  )}
              </Box>

              {forecast.method && (
                <Chip
                  size="small"
                  label={forecast.method === "prophet" ? "Model: Prophet" : "Model: simple trend"}
                  sx={{
                    mt: 1.5,
                    background: "rgba(99,102,241,0.12)",
                    color: "#a5b4fc",
                    border: "1px solid rgba(99,102,241,0.25)",
                  }}
                />
              )}

              {forecast.trend === "insufficient_data" && (
                <Typography color="text.secondary" mt={1}>
                  This forecast is based on limited history and may be approximate.
                </Typography>
              )}
            </>
          ) : (
            <Typography color="text.secondary">
              Not enough data to generate reliable predictions yet.
            </Typography>
          )}
        </Card>

        {/* ANOMALIES */}
        {anomalies.length > 0 && (
          <Card sx={{ p: 3, mb: 3, borderRadius: 3 }}>
            <Typography variant="subtitle1" mb={2}>
              Flagged Transactions
            </Typography>
            <Grid container spacing={1.5}>
              {anomalies.map((a, i) => (
                <Grid item xs={12} sm={6} md={4} key={i}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      background: "rgba(239,68,68,0.08)",
                      border: "1px solid rgba(239,68,68,0.2)",
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      {a.date} · {a.category}
                    </Typography>
                    <Typography variant="h6" mt={0.5}>
                      ₹{Math.round(a.amount)}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Card>
        )}

        {/* INSIGHTS */}
        <Card sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h6" mb={2}>
            Smart Insights
          </Typography>

          {insights.length === 0 ? (
            <Typography color="text.secondary">
              No notable insights yet — add a bit more expense history to unlock these.
            </Typography>
          ) : (
            insights.map((insight, i) => (
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
            ))
          )}
        </Card>
      </Box>
    </Box>
  );
}
