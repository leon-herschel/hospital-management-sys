import { useState } from "react";
import { ref, set } from "firebase/database";
import { createUserWithEmailAndPassword, getAuth } from "firebase/auth";
import { initializeApp } from "firebase/app";
import { EyeIcon, EyeSlashIcon, XMarkIcon, CheckIcon, XMarkIcon as XIcon } from "@heroicons/react/24/solid";
import { auth, database } from "../../firebase/firebase";
import { firebaseConfig } from "../../firebase/firebase";
import UserAddPatientSuccessModal from "./UserAddPatientSuccessModal";


const UserAddPatient = ({ showModal, setShowModal, userClinicId, isAdminUser }) => {
  // Personal Information

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Patient-specific fields
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [address, setAddress] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [bloodType, setBloodType] = useState("");
  const [allergies, setAllergies] = useState("");
  const [medicalConditions, setMedicalConditions] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyRelationship, setEmergencyRelationship] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  
  // Form states
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Email sending states
  const [emailStatus, setEmailStatus] = useState("");
  const [isEmailLoading, setIsEmailLoading] = useState(false);

  // Initialize secondary app for user creation
  const secondaryApp = initializeApp(firebaseConfig, "Secondary");
  const secondaryAuth = getAuth(secondaryApp);

  // Password validation checklist
  const getPasswordValidation = (password) => {
    return {
      length: password.length >= 6,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password)
    };
  };

  const passwordChecks = getPasswordValidation(password);
  const isPasswordValid = Object.values(passwordChecks).every(Boolean);

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setDateOfBirth("");
    setGender("");
    setAddress("");
    setContactNumber("");
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
  const sendWelcomeEmail = async (userEmail, userPassword) => {
    setIsEmailLoading(true);
    setEmailStatus("Sending welcome email...");

    try {
      const response = await fetch("http://localhost:5000/add-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userEmail,
          password: userPassword,
          role: "patient",
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

      if (error.name === "TypeError" && error.message.includes("fetch")) {
        setEmailStatus(
          "Email service unavailable. Account created successfully without email notification."
        );
      } else {
        setEmailStatus(
          "Failed to send welcome email. Account was created successfully."
        );
      }
    } finally {
      setIsEmailLoading(false);
    }
  };

  const closeSuccessModal = () => {
    console.log("Closing success modal");
    setSuccess(false);
    setShowModal(false);
    resetForm(); // Reset form when closing success modal
  };

  const handleCreatePatientAccount = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(""); // Clear any previous errors
    setEmailStatus("");

    console.log("Starting patient account creation process");

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
      // Store the current user before creating new account
      const currentUser = auth.currentUser;
      console.log("Current user:", currentUser?.email);
      
      // Create user account in Firebase Auth
      console.log("Creating user account with email:", email);
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        email,
        password
      );
      const userId = userCredential.user.uid;
      const patientId = userId;
      console.log("User created with UID:", userId);

      // Sign out secondary auth (but keep admin logged in)
      await secondaryAuth.signOut();

      // Create user record in database
      console.log("Creating user record in database");
      const userRef = ref(database, `users/${userId}`);
      await set(userRef, {
        patientId: patientId,
        firstName,
        lastName,
        contactNumber,
        email,
        role: "patient",
        department: null,
        clinicAffiliation: null,
        createdAt: new Date().toISOString(),
      });

      // Create patient record using the same UID
      console.log("Creating patient record in database");
      const patientRef = ref(database, `patients/${userId}`);
      await set(patientRef, {
        patientId: patientId,
        firstName,
        lastName,
        dateOfBirth,
        gender,
        address,
        contactNumber,
        bloodType,
        email,
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
        // Initialize clinic visits structure
        clinicsVisited: {},
      });

      console.log("Database records created successfully");

      // Send welcome email after successful account creation
      try {
        await sendWelcomeEmail(email, password);
      } catch (emailError) {
        console.warn(
          "Email sending failed, but account was created successfully:",
          emailError
        );
        setEmailStatus(
          "Account created successfully, but welcome email could not be sent."
        );
      }

      console.log("Account creation successful, setting success to true");
      
      // Add a small delay to ensure all state updates are processed
      setTimeout(() => {
        setSuccess(true);
        console.log("Success state set to true");
      }, 100);

    } catch (err) {
      console.error("Account creation error:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Early return for when modal is not shown and success is false
  if (!showModal && !success) {
    return null;
  }

  // Prepare patient data for the success modal
  const patientData = {
    firstName,
    lastName,
    email
  };

  // If success is true, only show the success modal
  if (success) {
    return (
      <UserAddPatientSuccessModal
        isVisible={success}
        onClose={closeSuccessModal}
        patientData={patientData}
        emailStatus={emailStatus}
      />
    );
  }

  // Main modal content
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-700 px-8 py-6 relative">
          <button
            onClick={() => setShowModal(false)}
            className="absolute top-6 right-6 text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition-all duration-200"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
          <h2 className="text-2xl font-bold text-white">Add New Patient</h2>
          <p className="text-green-100 mt-1">Create a patient account with login credentials</p>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <form onSubmit={handleCreatePatientAccount} className="p-8 space-y-8">
            
            {/* Personal Information Section */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                <div className="w-2 h-6 bg-green-600 rounded-full mr-3"></div>
                Personal Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white"
                    placeholder="Enter first name"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white"
                    placeholder="Enter last name"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white"
                    placeholder="Enter email address"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Contact Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white"
                    placeholder="Enter contact number"
                  />
                </div>
              </div>

              {/* Password Section with Checklist */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white"
                      placeholder="Enter password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  
                  {/* Password Checklist */}
                  {password && (
                    <div className="mt-3 p-4 bg-white rounded-lg border border-gray-200">
                      <p className="text-sm font-medium text-gray-700 mb-2">Password Requirements:</p>
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          {passwordChecks.length ? (
                            <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                          ) : (
                            <XIcon className="h-4 w-4 text-red-500 mr-2" />
                          )}
                          <span className={passwordChecks.length ? 'text-green-700' : 'text-red-700'}>
                            At least 6 characters
                          </span>
                        </div>
                        <div className="flex items-center text-sm">
                          {passwordChecks.uppercase ? (
                            <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                          ) : (
                            <XIcon className="h-4 w-4 text-red-500 mr-2" />
                          )}
                          <span className={passwordChecks.uppercase ? 'text-green-700' : 'text-red-700'}>
                            One uppercase letter
                          </span>
                        </div>
                        <div className="flex items-center text-sm">
                          {passwordChecks.lowercase ? (
                            <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                          ) : (
                            <XIcon className="h-4 w-4 text-red-500 mr-2" />
                          )}
                          <span className={passwordChecks.lowercase ? 'text-green-700' : 'text-red-700'}>
                            One lowercase letter
                          </span>
                        </div>
                        <div className="flex items-center text-sm">
                          {passwordChecks.number ? (
                            <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                          ) : (
                            <XIcon className="h-4 w-4 text-red-500 mr-2" />
                          )}
                          <span className={passwordChecks.number ? 'text-green-700' : 'text-red-700'}>
                            One number
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white"
                      placeholder="Confirm password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      {showConfirmPassword ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-sm text-red-600 mt-1">Passwords do not match</p>
                  )}
                </div>
              </div>
            </div>

            {/* Patient Medical Information */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
              <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                <div className="w-2 h-6 bg-emerald-600 rounded-full mr-3"></div>
                Medical Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Date of Birth <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white"
                    placeholder="Enter complete address"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Blood Type
                  </label>
                  <select
                    value={bloodType}
                    onChange={(e) => setBloodType(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white"
                  >
                    <option value="">Select Blood Type</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="Unknown">Unknown</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Allergies
                  </label>
                  <input
                    type="text"
                    value={allergies}
                    onChange={(e) => setAllergies(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white"
                    placeholder="Enter allergies (comma separated)"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Medical Conditions
                  </label>
                  <textarea
                    value={medicalConditions}
                    onChange={(e) => setMedicalConditions(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white"
                    placeholder="Enter medical conditions (comma separated)"
                  />
                </div>
              </div>
            </div>

            {/* Emergency Contact Information */}
            <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-6 border border-red-200">
              <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                <div className="w-2 h-6 bg-red-600 rounded-full mr-3"></div>
                Emergency Contact
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Contact Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={emergencyContactName}
                    onChange={(e) => setEmergencyContactName(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white"
                    placeholder="Emergency contact name"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Relationship <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={emergencyRelationship}
                    onChange={(e) => setEmergencyRelationship(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white"
                    placeholder="Relationship (e.g., spouse, parent)"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white"
                    placeholder="Emergency contact phone"
                  />
                </div>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <XIcon className="h-5 w-5 text-red-500 mr-2" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* Email Status Display */}
            {emailStatus && (
              <div
                className={`rounded-lg p-4 border ${
                  emailStatus.includes("successfully")
                    ? "bg-green-50 text-green-700 border-green-200"
                    : emailStatus.includes("Failed") || emailStatus.includes("failed")
                    ? "bg-red-50 text-red-700 border-red-200"
                    : "bg-blue-50 text-blue-700 border-blue-200"
                }`}
              >
                {isEmailLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-3"></div>
                    <span className="text-sm">{emailStatus}</span>
                  </div>
                ) : (
                  <div className="flex items-center">
                    {emailStatus.includes("successfully") ? (
                      <CheckIcon className="h-5 w-5 mr-2" />
                    ) : (
                      <XIcon className="h-5 w-5 mr-2" />
                    )}
                    <span className="text-sm">{emailStatus}</span>
                  </div>
                )}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end pt-6 border-t border-gray-200">
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  disabled={isLoading || isEmailLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating Patient Account...
                    </>
                  ) : (
                    "Create Patient Account"
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserAddPatient;