import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import InventoryHistory from "./pages/Inventory/inventoryHistory.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <InventoryHistory />
    </BrowserRouter>
  </StrictMode>
);
