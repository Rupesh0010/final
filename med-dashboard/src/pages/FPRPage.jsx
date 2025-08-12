import React, { useEffect, useState } from "react";
import {
  Box, Typography, IconButton, Avatar, Grid, Card,
  CardContent, TextField, MenuItem, AppBar, Toolbar, Badge, useTheme
} from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell
} from "recharts";
import { DataGrid } from "@mui/x-data-grid";
import Papa from "papaparse";
import dayjs from "dayjs";
import csvData from "../data/sample.csv?raw";

const COLORS = ["#3e8ef7", "#00b8a9", "#f6a623", "#f45b69", "#8e44ad"];

const FPRPage = () => {
  const theme = useTheme();
  const [monthlyFPR, setMonthlyFPR] = useState([]);
  const [comparisonFPR, setComparisonFPR] = useState([]);
  const [overallFPR, setOverallFPR] = useState(0);
  const [totalClaims, setTotalClaims] = useState(0);
  const [resolvedFirstPass, setResolvedFirstPass] = useState(0);
  const [deptBreakdown, setDeptBreakdown] = useState([]);
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
          FirstPassResolution:
            (row.FirstPassResolution || "").toLowerCase() === "yes",
        }));

        const today = dayjs();
        const filteredData = allData.filter(
          (row) =>
            row.DateOfService.isValid() &&
            today.diff(row.DateOfService, "day") <= parseInt(filters.dateRange)
        );

        const total = filteredData.length;
        const firstPassCount = filteredData.filter(r => r.FirstPassResolution).length;

        setTotalClaims(total);
        setResolvedFirstPass(firstPassCount);
        setOverallFPR(total ? ((firstPassCount / total) * 100).toFixed(2) : 0);

        // Monthly trend
        const monthOrder = [
          "January","February","March","April","May","June",
          "July","August","September","October","November","December"
        ];
        const monthStats = {};
        monthOrder.forEach(m => monthStats[m] = { total: 0, pass: 0 });

        filteredData.forEach(r => {
          const m = r.DateOfService.format("MMMM");
          if (monthStats[m]) {
            monthStats[m].total += 1;
            if (r.FirstPassResolution) monthStats[m].pass += 1;
          }
        });

        const monthlyData = monthOrder.map(m => {
          const { total, pass } = monthStats[m];
          return { month: m, fpr: total ? parseFloat(((pass / total) * 100).toFixed(2)) : 0 };
        });
        setMonthlyFPR(monthlyData);

        // Comparison: last 3 months avg + last month
        const activeMonths = monthlyData.filter(m => m.fpr > 0);
        const last3 = activeMonths.slice(-3);
        const avgLast3 = last3.length
          ? last3.reduce((sum, m) => sum + m.fpr, 0) / last3.length
          : 0;
        const lastMonthData = last3.length ? last3[last3.length - 1] : { month: "Current", fpr: 0 };
        setComparisonFPR([
          { period: "Last 3 Months Avg", fpr: parseFloat(avgLast3.toFixed(2)) },
          { period: lastMonthData.month, fpr: lastMonthData.fpr }
        ]);

        // Dept breakdown
        const deptMap = {};
        filteredData.forEach(r => {
          const dept = r.Dept || "Unknown";
          if (!deptMap[dept]) deptMap[dept] = { total: 0, pass: 0 };
          deptMap[dept].total++;
          if (r.FirstPassResolution) deptMap[dept].pass++;
        });
        const deptData = Object.entries(deptMap).map(([name, d]) => ({
          name,
          fpr: d.total ? parseFloat(((d.pass / d.total) * 100).toFixed(2)) : 0
        }));
        setDeptBreakdown(deptData);

        // Claims table
        const claimsData = filteredData.map((row, idx) => ({
          id: row.ClaimID || idx,
          dateOfService: row.DateOfService.format("YYYY-MM-DD"),
          status: row.Status || "-",
          firstPass: row.FirstPassResolution ? "Yes" : "No",
          dept: row.Dept || "-",
          payer: row.Payer || "-",
          provider: row.Provider || "-",
          client: row.Client || "-",
          adjustmentReason: row.AdjustmentReason || "-",
          denialReason: row.DenialReason || "-",
          appealStatus: row.AppealStatus || "-"
        }));
        setClaims(claimsData);
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
      <AppBar position="sticky" color="default" elevation={1}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
            First Pass Resolution (FPR) Analysis
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

      <Box sx={{ p: { xs: 2, md: 3 } }}>
        {/* Filter */}
        <Box sx={{ mb: 3, p: 2, bgcolor: "#fff", borderRadius: 2 }}>
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
                <Typography variant="subtitle2">Overall FPR</Typography>
                <Typography variant="h3">{overallFPR}%</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={chartCardStyle("#00b8a9")}>
              <CardContent>
                <Typography variant="subtitle2">Total Claims</Typography>
                <Typography variant="h3">{totalClaims}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={chartCardStyle("#f6a623")}>
              <CardContent>
                <Typography variant="subtitle2">Resolved on First Pass</Typography>
                <Typography variant="h3">{resolvedFirstPass}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Charts */}
        <Grid container spacing={4}>
          {/* Monthly trend */}
          <Grid item xs={12} md={8}>
            <Card sx={chartCardStyle("#3e8ef7")}>
              <CardContent>
                <Typography variant="h2" gutterBottom>Monthly FPR Trend</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyFPR}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} />
                    <RechartsTooltip formatter={v => `${v}%`} />
                    <Legend />
                    <Line type="monotone" dataKey="fpr" stroke="#3e8ef7" strokeWidth={2}/>
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Comparison */}
          <Grid item xs={12} md={4}>
            <Card sx={chartCardStyle("#00b8a9")}>
              <CardContent>
                <Typography variant="h4" gutterBottom>Comparison</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={comparisonFPR}>
                    <XAxis dataKey="period" />
                    <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} />
                    <RechartsTooltip formatter={v => `${v}%`} />
                    <Legend />
                    <Bar dataKey="fpr" fill="#00b8a9" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Dept breakdown */}
          <Grid item xs={12} md={6}>
            <Card sx={chartCardStyle("#f6a623")}>
              <CardContent>
                <Typography variant="h4" gutterBottom>Department-wise FPR</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={deptBreakdown} dataKey="fpr" nameKey="name" outerRadius={100} label>
                      {deptBreakdown.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={v => `${v}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Claims table */}
        <Box mt={4}>
          <Card sx={chartCardStyle("#8e44ad")}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Claim Level Details</Typography>
              <Box sx={{ height: 400 }}>
                <DataGrid
                  rows={claims}
                  columns={[
                    { field: "id", headerName: "Claim ID", width: 100 },
                    { field: "dateOfService", headerName: "DOS", width: 120 },
                    { field: "status", headerName: "Status", width: 120 },
                    { field: "firstPass", headerName: "First Pass", width: 120 },
                    { field: "dept", headerName: "Dept", width: 100 },
                    { field: "payer", headerName: "Payer", width: 140 },
                    { field: "provider", headerName: "Provider", width: 140 },
                    { field: "client", headerName: "Client", width: 140 },
                    { field: "adjustmentReason", headerName: "Adjustment Reason", width: 180 },
                    { field: "denialReason", headerName: "Denial Reason", width: 160 },
                    { field: "appealStatus", headerName: "Appeal Status", width: 140 },
                  ]}
                  pageSize={6}
                  rowsPerPageOptions={[6, 12]}
                />
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default FPRPage;
