import SignIn from './components/auth/login/signIn'
import Home from "./components/home/home";
import { AuthProvider } from './context/authContext/authContext';
import { useRoutes } from "react-router-dom";

function App() {
  const routesArray = [
    {
      path: "*",
      element: <SignIn />,
    },
    {
      path: "/signin",
      element: <SignIn />,
    },
    {
      path: "/home",
      element: <Home />,
    },
  ];
  let routesElement = useRoutes(routesArray);
  return (
    <AuthProvider>
      <div className="w-full h-screen flex flex-col">{routesElement}</div>
    </AuthProvider>
  );
}

export default App;