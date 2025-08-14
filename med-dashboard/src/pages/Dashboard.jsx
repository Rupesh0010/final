import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Papa from "papaparse";
import dayjs from "dayjs";
import {
  Grid, Card, Typography, Box, Tooltip, Avatar, Fade,
  IconButton, Badge, Divider, Drawer, List, ListItem,
  ListItemIcon, ListItemText, AppBar, Toolbar, Button,
  TextField, MenuItem
} from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import MoneyOffIcon from "@mui/icons-material/MoneyOff";
import AssessmentIcon from "@mui/icons-material/Assessment";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import MenuIcon from "@mui/icons-material/Menu";
import DashboardIcon from "@mui/icons-material/Dashboard";
import BarChartIcon from "@mui/icons-material/BarChart";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import csvData from "../data/sample.csv?raw";

// KPI cards
const metricCards = [
  { label: "Gross Collection Rate", routeKey: "gcr", dataKey: "gcr", icon: <AssessmentIcon />, color: "#3e8ef7", isPercent: true, showTrend: true },
  { label: "Denial Rate", routeKey: "denial-rate", dataKey: "denialRate", icon: <MoneyOffIcon />, color: "#ff6f60", isPercent: true, showTrend: true },
  { label: "Total Claims", routeKey: "total-claims", dataKey: "totalClaims", icon: <AssignmentTurnedInIcon />, color: "#73e260", isPercent: false, showTrend: true },
  { label: "Total Payments", routeKey: "total-payments", dataKey: "totalPayments", icon: <AttachMoneyIcon />, color: "#ffd760", isCurrency: true, showTrend: true },
  { label: "Net Collection Rate (NCR)", routeKey: "ncr", dataKey: "ncr", icon: <TrendingUpIcon />, color: "#ae4ed7", isPercent: true, showTrend: true },
  { label: "First Pass Rate (FPR)", routeKey: "fpr", dataKey: "fpr", icon: <TrendingUpIcon />, color: "#00b8a9", isPercent: true, showTrend: true },
  { label: "Charge Lag (days)", routeKey: "charge-lag", dataKey: "chargeLagDays", icon: <HourglassEmptyIcon />, color: "#416dea", isPercent: false, showTrend: true },
  { label: "Billing Lag (days)", routeKey: "billing-lag", dataKey: "billingLagDays", icon: <HourglassEmptyIcon />, color: "#ff8650", isPercent: false, showTrend: true },
  { label: "Claim Charge Ratio (CCR)", routeKey: "ccr", dataKey: "ccr", icon: <AssessmentIcon />, color: "#a1aec6", isPercent: true, showTrend: true },
  { label: "Accounts Receivable (AR)", routeKey: "ar-days", dataKey: "ar", icon: <AttachMoneyIcon />, color: "#6a5acd", isCurrency: true, showTrend: true },
  { label: "AR > 90 days", routeKey: "ar-90-days", dataKey: "ar90", icon: <AttachMoneyIcon />, color: "#d9534f", isCurrency: true, showTrend: true }
];

const initMetrics = () => ({
  totalClaims: 0,
  totalPayments: 0,
  totalBilled: 0,
  totalAllowed: 0,
  deniedClaims: 0,
  firstPass: 0,
  chargeLagDays: 0,
  billingLagDays: 0,
  ar90: 0
});

const finalizeMetrics = (m) => {
  const gcr = m.totalBilled ? (m.totalPayments / m.totalBilled) * 100 : 0;
  const denialRate = m.totalClaims ? (m.deniedClaims / m.totalClaims) * 100 : 0;
  const ncr = m.totalAllowed ? (m.totalPayments / m.totalAllowed) * 100 : 0;
  const fpr = m.totalClaims ? (m.firstPass / m.totalClaims) * 100 : 0;
  const ccr = m.totalAllowed ? Math.min((m.totalPayments / m.totalAllowed) * 100, 100) : 0;
  const ar = m.totalBilled - m.totalPayments;
  return {
    gcr,
    denialRate,
    totalClaims: m.totalClaims,
    totalPayments: m.totalPayments,
    ncr,
    fpr,
    chargeLagDays: m.totalClaims ? m.chargeLagDays / m.totalClaims : 0,
    billingLagDays: m.totalClaims ? m.billingLagDays / m.totalClaims : 0,
    ccr,
    ar,
    ar90: m.ar90
  };
};

const Dashboard = () => {
  const [metrics, setMetrics] = useState({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filters, setFilters] = useState({ dateRange: "30", doctor: "" });
  const today = dayjs();
  const navigate = useNavigate();

  useEffect(() => {
    Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true,
      worker: true,
      complete: ({ data }) => {
        const daysLimit = parseInt(filters.dateRange, 10);
        let recent = initMetrics();
        let past = initMetrics();

        for (let row of data) {
          if (filters.doctor && !row.DoctorName?.toLowerCase().includes(filters.doctor.toLowerCase())) {
            continue;
          }
          const dos = dayjs(row.DateOfService);
          if (!dos.isValid()) continue;
          const diff = today.diff(dos, "day");

          let target = null;
          if (diff <= daysLimit) target = recent;
          else if (diff <= daysLimit * 2) target = past;

          if (target) {
            const paid = +row.AmountPaid || 0;
            const billed = +row.AmountBilled || 0;
            const allowed = +row.AmountAllowed || 0;
            const denied = row.Status?.toLowerCase() === "denied";
            const firstPass = (row.FirstPassResolution || "").toLowerCase() === "yes";

            target.totalClaims++;
            target.totalPayments += paid;
            target.totalBilled += billed;
            target.totalAllowed += allowed;
            if (denied) target.deniedClaims++;
            if (firstPass) target.firstPass++;
            target.chargeLagDays += Math.max(dayjs(row.DateOfEntry).diff(dos, "day") || 0, 0);
            target.billingLagDays += Math.max(dayjs(row.DateBilled).diff(dos, "day") || 0, 0);
            if (diff > 90 && billed - paid > 0) target.ar90 += billed - paid;
          }
        }

        const recFinal = finalizeMetrics(recent);
        const pastFinal = finalizeMetrics(past);
        const allMetrics = {};

        for (let k in recFinal) {
          allMetrics[k] = recFinal[k];
          allMetrics[`${k}Change`] = recFinal[k] - (pastFinal[k] ?? 0);
        }

        setMetrics(allMetrics);
      }
    });
  }, [filters, today]);

  const formatValue = (card, value) => {
    if (card.isCurrency) return "$" + Number(value).toLocaleString();
    if (card.isPercent) return value != null ? Number(value).toFixed(2) + "%" : "--";
    if (typeof value === "number") return Number(value).toFixed(2).replace(/\.00$/, "");
    return value ?? "--";
  };

  const renderTrend = (card) => {
    const change = metrics[`${card.dataKey}Change`];
    if (change == null) return null;
    const Icon = change < 0 ? TrendingDownIcon : TrendingUpIcon;
    const color = change < 0 ? "#fa5656" : "#44b84a";
    const suffix = card.isPercent ? "%" : "";
    return (
      <Fade in timeout={600}>
        <Box display="flex" alignItems="center" color={color} mt={0.5}>
          <Icon sx={{ fontSize: 16 }} />
          <Typography variant="body2" ml={0.5} fontWeight={600}>
            {Math.abs(change).toFixed(2)}{suffix}
          </Typography>
        </Box>
      </Fade>
    );
  };

  return (
    <Box sx={{ display: "flex", backgroundColor: "#f5f7fa", minHeight: "100vh" }}>
      {/* Sidebar */}
      <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 240, mt: 2 }}>
          <List>
            <ListItem button onClick={() => navigate("/")}>
              <ListItemIcon><DashboardIcon /></ListItemIcon>
              <ListItemText primary="Dashboard" />
            </ListItem>
            {metricCards.map(item => (
              <ListItem button key={item.routeKey} onClick={() => navigate(`/${item.routeKey}`)}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItem>
            ))}
            <ListItem button><ListItemIcon><BarChartIcon /></ListItemIcon><ListItemText primary="Reports" /></ListItem>
            <ListItem button><ListItemIcon><FileDownloadIcon /></ListItemIcon><ListItemText primary="Export Data" /></ListItem>
            <ListItem button><ListItemIcon><HelpOutlineIcon /></ListItemIcon><ListItemText primary="Help / Support" /></ListItem>
          </List>
        </Box>
      </Drawer>

      {/* Main */}
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="sticky" color="default" elevation={1}>
          <Toolbar>
            <IconButton onClick={() => setDrawerOpen(true)}><MenuIcon /></IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>JorieAI RCM Dashboard</Typography>
            <IconButton>
              <Badge overlap="circular" badgeContent={<Box sx={{ width: 10, height: 10, bgcolor: "#44b84a", borderRadius: "50%" }} />}>
                <Avatar sx={{ bgcolor: "#416dea" }}><AccountCircleIcon /></Avatar>
              </Badge>
            </IconButton>
          </Toolbar>
        </AppBar>

        {/* Filters */}
        <Box sx={{ p: 2, backgroundColor: "#fff", display: "flex", gap: 2 }}>
          <TextField select size="small" label="Date Range (days)" value={filters.dateRange}
            onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}>
            <MenuItem value="30">Last 30 days</MenuItem>
            <MenuItem value="60">Last 60 days</MenuItem>
            <MenuItem value="90">Last 90 days</MenuItem>
          </TextField>
          <TextField size="small" label="Doctor / Provider" value={filters.doctor}
            onChange={(e) => setFilters({ ...filters, doctor: e.target.value })} placeholder="All" />
          <Button variant="contained">Apply</Button>
        </Box>

        {/* Banner */}
        <Box sx={{ m: 2, p: 3, textAlign: 'center', background: "linear-gradient(100deg, #3e8ef7 0%, #00b8a9 100%)", color: "#fff", borderRadius: 3 }}>
          <Typography variant="h4" fontWeight={700}>Revenue. Cycle. Excellence.</Typography>
          <Typography>Fast, actionable RCM metrics for your team</Typography>
        </Box>

        {/* Metrics */}
        <Grid container spacing={3} sx={{ p: 2 }}>
          {metricCards.map(card => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={card.dataKey}>
              <Tooltip title={card.tooltip || ""} arrow>
                <Card
                  sx={{
                    px: 3, py: 2, borderRadius: 4,
                    background: `linear-gradient(120deg, ${card.color}15 0%, #fff 100%)`,
                    borderLeft: `6px solid ${card.color}`,
                    transition: "transform .15s",
                    cursor: "pointer",
                    "&:hover": { transform: "scale(1.03)", boxShadow: `0 8px 24px ${card.color}33` }
                  }}
                  onClick={() => navigate(`/${card.routeKey}`)}
                >
                  <Box display="flex" alignItems="center" gap={1}>
                    <Avatar sx={{ bgcolor: card.color }}>{card.icon}</Avatar>
                    <Typography fontWeight={700}>{card.label}</Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="h4" fontWeight={700}>
                    {formatValue(card, metrics[card.dataKey])}
                  </Typography>
                  {renderTrend(card)}
                </Card>
              </Tooltip>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
};

export default Dashboard;
