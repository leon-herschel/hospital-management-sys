import { Link } from "react-router-dom";

const Dashboard = () => {
  return (
    <div>
      Welcome to the dashboard
      <div>
        <Link to={"/overview"}>
          <button>Overview</button>
        </Link>
      </div>
      <div>
        <Link to={"/inventory"}>
          <button>Inventory</button>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
