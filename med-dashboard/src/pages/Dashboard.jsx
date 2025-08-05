//  // Dashboard.jsx
import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import dayjs from "dayjs";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
} from "@mui/material";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import SummarizeIcon from "@mui/icons-material/Summarize";

import csvData from "../data/sample.csv?raw"; // Update path if needed

const Dashboard = () => {
  const [data, setData] = useState([]);
  const [metrics, setMetrics] = useState({
    gcr: 0,
    denialRate: 0,
    totalClaims: 0,
    totalPayments: 0,
    gcrChange: 0,
    denialChange: 0,
  });

  useEffect(() => {
    Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true,
      complete: function (results) {
        const allData = results.data;
        const today = dayjs();

        const recentData = allData.filter((row) => {
          const date = dayjs(row.DateOfService);
          return today.diff(date, "day") <= 30;
        });

        const previousData = allData.filter((row) => {
          const date = dayjs(row.DateOfService);
          const diff = today.diff(date, "day");
          return diff > 30 && diff <= 60;
        });

        const computeMetrics = (dataRows) => {
          const totalClaims = dataRows.length;
          const totalPayments = dataRows.reduce(
            (sum, row) => sum + Number(row.AmountPaid || 0),
            0
          );
          const totalBilled = dataRows.reduce(
            (sum, row) => sum + Number(row.AmountBilled || 0),
            0
          );
          const deniedClaims = dataRows.filter(
            (row) => row.Status.toLowerCase() === "denied"
          ).length;

          const gcr = totalBilled ? (totalPayments / totalBilled) * 100 : 0;
          const denialRate = totalClaims ? (deniedClaims / totalClaims) * 100 : 0;

          return { gcr, denialRate, totalClaims, totalPayments };
        };

        const recentMetrics = computeMetrics(recentData);
        const pastMetrics = computeMetrics(previousData);

        setMetrics({
          ...recentMetrics,
          gcrChange: recentMetrics.gcr - pastMetrics.gcr,
          denialChange: recentMetrics.denialRate - pastMetrics.denialRate,
        });
      },
    });
  }, []);

  const renderTrend = (value, isPositiveGood = true) => {
    const Icon = value >= 0 ? ArrowUpwardIcon : ArrowDownwardIcon;
    const color = value >= 0 === isPositiveGood ? "green" : "red";

    return (
      <Box display="flex" alignItems="center" color={color} mt={1}>
        <Icon fontSize="small" />
        <Typography variant="body2" ml={0.5}>
          {Math.abs(value).toFixed(2)}%
        </Typography>
      </Box>
    );
  };

  const cardStyleWithBorder = (color, bgColor) => ({
    backgroundColor: bgColor,
    borderRadius: "16px",
    borderLeft: `6px solid ${color}`,
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
    height: "100%",
    color: "#333",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  });

  return (
    <Box p={4} sx={{ backgroundColor: "#f0f2f5", minHeight: "100vh" }}>
      <Typography variant="h4" gutterBottom>
        Medical Billing Dashboard
      </Typography>
      <Grid container spacing={2} alignItems="stretch">
        <Grid item xs={12} sm={6} md={3} lg={3} xl={3}>
          <Card sx={cardStyleWithBorder("#2196f3", "#e3f2fd")}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Typography variant="subtitle1">Gross Collection Rate</Typography>
                <ShowChartIcon color="primary" />
              </Box>
              <Typography variant="h4">{metrics.gcr.toFixed(2)}%</Typography>
              {renderTrend(metrics.gcrChange)}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3} lg={3} xl={3}>
          <Card sx={cardStyleWithBorder("#f44336", "#ffebee")}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Typography variant="subtitle1">Denial Rate</Typography>
                <ErrorOutlineIcon color="error" />
              </Box>
              <Typography variant="h4">{metrics.denialRate.toFixed(2)}%</Typography>
              {renderTrend(metrics.denialChange, false)}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3} lg={3} xl={3}>
          <Card sx={cardStyleWithBorder("#4caf50", "#e8f5e9")}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Typography variant="subtitle1">Total Claims</Typography>
                <SummarizeIcon color="success" />
              </Box>
              <Typography variant="h4">{metrics.totalClaims}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3} lg={3} xl={3}>
          <Card sx={cardStyleWithBorder("#ff9800", "#fff3e0")}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Typography variant="subtitle1">Total Payments</Typography>
                <AttachMoneyIcon sx={{ color: "#ff9800" }} />
              </Box>
              <Typography variant="h4">${metrics.totalPayments}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;

// Dashboard.jsx
// // Dashboard.jsx
// import React, { useEffect, useState } from "react";
// import Papa from "papaparse";
// import dayjs from "dayjs";
// import {
//   Grid,
//   Card,
//   CardContent,
//   Typography,
//   Box,
// } from "@mui/material";
// import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
// import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
// import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
// import ShowChartIcon from "@mui/icons-material/ShowChart";
// import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
// import SummarizeIcon from "@mui/icons-material/Summarize";
// import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
//
// import csvData from "../data/sample.csv?raw"; // Update path if needed
//
// const Dashboard = () => {
//   const [data, setData] = useState([]);
//   const [metrics, setMetrics] = useState({
//     gcr: 0,
//     denialRate: 0,
//     totalClaims: 0,
//     totalPayments: 0,
//     gcrChange: 0,
//     denialChange: 0,
//   });
//   const [genderData, setGenderData] = useState([]);
//
//   useEffect(() => {
//     Papa.parse(csvData, {
//       header: true,
//       skipEmptyLines: true,
//       complete: function (results) {
//         const allData = results.data;
//         setData(allData);
//         const today = dayjs();
//
//         const recentData = allData.filter((row) => {
//           const date = dayjs(row.DateOfService);
//           return today.diff(date, "day") <= 30;
//         });
//
//         const previousData = allData.filter((row) => {
//           const date = dayjs(row.DateOfService);
//           const diff = today.diff(date, "day");
//           return diff > 30 && diff <= 60;
//         });
//
//         const computeMetrics = (dataRows) => {
//           const totalClaims = dataRows.length;
//           const totalPayments = dataRows.reduce(
//             (sum, row) => sum + Number(row.AmountPaid || 0),
//             0
//           );
//           const totalBilled = dataRows.reduce(
//             (sum, row) => sum + Number(row.AmountBilled || 0),
//             0
//           );
//           const deniedClaims = dataRows.filter(
//             (row) => row.Status.toLowerCase() === "denied"
//           ).length;
//
//           const gcr = totalBilled ? (totalPayments / totalBilled) * 100 : 0;
//           const denialRate = totalClaims ? (deniedClaims / totalClaims) * 100 : 0;
//
//           return { gcr, denialRate, totalClaims, totalPayments };
//         };
//
//         const recentMetrics = computeMetrics(recentData);
//         const pastMetrics = computeMetrics(previousData);
//
//         setMetrics({
//           ...recentMetrics,
//           gcrChange: recentMetrics.gcr - pastMetrics.gcr,
//           denialChange: recentMetrics.denialRate - pastMetrics.denialRate,
//         });
//
//         const maleCount = allData.filter(row => row.Gender?.toLowerCase() === 'male').length;
//         const femaleCount = allData.filter(row => row.Gender?.toLowerCase() === 'female').length;
//
//         setGenderData([
//           { name: "Male", value: maleCount },
//           { name: "Female", value: femaleCount }
//         ]);
//       },
//     });
//   }, []);
//
//   const renderTrend = (value, isPositiveGood = true) => {
//     const Icon = value >= 0 ? ArrowUpwardIcon : ArrowDownwardIcon;
//     const color = value >= 0 === isPositiveGood ? "green" : "red";
//
//     return (
//       <Box display="flex" alignItems="center" color={color} mt={1}>
//         <Icon fontSize="small" />
//         <Typography variant="body2" ml={0.5}>
//           {Math.abs(value).toFixed(2)}%
//         </Typography>
//       </Box>
//     );
//   };
//
//   const cardStyleWithBorder = (color, bgColor) => ({
//     backgroundColor: bgColor,
//     borderRadius: "20px",
//     borderLeft: `8px solid ${color}`,
//     boxShadow: "0 6px 16px rgba(0, 0, 0, 0.1)",
//     height:"100px",
//     padding: "28px",
//     color: "#333",
//     display: "flex",
//     flexDirection: "column",
//     justifyContent: "space-between",
//   });
//
//   const COLORS = ["#42A5F5", "#EC407A"];
//
//   return (
//     <Box p={4} sx={{ backgroundColor: "#f0f2f5", minHeight: "100vh" }}>
//       <Typography variant="h4" gutterBottom>
//         Medical Billing Dashboard
//       </Typography>
//       <Grid container spacing={3} alignItems="stretch">
//         <Grid item xs={12} sm={6} md={6} lg={3} xl={3}>
//           <Card sx={cardStyleWithBorder("#2196f3", "#e3f2fd")}>
//             <CardContent>
//               <Box display="flex" alignItems="center" justifyContent="space-between">
//                 <Typography variant="subtitle1">Gross Collection Rate</Typography>
//                 <ShowChartIcon color="primary" />
//               </Box>
//               <Typography variant="h3">{metrics.gcr.toFixed(2)}%</Typography>
//               {renderTrend(metrics.gcrChange)}
//             </CardContent>
//           </Card>
//         </Grid>
//
//         <Grid item xs={12} sm={6} md={6} lg={3} xl={3}>
//           <Card sx={cardStyleWithBorder("#f44336", "#ffebee")}>
//             <CardContent>
//               <Box display="flex" alignItems="center" justifyContent="space-between">
//                 <Typography variant="subtitle1">Denial Rate</Typography>
//                 <ErrorOutlineIcon color="error" />
//               </Box>
//               <Typography variant="h3">{metrics.denialRate.toFixed(2)}%</Typography>
//               {renderTrend(metrics.denialChange, false)}
//             </CardContent>
//           </Card>
//         </Grid>
//
//         <Grid item xs={12} sm={6} md={6} lg={3} xl={3}>
//           <Card sx={cardStyleWithBorder("#4caf50", "#e8f5e9")}>
//             <CardContent>
//               <Box display="flex" alignItems="center" justifyContent="space-between">
//                 <Typography variant="subtitle1">Total Claims</Typography>
//                 <SummarizeIcon color="success" />
//               </Box>
//               <Typography variant="h3">{metrics.totalClaims}</Typography>
//             </CardContent>
//           </Card>
//         </Grid>
//
//         <Grid item xs={12} sm={6} md={6} lg={3} xl={3}>
//           <Card sx={cardStyleWithBorder("#ff9800", "#fff3e0")}>
//             <CardContent>
//               <Box display="flex" alignItems="center" justifyContent="space-between">
//                 <Typography variant="subtitle1">Total Payments</Typography>
//                 <AttachMoneyIcon sx={{ color: "#ff9800" }} />
//               </Box>
//               <Typography variant="h3">${metrics.totalPayments}</Typography>
//             </CardContent>
//           </Card>
//         </Grid>
//
//         <Grid item xs={12} sm={12} md={6} lg={4} xl={3}>
//           <Card sx={{ height: "100%", padding: "20px" }}>
//             <Typography variant="h6" gutterBottom>
//               Gender Distribution
//             </Typography>
//             <PieChart width={300} height={250}>
//               <Pie
//                 data={genderData}
//                 dataKey="value"
//                 nameKey="name"
//                 cx="50%"
//                 cy="50%"
//                 outerRadius={80}
//                 label
//               >
//                 {genderData.map((entry, index) => (
//                   <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
//                 ))}
//               </Pie>
//               <Tooltip />
//               <Legend />
//             </PieChart>
//           </Card>
//         </Grid>
//       </Grid>
//     </Box>
//   );
// };
//
// export default Dashboard;

