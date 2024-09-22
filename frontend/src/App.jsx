import SignIn from './components/auth/login/signIn';
import Dashboard from './pages/Dashboard/dashboard';
import Patients from './pages/Patients/patients';
import Inventory from './pages/Inventory/inventory';
import Settings from './pages/Settings/settings';
import Analytics from './pages/Analytics/analytics';
import { AuthProvider } from './context/authContext/authContext';
import { useRoutes } from 'react-router-dom';
import MainLayout from './components/mainLayout/mainLayout';
import ProtectedRoute from './components/auth/login/protectedRoute';

function App() {
  const routesArray = [
    {
      path: '/signin',
      element: <SignIn />,
    },
    {
      path: '/',
      element: (
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      ), 
      children: [
        { path: 'dashboard', element: <Dashboard /> },
        { path: 'patients', element: <Patients /> },
        { path: 'inventory', element: <Inventory /> },
        { path: 'analytics', element: <Analytics /> },
        { path: 'settings', element: <Settings /> },
      ],
    },
    {
      path: '*',
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
