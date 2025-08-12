import { Card, CardContent, Typography } from "@mui/material";

const KPICard = ({ title, value, change, positive }) => {
  return (
    <Card sx={{ minWidth: 200, textAlign: "center" }}>
      <CardContent>
        <Typography variant="h6">{title}</Typography>
        <Typography variant="h4">{value}</Typography>
        {change && (
          <Typography color={positive ? "green" : "red"}>{change}</Typography>
        )}
      </CardContent>
    </Card>
  );
};




export default KPICard;
