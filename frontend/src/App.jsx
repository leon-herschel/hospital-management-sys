import SignIn from "./components/signIn";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/dashboard";
import Overview from "./components/overview";
import Inventory from "./pages/inventory";
import NewInventory from "./components/addInventory";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SignIn />}></Route>
        <Route path="/dashboard" element={<Dashboard />}></Route>
        <Route path="/overview" element={<Overview />}></Route>
        <Route path="/inventory" element={<Inventory />}></Route>
        <Route path="/addInventory" element={<NewInventory />}></Route>
      </Routes>
    </Router>
  );
};

export default App;
