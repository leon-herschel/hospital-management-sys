import SignIn from "./components/auth/login/signIn";
import Dashboard from "./pages/Dashboard/dashboard";
import Patients from "./pages/Patients/patients";
import Inventory from "./pages/Inventory/inventory";
import Analytics from "./pages/Analytics/analytics";
import Billing from "./pages/Billing/billing";
import InventoryHistory from "./pages/Inventory/InventoryHistory";
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
