import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import OverAllInventory from "./pages/Inventory/OverAllInventory.jsx";
import PharmacyTransferHistory from "./pages/History/PharmacyTransferHistory.jsx";
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
