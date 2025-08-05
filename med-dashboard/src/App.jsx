import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";  // make sure this file exists
import GCRPage from "./pages/GCRPage";      // make sure this file exists

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/gcr" element={<GCRPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
