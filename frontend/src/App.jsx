import SignIn from "./components/auth/login/signIn";
import Dashboard from "./pages/Dashboard/dashboard";
import Patients from "./pages/Patients/patients";
import Inventory from "./pages/Inventory/inventory";
import Analytics from "./pages/Analytics/analytics";
import Billing from "./pages/Billing/billing";
import InventoryHistory from "./pages/History/InventoryHistory";
import ViewBill from "./pages/Billing/ViewBill";
import { AuthProvider } from "./context/authContext/authContext";
import { useRoutes } from "react-router-dom";
import MainLayout from "./components/mainLayout/mainLayout";
import ProtectedRoute from "./components/auth/login/protectedRoute";
import UsersTable from "./pages/Settings/Users/UsersTable";
import RolesTable from "./pages/Settings/Roles/RolesTable";
import Settings from "./pages/Settings/settings";
import AccessDenied from "./pages/ErrorPages/AccessDenied";
import ViewPatient from "./pages/Patients/ViewPatient";
import StockTransfer from "./pages/CSR POV/stockTransfer";
import Transfer from "./pages/CSR POV/Transfer";
import RequestStock from "./pages/ICU POV/requestStock";
import RequestS from "./pages/ICU POV/requestS";
import InventoryStock from "./pages/ICU POV/inventoryStock";
import IcuLocalInventory from "./pages/ICU POV/IcuLocalInventory";
import TransferMed from "./pages/PharmacyPOV/TransferMed";
import ViewMedReq from "./pages/PharmacyPOV/ViewMedReq";
import ICUViewPatient from "./pages/ICU POV/ICUiewPatients";
import OverallInventory from "./pages/Inventory/OverAllInventory";
import ViewRequest from "./pages/CSR POV/ViewRequest"
import ConfirmRequest from "./pages/CSR POV/ConfirmRequest";
import PharmacyTransferHistory from "./pages/PharmacyPOV/PharmacyTransferHistory";
import CsrTransferHistory from "./pages/CSR POV/CsrTransferHistory";
import UsageHistory from "./pages/History/UsageHistory";
import PaidSection from "./pages/Billing/PaidSection";
import { element } from "prop-types";

function App() {
  const routesArray = [
    {
      path: "/signin",
      element: <SignIn />,
    },
    {
      path: "/",
      element: (
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      ),
      children: [
        { path: "dashboard", element: <Dashboard /> },
        { path: "patients", element: <Patients /> },
        { path: "patients/:id", element: <ViewPatient /> },
        { path: "inventory", element: <Inventory /> },
        { path: "analytics", element: <Analytics /> },
        { path: "settings", element: <Settings /> },
        { path: "users", element: <UsersTable /> },
        { path: "roles", element: <RolesTable /> },
        { path: "billing", element: <Billing /> },
        { path: "ViewBill", element: <ViewBill /> },
        { path: "access-denied", element: <AccessDenied /> },
        { path: "InventoryHistory", element: <InventoryHistory /> },
        { path: "stockTransfer", element: <StockTransfer /> },
        { path: "Transfer", element: <Transfer /> },
        { path: "Request", element: <Request /> },
        { path: "requestS", element: <RequestS /> },
        { path: "inventoryStock", element: <InventoryStock /> },
        { path: "requestStock", element: <RequestStock /> },
        { path: "icuLocalInventory", element: <IcuLocalInventory /> },
        { path: "TransferMed", element: <TransferMed /> },
        { path: "ViewRequest", element: <ViewRequest/> },
        { path: "ViewMedReq", element: <ViewMedReq /> },
        { path: "ICUViewPatient", element: <ICUViewPatient /> },
        { path: "OverallInventory", element: <OverallInventory /> },
        { path: "ConfirmRequest", element: <ConfirmRequest /> },
        { path: "PharmacyTransferHistory", element: < PharmacyTransferHistory/>},
        { path: "CsrTransferHistory", element: <CsrTransferHistory/>},
        { path: "UsageHistory", element: <UsageHistory/>},
        { path: "PaidSection", element: <PaidSection/>},
      ],
    },
    {
      path: "*",
      element: <SignIn />,
    },
  ];

  let routesElement = useRoutes(routesArray);
  return (
    <AuthProvider>
      <div>{routesElement}</div>
    </AuthProvider>
  );
}

export default App;
