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
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import DashboardIcon from "@mui/icons-material/Dashboard";
import BarChartIcon from "@mui/icons-material/BarChart";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
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
import { useNavigate } from "react-router-dom";

import csvData from "../data/sample.csv?raw";

// Colors palette consistent with NCR and FPR pages
const COLORS = [
  "#ff6f60", // main denial color
  "#3e8ef7",
  "#00b8a9",
  "#f6a623",
  "#8e44ad",
  "#ae4ed7",
  "#4caf50",
  "#9c27b0",
  "#00796b",
  "#d9534f",
];

const DenialRatePage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // States for metrics and data
  const [overallDenialRate, setOverallDenialRate] = useState(0);
  const [totalClaims, setTotalClaims] = useState(0);
  const [deniedClaims, setDeniedClaims] = useState(0);
  const [monthlyDenialRate, setMonthlyDenialRate] = useState([]);
  const [comparisonDenialRate, setComparisonDenialRate] = useState([]);
  const [denialReasons, setDenialReasons] = useState([]);
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
          Status: (row.Status || "").toLowerCase(),
          DenialReason: row.DenialReason || "Unknown",
        }));

        const today = dayjs();
        const filteredData = allData.filter(
          (row) =>
            row.DateOfService.isValid() &&
            today.diff(row.DateOfService, "day") <= parseInt(filters.dateRange)
        );

        const total = filteredData.length;
        const denied = filteredData.filter((r) => r.Status === "denied").length;
        const denialRate = total ? ((denied / total) * 100).toFixed(2) : 0;

        setTotalClaims(total);
        setDeniedClaims(denied);
        setOverallDenialRate(denialRate);

        // Monthly denial rate grouping and calc
        const monthOrder = [
          "January","February","March","April","May","June",
          "July","August","September","October","November","December"
        ];
        const monthStats = {};
        monthOrder.forEach((m) => (monthStats[m] = { total: 0, denied: 0 }));

        filteredData.forEach((r) => {
          const m = r.DateOfService.format("MMMM");
          if (monthStats[m]) {
            monthStats[m].total += 1;
            if (r.Status === "denied") monthStats[m].denied += 1;
          }
        });

        const monthlyData = monthOrder.map((m) => {
          const { total, denied } = monthStats[m];
          const rate = total ? parseFloat(((denied / total) * 100).toFixed(2)) : 0;
          return { month: m, denialRate: rate };
        });
        setMonthlyDenialRate(monthlyData);

        // Last 3 months avg + latest month comparison
        const activeMonths = monthlyData.filter((m) => m.denialRate > 0);
        const last3 = activeMonths.slice(-3);
        const avgLast3 = last3.length
          ? last3.reduce((sum, m) => sum + m.denialRate, 0) / last3.length
          : 0;
        const lastMonthData = last3.length ? last3[last3.length - 1] : { month: "Current", denialRate: 0 };
        setComparisonDenialRate([
          { period: "Last 3 Months Avg", denialRate: parseFloat(avgLast3.toFixed(2)) },
          { period: lastMonthData.month, denialRate: lastMonthData.denialRate },
        ]);

        // Denial reason breakdown for pie chart
        const reasonMap = {};
        filteredData.forEach((r) => {
          if (r.Status === "denied") {
            reasonMap[r.DenialReason] = (reasonMap[r.DenialReason] || 0) + 1;
          }
        });
        const reasonData = Object.entries(reasonMap).map(([name, value]) => ({
          name,
          value,
        }));
        setDenialReasons(reasonData);

        // Detailed claims data for table
        const claimsData = filteredData.map((row, idx) => ({
          id: row.ClaimID || idx,
          dateOfService: row.DateOfService.format("YYYY-MM-DD"),
          status: row.Status || "-",
          denialReason: row.DenialReason || "-",
          payer: row.Payer || "-",
          provider: row.Provider || "-",
          client: row.Client || "-",
          appealStatus: row.AppealStatus || "-",
        }));
        setClaims(claimsData);
      },
    });
  }, [filters]);

  // Card styling consistent with NCR and FPR
  const chartCardStyle = (color) => ({
    borderRadius: theme.shape.borderRadius,
    borderLeft: `6px solid ${color}`,
    background: `linear-gradient(135deg, ${color}20 0%, #fff 100%)`,
    boxShadow: theme.shadows[2],
  });

  return (
    <Box sx={{ backgroundColor: "#fff8f7", minHeight: "100vh" }}>
      {/* AppBar with Hamburger Menu */}
      <AppBar position="sticky" color="default" elevation={1}>
        <Toolbar>
          <IconButton
            onClick={() => setDrawerOpen(true)}
            edge="start"
            aria-label="open drawer"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
            Denial Rate Analysis
          </Typography>
          <IconButton>
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

      {/* Sidebar Drawer */}
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

      <Box sx={{ p: { xs: 2, md: 3 } }}>
        {/* Filters */}
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
            <Card sx={chartCardStyle("#ff6f60")}>
              <CardContent>
                <Typography variant="subtitle2" color={theme.palette.text.secondary} gutterBottom>
                  Overall Denial Rate
                </Typography>
                <Typography variant="h3" fontWeight={700} color={theme.palette.error.main}>
                  {overallDenialRate}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={chartCardStyle("#3e8ef7")}>
              <CardContent>
                <Typography variant="subtitle2" color={theme.palette.text.secondary} gutterBottom>
                  Total Claims
                </Typography>
                <Typography variant="h3" fontWeight={700} color={theme.palette.primary.main}>
                  {totalClaims}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={chartCardStyle("#d9534f")}>
              <CardContent>
                <Typography variant="subtitle2" color={theme.palette.text.secondary} gutterBottom>
                  Denied Claims
                </Typography>
                <Typography variant="h3" fontWeight={700} color={theme.palette.error.dark}>
                  {deniedClaims}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Charts Section */}
        <Grid container spacing={2}>
          {/* Monthly Denial Rate Trend Line Chart */}
          <Grid item xs={8} md={8}>
            <Card sx={chartCardStyle("#ff6f60")}>
              <CardContent>
                <Typography variant="h3" fontWeight={700} gutterBottom color={theme.palette.error.main}>
                  Monthly Denial Rate Trend
                </Typography>
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={monthlyDenialRate}>
                    <CartesianGrid strokeDasharray="5 5" stroke={theme.palette.divider} />
                    <XAxis dataKey="month" stroke={theme.palette.text.secondary} />
                    <YAxis domain={[0, 110]} tickFormatter={(v) => `${v}%`} stroke={theme.palette.text.secondary} />
                    <RechartsTooltip formatter={(v) => `${v}%`} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="denialRate"
                      stroke="#ff6f60"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                      activeDot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Comparison Bar Chart */}
          <Grid item xs={12} md={4}>
            <Card sx={chartCardStyle("#3e8ef7")}>
              <CardContent>
                <Typography variant="h4" fontWeight={700} gutterBottom color={theme.palette.info.main}>
                  Denial Rate Comparison
                </Typography>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={comparisonDenialRate}>
                    <XAxis dataKey="period" stroke={theme.palette.text.secondary} />
                    <YAxis domain={[0, 110]} tickFormatter={(v) => `${v}%`} stroke={theme.palette.text.secondary} />
                    <RechartsTooltip formatter={(v) => `${v}%`} />
                    <Legend />
                    <Bar dataKey="denialRate" fill="#3e8ef7" radius={[6, 6, 0, 0]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Denial Reasons Pie Chart */}
          <Grid item xs={12} md={6}>
            <Card sx={chartCardStyle("#f45b69")}>
              <CardContent>
                <Typography variant="h4" fontWeight={700} gutterBottom color={theme.palette.error.main}>
                  Denial Reason Breakdown
                </Typography>
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={denialReasons}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={100}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                    >
                      {denialReasons.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Add some margin above the table */}
        <Grid item xs={12} sx={{ mt: 4 }}>
          <Card sx={chartCardStyle("#8e44ad")}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom color={theme.palette.primary.main}>
                Claims Details
              </Typography>
              <Box sx={{ height: 400 }}>
                <DataGrid
                  rows={claims}
                  columns={[
                    { field: "id", headerName: "Claim ID", width: 100 },
                    { field: "dateOfService", headerName: "Date of Service", width: 130 },
                    { field: "status", headerName: "Status", width: 110 },
                    { field: "denialReason", headerName: "Denial Reason", width: 180 },
                    { field: "payer", headerName: "Payer", width: 140 },
                    { field: "provider", headerName: "Provider", width: 140 },
                    { field: "client", headerName: "Client", width: 140 },
                    { field: "appealStatus", headerName: "Appeal Status", width: 140 },
                  ]}
                  pageSize={6}
                  rowsPerPageOptions={[6, 12]}
                  disableSelectionOnClick
                  autoHeight={false}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Box>
    </Box>
  );
};

export default DenialRatePage;
