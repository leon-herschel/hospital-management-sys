import { useState, useEffect } from "react";
import { useAuth } from "../../context/authContext/authContext";
import { useNavigate } from "react-router-dom";
import { ref, get } from "firebase/database";
import { database } from "../../firebase/firebase";
import {
  UserPlusIcon,
  CreditCardIcon,
  BeakerIcon,
  CubeIcon,
  ChevronRightIcon,
  HomeIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  TruckIcon,
  ArrowRightIcon,
  UsersIcon
} from "@heroicons/react/24/outline";

const Dashboard = () => {
  const { currentUser, role, department } = useAuth();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [newPatientsToday, setNewPatientsToday] = useState(0);
  const [loadingPatients, setLoadingPatients] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Function to check if a date is today
  const isToday = (dateString) => {
    const today = new Date();
    const date = new Date(dateString);
    
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  // Function to fetch new patients count for today
  const fetchNewPatientsToday = async () => {
    if (!permissions?.accessPatients) return;
    
    try {
      setLoadingPatients(true);
      const patientsRef = ref(database, 'patients');
      const patientsSnapshot = await get(patientsRef);
      
      if (patientsSnapshot.exists()) {
        const patientsData = patientsSnapshot.val();
        let todayCount = 0;
        
        Object.values(patientsData).forEach(patient => {
          if (patient.createdAt && isToday(patient.createdAt)) {
            todayCount++;
          }
        });
        
        setNewPatientsToday(todayCount);
      } else {
        setNewPatientsToday(0);
      }
    } catch (error) {
      console.error("Error fetching patients data:", error);
      setNewPatientsToday(0);
    } finally {
      setLoadingPatients(false);
    }
  };

  // Fetch current user data and permissions
  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // First check if user is a doctor
        if (role === 'doctor') {
          const doctorsRef = ref(database, 'doctors');
          const doctorsSnapshot = await get(doctorsRef);
          
          if (doctorsSnapshot.exists()) {
            const doctorsData = doctorsSnapshot.val();
            let foundDoctor = null;
            
            Object.entries(doctorsData).forEach(([id, doctor]) => {
              if (doctor.authId === currentUser.uid) {
                foundDoctor = {
                  ...doctor,
                  role: 'doctor',
                  email: doctor.email || currentUser.email,
                  displayName: doctor.fullName || `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim()
                };
              }
            });
            
            if (foundDoctor) {
              setUserData(foundDoctor);
              
              // Fetch permissions from departments node for doctors
              const userDepartment = foundDoctor.department || department;
              if (userDepartment) {
                await fetchPermissionsFromDepartment(userDepartment);
              } else {
                // Default doctor permissions if no department specified
                setPermissions({
                  accessPatients: true,
                  accessMedicalCertificate: true,
                  accessLaboratory: true,
                  accessBilling: false,
                  accessInventory: false,
                  accessTransferStocks: false
                });
              }
              setLoading(false);
              return;
            }
          }
        }

        // Fetch regular user data
        const userRef = ref(database, `users/${currentUser.uid}`);
        const userSnapshot = await get(userRef);
        
        if (userSnapshot.exists()) {
          const user = userSnapshot.val();
          setUserData({
            ...user,
            displayName: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || currentUser.displayName,
            email: user.email || currentUser.email
          });
          
          // Fetch permissions from departments node
          const userDepartment = user.department || department;
          if (userDepartment) {
            await fetchPermissionsFromDepartment(userDepartment);
          } else {
            // Default permissions for users without department
            setPermissions({
              accessPatients: false,
              accessBilling: false,
              accessLaboratory: false,
              accessInventory: false,
              accessMedicalCertificate: false,
              accessTransferStocks: false
            });
          }
        } else {
          // If no user data in database, use auth data
          setUserData({
            displayName: currentUser.displayName || currentUser.email?.split('@')[0],
            email: currentUser.email,
            role: role || 'user',
            department: department || 'General'
          });
          
          // Try to fetch permissions from department if available
          if (department) {
            await fetchPermissionsFromDepartment(department);
          } else {
            setPermissions({
              accessPatients: false,
              accessBilling: false,
              accessLaboratory: false,
              accessInventory: false,
              accessMedicalCertificate: false,
              accessTransferStocks: false
            });
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [currentUser, role, department]);

  // Fetch patients count when permissions are loaded
  useEffect(() => {
    if (!loading && permissions?.accessPatients) {
      fetchNewPatientsToday();
    }
  }, [permissions, loading]);

  // Function to fetch permissions from departments node
  const fetchPermissionsFromDepartment = async (departmentName) => {
    try {
      const departmentRef = ref(database, `departments/${departmentName}/permissions`);
      const departmentSnapshot = await get(departmentRef);
      
      if (departmentSnapshot.exists()) {
        const departmentPermissions = departmentSnapshot.val();
        setPermissions(departmentPermissions);
      } else {
        console.log(`No permissions found for department: ${departmentName}`);
        // Set default permissions if department not found
        setPermissions({
          accessPatients: false,
          accessBilling: false,
          accessLaboratory: false,
          accessInventory: false,
          accessMedicalCertificate: false,
          accessTransferStocks: false
        });
      }
    } catch (error) {
      console.error("Error fetching department permissions:", error);
      setPermissions({
        accessPatients: false,
        accessBilling: false,
        accessLaboratory: false,
        accessInventory: false,
        accessMedicalCertificate: false,
        accessTransferStocks: false
      });
    }
  };

  // Get user's first name for greeting
  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const getUserName = () => {
    if (userData?.displayName) {
      return userData.displayName.split(' ')[0];
    }
    if (userData?.firstName) {
      return userData.firstName;
    }
    if (userData?.email) {
      return userData.email.split('@')[0];
    }
    return "User";
  };

  // Define quick action cards based on permissions
  const getQuickActionCards = () => {
    const cards = [];

    if (permissions?.accessPatients) {
      cards.push({
        title: "Add Patient",
        description: loadingPatients ? "Loading..." : `New patients today: ${newPatientsToday}`,
        icon: UserPlusIcon,
        route: "/patients",
        gradient: "from-blue-500 to-blue-600",
        bgGradient: "from-blue-50 to-blue-100",
        iconColor: "text-blue-600",
        showPatientCount: true,
        patientCount: newPatientsToday,
        isLoadingCount: loadingPatients
      });
    }

    if (permissions?.accessBilling) {
      cards.push({
        title: "View Billing Paid",
        description: "Check payment records",
        icon: CreditCardIcon,
        route: "/PaidSection",
        gradient: "from-emerald-500 to-emerald-600",
        bgGradient: "from-emerald-50 to-emerald-100",
        iconColor: "text-emerald-600"
      });
    }

    if (permissions?.accessLaboratory) {
      cards.push({
        title: "Lab Appointment Request",
        description: "Schedule lab appointments",
        icon: BeakerIcon,
        route: "/AdminLab",
        gradient: "from-purple-500 to-purple-600",
        bgGradient: "from-purple-50 to-purple-100",
        iconColor: "text-purple-600"
      });
    }

    if (permissions?.accessInventory) {
      cards.push({
        title: "Add Inventory",
        description: "Manage clinic inventory",
        icon: CubeIcon,
        route: "/inventory",
        gradient: "from-orange-500 to-orange-600",
        bgGradient: "from-orange-50 to-orange-100",
        iconColor: "text-orange-600"
      });
    }

    if (permissions?.accessMedicalCertificate) {
      cards.push({
        title: "Medical Certificate",
        description: "Generate medical certificates",
        icon: DocumentTextIcon,
        route: "/generate-medical-certificate",
        gradient: "from-teal-500 to-teal-600",
        bgGradient: "from-teal-50 to-teal-100",
        iconColor: "text-teal-600"
      });
    }

    if (permissions?.accessTransferStocks) {
      cards.push({
        title: "Transfer Supply",
        description: "Transfer items between departments",
        icon: TruckIcon,
        route: "/Transfer",
        gradient: "from-indigo-500 to-indigo-600",
        bgGradient: "from-indigo-50 to-indigo-100",
        iconColor: "text-indigo-600"
      });
    }

    return cards;
  };

  const quickActionCards = getQuickActionCards();

  const handleCardClick = (route) => {
    navigate(route);
  };

  const handleButtonClick = (e, route) => {
    e.stopPropagation(); // Prevent card click event
    console.log('Attempting to navigate to:', route); // Debug log
    try {
      navigate(route);
      console.log('Navigation successful'); // Debug log
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Not Authenticated</h2>
          <p className="text-gray-600">Please log in to access the dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Welcome Section */}
      <div className="mb-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/50">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                {getGreeting()}, {getUserName()}! 👋
              </h1>
              <p className="text-xl text-gray-600 mb-4">
                What would you like to do today?
              </p>
              <div className="flex items-center text-sm text-gray-500">
                <CalendarDaysIcon className="w-4 h-4 mr-2" />
                {currentTime.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
                <span className="mx-2">•</span>
                {currentTime.toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit'
                })}
              </div>
            </div>
            <div className="hidden md:block">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                <HomeIcon className="w-12 h-12 text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
        
        {quickActionCards.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {quickActionCards.map((card, index) => (
              <div
                key={index}
                onClick={() => handleCardClick(card.route)}
                className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.bgGradient} p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 border border-white/50`}
              >
                {/* Background Gradient Overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                
                {/* Icon and Badge Container */}
                <div className="flex items-start justify-between mb-4">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                    <card.icon className={`w-6 h-6 ${card.iconColor}`} />
                  </div>
                  
                  {/* Patient Count Badge */}
                  {card.showPatientCount && (
                    <div className="flex flex-col items-end">
                      {card.isLoadingCount ? (
                        <div className="w-6 h-6 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <div className="flex items-center bg-white/90 rounded-full px-3 py-1 shadow-sm">
                            <UsersIcon className="w-4 h-4 text-blue-600 mr-1" />
                            <span className="text-sm font-bold text-blue-600">{card.patientCount}</span>
                          </div>
                          <span className="text-xs text-gray-600 mt-1">today</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-gray-800">
                  {card.title}
                </h3>
                <p className="text-gray-600 text-sm mb-6 group-hover:text-gray-700">
                  {card.description}
                </p>

                {/* Button and Arrow Container */}
                <div className="flex justify-between items-center">
                  {/* Action Button */}
                  <button
                    onClick={(e) => handleButtonClick(e, card.route)}
                    className={`inline-flex items-center px-4 py-2 rounded-lg bg-gradient-to-r ${card.gradient} text-white text-sm font-medium hover:shadow-lg hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 z-10 relative`}
                  >
                    <span>Open</span>
                    <ArrowRightIcon className="w-4 h-4 ml-2" />
                  </button>
                  
                  {/* Decorative Arrow */}
                  <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all duration-300" />
                </div>

                {/* Hover Effect Border */}
                <div className={`absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-gradient-to-r group-hover:${card.gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-300`} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <HomeIcon className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No Quick Actions Available</h3>
            <p className="text-gray-600">Your role permissions don't include any quick actions at the moment.</p>
          </div>
        )}
      </div>

      {/* Department Info */}
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Department</h3>
            <p className="text-gray-600">{userData?.department || department || 'Not specified'}</p>
          </div>
          <div className="text-right">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Role</h3>
            <div className="flex items-center justify-end">
              <span className="text-blue-600 font-medium capitalize">
                {userData?.role || role || 'User'}
              </span>
            </div>
          </div>
          <div className="text-right">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Status</h3>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
              <span className="text-green-600 font-medium">Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;