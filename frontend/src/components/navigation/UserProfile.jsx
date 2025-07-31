import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/authContext/authContext';
import { ref, get } from 'firebase/database';
import { database } from '../../firebase/firebase'; 
import { UserIcon } from '@heroicons/react/16/solid';

const UserProfileDropdown = ({ onLogout }) => {
  const { currentUser } = useAuth();
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [userData, setUserData] = useState(null);
  const [clinicName, setClinicName] = useState("");
  const dropdownRef = useRef(null); 
  const iconRef = useRef(null); 

  const fetchUserData = async () => {
    if (currentUser) {
      const userRef = ref(database, `users/${currentUser.uid}`);
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        const user = snapshot.val();
        setUserData(user);
        if (user.clinicAffiliation) {
          fetchClinicName(user.clinicAffiliation);
        }
      } else {
        console.log('No user data found in Realtime Database');
      }
    }
  };

  const fetchClinicName = async (clinicId) => {
    const clinicRef = ref(database, `clinics/${clinicId}`);
    const snapshot = await get(clinicRef);
    if (snapshot.exists()) {
      const clinicData = snapshot.val();
      setClinicName(clinicData.name || clinicId);
    } else {
      setClinicName(clinicId); // fallback
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [currentUser]);

  const handleDropdownToggle = () => {
    setDropdownVisible(prevState => !prevState);
  };

  // closes dropdown when clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target) && 
        iconRef.current && 
        !iconRef.current.contains(event.target)
      ) {
        setDropdownVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative">
      <div
        ref={iconRef}
        className="cursor-pointer"
        onClick={handleDropdownToggle}
      >
        <UserIcon className="w-7 h-7 text-gray-800 hover:text-gray-900" />
      </div>

      {/* Dropdown Menu */}
      {dropdownVisible && userData && (
        <div 
          ref={dropdownRef} 
          className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-lg p-2"
        >
          <div className="font-bold mb-1">
            {`${userData.firstName || ''} ${userData.lastName || ''}`}
          </div>
          <div className="text-sm text-gray-600 mb-1">{userData.email}</div>
          {userData.department && (
            <div className="text-sm text-gray-600 mb-1">{userData.department} Department</div>
          )}
          <div className="text-sm text-gray-600 mb-1">Clinic: {clinicName} </div>
          <div className="text-sm text-gray-600 mb-2">
            {userData.role.charAt(0).toUpperCase() + userData.role.slice(1)}
          </div>

          <hr className="border-t border-gray-200 my-2" />

          <ul className="space-y-1">
            <li>
              <a
                href="#"
                className="block px-2 py-2 rounded-sm text-gray-900 hover:bg-gray-200"
                onClick={onLogout} 
              >
                Logout
              </a>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default UserProfileDropdown;
