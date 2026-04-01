import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
} from "@mui/material";

export default function Login() {
  const { login } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "grid", gridTemplateColumns: { md: "1fr 1fr" } }}>
      
      {/* LEFT SIDE */}
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          px: 6,
          background: "radial-gradient(circle at top, #1f2937, #020617)",
        }}
      >
        <Typography variant="h3" fontWeight={700} mb={2} color="#6366f1">
          FlowTrack
        </Typography>

        <Typography color="text.secondary" textAlign="center" maxWidth={400}>
          Track your expenses, understand your spending patterns,
          and stay in control of your finances with a clean and
          intuitive dashboard.
        </Typography>
      </Box>

      {/* RIGHT SIDE */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", p: 4 }}>
        <Card
          sx={{
            width: "100%",
            maxWidth: 400,
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
              pointerEvents: "none", // 🔥 THIS FIXES IT
            },
          }}
        >
          <CardContent>
            <Typography variant="h6" mb={3}>
              Welcome back
            </Typography>

            <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={2}>
              <TextField
                label="Email"
                name="email"
                value={form.email}
                onChange={handleChange}
                fullWidth
              />

              <TextField
                label="Password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                fullWidth
              />

              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                sx={{
                  mt: 1,
                  background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                }}
              >
                {loading ? "Signing in..." : "Login"}
              </Button>

              <Typography textAlign="center" variant="body2" color="text.secondary">
                Don’t have an account?{" "}
                <Link to="/register" style={{ color: "#6366f1" }}>
                  Register
                </Link>
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}