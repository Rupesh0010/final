import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";  // make sure this file exists
import GCRPage from "./pages/GCRPage";      // make sure this file exists
import NCRPage from "./pages/NCRPage";
import FPRPage from "./pages/FPRPage";
import DenialRatePage from "./pages/DenialRatePage";
import TotalClaimPage from "./pages/TotalClaimPage";
import TotalPaymentPage from "./pages/TotalPaymentPage";
import ChargeLag from "./pages/ChargeLag";
import CCRPage from "./pages/CCRPage";
import ARDaysPage from "./pages/ARDaysPage";

 // check spelling/case/path

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
        <Route path="/" element={<Dashboard />} />
        <Route path="/denial-rate" element={<DenialRatePage />} />
        <Route path="/" element={<Dashboard />} />
        <Route path="/total-claims" element={<TotalClaimPage />} />

        <Route path="/" element={<Dashboard />} />
        <Route path="/total-payments" element={<TotalPaymentPage />} />
        <Route path="/" element={<Dashboard />} />
        <Route path="/charge-lag" element={<ChargeLag />} />
        <Route path="/" element={<Dashboard />} />
        <Route path="/ccr" element={<CCRPage />} />
        <Route path="/" element={<Dashboard />} />
        <Route path="/ar-days" element={<ARDaysPage/>} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
