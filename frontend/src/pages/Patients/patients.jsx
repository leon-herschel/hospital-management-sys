import React, { useState, useEffect } from "react";
import { ref, onValue, remove, update } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";
import { database, auth } from "../../firebase/firebase";
import QRCode from "react-qr-code";
import { Users, Eye, Edit, Trash2, Plus, Search, UserCheck, Building, Shield, Filter, AlertTriangle, TrendingUp, Clock } from 'lucide-react';
import { useAccessControl } from "../../components/roles/accessControl";
import AccessDenied from "../ErrorPages/AccessDenied";
import { useNavigate } from "react-router-dom";
import AddPatient from "./AddPatient";
import EditPatientModal from "./EditPatientModal";
import ViewPatient from "./ViewPatient";
import DeleteConfirmationModal from "./DeleteConfirmationModalPatient";
import UserAddPatient from "./UserAddPatient";

function PatientVisualDashboard() {
  const [patientList, setPatientList] = useState([]);
  const [clinics, setClinics] = useState({});
  const [userProfile, setUserProfile] = useState(null);
  const [modal, setModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [currentPatient, setCurrentPatient] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewType, setViewType] = useState("cards");
  
  // Role-based access control states
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [selectedClinicFilter, setSelectedClinicFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const [ageRangeFilter, setAgeRangeFilter] = useState("all");
  const [showUserAddPatient, setShowUserAddPatient] = useState(false);

  const permissions = useAccessControl();
  const navigate = useNavigate();

  // Check if user has admin privileges
  const isAdminUser = () => {
    return userProfile && (userProfile.role === 'admin' || userProfile.role === 'superadmin');
  };

  // Get user's clinic ID from clinicAffiliation
  const getUserClinicId = () => {
    return userProfile?.clinicAffiliation;
  };

  // Helper function to get all clinic IDs a patient has visited
  const getPatientVisitedClinics = (patient) => {
    if (!patient.clinicsVisited) return [];
    return Object.keys(patient.clinicsVisited);
  };

  // Helper function to check if patient has visited user's clinic
  const hasPatientVisitedUserClinic = (patient) => {
    const userClinicId = getUserClinicId();
    if (!userClinicId || !patient.clinicsVisited) return false;
    return Object.keys(patient.clinicsVisited).includes(userClinicId);
  };

  const toggleModal = () => setModal(!modal);
  const toggleEditModal = () => setEditModal(!editModal);
  const toggleDeleteModal = () => setDeleteModal(!deleteModal);

  const handleDeleteConfirmation = (patient) => {
    setCurrentPatient(patient);
    toggleDeleteModal();
  };

  const handleDelete = async () => {
    if (currentPatient) {
      await remove(ref(database, `patients/${currentPatient.id}`));
      toggleDeleteModal();
    }
  };

  const handleEdit = (patient) => {
    setCurrentPatient(patient);
    toggleEditModal();
  };

  const handleViewClick = (id) => {
    navigate(`/patients/${id}`);
  };

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });

    // Load user profile when currentUser changes
    if (currentUser) {
      const userProfileRef = ref(database, `users/${currentUser.uid}`);
      const unsubscribeUserProfile = onValue(userProfileRef, (snapshot) => {
        const userData = snapshot.val();
        setUserProfile(userData);
      });

      return () => {
        unsubscribeAuth();
        unsubscribeUserProfile();
      };
    }

    return () => {
      unsubscribeAuth();
    };
  }, [currentUser]);

  useEffect(() => {
    if (!userProfile) return;

    // Load clinics data for admin users
    const clinicsRef = ref(database, "clinics");
    const unsubscribeClinics = onValue(clinicsRef, (snapshot) => {
      const data = snapshot.val() || {};
      setClinics(data);
    });

    // Load patients based on user role
    const patientRef = ref(database, "patients");
    const unsubscribePatients = onValue(patientRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const allPatients = Object.entries(data).map(([id, details]) => ({
          id,
          ...details,
        }));

        let filteredPatients = [];

        // Apply role-based filtering based on clinicsVisited
        if (isAdminUser()) {
          // Admin users see all patients
          filteredPatients = allPatients;
        } else {
          // Regular users only see patients who have visited their affiliated clinic
          filteredPatients = allPatients.filter((patient) => 
            hasPatientVisitedUserClinic(patient)
          );
        }

        // Sort by first name
        filteredPatients.sort((a, b) =>
          (a.firstName || "").localeCompare(b.firstName || "")
        );

        setPatientList(filteredPatients);
      } else {
        setPatientList([]);
      }
    });

    return () => {
      unsubscribeClinics();
      unsubscribePatients();
    };
  }, [userProfile]);

  // Enhanced filtering with role-based access and categorization
  const filteredPatients = patientList.filter((patient) => {
    const firstName = (patient.firstName || "").toLowerCase();
    const lastName = (patient.lastName || "").toLowerCase();
    const fullName = `${firstName} ${lastName}`;
    const matchesSearch = fullName.includes(searchQuery.toLowerCase());

    // Clinic filter (only for admins) - check if patient has visited selected clinic
    const matchesClinicFilter = selectedClinicFilter === "all" || 
      (patient.clinicsVisited && Object.keys(patient.clinicsVisited).includes(selectedClinicFilter));
    
    // Gender filter
    const matchesGenderFilter = genderFilter === "all" || patient.gender === genderFilter;

    return matchesSearch && matchesClinicFilter && matchesGenderFilter;
  });

  // Group patients by clinics they've visited for better visualization
  const patientsByClinic = filteredPatients.reduce((acc, patient) => {
    if (!patient.clinicsVisited || Object.keys(patient.clinicsVisited).length === 0) {
      // Patients who haven't visited any clinic
      if (!acc['New Patients']) acc['New Patients'] = [];
      acc['New Patients'].push(patient);
    } else {
      // Add patient to each clinic they've visited
      Object.keys(patient.clinicsVisited).forEach(clinicId => {
        const clinicName = clinics[clinicId]?.name || clinicId;
        if (!acc[clinicName]) acc[clinicName] = [];
        // Avoid duplicates
        if (!acc[clinicName].find(p => p.id === patient.id)) {
          acc[clinicName].push(patient);
        }
      });
    }
    return acc;
  }, {});

  // Statistics
  const totalPatients = filteredPatients.length;
  const clinicsCount = Object.keys(patientsByClinic).length;
  
  // Get unique clinics from all patients' visits
  const allVisitedClinics = new Set();
  filteredPatients.forEach(patient => {
    if (patient.clinicsVisited) {
      Object.keys(patient.clinicsVisited).forEach(clinicId => {
        allVisitedClinics.add(clinicId);
      });
    }
  });
  const uniqueClinics = isAdminUser() ? allVisitedClinics.size : 1;
  
  const genderDistribution = filteredPatients.reduce((acc, patient) => {
    const gender = patient.gender || 'Unknown';
    acc[gender] = (acc[gender] || 0) + 1;
    return acc;
  }, {});

  // Calculate total visits across all patients
  const totalVisits = filteredPatients.reduce((acc, patient) => {
    if (patient.clinicsVisited) {
      Object.values(patient.clinicsVisited).forEach(clinicVisit => {
        acc += clinicVisit.totalVisits || 0;
      });
    }
    return acc;
  }, 0);

  // Show loading state while checking auth
  if (authLoading || !userProfile) {
    return (
      <div className="w-full flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading user profile...</p>
        </div>
      </div>
    );
  }

  // Show login required message if not authenticated
  if (!currentUser) {
    return (
      <div className="w-full flex items-center justify-center min-h-screen">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-4">Please log in to access the patient dashboard.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  // Check permissions
  if (!permissions?.accessPatients) {
    return <AccessDenied />;
  }

  return (
    <div className="w-full p-6 bg-gray-50 min-h-screen">
      {/* Header with Role Badge */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
        <div className="flex items-center gap-4">
          <h2 className="text-3xl font-bold text-gray-800">
            {isAdminUser() ? 'Multi-Clinic' : 'Clinic'} Patient Management Dashboard
          </h2>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
            isAdminUser() ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
          }`}>
            {isAdminUser() ? <Shield className="w-4 h-4" /> : <Users className="w-4 h-4" />}
            {userProfile?.role || 'user'}
          </div>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <button
      onClick={() => setShowUserAddPatient(true)}
      className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-2 rounded-lg transition-all duration-200 font-medium shadow-lg"
    >
      <Plus className="w-4 h-4" />
      Add Patient
    </button>
          <button
            onClick={() => setViewType('cards')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              viewType === 'cards' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border'
            }`}
          >
            Cards View
          </button>
          <button
            onClick={() => setViewType('table')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              viewType === 'table' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border'
            }`}
          >
            Table View
          </button>
        </div>
      </div>

      {/* Enhanced Search and Filters */}
      <div className="bg-white p-6 rounded-xl shadow-lg mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-800">Filters & Search</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by name..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Clinic Filter (Only for Admins) */}
          {isAdminUser() && (
            <select
              value={selectedClinicFilter}
              onChange={(e) => setSelectedClinicFilter(e.target.value)}
              className="border px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Clinics</option>
              {Object.entries(clinics).map(([id, clinic]) => (
                <option key={id} value={id}>
                  {clinic.name || id}
                </option>
              ))}
            </select>
          )}

          {/* Gender Filter */}
          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
            className="border px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {/* Enhanced Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
  <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
    <div className="flex items-center justify-between mb-4">
      <div>
        <p className="text-sm font-medium text-gray-600">Total Patients</p>
        <p className="text-2xl font-bold text-gray-900">{totalPatients}</p>
      </div>
      <Users className="w-8 h-8 text-blue-500" />
    </div>
    
    {/* Gender breakdown */}
    <div className="flex justify-between items-center pt-3 border-t border-gray-100">
      <div className="flex items-center space-x-2">
        <UserCheck className="w-4 h-4 text-purple-500" />
        <span className="text-sm text-gray-600">Male:</span>
        <span className="text-sm font-semibold text-gray-900">{genderDistribution.Male || 0}</span>
      </div>
      <div className="flex items-center space-x-2">
        <TrendingUp className="w-4 h-4 text-pink-500" />
        <span className="text-sm text-gray-600">Female:</span>
        <span className="text-sm font-semibold text-gray-900">{genderDistribution.Female || 0}</span>
      </div>
    </div>
  </div>
  
  {/* You can add other cards here if needed */}
  
</div>
      {/* Main Content */}
      {viewType === 'cards' ? (
        <div className="space-y-6">
          {Object.entries(patientsByClinic).map(([clinicName, patients]) => (
            <div key={clinicName} className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Building className="w-5 h-5 text-blue-500" />
                {clinicName} ({patients.length} patients)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {patients.map((patient) => {
                  const visitedClinics = getPatientVisitedClinics(patient);
                  const totalPatientVisits = visitedClinics.reduce((acc, clinicId) => {
                    return acc + (patient.clinicsVisited[clinicId]?.totalVisits || 0);
                  }, 0);

                  return (
                    <div
                      key={patient.id}
                      className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg border border-blue-200 p-4 transition-transform hover:scale-105"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-gray-800">
                            {patient.firstName} {patient.lastName}
                          </h4>
                          <p className="text-sm text-gray-600">DOB: {patient.dateOfBirth}</p>
                          {patient.age && <p className="text-sm text-gray-600">Age: {patient.age}</p>}
                        </div>
                        <QRCode value={patient.id} size={40} />
                      </div>

                      <div className="space-y-1 mb-4">
                        {patient.contactNumber && <p className="text-xs text-gray-600">📱 {patient.contactNumber}</p>}
                        {patient.email && <p className="text-xs text-gray-600">✉️ {patient.email}</p>}
                        {patient.gender && <p className="text-xs text-gray-600">👤 {patient.gender}</p>}
                        <p className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                          📊 Total Visits: {totalPatientVisits}
                        </p>
                        {isAdminUser() && visitedClinics.length > 0 && (
                          <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                            🏥 Visited: {visitedClinics.length} clinic{visitedClinics.length > 1 ? 's' : ''}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-1">
                        <button
                          onClick={() => handleViewClick(patient.id)}
                          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded text-xs flex items-center justify-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          View
                        </button>
                        <button
                          onClick={() => handleEdit(patient)}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs flex items-center justify-center gap-1"
                        >
                          <Edit className="w-3 h-3" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteConfirmation(patient)}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs flex items-center justify-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          
          {filteredPatients.length === 0 && (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No Patients Found</h3>
              <p className="text-gray-500">Try adjusting your search criteria or filters</p>
            </div>
          )}
        </div>
      ) : (
        // Enhanced Table View
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-md text-gray-900">
              <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold">Patient Info</th>
                  <th className="px-6 py-4 text-left font-semibold">Contact</th>
                  {isAdminUser() && <th className="px-6 py-4 text-left font-semibold">Clinics Visited</th>}
                  <th className="px-6 py-4 text-center font-semibold">Visits</th>
                  <th className="px-6 py-4 text-center font-semibold">QR Code</th>
                  <th className="px-6 py-4 text-center font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPatients.length > 0 ? (
                  filteredPatients.map((patient, index) => {
                    const visitedClinics = getPatientVisitedClinics(patient);
                    const totalPatientVisits = visitedClinics.reduce((acc, clinicId) => {
                      return acc + (patient.clinicsVisited[clinicId]?.totalVisits || 0);
                    }, 0);

                    return (
                      <tr
                        key={patient.id}
                        className={`${
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                        } hover:bg-blue-50 transition-colors`}
                      >
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-semibold text-gray-900">
                              {patient.firstName} {patient.lastName}
                            </div>
                            <div className="text-sm text-gray-600">ID: {patient.id}</div>
                            <div className="text-sm text-gray-500">
                              DOB: {patient.dateOfBirth}
                              {patient.age && ` (Age: ${patient.age})`}
                            </div>
                            {patient.gender && (
                              <div className="text-xs text-gray-500">Gender: {patient.gender}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm space-y-1">
                            {patient.contactNumber && <div className="text-gray-900">📱 {patient.contactNumber}</div>}
                            {patient.phone && <div className="text-gray-900">📱 {patient.phone}</div>}
                            {patient.email && <div className="text-gray-600">✉️ {patient.email}</div>}
                            {patient.address && <div className="text-gray-500">🏠 {patient.address}</div>}
                          </div>
                        </td>
                        {isAdminUser() && (
                          <td className="px-6 py-4">
                            <div className="text-sm space-y-1">
                              {visitedClinics.length > 0 ? (
                                visitedClinics.map((clinicId) => (
                                  <div key={clinicId} className="bg-blue-50 px-2 py-1 rounded text-xs">
                                    <div className="font-medium text-gray-900">
                                      {clinics[clinicId]?.name || 'Unknown Clinic'}
                                    </div>
                                    <div className="text-gray-500">
                                      Visits: {patient.clinicsVisited[clinicId]?.totalVisits || 0}
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="text-gray-400 italic">No clinic visits</div>
                              )}
                            </div>
                          </td>
                        )}
                        <td className="px-6 py-4 text-center">
                          <div className="text-lg font-bold text-green-600">{totalPatientVisits}</div>
                          <div className="text-xs text-gray-500">
                            {visitedClinics.length} clinic{visitedClinics.length !== 1 ? 's' : ''}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center">
                            <QRCode value={patient.id} size={50} />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col space-y-2">
                            <button
                              onClick={() => handleViewClick(patient.id)}
                              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm flex items-center justify-center gap-1"
                            >
                              <Eye className="w-3 h-3" />
                              View
                            </button>
                            <button
                              onClick={() => handleEdit(patient)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm flex items-center justify-center gap-1"
                            >
                              <Edit className="w-3 h-3" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteConfirmation(patient)}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm flex items-center justify-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={isAdminUser() ? "6" : "5"} className="px-6 py-8 text-center text-gray-500">
                      <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <div className="font-medium">No Patients Found</div>
                      <div className="text-sm">Try adjusting your search criteria or filters</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}<UserAddPatient 
  showModal={showUserAddPatient}
  setShowModal={setShowUserAddPatient}
  userClinicId={isAdminUser() ? null : getUserClinicId()}
  isAdminUser={isAdminUser()}
/>
      {modal && (
        <AddPatient 
          isOpen={modal} 
          toggleModal={toggleModal}
          userClinicId={isAdminUser() ? null : getUserClinicId()}
          isAdminUser={isAdminUser()}
        />
      )}
      
      <DeleteConfirmationModal
        isOpen={deleteModal}
        toggleModal={toggleDeleteModal}
        onConfirm={handleDelete}
      />
      
      <EditPatientModal
        isOpen={editModal}
        toggleModal={toggleEditModal}
        currentPatient={currentPatient}
        handleUpdate={(updated) =>
          update(ref(database, `patients/${currentPatient.id}`), updated)
        }
        isAdminUser={isAdminUser()}
      />
    </div>
  );
}

export default PatientVisualDashboard;