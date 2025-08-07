import React, { useState, useEffect } from "react";
import { ref, onValue, remove, update } from "firebase/database";
import { database } from "../../firebase/firebase";
import QRCode from "react-qr-code";
import { Users, Eye, Edit, Trash2, Plus, Search, UserCheck, Building } from 'lucide-react';
import { useAccessControl } from "../../components/roles/accessControl";
import AccessDenied from "../ErrorPages/AccessDenied";
import { useNavigate } from "react-router-dom";
import AddPatient from "./AddPatient";
import EditPatientModal from "./EditPatientModal";
import ViewPatient from "./ViewPatient";
import { getAuth } from "firebase/auth";
import DeleteConfirmationModal from "./DeleteConfirmationModalPatient";

function PatientVisualDashboard() {
  const [patientList, setPatientList] = useState([]);
  const [modal, setModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [currentPatient, setCurrentPatient] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [department, setDepartment] = useState("");
  const [role, setRole] = useState("");
  const [userClinicId, setUserClinicId] = useState("");
  const [viewType, setViewType] = useState("cards");

  const permissions = useAccessControl();
  const navigate = useNavigate();

  // Fetch authenticated user's info: role, department, clinic
  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      const userRef = ref(database, `users/${user.uid}`);
      onValue(userRef, (snapshot) => {
        const userData = snapshot.val();
        if (userData) {
          setDepartment(userData.department || "");
          setRole(userData.role || "");
          setUserClinicId(userData.clinicAffiliation || "");
        }
      });
    }
  }, []);

  // Fetch and filter patients
  useEffect(() => {
    const patientRef = ref(database, "patients");
    const unsubscribe = onValue(patientRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const allPatients = Object.entries(data).map(([id, details]) => ({
          id,
          ...details,
        }));

        let filteredPatients = [];

        if (role === "superadmin" || role === "admin") {
          filteredPatients = allPatients;
        } else {
          filteredPatients = allPatients.filter(
            (patient) => patient.clinicAffiliation === userClinicId
          );
        }

        filteredPatients.sort((a, b) =>
          (a.firstName || "").localeCompare(b.firstName || "")
        );

        setPatientList(filteredPatients);
      } else {
        setPatientList([]);
      }
    });

    return () => unsubscribe();
  }, [role, department, userClinicId]);

  // Your existing functions (simplified for demo)
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

  const filteredPatients = patientList.filter((patient) => {
    const firstName = (patient.firstName || "").toLowerCase();
    const lastName = (patient.lastName || "").toLowerCase();
    const fullName = `${firstName} ${lastName}`;
    return fullName.includes(searchQuery.toLowerCase());
  });

  // Check permissions
  if (!permissions?.accessPatients) {
    return <AccessDenied />;
  }

  // Group patients by clinic for better visualization
  const patientsByClinic = filteredPatients.reduce((acc, patient) => {
    const clinic = patient.clinicAffiliation || 'Unknown Clinic';
    if (!acc[clinic]) acc[clinic] = [];
    acc[clinic].push(patient);
    return acc;
  }, {});

  const totalPatients = filteredPatients.length;
  const clinicsCount = Object.keys(patientsByClinic).length;
  const recentPatients = filteredPatients.filter(patient => {
    // Since we don't have lastVisit in original data, we'll just show total patients
    return true;
  }).length;

  return (
    <div className="w-full p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
        <h2 className="text-3xl font-bold text-gray-800">Patient Management Dashboard</h2>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={toggleModal}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
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

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by name..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Patients</p>
              <p className="text-2xl font-bold text-gray-900">{totalPatients}</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Clinics</p>
              <p className="text-2xl font-bold text-gray-900">{clinicsCount}</p>
            </div>
            <Building className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Recent Visits</p>
              <p className="text-2xl font-bold text-gray-900">{recentPatients}</p>
            </div>
            <UserCheck className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      {viewType === 'cards' ? (
        <div className="space-y-6">
          {Object.entries(patientsByClinic).map(([clinic, patients]) => (
            <div key={clinic} className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Building className="w-5 h-5 text-blue-500" />
                {clinic} ({patients.length} patients)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {patients.map((patient) => (
                  <div
                    key={patient.id}
                    className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg border border-blue-200 p-4 transition-transform hover:scale-105"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-gray-800">
                          {patient.firstName} {patient.lastName}
                        </h4>
                        <p className="text-sm text-gray-600">ID: {patient.id}</p>
                      </div>
                      <QRCode value={patient.id} size={40} />
                    </div>

                    <div className="space-y-1 mb-4">
                      {patient.phone && <p className="text-xs text-gray-600">📱 {patient.phone}</p>}
                      {patient.email && <p className="text-xs text-gray-600">✉️ {patient.email}</p>}
                      {patient.age && <p className="text-xs text-gray-600">👤 Age: {patient.age}</p>}
                      <p className="text-xs text-gray-600">🏥 {patient.clinicAffiliation}</p>
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
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Table View (Enhanced version of your original)
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-md text-gray-900">
              <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold">Patient Info</th>
                  <th className="px-6 py-4 text-left font-semibold">Contact</th>
                  <th className="px-6 py-4 text-center font-semibold">QR Code</th>
                  <th className="px-6 py-4 text-center font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPatients.length > 0 ? (
                  filteredPatients.map((patient, index) => (
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
                          <div className="text-xs text-gray-500">Clinic: {patient.clinicAffiliation}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          {patient.phone && <div className="text-gray-900">📱 {patient.phone}</div>}
                          {patient.email && <div className="text-gray-600">✉️ {patient.email}</div>}
                          {patient.age && <div className="text-gray-500">👤 Age: {patient.age}</div>}
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
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                      <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <div className="font-medium">No Patients Found</div>
                      <div className="text-sm">Try adjusting your search criteria</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Patient Modal */}
      {modal && <AddPatient isOpen={modal} toggleModal={toggleModal} />}
      
      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal}
        toggleModal={toggleDeleteModal}
        onConfirm={handleDelete}
      />
      
      {/* Edit Patient Modal */}
      <EditPatientModal
        isOpen={editModal}
        toggleModal={toggleEditModal}
        currentPatient={currentPatient}
        handleUpdate={(updated) =>
          update(ref(database, `patients/${currentPatient.id}`), updated)
        }
      />
    </div>
  );
}

export default PatientVisualDashboard;