// src/pages/ARDaysPage.jsx
import React, { useEffect, useState } from "react";
import {
  Box, Typography, IconButton, Avatar, Grid, Card, CardContent,
  TextField, MenuItem, AppBar, Toolbar, Badge,
  Drawer, List, ListItem, ListItemIcon, ListItemText, Divider, useTheme
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import DashboardIcon from "@mui/icons-material/Dashboard";
import BarChartIcon from "@mui/icons-material/BarChart";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell
} from "recharts";
import { DataGrid } from "@mui/x-data-grid";
import { useNavigate } from "react-router-dom";
import Papa from "papaparse";
import dayjs from "dayjs";
import csvData from "../data/sample.csv?raw";

const COLORS = [
  "#ae4ed7", "#00b8a9", "#f45b69", "#f6a623", "#3e8ef7",
  "#ff6f60", "#8e44ad", "#4caf50", "#9c27b0", "#00796b"
];

const ARDaysPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [arDays, setARDays] = useState(0);
  const [totalAR, setTotalAR] = useState(0);
  const [avgDailyCharges, setAvgDailyCharges] = useState(0);
  const [monthlyAR, setMonthlyAR] = useState([]);
  const [comparisonAR, setComparisonAR] = useState([]);
  const [payerBreakdown, setPayerBreakdown] = useState([]);
  const [claims, setClaims] = useState([]);
  const [filters, setFilters] = useState({ dateRange: "365" });

  useEffect(() => {
    Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const allData = results.data.map((row) => ({
          ...row,
          AmountAllowed: Number(row.AmountAllowed || 0),
          AmountPaid: Number(row.AmountPaid || 0),
          DateOfService: dayjs(row.DateOfService)
        }));

        const today = dayjs();
        const filtered = allData.filter(
          (row) =>
            row.DateOfService.isValid() &&
            today.diff(row.DateOfService, "day") <= parseInt(filters.dateRange)
        );

        const daysInRange = parseInt(filters.dateRange);

        // Approximate Total AR = outstanding amounts
        const totalARVal = filtered.reduce(
          (sum, r) => sum + Math.max(r.AmountAllowed - r.AmountPaid, 0),
          0
        );

        const totalCharges = filtered.reduce(
          (sum, r) => sum + r.AmountAllowed,
          0
        );

        const avgChargesPerDay = daysInRange > 0 ? totalCharges / daysInRange : 0;

        setTotalAR(totalARVal);
        setAvgDailyCharges(avgChargesPerDay);
        setARDays(avgChargesPerDay ? (totalARVal / avgChargesPerDay).toFixed(2) : 0);

        // Monthly AR Days trend
        const monthOrder = [
          "January", "February", "March", "April", "May", "June",
          "July", "August", "September", "October", "November", "December"
        ];
        const grouped = {};
        monthOrder.forEach(m => grouped[m] = { ar: 0, charges: 0, days: 0 });

        filtered.forEach(r => {
          const month = r.DateOfService.format("MMMM");
          if (grouped[month]) {
            grouped[month].ar += Math.max(r.AmountAllowed - r.AmountPaid, 0);
            grouped[month].charges += r.AmountAllowed;
            grouped[month].days += 1;
          }
        });

        const monthlyData = monthOrder.map(month => {
          const g = grouped[month];
          const avgChargesDay = g.days > 0 ? g.charges / g.days : 0;
          const arDaysVal = avgChargesDay ? g.ar / avgChargesDay : 0;
          return { month, arDays: parseFloat(arDaysVal.toFixed(2)) };
        });
        setMonthlyAR(monthlyData);

        // Comparison: last 3 months avg vs last month
        const activeMonths = monthlyData.filter(m => m.arDays > 0);
        const last3 = activeMonths.slice(-3);
        const avgLast3Months = last3.length
          ? last3.reduce((sum, m) => sum + m.arDays, 0) / last3.length
          : 0;
        const lastMonthData = last3.length
          ? last3[last3.length - 1]
          : { month: "Current", arDays: 0 };

        setComparisonAR([
          { period: "Last 3 Months Avg", arDays: parseFloat(avgLast3Months.toFixed(2)) },
          { period: lastMonthData.month, arDays: lastMonthData.arDays }
        ]);

        // Payer breakdown
        const payerMap = {};
        filtered.forEach(r => {
          const payer = r.Payer || "Unknown";
          if (!payerMap[payer]) {
            payerMap[payer] = { ar: 0, charges: 0, days: 0 };
          }
          payerMap[payer].ar += Math.max(r.AmountAllowed - r.AmountPaid, 0);
          payerMap[payer].charges += r.AmountAllowed;
          payerMap[payer].days += 1;
        });
        const payerData = Object.entries(payerMap).map(([name, val]) => {
          const avgChargesDay = val.days > 0 ? val.charges / val.days : 0;
          const arDaysVal = avgChargesDay ? val.ar / avgChargesDay : 0;
          return { name, arDays: parseFloat(arDaysVal.toFixed(2)) };
        });
        setPayerBreakdown(payerData);

        // Table rows
        const table = filtered.map((r, idx) => ({
          id: idx,
          dateOfService: r.DateOfService.format("YYYY-MM-DD"),
          payer: r.Payer || "-",
          provider: r.Provider || "-",
          client: r.Client || "-",
          amountAllowed: r.AmountAllowed,
          amountPaid: r.AmountPaid,
          arOutstanding: Math.max(r.AmountAllowed - r.AmountPaid, 0)
        }));
        setClaims(table);
      }
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
      {/* AppBar */}
      <AppBar position="sticky" color="default" elevation={1}>
        <Toolbar>
          {/* Hamburger menu icon */}
          <IconButton edge="start" onClick={() => setDrawerOpen(true)} sx={{ mr: 1 }}>
            <MenuIcon />
          </IconButton>
          {/* Logo beside menu */}
          <Box
            component="img"
            src="/logo.png"
            alt="Logo"
            sx={{ height: 40, mr: 2 }}
          />
          {/* Title */}
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
            A/R Days Analysis
          </Typography>
          <IconButton>
            <Badge
              overlap="circular"
              badgeContent={
                <Box sx={{ width: 10, height: 10, bgcolor: "#44b84a", borderRadius: "50%" }} />
              }
            >
              <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                <AccountCircleIcon />
              </Avatar>
            </Badge>
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 240 }} onClick={() => setDrawerOpen(false)}>
          <List>
            <ListItem button onClick={() => navigate("/")}>
              <ListItemIcon><DashboardIcon /></ListItemIcon>
              <ListItemText primary="Dashboard" />
            </ListItem>
            {/* Add other KPI page links here */}
            <Divider />
            <ListItem button>
              <ListItemIcon><FileDownloadIcon /></ListItemIcon>
              <ListItemText primary="Export Data" />
            </ListItem>
            <ListItem button>
              <ListItemIcon><HelpOutlineIcon /></ListItemIcon>
              <ListItemText primary="Help / Support" />
            </ListItem>
          </List>
        </Box>
      </Drawer>

      <Box sx={{ p: { xs: 2, md: 3 } }}>
        {/* Filters */}
        <Box sx={{
          mb: 3, p: 2, display: "flex", gap: 2, bgcolor: "#fff", borderRadius: 2,
          alignItems: "center", flexWrap: "wrap"
        }}>
          <TextField
            select
            size="small"
            label="Date Range (days)"
            value={filters.dateRange}
            onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
            sx={{ minWidth: 200 }}
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
            <Card sx={chartCardStyle("#3e8ef7")}>
              <CardContent>
                <Typography variant="subtitle2">A/R Days</Typography>
                <Typography variant="h3" fontWeight={700}>{arDays}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={chartCardStyle("#f45b69")}>
              <CardContent>
                <Typography variant="subtitle2">Total A/R ($)</Typography>
                <Typography variant="h3" fontWeight={700}>${totalAR.toLocaleString()}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={chartCardStyle("#4caf50")}>
              <CardContent>
                <Typography variant="subtitle2">Avg Daily Charges</Typography>
                <Typography variant="h3" fontWeight={700}>${avgDailyCharges.toFixed(2)}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Charts */}
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <Card sx={chartCardStyle("#3e8ef7")}>
              <CardContent>
                <Typography variant="h4" gutterBottom>Monthly A/R Days Trend</Typography>
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={monthlyAR}>
                    <CartesianGrid strokeDasharray="5 5" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Line type="monotone" dataKey="arDays" stroke="#3e8ef7" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={chartCardStyle("#00b8a9")}>
              <CardContent>
                <Typography variant="h4" gutterBottom>A/R Days Comparison</Typography>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={comparisonAR}>
                    <XAxis dataKey="period" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="arDays" fill="#00b8a9" barSize={30} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={chartCardStyle("#f6a623")}>
              <CardContent>
                <Typography variant="h4" gutterBottom>Payer-wise A/R Days</Typography>
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie data={payerBreakdown} dataKey="arDays" nameKey="name" outerRadius={100} label>
                      {payerBreakdown.map((_, idx) => (
                        <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Table */}
        <Grid item xs={12} sx={{ mt: 4 }}>
          <Card sx={chartCardStyle("#8e44ad")}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Claim A/R Details</Typography>
              <Box sx={{ height: 400 }}>
                <DataGrid
                  rows={claims}
                  columns={[
                    { field: "id", headerName: "ID", width: 80 },
                    { field: "dateOfService", headerName: "Date of Service", width: 140 },
                    { field: "payer", headerName: "Payer", width: 140 },
                    { field: "provider", headerName: "Provider", width: 140 },
                    { field: "client", headerName: "Client", width: 140 },
                    { field: "amountAllowed", headerName: "Allowed ($)", width: 140 },
                    { field: "amountPaid", headerName: "Paid ($)", width: 140 },
                    { field: "arOutstanding", headerName: "AR Outstanding ($)", width: 180 }
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
};

export default ARDaysPage;
