import SignIn from "./components/auth/login/signIn";
import Dashboard from "./pages/Dashboard/dashboard";
import Patients from "./pages/Patients/patients";
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
import ICUViewPatient from "./pages/ICU POV/ICUiewPatients";
import ViewRequest from "./pages/CSR POV/ViewRequest";
import ConfirmRequest from "./pages/CSR POV/ConfirmRequest";
import PharmacyTransferHistory from "./pages/PharmacyPOV/PharmacyTransferHistory";
import InventoryTransaction from "./pages/History/InventoryTransaction";
import PaidSection from "./pages/Billing/PaidSection";
import StockInHistory from "./pages/History/StockInHistory";
import ForgotPassword from "./components/auth/login/ForgotPassword";
import AdminConsult from "./pages/AdminAppointments/Consultation/AdminConsult";
import AdminLab from "./pages/AdminAppointments/Laboratory/AdminLab";
import ClinicInventory from "./pages/Inventory/clinicInventory";
import ChangePasswordPage from "./components/navigation/ChangePassword";
import RequestLabTest from "./pages/AdminAppointments/Laboratory/RequestLabTest";
import SpecialistAppointments from "./pages/AdminAppointments/Consultation/SpecialistAppointments";
import LabTestReport from "./pages/AdminAppointments/Laboratory/LabTestReport";
import DoctorProfile from "./pages/Settings/Doctors/DoctorProfile";
import Inventory from "./pages/Inventory/InventoryItems";
import GenerateMedicalCertificate from "./pages/Settings/Doctors/GenerateMedicalCertificate";
import UsersProfilePage from "./pages/Settings/Users/UserProfilePage";
import EmployeeAttendanceSystem from "./pages/EmployeeSalaryPage/EmployeeAttendanceSystem";
import Teleconsultation from "./pages/Teleconsultation/Teleconsultation";
import SuppliersTable from "./pages/Settings/Suppliers/SuppliersTable";
import ImportDoctorSignature from "./pages/Settings/Doctors/ImportDoctorSignature";
import AIAssistant from "./pages/AIAssistant/AIAssistant";
import { element } from "prop-types";
import path from "path";

function App() {
  const routesArray = [
    {
      path: "/signin",
      element: <SignIn />,
    },
    { path: "forgot-password", element: <ForgotPassword /> },
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
        { path: "Request", element: <Request /> },
        { path: "requestS", element: <RequestS /> },
        { path: "inventoryStock", element: <InventoryStock /> },
        { path: "requestStock", element: <RequestStock /> },
        { path: "icuLocalInventory", element: <IcuLocalInventory /> },
        { path: "ViewRequest", element: <ViewRequest /> },
        { path: "ICUViewPatient", element: <ICUViewPatient /> },
        { path: "ConfirmRequest", element: <ConfirmRequest /> },
        {
          path: "PharmacyTransferHistory",
          element: <PharmacyTransferHistory />,
        },
        { path: "PaidSection", element: <PaidSection /> },
        { path: "StockInHistory", element: <StockInHistory /> },
        { path: "InventoryTransaction", element: <InventoryTransaction /> },
        { path: "PaidSection", element: <PaidSection /> },
        { path: "StockInHistory", element: <StockInHistory /> },
        { path: "AdminConsult", element: <AdminConsult /> },
        { path: "AdminLab", element: <AdminLab /> },
        { path: "clinicInventory", element: <ClinicInventory /> },
        { path: "clinicInventory", element: <ClinicInventory /> },
        { path: "change-password", element: <ChangePasswordPage /> },
        { path: "RequestLabTest", element: <RequestLabTest /> },
        { path: "LabTestReport", element: <LabTestReport /> },
        { path: "SpecialistAppointments", element: <SpecialistAppointments /> },
        { path: "doctor-profile", element: <DoctorProfile /> },
        {
          path: "generate-medical-certificate",
          element: <GenerateMedicalCertificate />,
        },
        { path: "Transfer", element: <Transfer /> },
        {path: "user-profile", element: <UsersProfilePage /> },
        {path: "employee-attendance", element: <EmployeeAttendanceSystem /> },
        {path: "teleconsultation", element: <Teleconsultation /> },
        {path:"user-management", element: <UsersTable /> },
        {path: "supplier-management", element: <SuppliersTable /> },
        {path: "import-signature", element: <ImportDoctorSignature /> },
        {path: "ai-assistant", element: <AIAssistant /> }, 
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