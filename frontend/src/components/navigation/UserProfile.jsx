import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/authContext/authContext';
import { useNavigate } from 'react-router-dom'; // Add this import
import { ref, get } from 'firebase/database';
import { database } from '../../firebase/firebase'; 
import { UserIcon } from '@heroicons/react/16/solid';

const UserProfileDropdown = ({ onLogout }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate(); // Add this hook
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

  const handleChangePasswordClick = () => {
    setDropdownVisible(false);
    navigate('/change-password'); // Navigate to change password page
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
      {/* Profile Icon with Avatar-like Design */}
      <div
        ref={iconRef}
        className="cursor-pointer group"
        onClick={handleDropdownToggle}
      >
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105">
          <UserIcon className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* Enhanced Dropdown Menu */}
      {dropdownVisible && userData && (
        <div 
          ref={dropdownRef} 
          className="absolute right-0 mt-3 w-72 bg-white border border-gray-200 rounded-xl shadow-2xl p-0 z-50 overflow-hidden"
        >
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-4 text-white">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <UserIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="font-semibold text-lg">
                  {`${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'User'}
                </div>
                <div className="text-blue-100 text-sm">
                  {userData.role.charAt(0).toUpperCase() + userData.role.slice(1)}
                </div>
              </div>
            </div>
          </div>

          {/* User Details */}
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <div className="space-y-1">
              <div className="flex items-center text-sm text-gray-600">
                <span className="w-4 h-4 mr-2">📧</span>
                <span className="truncate">{userData.email}</span>
              </div>
              {userData.department && (
                <div className="flex items-center text-sm text-gray-600">
                  <span className="w-4 h-4 mr-2">🏥</span>
                  <span>{userData.department} Department</span>
                </div>
              )}
              <div className="flex items-center text-sm text-gray-600">
                <span className="w-4 h-4 mr-2">🏢</span>
                <span className="truncate">{clinicName}</span>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <button
              className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-150"
              onClick={handleChangePasswordClick}
            >
              <span className="w-5 h-5 mr-3">🔐</span>
              Change Password
            </button>
            <button
              className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors duration-150"
              onClick={onLogout}
            >
              <span className="w-5 h-5 mr-3">🚪</span>
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfileDropdown;