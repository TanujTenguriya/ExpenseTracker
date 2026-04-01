import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";

import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Alert,
} from "@mui/material";

export default function Register() {
  const { register } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* ---- PASSWORD STRENGTH VALIDATION ---- */
  const validatePassword = (pass) => {
    const checks = {
      minLength: pass.length >= 8,
      hasUpper: /[A-Z]/.test(pass),
      hasLower: /[a-z]/.test(pass),
      hasNumber: /[0-9]/.test(pass),
      hasSymbol: /[!@#$%^&*]/.test(pass),
    };
    return checks;
  };

  const passwordStrength = validatePassword(form.password);
  const isPasswordValid = Object.values(passwordStrength).every(v => v);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.name.trim()) {
      setError("Full name is required");
      return;
    }

    if (!form.email.trim()) {
      setError("Email is required");
      return;
    }

    if (!isPasswordValid) {
      setError("Password does not meet requirements");
      return;
    }

    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
    } catch (err) {
      setError(err.message || "Registration failed");
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
          Create your account and start managing your expenses
          with a smarter and cleaner experience.
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
              Create account
            </Typography>

            <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={2}>
              {error && (
                <Alert severity="error">{error}</Alert>
              )}

              <TextField
                label="Full Name"
                name="name"
                value={form.name}
                onChange={handleChange}
                fullWidth
              />

              <TextField
                label="Email"
                name="email"
                type="email"
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
                error={form.password.length > 0 && !isPasswordValid}
              />

              {/* Password Strength Indicator */}
              {form.password.length > 0 && (
                <Box sx={{ bgcolor: "rgba(255,255,255,0.05)", p: 2, borderRadius: 1 }}>
                  <Typography variant="caption" fontWeight={600} mb={1} display="block">
                    Password Requirements:
                  </Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {passwordStrength.minLength ? (
                        <CheckCircleIcon sx={{ fontSize: 18, color: "#10b981" }} />
                      ) : (
                        <CancelIcon sx={{ fontSize: 18, color: "#ef4444" }} />
                      )}
                      <Typography variant="caption">At least 8 characters</Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {passwordStrength.hasUpper ? (
                        <CheckCircleIcon sx={{ fontSize: 18, color: "#10b981" }} />
                      ) : (
                        <CancelIcon sx={{ fontSize: 18, color: "#ef4444" }} />
                      )}
                      <Typography variant="caption">One uppercase letter</Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {passwordStrength.hasLower ? (
                        <CheckCircleIcon sx={{ fontSize: 18, color: "#10b981" }} />
                      ) : (
                        <CancelIcon sx={{ fontSize: 18, color: "#ef4444" }} />
                      )}
                      <Typography variant="caption">One lowercase letter</Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {passwordStrength.hasNumber ? (
                        <CheckCircleIcon sx={{ fontSize: 18, color: "#10b981" }} />
                      ) : (
                        <CancelIcon sx={{ fontSize: 18, color: "#ef4444" }} />
                      )}
                      <Typography variant="caption">One number</Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {passwordStrength.hasSymbol ? (
                        <CheckCircleIcon sx={{ fontSize: 18, color: "#10b981" }} />
                      ) : (
                        <CancelIcon sx={{ fontSize: 18, color: "#ef4444" }} />
                      )}
                      <Typography variant="caption">One symbol (!@#$%^&*)</Typography>
                    </Box>
                  </Box>
                </Box>
              )}

              <Button
                type="submit"
                variant="contained"
                disabled={loading || (form.password.length > 0 && !isPasswordValid)}
                sx={{
                  mt: 1,
                  background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                }}
              >
                {loading ? "Creating..." : "Register"}
              </Button>

              <Typography textAlign="center" variant="body2" color="text.secondary">
                Already have an account?{" "}
                <Link to="/" style={{ color: "#6366f1" }}>
                  Login
                </Link>
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}