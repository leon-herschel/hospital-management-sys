import { useState, useEffect } from "react";
import { ref, get, set, push } from "firebase/database";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { EyeIcon, EyeSlashIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { auth, database } from "../../../firebase/firebase";
import UserAddRoleModal from "./userAddModal";
import AddDepartmentModal from "../Departments/AddDepartmentModal";
const AddUserModal = ({ showModal, setShowModal }) => {
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedClinic, setSelectedClinic] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Patient-specific states
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [bloodType, setBloodType] = useState("");
  const [allergies, setAllergies] = useState("");
  const [medicalConditions, setMedicalConditions] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyRelationship, setEmergencyRelationship] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [showAddDepartmentModal, setShowAddDepartmentModal] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      const currentUser = auth.currentUser;

      if (currentUser) {
        const userRef = ref(database, `users/${currentUser.uid}`);
        const userSnap = await get(userRef);
        const userData = userSnap.val();

        if (userData?.clinicAffiliation) {
          setSelectedClinic(userData.clinicAffiliation); // auto-fill clinic ID
        }
      }

      // Load all clinics
      const clinicSnap = await get(ref(database, "clinics"));
      if (clinicSnap.exists()) {
        const clinicList = Object.entries(clinicSnap.val()).map(
          ([id, data]) => ({
            id,
            name: data.name || id,
          })
        );
        setClinics(clinicList);
      }

      // Load roles
      const rolesSnap = await get(ref(database, "roles"));
      if (rolesSnap.exists()) setRoles(Object.keys(rolesSnap.val()));

      // Load departments
      const deptSnap = await get(ref(database, "departments"));
      if (deptSnap.exists()) setDepartments(Object.keys(deptSnap.val()));
    };

    fetchInitialData();
  }, []);

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setSelectedDepartment("");
    setSelectedClinic("");
    setSelectedRole("");
    setContactNumber("");
    setDateOfBirth("");
    setGender("");
    setBloodType("");
    setAllergies("");
    setMedicalConditions("");
    setEmergencyContactName("");
    setEmergencyRelationship("");
    setEmergencyPhone("");
    setError("");
  };

  const validatePassword = (password) => {
    return (
      password.length >= 6 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /\d/.test(password)
    );
  };

  const closeSuccessModal = () => {
    setSuccess(false);
    setShowModal(false);
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!validatePassword(password)) {
      setError(
        "Password must be at least 6 characters long, contain an uppercase letter, a lowercase letter, and a number."
      );
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const userId = userCredential.user.uid;

      const userRef = ref(database, `users/${userId}`);
      await set(userRef, {
        department:
          selectedRole === "patient" || selectedRole === "doctor"
            ? null
            : selectedDepartment,
        clinicAffiliation: selectedRole === "patient" ? null : selectedClinic,
        firstName,
        lastName,
        contactNumber,
        email,
        role: selectedRole,
        createdAt: new Date().toISOString(),
      });

      if (selectedRole === "doctor") {
        const doctorRef = push(ref(database, "doctors"));
        await set(doctorRef, {
          firstName,
          lastName,
          fullName: `Dr. ${firstName} ${lastName}`,
          specialty: 'Generalist',
          clinicAffiliations: [selectedClinic],
          contactNumber,
        });
      }

      if (selectedRole === "patient") {
        const patientRef = push(ref(database, "patients"));
        await set(patientRef, {
          firstName,
          lastName,
          dateOfBirth,
          gender,
          bloodType,
          contactNumber,
          allergies: allergies
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          medicalConditions: medicalConditions
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          emergencyContact: {
            name: emergencyContactName,
            relationship: emergencyRelationship,
            phone: emergencyPhone,
          },
          createdAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
        });
      }

      resetForm();
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!showModal) return null;

  const handleAddRole = async (newRole) => {
    const roleKey = Object.keys(newRole)[0];
    const roleData = newRole[roleKey];

    try {
      await set(ref(database, `roles/${roleKey}`), roleData); // ✅ Save full role object (name + permissions)
      setRoles((prevRoles) => [...new Set([...prevRoles, roleKey])]); // ✅ Update role list
      setSelectedRole(roleKey); // optional: auto-select the new role
    } catch (err) {
      console.error("Error adding role:", err);
    }
  };
  const handleAddDepartment = async (newDepartment) => {
    const deptKey = Object.keys(newDepartment)[0];
    const deptData = newDepartment[deptKey];

    try {
      await set(ref(database, `departments/${deptKey}`), deptData.permissions);
      setDepartments((prev) => [...new Set([...prev, deptKey])]); // Refresh departments dropdown
    } catch (err) {
      console.error("Error adding department:", err);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-md p-6 w-full max-w-lg max-h-screen overflow-y-auto shadow-lg relative">
          <button
            onClick={() => setShowModal(false)}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
          <h2 className="text-2xl font-bold mb-6">Create User Account</h2>
          <form onSubmit={handleCreateAccount}>
            <div className="mb-6 p-4 bg-gray-100 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4">User Information</h3>

              <label className="block mb-2">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="block w-full mb-4 p-2 border rounded-md"
              />

              <label className="block mb-2">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="block w-full mb-4 p-2 border rounded-md"
              />

              <label className="block mb-2">Contact Number</label>
              <input
                type="text"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                required
                className="block w-full mb-4 p-2 border rounded-md"
              />

              <label className="block mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="block w-full mb-4 p-2 border rounded-md"
              />

              <label className="block mb-2">Password</label>
              <div className="relative mb-4">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="block w-full p-2 border rounded-md"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>

              <label className="block mb-2">Confirm Password</label>
              <div className="relative mb-4">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="block w-full p-2 border rounded-md"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500"
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="mb-6 p-4 bg-gray-100 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4">Clinic & Role</h3>

              <label className="block mb-2 flex justify-between items-center">
                Select Role
                <button
                  type="button"
                  onClick={() => setShowAddRoleModal(true)}
                  className="ml-2 bg-blue-500 text-white px-2 py-1 text-xs rounded hover:bg-blue-600"
                >
                  +
                </button>
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                required
                className="block w-full mb-4 p-2 border rounded-md"
              >
                <option value="" disabled>
                  Select a role
                </option>
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>

              {selectedRole !== "patient" && (
                <>
                  <label className="block mb-2">Clinic Affiliation</label>
                  <select
                    value={selectedClinic}
                    onChange={(e) => setSelectedClinic(e.target.value)}
                    className="block w-full mb-4 p-2 border rounded-md"
                    disabled={selectedClinic !== ""} // disables if already filled
                  >
                    <option value="" disabled>
                      Select a clinic
                    </option>
                    {clinics.map((clinic) => (
                      <option key={clinic.id} value={clinic.id}>
                        {clinic.name}
                      </option>
                    ))}
                  </select>
                </>
              )}

              {selectedRole !== "patient" && selectedRole !== "doctor" && (
                <>
                  <label className="block mb-2 flex justify-between items-center">
                    Select Department
                    <button
                      type="button"
                      onClick={() => setShowAddDepartmentModal(true)}
                      className="ml-2 bg-blue-500 text-white px-2 py-1 text-xs rounded hover:bg-blue-600"
                    >
                      +
                    </button>
                  </label>
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="block w-full mb-4 p-2 border rounded-md"
                  >
                    <option value="" disabled>
                      Select a department
                    </option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </>
              )}
              <UserAddRoleModal
                showModal={showAddRoleModal}
                setShowModal={setShowAddRoleModal}
                onAddRole={handleAddRole}
              />

              <AddDepartmentModal
                showModal={showAddDepartmentModal}
                setShowModal={setShowAddDepartmentModal}
                onAddDepartment={handleAddDepartment}
              />
            </div>

            {selectedRole === "patient" && (
              <div className="mb-6 p-4 bg-gray-100 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-4">Patient Details</h3>

                <label className="block mb-2">Date of Birth</label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  required
                  className="block w-full mb-4 p-2 border rounded-md"
                />

                <label className="block mb-2">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  required
                  className="block w-full mb-4 p-2 border rounded-md"
                >
                  <option value="" disabled>
                    Select gender
                  </option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>

                <label className="block mb-2">Blood Type</label>
                <input
                  type="text"
                  value={bloodType}
                  onChange={(e) => setBloodType(e.target.value)}
                  className="block w-full mb-4 p-2 border rounded-md"
                />

                <label className="block mb-2">
                  Allergies (comma-separated)
                </label>
                <input
                  type="text"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  className="block w-full mb-4 p-2 border rounded-md"
                />

                <label className="block mb-2">
                  Medical Conditions (comma-separated)
                </label>
                <input
                  type="text"
                  value={medicalConditions}
                  onChange={(e) => setMedicalConditions(e.target.value)}
                  className="block w-full mb-4 p-2 border rounded-md"
                />

                <h4 className="text-md font-semibold mt-4 mb-2">
                  Emergency Contact
                </h4>
                <input
                  type="text"
                  placeholder="Name"
                  value={emergencyContactName}
                  onChange={(e) => setEmergencyContactName(e.target.value)}
                  className="block w-full mb-2 p-2 border rounded-md"
                />
                <input
                  type="text"
                  placeholder="Relationship"
                  value={emergencyRelationship}
                  onChange={(e) => setEmergencyRelationship(e.target.value)}
                  className="block w-full mb-2 p-2 border rounded-md"
                />
                <input
                  type="text"
                  placeholder="Phone"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  className="block w-full mb-4 p-2 border rounded-md"
                />
              </div>
            )}

            {error && <div className="text-red-500 mb-4">{error}</div>}

            <div className="flex justify-center">
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                disabled={isLoading}
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {success && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-md p-6 w-full max-w-md text-center shadow-lg">
            <h2 className="text-xl font-bold mb-4">
              Account Created Successfully!
            </h2>
            <p className="text-gray-700 mb-6">
              The user account has been created.
            </p>
            <button
              onClick={closeSuccessModal}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AddUserModal;
