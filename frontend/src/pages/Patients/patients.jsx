import { useState, useEffect } from "react";
import { ref, onValue, remove, update } from "firebase/database";
import { database } from "../../firebase/firebase";
import QRCode from "react-qr-code";
import DeleteConfirmationModal from "./DeleteConfirmationModalPatient";
import { useAccessControl } from "../../components/roles/accessControl";
import AccessDenied from "../ErrorPages/AccessDenied";
import { useNavigate } from "react-router-dom";
import AddPatient from "./AddPatient";
import EditPatientModal from "./EditPatientModal"; 
import { getAuth } from 'firebase/auth';

function Patient() {
  const [patientList, setPatientList] = useState([]);
  const [modal, setModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [currentPatient, setCurrentPatient] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [department, setDepartment] = useState(""); // This will store the user's department
  const [isAdmin, setIsAdmin] = useState(false); // Check if user is admin
  const permissions = useAccessControl();
  const navigate = useNavigate();
  

  // Fetch authenticated user and their department
  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (user) {
      // Fetch user's department from the database
      const userDepartmentRef = ref(database, `users/${user.uid}/department`);
      const userRoleRef = ref(database, `users/${user.uid}/role`); // Assuming there is a role field

      onValue(userDepartmentRef, (snapshot) => {
        const departmentData = snapshot.val();
        if (departmentData) {
          setDepartment(departmentData); // Set department based on user
        }
      });

      // Fetch user's role
      onValue(userRoleRef, (snapshot) => {
        const permissions = snapshot.val();
        if (permissions && permissions === "Admin") {
          setIsAdmin(true); // Set isAdmin to true if the user is an admin
        }
      });
    }
  }, []);

  // Fetch patient data based on department or show all if admin
  useEffect(() => {
    const patientCollection = ref(database, `patient`); // Fetch all patients
    const unsubscribe = onValue(patientCollection, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const filteredPatients = Object.keys(data)
          .map((key) => ({
            id: key,
            ...data[key],
          }))
          .filter((patient) => isAdmin || patient.roomType === department); // Show all if admin, else filter by room type

        // Sort patients by first name
        filteredPatients.sort((a, b) => {
          const nameA = a.firstName ? String(a.firstName).toLowerCase() : '';
          const nameB = b.firstName ? String(b.firstName).toLowerCase() : '';
          return nameA.localeCompare(nameB);
        });

        setPatientList(filteredPatients);
      } else {
        setPatientList([]);
      }
    });
    return () => {
      unsubscribe();
    };
  }, [isAdmin, department]);

  const toggleModal = () => {
    setModal(!modal);
  };

  const toggleEditModal = () => {
    setEditModal(!editModal);
  };

  const toggleDeleteModal = () => {
    setDeleteModal(!deleteModal);
  };

  const handleDeleteConfirmation = (patient) => {
    setCurrentPatient(patient);
    toggleDeleteModal();
  };

  const handleDelete = async () => {
    if (currentPatient) {
      await remove(ref(database, `patient/${currentPatient.id}`));
      toggleDeleteModal();
    }
  };

  const handleEdit = (patient) => {
    setCurrentPatient(patient);
    toggleEditModal();
  };

  const handleUpdate = async (updatedPatient) => {
    await update(ref(database, `patient/${currentPatient.id}`), updatedPatient);
    toggleEditModal();
  };

  const handleViewClick = (id) => {
    navigate(`/patients/${id}`); 
  };

  const filteredPatients = patientList.filter((patient) => {
    const firstName = patient.firstName ? patient.firstName.toLowerCase() : '';
    const lastName = patient.lastName ? patient.lastName.toLowerCase() : '';
    const fullName = `${firstName} ${lastName}`.trim();
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
        <button
          onClick={toggleModal}
          className="ml-auto bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md"
        >
          Add Patient
        </button>
      </div>

      <div className="relative overflow-x-auto rounded-md shadow-sm">
        <table className="w-full text-md text-gray-900 text-center border border-slate-200">
          <thead className="text-md bg-slate-200">
            <tr>
              <th className="px-6 py-3">First Name</th>
              <th className="px-6 py-3">Last Name</th>
              <th className="px-6 py-3">Date of Birth</th>
              <th className="px-6 py-3">Age</th>
              <th className="px-6 py-3">Gender</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Contact</th>
              <th className="px-6 py-3">Type of Room</th>
              <th className="px-6 py-3">QR Code</th>
              <th className="px-6 py-3">Date and Time Created</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPatients.length > 0 ? (
              filteredPatients.map((patient) => (
                <tr key={patient.id} className="bg-white border-b hover:bg-slate-100">
                  <td className="px-6 py-3">{patient.firstName}</td>
                  <td className="px-6 py-3">{patient.lastName}</td>
                  <td className="px-6 py-3">{patient.birth}</td>
                  <td className="px-6 py-3">{patient.age}</td>
                  <td className="px-6 py-3">{patient.gender}</td>
                  <td className="px-6 py-3">{patient.status}</td>
                  <td className="px-6 py-3">{patient.contact}</td>
                  <td className="px-6 py-3">{patient.roomType}</td>
                  <td className="px-6 py-3">
                    <QRCode size={50} bgColor="white" fgColor="black" value={patient.id} />
                  </td>
                  <td className="px-6 py-3">{new Date(patient.dateTime).toLocaleString()}</td>
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
                <td colSpan="10" className="px-6 py-3">
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
        handleUpdate={handleUpdate}
      />
    </div>
  );
}

export default Patient;
