import React from "react";
import Papa from "papaparse";
import { Input } from "@mui/material";

const CSVUploader = ({ onDataLoaded }) => {
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        onDataLoaded(results.data);
      },
    });
  };

  return (
    <div>
      <Input type="file" accept=".csv" onChange={handleFileChange} />
    </div>
  );
};

export default CSVUploader;
