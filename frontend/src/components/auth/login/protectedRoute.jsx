import { Navigate } from "react-router-dom";
import { useAuth } from "../../../context/authContext/authContext";
import PropTypes from "prop-types";

const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to="/signin" replace />;
  }

  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ProtectedRoute;
