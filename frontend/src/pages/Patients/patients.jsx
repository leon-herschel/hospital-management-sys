import { useState, useEffect } from "react";
import { ref, onValue, remove } from "firebase/database";
import { database } from "../../firebase/firebase";
import QRCode from "react-qr-code";
import DeleteConfirmationModal from "./DeleteConfirmationModalPatient";
import { useAccessControl } from "../../components/roles/accessControl";
import AccessDenied from "../ErrorPages/AccessDenied";
import { useNavigate } from "react-router-dom";
import AddPatient from "./AddPatient";
import EditPatientModal from "./EditPatientModal";
import ViewPatient from "./ViewPatient";
import { getAuth } from "firebase/auth";

function Patient() {
  const [patientList, setPatientList] = useState([]);
  const [modal, setModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [currentPatient, setCurrentPatient] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [department, setDepartment] = useState("");
  const [role, setRole] = useState("");
  const permissions = useAccessControl();
  const navigate = useNavigate();

  // Fetch authenticated user's role & department
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
        }
      });
    }
  }, []);

  // Fetch patients from Firebase
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
            (patient) => patient.roomType === department
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
  }, [role, department]);

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

  if (!permissions?.accessPatients) {
    return <AccessDenied />;
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <input
          type="text"
          placeholder="Search by name"
          className="border border-slate-300 px-4 py-2 rounded-md"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        
      </div>

      <div className="relative overflow-x-auto rounded-md shadow-sm">
        <table className="w-full text-md text-gray-900 text-center border border-slate-200">
          <thead className="text-md bg-slate-200">
            <tr>
              <th className="px-6 py-3">First Name</th>
              <th className="px-6 py-3">Last Name</th>
              <th className="px-6 py-3">QR Code</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPatients.length > 0 ? (
              filteredPatients.map((patient) => (
                <tr key={patient.id} className="bg-white border-b hover:bg-slate-100">
                  <td className="px-6 py-3">{patient.firstName}</td>
                  <td className="px-6 py-3">{patient.lastName}</td>
                  <td className="px-6 py-3">
                    <QRCode value={patient.id} size={50} />
                  </td>
                  <td className="flex flex-col px-6 py-3 space-y-2 justify-center">
                    <button
                      onClick={() => handleViewClick(patient.id)}
                      className="ml-4 bg-purple-600 hover:bg-purple-700 text-white px-4 py-1 rounded-md"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleEdit(patient)}
                      className="ml-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded-md"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteConfirmation(patient)}
                      className="ml-4 bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded-md"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="px-6 py-3">
                  No Patients
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modal && <AddPatient isOpen={modal} toggleModal={toggleModal} />}
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
      />
    </div>
  );
}

export default Patient;
