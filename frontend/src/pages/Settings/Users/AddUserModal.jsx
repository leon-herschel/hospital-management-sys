import { useState, useEffect } from "react";
import { ref, get, set } from "firebase/database";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { EyeIcon, EyeSlashIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { auth, database } from "../../../firebase/firebase";

const AddUserModal = ({ showModal, setShowModal }) => {
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const rolesRef = ref(database, "roles");
    get(rolesRef).then((snapshot) => {
      if (snapshot.exists()) {
        setRoles(Object.keys(snapshot.val()));
      }
    });

    const departmentsRef = ref(database, "departments");
    get(departmentsRef).then((snapshot) => {
      if (snapshot.exists()) {
        setDepartments(Object.keys(snapshot.val()));
      }
    });
  }, []);

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
        department: selectedDepartment,
        firstName,
        lastName,
        email,
        role: selectedRole,
      });

      resetForm();
      setSuccess(true);
      setError("");
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const validatePassword = (password) => {
    return (
      password.length >= 6 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /\d/.test(password)
    );
  };

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setSelectedDepartment("");
    setSelectedRole("");
    setError("");
  };

  const closeSuccessModal = () => {
    setSuccess(false);
    setShowModal(false);
  };

  if (!showModal) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-md p-6 w-full max-w-lg shadow-lg relative">
          <button
            onClick={() => setShowModal(false)}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>

          <h2 className="text-2xl font-bold mb-6">Create User Account</h2>

          <div className="max-h-[500px] overflow-y-auto">
            <form onSubmit={handleCreateAccount}>
              <div className="mb-6 p-4 bg-gray-100 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-4">User Information</h3>
                <div className="mb-4">
                  <label className="block text-gray-700">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="block w-full mt-2 p-2 border border-gray-300 rounded-md"
                    placeholder="Enter first name"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="block w-full mt-2 p-2 border border-gray-300 rounded-md"
                    placeholder="Enter last name"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full mt-2 p-2 border border-gray-300 rounded-md"
                    placeholder="Enter email"
                    required
                  />
                </div>

                <div className="mb-4 relative">
                  <label className="block text-gray-700">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full mt-2 p-2 border border-gray-300 rounded-md"
                      placeholder="Enter password"
                      required
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
                </div>

                <div className="mb-4 relative">
                  <label className="block text-gray-700">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="block w-full mt-2 p-2 border border-gray-300 rounded-md"
                      placeholder="Re-enter password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
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
              </div>

              {error && (
                <div className="mb-4 text-red-500 text-sm">{error}</div>
              )}

              <div className="mb-6 p-4 bg-gray-100 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-4">
                  Role & Department
                </h3>
                <div className="mb-4">
                  <label className="block text-gray-700">
                    Select Department
                  </label>
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="block w-full mt-2 p-2 border border-gray-300 rounded-md"
                    required
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
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700">Select Role</label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="block w-full mt-2 p-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="" disabled>
                      Select a role
                    </option>
                    {roles.map((role) => (
                      <option key={role} value={role}>
                        {role
                          .split(" ")
                          .map(
                            (word) =>
                              word.charAt(0).toUpperCase() + word.slice(1)
                          )
                          .join(" ")}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  type="submit"
                  className={`bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 ${
                    isLoading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  disabled={isLoading}
                >
                  {isLoading ? "Creating Account..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {success && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-md p-6 w-full max-w-md shadow-lg text-center">
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
