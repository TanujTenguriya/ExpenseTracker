import {
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Box,
} from "@mui/material";

export default function ExpenseCard({ expense, onDelete, onEdit }) {
  return (
    <Card
      sx={{
        mb: 2,
        border: expense.isAnomaly
          ? "1px solid rgba(239,68,68,0.4)"
          : "1px solid #1f2937",
      }}
    >
      <CardContent
        sx={{
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <Box>
          <Typography variant="subtitle1">
            {expense.description}
          </Typography>

          <Typography variant="body2" color="text.secondary">
            {expense.category} •{" "}
            {new Date(expense.date).toLocaleDateString()}
          </Typography>

          {expense.isAnomaly && (
            <Chip
              label="Anomaly"
              color="error"
              size="small"
              sx={{ mt: 1 }}
            />
          )}
        </Box>

        <Box sx={{ textAlign: "right" }}>
  <Typography variant="h6">₹{expense.amount}</Typography>

  <Box>
    <Button
      onClick={() => onEdit(expense)}
    >
      Edit
    </Button>

    <Button
      color="error"
      size="small"
      onClick={() => onDelete(expense._id)}
    >
      Delete
    </Button>
  </Box>
</Box>
      </CardContent>
    </Card>
  );
}