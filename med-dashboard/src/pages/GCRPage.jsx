import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Typography } from "@mui/material";

const dummyData = [
  { month: "June", gcr: 80 },
  { month: "July", gcr: 85 },
  { month: "August", gcr: 88 },
];

const GCRPage = () => {
  return (
    <div>
      <Typography variant="h5">Gross Collection Rate - Monthly Trend</Typography>
      <LineChart width={600} height={300} data={dummyData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="gcr" stroke="#1976D2" strokeWidth={2} />
      </LineChart>
    </div>
  );
};

export default GCRPage;
