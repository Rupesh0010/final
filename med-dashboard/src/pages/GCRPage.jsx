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
  useTheme
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
  Cell
} from "recharts";
import Papa from "papaparse";
import dayjs from "dayjs";
import csvData from "../data/sample.csv?raw";

const COLORS = ["#3e8ef7", "#00b8a9", "#f6a623", "#f45b69", "#8e44ad"];

const GCRPage = () => {
  const theme = useTheme();
  const [monthlyGCR, setMonthlyGCR] = useState([]);
  const [comparisonGCR, setComparisonGCR] = useState([]);
  const [overallGCR, setOverallGCR] = useState(0);
  const [totalBilled, setTotalBilled] = useState(0);
  const [totalPaid, setTotalPaid] = useState(0);
  const [payerBreakdown, setPayerBreakdown] = useState([]);
  const [deptBreakdown, setDeptBreakdown] = useState([]);
  const [filters, setFilters] = useState({ dateRange: "365" });

  useEffect(() => {
    Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const allData = results.data.map((row) => ({
          ...row,
          AmountBilled: Number(row.AmountBilled || 0),
          AmountPaid: Number(row.AmountPaid || 0),
          DateOfService: dayjs(row.DateOfService),
        }));

        // Filter by date range
        const today = dayjs();
        const filteredData = allData.filter(
          (row) =>
            row.DateOfService.isValid() &&
            today.diff(row.DateOfService, "day") <= parseInt(filters.dateRange)
        );

        // Totals
        const totalPaidVal = filteredData.reduce((sum, r) => sum + r.AmountPaid, 0);
        const totalBilledVal = filteredData.reduce((sum, r) => sum + r.AmountBilled, 0);
        setTotalBilled(totalBilledVal);
        setTotalPaid(totalPaidVal);
        setOverallGCR(
          totalBilledVal ? ((totalPaidVal / totalBilledVal) * 100).toFixed(2) : 0
        );

        const monthOrder = [
          "January", "February", "March", "April", "May",
          "June", "July", "August", "September", "October", "November", "December"
        ];

        const groupedByMonth = {};
        monthOrder.forEach((m) => (groupedByMonth[m] = []));
        filteredData.forEach((row) => {
          if (!row.DateOfService.isValid()) return;
          const month = row.DateOfService.format("MMMM");
          if (groupedByMonth[month]) groupedByMonth[month].push(row);
        });

        const monthlyData = monthOrder.map((month) => {
          const rows = groupedByMonth[month];
          const totalPaidM = rows.reduce((sum, r) => sum + r.AmountPaid, 0);
          const totalBilledM = rows.reduce((sum, r) => sum + r.AmountBilled, 0);
          const gcr = totalBilledM ? (totalPaidM / totalBilledM) * 100 : 0;
          return { month, gcr: parseFloat(gcr.toFixed(2)) };
        });
        setMonthlyGCR(monthlyData);

        const availableMonths = monthlyData.filter((m) => m.gcr > 0);
        const lastMonthData = availableMonths[availableMonths.length - 1];
        const last3 = availableMonths.slice(-4, -1);
        const avgLast3 =
          last3.length > 0
            ? last3.reduce((sum, m) => sum + m.gcr, 0) / last3.length
            : 0;

        setComparisonGCR([
          { period: "Last 3 Months Avg", gcr: parseFloat(avgLast3.toFixed(2)) },
          { period: lastMonthData?.month || "Current", gcr: lastMonthData?.gcr || 0 },
        ]);

        // Payer Breakdown
        const payerMap = {};
        filteredData.forEach((row) => {
          const payer = row.Payer || "Unknown";
          payerMap[payer] = (payerMap[payer] || 0) + row.AmountPaid;
        });
        setPayerBreakdown(
          Object.entries(payerMap).map(([name, value]) => ({ name, value }))
        );

        // Department Breakdown
        const deptMap = {};
        filteredData.forEach((row) => {
          const dept = row.Department || "Unknown";
          deptMap[dept] = (deptMap[dept] || 0) + row.AmountPaid;
        });
        setDeptBreakdown(
          Object.entries(deptMap).map(([name, value]) => ({ name, value }))
        );
      },
    });
  }, [filters]);

  const chartCardStyle = (color) => ({
    borderRadius: theme.shape.borderRadius,
    borderLeft: `6px solid ${color}`,
    background: `linear-gradient(135deg, ${color}20 0%, #fff 100%)`,
    boxShadow: theme.shadows[2],
  });

  return (
    <Box sx={{ backgroundColor: "#f8fbff", minHeight: "100vh" }}>
      {/* Top AppBar */}
      <AppBar position="sticky" color="default" elevation={1}>
        <Toolbar>
          <Box
            component="img"
            src="/logo.png"
            alt="Logo"
            sx={{ height: 48, mr: 2 }}
          />
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
            Gross Collection Rate (GCR) Analysis
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
        {/* Date Range Filter */}
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
            <Card sx={chartCardStyle("#3e8ef7")} role="region" aria-label="Overall GCR">
              <CardContent>
                <Typography variant="subtitle2" color={theme.palette.text.secondary} gutterBottom>
                  Overall GCR
                </Typography>
                <Typography variant="h3" fontWeight={700} color={theme.palette.primary.main}>
                  {overallGCR}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={chartCardStyle("#00b8a9")} role="region" aria-label="Total Charges Billed">
              <CardContent>
                <Typography variant="subtitle2" color={theme.palette.text.secondary} gutterBottom>
                  Total Charges Billed
                </Typography>
                <Typography variant="h3" fontWeight={700} color={theme.palette.success.main}>
                  ${totalBilled.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={chartCardStyle("#f6a623")} role="region" aria-label="Total Payments Received">
              <CardContent>
                <Typography variant="subtitle2" color={theme.palette.text.secondary} gutterBottom>
                  Total Payments Received
                </Typography>
                <Typography variant="h3" fontWeight={700} color={theme.palette.warning.main}>
                  ${totalPaid.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Charts */}
        <Grid container spacing={4}>

          {/* Month-wise GCR Trend Line Chart - width 8 columns */}
          <Grid item xs={12} md={8}>
            <Card sx={chartCardStyle("#3e8ef7")} role="region" aria-label="Month-wise Gross Collection Rate Trend chart">
              <CardContent>
                <Typography variant="h4" fontWeight={700} gutterBottom color={theme.palette.primary.main}>
                  Month-wise GCR Trend
                </Typography>
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={monthlyGCR}>
                    <CartesianGrid strokeDasharray="5 5" stroke={theme.palette.divider} />
                    <XAxis dataKey="month" stroke={theme.palette.text.secondary} />
                    <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} stroke={theme.palette.text.secondary} />
                    <RechartsTooltip formatter={(v) => `${v}%`} />
                    <Legend />
                    <Line type="monotone" dataKey="gcr" stroke="#3e8ef7" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* 3-Month Comparison Bar Chart - width 4 columns */}
          <Grid item xs={12} md={4}>
            <Card sx={chartCardStyle("#00b8a9")} role="region" aria-label="3-Month Gross Collection Rate comparison chart">
              <CardContent>
                <Typography variant="h4" fontWeight={700} gutterBottom color={theme.palette.info.main}>
                  3-Month Trends
                </Typography>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={comparisonGCR}>
                    <XAxis dataKey="period" stroke={theme.palette.text.secondary} />
                    <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} stroke={theme.palette.text.secondary} />
                    <RechartsTooltip formatter={(v) => `${v}%`} />
                    <Legend />
                    <Bar dataKey="gcr" fill="#00b8a9" radius={[8, 8, 0, 0]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Payer Breakdown Pie Chart - width 6 columns */}
          <Grid item xs={12} md={6}>
            <Card sx={chartCardStyle("#f6a623")} role="region" aria-label="Payer Breakdown pie chart">
              <CardContent>
                <Typography variant="h4" fontWeight={700} gutterBottom color={theme.palette.warning.main}>
                  Payer Breakdown
                </Typography>
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={payerBreakdown}
                      dataKey="value"
                      nameKey="name"
                      label
                      outerRadius={110}
                      fill={theme.palette.warning.main}
                      stroke="none"
                    >
                      {payerBreakdown.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Department / Specialty Bar Chart - width 6 columns */}
          <Grid item xs={12} md={6}>
            <Card sx={chartCardStyle("#8e44ad")} role="region" aria-label="Department and Specialty Breakdown bar chart">
              <CardContent>
                <Typography variant="h6" fontWeight={700} gutterBottom color={theme.palette.secondary.main}>
                  Department / Specialty Breakdown
                </Typography>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={deptBreakdown}>
                    <XAxis dataKey="name" stroke={theme.palette.text.secondary} />
                    <YAxis stroke={theme.palette.text.secondary} />
                    <RechartsTooltip />
                    <Bar dataKey="value" fill="#8e44ad" radius={[8, 8, 0, 0]} barSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

        </Grid>
      </Box>
    </Box>
  );
};

export default GCRPage;
