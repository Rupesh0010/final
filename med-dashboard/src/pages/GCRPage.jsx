// src/pages/GCRPage.jsx
import React, { useEffect, useState } from "react";
import {
  Box, Typography, IconButton, Avatar,
  Grid, Card, CardContent, TextField, MenuItem,
  AppBar, Toolbar, Badge, Drawer,
  List, ListItem, ListItemIcon, ListItemText,
  useTheme, Divider, Chip
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import DashboardIcon from "@mui/icons-material/Dashboard";
import BarChartIcon from "@mui/icons-material/BarChart";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { useNavigate } from "react-router-dom";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell
} from "recharts";
import { DataGrid } from "@mui/x-data-grid";
import Papa from "papaparse";
import dayjs from "dayjs";
import csvData from "../data/sample.csv?raw";

// Chart colors
const COLORS = [
  "#3e8ef7", "#00b8a9", "#f6a623", "#f45b69", "#8e44ad",
  "#ff9800", "#4caf50", "#9c27b0", "#e91e63", "#00796b"
];

const GCRPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  // UI state
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Data state
  const [monthlyGCR, setMonthlyGCR] = useState([]);
  const [comparisonGCR, setComparisonGCR] = useState([]);
  const [overallGCR, setOverallGCR] = useState(0);
  const [totalBilled, setTotalBilled] = useState(0);
  const [totalPaid, setTotalPaid] = useState(0);
  const [payerBreakdown, setPayerBreakdown] = useState([]);
  const [claims, setClaims] = useState([]);

  // Filters
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

        const today = dayjs();
        const filteredData = allData.filter(
          (row) =>
            row.DateOfService.isValid() &&
            today.diff(row.DateOfService, "day") <= parseInt(filters.dateRange, 10)
        );

        const totalPaidVal = filteredData.reduce((sum, r) => sum + r.AmountPaid, 0);
        const totalBilledVal = filteredData.reduce((sum, r) => sum + r.AmountBilled, 0);
        setTotalBilled(totalBilledVal);
        setTotalPaid(totalPaidVal);
        setOverallGCR(totalBilledVal ? ((totalPaidVal / totalBilledVal) * 100).toFixed(2) : 0);

        // Month-wise data
        const monthOrder = [
          "January", "February", "March", "April", "May",
          "June", "July", "August", "September", "October", "November", "December"
        ];
        const groupedByMonth = {};
        monthOrder.forEach((m) => (groupedByMonth[m] = []));
        filteredData.forEach((row) => {
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

        // 3-month comparison
        const activeMonths = monthlyData.filter(m => m.gcr > 0);
        const last3 = activeMonths.slice(-3);
        const avgLast3 = last3.length ? last3.reduce((s, m) => s + m.gcr, 0) / last3.length : 0;
        const lastMonthData = last3.length ? last3[last3.length - 1] : { month: "Current", gcr: 0 };
        setComparisonGCR([
          { period: "Last 3 Months Avg", gcr: parseFloat(avgLast3.toFixed(2)) },
          { period: lastMonthData.month, gcr: lastMonthData.gcr },
        ]);

        // Payer breakdown
        const payerMap = {};
        filteredData.forEach((row) => {
          const payer = row.Payer || "Unknown";
          payerMap[payer] = (payerMap[payer] || 0) + row.AmountPaid;
        });
        setPayerBreakdown(Object.entries(payerMap).map(([name, value]) => ({ name, value })));

        // Table rows
        const claimsData = filteredData.map((row, index) => ({
          id: row.ClaimID || index.toString(),
          billed: row.AmountBilled,
          paid: row.AmountPaid,
          adjustmentReason: row.AdjustmentReason || "-",
          payer: row.Payer || "-",
          agingDays: Math.max(dayjs().diff(row.DateOfService, "day"), 0),
        }));
        setClaims(claimsData);
      },
    });
  }, [filters]);

  // Shared card style
  const cardStyle = (accent = theme.palette.primary.main) => ({
    borderRadius: 3,
    borderLeft: `6px solid ${accent}`,
    background: `linear-gradient(135deg, ${accent}14 0%, #fff 100%)`,
    boxShadow: theme.shadows[2]
  });

  return (
    <Box sx={{ backgroundColor: "#f7fafc", minHeight: "100vh" }}>
      {/* AppBar (unchanged) */}
      <AppBar position="sticky" color="default" elevation={1}>
        <Toolbar>
          <IconButton onClick={() => setDrawerOpen(true)} edge="start" aria-label="open drawer" sx={{ mr: 1 }}>
            <MenuIcon />
          </IconButton>
          <Box component="img" src="/logo.png" alt="Logo" sx={{ height: 40, mr: 2 }} />
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
            Gross Collection Rate (GCR) Analysis
          </Typography>
          <IconButton>
            <Badge overlap="circular" badgeContent={<Box sx={{ width: 10, height: 10, bgcolor: "#44b84a", borderRadius: "50%" }} />} >
              <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                <AccountCircleIcon />
              </Avatar>
            </Badge>
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        ModalProps={{ keepMounted: true }}
      >
        <Box
          sx={{ width: 240, mt: 2 }}
          role="presentation"
          onClick={() => setDrawerOpen(false)}
          onKeyDown={() => setDrawerOpen(false)}
        >
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
            <ListItem button onClick={() => navigate("/denial-rate")}>
              <ListItemIcon><BarChartIcon /></ListItemIcon>
              <ListItemText primary="Denial Rate" />
            </ListItem>
            <ListItem button onClick={() => navigate("/fpr")}>
              <ListItemIcon><BarChartIcon /></ListItemIcon>
              <ListItemText primary="First Pass Rate" />
            </ListItem>
            <ListItem button onClick={() => navigate("/total-claims")}>
              <ListItemIcon><BarChartIcon /></ListItemIcon>
              <ListItemText primary="Total Claims" />
            </ListItem>
            <ListItem button onClick={() => navigate("/total-payments")}>
              <ListItemIcon><BarChartIcon /></ListItemIcon>
              <ListItemText primary="Total Payments" />
            </ListItem>
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

      {/* Main 3-column layout */}
      <Grid container spacing={3} sx={{ p: 2 }}>
        {/* LEFT COLUMN */}
        <Grid item xs={12} md={3}>
          {/* Filter Data Card */}
          <Card sx={{ ...cardStyle("#90a4ae"), mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Filter Data
              </Typography>
              <TextField
                fullWidth
                select
                size="small"
                label="Date Range (days)"
                value={filters.dateRange}
                onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                sx={{ mt: 1 }}
              >
                <MenuItem value="30">Last 30 Days</MenuItem>
                <MenuItem value="90">Last 90 Days</MenuItem>
                <MenuItem value="180">Last 180 Days</MenuItem>
                <MenuItem value="365">Last 1 Year</MenuItem>
              </TextField>
            </CardContent>
          </Card>

          {/* KPI 1 */}
          <Card sx={{ ...cardStyle("#3e8ef7"), mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>Overall GCR</Typography>
              <Typography variant="h3" fontWeight={800} color={theme.palette.primary.main}>
                {overallGCR}%
              </Typography>
            </CardContent>
          </Card>

          {/* KPI 2 */}
          <Card sx={cardStyle("#f6a623")}>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>Total Payments Received</Typography>
              <Typography variant="h4" fontWeight={800} color={theme.palette.warning.main}>
                ${totalPaid.toLocaleString()}
              </Typography>
              <Divider sx={{ my: 1.5 }} />
              <Typography variant="subtitle2" gutterBottom>Total Charges Billed</Typography>
              <Typography variant="h5" fontWeight={700} color={theme.palette.success.main}>
                ${totalBilled.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* CENTER COLUMN */}
        <Grid item xs={12} md={6}>
          <Card sx={cardStyle("#3e8ef7")}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Typography variant="h2" fontWeight={800}>Month-wise GCR Trend</Typography>
                <Chip
                  label={`Overall ${overallGCR}%`}
                  color="primary"
                  variant="outlined"
                  sx={{ fontWeight: 700 }}
                />
              </Box>
              <ResponsiveContainer width="100%" height={360}>
                <LineChart data={monthlyGCR}>
                  <CartesianGrid strokeDasharray="5 5" stroke={theme.palette.divider} />
                  <XAxis dataKey="month" />
                  <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <RechartsTooltip formatter={(v) => `${v}%`} />
                  <Legend />
                  <Line type="monotone" dataKey="gcr" stroke="#3e8ef7" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* RIGHT COLUMN */}
        <Grid item xs={12} md={3}>
          {/* Payer Breakdown */}
          <Card sx={{ ...cardStyle("#f6a623"), mb: 3 }}>
            <CardContent>
              <Typography variant="h2" fontWeight={800} gutterBottom>Payer Breakdown</Typography>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={payerBreakdown} dataKey="value" nameKey="name" label outerRadius={90}>
                    {payerBreakdown.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 3-Month Trends */}
          <Card sx={cardStyle("#00b8a9")}>
            <CardContent>
              <Typography variant="h5" fontWeight={800} gutterBottom>3-Month Trends</Typography>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={comparisonGCR}>
                  <XAxis dataKey="period" />
                  <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <RechartsTooltip formatter={(v) => `${v}%`} />
                  <Legend />
                  <Bar dataKey="gcr" fill="#00b8a9" radius={[8, 8, 0, 0]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* FULL-WIDTH TABLE */}
        <Grid item xs={12} md={12}>
          <Card sx={cardStyle("#8e44ad")}>
            <CardContent>
              <Typography variant="h5" fontWeight={800} gutterBottom>Claim Level Details</Typography>
              <Box sx={{ height: 340 }}>
                <DataGrid
                  rows={claims}
                  columns={[
                    { field: "id", headerName: "Claim ID", width: 140 },
                    { field: "billed", headerName: "Billed Amount ($)", width: 150 },
                    { field: "paid", headerName: "Paid Amount ($)", width: 150 },
                    { field: "adjustmentReason", headerName: "Adjustment Reason", width: 185 },
                    { field: "payer", headerName: "Payer", width: 160 },
                    { field: "agingDays", headerName: "Aging (days)", width: 140 },
                  ]}
                  pageSize={6}
                  rowsPerPageOptions={[8]}
                  disableSelectionOnClick
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default GCRPage;
