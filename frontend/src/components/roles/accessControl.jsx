import { useState, useEffect } from "react";
import { getDatabase, ref, onValue } from 'firebase/database';
import { useAuth } from "../context/authContext/authContext";

export const useAccessControl = () => {
  const [roleData, setRoleData] = useState(null);
  const { role } = useAuth();

  useEffect(() => {
    if (role) {
      const db = getDatabase();
      const roleRef = ref(db, `roles/${role}`);
      
      onValue(roleRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          setRoleData(data);
        } else {
          console.error('No role data available');
        }
      });
    }
  }, [role]);

  return roleData;
};
