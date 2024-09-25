import { useState, useEffect } from 'react';
import { database } from '../../firebase/firebase';
import { ref, set, get } from 'firebase/database';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase/firebase';
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/16/solid";

const CreateAccount = () => {
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); 
  const [showPassword, setShowPassword] = useState(false); 
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [showModal, setShowModal] = useState(false); 
  const [error, setError] = useState(''); 

  useEffect(() => {
    const rolesRef = ref(database, 'roles');
    get(rolesRef).then((snapshot) => {
      if (snapshot.exists()) {
        setRoles(Object.keys(snapshot.val()));
      } else {
        console.log("No roles found.");
      }
    });

    const departmentsRef = ref(database, 'departments');
    get(departmentsRef).then((snapshot) => {
      if (snapshot.exists()) {
        setDepartments(Object.keys(snapshot.val()));
      } else {
        console.log("No departments found.");
      }
    });
  }, []);

  const handleCreateAccount = async (e) => {
    e.preventDefault();
  
    // Custom password validation
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setError('Password must contain at least one uppercase letter.');
      return;
    }
    if (!/[a-z]/.test(password)) {
      setError('Password must contain at least one lowercase letter.');
      return;
    }
    if (!/\d/.test(password)) {
      setError('Password must contain at least one number.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
  
    try {
      // Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userId = userCredential.user.uid; 
  
      // Store in Realtime Database
      const userRef = ref(database, `users/${userId}`);
      await set(userRef, {
        department: selectedDepartment,
        name,
        email,
        role: selectedRole 
      });
  
      console.log("Account created successfully!");
      setShowModal(true); 
      setError(''); // Clear error on success
      resetForm(); 
    } catch (error) {
      console.error("Error creating account: ", error);
      setError(error.message); 
    }
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword(''); 
    setSelectedDepartment('');
    setSelectedRole('');
  };

  return (
    <div className="max-w-lg mx-auto bg-white p-8 rounded-md shadow-lg">
      <h2 className="text-2xl font-bold mb-6">Create User Account</h2>
      <form onSubmit={handleCreateAccount}>
        
        {/* User Information Card */}
        <div className="mb-6 p-4 bg-gray-100 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">User Information</h3>
          {/* Name Input */}
          <div className="mb-4">
            <label className="block text-gray-700">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="block w-full mt-2 p-2 border border-gray-300 rounded-md"
              placeholder="Enter name"
              required
            />
          </div>

          {/* Email Input */}
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

          {/* Password Input */}
          <div className="mb-4 relative">
            <label className="block text-gray-700">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`block w-full mt-2 p-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md`}
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

          {/* Confirm Password */}
          <div className="mb-4">
            <label className="block text-gray-700">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="block w-full mt-2 p-2 border border-gray-300 rounded-md"
              placeholder="Re-enter password"
              required
            />
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 text-red-500 text-sm">
            {error}
          </div>
        )}

        {/* Role & Department Card */}
        <div className="mb-6 p-4 bg-gray-100 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Role & Department</h3>
          {/* Department Dropdown */}
          <div className="mb-4">
            <label className="block text-gray-700">Select Department</label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="block w-full mt-2 p-2 border border-gray-300 rounded-md"
              required
            >
              <option value="" disabled>Select a department</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          {/* Role Dropdown */}
          <div className="mb-4">
            <label className="block text-gray-700">Select Role</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="block w-full mt-2 p-2 border border-gray-300 rounded-md"
              required
            >
              <option value="" disabled>Select a role</option>
              {roles.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-center">
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
          >
            Create Account
          </button>
        </div>
      </form>

      {/* Success Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
          <div className="bg-white rounded-md p-6">
            <h3 className="text-lg font-semibold">Success</h3>
            <p>Account created successfully.</p>
            <button
              onClick={() => setShowModal(false)}
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateAccount;
