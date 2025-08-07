import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Provider } from "react-redux";
import store from "./store/store";

import FinalUIDAIDashboard from "./pages/Dashboard";

import EnhancedAmcCalculator from "./pages/EnhancedAmcCalculator";
import WarrantyCalculator from "./pages/WarrantyCalculator";
import WarrantyEstimator from "./pages/WarrantyEstimator";
import PaymentTracker from "./pages/PaymentTracker";
import WarrantyTracker from "./pages/WarrantyTracker";

import "./index.css";

function App() {
  return (
    <Provider store={store}>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<FinalUIDAIDashboard />} />
            
            <Route
              path="/enhanced-amc-calculator"
              element={<EnhancedAmcCalculator />}
            />
            <Route
              path="/warranty-estimator"
              element={<WarrantyEstimator />}
            />
            <Route
              path="/warranty-payment-tracker"
              element={<WarrantyCalculator />}
            />
            <Route path="/payment-tracker" element={<PaymentTracker />} />
            <Route path="/warranty-tracker" element={<WarrantyTracker />} />
          </Routes>
        </div>
      </Router>
    </Provider>
  );
}

export default App;
