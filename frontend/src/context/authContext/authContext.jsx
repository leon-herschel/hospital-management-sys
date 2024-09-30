import React, { useContext, useState, useEffect } from "react";
import PropTypes from "prop-types"; 
import { auth, database } from "../../firebase/firebase"; 
import { onAuthStateChanged } from "firebase/auth";
import { ref, get } from "firebase/database"; 

const AuthContext = React.createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [isEmailUser, setIsEmailUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);  
  const [department, setDepartment] = useState(null);  

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, initializeUser);
    return unsubscribe;
  }, []);

  async function initializeUser(user) {
    if (user) {
      setCurrentUser({ ...user });

      const isEmail = user.providerData.some(
        (provider) => provider.providerId === "password"
      );
      setIsEmailUser(isEmail);

      setUserLoggedIn(true);

      const userRef = ref(database, `users/${user.uid}`);
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        const userData = snapshot.val();
        setRole(userData.role);  
        setDepartment(userData.department);  
      } else {
        console.log("No user data found in Realtime Database");
      }
    } else {
      setCurrentUser(null);
      setUserLoggedIn(false);
      setRole(null);  
      setDepartment(null);  
    }

    setLoading(false);
  }

  const value = {
    userLoggedIn,
    isEmailUser,
    currentUser,
    role,  
    department,  
    setCurrentUser
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired, 
};
