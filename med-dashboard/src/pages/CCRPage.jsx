// src/pages/CCRPage.jsx
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

const CCRPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [overallCCR, setOverallCCR] = useState(0);
  const [totalClaims, setTotalClaims] = useState(0);
  const [cleanClaims, setCleanClaims] = useState(0);
  const [monthlyCCR, setMonthlyCCR] = useState([]);
  const [comparisonCCR, setComparisonCCR] = useState([]);
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
          DateOfService: dayjs(row.DateOfService),
          DenialReason: row.DenialReason || "-",
        }));
        const today = dayjs();
        const filtered = allData.filter(
          (row) =>
            row.DateOfService.isValid() &&
            today.diff(row.DateOfService, "day") <= parseInt(filters.dateRange)
        );
        const total = filtered.length;
        const clean = filtered.filter(
          (row) =>
            row.DenialReason.trim() === "-" ||
            row.DenialReason.trim().toLowerCase() === "n/a" ||
            row.DenialReason.trim() === ""
        ).length;
        setTotalClaims(total);
        setCleanClaims(clean);
        setOverallCCR(total ? ((clean / total) * 100).toFixed(2) : 0);

        // Monthly CCR trend
        const monthOrder = [
          "January", "February", "March", "April", "May",
          "June", "July", "August", "September", "October", "November", "December"
        ];
        const grouped = {};
        monthOrder.forEach((m) => (grouped[m] = { clean: 0, total: 0 }));
        filtered.forEach((row) => {
          const month = row.DateOfService.format("MMMM");
          if (grouped[month]) {
            grouped[month].total += 1;
            if (
              row.DenialReason.trim() === "-" ||
              row.DenialReason.trim().toLowerCase() === "n/a" ||
              row.DenialReason.trim() === ""
            ) {
              grouped[month].clean += 1;
            }
          }
        });
        const monthlyData = monthOrder.map((month) => {
          const { clean, total } = grouped[month];
          const ccr = total ? (clean / total) * 100 : 0;
          return { month, ccr: parseFloat(ccr.toFixed(2)) };
        });
        setMonthlyCCR(monthlyData);

        // Comparison: last 3 months avg vs latest month
        const activeMonths = monthlyData.filter((m) => m.ccr > 0);
        const last3 = activeMonths.slice(-3);
        const avgLast3 = last3.length
          ? last3.reduce((sum, m) => sum + m.ccr, 0) / last3.length
          : 0;
        const lastMonthData = last3.length
          ? last3[last3.length - 1]
          : { month: "Current", ccr: 0 };
        setComparisonCCR([
          { period: "Last 3 Months Avg", ccr: parseFloat(avgLast3.toFixed(2)) },
          { period: lastMonthData.month, ccr: lastMonthData.ccr },
        ]);

        // Payer-wise CCR
        const payerMap = {};
        filtered.forEach((row) => {
          const payer = row.Payer || "Unknown";
          if (!payerMap[payer]) {
            payerMap[payer] = { clean: 0, total: 0 };
          }
          payerMap[payer].total += 1;
          if (
            row.DenialReason.trim() === "-" ||
            row.DenialReason.trim().toLowerCase() === "n/a" ||
            row.DenialReason.trim() === ""
          ) {
            payerMap[payer].clean += 1;
          }
        });
        const payerData = Object.entries(payerMap).map(([name, val]) => ({
          name,
          ccr: val.total ? parseFloat(((val.clean / val.total) * 100).toFixed(2)) : 0,
        }));
        setPayerBreakdown(payerData);

        // Table rows
        const tableData = filtered.map((row, idx) => ({
          id: idx,
          dateOfService: row.DateOfService.format("YYYY-MM-DD"),
          payer: row.Payer || "-",
          provider: row.Provider || "-",
          client: row.Client || "-",
          denialReason: row.DenialReason,
          isClean:
            row.DenialReason.trim() === "-" ||
            row.DenialReason.trim().toLowerCase() === "n/a" ||
            row.DenialReason.trim() === ""
              ? "Yes"
              : "No",
        }));
        setClaims(tableData);
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
      {/* AppBar with menu + logo */}
      <AppBar position="sticky" color="default" elevation={1}>
        <Toolbar>
          <IconButton edge="start" onClick={() => setDrawerOpen(true)} sx={{ mr: 1 }}>
            <MenuIcon />
          </IconButton>
          <Box
            component="img"
            src="/logo.png"
            alt="Logo"
            sx={{ height: 40, mr: 2 }}
          />
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
            Clean Claim Rate (CCR) Analysis
          </Typography>
          <IconButton>
            <Badge
              overlap="circular"
              badgeContent={<Box sx={{ width: 10, height: 10, bgcolor: "#44b84a", borderRadius: "50%" }} />}
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
            <ListItem button onClick={() => navigate("/gcr")}>
              <ListItemIcon><BarChartIcon /></ListItemIcon>
              <ListItemText primary="Gross Collection Rate" />
            </ListItem>
            <ListItem button onClick={() => navigate("/ncr")}>
              <ListItemIcon><BarChartIcon /></ListItemIcon>
              <ListItemText primary="Net Collection Rate" />
            </ListItem>
            <ListItem button onClick={() => navigate("/ccr")}>
              <ListItemIcon><BarChartIcon /></ListItemIcon>
              <ListItemText primary="Clean Claim Rate" />
            </ListItem>
            <ListItem button onClick={() => navigate("/charge-lag")}>
              <ListItemIcon><BarChartIcon /></ListItemIcon>
              <ListItemText primary="Charge Lag" />
            </ListItem>
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

      {/* Filters */}
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Box sx={{
          mb: 3, p: 2, display: "flex", gap: 2, bgcolor: "#fff",
          borderRadius: 2, alignItems: "center", flexWrap: "wrap"
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
                <Typography variant="subtitle2">Overall CCR (%)</Typography>
                <Typography variant="h3" fontWeight={700}>{overallCCR}%</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={chartCardStyle("#4caf50")}>
              <CardContent>
                <Typography variant="subtitle2">Total Claims</Typography>
                <Typography variant="h3" fontWeight={700}>{totalClaims}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={chartCardStyle("#f45b69")}>
              <CardContent>
                <Typography variant="subtitle2">Clean Claims</Typography>
                <Typography variant="h3" fontWeight={700}>{cleanClaims}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Charts */}
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <Card sx={chartCardStyle("#3e8ef7")}>
              <CardContent>
                <Typography variant="h4" gutterBottom>Month-wise CCR Trend</Typography>
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={monthlyCCR}>
                    <CartesianGrid strokeDasharray="5 5" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[0, 110]} tickFormatter={(v) => `${v}%`} />
                    <RechartsTooltip formatter={(v) => `${v}%`} />
                    <Legend />
                    <Line type="monotone" dataKey="ccr" stroke="#3e8ef7" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={chartCardStyle("#00b8a9")}>
              <CardContent>
                <Typography variant="h4" gutterBottom>CCR Comparison</Typography>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={comparisonCCR}>
                    <XAxis dataKey="period" />
                    <YAxis domain={[0, 110]} tickFormatter={(v) => `${v}%`} />
                    <RechartsTooltip formatter={(v) => `${v}%`} />
                    <Legend />
                    <Bar dataKey="ccr" fill="#00b8a9" barSize={30} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={chartCardStyle("#f6a623")}>
              <CardContent>
                <Typography variant="h4" gutterBottom>Payer-wise CCR</Typography>
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={payerBreakdown}
                      dataKey="ccr"
                      nameKey="name"
                      outerRadius={100}
                      label={(entry) => `${entry.name}: ${entry.ccr}%`}
                    >
                      {payerBreakdown.map((_, idx) => (
                        <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(v) => `${v}%`} />
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
              <Typography variant="h6" gutterBottom>Claim Cleanliness Details</Typography>
              <Box sx={{ height: 400 }}>
                <DataGrid
                  rows={claims}
                  columns={[
                    { field: "id", headerName: "ID", width: 80 },
                    { field: "dateOfService", headerName: "Date of Service", width: 140 },
                    { field: "payer", headerName: "Payer", width: 140 },
                    { field: "provider", headerName: "Provider", width: 140 },
                    { field: "client", headerName: "Client", width: 140 },
                    { field: "denialReason", headerName: "Denial Reason", width: 180 },
                    { field: "isClean", headerName: "Clean Claim", width: 130 }
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

export default CCRPage;
