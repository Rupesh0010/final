import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  IconButton,
  Avatar,
  Grid,
  Card,
  CardContent,
  TextField,
  MenuItem,
  AppBar,
  Toolbar,
  Badge,
  useTheme,
} from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { DataGrid } from "@mui/x-data-grid";
import Papa from "papaparse";
import dayjs from "dayjs";
import csvData from "../data/sample.csv?raw";

// Color palette consistent with your NCR/GCR/FPR pages
const COLORS = ["#3e8ef7", "#00b8a9", "#f6a623", "#f45b69", "#8e44ad"];

export default function DenialRatePage() {
  const theme = useTheme();

  // States to store data
  const [monthlyDenialRate, setMonthlyDenialRate] = useState([]);
  const [comparisonDenialRate, setComparisonDenialRate] = useState([]);
  const [overallDenialRate, setOverallDenialRate] = useState(0);
  const [totalClaims, setTotalClaims] = useState(0);
  const [totalDeniedClaims, setTotalDeniedClaims] = useState(0);
  const [payerBreakdown, setPayerBreakdown] = useState([]);
  const [deptBreakdown, setDeptBreakdown] = useState([]);
  const [claims, setClaims] = useState([]);
  const [filters, setFilters] = useState({ dateRange: "365" });

  useEffect(() => {
    Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        // Parse data and convert dates with dayjs
        const allData = results.data.map((row) => ({
          ...row,
          DateOfService: dayjs(row.DateOfService),
          Status: (row.Status || "").toLowerCase(),
        }));

        const today = dayjs();

        // Filter by date range
        const filteredData = allData.filter(
          (row) =>
            row.DateOfService.isValid() &&
            today.diff(row.DateOfService, "day") <= parseInt(filters.dateRange)
        );

        // Total claims and denied claims count
        const total = filteredData.length;
        const deniedCount = filteredData.filter((r) => r.Status === "denied").length;

        setTotalClaims(total);
        setTotalDeniedClaims(deniedCount);
        setOverallDenialRate(total ? ((deniedCount / total) * 100).toFixed(2) : 0);

        // Month order for consistent x-axis and grouping
        const monthOrder = [
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December",
        ];

        // Group claims by month for denial rate calculation
        const monthStats = {};
        monthOrder.forEach((m) => (monthStats[m] = { total: 0, denied: 0 }));

        filteredData.forEach((r) => {
          const m = r.DateOfService.format("MMMM");
          if (monthStats[m]) {
            monthStats[m].total += 1;
            if (r.Status === "denied") monthStats[m].denied += 1;
          }
        });

        // Map monthly denial rate data (percentage)
        const monthlyData = monthOrder.map((m) => {
          const { total, denied } = monthStats[m];
          return {
            month: m,
            denialRate: total ? parseFloat(((denied / total) * 100).toFixed(2)) : 0,
          };
        });
        setMonthlyDenialRate(monthlyData);

        // Comparison: last 3 months average and last month denied rate
        const activeMonths = monthlyData.filter((m) => m.denialRate > 0);
        const last3 = activeMonths.slice(-3);
        const avgLast3 = last3.length
          ? last3.reduce((sum, m) => sum + m.denialRate, 0) / last3.length
          : 0;
        const lastMonth = last3.length ? last3[last3.length - 1] : { month: "Current", denialRate: 0 };
        setComparisonDenialRate([
          { period: "Last 3 Months Avg", denialRate: parseFloat(avgLast3.toFixed(2)) },
          { period: lastMonth.month, denialRate: lastMonth.denialRate },
        ]);

        // Payer-wise denial rate breakdown
        const payerMap = {};
        filteredData.forEach((r) => {
          const payer = r.Payer || "Unknown";
          if (!payerMap[payer]) payerMap[payer] = { total: 0, denied: 0 };
          payerMap[payer].total++;
          if (r.Status === "denied") payerMap[payer].denied++;
        });
        const payerData = Object.entries(payerMap).map(([name, data]) => ({
          name,
          denialRate: data.total ? parseFloat(((data.denied / data.total) * 100).toFixed(2)) : 0,
        }));
        setPayerBreakdown(payerData);

        // Department-wise denial rate breakdown
        const deptMap = {};
        filteredData.forEach((r) => {
          const dept = r.Dept || "Unknown";
          if (!deptMap[dept]) deptMap[dept] = { total: 0, denied: 0 };
          deptMap[dept].total++;
          if (r.Status === "denied") deptMap[dept].denied++;
        });
        const deptData = Object.entries(deptMap).map(([name, data]) => ({
          name,
          denialRate: data.total ? parseFloat(((data.denied / data.total) * 100).toFixed(2)) : 0,
        }));
        setDeptBreakdown(deptData);

        // Prepare claims data for table (show denial-specific fields)
        const claimsData = filteredData.map((row, idx) => ({
          id: row.ClaimID || idx,
          dateOfService: row.DateOfService.format("YYYY-MM-DD"),
          status: row.Status || "-",
          denialReason: row.DenialReason || "-",
          appealStatus: row.AppealStatus || "-",
          payer: row.Payer || "-",
          provider: row.Provider || "-",
          client: row.Client || "-",
          adjustmentReason: row.AdjustmentReason || "-",
        }));
        setClaims(claimsData);
      },
    });
  }, [filters]);

  // Style helper with consistent colors
  const chartCardStyle = (color) => ({
    borderRadius: theme.shape.borderRadius,
    borderLeft: `6px solid ${color}`,
    background: `linear-gradient(135deg, ${color}20 0%, #fff 100%)`,
    boxShadow: theme.shadows[2],
  });

  return (
    <Box sx={{ backgroundColor: "#f8fbff", minHeight: "100vh" }}>
      {/* AppBar with logo etc. */}
      <AppBar position="sticky" color="default" elevation={1}>
        <Toolbar>
          <Box
            component="img"
            src="/logo.png"
            alt="Logo"
            sx={{ height: 48, mr: 2 }}
          />
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
            Denial Rate Analysis
          </Typography>
          <IconButton aria-label="User Profile">
            <Badge
              overlap="circular"
              badgeContent={
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    bgcolor: "#44b84a",
                    borderRadius: "50%",
                  }}
                />
              }
            >
              <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                <AccountCircleIcon />
              </Avatar>
            </Badge>
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: { xs: 2, md: 3 } }}>
        {/* Date Range Selector */}
        <Box
          sx={{
            mb: 3,
            p: 2,
            display: "flex",
            gap: 2,
            bgcolor: "#fff",
            borderRadius: 2,
            alignItems: "center",
            justifyContent: { xs: "center", md: "flex-start" },
            flexWrap: "wrap",
          }}
        >
          <TextField
            select
            size="small"
            label="Date Range (days)"
            value={filters.dateRange}
            onChange={(e) =>
              setFilters({ ...filters, dateRange: e.target.value })
            }
            sx={{ minWidth: 200 }}
            aria-label="Select date range for filtering"
          >
            <MenuItem value="30">Last 30 Days</MenuItem>
            <MenuItem value="90">Last 90 Days</MenuItem>
            <MenuItem value="180">Last 180 Days</MenuItem>
            <MenuItem value="365">Last 1 Year</MenuItem>
          </TextField>
        </Box>

        {/* KPI Cards */}
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} md={4}>
            <Card
              sx={chartCardStyle("#3e8ef7")}
              role="region"
              aria-label="Overall Denial Rate"
            >
              <CardContent>
                <Typography
                  variant="subtitle2"
                  color={theme.palette.text.secondary}
                  gutterBottom
                >
                  Overall Denial Rate
                </Typography>
                <Typography
                  variant="h3"
                  fontWeight={700}
                  color={theme.palette.primary.main}
                >
                  {overallDenialRate}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card
              sx={chartCardStyle("#f45b69")}
              role="region"
              aria-label="Total Claims"
            >
              <CardContent>
                <Typography
                  variant="subtitle2"
                  color={theme.palette.text.secondary}
                  gutterBottom
                >
                  Total Claims
                </Typography>
                <Typography
                  variant="h3"
                  fontWeight={700}
                  color={theme.palette.error.main}
                >
                  {totalClaims.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card
              sx={chartCardStyle("#f6a623")}
              role="region"
              aria-label="Total Denied Claims"
            >
              <CardContent>
                <Typography
                  variant="subtitle2"
                  color={theme.palette.text.secondary}
                  gutterBottom
                >
                  Total Denied Claims
                </Typography>
                <Typography
                  variant="h3"
                  fontWeight={700}
                  color={theme.palette.warning.main}
                >
                  {totalDeniedClaims.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Charts */}
        <Grid container spacing={4}>
          {/* Monthly Denial Rate Trend */}
          <Grid item xs={12} md={8}>
            <Card
              sx={chartCardStyle("#3e8ef7")}
              role="region"
              aria-label="Monthly Denial Rate Trend chart"
            >
              <CardContent>
                <Typography
                  variant="h6"
                  gutterBottom
                  color={theme.palette.primary.main}
                >
                  Monthly Denial Rate Trend
                </Typography>
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={monthlyDenialRate}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={theme.palette.divider}
                    />
                    <XAxis
                      dataKey="month"
                      stroke={theme.palette.text.secondary}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tickFormatter={(v) => `${v}%`}
                      stroke={theme.palette.text.secondary}
                    />
                    <RechartsTooltip formatter={(v) => `${v}%`} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="denialRate"
                      stroke="#3e8ef7"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Last 3 Months Comparison */}
          <Grid item xs={12} md={4}>
            <Card
              sx={chartCardStyle("#00b8a9")}
              role="region"
              aria-label="Denial Rate Comparison bar chart"
            >
              <CardContent>
                <Typography
                  variant="h6"
                  gutterBottom
                  color={theme.palette.info.main}
                >
                  3-Month Comparison
                </Typography>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={comparisonDenialRate}>
                    <XAxis
                      dataKey="period"
                      stroke={theme.palette.text.secondary}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tickFormatter={(v) => `${v}%`}
                      stroke={theme.palette.text.secondary}
                    />
                    <RechartsTooltip formatter={(v) => `${v}%`} />
                    <Legend />
                    <Bar
                      dataKey="denialRate"
                      fill="#00b8a9"
                      radius={[8, 8, 0, 0]}
                      barSize={30}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Payer Denial Rate Breakdown (Pie Chart) */}
          <Grid item xs={12} md={6}>
            <Card
              sx={chartCardStyle("#f45b69")}
              role="region"
              aria-label="Payer-wise Denial Rate Pie chart"
            >
              <CardContent>
                <Typography
                  variant="h6"
                  gutterBottom
                  color={theme.palette.error.main}
                >
                  Payer-wise Denial Rate
                </Typography>
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={payerBreakdown}
                      dataKey="denialRate"
                      nameKey="name"
                      outerRadius={110}
                      label={(entry) => `${entry.name}: ${entry.denialRate}%`}
                    >
                      {payerBreakdown.map((_, index) => (
                        <Cell
                          key={`cell-payer-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(v) => `${v}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Dept Denial Rate Breakdown (Pie Chart) */}
          <Grid item xs={12} md={6}>
            <Card
              sx={chartCardStyle("#f6a623")}
              role="region"
              aria-label="Department-wise Denial Rate Pie chart"
            >
              <CardContent>
                <Typography
                  variant="h6"
                  gutterBottom
                  color={theme.palette.warning.main}
                >
                  Department-wise Denial Rate
                </Typography>
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={deptBreakdown}
                      dataKey="denialRate"
                      nameKey="name"
                      outerRadius={110}
                      label={(entry) => `${entry.name}: ${entry.denialRate}%`}
                    >
                      {deptBreakdown.map((_, index) => (
                        <Cell
                          key={`cell-dept-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(v) => `${v}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Claims Table */}
        <Grid item xs={12} mt={4}>
          <Card
            sx={chartCardStyle("#8e44ad")}
            role="region"
            aria-label="Claims Detail Table"
          >
            <CardContent>
              <Typography
                variant="h6"
                color={theme.palette.primary.main}
                gutterBottom
              >
                Claim Level Details
              </Typography>
              <Box sx={{ height: 420 }}>
                <DataGrid
                  rows={claims}
                  columns={[
                    { field: "id", headerName: "Claim ID", width: 110 },
                    { field: "dateOfService", headerName: "Date of Service", width: 130 },
                    { field: "status", headerName: "Status", width: 110 },
                    { field: "denialReason", headerName: "Denial Reason", width: 170 },
                    { field: "appealStatus", headerName: "Appeal Status", width: 150 },
                    { field: "adjustmentReason", headerName: "Adjustment Reason", width: 180 },
                    { field: "payer", headerName: "Payer", width: 130 },
                    { field: "provider", headerName: "Provider", width: 130 },
                    { field: "client", headerName: "Client", width: 130 },
                  ]}
                  pageSize={6}
                  rowsPerPageOptions={[6, 12]}
                  disableSelectionOnClick
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Box>
    </Box>
  );
}
