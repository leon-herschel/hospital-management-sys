import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/authContext/authContext';
import { useNavigate } from 'react-router-dom';
import { ref, get } from 'firebase/database';
import { database } from '../../firebase/firebase'; 
import { 
  User, 
  Mail, 
  Building2, 
  Stethoscope, 
  Lock, 
  LogOut, 
  UserCircle 
} from 'lucide-react';

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
    // Route based on user role
    if (userData?.role === 'doctor') {
      navigate('/doctor-profile');
    } else {
      navigate('/user-profile');
    }
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
        <div className="relative w-10 h-10 bg-gradient-to-br from-slate-700 via-slate-600 to-slate-500 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 ring-2 ring-white/10 hover:ring-white/20">
          <User className="w-5 h-5 text-white" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
        </div>
      </div>

      {/* Dropdown in Portal */}
      {dropdownVisible && userData &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{ position: 'fixed', top: dropdownPos.top, left: dropdownPos.left }}
            className="w-72 bg-white/95 backdrop-blur-xl border border-gray-200/60 rounded-2xl shadow-2xl z-[99999] overflow-hidden ring-1 ring-black/5"
          >
            {/* Profile Header */}
            <div className="relative bg-gradient-to-br from-slate-700 via-slate-600 to-slate-500 px-5 py-6 text-white">
              <div className="absolute inset-0 bg-gradient-to-br from-black/10 to-transparent"></div>
              <div className="relative flex items-center space-x-4">
                <div className="w-14 h-14 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center ring-2 ring-white/20">
                  <User className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-lg truncate">
                    {userData.fullName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'User'}
                  </div>
                  <div className="text-white/80 text-sm font-medium flex items-center">
                    {userData.role === 'doctor' && <Stethoscope className="w-3 h-3 mr-1" />}
                    {userData.role?.charAt(0).toUpperCase() + userData.role?.slice(1)}
                  </div>
                </div>
              </div>
            </div>

            {/* User Details */}
            <div className="px-5 py-4 bg-gradient-to-b from-gray-50/80 to-white border-b border-gray-100/60">
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-700 group">
                  <Mail className="w-4 h-4 mr-3 text-gray-500 group-hover:text-blue-500 transition-colors" />
                  <span className="truncate font-medium">{userData.email}</span>
                </div>
                {(userData.department || userData.specialty) && (
                  <div className="flex items-center text-sm text-gray-700 group">
                    <Stethoscope className="w-4 h-4 mr-3 text-gray-500 group-hover:text-blue-500 transition-colors" />
                    <span className="font-medium">{userData.specialty || userData.department} {userData.department && !userData.specialty ? 'Department' : ''}</span>
                  </div>
                )}
                <div className="flex items-center text-sm text-gray-700 group">
                  <Building2 className="w-4 h-4 mr-3 text-gray-500 group-hover:text-blue-500 transition-colors" />
                  <span className="truncate font-medium">{clinicName}</span>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              {/* User Profile - Now available to ALL users */}
              <button
                className="w-full flex items-center px-5 py-3.5 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-50/50 hover:text-blue-700 transition-all duration-200 group"
                onClick={handleUserProfileClick}
              >
                <UserCircle className="w-5 h-5 mr-4 text-gray-500 group-hover:text-blue-600 transition-colors" />
                <span className="font-medium">User Profile</span>
              </button>
              
              <button
                className="w-full flex items-center px-5 py-3.5 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-amber-50 hover:to-amber-50/50 hover:text-amber-700 transition-all duration-200 group"
                onClick={handleChangePasswordClick}
              >
                <Lock className="w-5 h-5 mr-4 text-gray-500 group-hover:text-amber-600 transition-colors" />
                <span className="font-medium">Change Password</span>
              </button>

              {/* Separator */}
              <div className="my-2 mx-4 border-t border-gray-100"></div>

              <button
                className="w-full flex items-center px-5 py-3.5 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-50/50 hover:text-red-700 transition-all duration-200 group"
                onClick={onLogout}
              >
                <LogOut className="w-5 h-5 mr-4 text-gray-500 group-hover:text-red-600 transition-colors" />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

export default UserProfileDropdown;