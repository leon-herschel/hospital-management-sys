import { useState, useEffect } from 'react';
import { ref, get, set } from 'firebase/database';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { EyeIcon, EyeSlashIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { auth, database } from '../../firebase/firebase';

const AddUserModal = ({ showModal, setShowModal }) => {
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const rolesRef = ref(database, 'roles');
    get(rolesRef).then((snapshot) => {
      if (snapshot.exists()) {
        setRoles(Object.keys(snapshot.val()));
      }
    });

    const departmentsRef = ref(database, 'departments');
    get(departmentsRef).then((snapshot) => {
      if (snapshot.exists()) {
        setDepartments(Object.keys(snapshot.val()));
      }
    });
  }, []);

  const handleCreateAccount = async (e) => {
    e.preventDefault();

    if (password.length < 6 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
      setError('Password must be at least 6 characters long, contain an uppercase letter, a lowercase letter, and a number.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userId = userCredential.user.uid;

      const userRef = ref(database, `users/${userId}`);
      await set(userRef, {
        department: selectedDepartment,
        name,
        email,
        role: selectedRole
      });

      setShowModal(false);
      setError('');
      resetForm();
    } catch (error) {
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

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-800 bg-opacity-50">
      <div className="bg-white rounded-md p-6 w-full max-w-lg shadow-lg relative">
        <button
          onClick={() => setShowModal(false)}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>

        <h2 className="text-2xl font-bold mb-6">Create User Account</h2>

        {/* Added a div wrapper with scrollable styles */}
        <div className="max-h-[500px] overflow-y-auto">
          <form onSubmit={handleCreateAccount}>
            <div className="mb-6 p-4 bg-gray-100 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4">User Information</h3>
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
                    type={showPassword ? 'text' : 'password'}
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
                    {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
              </div>

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

            {error && <div className="mb-4 text-red-500 text-sm">{error}</div>}

            <div className="mb-6 p-4 bg-gray-100 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4">Role & Department</h3>
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

            <div className="flex justify-center">
              <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
                Create Account
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddUserModal;