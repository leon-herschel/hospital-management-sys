import { useState, useEffect } from 'react';
import { useAuth } from '../../context/authContext/authContext';
import { ref, get } from 'firebase/database';
import { database } from '../../firebase/firebase'; 
import { UserIcon } from '@heroicons/react/16/solid';

const UserProfileDropdown = () => {
  const { currentUser } = useAuth();
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [userData, setUserData] = useState(null);

  const fetchUserData = async () => {
    if (currentUser) {
      const userRef = ref(database, `users/${currentUser.uid}`);
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        setUserData(snapshot.val());
      } else {
        console.log('No user data found in Realtime Database');
      }
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [currentUser]);

  return (
    <div 
      className="relative" 
      onMouseEnter={() => setDropdownVisible(true)} 
      onMouseLeave={() => setDropdownVisible(false)}
    >
      <div className="cursor-pointer">
        <UserIcon className="w-7 h-7 text-gray-800 hover:text-gray-900" />
      </div>
      {dropdownVisible && userData && (
        <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-lg p-2">
          <div className="font-bold">
            {`${userData.firstName || ''} ${userData.lastName || ''}`}
          </div>
          <div>{userData.email}</div>
          <div>{userData.department}</div>
          <div>{userData.role.charAt(0).toUpperCase() + userData.role.slice(1)}</div>
        </div>
      )}
    </div>
  );
};

export default UserProfileDropdown;
