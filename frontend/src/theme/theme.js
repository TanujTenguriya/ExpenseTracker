import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#0b0f19",
      paper: "#111827",
    },
    primary: {
      main: "#6366f1",
    },
    success: {
      main: "#22c55e",
    },
    error: {
      main: "#ef4444",
    },
  },

  shape: {
    borderRadius: 12,
  },

  typography: {
    fontFamily: "Inter, sans-serif",
  },

  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: "#111827",
          border: "1px solid #1f2937",
          transition: "0.2s ease",
        },
      },
    },

    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 500,
        },
      },
    },

    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            backgroundColor: "#0b0f19",
          },
        },
      },
    },

    MuiSelect: {
      styleOverrides: {
        root: {
          backgroundColor: "#0b0f19",
        },
      },
    },
  },
});

export default theme;