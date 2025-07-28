import { useState } from 'react';
import { ref, push, set } from 'firebase/database';
import { database } from '../../../firebase/firebase';
import { XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/solid';

const AddClinicModal = ({ showModal, setShowModal }) => {
  const [name, setName] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [type, setType] = useState('Primary Clinic');
  const [isActive, setIsActive] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newClinic = {
      name,
      addressLine,
      contactNumber,
      type,
      isActive,
    };

    try {
      const newClinicRef = push(ref(database, 'clinics'));
      await set(newClinicRef, newClinic);

      setShowSuccessModal(true); // Show success modal first

      // Reset form
      setName('');
      setAddressLine('');
      setContactNumber('');
      setType('Primary Clinic');
      setIsActive(true);

      // Delay closing the modal
      setTimeout(() => {
        setShowSuccessModal(false);
        setShowModal(false); // Close modal after showing success
      }, 2000);
    } catch (error) {
      console.error('Error adding clinic:', error);
    }
  };

  if (!showModal) return null;

  return (
    <>
      {/* Add Clinic Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-md p-6 w-full max-w-lg shadow-lg relative">
          <button
            onClick={() => setShowModal(false)}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>

          <h2 className="text-2xl font-bold mb-6">Add Clinic</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-700">Clinic Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Clinic Name"
                className="w-full mt-1 p-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-gray-700">Address</label>
              <input
                type="text"
                required
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
                placeholder="Clinic Address"
                className="w-full mt-1 p-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-gray-700">Contact Number</label>
              <input
                type="text"
                required
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="e.g. +639123456789"
                className="w-full mt-1 p-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-gray-700">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full mt-1 p-2 border border-gray-300 rounded-md"
              >
                <option value="Primary Clinic">Primary Clinic</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={isActive}
                onChange={() => setIsActive(!isActive)}
                className="h-4 w-4 text-blue-600"
              />
              <label className="text-gray-700">Active</label>
            </div>

            <div className="flex justify-center">
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                Create Clinic
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-md p-6 w-full max-w-md shadow-lg text-center">
            <CheckCircleIcon className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Clinic Added Successfully</h2>
            <p className="text-gray-700">The clinic has been added to the system.</p>
          </div>
        </div>
      )}
    </>
  );
};

export default AddClinicModal;
