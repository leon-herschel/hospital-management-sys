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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
        <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl relative transform transition-all duration-200 scale-100">
          {/* Close Button */}
          <button
            onClick={() => setShowModal(false)}
            className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors duration-200 p-1 rounded-lg hover:bg-gray-100"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Add New Clinic</h2>
            <p className="text-gray-600">Fill in the details below to create a new clinic</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Clinic Name */}
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Clinic Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter clinic name"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300 bg-gray-50 focus:bg-white"
              />
            </div>

            {/* Address */}
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
                placeholder="Enter clinic address"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300 bg-gray-50 focus:bg-white"
              />
            </div>

            {/* Contact Number */}
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Contact Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="+639123456789"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300 bg-gray-50 focus:bg-white"
              />
            </div>

            {/* Type */}
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300 bg-gray-50 focus:bg-white cursor-pointer"
              >
                <option value="Primary Clinic">Primary Clinic</option>
              </select>
            </div>

            {/* Active Status */}
            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={() => setIsActive(!isActive)}
                className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700 cursor-pointer">
                Set clinic as active
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-700 hover:to-blue-800 focus:ring-4 focus:ring-blue-500/30 transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg"
              >
                Create Clinic
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl text-center transform transition-all duration-300 scale-100">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircleIcon className="h-12 w-12 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Clinic Added Successfully</h2>
            <p className="text-gray-700">The clinic has been added to the system.</p>
          </div>
        </div>
      )}
    </>
  );
};

export default AddClinicModal;