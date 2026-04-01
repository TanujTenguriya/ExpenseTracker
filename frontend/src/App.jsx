import { Routes, Route, Navigate } from "react-router-dom";

// Pages (we will create these next)
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AddExpense from "./pages/AddExpense";
import Reports from "./pages/Reports";
import { useAuth } from "./context/AuthContext";
import Insights from "./pages/Insights";
// Temporary auth check (we'll improve later)


function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return null;

  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/dashboard"
        element={
          isAuthenticated ? <Dashboard /> : <Navigate to="/" replace />
        }
      />

      <Route
        path="/add-expense"
        element={
          isAuthenticated ? <AddExpense /> : <Navigate to="/" replace />
        }
      />

      <Route
        path="/reports"
        element={
          isAuthenticated ? <Reports /> : <Navigate to="/" replace />
        }
      />

        <Route
        path="/insights"
        element={
          isAuthenticated ? <Insights /> : <Navigate to="/" replace />
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
