import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import dayjs from "dayjs";
import {
  Grid,
  Card,
  Typography,
  Box,
  Tooltip,
  Avatar,
  Fade
} from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import MoneyOffCsredIcon from "@mui/icons-material/MoneyOffCsred";
import AssessmentIcon from "@mui/icons-material/Assessment";

import csvData from "../data/sample.csv?raw";

const metricCards = [
  {
    label: "Gross Collection Rate",
    dataKey: "gcr",
    icon: <AssessmentIcon />,
    borderColor: "#3e8ef7",
    bgColor: "#f0f6fe",
    isPercent: true,
    showTrend: true,
  },
  {
    label: "Denial Rate",
    dataKey: "denialRate",
    icon: <MoneyOffCsredIcon />,
    borderColor: "#ff6f60",
    bgColor: "#fff3ef",
    isPercent: true,
    showTrend: true,
  },
  {
    label: "Total Claims",
    dataKey: "totalClaims",
    icon: <AssignmentTurnedInIcon />,
    borderColor: "#73e260",
    bgColor: "#f5fcf6",
    isPercent: false,
    showTrend: true,
  },
  {
    label: "Total Payments",
    dataKey: "totalPayments",
    icon: <AttachMoneyIcon />,
    borderColor: "#ffd760",
    bgColor: "#fffbea",
    isCurrency: true,
    showTrend: true,
    isPercent: false,
  },
  {
    label: "Net Collection Rate (NCR)",
    dataKey: "ncr",
    icon: <TrendingUpIcon />,
    borderColor: "#ae4ed7",
    bgColor: "#f6edfa",
    isPercent: true,
    showTrend: true,
  },
  {
    label: "First Pass Rate (FPR)",
    dataKey: "fpr",
    icon: <TrendingUpIcon />,
    borderColor: "#00b8a9",
    bgColor: "#e6fcfc",
    isPercent: true,
    showTrend: true,
  },
  {
    label: "Charge Lag (days)",
    dataKey: "chargeLagDays",
    icon: <HourglassEmptyIcon />,
    borderColor: "#416dea",
    bgColor: "#eaf0fe",
    isPercent: false,
    showTrend: true,
  },
  {
    label: "Billing Lag (days)",
    dataKey: "billingLagDays",
    icon: <HourglassEmptyIcon />,
    borderColor: "#ff8650",
    bgColor: "#fef4ef",
    isPercent: false,
    showTrend: true,
  },
  {
    label: "Claim Charge Ratio (CCR)",
    dataKey: "ccr",
    icon: <AssessmentIcon />,
    borderColor: "#a1aec6",
    bgColor: "#f0f3fa",
    isPercent: false, // Ratio, not percent
    showTrend: true,
  },
  {
    label: "Accounts Receivable (AR)",
    dataKey: "ar",
    icon: <AttachMoneyIcon />,
    borderColor: "#6a5acd",
    bgColor: "#efecff",
    isCurrency: true,
    showTrend: true,
  },
  {
    label: "AR > 90 days",
    dataKey: "ar90",
    icon: <AttachMoneyIcon />,
    borderColor: "#d9534f",
    bgColor: "#fff0f0",
    isCurrency: true,
    showTrend: true,
  },
];

const Dashboard = () => {
  const [metrics, setMetrics] = useState({});
  const today = dayjs();

  useEffect(() => {
    Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const allData = results.data;

        // Filter recent 30 days and previous 31-60 days data by DateOfService
        const recentData = allData.filter(row => {
          const dos = dayjs(row.DateOfService);
          return dos.isValid() && today.diff(dos, "day") <= 30;
        });

        const previousData = allData.filter(row => {
          const dos = dayjs(row.DateOfService);
          const diff = today.diff(dos, "day");
          return dos.isValid() && diff > 30 && diff <= 60;
        });

        const computeMetrics = (dataRows) => {
          const totalClaims = dataRows.length;
          const totalPayments = dataRows.reduce((sum, row) => sum + Number(row.AmountPaid || 0), 0);
          const totalBilled = dataRows.reduce((sum, row) => sum + Number(row.AmountBilled || 0), 0);
          const deniedClaims = dataRows.filter(row => (row.Status?.toLowerCase() === "denied")).length;
          const allowed = dataRows.reduce((sum, row) => sum + Number(row.AmountAllowed || 0), 0);
          const firstPass = dataRows.filter(row => (row.FirstPassResolution || "").toLowerCase() === "yes").length;
          const totalRVUs = dataRows.reduce((sum, row) => sum + Number(row.RVUs || 0), 0);
          const totalCharges = dataRows.reduce((sum, row) => sum + Number(row.Charges || 0), 0);

          // Carefully handle date diffs, protecting against invalid dates or negative diffs
          const chargeLagDays = dataRows.reduce((sum, row) => {
            const dos = dayjs(row.DateOfService);
            const doe = dayjs(row.DateOfEntry);
            let diff = doe.isValid() && dos.isValid() ? doe.diff(dos, "day") : 0;
            if (diff < 0) diff = 0;
            return sum + diff;
          }, 0) / (dataRows.length || 1);

          const billingLagDays = dataRows.reduce((sum, row) => {
            const dos = dayjs(row.DateOfService);
            const db = dayjs(row.DateBilled);
            let diff = db.isValid() && dos.isValid() ? db.diff(dos, "day") : 0;
            if (diff < 0) diff = 0;
            return sum + diff;
          }, 0) / (dataRows.length || 1);

          const gcr = totalBilled ? (totalPayments / totalBilled) * 100 : 0;
          const denialRate = totalClaims ? (deniedClaims / totalClaims) * 100 : 0;
          const ncr = allowed ? (totalPayments / allowed) * 100 : 0;
          const fpr = totalClaims ? (firstPass / totalClaims) * 100 : 0;
          const ccr = totalRVUs ? (totalCharges / totalRVUs) : 0;

          const ar = totalBilled - totalPayments;

          // AR > 90 days: unpaid amounts on claims serviced more than 90 days ago
          const ar90 = dataRows.reduce((sum, row) => {
            const dos = dayjs(row.DateOfService);
            const unpaid = Number(row.AmountBilled || 0) - Number(row.AmountPaid || 0);
            if (dos.isValid() && today.diff(dos, "day") > 90 && unpaid > 0) {
              return sum + unpaid;
            }
            return sum;
          }, 0);

          return {
            gcr,
            denialRate,
            totalClaims,
            totalPayments,
            ncr,
            fpr,
            chargeLagDays,
            billingLagDays,
            ccr,
            ar,
            ar90,
          };
        };

        const recentMetrics = computeMetrics(recentData);
        const pastMetrics = computeMetrics(previousData);

        // Compute change trends: recent - previous
        const allMetrics = {};
        Object.keys(recentMetrics).forEach(key => {
          allMetrics[key] = recentMetrics[key];
          allMetrics[`${key}Change`] = recentMetrics[key] - (pastMetrics[key] ?? 0);
        });

        setMetrics(allMetrics);
      },
    });
  }, [today]);

  const renderTrend = (card) => {
    if (!card.showTrend) return null;
    const trendValue = metrics[`${card.dataKey}Change`];
    if (trendValue == null) return null;

    const isNegative = trendValue < 0;
    const Icon = isNegative ? TrendingDownIcon : TrendingUpIcon;
    const color = isNegative ? "#fa5656" : "#44b84a"; // red for down, green for up
    const suffix = card.isPercent ? "%" : "";
    return (
      <Fade in timeout={600}>
        <Box display="flex" alignItems="center" color={color} mt={1}>
          <Icon sx={{ fontSize: 16 }} />
          <Typography variant="body2" ml={0.5} fontWeight={600}>
            {Math.abs(trendValue).toFixed(2)}
            {suffix}
          </Typography>
        </Box>
      </Fade>
    );
  };

  const cardStyles = (borderColor, bgColor) => ({
    background: `linear-gradient(145deg, ${bgColor} 80%, #fff 100%)`,
    borderRadius: "22px",
    borderLeft: `8px solid ${borderColor}`,
    boxShadow: "0 4px 24px 0 rgba(60,140,240,.05), 0 1.5px 6px 0 rgba(60,140,240,.10)",
    padding: "24px 22px 16px",
    color: "#1f2d49",
    minHeight: "128px",
    display: "flex",
    flexDirection: "column",
    transition: "box-shadow 0.25s",
    position: "relative",
    overflow: "visible",
    "&:hover": {
      boxShadow: "0 6px 40px 0 rgba(60,140,240,.18), 0 4px 15px 0 rgba(60,140,240,.21)",
      zIndex: 2,
    },
  });

  const formatValue = (card, value) => {
    if (card.isCurrency) return "$" + Number(value).toLocaleString();
    if (card.isPercent) return value != null ? Number(value).toFixed(2) + "%" : "--";
    if (typeof value === "number") return Number(value).toFixed(2).replace(/\.00$/, "");
    return value ?? "--";
  };

  return (
    <Box p={{ xs: 1, sm: 2, md: 4 }} sx={{ backgroundColor: "#f8fbff", minHeight: "80vh" }}>
      <Typography
        variant="h4"
        fontWeight={700}
        mb={2}
        sx={{
          background: "linear-gradient(85deg,#337ff1 43%,#19cbb8 99%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          mb: 4,
        }}
      >
        Medical Billing Dashboard
      </Typography>
      <Grid container spacing={{ xs: 2, md: 3 }} alignItems="stretch">
        {metricCards.map((card) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={card.dataKey}>
            <Tooltip title={card.tooltip || ""} placement="top" arrow>
              <Card sx={cardStyles(card.borderColor, card.bgColor)}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar
                    sx={{
                      bgcolor: card.borderColor,
                      color: "#fff",
                      boxShadow: "0 0 4px #aaa",
                      width: 40,
                      height: 40,
                    }}
                  >
                    {card.icon}
                  </Avatar>
                  <Typography variant="subtitle2" fontWeight={600} style={{ fontSize: 16 }}>
                    {card.label}
                  </Typography>
                </Box>
                <Box flexGrow={1} pt={2} display="flex" alignItems="end" minHeight={52}>
                  <Typography variant="h4" fontWeight={700} sx={{ fontSize: 36 }}>
                    {formatValue(card, metrics[card.dataKey])}
                  </Typography>
                </Box>
                {renderTrend(card)}
              </Card>
            </Tooltip>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Dashboard;
