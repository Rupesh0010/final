// src/pages/TotalClaimPage.jsx
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
  Slider,
  AppBar,
  Toolbar,
  Badge,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
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
import csvData from "../data/sample.csv";
const COLORS = [
  "#73b260",
  "#3e87f7",
  "#00b9a0",
  "#f6a623",
  "#ff6060",
  "#ae4ed7",
  "#4caf50",
  "#9c79f0",
  "#00796b",
  "#d9534f",
];
const marks = [
  { value: 30, label: "30d" },
  { value: 90, label: "90d" },
  { value: 180, label: "180d" },
  { value: 365, label: "365d" },
];
const TotalClaimPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [overallClaims, setOverallClaims] = useState(0);
  const [monthlyClaims, setMonthlyClaims] = useState([]);
  const [comparisonClaims, setComparisonClaims] = useState([]);
  const [payerData, setPayerData] = useState([]);
  const [claims, setClaims] = useState([]);
  const [filters, setFilters] = useState({ range: 365 });

  useEffect(() => {
    Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const allRows = results.data;
        const allData = allRows.map((row) => ({
          ...row,
          Date: row.Date || row.DateOfService,
          DateOfService: dayjs(row.Date || row.DateOfService),
        }));
        const today = dayjs();
        const filtered = allData.filter(
          (row) =>
            row.DateOfService.isValid() &&
            today.diff(row.DateOfService, "day") <= (filters.range || 365)
        );
        setOverallClaims(filtered.length);
        const monthOrder = [
          "January", "February", "March", "April", "May", "June",
          "July", "August", "September", "October", "November", "December",
        ];
        const monthStats = {};
        monthOrder.forEach(m => (monthStats[m] = 0));
        filtered.forEach(row => {
          const m = row.DateOfService.format("MMMM");
          if(monthStats[m] !== undefined) monthStats[m]++;
        });
        const monthlyData = monthOrder.map(m => ({month: m, claims: monthStats[m]}));
        setMonthlyClaims(monthlyData);

        const activeMonths = monthlyData.filter(m => m.claims > 0);
        const last3 = activeMonths.slice(-3);
        const avgLast3 = last3.length ? (last3.reduce((acc, m) => acc + m.claims, 0) / last3.length) : 0;
        const lastMonth = last3.length ? last3[last3.length - 1] : {month: "Current", claims: 0};
        setComparisonClaims([
          {period: "Last 3 Months Avg", claims: avgLast3},
          {period: lastMonth.month, claims: lastMonth.claims},
        ]);

        const payerMap = {};
        filtered.forEach(row => {
          const payer = row.Payer || "Unknown";
          payerMap[payer] = (payerMap[payer] || 0) + 1;
        });
        setPayerData(Object.entries(payerMap).map(([name, value]) => ({name, value})));

        const claimRows = filtered.map((row, idx) => ({
          id: row.ClaimID || idx.toString(),
          dateOfService: row.DateOfService.format("YYYY-MM-DD"),
          status: row.Status || "-",
          payer: row.Payer || "Unknown",
          provider: row.Provider || "Unknown",
          client: row.Client || "Unknown",
          amountBilled: Number(row.AmountBilled || 0),
          amountPaid: Number(row.AmountPaid || 0),
        }));
        setClaims(claimRows);
      }
    });
  }, [filters]);

  const chartStyle = (color) => ({
    borderRadius: 8,
    borderLeft: `6px solid ${color}`,
    background: "linear-gradient(135deg, " + color + "20 0%, #fff 100%)",
    boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
  });

  return (
    <Box sx={{backgroundColor: "#f8faff", minHeight: "100vh"}}>
      <AppBar position="sticky" color="default" elevation={1}>
        <Toolbar>
          <IconButton edge="start" onClick={() => setDrawerOpen(true)} sx={{ mr: 1 }} aria-label="open drawer">
            <MenuIcon />
          </IconButton>
          <Box component="img" src="/logo.png" alt="Logo" sx={{height: 40, mr: 2}} />
          <Typography variant="h6" sx={{flexGrow: 1, fontWeight: 700}}>
            Total Claim Analysis
          </Typography>
          <IconButton aria-label="user profile">
            <Badge overlap="circular" anchorOrigin={{vertical: 'bottom', horizontal: 'right'}} badgeContent={<Box sx={{width: 10, height: 10, bgcolor: 'green', borderRadius: '50%'}} />} >
              <Avatar sx={{backgroundColor: theme.palette.primary.main}}>
                <AccountCircleIcon />
              </Avatar>
            </Badge>
          </IconButton>
        </Toolbar>
      </AppBar>

      <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{width: 240}} role="presentation" onClick={() => setDrawerOpen(false)}>
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
        <Box sx={{mb: 3, p: 2, display: "flex", gap: 3, flexWrap: "wrap", alignItems: "center", justifyContent: "center", backgroundColor: "background.paper", borderRadius: 1}}>
          <TextField size="small" label="Date range" select value={filters.range} onChange={e => setFilters({...filters, range: Number(e.target.value)})} sx={{minWidth: 200}}>
            {marks.map((mark) => (
              <MenuItem value={mark.value} key={mark.value}>{mark.label}</MenuItem>
            ))}
          </TextField>
          <Box sx={{flexGrow: 1, maxWidth: 400}}>
            <Typography variant="body2" gutterBottom>Selected Range: {filters.range} days</Typography>
            <Slider min={1} step={1} max={365} marks={marks} value={filters.range} onChange={(e, val) => setFilters({...filters, range: val})} valueLabelDisplay="auto"/>
          </Box>
        </Box>
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12}>
            <Card sx={chartStyle(COLORS[0])}>
              <CardContent sx={{display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 130}}>
                <Typography variant="subtitle2" color={theme.palette.text.secondary}>Total Claims</Typography>
                <Typography variant="h2">{overallClaims}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card sx={chartStyle(COLORS[0])}>
              <CardContent>
                <Typography variant="h3" gutterBottom>Monthly Claims Trend</Typography>
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={monthlyClaims}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Line stroke={COLORS[0]} type="monotone" dataKey="claims" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={chartStyle(COLORS[1])}>
              <CardContent>
                <Typography variant="h5" gutterBottom>Claims Comparison</Typography>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={comparisonClaims}>
                    <XAxis dataKey="period" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Bar fill={COLORS[1]} type="monotone" dataKey="claims" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={chartStyle(COLORS[2])}>
              <CardContent>
                <Typography variant="h5" gutterBottom>Payer Breakdown</Typography>
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie label outerRadius={100} data={payerData} dataKey="value" nameKey="name">
                      {payerData.map((entry, index) => (
                        <Cell fill={COLORS[index % COLORS.length]} key={index}/>
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={chartStyle(COLORS[3])}>
              <CardContent>
                <Typography variant="h5" gutterBottom>Claim Details</Typography>
                <Box sx={{height: "400px"}}>
                  <DataGrid
                    rows={claims}
                    columns={[
                      {field: "id", headerName:"ID", width: 90},
                      {field: "dateOfService", headerName:"Date of Service", width: 120},
                      {field: "status", headerName:"Status", width: 120},
                      {field: "payer", headerName:"Payer", width: 120},
                      {field: "provider", headerName:"Provider", width: 120},
                      {field: "client", headerName:"Client", width: 120},
                      {field: "amountBilled", headerName:"Billed Amount", width: 120},
                      {field: "amountPaid", headerName:"Paid Amount", width: 120},
                    ]}
                    pageSize={5}
                    rowsPerPageOptions={[5]}
                    autoHeight
                    disableSelectionOnClick
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default TotalClaimPage;
#he
