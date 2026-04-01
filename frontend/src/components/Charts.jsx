import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
} from "recharts";

const COLORS = [
  "#6366f1",
  "#22c55e",
  "#f97316",
  "#ef4444",
  "#a855f7",
];

export default function Charts({ data, timeData, monthlyData }) {
  // Sort data for bar chart
  const sortedData = [...data].sort((a, b) => b.value - a.value).slice(0, 5);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      
      {/* ROW 1: PIE CHART & BAR CHART */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        
        {/* PIE CHART */}
        <div
          style={{
            background: "#111827",
            borderRadius: "16px",
            border: "1px solid #1f2937",
            padding: "16px",
          }}
        >
          <h3
            style={{
              color: "#e5e7eb",
              marginBottom: "12px",
              margin: "0 0 12px 0",
            }}
          >
            Category-wise Spending
          </h3>
          <div
            style={{
              width: "100%",
              height: 300,
              background: "#111827",
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  stroke="none"
                >
                  {data.map((_, index) => (
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
        </div>

        {/* BAR CHART */}
        <div
          style={{
            background: "#111827",
            borderRadius: "16px",
            border: "1px solid #1f2937",
            padding: "16px",
          }}
        >
          <h3
            style={{
              color: "#e5e7eb",
              marginBottom: "12px",
              margin: "0 0 12px 0",
            }}
          >
            Top 5 Categories
          </h3>
          <div
            style={{
              width: "100%",
              height: 300,
              background: "#111827",
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sortedData}>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="#374151"
                  vertical={false}
                />
                <XAxis 
                  dataKey="category" 
                  stroke="#9ca3af"
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  stroke="#9ca3af"
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />
                <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ROW 2: SPENDING TREND */}
      {timeData && timeData.length > 0 && (
        <div
          style={{
            background: "#111827",
            borderRadius: "16px",
            border: "1px solid #1f2937",
            padding: "16px",
          }}
        >
          <h3
            style={{
              color: "#e5e7eb",
              marginBottom: "12px",
              margin: "0 0 12px 0",
            }}
          >
            Spending Trend Over Time
          </h3>
          <div
            style={{
              width: "100%",
              height: 300,
              background: "#111827",
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeData}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="#374151"
                  vertical={false}
                />
                <XAxis 
                  dataKey="date" 
                  stroke="#9ca3af"
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  stroke="#9ca3af"
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#6366f1" 
                  fillOpacity={1} 
                  fill="url(#colorAmount)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ROW 3: MONTHLY TREND */}
      {monthlyData && monthlyData.length > 0 && (
        <div
          style={{
            background: "#111827",
            borderRadius: "16px",
            border: "1px solid #1f2937",
            padding: "16px",
          }}
        >
          <h3
            style={{
              color: "#e5e7eb",
              marginBottom: "12px",
              margin: "0 0 12px 0",
            }}
          >
            Monthly Spending
          </h3>
          <div
            style={{
              width: "100%",
              height: 300,
              background: "#111827",
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="#374151"
                  vertical={false}
                />
                <XAxis 
                  dataKey="month" 
                  stroke="#9ca3af"
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  stroke="#9ca3af"
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />
                <Legend wrapperStyle={{ color: "#9ca3af" }} />
                <Line 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#22c55e" 
                  strokeWidth={2}
                  dot={{ fill: "#22c55e", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}