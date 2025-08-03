import { useState, useEffect } from "react";
import { ref, get, set, push } from "firebase/database";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { EyeIcon, EyeSlashIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { auth, database } from "../../../firebase/firebase";

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

  // Email sending states
  const [emailStatus, setEmailStatus] = useState("");
  const [isEmailLoading, setIsEmailLoading] = useState(false);

  // Patient-specific states
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [bloodType, setBloodType] = useState("");
  const [allergies, setAllergies] = useState("");
  const [medicalConditions, setMedicalConditions] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyRelationship, setEmergencyRelationship] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");

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
    setEmailStatus("");
  };

  const validatePassword = (password) => {
    return (
      password.length >= 6 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /\d/.test(password)
    );
  };

  // Function to send welcome email
  const sendWelcomeEmail = async (userEmail, userPassword, userRole) => {
    setIsEmailLoading(true);
    setEmailStatus("Sending welcome email...");

    let response;
    try {
      response = await fetch("http://localhost:5000/add-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userEmail,
          password: userPassword,
          role: userRole,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setEmailStatus("Welcome email sent successfully!");
      } else {
        let errorMessage = "Unknown error";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || "Unknown error";
        } catch (jsonError) {
          errorMessage = `Server error (${response.status})`;
        }
        setEmailStatus(`Email sending failed: ${errorMessage}`);
      }
    } catch (error) {
      console.error("Email sending error:", error);
      // Check if it's a network error vs server error
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        setEmailStatus(
          "Failed to connect to email service. Please check if the server is running."
        );
      } else if (response && !response.ok) {
        setEmailStatus(
          `Email service error: ${response.status} ${response.statusText}`
        );
      } else {
        setEmailStatus(
          "Failed to send welcome email. Please check your connection."
        );
      }
    } finally {
      setIsEmailLoading(false);
    }
  };

  const closeSuccessModal = () => {
    setSuccess(false);
    setShowModal(false);
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setEmailStatus("");

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
          isGeneralist: true,
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

      // Send welcome email after successful account creation (optional)
      try {
        await sendWelcomeEmail(email, password, selectedRole);
      } catch (emailError) {
        console.warn(
          "Email sending failed, but account was created successfully:",
          emailError
        );
        setEmailStatus(
          "Account created successfully, but welcome email could not be sent."
        );
      }

      setSuccess(true);
      resetForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!showModal) return null;

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

              <label className="block mb-2">Select Role</label>
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
                  <label className="block mb-2">Select Department</label>
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

            {/* Email status display */}
            {emailStatus && (
              <div
                className={`mb-4 p-3 rounded-md ${
                  emailStatus.includes("successfully")
                    ? "bg-green-100 text-green-700 border border-green-300"
                    : emailStatus.includes("Failed") ||
                      emailStatus.includes("failed")
                    ? "bg-red-100 text-red-700 border border-red-300"
                    : "bg-blue-100 text-blue-700 border border-blue-300"
                }`}
              >
                {isEmailLoading && (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    <span>{emailStatus}</span>
                  </div>
                )}
                {!isEmailLoading && <span>{emailStatus}</span>}
              </div>
            )}

            <div className="flex justify-center">
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
                disabled={isLoading || isEmailLoading}
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
            <p className="text-gray-700 mb-4">
              The user account has been created.
            </p>
            {emailStatus && (
              <p
                className={`text-sm mb-4 ${
                  emailStatus.includes("successfully")
                    ? "text-green-600"
                    : "text-orange-600"
                }`}
              >
                📧 {emailStatus}
              </p>
            )}
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
