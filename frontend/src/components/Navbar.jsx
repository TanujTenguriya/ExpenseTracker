import { Link, useNavigate } from "react-router-dom";
import { Box, Button, Typography } from "@mui/material";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <Box
      sx={{
        px: 4,
        py: 2,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "1px solid #1f2937",
        backgroundColor: "#111827",
      }}
    >
      <Typography
        variant="h6"
        sx={{ color: "#6366f1", fontWeight: 600 }}
      >
        FlowTrack
      </Typography>

      <Box sx={{ display: "flex", gap: 3 }}>
        <Link to="/dashboard" style={{ color: "#9ca3af" }}>
          Dashboard
        </Link>
        <Link to="/add-expense" style={{ color: "#9ca3af" }}>
          Add Expense
        </Link>
        <Link to="/insights" style={{ color: "#9ca3af" }}>
          Insights
        </Link>

        <Button color="error" onClick={handleLogout}>
          Logout
        </Button>
      </Box>
    </Box>
  );
}