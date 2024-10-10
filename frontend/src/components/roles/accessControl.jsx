import { useState, useEffect } from "react";
import { getDatabase, ref, onValue } from 'firebase/database';
import { useAuth } from "../../context/authContext/authContext";

export const useAccessControl = () => {
  const [permissions, setPermissions] = useState(null); 
  const { department } = useAuth(); 

  useEffect(() => {
    if (department) {
      const db = getDatabase();
      // Only fetch the permissions for the specific department
      const permissionsRef = ref(db, `departments/${department}/permissions`);

      onValue(permissionsRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          setPermissions(data); 
        } else {
          console.error('No permissions data available for this department');
        }
      });
    }
  }, [department]);

  return permissions; 
};
