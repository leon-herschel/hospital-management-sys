import { useState, useEffect } from 'react';
import { ref, get, set } from 'firebase/database';
import { XMarkIcon } from "@heroicons/react/24/solid";
import { database } from '../../../firebase/firebase';

const EditUserModal = ({ showModal, setShowModal, userId }) => {
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);

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

    // Fetch existing user data for editing
    if (userId) {
      const userRef = ref(database, `users/${userId}`);
      get(userRef).then((snapshot) => {
        if (snapshot.exists()) {
          const userData = snapshot.val();
          setFirstName(userData.firstName);
          setLastName(userData.lastName);
          setEmail(userData.email);
          setSelectedDepartment(userData.department);
          setSelectedRole(userData.role);
        }
      });
    }
  }, [userId]);

  const handleUpdateAccount = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
        const userRef = ref(database, `users/${userId}`);
        await set(userRef, {
            department: selectedDepartment,
            firstName,
            lastName,
            email,
            role: selectedRole
        });

        setSuccess(true); 
        setError('');
    } catch (error) {
        setError(error.message);
    } finally {
        setIsLoading(false);
    }
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

          <h2 className="text-2xl font-bold mb-6">Edit User Account</h2>

          <div className="max-h-[500px] overflow-y-auto">
            <form onSubmit={handleUpdateAccount}>
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
                    disabled
                  />
                </div>
              </div>

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
                      <option key={role} value={role}>{role.split(' ') .map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</option>
                    ))}
                  </select>
                </div>
              </div>

              {error && <div className="mb-4 text-red-500 text-sm">{error}</div>}

              <div className="flex justify-center">
                <button
                  type="submit"
                  className={`bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={isLoading}
                >
                  {isLoading ? 'Updating Account...' : 'Update Account'}
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
            <h2 className="text-xl font-bold mb-4">Account Updated Successfully</h2>
            <p className="text-gray-700 mb-6">The user account has been updated.</p>
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

export default EditUserModal;
