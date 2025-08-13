// src/pages/ChargeLag.jsx
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

const ChargeLag = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // State
  const [avgLag, setAvgLag] = useState(0);
  const [minLag, setMinLag] = useState(0);
  const [maxLag, setMaxLag] = useState(0);
  const [monthlyLag, setMonthlyLag] = useState([]);
  const [comparisonLag, setComparisonLag] = useState([]);
  const [payerBreakdown, setPayerBreakdown] = useState([]);
  const [tableRows, setTableRows] = useState([]);
  const [filters, setFilters] = useState({ dateRange: "365" });

  useEffect(() => {
    Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const allData = results.data.map((row) => {
          const dos = dayjs(row.DateOfService);
          const ced = row.ChargeEntryDate ? dayjs(row.ChargeEntryDate) : null;
          const lagDays = (dos.isValid() && ced && ced.isValid())
            ? ced.diff(dos, "day")
            : null;
          return {
            ...row,
            DateOfService: dos,
            ChargeEntryDate: ced,
            chargeLag: lagDays
          };
        });

        const today = dayjs();
        const filtered = allData.filter(
          (row) =>
            row.DateOfService.isValid() &&
            today.diff(row.DateOfService, "day") <= parseInt(filters.dateRange) &&
            row.chargeLag !== null
        );

        if (filtered.length > 0) {
          const lags = filtered.map(r => r.chargeLag);
          setAvgLag((lags.reduce((a, b) => a + b, 0) / lags.length).toFixed(2));
          setMinLag(Math.min(...lags));
          setMaxLag(Math.max(...lags));
        } else {
          setAvgLag(0);
          setMinLag(0);
          setMaxLag(0);
        }

        // Monthly average lag
        const monthOrder = ["January","February","March","April","May","June","July","August",
          "September","October","November","December"];
        const grouped = {};
        monthOrder.forEach(m => grouped[m] = []);
        filtered.forEach(r => {
          const m = r.DateOfService.format("MMMM");
          if (grouped[m]) grouped[m].push(r.chargeLag);
        });
        const monthlyData = monthOrder.map(m => {
          const arr = grouped[m];
          const avg = arr.length ? arr.reduce((a,b) => a+b,0) / arr.length : 0;
          return { month: m, avgLag: parseFloat(avg.toFixed(2)) };
        });
        setMonthlyLag(monthlyData);

        // Comparison last 3 months vs latest month
        const activeMonths = monthlyData.filter(m => m.avgLag > 0);
        const last3 = activeMonths.slice(-3);
        const avgLast3 = last3.length ? last3.reduce((sum, m) => sum + m.avgLag, 0) / last3.length : 0;
        const lastMonth = last3.length ? last3[last3.length - 1] : { month: "Current", avgLag: 0 };
        setComparisonLag([
          { period: "Last 3 Months Avg", avgLag: parseFloat(avgLast3.toFixed(2)) },
          { period: lastMonth.month, avgLag: lastMonth.avgLag }
        ]);

        // Payer breakdown
        const payerMap = {};
        filtered.forEach(r => {
          const payer = r.Payer || "Unknown";
          if (!payerMap[payer]) payerMap[payer] = [];
          payerMap[payer].push(r.chargeLag);
        });
        const payerData = Object.entries(payerMap).map(([name, arr]) => ({
          name,
          avgLag: arr.length ? parseFloat((arr.reduce((a,b) => a+b,0)/arr.length).toFixed(2)) : 0
        }));
        setPayerBreakdown(payerData);

        // Table rows
        const table = filtered.map((row, idx) => ({
          id: idx,
          dateOfService: row.DateOfService.format("YYYY-MM-DD"),
          chargeEntryDate: row.ChargeEntryDate ? row.ChargeEntryDate.format("YYYY-MM-DD") : "N/A",
          payer: row.Payer || "-",
          provider: row.Provider || "-",
          client: row.Client || "-",
          chargeLag: row.chargeLag
        }));
        setTableRows(table);
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
      {/* AppBar with menu + logo */}
      <AppBar position="sticky" color="default" elevation={1}>
        <Toolbar>
          {/* Menu icon */}
          <IconButton edge="start" onClick={() => setDrawerOpen(true)} sx={{ mr: 1 }}>
            <MenuIcon />
          </IconButton>
          {/* Logo */}
          <Box
            component="img"
            src="/logo.png"
            alt="Logo"
            sx={{ height: 40, mr: 2 }}
          />
          {/* Title */}
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
            Charge Lag Analysis
          </Typography>
          {/* Profile */}
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
        <Box sx={{ width: 240 }} role="presentation" onClick={() => setDrawerOpen(false)}>
          <List>
            <ListItem button onClick={() => navigate("/")}>
              <ListItemIcon><DashboardIcon /></ListItemIcon>
              <ListItemText primary="Dashboard" />
            </ListItem>
            {/* Add navigation for other KPI pages */}
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
        {/* Filter */}
        <Box sx={{ mb: 3, p: 2, display: "flex", gap: 2, bgcolor: "#fff", borderRadius: 2, flexWrap: "wrap" }}>
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
                <Typography variant="subtitle2">Avg Charge Lag (days)</Typography>
                <Typography variant="h3" fontWeight={700}>{avgLag}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={chartCardStyle("#4caf50")}>
              <CardContent>
                <Typography variant="subtitle2">Min Charge Lag</Typography>
                <Typography variant="h3" fontWeight={700}>{minLag}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={chartCardStyle("#f45b69")}>
              <CardContent>
                <Typography variant="subtitle2">Max Charge Lag</Typography>
                <Typography variant="h3" fontWeight={700}>{maxLag}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Charts */}
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <Card sx={chartCardStyle("#3e8ef7")}>
              <CardContent>
                <Typography variant="h4" gutterBottom>Month-wise Charge Lag</Typography>
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={monthlyLag}>
                    <CartesianGrid strokeDasharray="5 5" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Line type="monotone" dataKey="avgLag" stroke="#3e8ef7" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={chartCardStyle("#00b8a9")}>
              <CardContent>
                <Typography variant="h4" gutterBottom>Charge Lag Comparison</Typography>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={comparisonLag}>
                    <XAxis dataKey="period" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="avgLag" fill="#00b8a9" barSize={30} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={chartCardStyle("#f6a623")}>
              <CardContent>
                <Typography variant="h4" gutterBottom>Payer-wise Avg Charge Lag</Typography>
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie data={payerBreakdown} dataKey="avgLag" nameKey="name" outerRadius={100} label >
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
              <Typography variant="h6" gutterBottom>Charge Lag Details</Typography>
              <Box sx={{ height: 400 }}>
                <DataGrid
                  rows={tableRows}
                  columns={[
                    { field: "id", headerName: "ID", width: 80 },
                    { field: "dateOfService", headerName: "Date of Service", width: 140 },
                    { field: "chargeEntryDate", headerName: "Charge Entry Date", width: 160 },
                    { field: "payer", headerName: "Payer", width: 140 },
                    { field: "provider", headerName: "Provider", width: 140 },
                    { field: "client", headerName: "Client", width: 140 },
                    { field: "chargeLag", headerName: "Charge Lag (days)", width: 180 }
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

export default ChargeLag;
