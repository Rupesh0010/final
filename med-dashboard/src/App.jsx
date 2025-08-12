import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";  // make sure this file exists
import GCRPage from "./pages/GCRPage";      // make sure this file exists
import NCRPage from "./pages/NCRPage";
import FPRPage from "./pages/FPRPage";
const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/gcr" element={<GCRPage />} />
          <Route path="/" element={<Dashboard />} />
        <Route path="/ncr" element={<NCRPage />} />
          <Route path="/" element={<Dashboard />} />
        <Route path="/fpr" element={<FPRPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
