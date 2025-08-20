import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/authContext/authContext';
import { useNavigate } from 'react-router-dom';
import { ref, get } from 'firebase/database';
import { database } from '../../firebase/firebase'; 
import { UserIcon } from '@heroicons/react/16/solid';

const UserProfileDropdown = ({ onLogout }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [userData, setUserData] = useState(null);
  const [clinicName, setClinicName] = useState("");
  const iconRef = useRef(null); 
  const dropdownRef = useRef(null); 

  // Position state
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

  const fetchUserData = async () => {
    if (currentUser) {
      const authUserId = currentUser.uid;
      const userRef = ref(database, `users/${authUserId}`);
      const userSnapshot = await get(userRef);

      if (userSnapshot.exists() && userSnapshot.val().role === 'doctor') {
        const doctorsRef = ref(database, 'doctors');
        const doctorsSnapshot = await get(doctorsRef);

        if (doctorsSnapshot.exists()) {
          const doctorsData = doctorsSnapshot.val();
          let foundDoctor = null;

          Object.entries(doctorsData).forEach(([id, doctor]) => {
            if (doctor.authId === authUserId) {
              foundDoctor = {
                ...doctor,
                role: 'doctor',
                email: doctor.email || currentUser.email,
              };
            }
          });

          if (foundDoctor) {
            setUserData(foundDoctor);
            if (foundDoctor.clinicAffiliations?.length > 0) {
              fetchClinicName(foundDoctor.clinicAffiliations[0]);
            }
            return;
          }
        }
      }

      if (userSnapshot.exists()) {
        const user = userSnapshot.val();
        setUserData(user);
        if (user.clinicAffiliation) {
          fetchClinicName(user.clinicAffiliation);
        }
      }
    }
  };

  const fetchClinicName = async (clinicId) => {
    const clinicRef = ref(database, `clinics/${clinicId}`);
    const snapshot = await get(clinicRef);
    if (snapshot.exists()) {
      setClinicName(snapshot.val().name || clinicId);
    } else {
      setClinicName(clinicId);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [currentUser]);

  const handleDropdownToggle = () => {
    if (!dropdownVisible && iconRef.current) {
      const rect = iconRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 8, left: rect.right - 288 }); // 288px = dropdown width
    }
    setDropdownVisible((prev) => !prev);
  };

  const handleChangePasswordClick = () => {
    setDropdownVisible(false);
    navigate('/change-password');
  };

  const handleUserProfileClick = () => {
    setDropdownVisible(false);
    navigate('/doctor-profile');
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(event.target) &&
        iconRef.current && !iconRef.current.contains(event.target)
      ) {
        setDropdownVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      {/* Profile Icon */}
      <div ref={iconRef} className="cursor-pointer group" onClick={handleDropdownToggle}>
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105">
          <UserIcon className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* Dropdown in Portal */}
      {dropdownVisible && userData &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{ position: 'fixed', top: dropdownPos.top, left: dropdownPos.left }}
            className="w-72 bg-white border border-gray-200 rounded-xl shadow-2xl z-[99999] overflow-hidden"
          >
            {/* Profile Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-4 text-white">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <UserIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-lg">
                    {userData.fullName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'User'}
                  </div>
                  <div className="text-blue-100 text-sm">
                    {userData.role?.charAt(0).toUpperCase() + userData.role?.slice(1)}
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
                {(userData.department || userData.specialty) && (
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="w-4 h-4 mr-2">🏥</span>
                    <span>{userData.specialty || userData.department} {userData.department && !userData.specialty ? 'Department' : ''}</span>
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
              {userData.role === 'doctor' && (
                <button
                  className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-150"
                  onClick={handleUserProfileClick}
                >
                  <span className="w-5 h-5 mr-3">👨‍⚕️</span>
                  User Profile
                </button>
              )}
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
          </div>,
          document.body
        )}
    </>
  );
};

export default UserProfileDropdown;
